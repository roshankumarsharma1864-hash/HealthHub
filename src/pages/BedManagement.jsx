import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { wardService, patientService } from '../services/hmsServices.js';
import { Bed, Grid, Eye, Check, X, ShieldAlert, Sparkles } from 'lucide-react';
import { Card, Badge, Button, Modal, Select } from '../components/UI.jsx';

export const BedManagement = () => {
  const { user, isAdmin, isReceptionist } = useAuth();
  const toast = useToast();

  const [wards, setWards] = useState([]);
  const [patients, setPatients] = useState([]);
  const [selectedWard, setSelectedWard] = useState(null);

  // Manage Bed status Modal
  const [isBedModalOpen, setIsBedModalOpen] = useState(false);
  const [selectedBed, setSelectedBed] = useState(null);
  const [bedFormStatus, setBedFormStatus] = useState('Available');
  const [bedFormPatientId, setBedFormPatientId] = useState('');

  const loadWardsData = async () => {
    try {
      const wList = await wardService.getAll();
      const pList = await patientService.getAll();
      setWards(wList);
      setPatients(pList);

      if (selectedWard) {
        const updatedWard = wList.find(w => w.id === selectedWard.id);
        setSelectedWard(updatedWard);
      } else if (wList.length > 0) {
        setSelectedWard(wList[0]);
      }
    } catch (err) {
      toast.error('Failed to load ward occupancies.');
    }
  };

  useEffect(() => {
    loadWardsData();
  }, []);

  const getBedStatusClass = (status) => {
    switch (status) {
      case 'Occupied': return 'bed-occupied border-red-205 hover:border-red-400';
      case 'Cleaning': return 'bed-cleaning border-amber-205 hover:border-amber-400';
      case 'Reserved': return 'bed-reserved border-primary-205 hover:border-primary-400';
      case 'Available':
      default:
        return 'bed-available border-emerald-205 hover:border-emerald-400';
    }
  };

  const handleBedClick = (bed) => {
    if (!isAdmin && !isReceptionist) return; // Read-only
    setSelectedBed(bed);
    setBedFormStatus(bed.status);
    setBedFormPatientId(bed.patientId || '');
    setIsBedModalOpen(true);
  };

  const handleBedSubmit = async (e) => {
    e.preventDefault();
    try {
      await wardService.updateBedStatus(
        selectedWard.id, 
        selectedBed.bedNo, 
        bedFormStatus, 
        bedFormStatus === 'Occupied' ? bedFormPatientId : null,
        user.id
      );
      toast.success(`Updated Bed ${selectedBed.bedNo} status successfully.`);
      setIsBedModalOpen(false);
      loadWardsData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Statistics counters
  const totalBeds = wards.reduce((sum, w) => sum + w.totalBeds, 0);
  const occupiedBeds = wards.reduce((sum, w) => sum + w.occupiedBeds, 0);
  const availableBedsCount = totalBeds - occupiedBeds;
  const reservedBeds = wards.reduce((sum, w) => sum + (w.bedList?.filter(b => b.status === 'Reserved').length || 0), 0);
  const icuBeds = wards.find(w => w.name.includes('ICU'))?.totalBeds || 4;
  const erBeds = wards.find(w => w.name.includes('Emergency'))?.totalBeds || 6;

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Title */}
      <div className="flex justify-between items-center select-none">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">Bed & Room Management</h1>
          <p className="text-slate-400 text-xs mt-1">Review bed allocations, patient admissions, and ward cleaning states.</p>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 select-none">
        <Card className="p-4 flex flex-col justify-between hover:shadow-premium duration-150 transition-all">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Beds</span>
          <span className="text-2xl font-extrabold text-slate-850 dark:text-white mt-2">{totalBeds}</span>
        </Card>
        <Card className="p-4 flex flex-col justify-between hover:shadow-premium duration-150 transition-all">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Available</span>
          <span className="text-2xl font-extrabold mt-2 text-emerald-600">{availableBedsCount}</span>
        </Card>
        <Card className="p-4 flex flex-col justify-between hover:shadow-premium duration-150 transition-all">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Occupied</span>
          <span className="text-2xl font-extrabold mt-2 text-red-500">{occupiedBeds}</span>
        </Card>
        <Card className="p-4 flex flex-col justify-between hover:shadow-premium duration-150 transition-all">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reserved</span>
          <span className="text-2xl font-extrabold mt-2 text-primary-600">{reservedBeds}</span>
        </Card>
        <Card className="p-4 flex flex-col justify-between hover:shadow-premium duration-150 transition-all">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ICU Beds</span>
          <span className="text-2xl font-extrabold mt-2 text-indigo-600">{icuBeds}</span>
        </Card>
        <Card className="p-4 flex flex-col justify-between hover:shadow-premium duration-150 transition-all">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ER Beds</span>
          <span className="text-2xl font-extrabold mt-2 text-red-650">{erBeds}</span>
        </Card>
      </div>

      {/* Main Grid: Wards tabs and Beds grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Wards list selectors */}
        <div className="flex flex-col gap-3 select-none">
          <span className="text-xs font-bold text-slate-450 uppercase tracking-wider">Care Units Wards</span>
          {wards.map((w) => (
            <button
              key={w.id}
              onClick={() => setSelectedWard(w)}
              className={`p-4 border rounded-2xl text-left cursor-pointer transition-all active:scale-[0.98] ${
                selectedWard?.id === w.id
                  ? 'bg-primary-600 text-white border-primary-600 shadow-premium'
                  : 'bg-white hover:bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-750 dark:text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm">{w.name}</h4>
                <Badge variant={selectedWard?.id === w.id ? 'info' : 'neutral'} className={selectedWard?.id === w.id ? 'bg-white/20 text-white border-transparent' : ''}>
                  {w.occupiedBeds}/{w.totalBeds}
                </Badge>
              </div>
              <p className={`text-[10px] mt-1.5 ${selectedWard?.id === w.id ? 'text-primary-100' : 'text-slate-400'}`}>
                Type: {w.type} | Available Beds: {w.totalBeds - w.occupiedBeds}
              </p>
            </button>
          ))}
        </div>

        {/* Selected Ward bed layout */}
        <div className="lg:col-span-3">
          {selectedWard && (
            <Card title={`${selectedWard.name} Bed Allocations`} subtitle="Click on a bed to manage admissions or cleaning status.">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {selectedWard.bedList?.map((bed) => {
                  const pat = patients.find(p => p.id === bed.patientId);
                  return (
                    <div
                      key={bed.bedNo}
                      onClick={() => handleBedClick(bed)}
                      className={`p-4 border-2 rounded-2xl flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.02] shadow-sm select-none ${getBedStatusClass(bed.status)}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-sm">{bed.bedNo}</span>
                        <Badge variant={bed.status === 'Available' ? 'success' : bed.status === 'Occupied' ? 'danger' : 'warning'}>
                          {bed.status}
                        </Badge>
                      </div>
                      <div className="mt-4">
                        {pat ? (
                          <>
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{pat.name}</p>
                            <p className="text-[10px] text-slate-455 mt-0.5 truncate">Doc: Dr. {pat.assignedDoctor?.name || 'Unassigned'}</p>
                          </>
                        ) : (
                          <p className="text-xs text-slate-400 italic">Unoccupied</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* MANAGE BED STATUS MODAL */}
      <Modal isOpen={isBedModalOpen} onClose={() => setIsBedModalOpen(false)} title={`Manage Bed ${selectedBed?.bedNo} Status`}>
        <form onSubmit={handleBedSubmit} className="flex flex-col gap-4">
          <Select
            label="Bed Status"
            id="bed-status"
            value={bedFormStatus}
            onChange={(e) => setBedFormStatus(e.target.value)}
            options={[
              { value: 'Available', label: 'Available' },
              { value: 'Occupied', label: 'Occupied (Inpatient Admitted)' },
              { value: 'Cleaning', label: 'Cleaning (Maintenance)' },
              { value: 'Reserved', label: 'Reserved' }
            ]}
          />

          {bedFormStatus === 'Occupied' && (
            <Select
              label="Admit Patient"
              id="bed-patient"
              value={bedFormPatientId}
              onChange={(e) => setBedFormPatientId(e.target.value)}
              required
              options={[
                { value: '', label: '-- Choose Patient --' },
                ...patients.filter(p => !p.wardId || p.id === selectedBed?.patientId).map(p => ({ value: p.id, label: p.name }))
              ]}
            />
          )}

          <div className="flex justify-end gap-2 mt-4">
            <Button type="button" variant="secondary" onClick={() => setIsBedModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Save Changes</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default BedManagement;
