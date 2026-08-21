import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { departmentService, doctorService } from '../services/hmsServices.js';
import { Plus, Edit2, Trash2, Heart, Brain, Activity, Baby, Stethoscope, Sparkles, Flame, Eye, Smile, Users, UserCheck, Calendar } from 'lucide-react';
import { Button, Input, Select, Card, Badge, Modal } from '../components/UI.jsx';

export const Departments = () => {
  const { user, isAdmin } = useAuth();
  const toast = useToast();

  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('CREATE');
  const [editingDeptId, setEditingDeptId] = useState(null);

  const [form, setForm] = useState({
    name: '', icon: 'Stethoscope', headDoctorId: '', docCount: 2, patientCount: 30, todayAppts: 4
  });

  const loadData = async () => {
    try {
      const deptsList = await departmentService.getAll();
      const docsList = await doctorService.getAll();
      setDepartments(deptsList);
      setDoctors(docsList);
    } catch (err) {
      toast.error('Failed to load departments data.');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalMode === 'CREATE') {
        await departmentService.create(form, user.id);
        toast.success(`Department "${form.name}" created successfully.`);
      } else {
        await departmentService.update(editingDeptId, form, user.id);
        toast.success('Department updated successfully.');
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
      name: '', icon: 'Stethoscope', headDoctorId: doctors[0]?.id || '', docCount: 1, patientCount: 15, todayAppts: 2
    });
    setIsModalOpen(true);
  };

  const openEditModal = (dept) => {
    setModalMode('EDIT');
    setEditingDeptId(dept.id);
    setForm({
      name: dept.name,
      icon: dept.icon,
      headDoctorId: dept.headDoctorId,
      docCount: dept.docCount,
      patientCount: dept.patientCount,
      todayAppts: dept.todayAppts
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this department?')) return;
    try {
      await departmentService.delete(id, user.id);
      toast.success('Department deleted.');
      loadData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Helper to map icon names to Lucide icons
  const getIcon = (iconName) => {
    switch (iconName) {
      case 'Heart': return Heart;
      case 'Brain': return Brain;
      case 'Activity': return Activity;
      case 'Baby': return Baby;
      case 'Stethoscope': return Stethoscope;
      case 'Sparkles': return Sparkles;
      case 'Flame': return Flame;
      case 'Eye': return Eye;
      case 'Smile': return Smile;
      default: return Stethoscope;
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center select-none">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">Specialty Departments</h1>
          <p className="text-slate-400 text-xs mt-1">Review department workload statistics and clinical operations.</p>
        </div>
        {isAdmin && (
          <Button size="sm" variant="primary" icon={Plus} onClick={openCreateModal}>
            Add Department
          </Button>
        )}
      </div>

      {/* Grid of Department Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {departments.map((dept) => {
          const IconComponent = getIcon(dept.icon);
          return (
            <Card
              key={dept.id}
              className="flex flex-col justify-between hover:scale-[1.02] hover:shadow-premium transition-all duration-200"
              headerActions={isAdmin && (
                <div className="flex items-center gap-1 select-none">
                  <button
                    onClick={() => openEditModal(dept)}
                    className="text-slate-400 hover:text-primary-650 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(dept.id)}
                    className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            >
              <div>
                <div className="flex items-center gap-3 mb-4 select-none">
                  <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-950/20 text-primary-600 border border-primary-100 dark:border-primary-900/50 flex items-center justify-center flex-shrink-0">
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-800 dark:text-white leading-tight">{dept.name}</h3>
                    <span className="text-[9px] text-slate-405 font-bold uppercase tracking-wider block mt-0.5">Specialty Ward</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2.5 text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center justify-between">
                    <span>Clinical Head:</span>
                    <span className="font-bold text-slate-750 dark:text-slate-200">
                      Dr. {dept.headDoctor?.name || 'Unassigned'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-50 dark:border-slate-750/30 pt-2.5 mt-1.5">
                    <span className="flex items-center gap-1"><UserCheck className="w-3.5 h-3.5" /> Staff Doctors:</span>
                    <span className="font-bold text-slate-750 dark:text-slate-200">{dept.docCount} Doctors</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> Patient Intake:</span>
                    <span className="font-bold text-slate-750 dark:text-slate-200">{dept.patientCount} Patients</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Today Appts:</span>
                    <Badge variant="premium">{dept.todayAppts} Slots</Badge>
                  </div>
                </div>
              </div>

              <Button 
                size="sm" 
                variant="secondary" 
                className="mt-6 w-full select-none"
                onClick={() => toast.info(`Viewing details for ${dept.name} department.`)}
              >
                View Details
              </Button>
            </Card>
          );
        })}
      </div>

      {/* CREATE/EDIT DEPT MODAL */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalMode === 'CREATE' ? 'Add Specialty Department' : 'Edit Department Settings'}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input 
            label="Department Name" 
            id="dept-name" 
            value={form.name} 
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Neurology" 
            required 
          />
          <Select 
            label="Icon Representative" 
            id="dept-icon" 
            value={form.icon} 
            onChange={(e) => setForm({ ...form, icon: e.target.value })}
            options={['Heart', 'Brain', 'Activity', 'Baby', 'Stethoscope', 'Sparkles', 'Flame', 'Eye', 'Smile'].map(i => ({ value: i, label: i }))}
          />
          <Select 
            label="Department Head Doctor" 
            id="dept-head" 
            value={form.headDoctorId} 
            onChange={(e) => setForm({ ...form, headDoctorId: e.target.value })}
            options={[
              { value: '', label: '-- Choose Head Clinician --' },
              ...doctors.map(d => ({ value: d.id, label: `Dr. ${d.name} (${d.specialization})` }))
            ]}
            required
          />
          <div className="grid grid-cols-3 gap-3">
            <Input 
              label="Staff Count" 
              id="dept-docs" 
              type="number"
              value={form.docCount} 
              onChange={(e) => setForm({ ...form, docCount: Number(e.target.value) })}
              required 
            />
            <Input 
              label="Patients Count" 
              id="dept-pats" 
              type="number"
              value={form.patientCount} 
              onChange={(e) => setForm({ ...form, patientCount: Number(e.target.value) })}
              required 
            />
            <Input 
              label="Today Appointments" 
              id="dept-appts" 
              type="number"
              value={form.todayAppts} 
              onChange={(e) => setForm({ ...form, todayAppts: Number(e.target.value) })}
              required 
            />
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">{modalMode === 'CREATE' ? 'Add Department' : 'Save Changes'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Departments;
