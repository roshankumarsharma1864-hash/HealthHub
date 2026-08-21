import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { notificationService } from '../services/hmsServices.js';
import { Bell, Check, Trash2, ShieldAlert, CreditCard, Flame, AlertCircle, Calendar, Users, Pill, MessageSquare, Brain } from 'lucide-react';
import { Button, Card, Badge } from '../components/UI.jsx';

export const Notifications = () => {
  const { user } = useAuth();
  const toast = useToast();

  const [alerts, setAlerts] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');

  const loadAlerts = async () => {
    try {
      const list = await notificationService.getAll();
      setAlerts(list);
    } catch (err) {
      toast.error('Failed to load notifications inbox.');
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await notificationService.markAsRead(id, user.id);
      toast.success('Alert marked as read.');
      loadAlerts();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead(user.id);
      toast.success('Marked all alerts as read.');
      loadAlerts();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await notificationService.delete(id, user.id);
      toast.success('Alert removed.');
      loadAlerts();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'Emergency': return <Flame className="w-5 h-5 text-red-500 animate-bounce" />;
      case 'Pharmacy': return <Pill className="w-5 h-5 text-teal-600" />;
      case 'Billing': return <CreditCard className="w-5 h-5 text-amber-500" />;
      case 'Appointments': return <Calendar className="w-5 h-5 text-blue-600" />;
      case 'Patients': return <Users className="w-5 h-5 text-indigo-600" />;
      case 'Messages': return <MessageSquare className="w-5 h-5 text-purple-600" />;
      case 'AI Alerts': return <Brain className="w-5 h-5 text-sky-600" />;
      default: return <Bell className="w-5 h-5 text-blue-600" />;
    }
  };

  const categories = ['All', 'Appointments', 'Patients', 'Billing', 'Pharmacy', 'Messages', 'Emergency', 'AI Alerts'];

  const filteredAlerts = alerts.filter(a => {
    if (activeCategory === 'All') return true;
    return a.type === activeCategory || a.category === activeCategory;
  });

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 select-none">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
            <Bell className="w-8 h-8 text-blue-600" />
            <span>Notifications Center</span>
          </h1>
          <p className="text-slate-400 text-xs mt-1">Review emergency warnings, appointment reminders, pharmacy reorders, and AI alerts.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button 
            size="sm" 
            variant="outline" 
            icon={Check} 
            onClick={handleMarkAllRead}
            disabled={alerts.every(a => a.read)}
            className="flex-grow sm:flex-grow-0"
          >
            Mark All Read
          </Button>
        </div>
      </div>

      {/* Category Pills Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 select-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
              activeCategory === cat
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Alerts feed list */}
      <div className="flex flex-col gap-4">
        {filteredAlerts.map((alt) => (
          <Card 
            key={alt.id} 
            className={`flex items-start justify-between p-4 border transition-all ${
              !alt.read 
                ? 'border-blue-200 dark:border-blue-900/50 bg-blue-50/20 dark:bg-blue-950/20' 
                : 'border-slate-100 dark:border-slate-800'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-750 flex items-center justify-center flex-shrink-0">
                {getAlertIcon(alt.type || alt.category)}
              </div>
              <div>
                <div className="flex items-center gap-2 select-none">
                  <Badge variant={alt.type === 'Emergency' ? 'danger' : 'info'}>{alt.type || 'System'} Notification</Badge>
                  {!alt.read && <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />}
                </div>
                <h4 className={`text-sm mt-1.5 leading-snug font-bold ${!alt.read ? 'text-slate-800 dark:text-white' : 'text-slate-500'}`}>
                  {alt.text || alt.details}
                </h4>
                <span className="text-[10px] text-slate-400 block mt-1.5 select-none font-medium">
                  {new Date(alt.timestamp).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 select-none">
              {!alt.read && (
                <button
                  onClick={() => handleMarkRead(alt.id)}
                  className="text-slate-400 hover:text-blue-600 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors"
                  title="Mark Read"
                >
                  <Check className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => handleDelete(alt.id)}
                className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors"
                title="Remove Alert"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </Card>
        ))}
        {filteredAlerts.length === 0 && (
          <div className="py-16 text-center border-2 border-dashed border-slate-200 dark:border-slate-750 rounded-2xl text-slate-400 flex flex-col items-center justify-center gap-3 select-none">
            <AlertCircle className="w-8 h-8 text-slate-300 dark:text-slate-600" />
            <div>
              <h3 className="font-bold text-slate-700 dark:text-slate-300 text-sm">No Notifications Found</h3>
              <p className="text-[10px] text-slate-400 mt-1">There are no active notifications in the "{activeCategory}" category.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
