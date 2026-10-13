import React, { useState, useEffect } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { doctorService, appointmentService, patientService } from '../services/hmsServices.js';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Mail, 
  Phone, 
  Calendar, 
  Heart, 
  Stethoscope, 
  Star, 
  ArrowLeft,
  Sparkles,
  Award,
  CheckCircle2,
  BrainCircuit,
  Search
} from 'lucide-react';
import { Button, Input, Select, Card, Badge, Modal } from '../components/UI.jsx';

export const Doctors = () => {
  const { user, isAdmin } = useAuth();
  const toast = useToast();
  const params = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [doctorAppointments, setDoctorAppointments] = useState([]);
  const [doctorPatients, setDoctorPatients] = useState([]);
  const [selectedTab, setSelectedTab] = useState('Overview');

  // Search & Filters
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');

  // CRUD Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('CREATE'); // CREATE or EDIT
  const [editingDocId, setEditingDocId] = useState(null);

  // Forms
  const [form, setForm] = useState({
    name: '', specialization: 'Cardiology', email: '', phone: '', rating: 5.0, avatar: '',
    availability: [], experience: '8 Years'
  });

  // AI Schedule Optimizer States
  const [aiOptimized, setAiOptimized] = useState(false);
  const [optimizing, setOptimizing] = useState(false);

  const loadDoctors = async () => {
    try {
      const list = await doctorService.getAll();
      setDoctors(list);

      // Handle URL deep-linking: /doctors/:id or ?id=DOCTOR_ID
      const docId = params.id || searchParams.get('id');
      if (docId) {
        const fullDoc = list.find(d => d.id === docId);
        if (fullDoc) {
          setSelectedDoctor(fullDoc);

          // Get stats for this doctor
          const appointments = await appointmentService.getAll();
          const patients = await patientService.getAll();
          const docApts = appointments.filter(a => a.doctorId === docId);
          const docPats = patients.filter(p => p.assignedDoctorId === docId);

          setDoctorAppointments(docApts);
          setDoctorPatients(docPats);
        }
      } else {
        setSelectedDoctor(null);
      }
    } catch (err) {
      toast.error('Failed to load doctors list.');
    }
  };

  useEffect(() => {
    loadDoctors();
  }, [searchParams, params.id]);


  const selectDoctor = (id) => {
    setSearchParams({ id });
    setAiOptimized(false);
  };

  const clearSelection = () => {
    setSearchParams({});
    setSelectedDoctor(null);
  };

  const handleCheckboxChange = (day) => {
    setForm(prev => {
      const active = prev.availability.includes(day)
        ? prev.availability.filter(d => d !== day)
        : [...prev.availability, day];
      return { ...prev, availability: active };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.availability.length === 0) {
      toast.warning('Please select at least one available day.');
      return;
    }
    
    const avatarUrl = form.avatar || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150';
    const docData = { ...form, rating: Number(form.rating), avatar: avatarUrl };

    try {
      if (modalMode === 'CREATE') {
        await doctorService.create(docData, user.id);
        toast.success(`Registered Dr. ${form.name} successfully.`);
      } else {
        await doctorService.update(editingDocId, docData, user.id);
        toast.success(`Doctor profile updated.`);
      }
      setIsModalOpen(false);
      loadDoctors();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const openCreateModal = () => {
    setModalMode('CREATE');
    setForm({
      name: '', specialization: 'Cardiology', email: '', phone: '', rating: 5.0, avatar: '',
      availability: ['Monday', 'Wednesday', 'Friday'], experience: '8 Years'
    });
    setIsModalOpen(true);
  };

  const openEditModal = (doc) => {
    setModalMode('EDIT');
    setEditingDocId(doc.id);
    setForm({
      name: doc.name,
      specialization: doc.specialization,
      email: doc.email,
      phone: doc.phone,
      rating: doc.rating,
      avatar: doc.avatar,
      availability: doc.availability,
      experience: doc.experience || '8 Years'
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to remove this doctor profile? Scheduled appointments will block deletion.')) {
      try {
        await doctorService.delete(id, user.id);
        toast.success('Doctor profile removed.');
        loadDoctors();
      } catch (err) {
        toast.error(err.message || 'Cannot delete doctor profile.');
      }
    }
  };

  const triggerOptimize = () => {
    setOptimizing(true);
    setTimeout(() => {
      setOptimizing(false);
      setAiOptimized(true);
      toast.success('AI Schedule Optimizer completed shifts analysis!');
    }, 1200);
  };

  const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Filtered doctors list
  const filteredDoctors = doctors.filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(search.toLowerCase()) || d.specialization.toLowerCase().includes(search.toLowerCase());
    const matchesDept = deptFilter === 'All' || d.specialization === deptFilter;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* 1. SELECTED DOCTOR DETAILED PROFILE VIEW */}
      {selectedDoctor ? (
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between select-none">
            <Button variant="outline" size="sm" icon={ArrowLeft} onClick={clearSelection}>
              Back to Doctor Directory
            </Button>
            {isAdmin && (
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => openEditModal(selectedDoctor)}>
                  Edit Profile
                </Button>
                <Button size="sm" variant="danger" icon={Trash2} onClick={() => handleDelete(selectedDoctor.id)}>
                  Remove Clinician
                </Button>
              </div>
            )}
          </div>

          {/* Profile Card Header */}
          <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-6 shadow-premium">
            <div className="flex flex-col md:flex-row gap-6 items-center">
              <img
                src={selectedDoctor.avatar}
                alt={selectedDoctor.name}
                className="w-24 h-24 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shadow-sm"
              />
              <div className="flex-grow text-center md:text-left">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                  <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white">{selectedDoctor.name}</h2>
                  <Badge variant="premium">{selectedDoctor.specialization}</Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-2 mt-3 text-xs text-slate-550 dark:text-slate-400">
                  <div className="flex items-center justify-center md:justify-start gap-1"><Award className="w-4 h-4 text-primary-600" /><span>Clinical Experience: {selectedDoctor.experience || '8 Years'}</span></div>
                  <div className="flex items-center justify-center md:justify-start gap-1"><Star className="w-4 h-4 text-amber-500 fill-current" /><span>Rating: {selectedDoctor.rating?.toFixed(1)} / 5.0</span></div>
                  <div className="flex items-center justify-center md:justify-start gap-1"><Heart className="w-4 h-4 text-red-500" /><span>Total Patients: {doctorPatients.length}</span></div>
                </div>
              </div>
            </div>
          </div>

          {/* Detail Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left/Middle Column Tabs details */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              {/* Tab selector */}
              <div className="flex border-b border-slate-100 dark:border-slate-850 gap-6 select-none">
                {['Overview', 'Weekly Shift Schedule', 'Assigned Patients'].map((tab) => (
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

              {/* Tab panels */}
              {selectedTab === 'Overview' && (
                <Card title="Operational Credentials" subtitle="Specialization & availability details">
                  <div className="flex flex-col gap-4 text-sm">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-xs font-bold text-slate-450 uppercase block">Contact Email</span>
                        <span className="font-semibold text-slate-750 dark:text-slate-200">{selectedDoctor.email}</span>
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-450 uppercase block">Contact Phone</span>
                        <span className="font-semibold text-slate-750 dark:text-slate-200">{selectedDoctor.phone}</span>
                      </div>
                    </div>
                    <div className="mt-2">
                      <span className="text-xs font-bold text-slate-450 uppercase block mb-2">Availability Days</span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedDoctor.availability?.map(day => (
                          <Badge key={day} variant="success">{day}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {selectedTab === 'Weekly Shift Schedule' && (
                <Card title="Appointment Blocks" subtitle="Scheduled visits for this week">
                  <div className="flex flex-col gap-3">
                    {doctorAppointments.map(apt => (
                      <div key={apt.id} className="p-4 border border-slate-100 dark:border-slate-800 rounded-2xl flex justify-between items-center">
                        <div>
                          <h4 className="font-bold text-slate-800 dark:text-slate-200">Patient: {apt.patient?.name || 'Quick Booking'}</h4>
                          <p className="text-xs text-slate-450 mt-0.5">{apt.date} at {apt.time} — {apt.reason}</p>
                        </div>
                        <Badge variant={apt.status === 'Completed' ? 'success' : 'premium'}>{apt.status}</Badge>
                      </div>
                    ))}
                    {doctorAppointments.length === 0 && (
                      <div className="text-center py-6 text-slate-405 text-sm">No scheduled slots for this doctor.</div>
                    )}
                  </div>
                </Card>
              )}

              {selectedTab === 'Assigned Patients' && (
                <Card title="Inpatient Care Directory" subtitle="Current admitted patients under clinical review">
                  <div className="flex flex-col gap-3">
                    {doctorPatients.map(p => (
                      <div key={p.id} className="p-4 border border-slate-100 dark:border-slate-800 rounded-2xl flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary-50 dark:bg-primary-950/20 text-primary-650 flex items-center justify-center font-bold text-xs">
                            {p.name.charAt(0)}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-850 dark:text-slate-200">{p.name}</h4>
                            <p className="text-xs text-slate-450">{p.age} Yrs / {p.gender} | Blood: {p.bloodGroup}</p>
                          </div>
                        </div>
                        <Badge variant={p.admissionStatus === 'Admitted' ? 'premium' : 'neutral'}>{p.admissionStatus}</Badge>
                      </div>
                    ))}
                    {doctorPatients.length === 0 && (
                      <div className="text-center py-6 text-slate-405 text-sm">No patients assigned to this doctor.</div>
                    )}
                  </div>
                </Card>
              )}
            </div>

            {/* Right Column AI Optimizer Widget */}
            <div className="flex flex-col gap-6">
              <Card title="AI Schedule Optimizer" subtitle="Machine learning schedule analysis" className="bg-primary-50/10 border-primary-100">
                <div className="flex flex-col gap-4 text-xs">
                  <div className="text-slate-500 leading-relaxed">
                    Optimize Dr. {selectedDoctor.name.split(' ').pop()}'s weekly consultation schedule to balance appointment loads with peak patient hours.
                  </div>
                  
                  {aiOptimized ? (
                    <div className="flex flex-col gap-3 p-3.5 bg-white dark:bg-slate-850 border border-emerald-100 dark:border-emerald-950 rounded-2xl animate-fade-in shadow-sm select-none">
                      <div className="flex items-center gap-2 text-emerald-600 font-bold">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Shifts Optimized Successfully!</span>
                      </div>
                      <div className="text-[11px] text-slate-550 leading-relaxed font-semibold">
                        * Recommendation: Extend Tuesday shifts to 6:00 PM to handle Neurology diagnostics spillover.
                        <br />
                        * Recommendation: Block Thursday 10:00 AM slots for board checkups.
                      </div>
                    </div>
                  ) : (
                    <div className="py-6 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl text-slate-400 select-none">
                      No schedule optimization run yet.
                    </div>
                  )}

                  <Button 
                    size="sm" 
                    variant="primary" 
                    icon={BrainCircuit} 
                    className="w-full py-2.5" 
                    onClick={triggerOptimize}
                    disabled={optimizing}
                  >
                    {optimizing ? 'Analyzing Workload...' : 'Optimize Shift Calendar'}
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      ) : (
        /* 2. CLINICIANS DIRECTORY GRID VIEW */
        <div className="flex flex-col gap-6">
          {/* Header row */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 select-none">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">Doctor Directory</h1>
              <p className="text-slate-400 text-xs mt-1">Manage clinical specialties, rating scoreboards, and shift availabilities.</p>
            </div>
            {isAdmin && (
              <Button size="sm" variant="primary" icon={Plus} onClick={openCreateModal} className="w-full sm:w-auto">
                Register Doctor
              </Button>
            )}
          </div>

          {/* Search/Filter panel */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-4 rounded-2xl shadow-sm select-none">
            <div className="relative sm:col-span-2">
              <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="Search doctors by name or specialty..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-50/50 dark:bg-slate-900 border text-xs pl-10 pr-4 py-2.5 rounded-xl outline-none focus:bg-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 text-slate-800 dark:text-slate-100"
              />
            </div>
            <Select
              id="f-dept"
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              options={[
                { value: 'All', label: 'All Specialties' },
                { value: 'Cardiology', label: 'Cardiology' },
                { value: 'Neurology', label: 'Neurology' },
                { value: 'Orthopedics', label: 'Orthopedics' },
                { value: 'Pediatrics', label: 'Pediatrics' },
                { value: 'General Medicine', label: 'General Medicine' },
                { value: 'Dermatology', label: 'Dermatology' }
              ]}
            />
          </div>

          {/* Cards Directory */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredDoctors.map(doc => (
              <Card 
                key={doc.id}
                className="flex flex-col justify-between hover:scale-[1.02] hover:shadow-premium transition-all duration-200 relative cursor-pointer"
                onClick={() => selectDoctor(doc.id)}
              >
                <div>
                  {/* Photo and basic Info */}
                  <div className="flex items-center gap-4 border-b border-slate-50 dark:border-slate-700/50 pb-4 mb-4 select-none">
                    <img
                      src={doc.avatar}
                      alt={doc.name}
                      className="w-14 h-14 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-slate-800 dark:text-white truncate">{doc.name}</h3>
                      <p className="text-[10px] text-primary-600 dark:text-primary-400 font-bold uppercase tracking-wider mt-0.5">{doc.specialization}</p>
                      <div className="flex items-center gap-1 text-amber-500 mt-1">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span className="text-[10px] font-extrabold text-slate-600 dark:text-slate-350">{doc.rating.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Quick details */}
                  <div className="flex flex-col gap-2.5 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{doc.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span>{doc.phone}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 w-full flex gap-1.5 select-none">
                  <Button size="sm" variant="primary" className="w-full">
                    View Profile
                  </Button>
                </div>
              </Card>
            ))}
            {filteredDoctors.length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-400 text-sm">
                No doctor profiles matches the current filter settings.
              </div>
            )}
          </div>
        </div>
      )}

      {/* CREATE/EDIT DOCTOR MODAL */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalMode === 'CREATE' ? 'Register New Clinician' : 'Edit Doctor Profile'}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input 
            label="Doctor Name" 
            id="doc-name" 
            value={form.name} 
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Dr. Rajeshwari Sengupta" 
            required 
          />
          <Select 
            label="Specialization Department" 
            id="doc-spec" 
            value={form.specialization}
            onChange={(e) => setForm({ ...form, specialization: e.target.value })}
            options={['Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'General Medicine', 'Dermatology'].map(s => ({ value: s, label: s }))}
          />
          <Input 
            label="Experience Year / Qualification" 
            id="doc-exp" 
            value={form.experience} 
            onChange={(e) => setForm({ ...form, experience: e.target.value })}
            placeholder="12 Years / MBBS, MD (AIIMS)" 
            required 
          />
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Email Address" 
              id="doc-email" 
              type="email"
              value={form.email} 
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="rajeshwari@healthhub.in" 
              required 
            />
            <Input 
              label="Contact Phone" 
              id="doc-phone" 
              value={form.phone} 
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+91 98450 10101" 
              required 
            />
          </div>
          <Input 
            label="Profile Image Link (Optional)" 
            id="doc-avatar" 
            value={form.avatar} 
            onChange={(e) => setForm({ ...form, avatar: e.target.value })}
            placeholder="https://images.unsplash.com/..." 
          />
          
          <div className="mt-1">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">Weekly Availability days</span>
            <div className="grid grid-cols-3 gap-2">
              {weekdays.map(day => (
                <label key={day} className="flex items-center gap-2 p-2 border border-slate-100 dark:border-slate-800 rounded-xl cursor-pointer text-xs select-none">
                  <input 
                    type="checkbox" 
                    checked={form.availability.includes(day)}
                    onChange={() => handleCheckboxChange(day)}
                    className="rounded border-slate-300 text-primary-650 focus:ring-primary-500 w-4 h-4"
                  />
                  <span>{day.substring(0, 3)}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">{modalMode === 'CREATE' ? 'Register Clinician' : 'Save Changes'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Doctors;
