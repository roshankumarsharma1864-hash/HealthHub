import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import { useToast } from './context/ToastContext.jsx';
import Sidebar from './components/Sidebar.jsx';
import Header from './components/Header.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Patients from './pages/Patients.jsx';
import Doctors from './pages/Doctors.jsx';
import Appointments from './pages/Appointments.jsx';
import Wards from './pages/Wards.jsx';
import Billing from './pages/Billing.jsx';
import Pharmacy from './pages/Pharmacy.jsx';
import Prescriptions from './pages/Prescriptions.jsx';
import LabReports from './pages/LabReports.jsx';
import Settings from './pages/Settings.jsx';
import Loader from './components/Loader.jsx';

// Role-Guard wrapper
const RouteGuard = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const toast = useToast();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 text-teal-650 font-bold text-sm">
        Careflow HMS Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Notify access block
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

  // Trigger Lottie loader on location/tab changes
  useEffect(() => {
    setRouteLoading(true);
    const timer = setTimeout(() => {
      setRouteLoading(false);
    }, 4000);
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 text-teal-600 font-bold text-sm select-none">
        Booting Careflow HMS Core...
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
                <Route path="/dashboard" element={<Dashboard />} />
                
                <Route 
                  path="/patients" 
                  element={
                    <RouteGuard allowedRoles={['Admin', 'Doctor', 'Receptionist']}>
                      <Patients />
                    </RouteGuard>
                  } 
                />
                
                <Route 
                  path="/doctors" 
                  element={
                    <RouteGuard allowedRoles={['Admin']}>
                      <Doctors />
                    </RouteGuard>
                  } 
                />
                
                <Route 
                  path="/appointments" 
                  element={
                    <RouteGuard allowedRoles={['Admin', 'Doctor', 'Receptionist', 'Patient']}>
                      <Appointments />
                    </RouteGuard>
                  } 
                />
                
                <Route 
                  path="/wards" 
                  element={
                    <RouteGuard allowedRoles={['Admin', 'Receptionist']}>
                      <Wards />
                    </RouteGuard>
                  } 
                />
                
                <Route 
                  path="/billing" 
                  element={
                    <RouteGuard allowedRoles={['Admin', 'Receptionist', 'Patient']}>
                      <Billing />
                    </RouteGuard>
                  } 
                />
                
                <Route 
                  path="/pharmacy" 
                  element={
                    <RouteGuard allowedRoles={['Admin', 'Pharmacist']}>
                      <Pharmacy />
                    </RouteGuard>
                  } 
                />
                
                <Route 
                  path="/prescriptions" 
                  element={
                    <RouteGuard allowedRoles={['Admin', 'Doctor', 'Pharmacist', 'Patient']}>
                      <Prescriptions />
                    </RouteGuard>
                  } 
                />
                
                <Route 
                  path="/lab-reports" 
                  element={
                    <RouteGuard allowedRoles={['Admin', 'Doctor', 'Patient']}>
                      <LabReports />
                    </RouteGuard>
                  } 
                />
                
                <Route 
                  path="/settings" 
                  element={<Settings isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />} 
                />

                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </main>
          </div>
        </div>
      ) : (
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      )}
    </div>
  );
};
export default App;
