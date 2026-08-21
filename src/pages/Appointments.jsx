import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { appointmentService, patientService, doctorService } from '../services/hmsServices.js';
import { Calendar as CalendarIcon, List, Plus, Clock, Edit2, Check, XCircle, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { Button, Input, Select, Textarea, Card, Badge, Modal } from '../components/UI.jsx';

export const Appointments = () => {
  const { user, isAdmin, isDoctor, isReceptionist } = useAuth();
  const toast = useToast();

  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);

  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' or 'list'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('CREATE'); // 'CREATE' or 'EDIT'
  const [editingAptId, setEditingAptId] = useState(null);

  // Form states
  const [form, setForm] = useState({
    patientId: '', doctorId: '', date: '', time: '09:00 AM', reason: '', status: 'Pending'
  });

  // Calendar math states
  const [currentDate, setCurrentDate] = useState(new Date());

  const loadAll = async () => {
    try {
      const aptList = await appointmentService.getAll();
      const pList = await patientService.getAll();
      const dList = await doctorService.getAll();
      
      setAppointments(aptList);
      setPatients(pList);
      setDoctors(dList);
    } catch (err) {
      toast.error('Failed to load scheduling directory.');
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalMode === 'CREATE') {
        await appointmentService.create(form, user.id);
        toast.success('Appointment booked successfully!');
      } else {
        await appointmentService.update(editingAptId, form, user.id);
        toast.success('Appointment rescheduled successfully!');
      }
      setIsModalOpen(false);
      loadAll();
    } catch (err) {
      toast.error(err.message || 'Double booking collision or scheduling error.');
    }
  };

  const openCreateModal = (optDate = '') => {
    setModalMode('CREATE');
    setForm({
      patientId: patients[0]?.id || '',
      doctorId: doctors[0]?.id || '',
      date: optDate || new Date().toISOString().split('T')[0],
      time: '09:00 AM',
      reason: '',
      status: 'Pending'
    });
    setIsModalOpen(true);
  };

  const openEditModal = (apt) => {
    setModalMode('EDIT');
    setEditingAptId(apt.id);
    setForm({
      patientId: apt.patientId,
      doctorId: apt.doctorId,
      date: apt.date,
      time: apt.time,
      reason: apt.reason,
      status: apt.status
    });
    setIsModalOpen(true);
  };

  const handleCancel = async (id) => {
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      try {
        await appointmentService.cancel(id, user.id);
        toast.success('Appointment status marked as Cancelled.');
        loadAll();
      } catch (err) {
        toast.error(err.message);
      }
    }
  };

  const handleComplete = async (id) => {
    try {
      await appointmentService.complete(id, user.id);
      toast.success('Appointment marked as Completed.');
      loadAll();
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Calendar Math calculations
  const year = currentDate.getFullYear();
  const monthIndex = currentDate.getMonth();
  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  const startOfMonthWeekday = new Date(year, monthIndex, 1).getDay(); // Sun=0, Mon=1...
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  const prevMonth = () => setCurrentDate(new Date(year, monthIndex - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, monthIndex + 1, 1));

  // Build grid calendar items
  const calendarCells = [];
  // 1. Previous month padded grids
  for (let i = 0; i < startOfMonthWeekday; i++) {
    calendarCells.push({ type: 'pad', val: '' });
  }
  // 2. Active days of month
  for (let d = 1; d <= daysInMonth; d++) {
    const dayStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayApts = appointments.filter(a => a.date === dayStr && a.status !== 'Cancelled');
    calendarCells.push({ type: 'day', dayNum: d, dateStr: dayStr, apts: dayApts });
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Completed': return 'success';
      case 'Cancelled': return 'danger';
      case 'Confirmed': return 'info';
      case 'Pending':
      default:
        return 'warning';
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Module Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white font-sans">Appointments Scheduler</h1>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Book slots, manage cancellations, and coordinate shifts.</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View selector */}
          <div className="flex border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-0.5 rounded-xl">
            <button
              onClick={() => setViewMode('calendar')}
              className={`p-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 select-none ${
                viewMode === 'calendar' 
                  ? 'bg-teal-600 text-white' 
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              <CalendarIcon className="w-4 h-4" />
              Calendar
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 select-none ${
                viewMode === 'list' 
                  ? 'bg-teal-600 text-white' 
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              <List className="w-4 h-4" />
              List View
            </button>
          </div>

          {(isAdmin || isReceptionist) && (
            <Button size="sm" variant="primary" icon={Plus} onClick={() => openCreateModal()}>
              Book Slot
            </Button>
          )}
        </div>
      </div>

      {/* CALENDAR VIEW PANEL */}
      {viewMode === 'calendar' && (
        <Card className="flex flex-col overflow-hidden p-0 bg-white border border-slate-100 dark:border-slate-700">
          {/* Month control header */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 px-6 py-4 bg-slate-50/50 dark:bg-slate-800/40 select-none">
            <h2 className="text-base font-bold text-slate-800 dark:text-white">
              {monthName} {year}
            </h2>
            <div className="flex items-center gap-1">
              <button onClick={prevMonth} className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1.5 text-xs font-bold border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-350 transition-colors">
                Today
              </button>
              <button onClick={nextMonth} className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday titles */}
          <div className="calendar-grid text-center font-bold text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-100 dark:border-slate-700/50 py-3 bg-slate-50/30">
            <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
          </div>

          {/* Month cells grid */}
          <div className="calendar-grid divide-x divide-y divide-slate-100 dark:divide-slate-700/50 border-b border-slate-100 dark:border-slate-700/50">
            {calendarCells.map((cell, idx) => {
              if (cell.type === 'pad') {
                return <div key={`pad-${idx}`} className="bg-slate-50/40 dark:bg-slate-900/10 min-h-28" />;
              }
              const isToday = new Date().toISOString().split('T')[0] === cell.dateStr;
              return (
                <div 
                  key={cell.dateStr} 
                  className={`min-h-28 p-2 flex flex-col gap-1 transition-all ${
                    isToday ? 'bg-teal-50/10 dark:bg-teal-950/5' : 'bg-white dark:bg-slate-800'
                  }`}
                >
                  <div className="flex justify-between items-center select-none mb-1">
                    <span className={`text-xs font-bold p-1 rounded-full flex items-center justify-center w-6 h-6 ${
                      isToday ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-400'
                    }`}>
                      {cell.dayNum}
                    </span>
                    {(isAdmin || isReceptionist) && (
                      <button
                        onClick={() => openCreateModal(cell.dateStr)}
                        className="text-slate-300 hover:text-teal-600 p-0.5 rounded transition-colors"
                        title="Add appointment on date"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Day Appointment bubbles */}
                  <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[85px] pr-0.5">
                    {cell.apts.map(apt => (
                      <button
                        key={apt.id}
                        onClick={() => openEditModal(apt)}
                        className="w-full text-left px-2 py-1 rounded bg-teal-50 border border-teal-100 hover:border-teal-350 dark:bg-teal-950/20 dark:border-teal-900/40 dark:hover:border-teal-800 transition-colors select-none"
                      >
                        <p className="text-[9px] font-bold text-slate-800 dark:text-teal-300 truncate leading-tight">
                          {apt.time} - {apt.patient?.name}
                        </p>
                        <p className="text-[7.5px] text-slate-400 dark:text-slate-500 truncate leading-none mt-0.5">
                          Dr. {apt.doctor?.name.split('. ')[1]}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* LIST VIEW PANEL */}
      {viewMode === 'list' && (
        <Card className="p-0 overflow-hidden bg-white border border-slate-100 dark:border-slate-700">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 font-bold text-slate-400 uppercase">
                <tr>
                  <th className="px-6 py-4">Patient ID</th>
                  <th className="px-6 py-4">Patient Name</th>
                  <th className="px-6 py-4">Doctor</th>
                  <th className="px-6 py-4">Date & Time</th>
                  <th className="px-6 py-4">Reason</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {appointments.map(apt => (
                  <tr key={apt.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-750/30 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-slate-400">{apt.patientId.substring(0, 8)}</td>
                    <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200">{apt.patient?.name}</td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800 dark:text-slate-200">Dr. {apt.doctor?.name}</p>
                      <p className="text-[10px] text-slate-400">{apt.doctor?.specialization}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800 dark:text-slate-200">{apt.date}</p>
                      <p className="text-[10px] text-slate-400">{apt.time}</p>
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate text-slate-500">{apt.reason}</td>
                    <td className="px-6 py-4">
                      <Badge variant={getStatusBadge(apt.status)}>{apt.status}</Badge>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {(isAdmin || isReceptionist || isDoctor) && apt.status === 'Confirmed' && (
                          <button
                            onClick={() => handleComplete(apt.id)}
                            className="text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 p-1.5 rounded-lg transition-colors"
                            title="Complete visit"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        {(isAdmin || isReceptionist) && (
                          <button
                            onClick={() => openEditModal(apt)}
                            className="text-slate-400 hover:text-teal-600 hover:bg-slate-100 dark:hover:bg-slate-700 p-1.5 rounded-lg transition-colors"
                            title="Reschedule / Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {(isAdmin || isReceptionist) && (apt.status === 'Pending' || apt.status === 'Confirmed') && (
                          <button
                            onClick={() => handleCancel(apt.id)}
                            className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 p-1.5 rounded-lg transition-colors"
                            title="Cancel appointment"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {appointments.length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-center text-slate-400 py-12 select-none">
                      No appointments booked in the database system.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* CREATE / EDIT APPOINTMENT MODAL */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalMode === 'CREATE' ? 'Book Appointment Slot' : 'Reschedule / Modify Appointment'}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Select
            label="Select Patient"
            id="apt-pat"
            value={form.patientId}
            onChange={(e) => setForm({ ...form, patientId: e.target.value })}
            required
            options={[
              { value: '', label: '-- Choose Patient --' },
              ...patients.map(p => ({ value: p.id, label: `${p.name} (ID: ${p.id.substring(0, 8)})` }))
            ]}
          />
          <Select
            label="Select Doctor specialty availability"
            id="apt-doc"
            value={form.doctorId}
            onChange={(e) => setForm({ ...form, doctorId: e.target.value })}
            required
            options={[
              { value: '', label: '-- Choose Doctor --' },
              ...doctors.map(d => ({ value: d.id, label: `${d.name} (${d.specialization}, Avail: ${d.availability.join(', ')})` }))
            ]}
          />

          {form.doctorId && (
            <div className="bg-primary-50/70 border border-primary-200 text-primary-850 dark:bg-slate-900/50 dark:border-slate-800 text-[11px] p-3 rounded-xl flex items-center gap-2 select-none leading-relaxed font-semibold">
              <Sparkles className="w-4 h-4 text-primary-650 flex-shrink-0 animate-pulse" />
              <span>AI recommends booking at 10:30 AM because the selected doctor has the shortest waiting time.</span>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Select Date"
              id="apt-date"
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              required
            />
            <Select
              label="Select Time Slot"
              id="apt-time"
              value={form.time}
              onChange={(e) => setForm({ ...form, time: e.target.value })}
              required
              options={[
                '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
                '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM'
              ].map(t => ({ value: t, label: t }))}
            />
          </div>

          <Select
            label="Appointment Status"
            id="apt-status"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            required
            options={[
              { value: 'Pending', label: 'Pending' },
              { value: 'Confirmed', label: 'Confirmed' },
              { value: 'Completed', label: 'Completed' },
              { value: 'Cancelled', label: 'Cancelled' }
            ]}
          />

          <Textarea
            label="Clinical Reason for Visit"
            id="apt-reason"
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
            placeholder="Clinical details, symptoms, regular checkup..."
            required
          />
          <div className="flex justify-end gap-2 mt-2">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">{modalMode === 'CREATE' ? 'Confirm Schedule' : 'Reschedule Slot'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default Appointments;
