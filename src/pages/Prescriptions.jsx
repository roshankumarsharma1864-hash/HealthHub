import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { prescriptionService, patientService, pharmacyService, doctorService } from '../services/hmsServices.js';
import { Plus, Download, Clipboard, FileText, CheckCircle, Trash, PlusCircle } from 'lucide-react';
import { Button, Input, Select, Textarea, Card, Badge, Modal } from '../components/UI.jsx';
import { pdfGenerator } from '../utils/pdfGenerator.js';

export const Prescriptions = () => {
  const { user, isAdmin, isDoctor, isPharmacist } = useAuth();
  const toast = useToast();

  const [prescriptions, setPrescriptions] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [medicines, setMedicines] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [patientId, setPatientId] = useState('');
  const [notes, setNotes] = useState('');
  const [presMeds, setPresMeds] = useState([{ medId: '', dosage: '1 tablet daily', duration: '7 days' }]);

  const loadData = async () => {
    try {
      const prList = await prescriptionService.getAll();
      const pList = await patientService.getAll();
      const dList = await doctorService.getAll();
      const mList = await pharmacyService.getAll();

      setPrescriptions(prList);
      setPatients(pList);
      setDoctors(dList);
      setMedicines(mList);
    } catch (err) {
      toast.error('Failed to load prescriptions ledger.');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleMedChange = (idx, field, val) => {
    const updated = [...presMeds];
    updated[idx][field] = val;
    setPresMeds(updated);
  };

  const addMedRow = () => {
    setPresMeds([...presMeds, { medId: medicines[0]?.id || '', dosage: '1 tablet daily', duration: '7 days' }]);
  };

  const removeMedRow = (idx) => {
    if (presMeds.length === 1) return;
    setPresMeds(presMeds.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!patientId) {
      toast.warning('Please select a patient profile.');
      return;
    }
    if (presMeds.some(m => !m.medId)) {
      toast.warning('Please select a medication product for each row.');
      return;
    }

    // Determine Doctor ID: If doctor role, use doctor's profile. Else, default first doctor.
    let docId = doctors[0]?.id;
    if (isDoctor) {
      const matchedDoc = doctors.find(d => d.email.toLowerCase() === user.email.toLowerCase());
      if (matchedDoc) docId = matchedDoc.id;
    }

    const prescriptionData = {
      patientId,
      doctorId: docId || 'doc-sarah-jenkins-101',
      medicines: presMeds,
      notes
    };

    try {
      await prescriptionService.create(prescriptionData, user.id);
      toast.success('Prescription slip saved.');
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const openCreateModal = () => {
    setPatientId(patients[0]?.id || '');
    setNotes('');
    setPresMeds([{ medId: medicines[0]?.id || '', dosage: '1 tablet daily', duration: '7 days' }]);
    setIsModalOpen(true);
  };

  // Dispense medications
  const handleDispense = async (id) => {
    try {
      await prescriptionService.dispense(id, user.id);
      toast.success('Prescription dispensed. Pharmacy stock updated and invoice bill generated.');
      loadData();
    } catch (err) {
      toast.error(err.message || 'Dispensing check failed.');
    }
  };

  const handleDownloadPDF = (pres) => {
    const pat = patients.find(p => p.id === pres.patientId);
    const doc = doctors.find(d => d.id === pres.doctorId);
    pdfGenerator.generatePrescription(pres, pat, doc, {
      hospitalName: 'HEALTH HUB',
      hospitalAddress: '750 Health Plaza Blvd, Boston, MA 02111',
      hospitalPhone: '+1 (555) 100-2000',
      hospitalEmail: 'pharmacy@healthhub.com'
    });
    toast.success('Prescription slip PDF downloaded.');
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">Prescriptions Registry</h1>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Issue prescription slips, fulfill medication lists, and deduct inventory stocks.</p>
        </div>
        {(isAdmin || isDoctor) && (
          <Button size="sm" variant="primary" icon={Plus} onClick={openCreateModal}>
            Write Prescription
          </Button>
        )}
      </div>

      {/* Grid of Prescription Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {prescriptions.map((pres) => (
          <Card 
            key={pres.id}
            className="flex flex-col justify-between"
            headerActions={
              <div className="flex items-center gap-2">
                <Badge variant={pres.status === 'Dispensed' ? 'success' : 'warning'}>
                  {pres.status}
                </Badge>
                <button
                  onClick={() => handleDownloadPDF(pres)}
                  className="text-slate-400 hover:text-teal-600 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  title="Download PDF Rx"
                >
                  <Download className="w-4.5 h-4.5" />
                </button>
              </div>
            }
          >
            {/* Patients and Doctor Details */}
            <div className="border-b border-slate-100 dark:border-slate-700 pb-3 mb-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Patient File</h3>
              <p className="text-sm font-bold text-slate-800 dark:text-white mt-1">{pres.patient?.name}</p>
              <p className="text-[10px] text-slate-400">ID Ref: {pres.patientId.substring(0, 8)}</p>

              <div className="flex justify-between items-center text-[10px] text-slate-400 mt-2.5">
                <span>By: <span className="font-bold text-teal-600">Dr. {pres.doctor?.name}</span></span>
                <span>Date: {pres.date}</span>
              </div>
            </div>

            {/* Medicines List */}
            <div className="flex-grow flex flex-col gap-2 bg-slate-50 dark:bg-slate-900 p-3 rounded-xl mb-4">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Rx Medication details</span>
              {pres.medicines.map((m, idx) => (
                <div key={idx} className="flex justify-between items-start text-xs border-b border-slate-100 dark:border-slate-750 last:border-0 pb-1.5 last:pb-0">
                  <div>
                    <p className="font-bold text-slate-700 dark:text-slate-350">{m.detail?.name || 'Medication product'}</p>
                    <p className="text-[9px] text-slate-400 italic mt-0.5">{m.dosage}</p>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500">{m.duration}</span>
                </div>
              ))}
            </div>

            {pres.notes && (
              <div className="text-[10px] text-slate-450 italic mb-4 leading-normal">
                Notes: {pres.notes}
              </div>
            )}

            {/* Fulfill action */}
            {(isAdmin || isPharmacist) && pres.status !== 'Dispensed' && (
              <Button
                variant="success"
                size="sm"
                className="w-full py-2.5"
                icon={CheckCircle}
                onClick={() => handleDispense(pres.id)}
              >
                Fulfill & Dispense Meds
              </Button>
            )}
          </Card>
        ))}
        {prescriptions.length === 0 && (
          <div className="col-span-full text-center text-slate-400 py-12 text-sm">
            No clinical prescriptions catalogued.
          </div>
        )}
      </div>

      {/* WRITE PRESCRIPTION MODAL */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Write Clinical Prescription Slip" maxWidth="max-w-2xl">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <Select
            label="Select Patient"
            id="pres-pat"
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            required
            options={[
              { value: '', label: '-- Choose Patient --' },
              ...patients.map(p => ({ value: p.id, label: `${p.name} (ID: ${p.id.substring(0, 8)})` }))
            ]}
          />

          {/* Medicines Selection lines */}
          <div className="border-t border-slate-100 dark:border-slate-700/65 pt-4">
            <div className="flex justify-between items-center mb-3 select-none">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Medication Formulations</span>
              <button
                type="button"
                onClick={addMedRow}
                className="text-xs text-teal-600 hover:text-teal-700 font-bold flex items-center gap-1 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" /> Add Medication
              </button>
            </div>

            <div className="flex flex-col gap-3 max-h-48 overflow-y-auto pr-1">
              {presMeds.map((row, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <Select
                    value={row.medId}
                    onChange={(e) => handleMedChange(idx, 'medId', e.target.value)}
                    required
                    className="flex-grow"
                    options={[
                      { value: '', label: '-- Choose Medicine --' },
                      ...medicines.map(m => ({ value: m.id, label: `${m.name} (Stock: ${m.stock} left)` }))
                    ]}
                  />
                  <Input
                    placeholder="Dosage (e.g. 1 capsule 3x daily)"
                    value={row.dosage}
                    onChange={(e) => handleMedChange(idx, 'dosage', e.target.value)}
                    required
                    className="w-44"
                  />
                  <Input
                    placeholder="Duration (e.g. 7 days)"
                    value={row.duration}
                    onChange={(e) => handleMedChange(idx, 'duration', e.target.value)}
                    required
                    className="w-28"
                  />
                  <button
                    type="button"
                    onClick={() => removeMedRow(idx)}
                    disabled={presMeds.length === 1}
                    className="text-slate-400 hover:text-red-500 p-2 disabled:opacity-35 cursor-pointer"
                  >
                    <Trash className="w-4.5 h-4.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <Textarea
            label="Clinician Instruction Notes"
            id="pres-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Advice patient on medicine intervals, water consumption guidelines, or review dates..."
          />

          <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-700/60 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Confirm Prescription</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default Prescriptions;
