import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  Download
} from 'lucide-react';
import { Button, Input, Select, Textarea, Card, Badge, Modal } from '../components/UI.jsx';
import { pdfGenerator } from '../utils/pdfGenerator.js';

export const Patients = () => {
  const { user, isAdmin, isDoctor, isReceptionist } = useAuth();
  const toast = useToast();
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

  // Fetch all listings
  const loadData = async () => {
    try {
      const pList = await patientService.getAll();
      const dList = await doctorService.getAll();
      const wList = await wardService.getAll();
      
      setPatients(pList);
      setDoctors(dList);
      setWards(wList);

      // Handle URL deep-linking: ?id=PATIENT_ID
      const pId = searchParams.get('id');
      if (pId) {
        const fullPatient = await patientService.getById(pId);
        if (fullPatient) {
          setSelectedPatient(fullPatient);
        }
      } else if (pList.length > 0 && !selectedPatient) {
        // Pre-select first patient
        const firstPatient = await patientService.getById(pList[0].id);
        setSelectedPatient(firstPatient);
      }
    } catch (err) {
      toast.error('Error loading patient directory.');
    }
  };

  useEffect(() => {
    loadData();
  }, [searchParams]);

  const selectPatient = async (id) => {
    setSearchParams({ id });
    const fullPatient = await patientService.getById(id);
    setSelectedPatient(fullPatient);
  };

  // Filter patients list
  const filteredPatients = patients.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          p.id.toLowerCase().includes(search.toLowerCase()) ||
                          p.phone.includes(search);
    const matchesStatus = statusFilter === 'All' || p.admissionStatus === statusFilter;
    const matchesDoctor = doctorFilter === 'All' || p.assignedDoctorId === doctorFilter;
    return matchesSearch && matchesStatus && matchesDoctor;
  });

  // Handle CRUD Patient Submit
  const handlePatientSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalMode === 'CREATE') {
        const newP = await patientService.create(patientForm, user.id);
        toast.success(`Patient profile "${newP.name}" created.`);
        await selectPatient(newP.id);
      } else {
        await patientService.update(editingPatientId, patientForm, user.id);
        toast.success(`Patient profile updated.`);
        await selectPatient(editingPatientId);
      }
      setIsPatientModalOpen(false);
      loadData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Open Edit Modal
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

  const openCreateModal = () => {
    setModalMode('CREATE');
    setPatientForm({
      name: '', age: '', gender: 'Male', phone: '', address: '', bloodGroup: 'O+', allergies: '', medicalHistory: '', emergencyContact: '', assignedDoctorId: doctors[0]?.id || ''
    });
    setIsPatientModalOpen(true);
  };

  // Handle Patient Deletion
  const handleDeletePatient = async (pId) => {
    if (window.confirm('WARNING: Are you sure you want to delete this patient profile? This action will cascade check appointments and unpaid bills.')) {
      try {
        await patientService.delete(pId, user.id);
        toast.success('Patient profile removed successfully.');
        setSelectedPatient(null);
        setSearchParams({});
        loadData();
      } catch (err) {
        toast.error(err.message || 'Failed to delete patient profile.');
      }
    }
  };

  // Load available beds when ward is selected in Admit Form
  useEffect(() => {
    if (!admitForm.wardId) {
      setAvailableBeds([]);
      return;
    }
    const ward = wards.find(w => w.id === admitForm.wardId);
    if (ward) {
      const beds = ward.bedList.filter(b => b.status === 'Available' || b.status === 'Cleaning');
      setAvailableBeds(beds);
    }
  }, [admitForm.wardId, wards]);

  // Handle Patient Admission
  const handleAdmitSubmit = async (e) => {
    e.preventDefault();
    if (!admitForm.wardId || !admitForm.bedNo) {
      toast.warning('Please select both a Ward and an available Bed.');
      return;
    }
    try {
      await patientService.admit(selectedPatient.id, admitForm.wardId, admitForm.bedNo, user.id);
      toast.success(`Patient admitted to Bed ${admitForm.bedNo} successfully.`);
      setIsAdmitModalOpen(false);
      setAdmitForm({ wardId: '', bedNo: '' });
      await selectPatient(selectedPatient.id);
      loadData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Handle Discharge
  const handleDischarge = async (pId) => {
    if (window.confirm('Discharging patient will free their assigned room bed and generate a final billing invoice. Proceed?')) {
      try {
        await patientService.discharge(pId, user.id);
        toast.success('Patient discharged. Room charges invoice generated.');
        await selectPatient(pId);
        loadData();
      } catch (err) {
        toast.error(err.message);
      }
    }
  };

  // Download PDF helpers
  const handleDownloadInvoice = (bill) => {
    pdfGenerator.generateInvoice(bill, selectedPatient, {
      hospitalName: 'Careflow Medical Center',
      hospitalAddress: '750 Health Plaza Blvd, Boston, MA 02111',
      hospitalPhone: '+1 (555) 100-2000',
      hospitalEmail: 'billing@careflow.com'
    });
    toast.success(`Invoice statement downloaded.`);
  };

  const handleDownloadPrescription = (pres) => {
    const doc = doctors.find(d => d.id === pres.doctorId);
    pdfGenerator.generatePrescription(pres, selectedPatient, doc, {
      hospitalName: 'Careflow Medical Center',
      hospitalAddress: '750 Health Plaza Blvd, Boston, MA 02111',
      hospitalPhone: '+1 (555) 100-2000',
      hospitalEmail: 'pharmacy@careflow.com'
    });
    toast.success('Prescription slip PDF downloaded.');
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-120px)] animate-fade-in">
      {/* LEFT: Patients list directory */}
      <div className="w-full lg:w-96 flex flex-col bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl overflow-hidden shadow-premium">
        {/* Search header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-800 dark:text-white">Patient Directory</h2>
            {(isAdmin || isReceptionist) && (
              <Button size="sm" variant="primary" icon={Plus} onClick={openCreateModal}>
                Add Profile
              </Button>
            )}
          </div>
          {/* Search box */}
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search by name, phone or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs pl-10 pr-4 py-2 rounded-xl outline-none focus:bg-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-slate-800 dark:text-slate-100"
            />
          </div>
          {/* Filters */}
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-1/2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[10px] rounded-lg px-2 py-1 cursor-pointer outline-none focus:border-teal-500 text-slate-700 dark:text-slate-350"
            >
              <option value="All">All Statuses</option>
              <option value="Admitted">Admitted</option>
              <option value="Outpatient">Outpatient</option>
              <option value="Discharged">Discharged</option>
            </select>
            <select
              value={doctorFilter}
              onChange={(e) => setDoctorFilter(e.target.value)}
              className="w-1/2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[10px] rounded-lg px-2 py-1 cursor-pointer outline-none focus:border-teal-500 text-slate-700 dark:text-slate-350"
            >
              <option value="All">All Doctors</option>
              {doctors.map(d => (
                <option key={d.id} value={d.id}>{d.name.split('. ')[1] || d.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Directory List */}
        <div className="flex-grow overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/50">
          {filteredPatients.map(p => {
            const isSelected = selectedPatient?.id === p.id;
            return (
              <button
                key={p.id}
                onClick={() => selectPatient(p.id)}
                className={`w-full text-left p-4 transition-colors flex items-center justify-between border-l-4 ${
                  isSelected 
                    ? 'bg-teal-50/40 dark:bg-teal-950/10 border-teal-600' 
                    : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-750/30'
                }`}
              >
                <div className="min-w-0 pr-2">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{p.name}</h4>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-1">
                    <span>ID: {p.id.substring(0, 8)}</span>
                    <span>•</span>
                    <span>{p.gender}, {p.age} yrs</span>
                  </div>
                </div>
                <Badge variant={
                  p.admissionStatus === 'Admitted' ? 'success' : 
                  p.admissionStatus === 'Discharged' ? 'neutral' : 'info'
                }>
                  {p.admissionStatus}
                </Badge>
              </button>
            );
          })}
          {filteredPatients.length === 0 && (
            <div className="p-8 text-center text-xs text-slate-400 select-none">
              No matching patient records found.
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Patient Clinical File Details */}
      <div className="flex-grow bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl overflow-hidden shadow-premium flex flex-col">
        {selectedPatient ? (
          <>
            {/* Header info */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/20 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold text-base select-none">
                  {selectedPatient.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-slate-800 dark:text-white leading-tight">
                      {selectedPatient.name}
                    </h3>
                    <Badge variant={
                      selectedPatient.admissionStatus === 'Admitted' ? 'success' : 
                      selectedPatient.admissionStatus === 'Discharged' ? 'neutral' : 'info'
                    }>
                      {selectedPatient.admissionStatus}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    System Database Ref: <span className="font-mono">{selectedPatient.id}</span>
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {(isAdmin || isReceptionist) && (
                  <>
                    <Button size="sm" variant="outline" icon={Edit2} onClick={() => openEditModal(selectedPatient)}>
                      Edit Profile
                    </Button>
                    
                    {selectedPatient.admissionStatus !== 'Admitted' ? (
                      <Button size="sm" variant="success" icon={Bed} onClick={() => setIsAdmitModalOpen(true)}>
                        Admit Patient
                      </Button>
                    ) : (
                      <Button size="sm" variant="warning" icon={Bed} onClick={() => handleDischarge(selectedPatient.id)}>
                        Discharge Patient
                      </Button>
                    )}
                  </>
                )}
                {isAdmin && (
                  <Button size="sm" variant="danger" icon={Trash2} onClick={() => handleDeletePatient(selectedPatient.id)} />
                )}
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-100 dark:border-slate-700 px-6 bg-slate-50/20 overflow-x-auto">
              {['Overview', 'Appointments', 'Prescriptions', 'Diagnostic Reports', 'Billing History'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setSelectedTab(tab)}
                  className={`px-4 py-3 border-b-2 text-xs font-bold transition-all whitespace-nowrap ${
                    selectedTab === tab 
                      ? 'border-teal-600 text-teal-600 dark:text-teal-400' 
                      : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-350'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab content panel */}
            <div className="flex-grow p-6 overflow-y-auto">
              
              {/* TAB 1: OVERVIEW */}
              {selectedTab === 'Overview' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Left Info Panel */}
                  <div className="md:col-span-2 flex flex-col gap-5">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Age / Gender</h4>
                        <p className="text-xs font-medium text-slate-800 dark:text-slate-200 mt-1">{selectedPatient.age} Years / {selectedPatient.gender}</p>
                      </div>
                      <div>
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Blood Group</h4>
                        <p className="text-xs font-medium text-slate-800 dark:text-slate-200 mt-1">{selectedPatient.bloodGroup}</p>
                      </div>
                      <div>
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Contact Phone</h4>
                        <p className="text-xs font-medium text-slate-800 dark:text-slate-200 mt-1">{selectedPatient.phone}</p>
                      </div>
                      <div>
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assigned Physician</h4>
                        <p className="text-xs font-medium text-teal-600 dark:text-teal-400 mt-1">Dr. {selectedPatient.assignedDoctor?.name || 'N/A'}</p>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 dark:border-slate-700/60 pt-4">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Residential Address</h4>
                      <p className="text-xs text-slate-600 dark:text-slate-350 mt-1">{selectedPatient.address}</p>
                    </div>

                    <div className="border-t border-slate-100 dark:border-slate-700/60 pt-4">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Past Medical History</h4>
                      <p className="text-xs text-slate-600 dark:text-slate-350 mt-1 whitespace-pre-line">{selectedPatient.medicalHistory || 'No previous clinical history logged.'}</p>
                    </div>
                  </div>

                  {/* Right Warnings & Ward info */}
                  <div className="flex flex-col gap-4">
                    {/* Ward details if admitted */}
                    {selectedPatient.admissionStatus === 'Admitted' && (
                      <div className="p-4 bg-teal-50/40 border border-teal-200 rounded-xl">
                        <div className="flex items-center gap-2 text-teal-700 dark:text-teal-400 font-bold text-xs">
                          <Bed className="w-4 h-4" />
                          <span>Active Bed Allocation</span>
                        </div>
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-2">
                          Ward: {selectedPatient.ward?.name || 'N/A'}
                        </p>
                        <p className="text-xs font-bold text-teal-600 mt-1">
                          Bed Reference: {selectedPatient.bedNo}
                        </p>
                      </div>
                    )}

                    {/* Allergies Box */}
                    <div className={`p-4 border rounded-xl ${
                      selectedPatient.allergies && selectedPatient.allergies !== 'None'
                        ? 'bg-red-50/40 border-red-200 text-red-700 dark:bg-red-950/10'
                        : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-750 text-slate-500'
                    }`}>
                      <div className="flex items-center gap-2 font-bold text-xs">
                        <AlertOctagon className="w-4 h-4" />
                        <span>Allergies & Contraindications</span>
                      </div>
                      <p className="text-xs font-bold mt-2">
                        {selectedPatient.allergies || 'No allergies recorded.'}
                      </p>
                    </div>

                    {/* Emergency Contact */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Emergency Contact</h4>
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-1.5">{selectedPatient.emergencyContact || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: APPOINTMENTS */}
              {selectedTab === 'Appointments' && (
                <div className="flex flex-col gap-4">
                  {selectedPatient.history?.appointments.map(apt => (
                    <div key={apt.id} className="flex items-center justify-between p-4 border border-slate-100 dark:border-slate-750 rounded-xl hover:shadow-premium transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-slate-50 dark:bg-slate-900 rounded-lg flex items-center justify-center">
                          <Calendar className="w-4.5 h-4.5 text-indigo-500" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            Dr. {apt.doctor?.name || 'Physician'} ({apt.doctor?.specialization})
                          </h4>
                          <p className="text-[10px] text-slate-400 mt-1">{apt.date} at {apt.time}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">{apt.reason}</p>
                        </div>
                      </div>
                      <Badge variant={
                        apt.status === 'Completed' ? 'success' : 
                        apt.status === 'Cancelled' ? 'danger' : 'info'
                      }>
                        {apt.status}
                      </Badge>
                    </div>
                  ))}
                  {selectedPatient.history?.appointments.length === 0 && (
                    <div className="text-center text-slate-400 py-8 text-xs select-none">
                      No medical appointments scheduled.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: PRESCRIPTIONS */}
              {selectedTab === 'Prescriptions' && (
                <div className="flex flex-col gap-4">
                  {selectedPatient.history?.prescriptions.map(pres => (
                    <div key={pres.id} className="p-4 border border-slate-100 dark:border-slate-750 rounded-xl flex flex-col gap-3 hover:shadow-premium transition-all">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            Prescribed by Dr. {pres.doctor?.name || 'Physician'}
                          </h4>
                          <p className="text-[10px] text-slate-400 mt-1">Date: {pres.date}  |  Prescription Ref: {pres.id.substring(0, 8)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={pres.status === 'Dispensed' ? 'success' : 'warning'}>
                            {pres.status}
                          </Badge>
                          <Button size="sm" variant="secondary" icon={Download} onClick={() => handleDownloadPrescription(pres)}>
                            Download PDF
                          </Button>
                        </div>
                      </div>
                      
                      {/* Meds List */}
                      <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-3 flex flex-col gap-2">
                        {pres.medicines.map((m, idx) => (
                          <div key={idx} className="flex justify-between text-xs border-b border-slate-100 last:border-0 pb-1.5 last:pb-0">
                            <span className="font-bold text-slate-700 dark:text-slate-300">{m.detail?.name || 'Medicine'}</span>
                            <span className="text-slate-500">{m.dosage} • {m.duration}</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-[10px] text-slate-500 italic">Notes: {pres.notes}</p>
                    </div>
                  ))}
                  {selectedPatient.history?.prescriptions.length === 0 && (
                    <div className="text-center text-slate-400 py-8 text-xs select-none">
                      No prescription slips found.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: DIAGNOSTIC REPORTS */}
              {selectedTab === 'Diagnostic Reports' && (
                <div className="flex flex-col gap-4">
                  {selectedPatient.history?.labReports.map(rep => (
                    <div key={rep.id} className="p-4 border border-slate-100 dark:border-slate-750 rounded-xl flex flex-col gap-2 hover:shadow-premium transition-all">
                      <div className="flex justify-between items-center">
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">{rep.testName}</h4>
                        <Badge variant={rep.status === 'Completed' ? 'success' : 'warning'}>
                          {rep.status}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-slate-400">Ordered by Dr. {rep.doctor?.name}  |  Issued: {rep.date}</p>
                      <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 mt-2">
                        {rep.resultText || 'Awaiting lab technician results...'}
                      </div>
                    </div>
                  ))}
                  {selectedPatient.history?.labReports.length === 0 && (
                    <div className="text-center text-slate-400 py-8 text-xs select-none">
                      No diagnostic lab orders found.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: BILLING HISTORY */}
              {selectedTab === 'Billing History' && (
                <div className="flex flex-col gap-4">
                  {selectedPatient.history?.bills.map(bill => (
                    <div key={bill.id} className="p-4 border border-slate-100 dark:border-slate-750 rounded-xl flex items-center justify-between hover:shadow-premium transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-slate-50 dark:bg-slate-900 rounded-lg flex items-center justify-center">
                          <CreditCard className="w-4.5 h-4.5 text-teal-600" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            Statement Total: ${bill.total.toFixed(2)}
                          </h4>
                          <p className="text-[10px] text-slate-400 mt-1">Issued: {bill.date}  |  Bill ID: {bill.id.substring(0, 8)}</p>
                          <p className="text-[9px] text-slate-400 mt-0.5">Mode: {bill.paymentMode}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={
                          bill.status === 'Paid' ? 'success' : 
                          bill.status === 'Partial' ? 'warning' : 'danger'
                        }>
                          {bill.status}
                        </Badge>
                        <Button size="sm" variant="secondary" icon={Download} onClick={() => handleDownloadInvoice(bill)}>
                          Invoice PDF
                        </Button>
                      </div>
                    </div>
                  ))}
                  {selectedPatient.history?.bills.length === 0 && (
                    <div className="text-center text-slate-400 py-8 text-xs select-none">
                      No billing invoices issued.
                    </div>
                  )}
                </div>
              )}

            </div>
          </>
        ) : (
          <div className="flex-grow flex flex-col items-center justify-center p-8 text-center text-slate-400 select-none">
            <User className="w-16 h-16 text-slate-200 dark:text-slate-700 mb-4" />
            <h3 className="text-sm font-bold">No Patient Profile Selected</h3>
            <p className="text-xs mt-1 max-w-xs leading-normal">
              Select an option from the directory sidebar or register a new user configuration profile.
            </p>
          </div>
        )}
      </div>

      {/* PATIENT PROFILE EDIT/CREATE MODAL */}
      <Modal 
        isOpen={isPatientModalOpen} 
        onClose={() => setIsPatientModalOpen(false)} 
        title={modalMode === 'CREATE' ? 'Register New Patient Profile' : 'Edit Patient Medical File'}
      >
        <form onSubmit={handlePatientSubmit} className="grid grid-cols-2 gap-4">
          <Input 
            label="Full Name" 
            id="p-name" 
            value={patientForm.name} 
            onChange={(e) => setPatientForm({ ...patientForm, name: e.target.value })}
            placeholder="John Doe" 
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
            placeholder="+1 555-0102" 
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
            label="Assigned Doctor"
            id="p-doc"
            value={patientForm.assignedDoctorId}
            onChange={(e) => setPatientForm({ ...patientForm, assignedDoctorId: e.target.value })}
            options={doctors.map(d => ({ value: d.id, label: `${d.name} (${d.specialization})` }))}
          />
          <Input 
            label="Allergies & Contraindications" 
            id="p-allergies" 
            value={patientForm.allergies} 
            onChange={(e) => setPatientForm({ ...patientForm, allergies: e.target.value })}
            placeholder="e.g. Penicillin, Shellfish (or 'None')" 
          />
          <Input 
            label="Emergency Contact" 
            id="p-emergency" 
            value={patientForm.emergencyContact} 
            onChange={(e) => setPatientForm({ ...patientForm, emergencyContact: e.target.value })}
            placeholder="Name & contact phone number" 
            className="col-span-2"
            required
          />
          <Textarea 
            label="Clinical History Details" 
            id="p-history" 
            value={patientForm.medicalHistory} 
            onChange={(e) => setPatientForm({ ...patientForm, medicalHistory: e.target.value })}
            placeholder="Log details of previous conditions, surgeries, or chronic problems..." 
            className="col-span-2"
          />
          <Textarea 
            label="Home Address" 
            id="p-addr" 
            value={patientForm.address} 
            onChange={(e) => setPatientForm({ ...patientForm, address: e.target.value })}
            placeholder="Street Address, City" 
            className="col-span-2"
            required
          />
          <div className="col-span-2 flex justify-end gap-2 mt-2">
            <Button type="button" variant="secondary" onClick={() => setIsPatientModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">{modalMode === 'CREATE' ? 'Register' : 'Save Changes'}</Button>
          </div>
        </form>
      </Modal>

      {/* ADMISSION MODAL */}
      <Modal isOpen={isAdmitModalOpen} onClose={() => setIsAdmitModalOpen(false)} title="Admit Patient to Ward Bed">
        <form onSubmit={handleAdmitSubmit} className="flex flex-col gap-4">
          <Select
            label="Select Ward Type"
            id="adm-ward"
            value={admitForm.wardId}
            onChange={(e) => setAdmitForm({ wardId: e.target.value, bedNo: '' })}
            required
            options={[
              { value: '', label: '-- Choose Ward --' },
              ...wards.map(w => ({ value: w.id, label: `${w.name} (${w.type} Ward, Occupancy: ${w.occupiedBeds}/${w.totalBeds})` }))
            ]}
          />
          <Select
            label="Select Available Bed"
            id="adm-bed"
            value={admitForm.bedNo}
            onChange={(e) => setAdmitForm({ ...admitForm, bedNo: e.target.value })}
            required
            disabled={!admitForm.wardId}
            options={[
              { value: '', label: '-- Choose Available Bed --' },
              ...availableBeds.map(b => ({ value: b.bedNo, label: `${b.bedNo} - [${b.status}]` }))
            ]}
          />
          <div className="flex justify-end gap-2 mt-2">
            <Button type="button" variant="secondary" onClick={() => setIsAdmitModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="success">Admit Patient</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default Patients;
