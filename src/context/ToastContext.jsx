import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle2, AlertTriangle, AlertCircle, Info } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto remove after 4 seconds
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, [removeToast]);

  const success = useCallback((msg) => addToast(msg, 'success'), [addToast]);
  const error = useCallback((msg) => addToast(msg, 'error'), [addToast]);
  const warning = useCallback((msg) => addToast(msg, 'warning'), [addToast]);
  const info = useCallback((msg) => addToast(msg, 'info'), [addToast]);

  const toast = { success, error, warning, info };

  // Icon selector based on type
  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-teal-500" />;
    }
  };

  // Border and background classes
  const getStyles = (type) => {
    switch (type) {
      case 'success':
        return 'border-emerald-500/20 bg-emerald-50/90 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-300';
      case 'error':
        return 'border-red-500/20 bg-red-50/90 text-red-800 dark:bg-red-950/20 dark:text-red-300';
      case 'warning':
        return 'border-amber-500/20 bg-amber-50/90 text-amber-800 dark:bg-amber-950/20 dark:text-amber-300';
      case 'info':
      default:
        return 'border-teal-500/20 bg-teal-50/90 text-teal-800 dark:bg-teal-950/20 dark:text-teal-300';
    }
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast Portal Container */}
      <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 w-full max-w-sm pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-start gap-3 p-4 rounded-xl border glass-panel shadow-premium pointer-events-auto animate-fade-in ${getStyles(t.type)}`}
            style={{
              animation: 'fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards'
            }}
          >
            <div className="flex-shrink-0 mt-0.5">{getIcon(t.type)}</div>
            <div className="flex-grow text-sm font-medium pr-2">{t.message}</div>
            <button
              onClick={() => removeToast(t.id)}
              className="flex-shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-0.5 rounded-lg hover:bg-white/50 dark:hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
