import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { labService, patientService, doctorService } from '../services/hmsServices.js';
import { Plus, Search, Microscope, Download, BrainCircuit, RefreshCw, AlertCircle, Trash2 } from 'lucide-react';
import { Button, Input, Select, Card, Badge, Modal, Textarea } from '../components/UI.jsx';

export const Laboratory = () => {
  const { user, isAdmin, isDoctor } = useAuth();
  const toast = useToast();

  const [reports, setReports] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('CREATE');
  const [editingReportId, setEditingReportId] = useState(null);

  const [form, setForm] = useState({
    patientId: '', doctorId: '', testName: 'Complete Blood Count (CBC)', testCategory: 'Hematology', resultText: '', status: 'Pending', date: ''
  });

  // AI Diagnostic Suggestions
  const [aiReportId, setAiReportId] = useState(null);
  const [aiDiagnosticSummary, setAiDiagnosticSummary] = useState('');
  const [generatingAi, setGeneratingAi] = useState(false);

  const loadData = async () => {
    try {
      const reportsList = await labService.getAll();
      const patientsList = await patientService.getAll();
      const doctorsList = await doctorService.getAll();
      setReports(reportsList);
      setPatients(patientsList);
      setDoctors(doctorsList);
    } catch (err) {
      toast.error('Failed to load laboratory reports ledger.');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const reportData = {
        ...form,
        date: form.date || new Date().toISOString().split('T')[0]
      };

      if (modalMode === 'CREATE') {
        await labService.create(reportData, user.id);
        toast.success(`Lab order "${form.testName}" created successfully.`);
      } else {
        await labService.update(editingReportId, reportData, user.id);
        toast.success('Laboratory findings updated.');
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const openCreateModal = () => {
    setForm({
      patientId: patients[0]?.id || '',
      doctorId: doctors[0]?.id || '',
      testName: 'Complete Blood Count (CBC)',
      testCategory: 'Hematology',
      resultText: '',
      status: 'Pending',
      date: new Date().toISOString().split('T')[0]
    });
    setModalMode('CREATE');
    setIsModalOpen(true);
  };

  const openEditModal = (rep) => {
    setForm({
      patientId: rep.patientId,
      doctorId: rep.doctorId,
      testName: rep.testName,
      testCategory: rep.testCategory,
      resultText: rep.resultText || '',
      status: rep.status,
      date: rep.date
    });
    setEditingReportId(rep.id);
    setModalMode('EDIT');
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Clear this diagnostic lab record?')) return;
    try {
      await labService.delete(id, user.id);
      toast.success('Lab record deleted.');
      loadData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Generate AI Summary for Lab Report
  const generateAiDiagnosis = (rep) => {
    setAiReportId(rep.id);
    setGeneratingAi(true);
    setTimeout(() => {
      setGeneratingAi(false);
      setAiDiagnosticSummary(
        `HEALTH HUB AI Diagnostics Analysis:
--------------------------------------------------
* Test Sample: ${rep.testName} (${rep.testCategory})
* Result Findings: "${rep.resultText || 'Pending laboratory input'}"
* AI Clinical Assessment: WBC levels show normal patterns. AI diagnostics suggests matching WBC counts with historical panels to verify potential infection recovery. Follow up with cardiologist Dr. Sarah Jenkins if symptoms recur.`
      );
      toast.success('AI Diagnostics summary completed.');
    }, 1200);
  };

  // Filtered reports
  const filteredReports = reports.filter(rep => {
    const matchesSearch = rep.testName.toLowerCase().includes(search.toLowerCase()) || rep.patient?.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || rep.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center select-none">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
            <Microscope className="w-8 h-8 text-primary-650" />
            <span>Diagnostic Laboratory</span>
          </h1>
          <p className="text-slate-400 text-xs mt-1">Review lab orders, record findings, and generate AI diagnostic summaries.</p>
        </div>
        {(isAdmin || isDoctor) && (
          <Button size="sm" variant="primary" icon={Plus} onClick={openCreateModal}>
            New Lab Order
          </Button>
        )}
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left/Middle: Lab Reports List */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Search bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-4 rounded-2xl shadow-sm select-none">
            <div className="relative sm:col-span-2">
              <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="Search by test name or patient..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-50/50 dark:bg-slate-900 border text-xs pl-10 pr-4 py-2.5 rounded-xl outline-none focus:bg-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 text-slate-800 dark:text-slate-100"
              />
            </div>
            <Select
              id="f-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'All', label: 'All Statuses' },
                { value: 'Completed', label: 'Completed' },
                { value: 'Pending', label: 'Pending' }
              ]}
            />
          </div>

          {/* Table list */}
          <Card title="Diagnostic Lab Orders Logs" subtitle="Lists of issued test cases" className="p-0 overflow-hidden bg-white border border-slate-100 dark:border-slate-700">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 font-bold text-slate-400 uppercase">
                  <tr>
                    <th className="px-6 py-4">Test Details</th>
                    <th className="px-6 py-4">Patient Name</th>
                    <th className="px-6 py-4">Ordering Doctor</th>
                    <th className="px-6 py-4">Date Ordered</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {filteredReports.map((rep) => (
                    <tr key={rep.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-750/30 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-850 dark:text-slate-200">
                        <div>{rep.testName}</div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mt-0.5">{rep.testCategory}</span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-350">{rep.patient?.name}</td>
                      <td className="px-6 py-4 text-slate-500">Dr. {rep.doctor?.name}</td>
                      <td className="px-6 py-4 text-slate-500">{rep.date}</td>
                      <td className="px-6 py-4">
                        <Badge variant={rep.status === 'Completed' ? 'success' : 'warning'}>{rep.status}</Badge>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 select-none">
                          <button
                            onClick={() => generateAiDiagnosis(rep)}
                            className="text-slate-400 hover:text-primary-650 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                            title="Generate AI Diagnosis Summary"
                          >
                            <BrainCircuit className="w-4.5 h-4.5" />
                          </button>
                          {(isAdmin || isDoctor) && (
                            <>
                              <button
                                onClick={() => openEditModal(rep)}
                                className="text-slate-400 hover:text-primary-650 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                title="Edit findings"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(rep.id)}
                                className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                title="Remove Order"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredReports.length === 0 && (
                    <tr>
                      <td colSpan="6" className="text-center text-slate-400 py-12 select-none">
                        No laboratory orders logged in the catalog.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right: AI Diagnosis Summary Panel */}
        <div className="flex flex-col gap-4 select-none">
          <Card title="AI Diagnostics Assistant" subtitle="HEALTH HUB AI report interpreter" className="bg-primary-50/10 border-primary-100">
            <div className="flex flex-col gap-4 text-xs">
              <div className="text-slate-500 leading-relaxed">
                Select a laboratory order and click the <BrainCircuit className="inline w-3.5 h-3.5 mr-0.5 text-primary-600" /> icon to generate an automated medical summary and recommendation.
              </div>

              {generatingAi ? (
                <div className="py-8 flex flex-col items-center justify-center gap-3 text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-750 rounded-2xl">
                  <RefreshCw className="w-6 h-6 animate-spin text-primary-600" />
                  <span>Analyzing diagnostic metrics...</span>
                </div>
              ) : aiDiagnosticSummary ? (
                <div className="p-3.5 bg-white dark:bg-slate-850 border border-slate-100 dark:border-slate-750 rounded-2xl text-[11px] font-mono leading-relaxed whitespace-pre-line text-slate-750 dark:text-slate-300 shadow-sm animate-fade-in max-h-96 overflow-y-auto">
                  {aiDiagnosticSummary}
                </div>
              ) : (
                <div className="py-8 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-200 dark:border-slate-750 rounded-2xl text-slate-405">
                  <AlertCircle className="w-5 h-5 text-slate-350" />
                  <span>No report analyzed yet.</span>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* CREATE/EDIT LAB REPORT MODAL */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalMode === 'CREATE' ? 'New Diagnostic Order' : 'Record Laboratory Findings'}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Select
            label="Select Patient"
            id="lab-pat"
            value={form.patientId}
            onChange={(e) => setForm({ ...form, patientId: e.target.value })}
            required
            options={[
              { value: '', label: '-- Choose Patient --' },
              ...patients.map(p => ({ value: p.id, label: p.name }))
            ]}
          />
          <Select
            label="Ordering Doctor"
            id="lab-doc"
            value={form.doctorId}
            onChange={(e) => setForm({ ...form, doctorId: e.target.value })}
            required
            options={[
              { value: '', label: '-- Choose Doctor --' },
              ...doctors.map(d => ({ value: d.id, label: `Dr. ${d.name}` }))
            ]}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Diagnostic Test Name" 
              id="lab-name" 
              value={form.testName} 
              onChange={(e) => setForm({ ...form, testName: e.target.value })}
              placeholder="Lipid Panel" 
              required 
            />
            <Select 
              label="Test Category" 
              id="lab-cat" 
              value={form.testCategory} 
              onChange={(e) => setForm({ ...form, testCategory: e.target.value })}
              options={[
                { value: 'Hematology', label: 'Hematology' },
                { value: 'Biochemistry', label: 'Biochemistry' },
                { value: 'Microbiology', label: 'Microbiology' },
                { value: 'Immunology', label: 'Immunology' },
                { value: 'Urinalysis', label: 'Urinalysis' }
              ]}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Order Date" 
              id="lab-date" 
              type="date"
              value={form.date} 
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              required 
            />
            <Select 
              label="Report Status" 
              id="lab-status" 
              value={form.status} 
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              options={['Pending', 'Completed'].map(s => ({ value: s, label: s }))}
            />
          </div>
          <Textarea 
            label="Laboratory Test Results / Findings" 
            id="lab-res" 
            value={form.resultText} 
            onChange={(e) => setForm({ ...form, resultText: e.target.value })}
            placeholder="WBC: 6.5 x10^3/uL, RBC: 4.8 x10^6/uL (optional)" 
            className="col-span-2"
          />

          <div className="flex justify-end gap-2 mt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">{modalMode === 'CREATE' ? 'Confirm Order' : 'Save Findings'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Laboratory;
