import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { doctorService } from '../services/hmsServices.js';
import { Plus, Edit2, Trash2, Mail, Phone, Calendar, Heart, Stethoscope, Star } from 'lucide-react';
import { Button, Input, Select, Card, Badge, Modal } from '../components/UI.jsx';

export const Doctors = () => {
  const { user, isAdmin } = useAuth();
  const toast = useToast();

  const [doctors, setDoctors] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('CREATE'); // CREATE or EDIT
  const [editingDocId, setEditingDocId] = useState(null);

  const [form, setForm] = useState({
    name: '', specialization: '', email: '', phone: '', rating: 5.0, avatar: '',
    availability: []
  });

  const loadDoctors = async () => {
    try {
      const list = await doctorService.getAll();
      setDoctors(list);
    } catch (err) {
      toast.error('Failed to load doctors list.');
    }
  };

  useEffect(() => {
    loadDoctors();
  }, []);

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
    
    // Default avatar
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
      availability: ['Monday', 'Wednesday']
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
      availability: doc.availability
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

  const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Title Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">Doctor Directory</h1>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Manage clinical staff, specialties, and schedules.</p>
        </div>
        {isAdmin && (
          <Button size="sm" variant="primary" icon={Plus} onClick={openCreateModal}>
            Register Doctor
          </Button>
        )}
      </div>

      {/* Grid of Doctor Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {doctors.map((doc) => (
          <Card 
            key={doc.id}
            className="flex flex-col h-full relative"
            headerActions={isAdmin && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => openEditModal(doc)}
                  className="text-slate-400 hover:text-teal-600 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(doc.id)}
                  className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          >
            {/* Profile Avatar */}
            <div className="flex items-center gap-4 border-b border-slate-100 dark:border-slate-700 pb-4 mb-4">
              <img
                src={doc.avatar}
                alt={doc.name}
                className="w-14 h-14 rounded-2xl object-cover border border-slate-200 dark:border-slate-650 flex-shrink-0"
              />
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white truncate">{doc.name}</h3>
                <p className="text-[10px] text-teal-600 dark:text-teal-400 font-bold uppercase tracking-wider mt-0.5">{doc.specialization}</p>
                <div className="flex items-center gap-1 text-amber-500 mt-1">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-350">{doc.rating.toFixed(1)}</span>
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="flex-grow flex flex-col gap-2.5 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span className="truncate">{doc.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span>{doc.phone}</span>
              </div>
              
              {/* Availability days */}
              <div className="border-t border-slate-100 dark:border-slate-700/60 pt-3 mt-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Weekly Availability</span>
                <div className="flex flex-wrap gap-1">
                  {doc.availability.map((day) => (
                    <span 
                      key={day} 
                      className="px-2 py-0.5 rounded bg-teal-50/60 text-teal-700 border border-teal-100 dark:bg-teal-950/20 dark:border-teal-900/50 dark:text-teal-400 text-[9px] font-semibold"
                    >
                      {day.substring(0, 3)}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* CREATE/EDIT DOCTOR MODAL */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalMode === 'CREATE' ? 'Register New Clinician' : 'Edit Doctor Profile'}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input 
            label="Doctor Name" 
            id="doc-name" 
            value={form.name} 
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Dr. Sarah Jenkins" 
            required 
          />
          <div className="grid grid-cols-2 gap-4">
            <Select 
              label="Specialization Specialty" 
              id="doc-spec" 
              value={form.specialization} 
              onChange={(e) => setForm({ ...form, specialization: e.target.value })}
              options={[
                { value: 'Cardiology', label: 'Cardiology' },
                { value: 'Pediatrics', label: 'Pediatrics' },
                { value: 'Neurology', label: 'Neurology' },
                { value: 'Orthopedics', label: 'Orthopedics' },
                { value: 'General Medicine', label: 'General Medicine' }
              ]}
            />
            <Input 
              label="Rating (0.0 - 5.0)" 
              id="doc-rating" 
              type="number" 
              step="0.1" 
              min="1" 
              max="5"
              value={form.rating} 
              onChange={(e) => setForm({ ...form, rating: e.target.value })}
              required 
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Email Address" 
              id="doc-email" 
              type="email" 
              value={form.email} 
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="jenkins@careflow.com" 
              required 
            />
            <Input 
              label="Phone Number" 
              id="doc-phone" 
              value={form.phone} 
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+1 555-9988" 
              required 
            />
          </div>
          <Input 
            label="Avatar Image URL" 
            id="doc-avatar" 
            value={form.avatar} 
            onChange={(e) => setForm({ ...form, avatar: e.target.value })}
            placeholder="https://images.unsplash.com/photo-..." 
          />

          {/* Schedule Selectors */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Weekly Schedule Slots</span>
            <div className="grid grid-cols-3 gap-2">
              {weekdays.map((day) => {
                const isChecked = form.availability.includes(day);
                return (
                  <label 
                    key={day} 
                    className={`flex items-center justify-between p-2 border text-xs font-semibold rounded-xl cursor-pointer select-none transition-colors ${
                      isChecked 
                        ? 'border-teal-500 bg-teal-50/50 text-teal-700 dark:bg-teal-950/20 dark:text-teal-400' 
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>{day}</span>
                    <input 
                      type="checkbox" 
                      checked={isChecked} 
                      onChange={() => handleCheckboxChange(day)} 
                      className="sr-only" 
                    />
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-2">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">{modalMode === 'CREATE' ? 'Register' : 'Save Changes'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default Doctors;
