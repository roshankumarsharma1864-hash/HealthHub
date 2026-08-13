import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { HeartPulse, Lock, Mail, ArrowRight, UserCheck } from 'lucide-react';
import { Button, Input } from '../components/UI.jsx';

export const Login = () => {
  const { login } = useAuth();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.warning('Please enter both email and password.');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Logged in successfully! Welcome to Careflow HMS.');
    } catch (err) {
      toast.error(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  // Demo shortcut credentials
  const demoProfiles = [
    { label: 'Admin', email: 'admin@careflow.com', pass: 'admin', bg: 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/20' },
    { label: 'Doctor', email: 'doctor@careflow.com', pass: 'doctor', bg: 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/20' },
    { label: 'Receptionist', email: 'reception@careflow.com', pass: 'reception', bg: 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/20' },
    { label: 'Pharmacist', email: 'pharmacy@careflow.com', pass: 'pharmacy', bg: 'bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-950/20' }
  ];

  const handleShortcutClick = (profile) => {
    setEmail(profile.email);
    setPassword(profile.pass);
    toast.info(`Pre-filled credentials for ${profile.label}`);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-slate-900 transition-colors">
      {/* Left Clinical Accent Panel */}
      <div className="hidden md:flex md:w-1/2 bg-teal-800 text-white flex-col justify-between p-12 relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-700 rounded-full filter blur-3xl opacity-50 translate-x-20 -translate-y-20" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-600 rounded-full filter blur-3xl opacity-30 -translate-x-20 translate-y-20" />

        <div className="flex items-center gap-3 relative z-10">
          <HeartPulse className="w-10 h-10 text-teal-300" />
          <span className="text-xl font-bold tracking-tight">Careflow HMS</span>
        </div>

        <div className="relative z-10 max-w-md my-auto">
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight mb-4">
            Next-Gen Healthcare Management & Patient Operations
          </h1>
          <p className="text-teal-100 text-sm leading-relaxed">
            Careflow consolidates scheduling, clinical prescriptions, electronic health charts, ward logistics, and billing transactions in a single, high-fidelity medical workspace.
          </p>
        </div>

        <div className="text-xs text-teal-200 relative z-10 select-none">
          Careflow HMS v1.0.0-MVP © 2026. All medical records are locally simulated.
        </div>
      </div>

      {/* Right Login Form Panel */}
      <div className="flex-grow flex items-center justify-center p-6 md:p-12 md:w-1/2">
        <div className="w-full max-w-md flex flex-col gap-8">
          {/* Header */}
          <div className="text-center md:text-left">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Sign In to Dashboard</h2>
            <p className="text-slate-400 text-sm mt-1">Enter your medical credentials to gain access.</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <Input
              label="Email Address"
              id="email"
              type="email"
              icon={Mail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@careflow.com"
              required
            />
            
            <Input
              label="Password"
              id="password"
              type="password"
              icon={Lock}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full py-3 mt-2"
              disabled={loading}
              icon={ArrowRight}
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </Button>
          </form>

          {/* Credentials Shortcuts */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider select-none">
              <UserCheck className="w-4 h-4" />
              <span>Demo Accounts Shortcuts (Click to Pre-fill)</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {demoProfiles.map((prof, idx) => (
                <button
                  key={idx}
                  onClick={() => handleShortcutClick(prof)}
                  className={`px-3 py-2 text-xs font-semibold border rounded-xl text-center cursor-pointer transition-all active:scale-[0.98] ${prof.bg} hover:brightness-95`}
                >
                  {prof.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Login;
