import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { wardService, patientService } from '../services/hmsServices.js';
import { Bed, Grid, Eye, Check, X, ShieldAlert, Sparkles } from 'lucide-react';
import { Card, Badge, Button, Modal, Select } from '../components/UI.jsx';

export const Wards = () => {
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
      case 'Occupied': return 'bed-occupied border-red-200 hover:border-red-400';
      case 'Cleaning': return 'bed-cleaning border-amber-200 hover:border-amber-400';
      case 'Reserved': return 'bed-reserved border-indigo-200 hover:border-indigo-400';
      case 'Available':
      default:
        return 'bed-available border-emerald-200 hover:border-emerald-400';
    }
  };

  const handleBedClick = (bed) => {
    if (!isAdmin && !isReceptionist) return; // Read-only for other roles
    setSelectedBed(bed);
    setBedFormStatus(bed.status);
    setBedFormPatientId(bed.patientId || '');
    setIsBedModalOpen(true);
  };

  const handleBedSubmit = async (e) => {
    e.preventDefault();
    try {
      if (bedFormStatus === 'Occupied' && !bedFormPatientId) {
        toast.warning('Please select a patient to occupy the bed.');
        return;
      }

      await wardService.updateBedStatus(selectedWard.id, selectedBed.bedNo, bedFormStatus, user.id);
      
      // If setting patient to bed, link patient as well
      if (bedFormStatus === 'Occupied' && bedFormPatientId) {
        await patientService.admit(bedFormPatientId, selectedWard.id, selectedBed.bedNo, user.id);
      }

      toast.success(`Bed ${selectedBed.bedNo} status updated successfully.`);
      setIsBedModalOpen(false);
      loadWardsData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Patients who aren't currently admitted anywhere
  const outpatientList = patients.filter(p => p.admissionStatus !== 'Admitted');

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Title Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-white">Ward & Bed Occupancy</h1>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Monitor real-time patient bed layouts, ICU rooms, and cleanings.</p>
      </div>

      {/* Ward Cards Summary row */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {wards.map((ward) => {
          const occupancyRate = Math.round((ward.occupiedBeds / ward.totalBeds) * 100);
          const isSelected = selectedWard?.id === ward.id;
          return (
            <button
              key={ward.id}
              onClick={() => setSelectedWard(ward)}
              className={`text-left w-full transition-all rounded-2xl border p-5 shadow-premium flex flex-col gap-4 bg-white dark:bg-slate-800 ${
                isSelected 
                  ? 'border-teal-600 ring-2 ring-teal-500/10' 
                  : 'border-slate-100 hover:border-slate-350 dark:border-slate-700/60'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">{ward.name}</h3>
                <Badge variant={ward.type === 'ICU' ? 'danger' : 'info'}>{ward.type}</Badge>
              </div>

              {/* Progress bar */}
              <div className="w-full">
                <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold mb-1.5 uppercase tracking-wider">
                  <span>Occupancy: {ward.occupiedBeds} / {ward.totalBeds} Beds</span>
                  <span>{occupancyRate}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-300 ${
                      occupancyRate > 80 ? 'bg-red-500' : occupancyRate > 50 ? 'bg-amber-500' : 'bg-teal-600'
                    }`}
                    style={{ width: `${occupancyRate}%` }}
                  />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Ward Visual Grid Layout */}
      {selectedWard && (
        <Card 
          title={`${selectedWard.name} Bed Grid Layout`} 
          subtitle="Click on any bed card to update its status or check assigned patient details."
          className="flex-grow bg-white border border-slate-100 dark:border-slate-700"
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {selectedWard.bedList.map((bed) => (
              <div
                key={bed.bedNo}
                onClick={() => handleBedClick(bed)}
                className={`bed-card min-h-24 ${getBedStatusClass(bed.status)}`}
              >
                <div className="flex justify-between items-center w-full">
                  <span className="text-[10px] font-bold tracking-wider font-mono">{bed.bedNo}</span>
                  <Badge variant={
                    bed.status === 'Available' ? 'success' : 
                    bed.status === 'Occupied' ? 'danger' : 
                    bed.status === 'Cleaning' ? 'warning' : 'neutral'
                  } className="px-1.5 py-0 text-[8px]">
                    {bed.status}
                  </Badge>
                </div>

                <div className="mt-4">
                  {bed.status === 'Occupied' && bed.patient ? (
                    <div>
                      <p className="text-[10px] font-bold text-slate-700 dark:text-slate-350 truncate">{bed.patient.name}</p>
                      <p className="text-[8px] text-slate-400 mt-0.5">ID: {bed.patient.id.substring(0, 8)}</p>
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-400 select-none">
                      {bed.status === 'Cleaning' ? 'Needs Disinfecting' : 'Empty Bed'}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* BED EDIT STATUS MODAL */}
      <Modal isOpen={isBedModalOpen} onClose={() => setIsBedModalOpen(false)} title={`Configure Bed: ${selectedBed?.bedNo}`}>
        <form onSubmit={handleBedSubmit} className="flex flex-col gap-4">
          <Select
            label="Bed Status Option"
            id="bed-stat"
            value={bedFormStatus}
            onChange={(e) => {
              setBedFormStatus(e.target.value);
              if (e.target.value !== 'Occupied') setBedFormPatientId('');
            }}
            required
            options={[
              { value: 'Available', label: 'Available (Vacant & Clean)' },
              { value: 'Occupied', label: 'Occupied (Assign Patient)' },
              { value: 'Cleaning', label: 'Cleaning (Disinfecting / Prep)' },
              { value: 'Reserved', label: 'Reserved (Scheduled Inpatient)' }
            ]}
          />

          {bedFormStatus === 'Occupied' && (
            <Select
              label="Select Patient to Admit"
              id="bed-pat"
              value={bedFormPatientId}
              onChange={(e) => setBedFormPatientId(e.target.value)}
              required
              options={[
                { value: '', label: '-- Choose Patient --' },
                ...outpatientList.map(p => ({ value: p.id, label: `${p.name} (Gender: ${p.gender}, Age: ${p.age})` }))
              ]}
            />
          )}

          <div className="flex justify-end gap-2 mt-2">
            <Button type="button" variant="secondary" onClick={() => setIsBedModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Apply Status</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default Wards;
