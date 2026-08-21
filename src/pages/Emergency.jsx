import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { emergencyService, doctorService } from '../services/hmsServices.js';
import { Plus, Flame, ShieldAlert, Heart, Siren, Truck, Clock, Trash2 } from 'lucide-react';
import { Button, Input, Select, Card, Badge, Modal } from '../components/UI.jsx';

export const Emergency = () => {
  const { user, isAdmin, isDoctor, isReceptionist } = useAuth();
  const toast = useToast();

  const [cases, setCases] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('CREATE');
  const [editingCaseId, setEditingCaseId] = useState(null);

  const [form, setForm] = useState({
    patientName: '', age: '', gender: 'Male', priority: 'Critical', condition: '', assignedDoctorId: '', roomNumber: ''
  });

  const loadData = async () => {
    try {
      const casesList = await emergencyService.getAll();
      const docsList = await doctorService.getAll();
      setCases(casesList);
      setDoctors(docsList);
    } catch (err) {
      toast.error('Failed to load emergency records.');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalMode === 'CREATE') {
        await emergencyService.create(form, user.id);
        toast.success(`Emergency case registered: ${form.patientName}`);
      } else {
        await emergencyService.update(editingCaseId, form, user.id);
        toast.success('Emergency case updated.');
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const openCreateModal = () => {
    setModalMode('CREATE');
    setForm({
      patientName: '', age: '', gender: 'Male', priority: 'Critical', condition: '', assignedDoctorId: doctors[0]?.id || '', roomNumber: 'ER-101'
    });
    setIsModalOpen(true);
  };

  const openEditModal = (c) => {
    setModalMode('EDIT');
    setEditingCaseId(c.id);
    setForm({
      patientName: c.patientName,
      age: c.age,
      gender: c.gender,
      priority: c.priority,
      condition: c.condition,
      assignedDoctorId: c.assignedDoctorId || '',
      roomNumber: c.roomNumber || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this emergency log?')) return;
    try {
      await emergencyService.delete(id, user.id);
      toast.success('Emergency log cleared.');
      loadData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Helper for priority badges colors
  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'Critical': return 'danger';
      case 'High': return 'warning';
      case 'Medium': return 'premium';
      case 'Low': return 'neutral';
      default: return 'neutral';
    }
  };

  // KPI calculations
  const stats = {
    critical: cases.filter(c => c.priority === 'Critical' && c.status !== 'Discharged' && c.status !== 'Treated & Released').length,
    totalActive: cases.filter(c => c.status !== 'Discharged' && c.status !== 'Treated & Released').length,
    ambulances: 4, // simulated static indicator
    availableBeds: 5 // simulated static indicator
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center select-none">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
            <Flame className="w-8 h-8 text-red-500 animate-pulse" />
            <span>Emergency / ER Dashboard</span>
          </h1>
          <p className="text-slate-400 text-xs mt-1">Real-time emergency triage board and critical dispatch controls.</p>
        </div>
        {(isAdmin || isReceptionist || isDoctor) && (
          <Button size="sm" variant="danger" icon={Plus} onClick={openCreateModal}>
            Register ER Triage
          </Button>
        )}
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 select-none">
        <Card className="p-4 flex flex-col justify-between hover:shadow-premium duration-150 transition-all border-red-100 bg-red-50/5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Critical Cases</span>
            <ShieldAlert className="w-5 h-5 text-red-600 animate-bounce" />
          </div>
          <span className="text-2xl font-extrabold text-red-650 mt-3">{stats.critical} Critical</span>
        </Card>
        <Card className="p-4 flex flex-col justify-between hover:shadow-premium duration-150 transition-all">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Active ER Patients</span>
            <Heart className="w-5 h-5 text-red-500" />
          </div>
          <span className="text-2xl font-extrabold text-slate-800 dark:text-white mt-3">{stats.totalActive} Active</span>
        </Card>
        <Card className="p-4 flex flex-col justify-between hover:shadow-premium duration-150 transition-all">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Ambulance Fleet</span>
            <Truck className="w-5 h-5 text-primary-600" />
          </div>
          <span className="text-2xl font-extrabold text-slate-800 dark:text-white mt-3">{stats.ambulances} Available</span>
        </Card>
        <Card className="p-4 flex flex-col justify-between hover:shadow-premium duration-150 transition-all">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">ER Beds Available</span>
            <Siren className="w-5 h-5 text-teal-600" />
          </div>
          <span className="text-2xl font-extrabold text-slate-800 dark:text-white mt-3">{stats.availableBeds} Beds</span>
        </Card>
      </div>

      {/* ER Triage Table */}
      <Card title="Emergency Room Active Queue" subtitle="Real-time triage ledger sorted by critical priority" className="p-0 overflow-hidden bg-white border border-slate-100 dark:border-slate-700">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 font-bold text-slate-400 uppercase">
              <tr>
                <th className="px-6 py-4">Patient Name</th>
                <th className="px-6 py-4">Age / Gender</th>
                <th className="px-6 py-4">Triage Priority</th>
                <th className="px-6 py-4">Medical Condition</th>
                <th className="px-6 py-4">Assigned Doctor</th>
                <th className="px-6 py-4">Room/Bed</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {cases.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-750/30 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200">{c.patientName}</td>
                  <td className="px-6 py-4 text-slate-500">{c.age} Yrs / {c.gender}</td>
                  <td className="px-6 py-4">
                    <Badge variant={getPriorityBadge(c.priority)}>{c.priority}</Badge>
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-350">{c.condition}</td>
                  <td className="px-6 py-4 text-primary-600 font-semibold">Dr. {c.assignedDoctor?.name || 'Assessing...'}</td>
                  <td className="px-6 py-4 font-mono text-slate-500">{c.roomNumber || 'Triage Area'}</td>
                  <td className="px-6 py-4">
                    <Badge variant="neutral">{c.status}</Badge>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-1.5 select-none">
                      {(isAdmin || isDoctor || isReceptionist) && (
                        <>
                          <button
                            onClick={() => openEditModal(c)}
                            className="text-slate-400 hover:text-primary-605 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                            title="Update Status"
                          >
                            <Clock className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(c.id)}
                            className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                            title="Clear Triage"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {cases.length === 0 && (
                <tr>
                  <td colSpan="8" className="text-center text-slate-400 py-12 select-none">
                    No active emergency incidents logged in the queue.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ER TRIAGE MODAL */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalMode === 'CREATE' ? 'Register New ER Incident' : 'Update Emergency Status'}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input 
            label="Patient Name" 
            id="er-name" 
            value={form.patientName} 
            onChange={(e) => setForm({ ...form, patientName: e.target.value })}
            placeholder="David Miller" 
            required 
          />
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Age (Years)" 
              id="er-age" 
              type="number"
              value={form.age} 
              onChange={(e) => setForm({ ...form, age: e.target.value })}
              placeholder="48" 
              required 
            />
            <Select 
              label="Gender" 
              id="er-gender" 
              value={form.gender} 
              onChange={(e) => setForm({ ...form, gender: e.target.value })}
              options={[{ value: 'Male', label: 'Male' }, { value: 'Female', label: 'Female' }, { value: 'Other', label: 'Other' }]}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select 
              label="Triage Priority" 
              id="er-pri" 
              value={form.priority} 
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
              options={[
                { value: 'Critical', label: 'Critical (Red)' },
                { value: 'High', label: 'High (Orange)' },
                { value: 'Medium', label: 'Medium (Yellow)' },
                { value: 'Low', label: 'Low (Blue)' }
              ]}
            />
            <Input 
              label="Assigned Room / Bed" 
              id="er-room" 
              value={form.roomNumber} 
              onChange={(e) => setForm({ ...form, roomNumber: e.target.value })}
              placeholder="ER-101" 
              required 
            />
          </div>
          <Select 
            label="Assigned Doctor" 
            id="er-doc" 
            value={form.assignedDoctorId} 
            onChange={(e) => setForm({ ...form, assignedDoctorId: e.target.value })}
            options={[
              { value: '', label: '-- Assign ER Clinician --' },
              ...doctors.map(d => ({ value: d.id, label: `Dr. ${d.name} (${d.specialization})` }))
            ]}
            required
          />
          <Textarea 
            label="Medical Condition Detail" 
            id="er-cond" 
            value={form.condition} 
            onChange={(e) => setForm({ ...form, condition: e.target.value })}
            placeholder="Acute chest pain, severe blood loss, stroke symptoms..."
            required 
          />

          <div className="flex justify-end gap-2 mt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">{modalMode === 'CREATE' ? 'Register Triage' : 'Save Changes'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Emergency;
