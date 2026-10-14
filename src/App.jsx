import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import { useToast } from './context/ToastContext.jsx';
import Sidebar from './components/Sidebar.jsx';
import Header from './components/Header.jsx';
import Login from './pages/Login.jsx';
import SignUp from './pages/SignUp.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import RoleSelection from './pages/RoleSelection.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Patients from './pages/Patients.jsx';
import Doctors from './pages/Doctors.jsx';
import Appointments from './pages/Appointments.jsx';
import BedManagement from './pages/BedManagement.jsx';
import Billing from './pages/Billing.jsx';
import Pharmacy from './pages/Pharmacy.jsx';
import Prescriptions from './pages/Prescriptions.jsx';
import Laboratory from './pages/Laboratory.jsx';
import LabReports from './pages/LabReports.jsx';
import Wards from './pages/Wards.jsx';
import Departments from './pages/Departments.jsx';
import Emergency from './pages/Emergency.jsx';
import AIAssistant from './pages/AIAssistant.jsx';
import Messages from './pages/Messages.jsx';
import CalendarPage from './pages/CalendarPage.jsx';
import Reports from './pages/Reports.jsx';
import Notifications from './pages/Notifications.jsx';
import Profile from './pages/Profile.jsx';
import Settings from './pages/Settings.jsx';
import Loader from './components/Loader.jsx';
import NotFound from './components/NotFound.jsx';

// Role-Guard wrapper
const RouteGuard = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const toast = useToast();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 text-primary-600 font-bold text-sm">
        HEALTH HUB Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    toast.error(`Access Denied: Your role (${user.role}) is unauthorized to view ${location.pathname}.`);
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export const App = () => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [routeLoading, setRouteLoading] = useState(false);

  // Trigger loader on location/tab changes for ~3 seconds to complete at least a full loop
  useEffect(() => {
    setRouteLoading(true);
    const timer = setTimeout(() => {
      setRouteLoading(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  // Initialize theme from system settings
  useEffect(() => {
    const savedTheme = localStorage.getItem('hms_theme') || 'light';
    const activeDark = savedTheme === 'dark';
    setIsDarkMode(activeDark);
    if (activeDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const nextDark = !isDarkMode;
    setIsDarkMode(nextDark);
    const themeStr = nextDark ? 'dark' : 'light';
    localStorage.setItem('hms_theme', themeStr);
    
    if (nextDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 text-primary-600 font-bold text-sm select-none animate-pulse">
        Booting HEALTH HUB Core...
      </div>
    );
  }

  return (
    <div className="h-full min-h-screen bg-slate-50 text-slate-800 dark:bg-slate-900 dark:text-slate-100 transition-colors duration-200">
      {routeLoading && <Loader />}
      {isAuthenticated ? (
        <div className="flex h-full min-h-screen">
          {/* Collapsible Sidebar */}
          <Sidebar
            isCollapsed={isSidebarCollapsed}
            setIsCollapsed={setIsSidebarCollapsed}
            isDarkMode={isDarkMode}
            toggleDarkMode={toggleDarkMode}
          />

          {/* Main Dashboard Layout grid */}
          <div
            className={`flex-grow flex flex-col min-h-screen transition-all duration-300 ${
              isSidebarCollapsed ? 'pl-20' : 'pl-64'
            }`}
          >
            {/* Header navbar */}
            <Header
              isCollapsed={isSidebarCollapsed}
              setIsCollapsed={setIsSidebarCollapsed}
            />

            {/* Inner Route view panels */}
            <main className="flex-grow p-6 overflow-y-auto">
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/login" element={<Navigate to="/dashboard" replace />} />
                <Route path="/signup" element={<Navigate to="/dashboard" replace />} />
                <Route path="/forgot-password" element={<Navigate to="/dashboard" replace />} />
                <Route path="/role-selection" element={<Navigate to="/dashboard" replace />} />

                
                <Route 
                  path="/patients" 
                  element={
                    <RouteGuard allowedRoles={['Admin', 'Doctor', 'Receptionist']}>
                      <Patients />
                    </RouteGuard>
                  } 
                />
                <Route 
                  path="/patients/:id" 
                  element={
                    <RouteGuard allowedRoles={['Admin', 'Doctor', 'Receptionist']}>
                      <Patients />
                    </RouteGuard>
                  } 
                />
                
                <Route 
                  path="/doctors" 
                  element={
                    <RouteGuard allowedRoles={['Admin', 'Doctor', 'Receptionist']}>
                      <Doctors />
                    </RouteGuard>
                  } 
                />
                <Route 
                  path="/doctors/:id" 
                  element={
                    <RouteGuard allowedRoles={['Admin', 'Doctor', 'Receptionist']}>
                      <Doctors />
                    </RouteGuard>
                  } 
                />
                
                <Route 
                  path="/appointments" 
                  element={
                    <RouteGuard allowedRoles={['Admin', 'Doctor', 'Receptionist']}>
                      <Appointments />
                    </RouteGuard>
                  } 
                />
                
                <Route 
                  path="/beds" 
                  element={
                    <RouteGuard allowedRoles={['Admin', 'Receptionist', 'Doctor']}>
                      <BedManagement />
                    </RouteGuard>
                  } 
                />
                <Route 
                  path="/wards" 
                  element={
                    <RouteGuard allowedRoles={['Admin', 'Receptionist', 'Doctor']}>
                      <Wards />
                    </RouteGuard>
                  } 
                />
                <Route 
                  path="/bed-management" 
                  element={
                    <RouteGuard allowedRoles={['Admin', 'Receptionist', 'Doctor']}>
                      <BedManagement />
                    </RouteGuard>
                  } 
                />
                
                <Route 
                  path="/billing" 
                  element={
                    <RouteGuard allowedRoles={['Admin', 'Receptionist']}>
                      <Billing />
                    </RouteGuard>
                  } 
                />
                
                <Route 
                  path="/pharmacy" 
                  element={
                    <RouteGuard allowedRoles={['Admin', 'Pharmacist', 'Doctor']}>
                      <Pharmacy />
                    </RouteGuard>
                  } 
                />
                
                <Route 
                  path="/prescriptions" 
                  element={
                    <RouteGuard allowedRoles={['Admin', 'Doctor', 'Pharmacist']}>
                      <Prescriptions />
                    </RouteGuard>
                  } 
                />
                
                <Route 
                  path="/laboratory" 
                  element={
                    <RouteGuard allowedRoles={['Admin', 'Doctor']}>
                      <Laboratory />
                    </RouteGuard>
                  } 
                />
                <Route 
                  path="/lab-reports" 
                  element={
                    <RouteGuard allowedRoles={['Admin', 'Doctor']}>
                      <LabReports />
                    </RouteGuard>
                  } 
                />

                <Route 
                  path="/departments" 
                  element={
                    <RouteGuard allowedRoles={['Admin', 'Doctor', 'Receptionist']}>
                      <Departments />
                    </RouteGuard>
                  } 
                />

                <Route 
                  path="/emergency" 
                  element={
                    <RouteGuard allowedRoles={['Admin', 'Doctor', 'Receptionist']}>
                      <Emergency />
                    </RouteGuard>
                  } 
                />

                <Route 
                  path="/ai-assistant" 
                  element={
                    <RouteGuard allowedRoles={['Admin', 'Doctor', 'Receptionist', 'Pharmacist']}>
                      <AIAssistant />
                    </RouteGuard>
                  } 
                />

                <Route 
                  path="/messages" 
                  element={
                    <RouteGuard allowedRoles={['Admin', 'Doctor', 'Receptionist', 'Pharmacist']}>
                      <Messages />
                    </RouteGuard>
                  } 
                />

                <Route 
                  path="/calendar" 
                  element={
                    <RouteGuard allowedRoles={['Admin', 'Doctor', 'Receptionist']}>
                      <CalendarPage />
                    </RouteGuard>
                  } 
                />

                <Route 
                  path="/reports" 
                  element={
                    <RouteGuard allowedRoles={['Admin', 'Doctor']}>
                      <Reports />
                    </RouteGuard>
                  } 
                />

                <Route 
                  path="/notifications" 
                  element={
                    <RouteGuard allowedRoles={['Admin', 'Doctor', 'Receptionist', 'Pharmacist']}>
                      <Notifications />
                    </RouteGuard>
                  } 
                />

                <Route 
                  path="/profile" 
                  element={
                    <RouteGuard allowedRoles={['Admin', 'Doctor', 'Receptionist', 'Pharmacist']}>
                      <Profile />
                    </RouteGuard>
                  } 
                />
                
                <Route 
                  path="/settings" 
                  element={<Settings isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />} 
                />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
          </div>
        </div>
      ) : (
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/role-selection" element={<RoleSelection />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      )}
    </div>
  );
};

export default App;

