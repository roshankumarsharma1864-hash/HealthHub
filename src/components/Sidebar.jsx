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
  HeartPulse
} from 'lucide-react';

export const Sidebar = ({ isCollapsed, setIsCollapsed, isDarkMode, toggleDarkMode }) => {
  const { user, logout, isAdmin, isDoctor, isReceptionist, isPharmacist } = useAuth();

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out of Careflow HMS?')) {
      logout();
    }
  };

  // Define navigation items and filter based on user roles
  const menuItems = [
    {
      path: '/dashboard',
      name: 'Dashboard',
      icon: LayoutDashboard,
      roles: ['Admin', 'Doctor', 'Receptionist', 'Pharmacist', 'Patient']
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
      roles: ['Admin']
    },
    {
      path: '/appointments',
      name: 'Appointments',
      icon: Calendar,
      roles: ['Admin', 'Doctor', 'Receptionist', 'Patient']
    },
    {
      path: '/wards',
      name: 'Wards & Beds',
      icon: Bed,
      roles: ['Admin', 'Receptionist']
    },
    {
      path: '/billing',
      name: 'Billing',
      icon: CreditCard,
      roles: ['Admin', 'Receptionist', 'Patient']
    },
    {
      path: '/pharmacy',
      name: 'Pharmacy',
      icon: Pill,
      roles: ['Admin', 'Pharmacist']
    },
    {
      path: '/prescriptions',
      name: 'Prescriptions',
      icon: FileText,
      roles: ['Admin', 'Doctor', 'Pharmacist', 'Patient']
    },
    {
      path: '/lab-reports',
      name: 'Lab Reports',
      icon: Microscope,
      roles: ['Admin', 'Doctor', 'Patient']
    },
    {
      path: '/settings',
      name: 'Settings',
      icon: Settings,
      roles: ['Admin', 'Doctor', 'Receptionist', 'Pharmacist', 'Patient']
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
      <div className="flex items-center gap-3 px-6 h-16 border-b border-slate-800 text-white font-bold overflow-hidden select-none">
        <HeartPulse className="w-8 h-8 text-teal-400 flex-shrink-0" />
        {!isCollapsed && (
          <span className="text-lg tracking-tight bg-gradient-to-r from-teal-200 to-white bg-clip-text text-transparent">
            Careflow HMS
          </span>
        )}
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
                    ? 'bg-teal-600 text-white font-medium shadow-lg shadow-teal-900/20'
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
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors w-full text-left text-sm"
        >
          {isDarkMode ? <Sun className="w-5 h-5 flex-shrink-0 text-amber-400" /> : <Moon className="w-5 h-5 flex-shrink-0 text-slate-400" />}
          {!isCollapsed && <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>

        {/* User Card */}
        <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-950/40 overflow-hidden">
          <img
            src={user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
            alt="user avatar"
            className="w-10 h-10 rounded-full object-cover border border-slate-700 flex-shrink-0"
          />
          {!isCollapsed && (
            <div className="flex-grow min-w-0">
              <h4 className="text-xs font-semibold text-white truncate">{user?.name}</h4>
              <p className="text-[10px] text-teal-400 font-bold uppercase tracking-wider">{user?.role}</p>
            </div>
          )}
          {!isCollapsed && (
            <button
              onClick={handleLogout}
              className="text-slate-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors flex-shrink-0"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
export default Sidebar;
