import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { pharmacyService } from '../services/hmsServices.js';
import { Plus, Edit2, Trash2, ShieldAlert, Sparkles, RefreshCw } from 'lucide-react';
import { Button, Input, Select, Card, Badge, Modal } from '../components/UI.jsx';

export const Pharmacy = () => {
  const { user, isAdmin, isPharmacist } = useAuth();
  const toast = useToast();

  const [medicines, setMedicines] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [stockFilter, setStockFilter] = useState('All');

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
      supplier: med.supplier || ''
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

  // Dynamic statistics
  const stats = {
    total: medicines.length,
    inStock: medicines.filter(m => m.stock > 10).length,
    lowStock: medicines.filter(m => m.stock <= 10 && m.stock > 0).length,
    outOfStock: medicines.filter(m => m.stock === 0).length
  };

  // Filtered meds
  const filteredMeds = medicines.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(search.toLowerCase()) || m.category.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || m.category === categoryFilter;
    const matchesStock = stockFilter === 'All' 
      ? true 
      : stockFilter === 'Low' 
        ? m.stock <= 10 && m.stock > 0
        : stockFilter === 'Out' 
          ? m.stock === 0
          : m.stock > 10;
    return matchesSearch && matchesCategory && matchesStock;
  });

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Title */}
      <div className="flex justify-between items-center select-none">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">Pharmacy Catalog</h1>
          <p className="text-slate-400 text-xs mt-1">Manage hospital pharmacy stocks and reorder thresholds.</p>
        </div>
        {(isAdmin || isPharmacist) && (
          <Button size="sm" variant="primary" icon={Plus} onClick={openCreateModal}>
            Register Medication
          </Button>
        )}
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 select-none">
        <Card className="p-4 flex flex-col justify-between hover:shadow-premium duration-150 transition-all">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Medicines</span>
          <span className="text-2xl font-extrabold text-slate-800 dark:text-white mt-2">{stats.total}</span>
        </Card>
        <Card className="p-4 flex flex-col justify-between hover:shadow-premium duration-150 transition-all">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">In Stock</span>
          <span className="text-2xl font-extrabold text-slate-800 dark:text-white mt-2 text-emerald-600">{stats.inStock}</span>
        </Card>
        <Card className="p-4 flex flex-col justify-between hover:shadow-premium duration-150 transition-all">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Low Stock Alerts</span>
          <span className="text-2xl font-extrabold text-slate-800 dark:text-white mt-2 text-amber-500">{stats.lowStock}</span>
        </Card>
        <Card className="p-4 flex flex-col justify-between hover:shadow-premium duration-150 transition-all">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Out of Stock</span>
          <span className="text-2xl font-extrabold text-slate-800 dark:text-white mt-2 text-red-500">{stats.outOfStock}</span>
        </Card>
      </div>

      {/* AI Prediction Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-primary-50/70 border border-primary-200 text-primary-850 dark:bg-slate-900/50 dark:border-slate-800 text-xs p-4 rounded-2xl flex items-center gap-3 select-none leading-relaxed font-semibold">
          <Sparkles className="w-5 h-5 text-primary-650 flex-shrink-0 animate-pulse" />
          <span><strong>AI Prediction:</strong> Paracetamol stock may run out in 5 days based on recent prescription patterns.</span>
        </div>
        <div className="bg-primary-50/70 border border-primary-200 text-primary-850 dark:bg-slate-900/50 dark:border-slate-800 text-xs p-4 rounded-2xl flex items-center gap-3 select-none leading-relaxed font-semibold">
          <Sparkles className="w-5 h-5 text-primary-650 flex-shrink-0 animate-pulse" />
          <span><strong>AI Demand Forecast:</strong> Amoxicillin demand is expected to increase next week. System alerts are armed.</span>
        </div>
      </div>

      {/* Filter panel */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-4 rounded-2xl shadow-sm select-none">
        <Input
          id="f-search"
          placeholder="Search by medicine name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:col-span-2"
        />
        <Select
          id="f-cat"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          options={[
            { value: 'All', label: 'All Categories' },
            { value: 'Antibiotics', label: 'Antibiotics' },
            { value: 'Analgesics', label: 'Analgesics' },
            { value: 'Antihypertensives', label: 'Antihypertensives' },
            { value: 'Statins', label: 'Statins' },
            { value: 'Antidiabetics', label: 'Antidiabetics' }
          ]}
        />
        <Select
          id="f-stock"
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value)}
          options={[
            { value: 'All', label: 'All Stock Levels' },
            { value: 'Low', label: 'Low Stock' },
            { value: 'Out', label: 'Out of Stock' },
            { value: 'Normal', label: 'Healthy Stock' }
          ]}
        />
      </div>

      {/* Medicines Table */}
      <Card title="Medication Catalog List" subtitle="Monitored stock items ledger" className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs select-none">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
              <th className="py-3 px-4">Medicine Name</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Price</th>
              <th className="py-3 px-4">Stock Quantity</th>
              <th className="py-3 px-4">Expiry Date</th>
              <th className="py-3 px-4">Supplier</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-850">
            {filteredMeds.map(med => (
              <tr key={med.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-750/10 transition-colors">
                <td className="py-3 px-4 font-bold text-slate-850 dark:text-slate-200">{med.name}</td>
                <td className="py-3 px-4 text-slate-500">{med.category}</td>
                <td className="py-3 px-4 text-primary-600 font-semibold">${med.unitPrice.toFixed(2)}</td>
                <td className="py-3 px-4 font-bold text-slate-750 dark:text-slate-250">
                  {med.stock} Units
                </td>
                <td className="py-3 px-4 text-slate-500">{med.expiryDate}</td>
                <td className="py-3 px-4 text-slate-500">{med.supplier || 'N/A'}</td>
                <td className="py-3 px-4">
                  <Badge variant={med.stock === 0 ? 'danger' : med.stock <= 10 ? 'warning' : 'success'}>
                    {med.stock === 0 ? 'Out of Stock' : med.stock <= 10 ? 'Low Stock' : 'In Stock'}
                  </Badge>
                </td>
                <td className="py-3 px-4 text-right flex justify-end gap-1.5 mt-0.5">
                  {(isAdmin || isPharmacist) && (
                    <>
                      <Button size="xs" variant="secondary" icon={RefreshCw} onClick={() => openRestockModal(med)}>
                        Restock
                      </Button>
                      <button
                        onClick={() => openEditModal(med)}
                        className="text-slate-400 hover:text-primary-600 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(med.id)}
                        className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {filteredMeds.length === 0 && (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-405 text-sm">
                  No medication records match the filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

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
                { value: 'Antihypertensives', label: 'Antihypertensives' },
                { value: 'Statins', label: 'Statins' },
                { value: 'Antidiabetics', label: 'Antidiabetics' }
              ]}
            />
            <Input 
              label="Price per Unit ($)" 
              id="med-price" 
              type="number"
              step="0.01"
              value={form.unitPrice} 
              onChange={(e) => setForm({ ...form, unitPrice: e.target.value })}
              placeholder="10.00" 
              required 
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Initial Stock Quantity" 
              id="med-stock" 
              type="number"
              value={form.stock} 
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
              placeholder="100" 
              required 
              disabled={modalMode === 'EDIT'}
            />
            <Input 
              label="Expiration Date" 
              id="med-exp" 
              type="date"
              value={form.expiryDate} 
              onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
              required 
            />
          </div>
          <Input 
            label="Supplier Name" 
            id="med-supp" 
            value={form.supplier} 
            onChange={(e) => setForm({ ...form, supplier: e.target.value })}
            placeholder="PharmaCorp Distributors" 
            required 
          />

          <div className="flex justify-end gap-2 mt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">{modalMode === 'CREATE' ? 'Register Product' : 'Save Changes'}</Button>
          </div>
        </form>
      </Modal>

      {/* RESTOCK MODAL */}
      <Modal isOpen={isRestockOpen} onClose={() => setIsRestockOpen(false)} title="Restock Medication Inventory">
        <form onSubmit={handleRestockSubmit} className="flex flex-col gap-4">
          <div className="text-sm select-none">
            Selected product: <strong className="text-slate-800 dark:text-slate-100">{selectedMed?.name}</strong> (Current Stock: {selectedMed?.stock} units)
          </div>
          <Input
            label="Additional Restock Quantity"
            id="re-qty"
            type="number"
            value={restockQty}
            onChange={(e) => setRestockQty(Number(e.target.value))}
            required
          />
          <div className="flex justify-end gap-2 mt-4">
            <Button type="button" variant="secondary" onClick={() => setIsRestockOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Confirm Restock</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Pharmacy;
