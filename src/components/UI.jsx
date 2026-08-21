import React from 'react';
import { X, AlertCircle, Inbox, RotateCcw } from 'lucide-react';

// ==========================================
// 1. BUTTON
// ==========================================
export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  icon: Icon,
  disabled = false,
  ...props
}) => {
  const baseStyle = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none';
  
  const variants = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 shadow-sm hover:shadow active:scale-[0.98]',
    secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 focus:ring-slate-500 active:scale-[0.98]',
    outline: 'border border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 focus:ring-primary-500 active:scale-[0.98]',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm hover:shadow active:scale-[0.98]',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500 shadow-sm active:scale-[0.98]',
    warning: 'bg-amber-500 text-white hover:bg-amber-600 focus:ring-amber-500 shadow-sm active:scale-[0.98]',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-5 py-2.5 text-base gap-2.5',
  };

  return (
    <button
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </button>
  );
};

// ==========================================
// 2. MODAL (GLASSMORPHIC BACKGROUND)
// ==========================================
export const Modal = ({ isOpen, onClose, title, children, maxWidth = 'max-w-lg' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Content wrapper */}
      <div 
        className={`relative w-full ${maxWidth} bg-white dark:bg-slate-800 rounded-2xl shadow-premium dark:shadow-premium-dark border border-slate-100 dark:border-slate-700 overflow-hidden animate-fade-in z-10`}
        style={{ animation: 'fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white leading-6">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-750"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="px-6 py-4 max-h-[80vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 3. CARD
// ==========================================
export const Card = ({ children, title, subtitle, className = '', headerActions }) => {
  return (
    <div className={`bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-750 p-6 shadow-premium hover:shadow-premium-hover transition-all duration-200 ${className}`}>
      {(title || headerActions) && (
        <div className="flex items-center justify-between mb-5 gap-4">
          <div>
            {title && <h3 className="text-lg font-bold text-slate-800 dark:text-white leading-tight">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{subtitle}</p>}
          </div>
          {headerActions && <div className="flex items-center gap-2">{headerActions}</div>}
        </div>
      )}
      {children}
    </div>
  );
};

// ==========================================
// 4. BADGE
// ==========================================
export const Badge = ({ children, variant = 'info', className = '' }) => {
  const styles = {
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/50 dark:text-emerald-400',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/50 dark:text-amber-400',
    danger: 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/20 dark:border-red-900/50 dark:text-red-400',
    info: 'bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-950/20 dark:border-sky-900/50 dark:text-sky-400',
    neutral: 'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300',
    premium: 'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/20 dark:border-purple-900/50 dark:text-purple-400',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold select-none ${styles[variant]} ${className}`}>
      {children}
    </span>
  );
};

// ==========================================
// 5. INPUT CONTROLS
// ==========================================
export const Input = ({ label, id, error, icon: Icon, className = '', ...props }) => {
  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {label && (
        <label htmlFor={id} className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
            <Icon className="w-4.5 h-4.5" />
          </div>
        )}
        <input
          id={id}
          className={`w-full bg-slate-50/50 dark:bg-slate-900 border text-sm rounded-xl py-2.5 transition-all outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 text-slate-800 dark:text-slate-100 ${
            Icon ? 'pl-11' : 'px-4'
          } ${
            error 
              ? 'border-red-500 dark:border-red-500/50 focus:border-red-500 focus:ring-red-500' 
              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
          }`}
          {...props}
        />
      </div>
      {error && <span className="text-xs font-medium text-red-500 leading-none">{error}</span>}
    </div>
  );
};

export const Select = ({ label, id, error, options = [], className = '', ...props }) => {
  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {label && (
        <label htmlFor={id} className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none">
          {label}
        </label>
      )}
      <select
        id={id}
        className={`w-full bg-slate-50/50 dark:bg-slate-900 border text-sm rounded-xl px-4 py-2.5 transition-all outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 text-slate-800 dark:text-slate-100 ${
          error 
            ? 'border-red-500 dark:border-red-500/50 focus:border-red-500 focus:ring-red-500' 
            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
        }`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span className="text-xs font-medium text-red-500 leading-none">{error}</span>}
    </div>
  );
};

export const Textarea = ({ label, id, error, className = '', ...props }) => {
  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {label && (
        <label htmlFor={id} className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none">
          {label}
        </label>
      )}
      <textarea
        id={id}
        rows={3}
        className={`w-full bg-slate-50/50 dark:bg-slate-900 border text-sm rounded-xl px-4 py-2.5 transition-all outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 text-slate-800 dark:text-slate-100 ${
          error 
            ? 'border-red-500 dark:border-red-500/50 focus:border-red-500 focus:ring-red-500' 
            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
        }`}
        {...props}
      />
      {error && <span className="text-xs font-medium text-red-500 leading-none">{error}</span>}
    </div>
  );
};

// ==========================================
// 6. LOADING SKELETON
// ==========================================
export const LoadingSkeleton = ({ count = 3, className = '' }) => {
  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="animate-pulse bg-slate-200 dark:bg-slate-800 h-16 rounded-2xl w-full" />
      ))}
    </div>
  );
};

// ==========================================
// 7. EMPTY STATE
// ==========================================
export const EmptyState = ({ title = 'No records found', description = 'There are no items to display at this time.', icon: Icon = Inbox, actionLabel, onAction }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 rounded-2xl shadow-sm my-4">
      <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-base font-bold text-slate-800 dark:text-white">{title}</h3>
      <p className="text-xs text-slate-400 max-w-sm mt-1 mb-6 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

// ==========================================
// 8. ERROR STATE
// ==========================================
export const ErrorState = ({ title = 'Something went wrong', message = 'Unable to load data. Please refresh or try again.', onRetry }) => {
  return (
    <div className="flex flex-col items-center justify-center p-10 text-center bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 rounded-2xl my-4">
      <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/50 text-red-600 flex items-center justify-center mb-3">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h3 className="text-sm font-extrabold text-slate-800 dark:text-white">{title}</h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" icon={RotateCcw} onClick={onRetry} className="mt-4">
          Try Again
        </Button>
      )}
    </div>
  );
};

