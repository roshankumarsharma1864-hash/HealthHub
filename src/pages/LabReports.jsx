import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { labService, patientService, doctorService } from '../services/hmsServices.js';
import { Plus, Microscope, Clipboard, CheckCircle2, RefreshCw } from 'lucide-react';
import { Button, Input, Select, Textarea, Card, Badge, Modal } from '../components/UI.jsx';

export const LabReports = () => {
  const { user, isAdmin, isDoctor } = useAuth();
  const toast = useToast();

  const [reports, setReports] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);

  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  // Forms
  const [orderForm, setOrderForm] = useState({ patientId: '', doctorId: '', testName: '' });
  const [resultText, setResultText] = useState('');

  const loadData = async () => {
    try {
      const repList = await labService.getAll();
      const pList = await patientService.getAll();
      const dList = await doctorService.getAll();

      setReports(repList);
      setPatients(pList);
      setDoctors(dList);
    } catch (err) {
      toast.error('Failed to load lab records.');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOrderSubmit = async (e) => {
    e.preventDefault();
    if (!orderForm.patientId || !orderForm.testName) {
      toast.warning('Please select a patient and enter a test name.');
      return;
    }

    // Determine Doctor ID
    let docId = orderForm.doctorId;
    if (isDoctor && !docId) {
      const doc = doctors.find(d => d.email.toLowerCase() === user.email.toLowerCase());
      if (doc) docId = doc.id;
    }

    try {
      await labService.create({
        ...orderForm,
        doctorId: docId || doctors[0]?.id || 'doc-rajeshwari-101'
      }, user.id);
      toast.success(`Lab order "${orderForm.testName}" generated.`);
      setIsOrderModalOpen(false);
      setOrderForm({ patientId: '', doctorId: '', testName: '' });
      loadData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleResultSubmit = async (e) => {
    e.preventDefault();
    if (!resultText.trim()) {
      toast.warning('Please enter the laboratory diagnostic results.');
      return;
    }

    try {
      await labService.updateResult(selectedReport.id, resultText, 'Completed', user.id);
      toast.success('Lab results compiled. Diagnostic fee (₹750.00) automatically invoiced.');
      setIsResultModalOpen(false);
      setResultText('');
      loadData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const openResultModal = (rep) => {
    setSelectedReport(rep);
    setResultText(rep.resultText || '');
    setIsResultModalOpen(true);
  };

  // Group reports
  const activeOrders = reports.filter(r => r.status !== 'Completed');
  const completedReports = reports.filter(r => r.status === 'Completed');

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white font-sans">Lab Diagnostics</h1>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Order laboratory tests, enter specimen logs, and complete diagnostic files.</p>
        </div>
        {(isAdmin || isDoctor) && (
          <Button size="sm" variant="primary" icon={Plus} onClick={() => setIsOrderModalOpen(true)}>
            Order Lab Test
          </Button>
        )}
      </div>

      {/* Two Columns: Active orders and Completed diagnostics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Column 1: Active lab orders */}
        <Card title="Specimen Orders in Progress" subtitle="Awaiting diagnostic laboratory analysis">
          <div className="flex flex-col gap-4">
            {activeOrders.map(rep => (
              <div 
                key={rep.id} 
                className="p-4 border border-slate-100 dark:border-slate-750 rounded-xl flex items-center justify-between hover:shadow-premium transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-slate-50 dark:bg-slate-900 text-teal-650 rounded-lg flex items-center justify-center">
                    <Microscope className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">{rep.testName}</h4>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Patient: <span className="font-semibold text-slate-700 dark:text-slate-350">{rep.patient?.name}</span>
                    </p>
                    <p className="text-[9px] text-slate-400">Order Ref: {rep.id.substring(0, 8)}  |  Physician: Dr. {rep.doctor?.name.split('. ')[1]}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant={rep.status === 'In Progress' ? 'warning' : 'neutral'}>
                    {rep.status}
                  </Badge>
                  {(isAdmin || isDoctor) && (
                    <Button size="sm" variant="outline" onClick={() => openResultModal(rep)}>
                      Enter Results
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {activeOrders.length === 0 && (
              <div className="text-center text-slate-400 py-12 text-xs select-none">
                No active laboratory specimens pending.
              </div>
            )}
          </div>
        </Card>

        {/* Column 2: Completed Reports */}
        <Card title="Completed Laboratory Files" subtitle="Diagnostic findings finalized and logged to patients charts">
          <div className="flex flex-col gap-4">
            {completedReports.map(rep => (
              <div 
                key={rep.id} 
                className="p-4 border border-slate-100 dark:border-slate-750 rounded-xl flex flex-col gap-3 hover:shadow-premium transition-all"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 rounded-lg flex items-center justify-center">
                      <CheckCircle2 className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">{rep.testName}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Patient: <span className="font-semibold text-slate-700 dark:text-slate-350">{rep.patient?.name}</span>
                      </p>
                    </div>
                  </div>
                  <Badge variant="success">Completed</Badge>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg text-xs text-slate-650 dark:text-slate-350 font-medium">
                  {rep.resultText}
                </div>

                <div className="flex justify-between items-center text-[8.5px] text-slate-400">
                  <span>Authorized by: Dr. {rep.doctor?.name}</span>
                  <span>Date Issued: {rep.date}</span>
                </div>
              </div>
            ))}
            {completedReports.length === 0 && (
              <div className="text-center text-slate-400 py-12 text-xs select-none">
                No completed laboratory files logged.
              </div>
            )}
          </div>
        </Card>

      </div>

      {/* ORDER LAB TEST MODAL */}
      <Modal isOpen={isOrderModalOpen} onClose={() => setIsOrderModalOpen(false)} title="Order Lab Diagnostic Test">
        <form onSubmit={handleOrderSubmit} className="flex flex-col gap-4">
          <Select
            label="Select Patient"
            id="lab-pat"
            value={orderForm.patientId}
            onChange={(e) => setOrderForm({ ...orderForm, patientId: e.target.value })}
            required
            options={[
              { value: '', label: '-- Choose Patient --' },
              ...patients.map(p => ({ value: p.id, label: `${p.name} (ID: ${p.id.substring(0, 8)})` }))
            ]}
          />
          {!isDoctor && (
            <Select
              label="Assigned Doctor"
              id="lab-doc"
              value={orderForm.doctorId}
              onChange={(e) => setOrderForm({ ...orderForm, doctorId: e.target.value })}
              options={[
                { value: '', label: '-- Choose Physician --' },
                ...doctors.map(d => ({ value: d.id, label: `${d.name} (${d.specialization})` }))
              ]}
            />
          )}
          <Input
            label="Diagnostic Test Name"
            id="lab-test"
            value={orderForm.testName}
            onChange={(e) => setOrderForm({ ...orderForm, testName: e.target.value })}
            placeholder="e.g. Lipid Profile, Complete Blood Count (CBC)"
            required
          />
          <div className="flex justify-end gap-2 mt-2">
            <Button type="button" variant="secondary" onClick={() => setIsOrderModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Confirm Order</Button>
          </div>
        </form>
      </Modal>

      {/* ENTER RESULTS MODAL */}
      <Modal isOpen={isResultModalOpen} onClose={() => setIsResultModalOpen(false)} title={`Enter Specimen Results: ${selectedReport?.testName}`}>
        <form onSubmit={handleResultSubmit} className="flex flex-col gap-4">
          <p className="text-xs text-slate-400">
            Enter test observations for patient <span className="font-bold text-slate-650">{selectedReport?.patient?.name}</span>. Submitting will flag the status completed and append the diagnostic fee of ₹750.00 to their bill.
          </p>
          <Textarea
            label="Laboratory Test Observations"
            id="lab-obs"
            value={resultText}
            onChange={(e) => setResultText(e.target.value)}
            placeholder="Total Cholesterol: 195 mg/dL, HDL: 45 mg/dL..."
            required
            rows={5}
          />
          <div className="flex justify-end gap-2 mt-2">
            <Button type="button" variant="secondary" onClick={() => setIsResultModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="success">Compile & Submit Findings</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default LabReports;
