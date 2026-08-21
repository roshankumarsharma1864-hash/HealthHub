import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { Button } from './UI.jsx';

export const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center animate-fade-in select-none">
      <div className="w-20 h-20 rounded-3xl bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-6 shadow-sm border border-blue-100 dark:border-blue-900/40">
        <ShieldAlert className="w-10 h-10 animate-bounce" />
      </div>
      
      <h1 className="text-4xl font-extrabold text-slate-800 dark:text-white tracking-tight">
        404 — Page Not Found
      </h1>
      
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-md leading-relaxed">
        The requested medical page or module does not exist or may have been moved.
      </p>

      <div className="flex items-center gap-3 mt-6">
        <Button 
          variant="outline" 
          icon={ArrowLeft} 
          onClick={() => navigate(-1)}
        >
          Go Back
        </Button>
        <Button 
          variant="primary" 
          icon={Home} 
          onClick={() => navigate('/dashboard')}
        >
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
