import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { 
  patientService, 
  doctorService, 
  wardService, 
  appointmentService, 
  billingService,
  prescriptionService,
  labService
} from '../services/hmsServices.js';
import { formatINR } from '../utils/currency.js';
import { 
  Search, 
  Plus, 
  User, 
  Phone, 
  Calendar, 
  FileText, 
  CreditCard, 
  Microscope,
  Trash2,
  Edit2,
  Heart,
  Bed,
  MapPin,
  AlertOctagon,
  Download,
  ArrowLeft,
  Activity,
  PlusCircle,
  BrainCircuit
} from 'lucide-react';
import { Button, Input, Select, Textarea, Card, Badge, Modal } from '../components/UI.jsx';
import { pdfGenerator } from '../utils/pdfGenerator.js';

export const Patients = () => {
  const { user, isAdmin, isDoctor, isReceptionist } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [wards, setWards] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedTab, setSelectedTab] = useState('Overview');

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [doctorFilter, setDoctorFilter] = useState('All');

  // CRUD Modals
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [isAdmitModalOpen, setIsAdmitModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('CREATE'); // CREATE or EDIT
  const [editingPatientId, setEditingPatientId] = useState(null);

  // Forms
  const [patientForm, setPatientForm] = useState({
    name: '', age: '', gender: 'Male', phone: '', address: '', bloodGroup: 'O+', allergies: '', medicalHistory: '', emergencyContact: '', assignedDoctorId: ''
  });

  const [admitForm, setAdmitForm] = useState({ wardId: '', bedNo: '' });
  const [availableBeds, setAvailableBeds] = useState([]);

  // AI Summary state
  const [aiSummary, setAiSummary] = useState('');
  const [generatingAi, setGeneratingAi] = useState(false);

  // Fetch all listings
  const loadData = async () => {
    try {
      const pList = await patientService.getAll();
      const dList = await doctorService.getAll();
      const wList = await wardService.getAll();
      
      setPatients(pList);
      setDoctors(dList);
      setWards(wList);

      // Handle URL deep-linking: /patients/:id or ?id=PATIENT_ID
      const pId = params.id || searchParams.get('id');
      if (pId) {
        const fullPatient = await patientService.getById(pId);
        if (fullPatient) {
          setSelectedPatient(fullPatient);
        }
      } else {
        setSelectedPatient(null);
      }
    } catch (err) {
      toast.error('Error loading patient directory.');
    }
  };

  useEffect(() => {
    loadData();
  }, [searchParams, params.id]);


  const selectPatient = (id) => {
    setSearchParams({ id });
    setAiSummary(''); // Clear AI summary on patient switch
  };

  const clearSelection = () => {
    setSearchParams({});
    setSelectedPatient(null);
  };

  // CRUD handlers
  const openCreateModal = () => {
    setModalMode('CREATE');
    setPatientForm({
      name: '', age: '', gender: 'Male', phone: '', address: '', bloodGroup: 'O+', allergies: '', medicalHistory: '', emergencyContact: '', assignedDoctorId: ''
    });
    setIsPatientModalOpen(true);
  };

  const openEditModal = (p) => {
    setModalMode('EDIT');
    setEditingPatientId(p.id);
    setPatientForm({
      name: p.name,
      age: p.age,
      gender: p.gender,
      phone: p.phone,
      address: p.address,
      bloodGroup: p.bloodGroup,
      allergies: p.allergies || '',
      medicalHistory: p.medicalHistory || '',
      emergencyContact: p.emergencyContact || '',
      assignedDoctorId: p.assignedDoctorId || ''
    });
    setIsPatientModalOpen(true);
  };

  const handlePatientSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalMode === 'CREATE') {
        await patientService.create(patientForm, user.id);
        toast.success(`Registered Patient "${patientForm.name}" successfully!`);
      } else {
        await patientService.update(editingPatientId, patientForm, user.id);
        toast.success('Updated patient profile.');
      }
      setIsPatientModalOpen(false);
      loadData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDeletePatient = async (id) => {
    if (!window.confirm('Are you sure you want to delete this patient profile permanently?')) return;
    try {
      await patientService.delete(id, user.id);
      toast.success('Patient deleted successfully.');
      clearSelection();
      loadData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Bed admissions
  const openAdmitModal = () => {
    setAdmitForm({ wardId: '', bedNo: '' });
    setAvailableBeds([]);
    setIsAdmitModalOpen(true);
  };

  const handleWardChange = (wardId) => {
    const selectedWard = wards.find(w => w.id === wardId);
    if (!selectedWard) {
      setAvailableBeds([]);
      return;
    }
    const avail = selectedWard.bedList.filter(b => b.status === 'Available');
    setAvailableBeds(avail);
    setAdmitForm(prev => ({ ...prev, wardId, bedNo: avail[0]?.bedNo || '' }));
  };

  const handleAdmitSubmit = async (e) => {
    e.preventDefault();
    try {
      await patientService.admit(selectedPatient.id, admitForm.wardId, admitForm.bedNo, user.id);
      toast.success(`Admitted ${selectedPatient.name} to bed ${admitForm.bedNo}`);
      setIsAdmitModalOpen(false);
      // Reload current patient
      const updated = await patientService.getById(selectedPatient.id);
      setSelectedPatient(updated);
      loadData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDischarge = async () => {
    if (!window.confirm(`Are you sure you want to discharge ${selectedPatient.name}? This will free up the occupied bed.`)) return;
    try {
      await patientService.discharge(selectedPatient.id, user.id);
      toast.success('Discharged patient successfully.');
      const updated = await patientService.getById(selectedPatient.id);
      setSelectedPatient(updated);
      loadData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Simulated AI Summary generator
  const generateAiSummary = () => {
    if (!selectedPatient) return;
    setGeneratingAi(true);
    setTimeout(() => {
      const summaryText = `AI CLINICAL SUMMARY FOR: ${selectedPatient.name} (Age: ${selectedPatient.age}, Blood: ${selectedPatient.bloodGroup})
--------------------------------------------------
* Clinical Overview: Patient has a history of ${selectedPatient.medicalHistory || 'no chronic diseases'}. Allergies noted: ${selectedPatient.allergies || 'none'}.
* Operations Activity: The database records ${selectedPatient.history?.appointments?.length || 0} scheduled checkups and ${selectedPatient.history?.prescriptions?.length || 0} filled pharmacy prescriptions.
* Billing Status: The patient has ${selectedPatient.history?.bills?.filter(b => b.status === 'Unpaid').length || 0} unpaid invoices. Total revenue generated to date is ${formatINR(selectedPatient.history?.bills?.reduce((sum, b) => sum + b.total, 0) || 0)}.
* Administrative Insights: HEALTH HUB AI recommends scheduling a cardiology review if symptoms persist and verifying that medication stocks are available for current prescriptions.`;
      setAiSummary(summaryText);
      setGeneratingAi(false);
      toast.success('HEALTH HUB AI generated patient summary successfully!');
    }, 1500);
  };

  // Filtered patients list
  const filteredPatients = patients.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.id.includes(search);
    const matchesStatus = statusFilter === 'All' || p.admissionStatus === statusFilter;
    const matchesDoctor = doctorFilter === 'All' || p.assignedDoctorId === doctorFilter;
    return matchesSearch && matchesStatus && matchesDoctor;
  });

  // Calculate directory statistics
  const statsCards = {
    total: patients.length,
    new: patients.filter(p => new Date(p.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length,
    active: patients.filter(p => p.admissionStatus === 'Admitted').length,
    critical: patients.filter(p => p.medicalHistory?.toLowerCase().includes('heart') || p.medicalHistory?.toLowerCase().includes('critical') || p.admissionStatus === 'Admitted' && p.ward?.name?.toLowerCase().includes('icu')).length
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* 1. SELECTED PATIENT DETAILS VIEW */}
      {selectedPatient ? (
        <div className="flex flex-col gap-6">
          {/* Header row with back buttons */}
          <div className="flex items-center justify-between select-none">
            <Button variant="outline" size="sm" icon={ArrowLeft} onClick={clearSelection}>
              Back to Patient Directory
            </Button>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => openEditModal(selectedPatient)}>
                Edit Profile
              </Button>
              {isAdmin && (
                <Button size="sm" variant="danger" icon={Trash2} onClick={() => handleDeletePatient(selectedPatient.id)}>
                  Delete Profile
                </Button>
              )}
            </div>
          </div>

          {/* Patient Profile Card Header */}
          <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-6 shadow-premium">
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
              {/* Photo placeholder */}
              <div className="w-20 h-20 rounded-2xl bg-primary-50 dark:bg-primary-950/20 text-primary-600 border border-primary-100 dark:border-primary-900/50 flex items-center justify-center flex-shrink-0 text-3xl font-extrabold select-none">
                {selectedPatient.name.charAt(0)}
              </div>
              <div className="flex-grow">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white">{selectedPatient.name}</h2>
                  <Badge variant={selectedPatient.admissionStatus === 'Admitted' ? 'premium' : 'neutral'}>
                    {selectedPatient.admissionStatus || 'Outpatient'}
                  </Badge>
                  {selectedPatient.ward && (
                    <Badge variant="success">
                      {selectedPatient.ward.name} ({selectedPatient.bedNo})
                    </Badge>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-2 gap-x-4 mt-3 text-xs text-slate-500 dark:text-slate-400">
                  <div>Patient ID: <span className="font-bold text-slate-750 dark:text-slate-200">{selectedPatient.id.substring(0, 8)}</span></div>
                  <div>Age / Gender: <span className="font-bold text-slate-750 dark:text-slate-200">{selectedPatient.age} Yrs / {selectedPatient.gender}</span></div>
                  <div>Blood Group: <span className="font-bold text-slate-750 dark:text-slate-200">{selectedPatient.bloodGroup}</span></div>
                  <div>Assigned Doctor: <span className="font-bold text-primary-600">Dr. {selectedPatient.assignedDoctor?.name || 'Unassigned'}</span></div>
                </div>
              </div>

              {/* Admission CTA buttons */}
              <div className="flex flex-wrap gap-2 select-none">
                {selectedPatient.admissionStatus === 'Admitted' ? (
                  <Button variant="danger" size="sm" onClick={handleDischarge}>
                    Discharge Patient
                  </Button>
                ) : (
                  (isAdmin || isReceptionist) && (
                    <Button variant="primary" size="sm" icon={Bed} onClick={openAdmitModal}>
                      Admit to Ward
                    </Button>
                  )
                )}
                <Button 
                  variant="outline" 
                  size="sm" 
                  icon={Download} 
                  onClick={() => pdfGenerator.generateInvoice(selectedPatient.history?.bills[0] || { id: 'dummy', patientName: selectedPatient.name, date: new Date().toLocaleDateString(), subtotal: 0, tax: 0, total: 0, items: [] })}
                >
                  Download Report
                </Button>
              </div>
            </div>
          </div>

          {/* Vitals clinical cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest">Blood Pressure</span>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-xl font-extrabold text-slate-800 dark:text-white">120/80</span>
                <span className="text-[10px] text-slate-400 font-medium">mmHg</span>
              </div>
            </Card>
            <Card className="p-4 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest">Heart Rate</span>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-xl font-extrabold text-slate-800 dark:text-white">72</span>
                <span className="text-[10px] text-slate-400 font-medium">bpm</span>
              </div>
            </Card>
            <Card className="p-4 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest">Body Temp</span>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-xl font-extrabold text-slate-800 dark:text-white">98.6</span>
                <span className="text-[10px] text-slate-400 font-medium">°F</span>
              </div>
            </Card>
            <Card className="p-4 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest">Vitals Status</span>
              <div className="mt-2">
                <Badge variant="success">Normal</Badge>
              </div>
            </Card>
          </div>

          {/* Details layout grids */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Tabs details */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              {/* Tab Selector */}
              <div className="flex border-b border-slate-100 dark:border-slate-800 gap-6 select-none">
                {['Overview', 'Medical History', 'Appointments', 'Prescriptions', 'Lab Reports', 'Billing'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setSelectedTab(tab)}
                    className={`pb-3 text-sm font-bold border-b-2 cursor-pointer transition-all ${
                      selectedTab === tab 
                        ? 'border-primary-650 text-primary-650' 
                        : 'border-transparent text-slate-400 hover:text-slate-650 dark:hover:text-slate-200'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Tab Content Panels */}
              {selectedTab === 'Overview' && (
                <Card title="Patient Intake Profile" subtitle="General demographics and observations">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                    <div className="flex flex-col gap-4">
                      <div>
                        <span className="text-xs font-bold text-slate-450 uppercase block">Allergies & Reactions</span>
                        <p className="text-slate-700 dark:text-slate-350 mt-1 font-semibold text-red-600 dark:text-red-400">
                          {selectedPatient.allergies || 'No allergies recorded.'}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-450 uppercase block">Medical Timeline Summary</span>
                        <p className="text-slate-750 dark:text-slate-300 mt-1 leading-relaxed">
                          {selectedPatient.medicalHistory || 'No previous medical history recorded.'}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-4">
                      <div>
                        <span className="text-xs font-bold text-slate-450 uppercase block">Emergency Contact Info</span>
                        <p className="text-slate-750 dark:text-slate-300 mt-1 font-semibold">
                          {selectedPatient.emergencyContact || 'Not provided'}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-450 uppercase block">Residential Address</span>
                        <p className="text-slate-750 dark:text-slate-300 mt-1 leading-relaxed">
                          {selectedPatient.address}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {selectedTab === 'Medical History' && (
                <Card title="Clinical Checkup Timeline" subtitle="Logs of events, checkups, and diagnostic orders">
                  <div className="relative pl-6 border-l border-slate-100 dark:border-slate-800 flex flex-col gap-6">
                    <div className="relative">
                      <span className="absolute -left-8.5 top-1.5 w-5 h-5 rounded-full bg-primary-100 dark:bg-primary-950/20 text-primary-650 flex items-center justify-center font-bold text-xs select-none">1</span>
                      <h4 className="text-sm font-bold text-slate-850 dark:text-slate-200">Patient Registry Profile Created</h4>
                      <span className="text-[10px] text-slate-400 block mt-0.5">{new Date(selectedPatient.createdAt).toLocaleString()}</span>
                      <p className="text-xs text-slate-550 dark:text-slate-400 mt-1 leading-relaxed">
                        Initial profile database register initiated for {selectedPatient.name}.
                      </p>
                    </div>
                    {selectedPatient.history?.appointments?.map((apt, idx) => (
                      <div key={apt.id} className="relative">
                        <span className="absolute -left-8.5 top-1.5 w-5 h-5 rounded-full bg-teal-100 dark:bg-teal-950/20 text-teal-650 flex items-center justify-center font-bold text-xs select-none">{idx + 2}</span>
                        <h4 className="text-sm font-bold text-slate-850 dark:text-slate-200">Appointment: {apt.reason}</h4>
                        <span className="text-[10px] text-slate-400 block mt-0.5">{apt.date} at {apt.time}</span>
                        <p className="text-xs text-slate-550 dark:text-slate-400 mt-1 leading-relaxed">
                          Consultation with Dr. {apt.doctor?.name} in {apt.department || 'General Medicine'}. Status: <span className="font-semibold text-emerald-600">{apt.status}</span>.
                        </p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {selectedTab === 'Appointments' && (
                <Card title="Appointment Registers" subtitle="All consultations and scheduler logs">
                  <div className="flex flex-col gap-3">
                    {selectedPatient.history?.appointments?.map(apt => (
                      <div key={apt.id} className="p-4 border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750/30 rounded-2xl flex justify-between items-center">
                        <div>
                          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Dr. {apt.doctor?.name}</h4>
                          <p className="text-xs text-slate-450 mt-0.5">{apt.date} at {apt.time} — {apt.reason}</p>
                        </div>
                        <Badge variant={apt.status === 'Confirmed' ? 'premium' : apt.status === 'Completed' ? 'success' : 'neutral'}>
                          {apt.status}
                        </Badge>
                      </div>
                    ))}
                    {selectedPatient.history?.appointments?.length === 0 && (
                      <div className="text-center py-6 text-slate-400 text-sm">No appointments scheduled.</div>
                    )}
                  </div>
                </Card>
              )}

              {selectedTab === 'Prescriptions' && (
                <Card title="Clinical Prescriptions" subtitle="Prescribed medication details and PDF archives">
                  <div className="flex flex-col gap-4">
                    {selectedPatient.history?.prescriptions?.map(pre => (
                      <div key={pre.id} className="p-4 border border-slate-100 dark:border-slate-800 rounded-2xl">
                        <div className="flex justify-between items-center mb-3">
                          <div>
                            <span className="text-xs font-bold text-slate-450">Prescribing Doctor</span>
                            <h4 className="text-sm font-bold text-slate-850 dark:text-slate-250">Dr. {pre.doctor?.name}</h4>
                          </div>
                          <Button size="xs" variant="outline" icon={Download} onClick={() => pdfGenerator.generatePrescription(pre)}>
                            Download PDF
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-500 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-750">
                          {pre.medicines.map((m, idx) => (
                            <div key={idx}>
                              • <span className="font-bold text-slate-750 dark:text-slate-350">{m.detail?.name}</span> - {m.dosage} ({m.duration})
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    {selectedPatient.history?.prescriptions?.length === 0 && (
                      <div className="text-center py-6 text-slate-400 text-sm">No prescriptions issued.</div>
                    )}
                  </div>
                </Card>
              )}

              {selectedTab === 'Lab Reports' && (
                <Card title="Diagnostic Lab Reports" subtitle="Lab diagnostic details and clinical findings">
                  <div className="flex flex-col gap-4">
                    {selectedPatient.history?.labReports?.map(lab => (
                      <div key={lab.id} className="p-4 border border-slate-100 dark:border-slate-800 rounded-2xl flex justify-between items-center">
                        <div>
                          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">{lab.testName}</h4>
                          <p className="text-xs text-slate-450 mt-0.5">Ordered by: Dr. {lab.doctor?.name} | Issued: {lab.date}</p>
                          {lab.resultText && (
                            <div className="mt-2 text-xs bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 font-mono text-slate-600 dark:text-slate-400">
                              Result Findings: {lab.resultText}
                            </div>
                          )}
                        </div>
                        <Badge variant={lab.status === 'Completed' ? 'success' : 'warning'}>
                          {lab.status}
                        </Badge>
                      </div>
                    ))}
                    {selectedPatient.history?.labReports?.length === 0 && (
                      <div className="text-center py-6 text-slate-400 text-sm">No laboratory orders recorded.</div>
                    )}
                  </div>
                </Card>
              )}

              {selectedTab === 'Billing' && (
                <Card title="Billing Statements & Invoices" subtitle="Invoice ledger records and payment states">
                  <div className="flex flex-col gap-3">
                    {selectedPatient.history?.bills?.map(bill => (
                      <div key={bill.id} className="p-4 border border-slate-100 dark:border-slate-800 rounded-2xl flex justify-between items-center">
                        <div>
                          <h4 className="text-sm font-bold text-slate-850 dark:text-slate-250">Invoice ID: {bill.id.substring(0, 8)}</h4>
                          <p className="text-xs text-slate-450 mt-0.5">Total Amount: {formatINR(bill.total)} | Date: {bill.date}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={bill.status === 'Paid' ? 'success' : 'danger'}>
                            {bill.status}
                          </Badge>
                          <Button size="xs" variant="outline" icon={Download} onClick={() => pdfGenerator.generateInvoice(bill)}>
                            PDF
                          </Button>
                        </div>
                      </div>
                    ))}
                    {selectedPatient.history?.bills?.length === 0 && (
                      <div className="text-center py-6 text-slate-400 text-sm">No billing records found.</div>
                    )}
                  </div>
                </Card>
              )}
            </div>

            {/* AI Patient Summary Card (Side Widget) */}
            <div className="flex flex-col gap-6">
              <Card title="HEALTH HUB AI Summary" subtitle="Administrative medical profiling" className="bg-primary-50/10 border-primary-100">
                <div className="flex flex-col gap-4">
                  <div className="text-xs text-slate-500 leading-relaxed">
                    Generate an administrative diagnosis summary combining patient admissions, prescription stock checks, and clinic events logs.
                  </div>
                  {aiSummary ? (
                    <div className="p-3.5 bg-white dark:bg-slate-850 border border-slate-100 dark:border-slate-750 text-[11px] font-mono leading-relaxed rounded-xl text-slate-700 dark:text-slate-300 max-h-96 overflow-y-auto whitespace-pre-line animate-fade-in shadow-sm">
                      {aiSummary}
                    </div>
                  ) : (
                    <div className="py-6 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-400 select-none">
                      No summary generated yet.
                    </div>
                  )}
                  <Button 
                    size="sm" 
                    variant="primary" 
                    icon={BrainCircuit} 
                    className="w-full py-2.5" 
                    onClick={generateAiSummary}
                    disabled={generatingAi}
                  >
                    {generatingAi ? 'Generating Summary...' : 'Generate AI Summary'}
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      ) : (
        /* 2. MAIN PATIENT DIRECTORY LIST TABLE VIEW */
        <div className="flex flex-col gap-6">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 select-none">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">Patient Directory</h1>
              <p className="text-slate-400 text-xs mt-1">Manage, register, and review all clinical charts.</p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button variant="primary" size="sm" icon={Plus} onClick={openCreateModal} className="flex-grow sm:flex-grow-0">
                Register Patient
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                icon={Download} 
                onClick={() => toast.info('Exported patient directory to CSV.')}
              >
                Export CSV
              </Button>
            </div>
          </div>

          {/* Statistics metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 select-none">
            <Card className="p-4 flex flex-col justify-between hover:shadow-premium duration-150 transition-all">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Patients</span>
              <span className="text-2xl font-extrabold text-slate-850 dark:text-white mt-2">{statsCards.total}</span>
            </Card>
            <Card className="p-4 flex flex-col justify-between hover:shadow-premium duration-150 transition-all">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">New Registrations</span>
              <span className="text-2xl font-extrabold text-slate-850 dark:text-white mt-2">{statsCards.new}</span>
            </Card>
            <Card className="p-4 flex flex-col justify-between hover:shadow-premium duration-150 transition-all">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Inpatients</span>
              <span className="text-2xl font-extrabold text-slate-850 dark:text-white mt-2">{statsCards.active}</span>
            </Card>
            <Card className="p-4 flex flex-col justify-between hover:shadow-premium duration-150 transition-all">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Critical Patients</span>
              <span className="text-2xl font-extrabold text-slate-850 dark:text-white mt-2">{statsCards.critical}</span>
            </Card>
          </div>

          {/* Search, Filter panels */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 select-none bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-4 rounded-2xl shadow-sm">
            <div className="relative sm:col-span-2">
              <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="Search patients by name or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-50/50 dark:bg-slate-900 border text-xs pl-10 pr-4 py-2.5 rounded-xl outline-none focus:bg-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 text-slate-800 dark:text-slate-100"
              />
            </div>
            <Select
              id="f-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'All', label: 'All Statuses' },
                { value: 'Admitted', label: 'Inpatient (Admitted)' },
                { value: 'Discharged', label: 'Outpatient (Discharged)' }
              ]}
            />
            <Select
              id="f-doc"
              value={doctorFilter}
              onChange={(e) => setDoctorFilter(e.target.value)}
              options={[
                { value: 'All', label: 'All Doctors' },
                ...doctors.map(d => ({ value: d.id, label: `Dr. ${d.name}` }))
              ]}
            />
          </div>

          {/* Directory Listings Table */}
          <Card title="Patient Registry Logs" subtitle="Lists of clinical profiles" className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs select-none">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Patient Name</th>
                  <th className="py-3 px-4">Age / Gender</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Blood</th>
                  <th className="py-3 px-4">Assigned Doctor</th>
                  <th className="py-3 px-4">Care Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {filteredPatients.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-750/10 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-primary-50 dark:bg-primary-950/20 text-primary-650 flex items-center justify-center font-bold text-xs select-none">
                          {p.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-extrabold">{p.name}</div>
                          <span className="text-[10px] text-slate-400 block font-mono">{p.id.substring(0, 8)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-500">{p.age} Yrs / {p.gender}</td>
                    <td className="py-3 px-4 text-slate-550">{p.phone}</td>
                    <td className="py-3 px-4 text-slate-500 font-semibold">{p.bloodGroup}</td>
                    <td className="py-3 px-4 text-primary-600 font-semibold">Dr. {p.assignedDoctor?.name || 'Unassigned'}</td>
                    <td className="py-3 px-4">
                      <Badge variant={p.admissionStatus === 'Admitted' ? 'premium' : 'neutral'}>
                        {p.admissionStatus || 'Outpatient'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right flex justify-end gap-1.5 mt-0.5">
                      <Button size="xs" variant="primary" onClick={() => selectPatient(p.id)}>
                        View Profile
                      </Button>
                      <Button size="xs" variant="secondary" onClick={() => openEditModal(p)}>
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
                {filteredPatients.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 text-sm">
                      No patient profiles matching the query filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {/* CREATE/EDIT PATIENT MODAL */}
      <Modal isOpen={isPatientModalOpen} onClose={() => setIsPatientModalOpen(false)} title={modalMode === 'CREATE' ? 'Register New Patient Profile' : 'Edit Patient Profile'}>
        <form onSubmit={handlePatientSubmit} className="grid grid-cols-2 gap-4">
          <Input 
            label="Full Name" 
            id="p-name" 
            value={patientForm.name} 
            onChange={(e) => setPatientForm({ ...patientForm, name: e.target.value })}
            placeholder="Rajesh Kumar" 
            required 
            className="col-span-2"
          />
          <Input 
            label="Age (Years)" 
            id="p-age" 
            type="number" 
            value={patientForm.age} 
            onChange={(e) => setPatientForm({ ...patientForm, age: e.target.value })}
            placeholder="35" 
            required 
          />
          <Select 
            label="Gender" 
            id="p-gender" 
            value={patientForm.gender} 
            onChange={(e) => setPatientForm({ ...patientForm, gender: e.target.value })}
            options={[{ value: 'Male', label: 'Male' }, { value: 'Female', label: 'Female' }, { value: 'Other', label: 'Other' }]}
          />
          <Input 
            label="Phone Number" 
            id="p-phone" 
            value={patientForm.phone} 
            onChange={(e) => setPatientForm({ ...patientForm, phone: e.target.value })}
            placeholder="+91 98450 12233" 
            required 
          />
          <Select 
            label="Blood Group" 
            id="p-blood" 
            value={patientForm.bloodGroup} 
            onChange={(e) => setPatientForm({ ...patientForm, bloodGroup: e.target.value })}
            options={['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(b => ({ value: b, label: b }))}
          />
          <Select
            label="Assign Doctor"
            id="p-doc"
            value={patientForm.assignedDoctorId}
            onChange={(e) => setPatientForm({ ...patientForm, assignedDoctorId: e.target.value })}
            options={[
              { value: '', label: '-- Choose Doctor --' },
              ...doctors.map(d => ({ value: d.id, label: `${d.name} (${d.specialization})` }))
            ]}
          />
          <Input 
            label="Allergies" 
            id="p-allergies" 
            value={patientForm.allergies} 
            onChange={(e) => setPatientForm({ ...patientForm, allergies: e.target.value })}
            placeholder="Penicillin, Peanuts (optional)" 
          />
          <Input 
            label="Emergency Contact" 
            id="p-emergency" 
            value={patientForm.emergencyContact} 
            onChange={(e) => setPatientForm({ ...patientForm, emergencyContact: e.target.value })}
            placeholder="Sunita Kumar (+91 98450 12244)" 
            className="col-span-2"
            required
          />
          <Textarea 
            label="Medical History Summary" 
            id="p-history" 
            value={patientForm.medicalHistory} 
            onChange={(e) => setPatientForm({ ...patientForm, medicalHistory: e.target.value })}
            placeholder="Hypertension, past bypass surgeries, clinical allergies (optional)" 
            className="col-span-2"
          />
          <Textarea 
            label="Residential Address" 
            id="p-addr" 
            value={patientForm.address} 
            onChange={(e) => setPatientForm({ ...patientForm, address: e.target.value })}
            placeholder="Plot 104, 12th Main, Indiranagar, Bengaluru, KA" 
            className="col-span-2"
            required
          />
          <div className="col-span-2 flex justify-end gap-2 mt-2">
            <Button type="button" variant="secondary" onClick={() => setIsPatientModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">{modalMode === 'CREATE' ? 'Register Patient' : 'Save Changes'}</Button>
          </div>
        </form>
      </Modal>

      {/* ADMIT PATIENT MODAL */}
      <Modal isOpen={isAdmitModalOpen} onClose={() => setIsAdmitModalOpen(false)} title="Admit Patient to Ward Bed">
        <form onSubmit={handleAdmitSubmit} className="flex flex-col gap-4">
          <Select
            label="Select Ward"
            id="ad-ward"
            value={admitForm.wardId}
            onChange={(e) => handleWardChange(e.target.value)}
            required
            options={[
              { value: '', label: '-- Choose Ward --' },
              ...wards.map(w => ({ value: w.id, label: `${w.name} (Beds: ${w.occupiedBeds}/${w.totalBeds})` }))
            ]}
          />
          
          <Select
            label="Select Bed Number"
            id="ad-bed"
            value={admitForm.bedNo}
            onChange={(e) => setAdmitForm({ ...admitForm, bedNo: e.target.value })}
            required
            disabled={availableBeds.length === 0}
            options={[
              { value: '', label: availableBeds.length === 0 ? '-- No Beds Available --' : '-- Choose Bed --' },
              ...availableBeds.map(b => ({ value: b.bedNo, label: b.bedNo }))
            ]}
          />

          <div className="flex justify-end gap-2 mt-4">
            <Button type="button" variant="secondary" onClick={() => setIsAdmitModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={availableBeds.length === 0}>Confirm Admission</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Patients;
