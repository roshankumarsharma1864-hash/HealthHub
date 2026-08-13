import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { 
  patientService, 
  doctorService, 
  appointmentService, 
  wardService, 
  billingService, 
  pharmacyService, 
  activityService 
} from '../services/hmsServices.js';
import { 
  Users, 
  Calendar, 
  Bed, 
  CreditCard, 
  AlertTriangle, 
  Plus, 
  Clock, 
  Heart,
  TrendingUp,
  Activity,
  ArrowRight
} from 'lucide-react';
import { Card, Badge, Button, Modal, Input, Select, Textarea } from '../components/UI.jsx';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

export const Dashboard = () => {
  const { user, isAdmin, isDoctor, isReceptionist, isPharmacist } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  // KPI Metrics States
  const [stats, setStats] = useState({
    totalPatients: 0,
    todayAppointments: 0,
    availableBeds: 0,
    monthlyRevenue: 0,
    pendingBills: 0,
    lowStockMedicines: 0
  });

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  // Quick Action Modal states
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  
  // Quick Action Form states
  const [patientForm, setPatientForm] = useState({ name: '', age: '', gender: 'Male', phone: '', address: '', bloodGroup: 'O+', allergies: '', emergencyContact: '' });
  const [appointmentForm, setAppointmentForm] = useState({ patientId: '', doctorId: '', date: '', time: '09:00 AM', reason: '' });
  const [patientsList, setPatientsList] = useState([]);
  const [doctorsList, setDoctorsList] = useState([]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const patients = await patientService.getAll();
      const appointments = await appointmentService.getAll();
      const wards = await wardService.getAll();
      const bills = await billingService.getAll();
      const medicines = await pharmacyService.getAll();
      const logs = await activityService.getAll();
      const doctors = await doctorService.getAll();

      setPatientsList(patients);
      setDoctorsList(doctors);

      // Calculations
      const todayStr = new Date().toISOString().split('T')[0];
      const todayApts = appointments.filter(a => a.date === todayStr && a.status !== 'Cancelled');
      
      const totalBeds = wards.reduce((sum, w) => sum + w.totalBeds, 0);
      const occupiedBeds = wards.reduce((sum, w) => sum + w.occupiedBeds, 0);
      const availableBeds = Math.max(0, totalBeds - occupiedBeds);

      // Monthly revenue sum (Bills issued in the current month)
      const currentMonth = new Date().getMonth();
      const paidMonthlyBills = bills.filter(b => {
        const billDate = new Date(b.date);
        return billDate.getMonth() === currentMonth && b.status === 'Paid';
      });
      const monthlyRevenue = paidMonthlyBills.reduce((sum, b) => sum + b.total, 0);
      const pendingBills = bills.filter(b => b.status === 'Unpaid').length;

      const lowStock = medicines.filter(m => m.isLowStock).length;

      setStats({
        totalPatients: patients.length,
        todayAppointments: todayApts.length,
        availableBeds,
        monthlyRevenue,
        pendingBills,
        lowStockMedicines: lowStock
      });

      setActivities(logs.slice(0, 5));
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Quick Action: Add Patient Submit
  const handlePatientSubmit = async (e) => {
    e.preventDefault();
    try {
      await patientService.create(patientForm, user.id);
      toast.success(`Registered Patient "${patientForm.name}" successfully!`);
      setIsPatientModalOpen(false);
      setPatientForm({ name: '', age: '', gender: 'Male', phone: '', address: '', bloodGroup: 'O+', allergies: '', emergencyContact: '' });
      loadDashboardData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Quick Action: Book Appointment Submit
  const handleAppointmentSubmit = async (e) => {
    e.preventDefault();
    try {
      await appointmentService.create(appointmentForm, user.id);
      toast.success('Booked appointment successfully!');
      setIsAppointmentModalOpen(false);
      setAppointmentForm({ patientId: '', doctorId: '', date: '', time: '09:00 AM', reason: '' });
      loadDashboardData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Static Data for Dashboard Charts
  const trendData = [
    { name: 'Mon', patients: 12 },
    { name: 'Tue', patients: 19 },
    { name: 'Wed', patients: 15 },
    { name: 'Thu', patients: 22 },
    { name: 'Fri', patients: 30 },
    { name: 'Sat', patients: 8 },
    { name: 'Sun', patients: 5 }
  ];

  const departmentData = [
    { name: 'Cardiology', value: 35 },
    { name: 'Pediatrics', value: 25 },
    { name: 'Neurology', value: 20 },
    { name: 'Orthopedics', value: 20 }
  ];

  const COLORS = ['#0f766e', '#14b8a6', '#f59e0b', '#8b5cf6'];

  const revenueData = [
    { name: 'May', revenue: 4200 },
    { name: 'Jun', revenue: 5800 },
    { name: 'Jul', revenue: 7100 },
    { name: 'Aug', revenue: 9500 }
  ];

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-teal-700 to-teal-900 rounded-2xl p-6 md:p-8 text-white relative overflow-hidden shadow-premium">
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-600 rounded-full filter blur-3xl opacity-30 translate-x-12 -translate-y-12" />
        <div className="relative z-10">
          <Badge variant="info" className="mb-3 bg-white/20 text-white border-transparent">
            Careflow Operational Core
          </Badge>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Good afternoon, {user?.name}
          </h1>
          <p className="text-teal-100 text-sm mt-2 max-w-xl">
            You are logged in as <span className="font-bold uppercase text-teal-300">{user?.role}</span>. Here is the operational overview for Careflow Medical Center today.
          </p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
        {/* Total Patients */}
        <Card className="flex flex-col justify-between hover:-translate-y-1 hover:border-teal-300/30">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Patients</span>
            <Users className="w-5 h-5 text-teal-600" />
          </div>
          <div className="mt-4">
            <span className="text-2xl font-bold text-slate-800 dark:text-white">{stats.totalPatients}</span>
            <p className="text-[10px] text-emerald-500 font-bold mt-1">↑ Active database</p>
          </div>
        </Card>

        {/* Today's Appointments */}
        <Card className="flex flex-col justify-between hover:-translate-y-1 hover:border-teal-300/30">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Today's Appointments</span>
            <Calendar className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="mt-4">
            <span className="text-2xl font-bold text-slate-800 dark:text-white">{stats.todayAppointments}</span>
            <p className="text-[10px] text-slate-400 mt-1">Today scheduled</p>
          </div>
        </Card>

        {/* Available Beds */}
        <Card className="flex flex-col justify-between hover:-translate-y-1 hover:border-teal-300/30">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Available Beds</span>
            <Bed className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="mt-4">
            <span className="text-2xl font-bold text-slate-800 dark:text-white">{stats.availableBeds}</span>
            <p className="text-[10px] text-emerald-600 font-bold mt-1">Admissions ready</p>
          </div>
        </Card>

        {/* Monthly Revenue */}
        <Card className="flex flex-col justify-between hover:-translate-y-1 hover:border-teal-300/30">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Monthly Revenue</span>
            <CreditCard className="w-5 h-5 text-teal-600" />
          </div>
          <div className="mt-4">
            <span className="text-2xl font-bold text-slate-800 dark:text-white">${stats.monthlyRevenue.toFixed(0)}</span>
            <p className="text-[10px] text-emerald-500 font-bold mt-1">↑ Current month</p>
          </div>
        </Card>

        {/* Pending Bills */}
        <Card className="flex flex-col justify-between hover:-translate-y-1 hover:border-teal-300/30">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Pending Bills</span>
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          </div>
          <div className="mt-4">
            <span className="text-2xl font-bold text-slate-800 dark:text-white">{stats.pendingBills}</span>
            <p className="text-[10px] text-amber-600 font-bold mt-1">Awaiting payment</p>
          </div>
        </Card>

        {/* Low Stock Pharmacy */}
        <Card className="flex flex-col justify-between hover:-translate-y-1 hover:border-teal-300/30">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Low Stock Meds</span>
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <div className="mt-4">
            <span className="text-2xl font-bold text-slate-800 dark:text-white">{stats.lowStockMedicines}</span>
            <p className="text-[10px] text-red-500 font-bold mt-1">Needs attention</p>
          </div>
        </Card>
      </div>

      {/* Dynamic Actions Quick panel (Show actions matching role) */}
      {(isAdmin || isReceptionist || isDoctor) && (
        <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-4 rounded-2xl shadow-premium">
          <span className="text-xs font-bold uppercase text-slate-400 tracking-wider mr-2 select-none">Quick Actions Panel:</span>
          {(isAdmin || isReceptionist) && (
            <>
              <Button size="sm" variant="primary" icon={Plus} onClick={() => setIsPatientModalOpen(true)}>
                Add Patient
              </Button>
              <Button size="sm" variant="outline" icon={Calendar} onClick={() => setIsAppointmentModalOpen(true)}>
                Book Appointment
              </Button>
            </>
          )}
          {isDoctor && (
            <Button size="sm" variant="secondary" icon={Clock} onClick={() => navigate('/prescriptions')}>
              Write Prescription
            </Button>
          )}
          {isAdmin && (
            <Button size="sm" variant="outline" icon={CreditCard} onClick={() => navigate('/billing')}>
              Generate Bill Invoice
            </Button>
          )}
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient Admission Trends */}
        <Card title="Patient Admissions trend" subtitle="Total admissions recorded during the week" className="lg:col-span-2">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip />
                <Line type="monotone" dataKey="patients" stroke="#0f766e" strokeWidth={3} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Department Wise Patient Distribution */}
        <Card title="Department Distribution" subtitle="Active clinical cases allocation">
          <div className="h-60 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={departmentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {departmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Legend */}
          <div className="grid grid-cols-2 gap-2 mt-4 text-[10px] font-semibold text-slate-500">
            {departmentData.map((d, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx] }} />
                <span>{d.name} ({d.value}%)</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Bottom Row: Revenue and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Over Time */}
        <Card title="Monthly Revenue Report" subtitle="Total collected patient fees by month">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip formatter={(value) => `$${value}`} />
                <Bar dataKey="revenue" fill="#0f766e" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Recent Activity Feed */}
        <Card title="Hospital Activity Feed" subtitle="Live updates from clinical logs" headerActions={
          <Button size="sm" variant="secondary" onClick={() => navigate('/settings')}>
            View Audit Log
          </Button>
        }>
          <div className="flex flex-col gap-4">
            {activities.map((act) => (
              <div key={act.id} className="flex items-start gap-4 p-3 hover:bg-slate-50 dark:hover:bg-slate-750/30 rounded-xl transition-all border border-transparent hover:border-slate-100">
                <div className="w-8 h-8 rounded-full bg-teal-50 dark:bg-teal-950/20 text-teal-600 flex items-center justify-center flex-shrink-0 font-bold text-xs select-none">
                  {act.action.substring(0, 1)}
                </div>
                <div className="flex-grow min-w-0">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">{act.details}</h4>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                    <span className="font-bold text-teal-600">{act.user?.name}</span>
                    <span>•</span>
                    <span>{new Date(act.timestamp).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
            {activities.length === 0 && (
              <div className="text-center text-slate-400 py-8 text-sm">
                No recent database transactions recorded.
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* QUICK PATIENT MODAL */}
      <Modal isOpen={isPatientModalOpen} onClose={() => setIsPatientModalOpen(false)} title="Register New Patient Profile">
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
            label="Phone" 
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
          <Input 
            label="Allergies" 
            id="p-allergies" 
            value={patientForm.allergies} 
            onChange={(e) => setPatientForm({ ...patientForm, allergies: e.target.value })}
            placeholder="e.g. Penicillin, Nuts (optional)" 
            className="col-span-2"
          />
          <Input 
            label="Emergency Contact" 
            id="p-emergency" 
            value={patientForm.emergencyContact} 
            onChange={(e) => setPatientForm({ ...patientForm, emergencyContact: e.target.value })}
            placeholder="Name & phone number" 
            className="col-span-2"
            required
          />
          <Textarea 
            label="Address" 
            id="p-addr" 
            value={patientForm.address} 
            onChange={(e) => setPatientForm({ ...patientForm, address: e.target.value })}
            placeholder="Street address, city" 
            className="col-span-2"
            required
          />
          <div className="col-span-2 flex justify-end gap-2 mt-2">
            <Button type="button" variant="secondary" onClick={() => setIsPatientModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Create Patient</Button>
          </div>
        </form>
      </Modal>

      {/* QUICK APPOINTMENT MODAL */}
      <Modal isOpen={isAppointmentModalOpen} onClose={() => setIsAppointmentModalOpen(false)} title="Book Appointment Slot">
        <form onSubmit={handleAppointmentSubmit} className="flex flex-col gap-4">
          <Select
            label="Select Patient"
            id="apt-pat"
            value={appointmentForm.patientId}
            onChange={(e) => setAppointmentForm({ ...appointmentForm, patientId: e.target.value })}
            required
            options={[
              { value: '', label: '-- Choose Patient --' },
              ...patientsList.map(p => ({ value: p.id, label: `${p.name} (ID: ${p.id.substring(0, 8)})` }))
            ]}
          />
          <Select
            label="Select Doctor"
            id="apt-doc"
            value={appointmentForm.doctorId}
            onChange={(e) => setAppointmentForm({ ...appointmentForm, doctorId: e.target.value })}
            required
            options={[
              { value: '', label: '-- Choose Doctor --' },
              ...doctorsList.map(d => ({ value: d.id, label: `${d.name} (${d.specialization})` }))
            ]}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Select Date"
              id="apt-date"
              type="date"
              value={appointmentForm.date}
              onChange={(e) => setAppointmentForm({ ...appointmentForm, date: e.target.value })}
              required
            />
            <Select
              label="Select Time Slot"
              id="apt-time"
              value={appointmentForm.time}
              onChange={(e) => setAppointmentForm({ ...appointmentForm, time: e.target.value })}
              required
              options={[
                '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
                '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM'
              ].map(t => ({ value: t, label: t }))}
            />
          </div>
          <Textarea
            label="Reason for Visit"
            id="apt-reason"
            value={appointmentForm.reason}
            onChange={(e) => setAppointmentForm({ ...appointmentForm, reason: e.target.value })}
            placeholder="Clinical details, regular checkup, orthopedic review..."
            required
          />
          <div className="flex justify-end gap-2 mt-2">
            <Button type="button" variant="secondary" onClick={() => setIsAppointmentModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Confirm Schedule</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default Dashboard;
