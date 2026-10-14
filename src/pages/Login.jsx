import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { HeartPulse, Lock, Mail, ArrowRight, UserCheck, Eye, EyeOff, CheckCircle, MapPin, Phone, Building2 } from 'lucide-react';
import { Button, Input } from '../components/UI.jsx';
import hospitalImage from '../assets/health_hub_hospital.jpg';

export const Login = () => {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successAnimation, setSuccessAnimation] = useState(false);

  const validateEmail = (val) => {
    return /\S+@\S+\.\S+/.test(val);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      toast.error('Please enter your email address.');
      return;
    }
    if (!validateEmail(email)) {
      toast.error('Please enter a valid email address.');
      return;
    }
    if (!password) {
      toast.error('Please enter your password.');
      return;
    }
    if (password.length < 8 && email !== 'admin@healthhub.com' && email !== 'doctor@healthhub.com' && email !== 'reception@healthhub.com' && email !== 'pharmacy@healthhub.com' && email !== 'patient@healthhub.com') {
      toast.error('Password must contain at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      setSuccessAnimation(true);
      toast.success('Logged in successfully! Welcome to HEALTH HUB.');
      setTimeout(() => {
        navigate('/dashboard');
      }, 800);
    } catch (err) {
      toast.error(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  // Demo shortcut credentials matching the new healthhub domain
  const demoProfiles = [
    { label: 'Admin', email: 'admin@healthhub.com', pass: 'admin', bg: 'bg-primary-50 border-primary-200 text-primary-700 dark:bg-primary-950/20 dark:border-primary-900/50' },
    { label: 'Doctor', email: 'doctor@healthhub.com', pass: 'doctor', bg: 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900/50' },
    { label: 'Reception', email: 'reception@healthhub.com', pass: 'reception', bg: 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/20 dark:border-amber-900/50' },
    { label: 'Pharmacy', email: 'pharmacy@healthhub.com', pass: 'pharmacy', bg: 'bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-950/20 dark:border-purple-900/50' }
  ];

  const handleShortcutClick = (profile) => {
    setEmail(profile.email);
    setPassword(profile.pass);
    toast.info(`Pre-filled credentials for ${profile.label}`);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
      
      {/* Left Side: Premium HEALTH HUB Hospital Image & Statistics */}
      <div 
        className="hidden md:flex md:w-1/2 text-white flex-col justify-between p-12 relative overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: `url(${hospitalImage})` }}
      >
        {/* Dark Blue Overlay */}
        <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[1px] z-0" />

        {/* Logo */}
        <div className="flex items-center gap-3 relative z-10 select-none">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg">
            <HeartPulse className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-extrabold tracking-tight">HEALTH HUB</span>
            <span className="text-[9px] text-slate-350 tracking-wider font-semibold uppercase">Hospital Management System</span>
          </div>
        </div>

        {/* Main Content Info */}
        <div className="relative z-10 max-w-lg my-auto flex flex-col gap-5 select-none">
          <h1 className="text-4xl lg:text-5xl font-extrabold leading-tight tracking-tight text-white drop-shadow-md">
            HEALTH HUB
          </h1>
          <h3 className="text-xl lg:text-2xl font-bold text-blue-400 drop-shadow-md mt-0.5">
            Advanced Healthcare. Smarter Management.
          </h3>
          <p className="text-slate-200 text-sm leading-relaxed max-w-md mt-2">
            An AI-powered hospital management platform designed to simplify healthcare operations and improve patient experiences.
          </p>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md">
              <div className="text-2xl font-black text-blue-400">10K+</div>
              <div className="text-xs text-slate-350 uppercase tracking-wider font-bold">Happy Patients</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md">
              <div className="text-2xl font-black text-blue-400">200+</div>
              <div className="text-xs text-slate-350 uppercase tracking-wider font-bold">Expert Doctors</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md">
              <div className="text-2xl font-black text-blue-400">50+</div>
              <div className="text-xs text-slate-350 uppercase tracking-wider font-bold">Departments</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md">
              <div className="text-2xl font-black text-blue-400">98%</div>
              <div className="text-xs text-slate-350 uppercase tracking-wider font-bold">Satisfaction Rate</div>
            </div>
          </div>
          {/* Hospital Campus Info Snippet */}
          <div className="bg-white/10 border border-white/15 rounded-2xl p-4 backdrop-blur-md flex flex-col gap-2 mt-4 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-blue-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" /> Campus Headquarters
              </span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                NABH ACCREDITED
              </span>
            </div>
            <div className="flex items-start gap-2 text-slate-200 text-[11px]">
              <MapPin className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
              <span>Plot 42, Sector 18, Health City, Bengaluru, Karnataka 560100</span>
            </div>
            <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-white/10 text-slate-300">
              <span className="flex items-center gap-1.5 font-medium">
                <Phone className="w-3.5 h-3.5 text-emerald-400" /> +91 (080) 4968-2000
              </span>
              <span className="font-bold text-red-400 flex items-center gap-1">
                Helpline: 108
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-[10px] text-slate-400 relative z-10 select-none">
          HEALTH HUB Super Speciality Hospital Portal v2.0.0 © 2026. High-end Medical Operations Console.
        </div>
      </div>

      {/* Right Side: Login Form Panel */}
      <div className="flex-grow flex items-center justify-center p-6 md:p-12 md:w-1/2">
        <div className="w-full max-w-md flex flex-col gap-8">
          
          {/* Header */}
          <div className="text-center md:text-left">
            <div className="inline-flex md:hidden items-center gap-2.5 mb-4 select-none">
              <HeartPulse className="w-8 h-8 text-blue-600 animate-pulse" />
              <span className="text-xl font-extrabold text-slate-800 dark:text-white">HEALTH HUB</span>
            </div>
            <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight select-none">
              Welcome Back
            </h2>
            <p className="text-slate-400 text-sm mt-1 select-none">HEALTH HUB Super Speciality Hospital Management System</p>
            <div className="md:hidden mt-2 p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-left text-[11px] text-slate-600 dark:text-slate-350">
              <p className="font-bold text-slate-800 dark:text-slate-200">Bengaluru Main Campus</p>
              <p className="text-slate-500 dark:text-slate-400 mt-0.5">Plot 42, Sector 18, Health City • Helpline: 108</p>
            </div>
          </div>

          {/* Form */}
          {successAnimation ? (
            <div className="flex flex-col items-center justify-center gap-4 py-12 animate-fade-in select-none">
              <CheckCircle className="w-16 h-16 text-emerald-500 animate-bounce" />
              <h3 className="font-extrabold text-slate-800 dark:text-white text-lg">Access Granted</h3>
              <p className="text-xs text-slate-450">Redirecting to operations board...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <Input
                label="Email Address"
                id="email"
                type="text"
                icon={Mail}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
              
              <div className="relative">
                <Input
                  label="Password"
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  icon={Lock}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-[38px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Remember & Forgot */}
              <div className="flex items-center justify-between text-xs select-none">
                <label className="flex items-center gap-2 text-slate-500 dark:text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <span>Remember me</span>
                </label>
                <Link to="/forgot-password" className="text-blue-600 hover:text-blue-750 font-extrabold transition-colors">
                  Forgot Password?
                </Link>
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full py-3 mt-2 bg-blue-600 hover:bg-blue-700 shadow-md"
                disabled={loading}
                icon={ArrowRight}
              >
                {loading ? 'Authenticating...' : 'Sign In'}
              </Button>
            </form>
          )}

          {/* Social Logins */}
          {!successAnimation && (
            <div className="flex flex-col gap-3 select-none">
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                <span className="flex-shrink mx-4 text-slate-400 text-xs font-semibold uppercase tracking-wider">or continue with</span>
                <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => toast.info('Google SSO Login simulated.')}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 text-xs border border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800 rounded-xl font-bold cursor-pointer"
                >
                  Google
                </button>
                <button
                  type="button"
                  onClick={() => toast.info('Microsoft SSO Login simulated.')}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 text-xs border border-slate-205 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800 rounded-xl font-bold cursor-pointer"
                >
                  Microsoft
                </button>
                <button
                  type="button"
                  onClick={() => toast.info('Apple SSO Login simulated.')}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 text-xs border border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800 rounded-xl font-bold cursor-pointer"
                >
                  Apple
                </button>
              </div>
            </div>
          )}

          {/* Create Account Link */}
          {!successAnimation && (
            <div className="text-center text-xs text-slate-400 font-semibold select-none">
              Don't have an account?{' '}
              <Link to="/signup" className="text-blue-600 hover:text-blue-750 font-extrabold transition-colors">
                Sign Up
              </Link>
            </div>
          )}

          {/* Credentials Shortcuts */}
          {!successAnimation && (
            <div className="flex flex-col gap-3 select-none">
              <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                <UserCheck className="w-3.5 h-3.5" />
                <span>Demo shortcuts</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {demoProfiles.map((prof, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleShortcutClick(prof)}
                    className={`px-2 py-1.5 text-[10px] font-bold border rounded-lg text-center cursor-pointer transition-all active:scale-[0.98] ${prof.bg} hover:brightness-95`}
                  >
                    {prof.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
