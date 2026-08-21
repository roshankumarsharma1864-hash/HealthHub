import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { patientService, doctorService, appointmentService, activityService } from '../services/hmsServices.js';
import { 
  Search, 
  Bell, 
  Menu, 
  User, 
  ArrowRight, 
  X,
  Stethoscope,
  Calendar,
  LogOut,
  Settings,
  MessageSquare,
  ChevronDown
} from 'lucide-react';

export const Header = ({ isCollapsed, setIsCollapsed }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const searchRef = useRef(null);
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  // Close menus on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearchDropdown(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch recent notifications/logs
  const loadNotifications = async () => {
    try {
      const logs = await activityService.getAll();
      setNotifications(logs.slice(0, 8)); // Limit to 8 items
      setUnreadNotifications(logs.length > 0 ? 3 : 0); // Fake unread
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 15000); // Check every 15s
    return () => clearInterval(interval);
  }, []);

  // Run Global Search across multiple indexes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const performSearch = async () => {
      const q = searchQuery.toLowerCase();
      const results = [];

      // 1. Search Patients
      const patients = await patientService.getAll();
      const matchedPatients = patients.filter(
        p => p.name.toLowerCase().includes(q) || p.phone.includes(q) || p.id.toLowerCase().includes(q)
      );
      matchedPatients.slice(0, 3).forEach(p => {
        results.push({
          type: 'patient',
          title: p.name,
          subtitle: `Patient (Age: ${p.age}, Blood: ${p.bloodGroup})`,
          link: `/patients?id=${p.id}`,
          icon: User
        });
      });

      // 2. Search Doctors
      const doctors = await doctorService.getAll();
      const matchedDoctors = doctors.filter(
        d => d.name.toLowerCase().includes(q) || d.specialization.toLowerCase().includes(q)
      );
      matchedDoctors.slice(0, 3).forEach(d => {
        results.push({
          type: 'doctor',
          title: d.name,
          subtitle: `Doctor (Specialist: ${d.specialization})`,
          link: `/doctors?id=${d.id}`,
          icon: Stethoscope
        });
      });

      // 3. Search Appointments
      const appointments = await appointmentService.getAll();
      const matchedApts = appointments.filter(
        a => a.patient?.name.toLowerCase().includes(q) || a.doctor?.name.toLowerCase().includes(q)
      );
      matchedApts.slice(0, 3).forEach(a => {
        results.push({
          type: 'appointment',
          title: `Appt: ${a.patient?.name} w/ Dr. ${a.doctor?.name}`,
          subtitle: `${a.date} at ${a.time} - [${a.status}]`,
          link: `/appointments`,
          icon: Calendar
        });
      });

      setSearchResults(results);
    };

    const delayDebounce = setTimeout(performSearch, 150);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const handleResultClick = (link) => {
    navigate(link);
    setSearchQuery('');
    setShowSearchDropdown(false);
  };

  return (
    <header className="sticky top-0 right-0 z-20 h-16 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between px-6 shadow-sm">
      {/* Left items */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors cursor-pointer"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Bar */}
        <div ref={searchRef} className="relative hidden md:block w-80">
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search for patients, appointments, doctors..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchDropdown(true);
              }}
              onFocus={() => setShowSearchDropdown(true)}
              className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 hover:border-slate-350 dark:hover:border-slate-600 text-sm pl-10 pr-4 py-2 rounded-xl outline-none focus:bg-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 text-slate-800 dark:text-slate-100 transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Search Dropdown */}
          {showSearchDropdown && searchResults.length > 0 && (
            <div className="absolute top-12 left-0 w-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl shadow-premium dark:shadow-premium-dark p-2 animate-fade-in max-h-80 overflow-y-auto z-50">
              <div className="text-[10px] font-bold text-slate-400 uppercase px-3 py-1 select-none">
                Search Results ({searchResults.length})
              </div>
              {searchResults.map((res, idx) => {
                const ResIcon = res.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => handleResultClick(res.link)}
                    className="w-full flex items-center justify-between text-left p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400 flex items-center justify-center flex-shrink-0">
                        <ResIcon className="w-4.5 h-4.5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{res.title}</h4>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{res.subtitle}</p>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-350 group-hover:text-primary-600 transition-colors opacity-0 group-hover:opacity-100" />
                  </button>
                );
              })}
            </div>
          )}

          {/* Fallback no results */}
          {showSearchDropdown && searchQuery && searchResults.length === 0 && (
            <div className="absolute top-12 left-0 w-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl shadow-premium p-4 text-center text-xs text-slate-400 z-50">
              No medical logs match "{searchQuery}"
            </div>
          )}
        </div>
      </div>

      {/* Right items */}
      <div className="flex items-center gap-4">
        {/* Notifications Bell */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setUnreadNotifications(0);
            }}
            className="text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-755 transition-colors relative cursor-pointer"
          >
            <Bell className="w-5 h-5" />
            {unreadNotifications > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-slate-800" />
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute top-12 right-0 w-80 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl shadow-premium dark:shadow-premium-dark p-2 animate-fade-in z-50">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 px-3 py-2 mb-2 select-none">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200">System Activity Feed</h4>
                <span className="text-[10px] text-primary-600 font-bold uppercase">Live</span>
              </div>
              <div className="max-h-64 overflow-y-auto flex flex-col gap-1 pr-1">
                {notifications.map((log) => (
                  <div
                    key={log.id}
                    className="p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors flex flex-col gap-0.5 text-xs text-left"
                  >
                    <div className="flex justify-between items-center text-[10px] text-primary-600">
                      <span className="font-bold text-primary-600">{log.user?.name} ({log.user?.role})</span>
                      <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-350">{log.details}</p>
                  </div>
                ))}
                {notifications.length === 0 && (
                  <div className="p-4 text-center text-slate-400 text-xs select-none">
                    No recent events logged.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Messages icon */}
        <button
          onClick={() => navigate('/messages')}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-755 transition-colors cursor-pointer"
          title="Messages Lounge"
        >
          <MessageSquare className="w-5 h-5" />
        </button>

        {/* Calendar icon */}
        <button
          onClick={() => navigate('/calendar')}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-755 transition-colors cursor-pointer"
          title="Surgery Calendar"
        >
          <Calendar className="w-5 h-5" />
        </button>

        {/* User Profile dropdown shortcut */}
        <div ref={profileRef} className="relative flex items-center">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-750 p-1.5 rounded-xl transition-all cursor-pointer"
          >
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
              alt="avatar"
              className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700"
            />
            <div className="hidden lg:block text-left select-none pr-1">
              <h4 className="text-xs font-bold text-slate-705 dark:text-slate-200">{user?.name || 'Admin'}</h4>
              <p className="text-[9px] text-slate-400 uppercase tracking-wider">{user?.role === 'Admin' ? 'Super Administrator' : user?.role || 'Staff Member'}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>

          {showProfileMenu && (
            <div className="absolute top-12 right-0 w-48 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl shadow-premium dark:shadow-premium-dark p-1.5 animate-fade-in z-50">
              <button
                onClick={() => { navigate('/profile'); setShowProfileMenu(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-750 text-xs font-medium transition-colors cursor-pointer"
              >
                <User className="w-4 h-4 text-slate-400" />
                My Profile Settings
              </button>
              <button
                onClick={() => { logout(); setShowProfileMenu(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-red-650 hover:bg-red-50 dark:hover:bg-red-950/20 text-xs font-bold transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
