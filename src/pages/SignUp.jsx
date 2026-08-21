import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { HeartPulse, Mail, Lock, User, Phone, Clipboard, Eye, EyeOff } from 'lucide-react';
import { Button, Input, Select } from '../components/UI.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { db, KEYS } from '../services/db.js';

export const SignUp = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('Doctor');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  // Simple password strength calculation
  const getPasswordStrength = () => {
    if (!password) return { label: 'Empty', color: 'bg-slate-200', width: 'w-0' };
    if (password.length < 5) return { label: 'Weak', color: 'bg-red-500', width: 'w-1/3' };
    if (password.length < 8) return { label: 'Fair', color: 'bg-amber-500', width: 'w-2/3' };
    return { label: 'Strong', color: 'bg-emerald-500', width: 'w-full' };
  };

  const strength = getPasswordStrength();

  const handleRegister = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    if (!acceptTerms) {
      toast.warning('Please accept the Terms & Conditions.');
      return;
    }

    setLoading(true);
    try {
      // Fetch existing users to check duplicate email
      const users = await db.getAll(KEYS.USERS);
      const exists = users.some(u => u.email === email);
      if (exists) {
        toast.error('Email is already registered.');
        setLoading(false);
        return;
      }

      const newUser = {
        name,
        email,
        phone,
        role,
        password, // Simulating registration password
        avatar: `https://images.unsplash.com/photo-${role === 'Doctor' ? '1559839734-2b71ea197ec2' : '1573496359142-b8d87734a5a2'}?w=150`
      };

      await db.create(KEYS.USERS, newUser);
      toast.success('Account created successfully! Please sign in with your credentials.');
      navigate('/login');
    } catch (err) {
      toast.error(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-900 transition-colors duration-200 justify-center items-center p-6">
      <div className="w-full max-w-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-premium p-8">
        {/* Title */}
        <div className="flex flex-col items-center gap-2 text-center mb-8 select-none">
          <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-950/20 border border-primary-100 dark:border-primary-900/50 flex items-center justify-center">
            <HeartPulse className="w-6 h-6 text-primary-600" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">Create Account</h2>
          <p className="text-slate-400 text-xs mt-1">Register new clinical or operational accounts.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          <Input
            label="Full Name"
            id="name"
            type="text"
            icon={User}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Doe"
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Email Address"
              id="email"
              type="email"
              icon={Mail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john.doe@healthhub.com"
              required
            />
            <Input
              label="Phone Number"
              id="phone"
              type="text"
              icon={Phone}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 123-4567"
              required
            />
          </div>

          <Select
            label="Designated Role"
            id="role"
            options={[
              { value: 'Admin', label: 'Admin (Operator)' },
              { value: 'Doctor', label: 'Doctor (Clinician)' },
              { value: 'Nurse', label: 'Nurse (Caregiver)' },
              { value: 'Receptionist', label: 'Receptionist (Scheduler)' },
              { value: 'Pharmacist', label: 'Pharmacist (Inventory)' }
            ]}
            value={role}
            onChange={(e) => setRole(e.target.value)}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Input
                label="Password"
                id="password"
                type={showPassword ? 'text' : 'password'}
                icon={Lock}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-[38px] text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <Input
              label="Confirm Password"
              id="confirmPassword"
              type="password"
              icon={Lock}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {/* Strength Indicator */}
          {password && (
            <div className="flex flex-col gap-1 mt-1">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase select-none">
                <span>Password Strength</span>
                <span className="text-slate-600 dark:text-slate-200">{strength.label}</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div className={`h-full transition-all duration-300 ${strength.color} ${strength.width}`} />
              </div>
            </div>
          )}

          {/* Terms checkbox */}
          <label className="flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400 cursor-pointer mt-2 select-none">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="rounded border-slate-300 text-primary-600 focus:ring-primary-500 w-4 h-4 mt-0.5"
            />
            <span>
              I accept the{' '}
              <a href="#terms" className="text-primary-600 hover:underline font-bold">Terms & Conditions</a> and{' '}
              <a href="#privacy" className="text-primary-600 hover:underline font-bold">Privacy Policy</a>.
            </span>
          </label>

          <Button
            type="submit"
            variant="primary"
            className="w-full py-3 mt-4"
            disabled={loading}
          >
            {loading ? 'Registering Account...' : 'Create Account'}
          </Button>
        </form>

        <div className="text-center text-xs text-slate-400 font-semibold mt-6 select-none">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-600 hover:text-primary-750 font-bold transition-colors">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
