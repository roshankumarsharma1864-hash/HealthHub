import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { 
  patientService, 
  doctorService, 
  appointmentService, 
  billingService, 
  activityService,
  emergencyService,
  departmentService
} from '../services/hmsServices.js';
import { 
  Users, 
  Calendar, 
  UserCheck, 
  CreditCard, 
  AlertTriangle, 
  Plus, 
  Clock, 
  Heart,
  TrendingUp,
  Brain,
  ShieldAlert,
  Flame,
  ArrowRight,
  Sparkles,
  PlusCircle,
  FileText,
  Activity,
  Layers,
  ChevronDown,
  MoreVertical,
  MapPin,
  Bot,
  Pill,
  Bed
} from 'lucide-react';
import { Card, Badge, Button, Modal, Input, Select, Textarea } from '../components/UI.jsx';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import hospitalBanner from '../assets/health_hub_hospital.jpg';

export const Dashboard = () => {
  const { user, isAdmin, isDoctor, isReceptionist } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  // Quick Action Modal states
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  
  // Quick Action Form states
  const [patientForm, setPatientForm] = useState({ name: '', age: '', gender: 'Male', phone: '', address: '', bloodGroup: 'O+', allergies: '', emergencyContact: '' });
  const [appointmentForm, setAppointmentForm] = useState({ patientId: '', doctorId: '', date: '', time: '09:00 AM', reason: '' });
  const [patientsList, setPatientsList] = useState([]);
  const [doctorsList, setDoctorsList] = useState([]);

  // Timeframe selector for analytics
  const [timeframe, setTimeframe] = useState('This Week');

  const loadDashboardData = async () => {
    try {
      const patients = await patientService.getAll();
      const doctors = await doctorService.getAll();
      setPatientsList(patients);
      setDoctorsList(doctors);
    } catch (err) {
      console.error('Error fetching dashboard states:', err);
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

  // 1. Line Chart Data - Appointment Analytics
  const analyticsData = [
    { name: 'Mon', appointments: 180 },
    { name: 'Tue', appointments: 290 },
    { name: 'Wed', appointments: 210 },
    { name: 'Thu', appointments: 310 },
    { name: 'Fri', appointments: 350 },
    { name: 'Sat', appointments: 400 },
    { name: 'Sun', appointments: 450 }
  ];

  // 2. Donut Chart Data - Department Distribution
  const departmentData = [
    { name: 'Cardiology', value: 25 },
    { name: 'Neurology', value: 20 },
    { name: 'Orthopedics', value: 15 },
    { name: 'Pediatrics', value: 15 },
    { name: 'General Medicine', value: 10 },
    { name: 'Dermatology', value: 8 },
    { name: 'Others', value: 7 }
  ];

  const DEPT_COLORS = ['#2563eb', '#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#94a3b8'];

  // Recent Appointments Table rows matched to the reference image
  const recentAppointments = [
    {
      patient: 'Priya Sharma',
      patientId: '#P10023',
      doctor: 'Dr. Anjali Verma',
      doctorSub: 'Cardiologist',
      department: 'Cardiology',
      date: '17 May 2024',
      time: '10:30 AM',
      status: 'Confirmed'
    },
    {
      patient: 'Rahul Mehta',
      patientId: '#P10024',
      doctor: 'Dr. Vikram Singh',
      doctorSub: 'Neurologist',
      department: 'Neurology',
      date: '17 May 2024',
      time: '11:00 AM',
      status: 'Pending'
    },
    {
      patient: 'Sneha Patel',
      patientId: '#P10025',
      doctor: 'Dr. Neha Kapoor',
      doctorSub: 'Pediatrician',
      department: 'Pediatrics',
      date: '17 May 2024',
      time: '11:30 AM',
      status: 'Confirmed'
    },
    {
      patient: 'Amit Kumar',
      patientId: '#P10026',
      doctor: 'Dr. Rajesh Gupta',
      doctorSub: 'Orthopedic',
      department: 'Orthopedics',
      date: '17 May 2024',
      time: '12:00 PM',
      status: 'Cancelled'
    }
  ];

  // Announcements list matched to requirements
  const announcementsList = [
    {
      title: 'Free Mega Health Checkup Camp',
      date: '20 May 2024',
      location: 'Community Center',
      img: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=100'
    },
    {
      title: 'New Cardiology OPD Starting',
      date: '18 May 2024',
      location: 'HEALTH HUB Hospital',
      img: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=100'
    },
    {
      title: 'Hospital Staff Meeting',
      date: '15 May 2024',
      location: 'Board Room',
      img: 'https://images.unsplash.com/photo-1540317580384-e5d43616b9aa?w=100'
    },
    {
      title: 'Blood Donation Camp',
      date: '12 May 2024',
      location: 'Conference Hall',
      img: 'https://images.unsplash.com/photo-1615461066841-6116e61058f4?w=100'
    }
  ];

  // Quick Action triggers mapping
  const quickActions = [
    { label: 'New Appointment', icon: Calendar, color: 'bg-blue-50 text-blue-600', action: () => setIsAppointmentModalOpen(true) },
    { label: 'Add Patient', icon: Users, color: 'bg-emerald-50 text-emerald-600', action: () => setIsPatientModalOpen(true) },
    { label: 'Billing', icon: CreditCard, color: 'bg-purple-50 text-purple-600', action: () => navigate('/billing') },
    { label: 'Add Doctor', icon: UserCheck, color: 'bg-amber-50 text-amber-600', action: () => navigate('/doctors') },
    { label: 'Pharmacy', icon: Pill, color: 'bg-teal-50 text-teal-650', action: () => navigate('/pharmacy') },
    { label: 'Reports', icon: FileText, color: 'bg-red-50 text-red-600', action: () => navigate('/reports') }
  ];

  return (
    <div className="flex flex-col gap-6 animate-fade-in select-none">
      
      {/* 1. Hospital Hero Banner */}
      <div 
        className="w-full h-64 md:h-72 rounded-2xl overflow-hidden bg-cover bg-center relative shadow-premium flex flex-col justify-end p-6 md:p-8"
        style={{ backgroundImage: `url(${hospitalBanner})` }}
      >
        <div className="absolute inset-0 bg-slate-950/45 z-0" />
        <div className="relative z-10 text-white flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
              Good Morning, Admin! 👋
            </h1>
            <p className="text-slate-100 text-sm mt-1.5 font-medium max-w-xl">
              Welcome back to HEALTH HUB Hospital Dashboard
            </p>
          </div>

          {/* Banner Statistics */}
          <div className="flex flex-wrap gap-3 mt-2 md:mt-0 select-none">
            <div className="bg-white/10 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs">
              <span className="font-extrabold text-blue-300">10K+</span>
              <span className="text-slate-200">Happy Patients</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs">
              <span className="font-extrabold text-blue-300">200+</span>
              <span className="text-slate-200">Expert Doctors</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs">
              <span className="font-extrabold text-blue-300">50+</span>
              <span className="text-slate-200">Departments</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs">
              <span className="font-extrabold text-blue-300">98%</span>
              <span className="text-slate-200">Satisfaction Rate</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
        <Card className="flex flex-col justify-between hover:-translate-y-0.5 hover:shadow-premium duration-150 transition-all">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Total Patients</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-800 dark:text-white">12,540</span>
            <p className="text-[9px] text-emerald-500 font-extrabold mt-1">↑ 8.5% from last month</p>
          </div>
        </Card>

        <Card className="flex flex-col justify-between hover:-translate-y-0.5 hover:shadow-premium duration-150 transition-all">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Today's Appts</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-800 dark:text-white">128</span>
            <p className="text-[9px] text-emerald-500 font-extrabold mt-1">↑ 12.3% from yesterday</p>
          </div>
        </Card>

        <Card className="flex flex-col justify-between hover:-translate-y-0.5 hover:shadow-premium duration-150 transition-all">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Total Doctors</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-800 dark:text-white">156</span>
            <p className="text-[9px] text-emerald-500 font-extrabold mt-1">↑ 3.2% from last month</p>
          </div>
        </Card>

        <Card className="flex flex-col justify-between hover:-translate-y-0.5 hover:shadow-premium duration-150 transition-all">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Available Doctors</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-800 dark:text-white">42</span>
            <p className="text-[9px] text-emerald-600 font-extrabold mt-1">Available Now</p>
          </div>
        </Card>

        <Card className="flex flex-col justify-between hover:-translate-y-0.5 hover:shadow-premium duration-150 transition-all">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Hospital Revenue</span>
            <div className="w-8 h-8 rounded-lg bg-red-50 text-red-650 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl font-black text-slate-800 dark:text-white">₹8,45,231</span>
            <p className="text-[9px] text-emerald-500 font-extrabold mt-1">↑ 15.8% from last month</p>
          </div>
        </Card>

        <Card className="flex flex-col justify-between hover:-translate-y-0.5 hover:shadow-premium duration-150 transition-all">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Emergency Cases</span>
            <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-800 dark:text-white">7</span>
            <p className="text-[9px] text-red-600 font-extrabold mt-1">Critical Cases</p>
          </div>
        </Card>
      </div>

      {/* 3. Charts and AI Insights row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Appointment Analytics Chart */}
        <Card 
          title="Appointment Analytics" 
          subtitle={
            <div className="flex items-center gap-1">
              <span className="text-slate-800 dark:text-white font-black text-sm">Total Appointments: 1,246</span>
              <span className="text-[10px] text-emerald-500 font-bold ml-1">↑ 18.6%</span>
            </div>
          }
          className="lg:col-span-1"
          headerActions={
            <Select
              id="analytics-timeframe"
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              options={[{ value: 'This Week', label: 'This Week' }, { value: 'This Month', label: 'This Month' }, { value: 'This Year', label: 'This Year' }]}
              className="py-1 px-2 border-slate-200"
            />
          }
        >
          <div className="h-60 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analyticsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={10} />
                <Tooltip />
                <Line type="monotone" dataKey="appointments" stroke="#2563eb" strokeWidth={3.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Department Distribution Donut */}
        <Card 
          title="Department Distribution" 
          subtitle="Clinical case allocation distribution"
          className="lg:col-span-1"
          headerActions={
            <button 
              onClick={() => navigate('/departments')}
              className="text-xs text-blue-600 hover:text-blue-750 font-bold cursor-pointer hover:underline"
            >
              View All
            </button>
          }
        >
          <div className="h-48 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={departmentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {departmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={DEPT_COLORS[index % DEPT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Legend */}
          <div className="grid grid-cols-2 gap-2 mt-4 text-[9px] font-bold text-slate-500 max-h-16 overflow-y-auto">
            {departmentData.map((d, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: DEPT_COLORS[idx] }} />
                <span className="truncate">{d.name} ({d.value}%)</span>
              </div>
            ))}
          </div>
        </Card>

        {/* AI Insights Card */}
        <Card 
          title={
            <div className="flex items-center gap-2 select-none">
              <span>AI Insights</span>
              <Badge variant="premium">NEW</Badge>
            </div>
          }
          subtitle="HEALTH HUB Support recommendations"
          className="lg:col-span-1 bg-gradient-to-br from-blue-50/50 to-purple-50/20 border-blue-105"
        >
          <div className="flex flex-col gap-3.5 mt-2">
            
            {/* Robot illustration head */}
            <div className="flex items-center gap-2.5 p-2 bg-blue-50/70 rounded-xl border border-blue-100">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                <Bot className="w-5 h-5" />
              </div>
              <p className="text-[10px] text-blue-800 font-bold leading-tight">
                Medicare AI Support assistant active. Real-time updates parsed.
              </p>
            </div>

            <div className="flex flex-col gap-2.5 text-xs text-slate-650 font-semibold pl-1">
              <div className="flex items-start gap-2">
                <span className="text-blue-500 font-bold">•</span>
                <span>Patient appointments are expected to increase by 18% tomorrow.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-500 font-bold">•</span>
                <span>Cardiology department has the highest patient demand.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-500 font-bold">•</span>
                <span>5 appointments require confirmation.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-500 font-bold">•</span>
                <span>Pharmacy inventory for 3 medicines is running low.</span>
              </div>
            </div>

            <Button 
              size="sm" 
              variant="primary" 
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 shadow-md font-bold mt-2" 
              onClick={() => navigate('/ai-assistant')}
            >
              View AI Recommendations
            </Button>
          </div>
        </Card>
      </div>

      {/* 4. Recent Appointments Table & Sidebar columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Appointments Card */}
        <Card 
          title="Recent Appointments" 
          subtitle="Clinical consultations logs" 
          className="lg:col-span-2 p-0 overflow-hidden"
          headerActions={
            <button 
              onClick={() => navigate('/appointments')}
              className="text-xs text-blue-600 hover:text-blue-750 font-bold cursor-pointer hover:underline"
            >
              View All
            </button>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs select-none">
              <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 font-bold text-slate-400 uppercase">
                <tr>
                  <th className="px-5 py-3">Patient</th>
                  <th className="px-5 py-3">Doctor</th>
                  <th className="px-5 py-3">Department</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Time</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-750/50">
                {recentAppointments.map((apt, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-750/10 transition-colors">
                    <td className="px-5 py-3 font-bold text-slate-800 dark:text-slate-200">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-650 flex items-center justify-center font-bold text-[10px]">
                          {apt.patient.charAt(0)}
                        </div>
                        <div>
                          <div>{apt.patient}</div>
                          <span className="text-[9px] text-slate-400 block font-mono mt-0.5">{apt.patientId}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-bold text-slate-750 dark:text-slate-350">{apt.doctor}</p>
                      <p className="text-[9px] text-slate-400">{apt.doctorSub}</p>
                    </td>
                    <td className="px-5 py-3 text-slate-500 font-semibold">{apt.department}</td>
                    <td className="px-5 py-3 text-slate-500">{apt.date}</td>
                    <td className="px-5 py-3 text-slate-500">{apt.time}</td>
                    <td className="px-5 py-3">
                      <Badge variant={
                        apt.status === 'Confirmed' ? 'success' : 
                        apt.status === 'Pending' ? 'warning' : 
                        apt.status === 'Cancelled' ? 'danger' : 'neutral'
                      }>
                        {apt.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <button className="text-slate-400 hover:text-slate-655 p-1 cursor-pointer">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Announcements List */}
        <Card 
          title="Announcements" 
          subtitle="Hospital events notifications"
          className="lg:col-span-1"
          headerActions={
            <button 
              onClick={() => toast.info('Announcements catalog is up-to-date.')}
              className="text-xs text-blue-600 hover:text-blue-750 font-bold cursor-pointer hover:underline"
            >
              View All
            </button>
          }
        >
          <div className="flex flex-col gap-3.5 mt-2">
            {announcementsList.map((ann, idx) => (
              <div key={idx} className="flex gap-3 hover:bg-slate-50 dark:hover:bg-slate-750/30 p-2 rounded-xl border border-transparent hover:border-slate-100 transition-all select-none">
                <img 
                  src={ann.img} 
                  alt={ann.title} 
                  className="w-12 h-12 rounded-xl object-cover border border-slate-100 flex-shrink-0"
                />
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-white leading-snug truncate">
                    {ann.title}
                  </h4>
                  <div className="flex items-center gap-1.5 text-[9px] text-slate-400 mt-1 font-semibold">
                    <span>{ann.date}</span>
                    <span>•</span>
                    <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3 text-slate-400" /> {ann.location}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* 5. Quick Actions grid & bottom bed stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Quick Actions widget */}
        <Card title="Quick Actions" subtitle="One-click operations panel" className="lg:col-span-1">
          <div className="grid grid-cols-3 gap-3 select-none">
            {quickActions.map((act, idx) => {
              const Icon = act.icon;
              return (
                <button
                  key={idx}
                  onClick={act.action}
                  className="p-3.5 border border-slate-100 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-750 transition-all duration-150 active:scale-[0.96] hover:scale-[1.02] cursor-pointer hover:shadow-sm"
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${act.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] text-slate-650 font-bold text-center leading-tight">
                    {act.label}
                  </span>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Bed Management Summary */}
        <Card title="Bed Management Summary" subtitle="Hospital ward occupancy layout" className="lg:col-span-1 select-none">
          <div className="grid grid-cols-2 gap-3.5">
            <div className="p-3 border border-slate-100 dark:border-slate-800 rounded-2xl flex flex-col justify-between">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Total Beds</span>
              <div className="flex items-baseline justify-between mt-2.5">
                <span className="text-xl font-black text-slate-800 dark:text-white">250</span>
                <Bed className="w-5 h-5 text-blue-500" />
              </div>
            </div>
            <div className="p-3 border border-slate-100 dark:border-slate-800 rounded-2xl flex flex-col justify-between">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-bold">Occupied Beds</span>
              <div className="flex items-baseline justify-between mt-2.5">
                <span className="text-xl font-black text-red-500">180</span>
                <Badge variant="danger">72% Occupied</Badge>
              </div>
            </div>
            <div className="p-3 border border-slate-100 dark:border-slate-800 rounded-2xl flex flex-col justify-between">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-bold">Available Beds</span>
              <div className="flex items-baseline justify-between mt-2.5">
                <span className="text-xl font-black text-emerald-600">70</span>
                <Badge variant="success">28% Available</Badge>
              </div>
            </div>
            <div className="p-3 border border-slate-100 dark:border-slate-800 rounded-2xl flex flex-col justify-between">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-bold">ICU Beds</span>
              <div className="flex items-baseline justify-between mt-2.5">
                <span className="text-xl font-black text-indigo-600">25</span>
                <Badge variant="info">10 Available</Badge>
              </div>
            </div>
          </div>
        </Card>

        {/* Compact Calendar Overview */}
        <Card 
          title="Calendar Overview" 
          subtitle="May 2024 schedules"
          className="lg:col-span-1 select-none"
          headerActions={
            <div className="flex gap-1.5 text-[9px] font-bold uppercase select-none">
              <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-650 cursor-pointer">Month</span>
              <span className="px-1.5 py-0.5 rounded text-slate-400 cursor-pointer">Week</span>
              <span className="px-1.5 py-0.5 rounded text-slate-400 cursor-pointer">Day</span>
            </div>
          }
        >
          <div className="grid grid-cols-7 gap-2 text-center text-[10px] mt-2 font-bold">
            {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(day => (
              <span key={day} className="text-slate-400 uppercase tracking-wider">{day}</span>
            ))}
            {Array.from({ length: 31 }, (_, i) => i + 1).slice(12, 19).map(day => (
              <div 
                key={day} 
                className={`py-2 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer relative ${
                  day === 17 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20' 
                    : 'text-slate-650 hover:bg-slate-50'
                }`}
              >
                <span>{day}</span>
                {day === 15 && <span className="absolute bottom-1 w-1 h-1 bg-red-500 rounded-full" />}
                {day === 17 && <span className="absolute bottom-1 w-1 h-1 bg-white rounded-full" />}
                {day === 18 && <span className="absolute bottom-1 w-1 h-1 bg-emerald-500 rounded-full" />}
              </div>
            ))}
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
            label="Phone" 
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
            placeholder="Sunita Kumar (+91 98450 12244)" 
            className="col-span-2"
            required
          />
          <Textarea 
            label="Address" 
            id="p-addr" 
            value={patientForm.address} 
            onChange={(e) => setPatientForm({ ...patientForm, address: e.target.value })}
            placeholder="Plot 104, 12th Main, Indiranagar, Bengaluru, KA" 
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
