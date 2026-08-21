import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { HeartPulse, Mail, ArrowLeft, Send } from 'lucide-react';
import { Button, Input } from '../components/UI.jsx';
import { useToast } from '../context/ToastContext.jsx';

export const ForgotPassword = () => {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSent(true);
      toast.success(`Password reset instructions sent to ${email}`);
    }, 1200);
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-900 transition-colors duration-200 justify-center items-center p-6">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-premium p-8">
        
        {/* Title / Logo */}
        <div className="flex flex-col items-center gap-2 text-center mb-8 select-none">
          <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-950/20 border border-primary-100 dark:border-primary-900/50 flex items-center justify-center">
            <HeartPulse className="w-6 h-6 text-primary-600" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">Reset Password</h2>
          <p className="text-slate-400 text-xs mt-1">We will send you instructions to reset your password.</p>
        </div>

        {!sent ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <Input
              label="Registered Email Address"
              id="email"
              type="email"
              icon={Mail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="operator@healthhub.com"
              required
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full py-3 mt-2"
              disabled={loading}
              icon={Send}
            >
              {loading ? 'Sending Instructions...' : 'Send Reset Link'}
            </Button>
          </form>
        ) : (
          <div className="flex flex-col items-center gap-4 text-center select-none py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 flex items-center justify-center">
              <Mail className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-white text-lg">Check Your Email</h3>
            <p className="text-slate-400 text-xs max-w-xs leading-relaxed">
              We have sent a verification code to **{email}**. Please click the link inside to set your new login password.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2 w-full"
              onClick={() => setSent(false)}
            >
              Resend email
            </Button>
          </div>
        )}

        {/* Back Link */}
        <div className="text-center mt-8 select-none">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Login</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
