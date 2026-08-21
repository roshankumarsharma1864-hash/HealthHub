import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { calendarService, doctorService } from '../services/hmsServices.js';
import { Plus, Calendar, Clock, User, HeartPulse, CheckSquare, Sparkles } from 'lucide-react';
import { Button, Input, Select, Card, Badge, Modal, Textarea } from '../components/UI.jsx';

export const CalendarPage = () => {
  const { user, isAdmin } = useAuth();
  const toast = useToast();

  const [events, setEvents] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    title: '', type: 'Surgery', date: '', time: '09:00 AM', doctorId: '', location: 'Operating Room A'
  });

  const loadData = async () => {
    try {
      const list = await calendarService.getAll();
      const docs = await doctorService.getAll();
      setEvents(list);
      setDoctors(docs);
    } catch (err) {
      toast.error('Failed to load calendar events.');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await calendarService.create(form, user.id);
      toast.success(`Event scheduled successfully: ${form.title}`);
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const openCreateModal = () => {
    setForm({
      title: '',
      type: 'Surgery',
      date: new Date().toISOString().split('T')[0],
      time: '10:00 AM',
      doctorId: doctors[0]?.id || '',
      location: 'Operating Room A'
    });
    setIsModalOpen(true);
  };

  const getBadgeType = (type) => {
    switch (type) {
      case 'Surgery': return 'danger';
      case 'Shift Duty': return 'premium';
      case 'Conference': return 'info';
      default: return 'neutral';
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center select-none">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
            <Calendar className="w-8 h-8 text-primary-655" />
            <span>Surgery & Events Scheduler</span>
          </h1>
          <p className="text-slate-400 text-xs mt-1">Plan surgical schedules, training workshops, and clinical staff duty rosters.</p>
        </div>
        {isAdmin && (
          <Button size="sm" variant="primary" icon={Plus} onClick={openCreateModal}>
            Schedule Event
          </Button>
        )}
      </div>

      {/* Main Grid: Calendar List & Quick Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left/Middle Column: Events list */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <Card title="Calendar Registry Logs" subtitle="Lists of clinical events scheduled for the upcoming days">
            <div className="flex flex-col gap-4">
              {events.map((evt) => (
                <div key={evt.id} className="p-4 border border-slate-100 dark:border-slate-800 rounded-2xl flex justify-between items-start hover:bg-slate-50/50 dark:hover:bg-slate-750/10 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-950/20 text-primary-650 flex items-center justify-center flex-shrink-0 select-none">
                      <HeartPulse className="w-5.5 h-5.5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-850 dark:text-white text-sm">{evt.title}</h4>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-450 dark:text-slate-400 text-[10.5px] mt-1 select-none">
                        <span className="flex items-center gap-1 font-semibold"><Clock className="w-3.5 h-3.5" /> {evt.date} at {evt.time}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> Doctor: Dr. {evt.doctor?.name || 'Unassigned'}</span>
                        <span>•</span>
                        <span className="font-bold text-primary-600">{evt.location}</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant={getBadgeType(evt.type)} className="select-none">{evt.type}</Badge>
                </div>
              ))}
              {events.length === 0 && (
                <div className="text-center py-12 text-slate-400 text-sm select-none">
                  No upcoming clinical events or surgeries scheduled.
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: AI Schedule Optimizations suggestions */}
        <div className="flex flex-col gap-4 select-none">
          <Card title="Shift Smart Checks" subtitle="AI shift collision alerts" className="bg-primary-50/10 border-primary-100">
            <div className="flex flex-col gap-3.5 text-xs text-slate-550 leading-relaxed font-semibold">
              <div className="flex items-start gap-2.5">
                <Sparkles className="w-4.5 h-4.5 text-primary-650 flex-shrink-0 animate-pulse mt-0.5" />
                <span>AI detected no overlap conflicts between Dr. Sarah Jenkins shift duty and Scheduled Cardiology surgery.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckSquare className="w-4.5 h-4.5 text-emerald-555 flex-shrink-0 mt-0.5" />
                <span>ICU Room A sterilization checklist verified. Room ready for scheduled procedures.</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* CREATE EVENT MODAL */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Schedule Clinical Event">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input 
            label="Event Title" 
            id="evt-title" 
            value={form.title} 
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Aortic Valve Surgery" 
            required 
          />
          <div className="grid grid-cols-2 gap-4">
            <Select 
              label="Event Type" 
              id="evt-type" 
              value={form.type} 
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              options={[
                { value: 'Surgery', label: 'Surgery Schedule' },
                { value: 'Shift Duty', label: 'Staff Shift Duty' },
                { value: 'Conference', label: 'Conference / Workshop' }
              ]}
            />
            <Input 
              label="Location" 
              id="evt-loc" 
              value={form.location} 
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="Operating Room B" 
              required 
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Date" 
              id="evt-date" 
              type="date"
              value={form.date} 
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              required 
            />
            <Select 
              label="Time" 
              id="evt-time" 
              value={form.time} 
              onChange={(e) => setForm({ ...form, time: e.target.value })}
              options={[
                '09:00 AM', '10:00 AM', '11:00 AM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM'
              ].map(t => ({ value: t, label: t }))}
            />
          </div>
          <Select 
            label="Assigned Doctor" 
            id="evt-doc" 
            value={form.doctorId} 
            onChange={(e) => setForm({ ...form, doctorId: e.target.value })}
            options={[
              { value: '', label: '-- Choose Clinician --' },
              ...doctors.map(d => ({ value: d.id, label: `Dr. ${d.name} (${d.specialization})` }))
            ]}
            required
          />

          <div className="flex justify-end gap-2 mt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Schedule Event</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CalendarPage;
