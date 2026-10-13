import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { KEYS, db } from '../services/db.js';
import { resetDemo } from '../services/seedData.js';
import { Plus, UserPlus, ShieldAlert, Sparkles, RefreshCw, Eye, EyeOff, Save, IndianRupee } from 'lucide-react';
import { Button, Input, Select, Card, Badge, Modal, Textarea } from '../components/UI.jsx';
import { INDIAN_HOSPITAL_DEFAULTS } from '../utils/currency.js';

export const Settings = ({ isDarkMode, toggleDarkMode }) => {
  const { user, isAdmin, register } = useAuth();
  const toast = useToast();

  const [usersList, setUsersList] = useState([]);
  const [hProfile, setHProfile] = useState({
    ...INDIAN_HOSPITAL_DEFAULTS
  });

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', role: 'Doctor', phone: '' });

  const loadSettingsData = async () => {
    try {
      const uList = await db.getAll(KEYS.USERS);
      setUsersList(uList);

      const savedSettings = await db.getAll(KEYS.SETTINGS);
      if (savedSettings && !Array.isArray(savedSettings) && savedSettings.hospitalName) {
        setHProfile({ ...INDIAN_HOSPITAL_DEFAULTS, ...savedSettings });
      } else {
        setHProfile({ ...INDIAN_HOSPITAL_DEFAULTS });
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadSettingsData();
  }, []);

  // Update Hospital Profile
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      await db.saveAllRaw(KEYS.SETTINGS, hProfile);
      toast.success('Hospital branding details updated. All exported PDFs will reflect these headers.');
    } catch (err) {
      toast.error('Failed to update hospital profile settings.');
    }
  };

  // Staff User Account CRUD Submits
  const handleUserSubmit = async (e) => {
    e.preventDefault();
    try {
      await register(userForm);
      toast.success(`Staff user "${userForm.name}" created successfully.`);
      setIsUserModalOpen(false);
      setUserForm({ name: '', email: '', password: '', role: 'Doctor', phone: '' });
      loadSettingsData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDeactivate = async (id, currentStatus) => {
    if (id === user.id) {
      toast.warning('You cannot deactivate your own active account session.');
      return;
    }
    try {
      await db.update(KEYS.USERS, id, { isDeactivated: !currentStatus });
      toast.success(`Account status ${!currentStatus ? 'DEACTIVATED' : 'REACTIVATED'}.`);
      loadSettingsData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Reset Demo Data Hook
  const handleResetDemo = async () => {
    if (window.confirm('CRITICAL: This will wipe all patients, appointments, billing transactions, medicine stocks, and custom configurations. The system will seed default clean data. Proceed?')) {
      try {
        await resetDemo();
        toast.success('Database successfully reset. Loading seeded demo values...');
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } catch (err) {
        toast.error('Failed to reset localStorage DB.');
      }
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 animate-fade-in">
      {/* COLUMN 1: Profile & Themes */}
      <div className="xl:col-span-2 flex flex-col gap-6">
        
        {/* Hospital Branding Form */}
        <Card title="Hospital Profile Details" subtitle="Branding details visible in PDF invoices, prescription letterheads, and exports.">
          <form onSubmit={handleProfileSubmit} className="grid grid-cols-2 gap-4">
            <Input
              label="Hospital Name"
              id="h-name"
              value={hProfile.hospitalName}
              onChange={(e) => setHProfile({ ...hProfile, hospitalName: e.target.value })}
              required
              className="col-span-2"
            />
            <Input
              label="Contact Phone"
              id="h-phone"
              value={hProfile.hospitalPhone}
              onChange={(e) => setHProfile({ ...hProfile, hospitalPhone: e.target.value })}
              required
            />
            <Input
              label="Email Address"
              id="h-email"
              type="email"
              value={hProfile.hospitalEmail}
              onChange={(e) => setHProfile({ ...hProfile, hospitalEmail: e.target.value })}
              required
            />
            <Input
              label="Physical Postal Address"
              id="h-addr"
              value={hProfile.hospitalAddress}
              onChange={(e) => setHProfile({ ...hProfile, hospitalAddress: e.target.value })}
              required
              className="col-span-2"
            />
            <Input
              label="Hospital GSTIN (Tax Identification)"
              id="h-gstin"
              value={hProfile.gstin || ''}
              onChange={(e) => setHProfile({ ...hProfile, gstin: e.target.value })}
              placeholder="29AAACH1234M1Z5"
              required
            />
            <Input
              label="Hospital Clinical Reg No."
              id="h-regno"
              value={hProfile.hospRegNo || ''}
              onChange={(e) => setHProfile({ ...hProfile, hospRegNo: e.target.value })}
              placeholder="KA/BLR/MED/2024/9842"
              required
            />
            <Input
              label="Billing Counter UPI VPA (for QR)"
              id="h-upi"
              value={hProfile.upiVpa || ''}
              onChange={(e) => setHProfile({ ...hProfile, upiVpa: e.target.value })}
              placeholder="healthhub.billing@icici"
              required
            />
            <Select
              label="Default Billing Currency"
              id="h-curr"
              value={hProfile.currency || '₹'}
              onChange={(e) => setHProfile({ ...hProfile, currency: e.target.value })}
              options={[
                { value: '₹', label: '₹ INR (Indian Rupee)' },
                { value: '$', label: '$ USD (United States Dollar)' }
              ]}
            />
            <div className="col-span-2 flex justify-end">
              <Button type="submit" variant="primary" icon={Save}>
                Save Hospital Profile & GST Settings
              </Button>
            </div>
          </form>
        </Card>

        {/* Global theme controls card */}
        <Card title="Display Preferences" subtitle="Configure layout scales, light styles, and dark backgrounds.">
          <div className="flex justify-between items-center text-xs">
            <div>
              <h4 className="font-bold text-slate-800 dark:text-white leading-tight">Dark Mode Theme Toggle</h4>
              <p className="text-slate-400 mt-0.5">Toggle interface backdrop between clean Slate and deep Slate Navy colors.</p>
            </div>
            <button
              onClick={toggleDarkMode}
              className={`w-12 h-6 rounded-full transition-all relative flex items-center ${
                isDarkMode ? 'bg-teal-600 justify-end pr-1' : 'bg-slate-200 justify-start pl-1'
              }`}
            >
              <span className="w-4 h-4 bg-white rounded-full shadow-sm" />
            </button>
          </div>
        </Card>

        {/* Demo reset card */}
        <Card title="Demo Controls Center" subtitle="Clear system entries and refresh mock datasets.">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="max-w-md">
              <h4 className="text-xs font-bold text-slate-800 dark:text-white">Reset Database Relational Store</h4>
              <p className="text-[10px] text-slate-400 mt-1">
                Erase patient files, billing transactions, medicine stocks, and clinical prescriptions, restoring seeded defaults.
              </p>
            </div>
            <Button variant="danger" icon={RefreshCw} onClick={handleResetDemo}>
              Reset Demo Data
            </Button>
          </div>
        </Card>
      </div>

      {/* COLUMN 2: Staff Account Management (Admin only) */}
      <div className="xl:col-span-1">
        <Card 
          title="Staff Account Directory" 
          subtitle="Manage active login accounts, coordinate credentials, and deactivate staff."
          headerActions={isAdmin && (
            <Button size="sm" variant="secondary" icon={UserPlus} onClick={() => setIsUserModalOpen(true)}>
              Add User
            </Button>
          )}
        >
          <div className="flex flex-col gap-4 overflow-y-auto max-h-[500px] pr-1">
            {usersList.map((usr) => (
              <div 
                key={usr.id} 
                className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                  usr.isDeactivated 
                    ? 'border-red-200 bg-red-50/5 opacity-55' 
                    : 'border-slate-100 dark:border-slate-750/70 hover:shadow-premium'
                }`}
              >
                <div className="flex items-center gap-3">
                  <img
                    src={usr.avatar}
                    alt={usr.name}
                    className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">{usr.name}</h4>
                    <p className="text-[9px] text-slate-400 mt-0.5">{usr.email}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Badge variant="premium" className="text-[8px] px-1 py-0.2 select-none uppercase tracking-wider">{usr.role}</Badge>
                      {usr.isDeactivated && <span className="text-[8px] font-bold text-red-500 bg-red-50 dark:bg-red-950/20 px-1 py-0.2 rounded uppercase select-none">Inactive</span>}
                    </div>
                  </div>
                </div>

                {isAdmin && usr.id !== user.id && (
                  <button
                    onClick={() => handleDeactivate(usr.id, usr.isDeactivated)}
                    className={`text-xs px-2.5 py-1.5 rounded-lg border font-bold transition-all ${
                      usr.isDeactivated 
                        ? 'border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-700 text-slate-500' 
                        : 'border-red-100 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-650'
                    }`}
                  >
                    {usr.isDeactivated ? 'Activate' : 'Deactivate'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* STAFF CREATE MODAL */}
      <Modal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} title="Register Staff User Profile">
        <form onSubmit={handleUserSubmit} className="flex flex-col gap-4">
          <Input
            label="Staff Full Name"
            id="usr-name"
            value={userForm.name}
            onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
            placeholder="Sunita Deshmukh"
            required
          />
          <Input
            label="Email Address"
            id="usr-email"
            type="email"
            value={userForm.email}
            onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
            placeholder="sunita@healthhub.in"
            required
          />
          <Input
            label="Credential Password"
            id="usr-pass"
            type="password"
            value={userForm.password}
            onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
            placeholder="••••••••"
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="System Authorization Role"
              id="usr-role"
              value={userForm.role}
              onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
              options={[
                { value: 'Doctor', label: 'Doctor' },
                { value: 'Receptionist', label: 'Receptionist / Front Desk' },
                { value: 'Pharmacist', label: 'Pharmacist' },
                { value: 'Admin', label: 'System Administrator' }
              ]}
            />
            <Input
              label="Contact Phone"
              id="usr-phone"
              value={userForm.phone}
              onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
              placeholder="+91 98450 00002"
              required
            />
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <Button type="button" variant="secondary" onClick={() => setIsUserModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Create Account</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default Settings;
