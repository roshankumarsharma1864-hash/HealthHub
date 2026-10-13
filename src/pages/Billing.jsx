import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { billingService, patientService } from '../services/hmsServices.js';
import { 
  Plus, 
  Download, 
  Trash2, 
  CreditCard, 
  IndianRupee, 
  PlusCircle, 
  Trash, 
  AlertTriangle, 
  CheckCircle, 
  QrCode, 
  FileText, 
  Printer, 
  Search, 
  Copy, 
  Sparkles,
  ShieldCheck,
  Check,
  ArrowRight
} from 'lucide-react';
import { Button, Input, Select, Card, Badge, Modal } from '../components/UI.jsx';
import { pdfGenerator } from '../utils/pdfGenerator.js';
import { formatINR, amountInWords, INDIAN_HOSPITAL_DEFAULTS, INDIAN_PAYMENT_METHODS } from '../utils/currency.js';
import QRCode from 'qrcode';

// Quick preset items common in Indian hospitals
const QUICK_CHARGE_PRESETS = [
  { desc: 'OPD General Consultation Fee', qty: 1, cost: 500.00 },
  { desc: 'Senior Specialist Consultation (Cardiology/Neuro)', qty: 1, cost: 1200.00 },
  { desc: 'General Ward Day Charges', qty: 1, cost: 1500.00 },
  { desc: 'ICU Critical Care Day Charges', qty: 1, cost: 6500.00 },
  { desc: 'Digital High-Resolution X-Ray', qty: 1, cost: 1800.00 },
  { desc: 'Comprehensive Pathology & Lipid Panel', qty: 1, cost: 750.00 },
  { desc: 'Physiotherapy & Rehab Session', qty: 1, cost: 750.00 }
];

export const Billing = () => {
  const { user, isAdmin, isReceptionist } = useAuth();
  const toast = useToast();

  const [bills, setBills] = useState([]);
  const [patients, setPatients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterMode, setFilterMode] = useState('All');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('CREATE');
  const [editingBillId, setEditingBillId] = useState(null);

  // UPI QR Modal State
  const [upiModalBill, setUpiModalBill] = useState(null);
  const [upiQrDataUrl, setUpiQrDataUrl] = useState('');
  const [isSimulatingPayment, setIsSimulatingPayment] = useState(false);
  const [simulatedSuccess, setSimulatedSuccess] = useState(false);
  const [simulatedUtr, setSimulatedUtr] = useState('');

  // Tax Invoice View Modal State
  const [viewInvoiceBill, setViewInvoiceBill] = useState(null);
  const [invoiceQrUrl, setInvoiceQrUrl] = useState('');

  // Form states
  const [patientId, setPatientId] = useState('');
  const [status, setStatus] = useState('Unpaid');
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [discount, setDiscount] = useState(0);
  const [items, setItems] = useState([{ desc: 'OPD General Consultation Fee', qty: 1, cost: 500.00 }]);

  const loadBilling = async () => {
    try {
      const bList = await billingService.getAll();
      const pList = await patientService.getAll();
      setBills(bList);
      setPatients(pList);
    } catch (err) {
      toast.error('Failed to load billing ledger records.');
    }
  };

  useEffect(() => {
    loadBilling();
  }, []);

  // Items rows handlers
  const handleItemChange = (idx, field, val) => {
    const updated = [...items];
    updated[idx][field] = field === 'desc' ? val : Number(val);
    setItems(updated);
  };

  const addItemRow = () => {
    setItems([...items, { desc: '', qty: 1, cost: 0.00 }]);
  };

  const addPresetRow = (preset) => {
    setItems([...items, { ...preset }]);
    toast.info(`Added preset: "${preset.desc}" (₹${preset.cost})`);
  };

  const removeItemRow = (idx) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== idx));
  };

  // Subtotal helper
  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + (item.qty * item.cost), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!patientId) {
      toast.warning('Please select a patient.');
      return;
    }

    const billData = {
      patientId,
      items,
      discount: Number(discount),
      status,
      paymentMode
    };

    try {
      if (modalMode === 'CREATE') {
        await billingService.create(billData, user.id);
        toast.success('Invoiced billing statement generated successfully.');
      } else {
        await billingService.update(editingBillId, billData, user.id);
        toast.success('Invoiced statement modified.');
      }
      setIsModalOpen(false);
      loadBilling();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const openCreateModal = () => {
    setModalMode('CREATE');
    setPatientId(patients[0]?.id || '');
    setStatus('Unpaid');
    setPaymentMode('UPI');
    setDiscount(0);
    setItems([{ desc: 'Senior Specialist Consultation', qty: 1, cost: 1200.00 }]);
    setIsModalOpen(true);
  };

  const handlePayBill = async (id, mode) => {
    try {
      await billingService.pay(id, mode, user.id);
      toast.success(`Bill invoice successfully marked as PAID via ${mode}.`);
      loadBilling();
      if (upiModalBill && upiModalBill.id === id) {
        setUpiModalBill(null);
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this billing invoice record from the system registry?')) {
      try {
        await billingService.delete(id, user.id);
        toast.success('Invoice deleted.');
        loadBilling();
      } catch (err) {
        toast.error(err.message);
      }
    }
  };

  // Open UPI QR Modal
  const openUpiModal = async (bill) => {
    setUpiModalBill(bill);
    setIsSimulatingPayment(false);
    setSimulatedSuccess(false);
    setSimulatedUtr('');

    try {
      const upiUrl = `upi://pay?pa=${INDIAN_HOSPITAL_DEFAULTS.upiVpa}&pn=HealthHub+Hospital&am=${bill.total.toFixed(2)}&cu=INR&tn=Invoice_${bill.id.substring(0, 8)}`;
      const url = await QRCode.toDataURL(upiUrl, {
        width: 280,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      });
      setUpiQrDataUrl(url);
    } catch (err) {
      console.error('Failed to generate UPI QR:', err);
    }
  };

  // Simulate Instant UPI Payment
  const handleSimulatePayment = () => {
    setIsSimulatingPayment(true);
    setTimeout(async () => {
      const mockUtr = '4' + Math.floor(10000000000 + Math.random() * 90000000000);
      setSimulatedUtr(mockUtr);
      setIsSimulatingPayment(false);
      setSimulatedSuccess(true);
      await billingService.pay(upiModalBill.id, 'UPI (Instant Webhook)', user.id);
      toast.success(`UPI Payment verified! UTR: ${mockUtr}`);
      loadBilling();
    }, 1200);
  };

  // Open Full Tax Invoice Preview Modal
  const openTaxInvoiceModal = async (bill) => {
    setViewInvoiceBill(bill);
    try {
      const upiUrl = `upi://pay?pa=${INDIAN_HOSPITAL_DEFAULTS.upiVpa}&pn=HealthHub+Hospital&am=${bill.total.toFixed(2)}&cu=INR&tn=Invoice_${bill.id.substring(0, 8)}`;
      const url = await QRCode.toDataURL(upiUrl, { width: 140, margin: 1 });
      setInvoiceQrUrl(url);
    } catch (e) {
      console.warn(e);
    }
  };

  const handleDownloadPDF = async (bill) => {
    const pat = patients.find(p => p.id === bill.patientId);
    await pdfGenerator.generateInvoice(bill, pat, {
      hospitalName: INDIAN_HOSPITAL_DEFAULTS.hospitalName,
      hospitalAddress: INDIAN_HOSPITAL_DEFAULTS.hospitalAddress,
      hospitalPhone: INDIAN_HOSPITAL_DEFAULTS.hospitalPhone,
      hospitalEmail: INDIAN_HOSPITAL_DEFAULTS.hospitalEmail,
      gstin: INDIAN_HOSPITAL_DEFAULTS.gstin
    });
    toast.success('Official GST Tax Invoice PDF downloaded.');
  };

  const copyVpa = () => {
    navigator.clipboard.writeText(INDIAN_HOSPITAL_DEFAULTS.upiVpa);
    toast.success('Hospital UPI VPA copied to clipboard!');
  };

  const subtotal = calculateSubtotal();
  const cgst = Math.round(subtotal * 0.025 * 100) / 100;
  const sgst = Math.round(subtotal * 0.025 * 100) / 100;
  const grandTotal = Math.max(0, subtotal + cgst + sgst - Number(discount));

  // Calculations for billing dashboard
  const revenueTotal = bills.filter(b => b.status === 'Paid').reduce((sum, b) => sum + b.total, 0);
  const paidCount = bills.filter(b => b.status === 'Paid').length;
  const pendingCount = bills.filter(b => b.status === 'Partial').length;
  const overdueCount = bills.filter(b => b.status === 'Unpaid').length;
  const totalGstCollected = bills.filter(b => b.status === 'Paid').reduce((sum, b) => sum + (b.tax || (b.total * 0.05)), 0);

  // Filtered bills
  const filteredBills = bills.filter(bill => {
    const matchesSearch = 
      bill.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bill.patient?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bill.paymentMode?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'All' || bill.status === filterStatus;
    const matchesMode = filterMode === 'All' || bill.paymentMode?.toLowerCase().includes(filterMode.toLowerCase());
    return matchesSearch && matchesStatus && matchesMode;
  });

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Title & Actions Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 select-none">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">Billing & Payments</h1>
            <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> INR (₹) / GST Enabled
            </span>
          </div>
          <p className="text-slate-400 text-xs mt-1">
            Super Speciality Hospital Billing Ledger • UPI QR Payments • GSTIN Tax Invoices • TPA Insurance Desk
          </p>
        </div>
        <div className="flex items-center gap-2">
          {(isAdmin || isReceptionist) && (
            <Button size="sm" variant="primary" icon={Plus} onClick={openCreateModal}>
              Generate Tax Invoice
            </Button>
          )}
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 select-none">
        <Card className="p-4 flex flex-col justify-between hover:shadow-premium duration-150 transition-all border-l-4 border-l-primary-500">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Collected Revenue</span>
            <div className="w-7 h-7 rounded-lg bg-primary-50 dark:bg-primary-950/40 text-primary-600 flex items-center justify-center">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-extrabold text-slate-800 dark:text-white mt-2.5">
            {formatINR(revenueTotal, false)}
          </span>
          <span className="text-[10px] text-emerald-500 font-bold mt-1">Settled Accounts</span>
        </Card>

        <Card className="p-4 flex flex-col justify-between hover:shadow-premium duration-150 transition-all border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Paid Invoices</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2.5">
            {paidCount} Invoices
          </span>
          <span className="text-[10px] text-slate-400 mt-1">100% Cleared</span>
        </Card>

        <Card className="p-4 flex flex-col justify-between hover:shadow-premium duration-150 transition-all border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Pending / Partial</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-extrabold text-amber-500 mt-2.5">
            {pendingCount} Bills
          </span>
          <span className="text-[10px] text-slate-400 mt-1">TPA / Part-paid</span>
        </Card>

        <Card className="p-4 flex flex-col justify-between hover:shadow-premium duration-150 transition-all border-l-4 border-l-red-500">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Overdue Ledger</span>
            <div className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-500 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-extrabold text-red-500 mt-2.5">
            {overdueCount} Unpaid
          </span>
          <span className="text-[10px] text-slate-400 mt-1">Requires follow-up</span>
        </Card>

        <Card className="p-4 flex flex-col justify-between hover:shadow-premium duration-150 transition-all border-l-4 border-l-teal-500 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">GST Collected</span>
            <div className="w-7 h-7 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-extrabold text-teal-600 dark:text-teal-400 mt-2.5">
            {formatINR(totalGstCollected, false)}
          </span>
          <span className="text-[10px] text-slate-400 mt-1">CGST 2.5% + SGST 2.5%</span>
        </Card>
      </div>

      {/* Filter and Search Toolbar */}
      <Card className="p-3.5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 w-full md:w-80">
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search patient, invoice ID, or method..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-primary-500 text-slate-700 dark:text-slate-200"
              />
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-semibold text-[11px]">Status:</span>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-200 outline-none"
              >
                <option value="All">All Statuses</option>
                <option value="Paid">Paid</option>
                <option value="Partial">Partial</option>
                <option value="Unpaid">Unpaid</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-semibold text-[11px]">Mode:</span>
              <select
                value={filterMode}
                onChange={(e) => setFilterMode(e.target.value)}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-200 outline-none"
              >
                <option value="All">All Payment Modes</option>
                <option value="UPI">UPI / QR Code</option>
                <option value="Cash">Cash (INR)</option>
                <option value="Card">Card</option>
                <option value="Insurance">TPA Insurance</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Invoices table list */}
      <Card title="Patient Billing & Tax Invoices Ledger" subtitle="Itemized hospital receipts with UPI QR settlement and GST compliance" className="p-0 overflow-hidden bg-white border border-slate-100 dark:border-slate-700">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 font-bold text-slate-400 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-5 py-4">Invoice No</th>
                <th className="px-5 py-4">Patient & UHID</th>
                <th className="px-5 py-4">Issue Date</th>
                <th className="px-5 py-4">Amount Due (₹)</th>
                <th className="px-5 py-4">Payment Mode</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-center">Settlement & Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-705/50">
              {filteredBills.map((bill) => (
                <tr key={bill.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-750/30 transition-colors">
                  <td className="px-5 py-4 font-mono font-bold text-primary-600 dark:text-primary-400">
                    INV-{bill.id.substring(0, 8).toUpperCase()}
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-bold text-slate-850 dark:text-slate-200">{bill.patient?.name || 'Walk-in Patient'}</p>
                    <p className="text-[10px] text-slate-400 font-mono">UHID: {bill.patientId ? bill.patientId.substring(0, 10).toUpperCase() : 'N/A'}</p>
                  </td>
                  <td className="px-5 py-4 text-slate-500">{bill.date}</td>
                  <td className="px-5 py-4">
                    <span className="font-black text-slate-900 dark:text-white text-sm">
                      {formatINR(bill.total)}
                    </span>
                    <span className="block text-[10px] text-slate-400">Incl. 5% GST</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-[11px]">
                      {bill.paymentMode?.includes('UPI') ? (
                        <QrCode className="w-3.5 h-3.5 text-teal-600" />
                      ) : bill.paymentMode?.includes('Card') ? (
                        <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                      ) : (
                        <IndianRupee className="w-3.5 h-3.5 text-amber-600" />
                      )}
                      {bill.paymentMode}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <Badge variant={
                      bill.status === 'Paid' ? 'success' : 
                      bill.status === 'Partial' ? 'warning' : 'danger'
                    }>
                      {bill.status}
                    </Badge>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {/* UPI QR Pay Shortcut */}
                      {bill.status !== 'Paid' && (
                        <button
                          onClick={() => openUpiModal(bill)}
                          className="bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-800 hover:bg-teal-100 px-2.5 py-1 rounded-lg transition-all font-bold text-[10px] flex items-center gap-1 shadow-sm"
                          title="Scan UPI QR Code to Settle Bill"
                        >
                          <QrCode className="w-3.5 h-3.5" /> UPI Pay
                        </button>
                      )}

                      {/* View Tax Invoice Button */}
                      <button
                        onClick={() => openTaxInvoiceModal(bill)}
                        className="text-slate-500 hover:text-primary-600 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        title="View Tax Invoice Memo"
                      >
                        <FileText className="w-4 h-4" />
                      </button>

                      {/* Download PDF */}
                      <button
                        onClick={() => handleDownloadPDF(bill)}
                        className="text-slate-500 hover:text-primary-600 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        title="Download GST Invoice PDF"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      
                      {/* Mark Paid Shortcut */}
                      {(isAdmin || isReceptionist) && bill.status !== 'Paid' && (
                        <button
                          onClick={() => handlePayBill(bill.id, bill.paymentMode || 'Cash')}
                          className="text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950/20 px-2 py-1 border border-primary-200 dark:border-primary-900 rounded-lg transition-colors font-bold text-[10px]"
                          title="Mark as Paid"
                        >
                          Mark Paid
                        </button>
                      )}
                      
                      {isAdmin && (
                        <button
                          onClick={() => handleDelete(bill.id)}
                          className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                          title="Delete Invoice"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredBills.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center text-slate-400 py-12 select-none">
                    No billing statements match the current search or filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* DYNAMIC UPI QR PAYMENT MODAL */}
      <Modal 
        isOpen={!!upiModalBill} 
        onClose={() => setUpiModalBill(null)} 
        title="UPI Instant QR Payment Counter" 
        maxWidth="max-w-md"
      >
        {upiModalBill && (
          <div className="flex flex-col items-center gap-4 text-center">
            {/* Header / VPA details */}
            <div className="w-full bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-750">
              <p className="text-[11px] text-slate-400 font-semibold">Payee Account</p>
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-white">
                {INDIAN_HOSPITAL_DEFAULTS.hospitalName}
              </h3>
              <div className="mt-1 flex items-center justify-center gap-2">
                <span className="font-mono text-xs font-bold text-teal-600 bg-teal-50 dark:bg-teal-950/40 px-2 py-0.5 rounded-md border border-teal-200 dark:border-teal-800">
                  {INDIAN_HOSPITAL_DEFAULTS.upiVpa}
                </span>
                <button 
                  onClick={copyVpa} 
                  className="text-slate-400 hover:text-teal-600 p-1 transition-colors"
                  title="Copy VPA"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Bill Summary */}
            <div>
              <p className="text-xs text-slate-400">
                Patient: <span className="font-bold text-slate-700 dark:text-slate-200">{upiModalBill.patient?.name}</span> • Inv: <span className="font-mono text-slate-500 font-semibold">INV-{upiModalBill.id.substring(0, 8)}</span>
              </p>
              <div className="text-3xl font-black text-slate-900 dark:text-white mt-1">
                {formatINR(upiModalBill.total)}
              </div>
              <p className="text-[10px] text-slate-400 italic mt-0.5 max-w-xs">
                {amountInWords(upiModalBill.total)}
              </p>
            </div>

            {/* Dynamic QR Code Card */}
            <div className="p-3 bg-white rounded-2xl border-2 border-dashed border-teal-400 shadow-md flex flex-col items-center">
              {upiQrDataUrl ? (
                <img 
                  src={upiQrDataUrl} 
                  alt="Scan to pay via UPI" 
                  className="w-52 h-52 object-contain"
                />
              ) : (
                <div className="w-52 h-52 flex items-center justify-center text-slate-400 text-xs">
                  Generating QR...
                </div>
              )}
              <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded mt-2 uppercase tracking-wide">
                Scan with any UPI App
              </span>
            </div>

            {/* Supported UPI Apps Pills */}
            <div className="flex items-center justify-center gap-2 flex-wrap">
              {['Google Pay', 'PhonePe', 'Paytm', 'BHIM UPI', 'Cred'].map((app) => (
                <span key={app} className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                  {app}
                </span>
              ))}
            </div>

            {/* Simulated verification state */}
            {simulatedSuccess ? (
              <div className="w-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 p-3 rounded-2xl flex flex-col items-center gap-1.5 animate-fade-in">
                <div className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                  <Check className="w-5 h-5 stroke-[3]" />
                </div>
                <h4 className="font-black text-emerald-800 dark:text-emerald-200 text-sm">Payment Verified Successfully!</h4>
                <p className="text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-300">
                  Bank Ref UTR: {simulatedUtr}
                </p>
                <Button size="sm" variant="primary" className="mt-1" onClick={() => setUpiModalBill(null)}>
                  Close Counter
                </Button>
              </div>
            ) : (
              <div className="w-full flex flex-col gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Button
                  variant="primary"
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                  icon={CheckCircle}
                  loading={isSimulatingPayment}
                  onClick={handleSimulatePayment}
                >
                  Verify & Confirm Payment Received
                </Button>
                <div className="flex gap-2">
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handlePayBill(upiModalBill.id, 'Cash')}
                  >
                    Paid in Cash
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => setUpiModalBill(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* FULL TAX INVOICE PREVIEW MODAL */}
      <Modal
        isOpen={!!viewInvoiceBill}
        onClose={() => setViewInvoiceBill(null)}
        title="Official GST Tax Invoice Memo"
        maxWidth="max-w-3xl"
      >
        {viewInvoiceBill && (
          <div className="flex flex-col gap-5 text-slate-800 dark:text-slate-100 print:text-black">
            {/* Invoice Header */}
            <div className="border-b-2 border-primary-600 pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-black text-primary-700 dark:text-primary-400">
                    {INDIAN_HOSPITAL_DEFAULTS.hospitalName}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {INDIAN_HOSPITAL_DEFAULTS.hospitalSubTitle} • NABH Accredited
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {INDIAN_HOSPITAL_DEFAULTS.hospitalAddress}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-x-3 text-[10px] text-slate-500 font-semibold">
                    <span>GSTIN: <strong className="text-slate-700 dark:text-slate-300">{INDIAN_HOSPITAL_DEFAULTS.gstin}</strong></span>
                    <span>Hospital Reg: <strong>{INDIAN_HOSPITAL_DEFAULTS.hospRegNo}</strong></span>
                    <span>SAC Code: <strong>{INDIAN_HOSPITAL_DEFAULTS.sacCode}</strong></span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 font-black text-xs px-3 py-1 rounded-lg border border-primary-200 dark:border-primary-800 uppercase tracking-wider block">
                    TAX INVOICE
                  </span>
                  <p className="font-mono font-bold text-xs mt-2">
                    INV-{viewInvoiceBill.id.substring(0, 8).toUpperCase()}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Date: {viewInvoiceBill.date}</p>
                </div>
              </div>
            </div>

            {/* Patient & Invoice Meta Grid */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-100 dark:border-slate-700">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Bill To Patient</span>
                <p className="font-black text-slate-800 dark:text-white mt-0.5 text-sm">{viewInvoiceBill.patient?.name || 'Walk-in Patient'}</p>
                <p className="text-slate-500 mt-0.5">UHID: <strong className="font-mono">{viewInvoiceBill.patientId ? viewInvoiceBill.patientId.substring(0, 10).toUpperCase() : 'N/A'}</strong></p>
                <p className="text-slate-500">Phone: {viewInvoiceBill.patient?.phone || 'N/A'}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Payment Specifications</span>
                <p className="mt-0.5">Mode: <strong className="text-slate-700 dark:text-slate-200">{viewInvoiceBill.paymentMode}</strong></p>
                <p className="mt-0.5">Status: <strong className={viewInvoiceBill.status === 'Paid' ? 'text-emerald-600' : 'text-red-500'}>{viewInvoiceBill.status}</strong></p>
                <p className="mt-0.5 text-[11px] text-slate-400">Place of Supply: Karnataka (State Code 29)</p>
              </div>
            </div>

            {/* Line items table */}
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Service / Procedure</th>
                  <th className="py-2.5 px-3">SAC Code</th>
                  <th className="py-2.5 px-3 text-center">Qty</th>
                  <th className="py-2.5 px-3 text-right">Rate (₹)</th>
                  <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {(viewInvoiceBill.items || []).map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-2.5 px-3 text-slate-400 font-mono">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">{item.desc}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-400">999312</td>
                    <td className="py-2.5 px-3 text-center">{item.qty}</td>
                    <td className="py-2.5 px-3 text-right font-mono">{formatINR(item.cost)}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                      {formatINR(item.qty * item.cost)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Summary & Tax breakdown block */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-3 border-t border-slate-200 dark:border-slate-700">
              {/* Left: QR and UPI info */}
              <div className="flex items-center gap-3">
                {invoiceQrUrl && (
                  <img src={invoiceQrUrl} alt="UPI QR" className="w-20 h-20 border rounded-lg p-1 bg-white" />
                )}
                <div className="text-[11px] text-slate-500">
                  <p className="font-bold text-slate-700 dark:text-slate-200">UPI Instant Billing VPA</p>
                  <p className="font-mono text-teal-600 font-semibold">{INDIAN_HOSPITAL_DEFAULTS.upiVpa}</p>
                  <p className="text-[10px] text-slate-400 mt-1">Scan via GPay/PhonePe to settle.</p>
                </div>
              </div>

              {/* Right: Calculations */}
              <div className="w-full sm:w-64 flex flex-col gap-1.5 text-xs text-slate-600 dark:text-slate-300 font-semibold">
                <div className="flex justify-between">
                  <span>Subtotal Amount:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-100">
                    {formatINR(viewInvoiceBill.subtotal || viewInvoiceBill.items?.reduce((s, it) => s + (it.qty * it.cost), 0))}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>CGST (2.5%):</span>
                  <span className="font-mono">{formatINR(Math.round((viewInvoiceBill.subtotal || viewInvoiceBill.total * 0.95) * 0.025))}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>SGST (2.5%):</span>
                  <span className="font-mono">{formatINR(Math.round((viewInvoiceBill.subtotal || viewInvoiceBill.total * 0.95) * 0.025))}</span>
                </div>
                {viewInvoiceBill.discount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount Applied:</span>
                    <span className="font-mono">- {formatINR(viewInvoiceBill.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-sm font-black text-primary-600 dark:text-primary-400 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span>Net Payable:</span>
                  <span className="text-lg font-black">{formatINR(viewInvoiceBill.total)}</span>
                </div>
              </div>
            </div>

            {/* Amount in words Banner */}
            <div className="bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700 text-xs">
              <span className="font-bold text-slate-400 uppercase tracking-wide text-[10px] block">Amount in Words</span>
              <p className="font-bold text-slate-700 dark:text-slate-200 mt-0.5 italic">
                {amountInWords(viewInvoiceBill.total)}
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button variant="secondary" icon={Printer} onClick={() => window.print()}>
                Print Receipt
              </Button>
              <Button variant="primary" icon={Download} onClick={() => handleDownloadPDF(viewInvoiceBill)}>
                Download PDF
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* CREATE / EDIT BILLING MODAL */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Issue Patient GST Tax Invoice" maxWidth="max-w-2xl">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Select Patient"
              id="bill-pat"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              required
              options={[
                { value: '', label: '-- Choose Patient --' },
                ...patients.map(p => ({ value: p.id, label: `${p.name} (UHID: ${p.id.substring(0, 8).toUpperCase()})` }))
              ]}
            />
            <div className="grid grid-cols-2 gap-2">
              <Select
                label="Payment Method"
                id="bill-mode"
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                options={INDIAN_PAYMENT_METHODS.map(m => ({ value: m.id, label: m.label }))}
              />
              <Select
                label="Payment Status"
                id="bill-status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                options={['Unpaid', 'Paid', 'Partial'].map(s => ({ value: s, label: s }))}
              />
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Quick Hospital Service Presets (Click to append line)
            </span>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_CHARGE_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => addPresetRow(preset)}
                  className="bg-white dark:bg-slate-700 hover:border-primary-400 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-[10px] font-semibold px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                >
                  <PlusCircle className="w-3 h-3 text-primary-500" />
                  {preset.desc.split('(')[0].trim()} ({formatINR(preset.cost, false)})
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Item Rows */}
          <div className="border-t border-slate-100 dark:border-slate-700/60 pt-4 flex flex-col gap-3">
            <div className="flex justify-between items-center select-none">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Itemized Line Charges (₹)</span>
              <button
                type="button"
                onClick={addItemRow}
                className="text-xs text-primary-600 hover:text-primary-700 font-bold flex items-center gap-1 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" /> Add Item Line
              </button>
            </div>

            <div className="flex flex-col gap-2 max-h-52 overflow-y-auto pr-1">
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2.5">
                  <Input
                    placeholder="Description (e.g. Ward Room stay)"
                    value={item.desc}
                    onChange={(e) => handleItemChange(idx, 'desc', e.target.value)}
                    required
                    className="flex-grow"
                  />
                  <Input
                    type="number"
                    min="1"
                    placeholder="Qty"
                    value={item.qty}
                    onChange={(e) => handleItemChange(idx, 'qty', e.target.value)}
                    required
                    className="w-20"
                  />
                  <div className="relative w-32">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Cost"
                      value={item.cost}
                      onChange={(e) => handleItemChange(idx, 'cost', e.target.value)}
                      required
                      className="w-full pl-6 pr-2 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-primary-500 text-slate-800 dark:text-white"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItemRow(idx)}
                    disabled={items.length === 1}
                    className="text-slate-400 hover:text-red-500 p-2 disabled:opacity-30 cursor-pointer transition-colors"
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Summaries Block with GST */}
          <div className="border-t border-slate-100 dark:border-slate-700/60 pt-4 flex flex-col items-end gap-1.5 text-xs text-slate-500 font-semibold">
            <div>
              Subtotal: <span className="font-bold text-slate-750 dark:text-slate-200 ml-2 font-mono">{formatINR(subtotal)}</span>
            </div>
            <div>
              CGST (2.5%): <span className="font-bold text-slate-750 dark:text-slate-200 ml-2 font-mono">{formatINR(cgst)}</span>
            </div>
            <div>
              SGST (2.5%): <span className="font-bold text-slate-750 dark:text-slate-200 ml-2 font-mono">{formatINR(sgst)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>Apply Discount (₹):</span>
              <input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
                className="w-24 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-right px-2 py-1 rounded outline-none font-mono"
              />
            </div>
            <div className="text-sm font-bold text-primary-600 dark:text-primary-400 mt-2">
              Grand Total: <span className="text-xl ml-2 font-black">{formatINR(grandTotal)}</span>
            </div>
            <p className="text-[10px] text-slate-400 italic max-w-sm text-right mt-0.5">
              {amountInWords(grandTotal)}
            </p>
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-700/60 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Generate Tax Invoice</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Billing;
