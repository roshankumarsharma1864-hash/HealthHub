import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Brain, Send, Bot, Sparkles, HeartPulse, RefreshCw, Paperclip, ShieldAlert } from 'lucide-react';
import { Button } from '../components/UI.jsx';

export const AIAssistant = () => {
  const { user } = useAuth();
  const toast = useToast();

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'ai',
      text: `Hello ${user?.name || 'Admin'}, I am your HEALTH HUB AI Administrative & Operations Assistant. I can help summarize hospital metrics, track appointments, monitor pharmacy inventory, and assess department workload.`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [loading, setLoading] = useState(false);

  // Required Quick Prompts matching PART 15 specifications
  const presets = [
    { label: "Today's Appointments", prompt: "Show today's appointments" },
    { label: "Busiest Department", prompt: "Which department is busiest?" },
    { label: "Low-Stock Medicines", prompt: "Show low-stock medicines" },
    { label: "Daily Hospital Report", prompt: "Generate today's hospital report" },
    { label: "Available Doctors", prompt: "Show available doctors" },
    { label: "Hospital Performance", prompt: "Summarize hospital performance" }
  ];

  const handleSend = (textToSend) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    const userMsg = {
      id: Date.now().toString(),
      sender: 'user',
      text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    setTimeout(() => {
      let aiText = '';
      const q = query.toLowerCase();

      if (q.includes('appointment')) {
        aiText = `HEALTH HUB AI Today's Appointments Summary:
• Total Scheduled Today: 128 consultations
• Confirmed: 104 | Pending Confirmation: 19 | Cancelled: 5
• Peak Hours: 10:00 AM - 12:30 PM
• Recommendation: All 4 OPD consultation rooms are operational. Doctor attendance rate is 96%.`;
      } else if (q.includes('busiest') || q.includes('department')) {
        aiText = `HEALTH HUB AI Department Demand Analysis:
• Busiest Department: Cardiology (25% of total intake)
• Second Busiest: Neurology (20%) & Pediatrics (15%)
• Ward Bed Utilization: Cardiology Ward bed occupancy is at 88%.
• Recommendation: Mobilize 2 floater nursing staff to the Cardiology wing to minimize patient intake queues.`;
      } else if (q.includes('low-stock') || q.includes('medicine') || q.includes('pharmacy')) {
        aiText = `HEALTH HUB AI Pharmacy Stock Projections:
• Critical Reorder Alert: Paracetamol (8 units remaining — min threshold 15)
• Near Expiry Warning: Amoxicillin 500mg (Expiry date: 15 Oct 2026)
• Demand Surge: Insulin demand increased +18% over the past 7 days.
• Action Taken: Automated supplier draft order created for PharmaCorp.`;
      } else if (q.includes('report') || q.includes('generate')) {
        aiText = `HEALTH HUB AI Daily Operational Audit:
• Daily Revenue: ₹8,45,231
• Emergency Intake: 7 critical cases triaged
• Bed Occupancy: 180 / 250 (72% Occupied)
• Overall Operational Efficiency: 94.8% — All systems running within target SLAs.`;
      } else if (q.includes('doctor') || q.includes('available')) {
        aiText = `HEALTH HUB AI Available Doctors Roster:
• Currently Active & Available: 42 Doctors
• Dr. Anjali Verma (Cardiology) — Available at OPD Room 102
• Dr. Vikram Singh (Neurology) — Available at OPD Room 204
• Dr. Neha Kapoor (Pediatrics) — Available at OPD Room 105`;
      } else if (q.includes('performance') || q.includes('summarize')) {
        aiText = `HEALTH HUB AI Executive Performance Summary:
• Patient Satisfaction Score: 98%
• Average ER Triage Wait Time: 11.4 minutes
• Monthly Discharge Recovery Rate: 96.2%
• Key Metric: Total active hospital patients served this month stands at 12,540.`;
      } else {
        aiText = `HEALTH HUB AI Assistance Response:
I have logged your request "${query}".
• System Status: All core clinical modules (Patients, Wards, Billing, Emergency, Pharmacy) are operational.
• Next Step: Use the quick prompts or ask a specific operational question.`;
      }

      const aiMsg = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: aiText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, aiMsg]);
      setLoading(false);
      toast.success('HEALTH HUB AI generated response successfully!');
    }, 1000);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      toast.info(`Attached file "${file.name}" for AI analysis.`);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center select-none">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
            <Brain className="w-8 h-8 text-primary-600" />
            <span>HEALTH HUB AI Assistant</span>
          </h1>
          <p className="text-slate-400 text-xs mt-1">Intelligent administrative and healthcare operational assistant.</p>
        </div>
      </div>

      {/* Mandatory Medical Disclaimer Banner */}
      <div className="p-3.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-2xl flex items-center gap-3 text-amber-800 dark:text-amber-300 text-xs font-medium select-none">
        <ShieldAlert className="w-5 h-5 flex-shrink-0 text-amber-600" />
        <span>
          <strong>Important Disclaimer:</strong> HEALTH HUB AI is an administrative and operational support tool designed for management and workflow efficiency. It must not replace qualified medical diagnosis, clinical judgment, or emergency medical treatment.
        </span>
      </div>

      {/* Main Grid split */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Preset Quick Prompts */}
        <div className="flex flex-col gap-3 select-none">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quick Prompts</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5">
            {presets.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(p.prompt)}
                className="p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-primary-500 rounded-2xl text-left cursor-pointer transition-all hover:scale-[1.01] shadow-sm flex items-center gap-3 group"
              >
                <div className="w-7 h-7 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-white truncate">{p.label}</h4>
                  <p className="text-[10px] text-slate-400 truncate">{p.prompt}</p>
                </div>
              </button>
            ))}
          </div>

          {/* AI Core status badge */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-2xl text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-2">
            <HeartPulse className="w-4 h-4 text-blue-600 animate-pulse" />
            <span className="font-semibold text-[11px]">AI Engine: Online & Operational</span>
          </div>
        </div>

        {/* Right Column: Chat Console */}
        <div className="lg:col-span-3 flex flex-col h-[540px] bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-premium overflow-hidden">
          {/* Chat header */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center gap-3 bg-slate-50/50 dark:bg-slate-900/20 select-none">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-800 dark:text-white">HEALTH HUB Operational Intelligence</h3>
              <span className="text-[9px] text-emerald-500 font-bold uppercase tracking-wider block mt-0.5 animate-pulse">● System Connected</span>
            </div>
          </div>

          {/* Messages timeline */}
          <div className="flex-grow overflow-y-auto p-5 flex flex-col gap-4">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex gap-3 max-w-[85%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                {msg.sender === 'ai' && (
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 font-bold text-xs select-none shadow-sm">
                    AI
                  </div>
                )}
                <div className={`p-4 rounded-2xl text-xs ${
                  msg.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-none shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-100 dark:border-slate-800'
                }`}>
                  <p className="whitespace-pre-line leading-relaxed font-medium">{msg.text}</p>
                  <span className={`text-[9px] block mt-2 text-right ${msg.sender === 'user' ? 'text-blue-100' : 'text-slate-400'}`}>
                    {msg.time}
                  </span>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-3 max-w-[80%] mr-auto items-center">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 animate-spin select-none">
                  <RefreshCw className="w-4 h-4" />
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl rounded-tl-none border border-slate-100 dark:border-slate-800 text-xs text-slate-400 font-medium animate-pulse">
                  HEALTH HUB AI is typing...
                </div>
              </div>
            )}
          </div>

          {/* Input control footer */}
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="p-4 border-t border-slate-100 dark:border-slate-700 flex gap-2 items-center select-none"
          >
            {/* File Upload Button */}
            <label className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-400 hover:text-slate-600 cursor-pointer transition-colors" title="Attach file or report">
              <Paperclip className="w-4.5 h-4.5" />
              <input type="file" className="hidden" onChange={handleFileUpload} />
            </label>

            <input
              type="text"
              placeholder="Ask HEALTH HUB AI (e.g., Show today's appointments)..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-grow bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs px-4 py-3 rounded-xl outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-slate-800 dark:text-slate-100"
            />
            <Button
              type="submit"
              variant="primary"
              disabled={loading || !input.trim()}
              icon={Send}
            >
              Send
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
