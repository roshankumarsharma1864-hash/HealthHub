import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { FileText, Download, Sparkles, BrainCircuit, RefreshCw, BarChart2 } from 'lucide-react';
import { Button, Card, Badge } from '../components/UI.jsx';

export const Reports = () => {
  const { user } = useAuth();
  const toast = useToast();

  const [generating, setGenerating] = useState(false);
  const [reportResult, setReportResult] = useState('');

  const reportTemplates = [
    { id: 'financial', title: 'Monthly Financial Audit', type: 'Accounting' },
    { id: 'clinical', title: 'Clinical Care Intake Trends', type: 'Operations' },
    { id: 'pharmacy', title: 'Pharmacy Depletion Forecast', type: 'Inventory' },
    { id: 'emergency', title: 'Emergency ER Admission Log', type: 'Emergency' }
  ];

  const handleGenerateReport = (tpl) => {
    setGenerating(true);
    setReportResult('');
    setTimeout(() => {
      setGenerating(false);
      let text = '';
      if (tpl.id === 'financial') {
        text = `MediCare+ Financial Audit Statement:
--------------------------------------------------
* Reporting Period: August 2026
* Total Billed Revenue: $58,350
* Collected Payments: $39,200 (67% recovery)
* Outstanding Invoices: $19,150 (33% pending)
* Tax (VAT 5%): $2,917.50
* AI Operational Recommendation: Send automated payment reminders to patients with outstanding invoices older than 14 days.`;
      } else if (tpl.id === 'clinical') {
        text = `MediCare+ Clinical Intake Report:
--------------------------------------------------
* Total Admitted Patients: 24 (ICU: 4, General: 12, ER: 8)
* Doctor Workloads: Dr. Sarah Jenkins is handling 15 active charts.
* Average Visit Duration: 4.2 Days.
* AI Operational Recommendation: Mobilize 2 cardiology floaters to support Dr. Jenkins' diagnostic backlog.`;
      } else if (tpl.id === 'pharmacy') {
        text = `MediCare+ Pharmacy Depletion Forecast:
--------------------------------------------------
* Low Stock Alert: Paracetamol (8 units remaining). Projected run-out: 5 days.
* High Demand Forecast: Amoxicillin demand projected to surge by 24% next week.
* Recommended Reorders: Paracetamol (200 units), Amoxicillin (150 units).
* AI Operational Recommendation: Initiate automated reorder request to PharmaCorp.`;
      } else {
        text = `MediCare+ Emergency Room Admissions Log:
--------------------------------------------------
* Total Active ER Triage Cases: 2 critical, 5 high-priority.
* Bed Occupancy: 83% (5 of 6 beds filled).
* Average Triage Wait Time: 12 minutes.
* AI Operational Recommendation: Ensure ER nurse staffing is boosted during peak hours (2 PM to 8 PM).`;
      }
      setReportResult(text);
      toast.success(`Successfully generated "${tpl.title}" report!`);
    }, 1200);
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center select-none">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
            <BarChart2 className="w-8 h-8 text-primary-650" />
            <span>Hospital Operational Reports</span>
          </h1>
          <p className="text-slate-400 text-xs mt-1">Review hospital financials, clinical workloads, and inventory forecasts.</p>
        </div>
      </div>

      {/* Main Grid split */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column Templates List */}
        <div className="flex flex-col gap-3 select-none">
          <span className="text-xs font-bold text-slate-450 uppercase tracking-wider">Report Templates</span>
          {reportTemplates.map((tpl) => (
            <button
              key={tpl.id}
              onClick={() => handleGenerateReport(tpl)}
              className="p-4 bg-white hover:bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-primary-500 rounded-2xl text-left cursor-pointer transition-all hover:scale-[1.02] shadow-sm"
            >
              <div className="flex justify-between items-center mb-2">
                <Badge variant="info">{tpl.type}</Badge>
              </div>
              <h4 className="text-xs font-extrabold text-slate-800 dark:text-white leading-snug">{tpl.title}</h4>
              <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                Generate and summarize using Medicare AI.
              </p>
            </button>
          ))}
        </div>

        {/* Right Column Report Summary display */}
        <div className="lg:col-span-3 flex flex-col h-[500px] bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-premium overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-slate-50 dark:border-slate-750 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/10 select-none">
            <h3 className="text-xs font-bold text-slate-800 dark:text-white">Generated Report Output</h3>
            {reportResult && (
              <Button 
                size="xs" 
                variant="outline" 
                icon={Download} 
                onClick={() => toast.success('Downloaded report PDF archive.')}
              >
                Download PDF
              </Button>
            )}
          </div>

          {/* Result content */}
          <div className="flex-grow overflow-y-auto p-6 flex flex-col justify-center">
            {generating ? (
              <div className="flex flex-col items-center justify-center gap-3 text-slate-400 select-none">
                <RefreshCw className="w-8 h-8 animate-spin text-primary-600" />
                <span className="font-semibold text-xs">Synthesizing clinical stats and compiling report...</span>
              </div>
            ) : reportResult ? (
              <div className="p-5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-xs font-mono leading-relaxed whitespace-pre-line text-slate-750 dark:text-slate-350 rounded-2xl shadow-inner max-h-[380px] overflow-y-auto animate-fade-in">
                {reportResult}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400 select-none flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary-50 dark:bg-primary-950/20 text-primary-600 border border-primary-100 dark:border-primary-900/50 flex items-center justify-center">
                  <BrainCircuit className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-750 dark:text-slate-300 text-sm">No Report Generated</h3>
                  <p className="text-[10px] text-slate-400 mt-1 max-w-xs leading-relaxed">
                    Select a report template from the left side pane to compile live records.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
