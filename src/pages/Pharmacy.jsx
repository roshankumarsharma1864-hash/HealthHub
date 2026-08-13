import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { pharmacyService } from '../services/hmsServices.js';
import { Plus, Edit2, Trash2, ShieldAlert, Sparkles, RefreshCw, Layers } from 'lucide-react';
import { Button, Input, Select, Card, Badge, Modal } from '../components/UI.jsx';

export const Pharmacy = () => {
  const { user, isAdmin, isPharmacist } = useAuth();
  const toast = useToast();

  const [medicines, setMedicines] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('CREATE');
  const [editingMedId, setEditingMedId] = useState(null);

  // Form states
  const [form, setForm] = useState({
    name: '', category: 'Antibiotics', stock: 100, unitPrice: 10.00, expiryDate: '', supplier: ''
  });

  // Restock state
  const [isRestockOpen, setIsRestockOpen] = useState(false);
  const [selectedMed, setSelectedMed] = useState(null);
  const [restockQty, setRestockQty] = useState(50);

  const loadMedicines = async () => {
    try {
      const list = await pharmacyService.getAll();
      setMedicines(list);
    } catch (err) {
      toast.error('Failed to load medication stock inventory.');
    }
  };

  useEffect(() => {
    loadMedicines();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.stock < 0 || form.unitPrice < 0) {
      toast.warning('Negative stock quantities or prices are invalid.');
      return;
    }

    const medData = {
      ...form,
      stock: Number(form.stock),
      unitPrice: Number(form.unitPrice)
    };

    try {
      if (modalMode === 'CREATE') {
        await pharmacyService.create(medData, user.id);
        toast.success(`Medication "${form.name}" registered successfully.`);
      } else {
        await pharmacyService.update(editingMedId, medData, user.id);
        toast.success('Medication profile updated.');
      }
      setIsModalOpen(false);
      loadMedicines();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleRestockSubmit = async (e) => {
    e.preventDefault();
    if (restockQty <= 0) {
      toast.warning('Restock quantity must be positive.');
      return;
    }
    try {
      await pharmacyService.restock(selectedMed.id, restockQty, user.id);
      toast.success(`Restocked ${restockQty} units of ${selectedMed.name}.`);
      setIsRestockOpen(false);
      setRestockQty(50);
      loadMedicines();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const openCreateModal = () => {
    setModalMode('CREATE');
    setForm({
      name: '',
      category: 'Antibiotics',
      stock: 100,
      unitPrice: 5.50,
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      supplier: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (med) => {
    setModalMode('EDIT');
    setEditingMedId(med.id);
    setForm({
      name: med.name,
      category: med.category,
      stock: med.stock,
      unitPrice: med.unitPrice,
      expiryDate: med.expiryDate,
      supplier: med.supplier
    });
    setIsModalOpen(true);
  };

  const openRestockModal = (med) => {
    setSelectedMed(med);
    setIsRestockOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this medication from the pharmacy catalog database?')) {
      try {
        await pharmacyService.delete(id, user.id);
        toast.success('Medication removed.');
        loadMedicines();
      } catch (err) {
        toast.error(err.message || 'Cannot delete item.');
      }
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">Pharmacy Stock Inventory</h1>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Monitor medication levels, restock alerts, and expiration calendars.</p>
        </div>
        {(isAdmin || isPharmacist) && (
          <Button size="sm" variant="primary" icon={Plus} onClick={openCreateModal}>
            Register Medication
          </Button>
        )}
      </div>

      {/* Grid of Medicines cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {medicines.map((med) => (
          <Card 
            key={med.id} 
            className={`flex flex-col justify-between relative border ${
              med.isLowStock 
                ? 'border-red-300 dark:border-red-900/50 bg-red-50/5 dark:bg-red-950/5' 
                : med.isNearExpiry 
                  ? 'border-amber-300 dark:border-amber-900/50 bg-amber-50/5' 
                  : 'border-slate-100'
            }`}
            headerActions={(isAdmin || isPharmacist) && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => openRestockModal(med)}
                  className="text-slate-400 hover:text-teal-600 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  title="Restock"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => openEditModal(med)}
                  className="text-slate-400 hover:text-teal-600 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  title="Edit"
                >
                  <Edit2 className="w-4.5 h-4.5" />
                </button>
                <button
                  onClick={() => handleDelete(med.id)}
                  className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  title="Remove Product"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          >
            {/* Title / Info */}
            <div className="flex flex-col gap-2">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white leading-tight">{med.name}</h3>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1 block">{med.category}</span>
                </div>
                <Badge variant={med.isLowStock ? 'danger' : med.isNearExpiry ? 'warning' : 'success'}>
                  {med.isLowStock ? 'Low Stock' : med.isNearExpiry ? 'Expiring Soon' : 'In Stock'}
                </Badge>
              </div>

              {/* Warnings details */}
              {med.isLowStock && (
                <div className="flex items-center gap-1.5 text-[9px] font-bold text-red-500 bg-red-50 dark:bg-red-950/20 px-2 py-1 rounded">
                  <ShieldAlert className="w-3.5 h-3.5" /> CRITICAL: Stock drops below threshold ({med.stock} left)
                </div>
              )}
              {med.isNearExpiry && !med.isLowStock && (
                <div className="flex items-center gap-1.5 text-[9px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/20 px-2 py-1 rounded">
                  <ShieldAlert className="w-3.5 h-3.5" /> WARNING: Expires soon ({med.expiryDate})
                </div>
              )}
            </div>

            {/* Bottom pricing / stock details */}
            <div className="border-t border-slate-100 dark:border-slate-700/60 pt-4 mt-4 flex justify-between items-end text-xs">
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Stock Quantity</span>
                <span className={`text-base font-bold ${med.stock <= 10 ? 'text-red-500' : 'text-slate-800 dark:text-slate-200'}`}>
                  {med.stock} Units
                </span>
              </div>
              <div className="text-right">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Price per Unit</span>
                <span className="text-base font-bold text-teal-600 dark:text-teal-400">
                  ${med.unitPrice.toFixed(2)}
                </span>
              </div>
            </div>

            {med.supplier && (
              <div className="text-[8.5px] text-slate-400 mt-2 truncate">
                Supplier: {med.supplier}
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* CREATE/EDIT MEDICATION MODAL */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalMode === 'CREATE' ? 'Register New Medication Product' : 'Modify Medication Profile'}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input 
            label="Medication Name / Dosage Strength" 
            id="med-name" 
            value={form.name} 
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Amoxicillin 250mg" 
            required 
          />
          <div className="grid grid-cols-2 gap-4">
            <Select 
              label="Medicine Category" 
              id="med-cat" 
              value={form.category} 
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              options={[
                { value: 'Antibiotics', label: 'Antibiotics' },
                { value: 'Analgesics', label: 'Analgesics' },
                { value: 'Cardiovascular', label: 'Cardiovascular' },
                { value: 'Antidiabetic', label: 'Antidiabetic' },
                { value: 'Neurological', label: 'Neurological' },
                { value: 'Anesthetics', label: 'Anesthetics' }
              ]}
            />
            <Input 
              label="Supplier Manufacturer" 
              id="med-supplier" 
              value={form.supplier} 
              onChange={(e) => setForm({ ...form, supplier: e.target.value })}
              placeholder="Apex Labs Corp" 
              required
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input 
              label="Initial Stock" 
              id="med-stock" 
              type="number"
              value={form.stock} 
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
              required 
            />
            <Input 
              label="Unit Price ($)" 
              id="med-price" 
              type="number" 
              step="0.01"
              value={form.unitPrice} 
              onChange={(e) => setForm({ ...form, unitPrice: e.target.value })}
              required 
            />
            <Input 
              label="Expiry Date" 
              id="med-expiry" 
              type="date"
              value={form.expiryDate} 
              onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
              required 
            />
          </div>

          <div className="flex justify-end gap-2 mt-2">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">{modalMode === 'CREATE' ? 'Register' : 'Save Changes'}</Button>
          </div>
        </form>
      </Modal>

      {/* RESTOCK MEDICATION MODAL */}
      <Modal isOpen={isRestockOpen} onClose={() => setIsRestockOpen(false)} title={`Restock Product: ${selectedMed?.name}`}>
        <form onSubmit={handleRestockSubmit} className="flex flex-col gap-4">
          <Input 
            label="Additional Units Quantity to Add" 
            id="restock-qty" 
            type="number"
            value={restockQty} 
            onChange={(e) => setRestockQty(Number(e.target.value))}
            required 
            min="1"
          />
          <p className="text-[10px] text-slate-400">
            Current catalog stock: {selectedMed?.stock} units. New calculated catalog stock will be {(selectedMed?.stock || 0) + Number(restockQty)} units.
          </p>
          <div className="flex justify-end gap-2 mt-2">
            <Button type="button" variant="secondary" onClick={() => setIsRestockOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Confirm Restock</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default Pharmacy;
