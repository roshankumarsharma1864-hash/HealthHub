import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  Calendar,
  Bed,
  CreditCard,
  Pill,
  FileText,
  Microscope,
  Settings,
  LogOut,
  Sun,
  Moon,
  HeartPulse,
  Brain,
  MessageSquare,
  BarChart2,
  Bell,
  User,
  Layers,
  Flame
} from 'lucide-react';

export const Sidebar = ({ isCollapsed, setIsCollapsed, isDarkMode, toggleDarkMode }) => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out of HEALTH HUB?')) {
      logout();
    }
  };

  // Define navigation items exactly matched to the requested list order
  const menuItems = [
    {
      path: '/dashboard',
      name: 'Dashboard',
      icon: LayoutDashboard,
      roles: ['Admin', 'Doctor', 'Receptionist', 'Pharmacist']
    },
    {
      path: '/appointments',
      name: 'Appointments',
      icon: Calendar,
      roles: ['Admin', 'Doctor', 'Receptionist']
    },
    {
      path: '/patients',
      name: 'Patients',
      icon: Users,
      roles: ['Admin', 'Doctor', 'Receptionist']
    },
    {
      path: '/doctors',
      name: 'Doctors',
      icon: Stethoscope,
      roles: ['Admin', 'Doctor', 'Receptionist']
    },
    {
      path: '/departments',
      name: 'Departments',
      icon: Layers,
      roles: ['Admin', 'Doctor', 'Receptionist']
    },
    {
      path: '/pharmacy',
      name: 'Pharmacy',
      icon: Pill,
      roles: ['Admin', 'Pharmacist', 'Doctor']
    },
    {
      path: '/billing',
      name: 'Billing & Payments',
      icon: CreditCard,
      roles: ['Admin', 'Receptionist']
    },
    {
      path: '/reports',
      name: 'Reports & Analytics',
      icon: BarChart2,
      roles: ['Admin', 'Doctor']
    },
    {
      path: '/ai-assistant',
      name: 'AI Assistant',
      icon: Brain,
      roles: ['Admin', 'Doctor', 'Receptionist', 'Pharmacist']
    },
    {
      path: '/messages',
      name: 'Messages',
      icon: MessageSquare,
      roles: ['Admin', 'Doctor', 'Receptionist', 'Pharmacist']
    },
    {
      path: '/calendar',
      name: 'Calendar',
      icon: Calendar,
      roles: ['Admin', 'Doctor', 'Receptionist']
    },
    {
      path: '/notifications',
      name: 'Notifications',
      icon: Bell,
      roles: ['Admin', 'Doctor', 'Receptionist', 'Pharmacist']
    },
    {
      path: '/emergency',
      name: 'Emergency',
      icon: Flame,
      roles: ['Admin', 'Doctor', 'Receptionist']
    },
    {
      path: '/bed-management',
      name: 'Bed Management',
      icon: Bed,
      roles: ['Admin', 'Receptionist', 'Doctor']
    },
    {
      path: '/laboratory',
      name: 'Laboratory',
      icon: Microscope,
      roles: ['Admin', 'Doctor']
    },
    {
      path: '/settings',
      name: 'Settings',
      icon: Settings,
      roles: ['Admin', 'Doctor', 'Receptionist', 'Pharmacist']
    },
    {
      path: '/profile',
      name: 'Profile',
      icon: User,
      roles: ['Admin', 'Doctor', 'Receptionist', 'Pharmacist']
    }
  ];

  // Filter items matching current user's role
  const activeRole = user?.role || 'Patient';
  const visibleItems = menuItems.filter(item => item.roles.includes(activeRole));

  return (
    <aside
      className={`fixed top-0 left-0 h-full z-30 flex flex-col bg-slate-900 text-slate-350 border-r border-slate-800 transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand header */}
      <div className="flex flex-col justify-center px-6 h-20 border-b border-slate-800 text-white font-bold overflow-hidden select-none">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0 shadow-md">
            <HeartPulse className="w-5.5 h-5.5 text-white" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-extrabold tracking-tight text-white leading-tight">
                HEALTH HUB
              </span>
              <span className="text-[9px] text-slate-400 font-semibold tracking-wider uppercase leading-none mt-0.5">
                Hospital Management System
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-grow py-6 px-3 flex flex-col gap-1 overflow-y-auto">
        {visibleItems.map(item => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-150 group text-sm select-none ${
                  isActive
                    ? 'bg-blue-600 text-white font-medium shadow-lg shadow-blue-900/20'
                    : 'hover:bg-slate-800 hover:text-slate-150'
                }`
              }
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span>{item.name}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Profile & Mode Toggles */}
      <div className="p-4 border-t border-slate-800 flex flex-col gap-3">
        {/* Dark/Light mode toggle */}
        <button
          onClick={toggleDarkMode}
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-400 hover:text-slate-205 hover:bg-slate-800 transition-colors w-full text-left text-sm cursor-pointer select-none"
        >
          {isDarkMode ? <Sun className="w-5 h-5 flex-shrink-0 text-amber-400" /> : <Moon className="w-5 h-5 flex-shrink-0 text-slate-400" />}
          {!isCollapsed && <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>

        {/* User Card */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/40 overflow-hidden border border-slate-800/40 select-none">
          <div className="relative flex-shrink-0">
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
              alt="user avatar"
              className="w-10 h-10 rounded-full object-cover border border-slate-700"
            />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-slate-900" />
          </div>
          {!isCollapsed && (
            <div className="flex-grow min-w-0">
              <h4 className="text-xs font-bold text-white truncate">{user?.name || 'Admin'}</h4>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                {user?.role === 'Admin' ? 'Super Administrator' : user?.role || 'Staff Member'}
              </p>
              <div className="flex items-center gap-1 mt-1 text-[9px] text-emerald-400 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Online</span>
              </div>
            </div>
          )}
          {!isCollapsed && (
            <button
              onClick={handleLogout}
              className="text-slate-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors flex-shrink-0 cursor-pointer"
              title="Logout"
            >
              <LogOut className="w-4.5 h-4.5" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
