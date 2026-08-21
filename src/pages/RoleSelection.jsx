import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, User, HeartHandshake, FileText, ClipboardList } from 'lucide-react';
import { Button, Card } from '../components/UI.jsx';
import { useToast } from '../context/ToastContext.jsx';

export const RoleSelection = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const roles = [
    {
      name: 'Admin',
      desc: 'Manage hospital operations, billing ledgers, staff accounts, and hospital settings.',
      icon: ShieldAlert,
      color: 'bg-primary-50 text-primary-600 border-primary-100 dark:bg-primary-950/20 dark:border-primary-900/50',
      action: () => {
        toast.info('Selected Admin profile shortcut.');
        navigate('/login');
      }
    },
    {
      name: 'Doctor',
      desc: 'Check upcoming schedules, inspect medical charts, write prescriptions, and review diagnostic lab results.',
      icon: User,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/50',
      action: () => {
        toast.info('Selected Doctor profile shortcut.');
        navigate('/login');
      }
    },
    {
      name: 'Nurse / Caregiver',
      desc: 'Coordinate inpatient care, check ER dashboards, update vitals, and coordinate ward bed logs.',
      icon: HeartHandshake,
      color: 'bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-950/20 dark:border-indigo-900/50',
      action: () => {
        toast.info('Selected Nurse profile shortcut.');
        navigate('/login');
      }
    },
    {
      name: 'Receptionist',
      desc: 'Register new patient profiles, schedule appointments, and coordinate check-in queues.',
      icon: ClipboardList,
      color: 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/20 dark:border-amber-900/50',
      action: () => {
        toast.info('Selected Receptionist profile shortcut.');
        navigate('/login');
      }
    },
    {
      name: 'Pharmacist',
      desc: 'Track medication inventories, receive stock orders, review prescriptions, and dispatch medicines.',
      icon: FileText,
      color: 'bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-950/20 dark:border-purple-900/50',
      action: () => {
        toast.info('Selected Pharmacist profile shortcut.');
        navigate('/login');
      }
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col justify-center items-center p-6 transition-colors duration-200">
      <div className="w-full max-w-4xl flex flex-col gap-6 text-center mb-8">
        <h1 className="text-4xl font-extrabold text-slate-800 dark:text-white tracking-tight">
          Select Your Portal Role
        </h1>
        <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto text-sm">
          Please select your healthcare role to redirect to the correct login workspace.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 max-w-6xl w-full">
        {roles.map((role, idx) => {
          const Icon = role.icon;
          return (
            <Card
              key={idx}
              className="flex flex-col items-center justify-between p-6 text-center hover:scale-[1.02] hover:shadow-premium cursor-pointer transition-all duration-200"
              onClick={role.action}
            >
              <div className="flex flex-col items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${role.color}`}>
                  <Icon className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-lg text-slate-800 dark:text-white">{role.name}</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
                  {role.desc}
                </p>
              </div>
              <Button size="sm" variant="secondary" className="mt-6 w-full">
                Enter
              </Button>
            </Card>
          );
        })}
      </div>

      <div className="mt-12 text-slate-400 text-xs font-medium">
        HEALTH HUB Medical Portal © 2026. Powered by simulated relational datasets.
      </div>
    </div>
  );
};

export default RoleSelection;
