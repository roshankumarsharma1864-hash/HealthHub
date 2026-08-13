import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { billingService, patientService } from '../services/hmsServices.js';
import { Plus, Download, Edit2, Trash2, CreditCard, DollarSign, PlusCircle, Trash, RefreshCw } from 'lucide-react';
import { Button, Input, Select, Card, Badge, Modal } from '../components/UI.jsx';
import { pdfGenerator } from '../utils/pdfGenerator.js';

export const Billing = () => {
  const { user, isAdmin, isReceptionist } = useAuth();
  const toast = useToast();

  const [bills, setBills] = useState([]);
  const [patients, setPatients] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('CREATE');
  const [editingBillId, setEditingBillId] = useState(null);

  // Form states
  const [patientId, setPatientId] = useState('');
  const [status, setStatus] = useState('Unpaid');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [discount, setDiscount] = useState(0);
  const [items, setItems] = useState([{ desc: 'General Consultation', qty: 1, cost: 100.00 }]);

  const loadBilling = async () => {
    try {
      const bList = await billingService.getAll();
      const pList = await patientService.getAll();
      setBills(bList);
      setPatients(pList);
    } catch (err) {
      toast.error('Failed to load ledger records.');
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
        toast.success('Invoiced billing statement generated.');
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
    setPaymentMode('Cash');
    setDiscount(0);
    setItems([{ desc: 'Specialist consultation fee', qty: 1, cost: 150.00 }]);
    setIsModalOpen(true);
  };

  const handlePayBill = async (id, mode) => {
    try {
      await billingService.pay(id, mode, user.id);
      toast.success('Bill invoice successfully marked as PAID.');
      loadBilling();
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

  const handleDownloadPDF = (bill) => {
    const pat = patients.find(p => p.id === bill.patientId);
    pdfGenerator.generateInvoice(bill, pat, {
      hospitalName: 'Careflow Medical Center',
      hospitalAddress: '750 Health Plaza Blvd, Boston, MA 02111',
      hospitalPhone: '+1 (555) 100-2000',
      hospitalEmail: 'billing@careflow.com'
    });
    toast.success('Invoice PDF download triggered.');
  };

  const subtotal = calculateSubtotal();
  const tax = Math.round(subtotal * 0.05 * 100) / 100;
  const grandTotal = Math.max(0, subtotal + tax - Number(discount));

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">Billing & Invoices</h1>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Generate receipts, manage VAT taxes, and download itemized invoice PDFs.</p>
        </div>
        {(isAdmin || isReceptionist) && (
          <Button size="sm" variant="primary" icon={Plus} onClick={openCreateModal}>
            Generate Invoice
          </Button>
        )}
      </div>

      {/* Invoices table list */}
      <Card className="p-0 overflow-hidden bg-white border border-slate-100 dark:border-slate-700">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 font-bold text-slate-400 uppercase">
              <tr>
                <th className="px-6 py-4">Invoice ID</th>
                <th className="px-6 py-4">Patient Details</th>
                <th className="px-6 py-4">Issue Date</th>
                <th className="px-6 py-4">Amount Due</th>
                <th className="px-6 py-4">Method</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {bills.map((bill) => (
                <tr key={bill.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-750/30 transition-colors">
                  <td className="px-6 py-4 font-mono font-bold text-slate-400">{bill.id.substring(0, 8)}</td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-800 dark:text-slate-200">{bill.patient?.name}</p>
                    <p className="text-[10px] text-slate-400">ID: {bill.patientId.substring(0, 8)}</p>
                  </td>
                  <td className="px-6 py-4 text-slate-500">{bill.date}</td>
                  <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200">${bill.total.toFixed(2)}</td>
                  <td className="px-6 py-4 text-slate-500">{bill.paymentMode}</td>
                  <td className="px-6 py-4">
                    <Badge variant={
                      bill.status === 'Paid' ? 'success' : 
                      bill.status === 'Partial' ? 'warning' : 'danger'
                    }>
                      {bill.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => handleDownloadPDF(bill)}
                        className="text-slate-400 hover:text-teal-600 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                        title="Download PDF"
                      >
                        <Download className="w-4.5 h-4.5" />
                      </button>
                      
                      {/* Mark Paid Shortcut */}
                      {(isAdmin || isReceptionist) && bill.status !== 'Paid' && (
                        <button
                          onClick={() => handlePayBill(bill.id, bill.paymentMode)}
                          className="text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 p-1.5 rounded-lg transition-colors font-semibold"
                          title="Mark as Paid"
                        >
                          Mark Paid
                        </button>
                      )}
                      
                      {isAdmin && (
                        <button
                          onClick={() => handleDelete(bill.id)}
                          className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                          title="Delete Invoice"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {bills.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center text-slate-400 py-12 select-none">
                    No billing statements found in the database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* CREATE BILLING MODAL */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Issue Patient Invoice Statement" maxWidth="max-w-2xl">
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
                ...patients.map(p => ({ value: p.id, label: `${p.name} (ID: ${p.id.substring(0, 8)})` }))
              ]}
            />
            <div className="grid grid-cols-2 gap-2">
              <Select
                label="Payment Method"
                id="bill-mode"
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                options={['Cash', 'Card', 'Insurance'].map(m => ({ value: m, label: m }))}
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

          {/* Dynamic Item Rows */}
          <div className="border-t border-slate-100 dark:border-slate-700/60 pt-4 flex flex-col gap-3">
            <div className="flex justify-between items-center select-none">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Itemized Line Charges</span>
              <button
                type="button"
                onClick={addItemRow}
                className="text-xs text-teal-600 hover:text-teal-700 font-bold flex items-center gap-1 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" /> Add Item Line
              </button>
            </div>

            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
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
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Cost"
                    value={item.cost}
                    onChange={(e) => handleItemChange(idx, 'cost', e.target.value)}
                    required
                    className="w-28"
                  />
                  <button
                    type="button"
                    onClick={() => removeItemRow(idx)}
                    disabled={items.length === 1}
                    className="text-slate-400 hover:text-red-500 p-2 disabled:opacity-30 cursor-pointer"
                  >
                    <Trash className="w-4.5 h-4.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Summaries Block */}
          <div className="border-t border-slate-100 dark:border-slate-700/60 pt-4 flex flex-col items-end gap-2 text-xs text-slate-500">
            <div>
              Subtotal: <span className="font-bold text-slate-700 dark:text-slate-350 ml-2">${subtotal.toFixed(2)}</span>
            </div>
            <div>
              VAT (5%): <span className="font-bold text-slate-700 dark:text-slate-350 ml-2">${tax.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>Apply Discount ($):</span>
              <input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
                className="w-24 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 text-right px-2 py-1 rounded outline-none"
              />
            </div>
            <div className="text-sm font-bold text-teal-600 dark:text-teal-400 mt-2">
              Grand Total: <span className="text-lg ml-2">${grandTotal.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-700/60 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Generate Statement</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default Billing;
