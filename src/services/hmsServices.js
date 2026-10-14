import { KEYS, db } from './db.js';

// ==========================================
// 1. PATIENT SERVICE
// ==========================================
export const patientService = {
  async getAll() {
    const patients = await db.getAll(KEYS.PATIENTS);
    const doctors = await db.getAll(KEYS.DOCTORS);
    const wards = await db.getAll(KEYS.WARDS);

    // Join Doctor and Ward data
    return patients.map(patient => ({
      ...patient,
      assignedDoctor: doctors.find(d => d.id === patient.assignedDoctorId) || null,
      ward: wards.find(w => w.id === patient.wardId) || null
    }));
  },

  async getById(id) {
    const patients = await this.getAll();
    const patient = patients.find(p => p.id === id);
    if (!patient) return null;

    // Gather patient clinical history
    const appointments = await db.getAll(KEYS.APPOINTMENTS);
    const bills = await db.getAll(KEYS.BILLS);
    const prescriptions = await db.getAll(KEYS.PRESCRIPTIONS);
    const labReports = await db.getAll(KEYS.LAB_REPORTS);
    const doctors = await db.getAll(KEYS.DOCTORS);
    const medicines = await db.getAll(KEYS.MEDICINES);

    // Patient specific records
    patient.history = {
      appointments: appointments
        .filter(a => a.patientId === id)
        .map(a => ({
          ...a,
          doctor: doctors.find(d => d.id === a.doctorId)
        })),
      bills: bills.filter(b => b.patientId === id),
      prescriptions: prescriptions
        .filter(p => p.patientId === id)
        .map(p => ({
          ...p,
          doctor: doctors.find(d => d.id === p.doctorId),
          medicines: p.medicines.map(m => ({
            ...m,
            detail: medicines.find(med => med.id === m.medId)
          }))
        })),
      labReports: labReports
        .filter(l => l.patientId === id)
        .map(l => ({
          ...l,
          doctor: doctors.find(d => d.id === l.doctorId)
        }))
    };

    return patient;
  },

  async create(patientData, userId = 'system') {
    // Handle ward allocation inline if wardId is provided during creation
    const newPatient = await db.create(KEYS.PATIENTS, {
      ...patientData,
      admissionStatus: patientData.wardId ? 'Admitted' : 'Outpatient',
      userId
    });

    if (patientData.wardId && patientData.bedNo) {
      await wardService.assignBed(patientData.wardId, patientData.bedNo, newPatient.id, userId);
    }

    return newPatient;
  },

  async update(id, updates, userId = 'system') {
    const oldPatient = await db.getById(KEYS.PATIENTS, id);
    const updatedPatient = await db.update(KEYS.PATIENTS, id, { ...updates, userId });

    // Handle ward status updates
    if (oldPatient.wardId !== updates.wardId || oldPatient.bedNo !== updates.bedNo) {
      // Free old bed if any
      if (oldPatient.wardId && oldPatient.bedNo) {
        await wardService.freeBed(oldPatient.wardId, oldPatient.bedNo, userId);
      }
      // Assign new bed if any
      if (updates.wardId && updates.bedNo) {
        await wardService.assignBed(updates.wardId, updates.bedNo, id, userId);
        await db.update(KEYS.PATIENTS, id, { admissionStatus: 'Admitted', userId });
      } else {
        await db.update(KEYS.PATIENTS, id, { admissionStatus: 'Outpatient', userId });
      }
    }

    return updatedPatient;
  },

  async delete(id, userId = 'system') {
    // Enforce integrity: check bills, appointments
    const bills = await db.getAll(KEYS.BILLS);
    const unpaid = bills.filter(b => b.patientId === id && b.status !== 'Paid');
    if (unpaid.length > 0) {
      throw new Error(`Cannot delete patient. Patient has ${unpaid.length} unpaid or partially paid bills.`);
    }

    const appointments = await db.getAll(KEYS.APPOINTMENTS);
    const activeApts = appointments.filter(a => a.patientId === id && (a.status === 'Confirmed' || a.status === 'Pending'));
    if (activeApts.length > 0) {
      throw new Error(`Cannot delete patient. Patient has ${activeApts.length} active scheduled appointments.`);
    }

    // Free bed first if admitted
    const patient = await db.getById(KEYS.PATIENTS, id);
    if (patient.wardId && patient.bedNo) {
      await wardService.freeBed(patient.wardId, patient.bedNo, userId);
    }

    // Cascading soft actions: mark completed/cancelled on other entities, or clean records
    return await db.delete(KEYS.PATIENTS, id, userId);
  },

  async admit(id, wardId, bedNo, userId = 'system') {
    const patient = await db.getById(KEYS.PATIENTS, id);
    if (patient.wardId && patient.bedNo) {
      // Free current bed first
      await wardService.freeBed(patient.wardId, patient.bedNo, userId);
    }
    await wardService.assignBed(wardId, bedNo, id, userId);
    return await db.update(KEYS.PATIENTS, id, {
      admissionStatus: 'Admitted',
      wardId,
      bedNo,
      userId
    });
  },

  async discharge(id, userId = 'system') {
    const patient = await db.getById(KEYS.PATIENTS, id);
    if (patient.wardId && patient.bedNo) {
      await wardService.freeBed(patient.wardId, patient.bedNo, userId);
    }
    
    // Generate room charges bill item automatically on discharge
    const ward = await wardService.getById(patient.wardId);
    let roomCost = 1500; // default General Ward (INR)
    if (ward) {
      if (ward.type === 'ICU') roomCost = 6500;
      else if (ward.type === 'Private') roomCost = 3500;
      else if (ward.type === 'Emergency') roomCost = 2500;
    }

    // Calculate days admitted (min 1 day)
    const admittedTime = new Date(patient.createdAt).getTime();
    const days = Math.max(1, Math.ceil((Date.now() - admittedTime) / (1000 * 60 * 60 * 24)));
    
    // Auto-create bill for inpatient stay
    await billingService.create({
      patientId: id,
      items: [
        { desc: `Inpatient stay room charges - ${ward?.name || 'Ward'} (${days} Days)`, qty: days, cost: roomCost },
        { desc: `Specialist physician rounds fee`, qty: 1, cost: 1000.00 }
      ],
      status: 'Unpaid',
      paymentMode: 'Cash'
    }, userId);

    return await db.update(KEYS.PATIENTS, id, {
      admissionStatus: 'Discharged',
      wardId: null,
      bedNo: null,
      userId
    });
  }
};

// ==========================================
// 2. DOCTOR SERVICE
// ==========================================
export const doctorService = {
  async getAll() {
    return await db.getAll(KEYS.DOCTORS);
  },

  async getById(id) {
    return await db.getById(KEYS.DOCTORS, id);
  },

  async create(doctorData, userId = 'system') {
    return await db.create(KEYS.DOCTORS, { ...doctorData, userId });
  },

  async update(id, updates, userId = 'system') {
    return await db.update(KEYS.DOCTORS, id, { ...updates, userId });
  },

  async delete(id, userId = 'system') {
    // Verify scheduled appointments
    const appointments = await db.getAll(KEYS.APPOINTMENTS);
    const active = appointments.filter(a => a.doctorId === id && (a.status === 'Confirmed' || a.status === 'Pending'));
    if (active.length > 0) {
      throw new Error(`Cannot delete doctor profile. Doctor has ${active.length} upcoming scheduled appointments.`);
    }
    return await db.delete(KEYS.DOCTORS, id, userId);
  }
};

// ==========================================
// 3. APPOINTMENT SERVICE
// ==========================================
export const appointmentService = {
  async getAll() {
    const appointments = await db.getAll(KEYS.APPOINTMENTS);
    const patients = await db.getAll(KEYS.PATIENTS);
    const doctors = await db.getAll(KEYS.DOCTORS);

    return appointments.map(apt => ({
      ...apt,
      patient: patients.find(p => p.id === apt.patientId) || null,
      doctor: doctors.find(d => d.id === apt.doctorId) || null
    })).sort((a, b) => new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time));
  },

  async getById(id) {
    const appointments = await this.getAll();
    return appointments.find(a => a.id === id) || null;
  },

  async create(appointmentData, userId = 'system') {
    // 1. Prevent Double-Booking: Verify Doctor schedule conflict
    const appointments = await db.getAll(KEYS.APPOINTMENTS);
    const overlap = appointments.find(a => 
      a.doctorId === appointmentData.doctorId &&
      a.date === appointmentData.date &&
      a.time === appointmentData.time &&
      a.status !== 'Cancelled'
    );
    if (overlap) {
      throw new Error(`Doctor is already booked for ${appointmentData.time} on ${appointmentData.date}. Please pick a different slot.`);
    }

    // 2. Verify Doctor is available on that day of week
    const doctor = await db.getById(KEYS.DOCTORS, appointmentData.doctorId);
    if (doctor) {
      const dateObj = new Date(appointmentData.date);
      const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayName = weekdays[dateObj.getDay()];
      if (!doctor.availability.includes(dayName)) {
        throw new Error(`Dr. ${doctor.name} is not scheduled to work on ${dayName}s. Availability: ${doctor.availability.join(', ')}`);
      }
    }

    return await db.create(KEYS.APPOINTMENTS, {
      ...appointmentData,
      status: appointmentData.status || 'Pending',
      userId
    });
  },

  async update(id, updates, userId = 'system') {
    // If updating date/time slot, prevent double-booking
    if (updates.date || updates.time || updates.doctorId) {
      const current = await db.getById(KEYS.APPOINTMENTS, id);
      const docId = updates.doctorId || current.doctorId;
      const date = updates.date || current.date;
      const time = updates.time || current.time;

      const appointments = await db.getAll(KEYS.APPOINTMENTS);
      const overlap = appointments.find(a => 
        a.id !== id &&
        a.doctorId === docId &&
        a.date === date &&
        a.time === time &&
        a.status !== 'Cancelled'
      );
      if (overlap) {
        throw new Error(`Doctor is already booked for ${time} on ${date}.`);
      }
    }
    return await db.update(KEYS.APPOINTMENTS, id, { ...updates, userId });
  },

  async cancel(id, userId = 'system') {
    return await db.update(KEYS.APPOINTMENTS, id, { status: 'Cancelled', userId });
  },

  async complete(id, userId = 'system') {
    return await db.update(KEYS.APPOINTMENTS, id, { status: 'Completed', userId });
  }
};

// ==========================================
// 4. WARD SERVICE
// ==========================================
export const wardService = {
  async getAll() {
    const wards = await db.getAll(KEYS.WARDS);
    const patients = await db.getAll(KEYS.PATIENTS);

    // Calculate occupied bed statistics dynamically
    return wards.map(ward => {
      const bedList = ward.bedList.map(bed => ({
        ...bed,
        patient: patients.find(p => p.id === bed.patientId) || null
      }));
      const occupiedBeds = bedList.filter(b => b.status === 'Occupied').length;
      return {
        ...ward,
        bedList,
        occupiedBeds
      };
    });
  },

  async getById(id) {
    const wards = await this.getAll();
    return wards.find(w => w.id === id) || null;
  },

  async assignBed(wardId, bedNo, patientId, userId = 'system') {
    const wards = await db.getAll(KEYS.WARDS);
    const wardIndex = wards.findIndex(w => w.id === wardId);
    if (wardIndex === -1) throw new Error(`Ward not found.`);

    const bedIndex = wards[wardIndex].bedList.findIndex(b => b.bedNo === bedNo);
    if (bedIndex === -1) throw new Error(`Bed ${bedNo} not found in ward.`);

    const bed = wards[wardIndex].bedList[bedIndex];
    if (bed.status === 'Occupied' && bed.patientId !== patientId) {
      throw new Error(`Bed ${bedNo} is currently occupied.`);
    }

    wards[wardIndex].bedList[bedIndex] = {
      ...bed,
      status: 'Occupied',
      patientId
    };

    // Calculate occupied count
    wards[wardIndex].occupiedBeds = wards[wardIndex].bedList.filter(b => b.status === 'Occupied').length;

    await db.saveAllRaw(KEYS.WARDS, wards);
    await db.logActivity(userId, 'ASSIGN_BED', 'wards', `Assigned patient ${patientId} to Bed ${bedNo}`);
    return true;
  },

  async freeBed(wardId, bedNo, userId = 'system') {
    const wards = await db.getAll(KEYS.WARDS);
    const wardIndex = wards.findIndex(w => w.id === wardId);
    if (wardIndex === -1) return;

    const bedIndex = wards[wardIndex].bedList.findIndex(b => b.bedNo === bedNo);
    if (bedIndex === -1) return;

    const bed = wards[wardIndex].bedList[bedIndex];
    wards[wardIndex].bedList[bedIndex] = {
      ...bed,
      status: 'Cleaning', // Mark for cleaning on vacate
      patientId: null
    };

    wards[wardIndex].occupiedBeds = wards[wardIndex].bedList.filter(b => b.status === 'Occupied').length;

    await db.saveAllRaw(KEYS.WARDS, wards);
    await db.logActivity(userId, 'FREE_BED', 'wards', `Freed Bed ${bedNo} (marked for Cleaning)`);
    return true;
  },

  async updateBedStatus(wardId, bedNo, status, userId = 'system') {
    const wards = await db.getAll(KEYS.WARDS);
    const wardIndex = wards.findIndex(w => w.id === wardId);
    if (wardIndex === -1) return;

    const bedIndex = wards[wardIndex].bedList.findIndex(b => b.bedNo === bedNo);
    if (bedIndex === -1) return;

    wards[wardIndex].bedList[bedIndex].status = status;
    if (status !== 'Occupied') {
      wards[wardIndex].bedList[bedIndex].patientId = null;
    }

    wards[wardIndex].occupiedBeds = wards[wardIndex].bedList.filter(b => b.status === 'Occupied').length;

    await db.saveAllRaw(KEYS.WARDS, wards);
    await db.logActivity(userId, 'UPDATE_BED_STATUS', 'wards', `Set Bed ${bedNo} status to ${status}`);
    return true;
  }
};

// ==========================================
// 5. BILLING SERVICE
// ==========================================
export const billingService = {
  async getAll() {
    const bills = await db.getAll(KEYS.BILLS);
    const patients = await db.getAll(KEYS.PATIENTS);

    return bills.map(bill => ({
      ...bill,
      patient: patients.find(p => p.id === bill.patientId) || null
    })).sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  async getById(id) {
    const bills = await this.getAll();
    return bills.find(b => b.id === id) || null;
  },

  async create(billData, userId = 'system') {
    const subtotal = billData.items.reduce((sum, item) => sum + (item.qty * item.cost), 0);
    const tax = Math.round(subtotal * 0.05 * 100) / 100; // 5% VAT
    const discount = billData.discount || 0;
    const total = Math.max(0, subtotal + tax - discount);

    return await db.create(KEYS.BILLS, {
      patientId: billData.patientId,
      items: billData.items,
      subtotal,
      tax,
      discount,
      total,
      status: billData.status || 'Unpaid',
      paymentMode: billData.paymentMode || 'Cash',
      date: billData.date || new Date().toISOString().split('T')[0],
      userId
    });
  },

  async update(id, updates, userId = 'system') {
    if (updates.items) {
      const subtotal = updates.items.reduce((sum, item) => sum + (item.qty * item.cost), 0);
      const tax = Math.round(subtotal * 0.05 * 100) / 100;
      const discount = updates.discount ?? 0;
      updates.subtotal = subtotal;
      updates.tax = tax;
      updates.total = Math.max(0, subtotal + tax - discount);
    }
    return await db.update(KEYS.BILLS, id, { ...updates, userId });
  },

  async pay(id, paymentMode, userId = 'system') {
    return await db.update(KEYS.BILLS, id, {
      status: 'Paid',
      paymentMode,
      userId
    });
  },

  async delete(id, userId = 'system') {
    return await db.delete(KEYS.BILLS, id, userId);
  }
};

// ==========================================
// 6. PHARMACY SERVICE
// ==========================================
export const pharmacyService = {
  async getAll() {
    const medicines = await db.getAll(KEYS.MEDICINES);
    // Check flags
    return medicines.map(med => {
      const isLowStock = med.stock <= 10;
      const expiry = new Date(med.expiryDate);
      const threeMonthsOut = new Date();
      threeMonthsOut.setMonth(threeMonthsOut.getMonth() + 3);
      const isNearExpiry = expiry <= threeMonthsOut;

      return {
        ...med,
        isLowStock,
        isNearExpiry
      };
    });
  },

  async getById(id) {
    const meds = await this.getAll();
    return meds.find(m => m.id === id) || null;
  },

  async create(medData, userId = 'system') {
    return await db.create(KEYS.MEDICINES, { ...medData, userId });
  },

  async update(id, updates, userId = 'system') {
    return await db.update(KEYS.MEDICINES, id, { ...updates, userId });
  },

  async delete(id, userId = 'system') {
    // Check if medicine is present in active prescriptions
    const prescriptions = await db.getAll(KEYS.PRESCRIPTIONS);
    const active = prescriptions.filter(p => p.status !== 'Dispensed' && p.medicines.some(m => m.medId === id));
    if (active.length > 0) {
      throw new Error(`Cannot delete medication. It is pending in ${active.length} active prescriptions.`);
    }
    return await db.delete(KEYS.MEDICINES, id, userId);
  },

  async restock(id, qty, userId = 'system') {
    const med = await db.getById(KEYS.MEDICINES, id);
    if (!med) throw new Error('Medication not found.');
    
    const newStock = Number(med.stock) + Number(qty);
    await db.update(KEYS.MEDICINES, id, { stock: newStock });
    await db.logActivity(userId, 'RESTOCK', 'pharmacy', `Restocked ${qty} units of ${med.name}`);
    return true;
  },

  async deductStock(id, qty) {
    const med = await db.getById(KEYS.MEDICINES, id);
    if (!med) throw new Error('Medication not found.');

    if (med.stock < qty) {
      throw new Error(`Insufficient stock for ${med.name}. Available: ${med.stock}, Required: ${qty}`);
    }

    await db.update(KEYS.MEDICINES, id, { stock: med.stock - qty });
    return true;
  }
};

// ==========================================
// 7. PRESCRIPTION SERVICE
// ==========================================
export const prescriptionService = {
  async getAll() {
    const prescriptions = await db.getAll(KEYS.PRESCRIPTIONS);
    const patients = await db.getAll(KEYS.PATIENTS);
    const doctors = await db.getAll(KEYS.DOCTORS);
    const medicines = await db.getAll(KEYS.MEDICINES);

    return prescriptions.map(pres => ({
      ...pres,
      patient: patients.find(p => p.id === pres.patientId) || null,
      doctor: doctors.find(d => d.id === pres.doctorId) || null,
      medicines: pres.medicines.map(m => ({
        ...m,
        detail: medicines.find(med => med.id === m.medId) || null
      }))
    })).sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  async getById(id) {
    const prescriptions = await this.getAll();
    return prescriptions.find(p => p.id === id) || null;
  },

  async create(presData, userId = 'system') {
    return await db.create(KEYS.PRESCRIPTIONS, {
      ...presData,
      status: 'Pending', // Pending -> Dispensed
      date: presData.date || new Date().toISOString().split('T')[0],
      userId
    });
  },

  async dispense(id, userId = 'system') {
    const pres = await db.getById(KEYS.PRESCRIPTIONS, id);
    if (!pres) throw new Error('Prescription not found.');
    if (pres.status === 'Dispensed') throw new Error('Prescription is already dispensed.');

    // 1. Transactional Validation: Verify all items have enough stock first
    for (const item of pres.medicines) {
      const med = await db.getById(KEYS.MEDICINES, item.medId);
      if (!med || med.stock < Number(item.dosage.includes('tablet') ? 30 : 1)) { // Fallback checking
        // For simplicity, let's treat stock checking as direct match or decrementing item qty
        const checkQty = 10; // Treat default prescription fulfillment quantity as 10 units
        if (med.stock < checkQty) {
          throw new Error(`Insufficient pharmacy stock for ${med?.name || 'medication'}. Available: ${med?.stock}, Required: ${checkQty}`);
        }
      }
    }

    // 2. Perform stock deductions
    const medicines = await db.getAll(KEYS.MEDICINES);
    const billItems = [];

    for (const item of pres.medicines) {
      const medIndex = medicines.findIndex(m => m.id === item.medId);
      if (medIndex !== -1) {
        const qtyToDeduct = 10; // Default fill quantity
        medicines[medIndex].stock = Math.max(0, medicines[medIndex].stock - qtyToDeduct);
        
        // Add to auto billing items
        billItems.push({
          desc: `Medication: ${medicines[medIndex].name} Fulfillment`,
          qty: 1,
          cost: medicines[medIndex].unitPrice * qtyToDeduct
        });
      }
    }

    // Save deducted stocks
    await db.saveAllRaw(KEYS.MEDICINES, medicines);

    // 3. Auto-generate billing invoice for the medicines
    if (billItems.length > 0) {
      await billingService.create({
        patientId: pres.patientId,
        items: billItems,
        status: 'Unpaid',
        paymentMode: 'Cash'
      }, userId);
    }

    // 4. Mark prescription as Dispensed
    await db.update(KEYS.PRESCRIPTIONS, id, { status: 'Dispensed' });
    await db.logActivity(userId, 'DISPENSE', 'prescriptions', `Dispensed prescription ${id} and generated medicine invoice.`);
    return true;
  }
};

// ==========================================
// 8. LAB SERVICE
// ==========================================
export const labService = {
  async getAll() {
    const reports = await db.getAll(KEYS.LAB_REPORTS);
    const patients = await db.getAll(KEYS.PATIENTS);
    const doctors = await db.getAll(KEYS.DOCTORS);

    return reports.map(rep => ({
      ...rep,
      patient: patients.find(p => p.id === rep.patientId) || null,
      doctor: doctors.find(d => d.id === rep.doctorId) || null
    })).sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  async create(reportData, userId = 'system') {
    return await db.create(KEYS.LAB_REPORTS, {
      ...reportData,
      status: reportData.status || 'Ordered',
      date: reportData.date || new Date().toISOString().split('T')[0],
      userId
    });
  },

  async updateResult(id, resultText, status = 'Completed', userId = 'system') {
    const report = await db.getById(KEYS.LAB_REPORTS, id);
    if (!report) throw new Error('Lab report not found.');

    // Auto-create bill for completed lab tests
    if (status === 'Completed' && report.status !== 'Completed') {
      await billingService.create({
        patientId: report.patientId,
        items: [
          { desc: `Lab Diagnostic: ${report.testName}`, qty: 1, cost: 750.00 }
        ],
        status: 'Unpaid',
        paymentMode: 'Cash'
      }, userId);
    }

    return await db.update(KEYS.LAB_REPORTS, id, {
      resultText,
      status,
      userId
    });
  }
};

// ==========================================
// 9. ACTIVITY SERVICE
// ==========================================
export const activityService = {
  async getAll() {
    const logs = await db.getAll(KEYS.ACTIVITY_LOG);
    const users = await db.getAll(KEYS.USERS);

    return logs.map(log => ({
      ...log,
      user: users.find(u => u.id === log.userId) || { name: 'System Event', role: 'System' }
    }));
  }
};

// ==========================================
// 10. DEPARTMENT SERVICE
// ==========================================
export const departmentService = {
  async getAll() {
    const depts = await db.getAll(KEYS.DEPARTMENTS);
    const doctors = await db.getAll(KEYS.DOCTORS);
    return depts.map(d => ({
      ...d,
      headDoctor: doctors.find(doc => doc.id === d.headDoctorId) || null
    }));
  },
  async getById(id) {
    const depts = await this.getAll();
    return depts.find(d => d.id === id) || null;
  },
  async create(deptData, userId = 'system') {
    return await db.create(KEYS.DEPARTMENTS, { ...deptData, userId });
  },
  async update(id, deptData, userId = 'system') {
    return await db.update(KEYS.DEPARTMENTS, id, { ...deptData, userId });
  },
  async delete(id, userId = 'system') {
    return await db.delete(KEYS.DEPARTMENTS, id, userId);
  }
};

// ==========================================
// 11. EMERGENCY SERVICE
// ==========================================
export const emergencyService = {
  async getAll() {
    const cases = await db.getAll(KEYS.EMERGENCY);
    const doctors = await db.getAll(KEYS.DOCTORS);
    return cases.map(c => ({
      ...c,
      assignedDoctor: doctors.find(doc => doc.id === c.assignedDoctorId) || null
    }));
  },
  async getById(id) {
    const cases = await this.getAll();
    return cases.find(c => c.id === id) || null;
  },
  async create(caseData, userId = 'system') {
    return await db.create(KEYS.EMERGENCY, { ...caseData, userId });
  },
  async update(id, caseData, userId = 'system') {
    return await db.update(KEYS.EMERGENCY, id, { ...caseData, userId });
  },
  async delete(id, userId = 'system') {
    return await db.delete(KEYS.EMERGENCY, id, userId);
  }
};

// ==========================================
// 12. MESSAGE SERVICE
// ==========================================
export const messageService = {
  async getAll() {
    const msgs = await db.getAll(KEYS.MESSAGES);
    const users = await db.getAll(KEYS.USERS);
    return msgs.map(m => ({
      ...m,
      sender: users.find(u => u.id === m.senderId) || null,
      receiver: users.find(u => u.id === m.receiverId) || null
    }));
  },
  async getByChannel(channelId = 'general') {
    const msgs = await db.getAll(KEYS.MESSAGES);
    const users = await db.getAll(KEYS.USERS);

    // Filter by channel: match explicit channelId, or fall back to general channel for legacy messages
    const channelMsgs = msgs.filter(m => {
      if (m.channelId) {
        return m.channelId === channelId;
      }
      return channelId === 'general';
    });

    return channelMsgs.map(m => {
      const sender = users.find(u => u.id === m.senderId);
      return {
        ...m,
        senderName: m.senderName || sender?.name || 'Staff Member',
        senderRole: m.senderRole || sender?.role || 'Clinician',
        timestamp: m.timestamp || m.createdAt || new Date().toISOString()
      };
    });
  },
  async create(messageData, userId = 'system') {
    const newMsg = {
      channelId: messageData.channelId || 'general',
      text: messageData.text,
      senderId: userId !== 'system' ? userId : (messageData.senderId || 'usr-admin-1'),
      senderName: messageData.senderName || 'Staff Member',
      senderRole: messageData.senderRole || 'Admin',
      timestamp: new Date().toISOString(),
      isUnread: false,
      userId
    };
    return await db.create(KEYS.MESSAGES, newMsg);
  },
  async send(senderId, receiverId, text, userId = 'system') {
    return await db.create(KEYS.MESSAGES, {
      senderId,
      receiverId,
      channelId: 'general',
      text,
      timestamp: new Date().toISOString(),
      isUnread: true,
      userId
    });
  },
  async markAsRead(id, userId = 'system') {
    return await db.update(KEYS.MESSAGES, id, { isUnread: false, userId });
  }
};

// ==========================================
// 13. NOTIFICATION SERVICE
// ==========================================
export const notificationService = {
  async getAll() {
    return await db.getAll(KEYS.NOTIFICATIONS);
  },
  async markAllAsRead(userId = 'system') {
    const ntfs = await db.getAll(KEYS.NOTIFICATIONS);
    for (const n of ntfs) {
      if (!n.isRead) {
        await db.update(KEYS.NOTIFICATIONS, n.id, { isRead: true, userId });
      }
    }
    return await db.getAll(KEYS.NOTIFICATIONS);
  },
  async create(ntfData, userId = 'system') {
    return await db.create(KEYS.NOTIFICATIONS, {
      ...ntfData,
      timestamp: new Date().toISOString(),
      isRead: false,
      userId
    });
  },
  async delete(id, userId = 'system') {
    return await db.delete(KEYS.NOTIFICATIONS, id, userId);
  }
};

// ==========================================
// 14. CALENDAR SERVICE
// ==========================================
export const calendarService = {
  async getAll() {
    const evts = await db.getAll(KEYS.CALENDAR_EVENTS);
    const doctors = await db.getAll(KEYS.DOCTORS);
    return evts.map(e => ({
      ...e,
      doctor: doctors.find(doc => doc.id === e.doctorId) || null
    }));
  },
  async create(evtData, userId = 'system') {
    return await db.create(KEYS.CALENDAR_EVENTS, { ...evtData, userId });
  },
  async update(id, evtData, userId = 'system') {
    return await db.update(KEYS.CALENDAR_EVENTS, id, { ...evtData, userId });
  },
  async delete(id, userId = 'system') {
    return await db.delete(KEYS.CALENDAR_EVENTS, id, userId);
  }
};

