import { KEYS, db } from './db.js';

// Pre-defined UUIDs to maintain referential integrity in seed data
const docIds = {
  jenkins: 'doc-rajeshwari-101',
  chen: 'doc-arvind-102',
  ross: 'doc-priya-103',
  wilson: 'doc-vikram-104'
};

const patientIds = {
  doe: 'pat-rajesh-kumar-001',
  smith: 'pat-priya-nair-002',
  johnson: 'pat-rameshwar-joshi-003',
  davis: 'pat-ananya-iyer-004',
  brown: 'pat-vikramaditya-rao-005',
  wilson: 'pat-sneha-kulkarni-006'
};

const wardIds = {
  general: 'ward-general-01',
  icu: 'ward-icu-02',
  private: 'ward-private-03',
  emergency: 'ward-emergency-04'
};

const medicineIds = {
  amox: 'med-amox-250mg',
  lipi: 'med-lipitor-20mg',
  metf: 'med-metformin-500mg',
  ibup: 'med-ibuprofen-400mg',
  para: 'med-paracetamol-500mg',
  insu: 'med-insulin-humalog',
  gaba: 'med-gabapentin-300mg'
};

// Migration helper to seamlessly upgrade any existing localStorage database to Indian Names & Currency
export const autoMigrateToINR = () => {
  try {
    // 1. Migrate settings to Indian defaults
    const rawSettings = localStorage.getItem(KEYS.SETTINGS);
    if (rawSettings) {
      const s = JSON.parse(rawSettings);
      s.currency = '₹';
      s.hospitalName = 'HEALTH HUB SUPER SPECIALITY HOSPITAL';
      s.hospitalSubTitle = 'A Tertiary Care, Multi-Speciality Medical Institute';
      s.hospitalAddress = 'Plot 42, Sector 18, Health City, Bengaluru, Karnataka 560100';
      s.hospitalPhone = '+91 (080) 4968-2000';
      s.hospitalEmail = 'billing@healthhubhospital.in';
      s.hospitalWebsite = 'www.healthhubhospital.in';
      s.gstin = s.gstin || '29AAACH1234M1Z5';
      s.hospRegNo = s.hospRegNo || 'KA/BLR/MED/2024/9842';
      s.sacCode = '999312';
      s.upiVpa = s.upiVpa || 'healthhub.billing@icici';
      s.taxRate = 5;
      localStorage.setItem(KEYS.SETTINGS, JSON.stringify(s));
    }

    // Name mapping dictionary
    const nameMap = {
      'John Doe': 'Rajesh Kumar',
      'Jane Smith': 'Priya Nair',
      'Robert Johnson': 'Rameshwar Joshi',
      'Emily Davis': 'Ananya Iyer',
      'Michael Brown': 'Vikramaditya Rao',
      'Lisa Wilson': 'Sneha Kulkarni',
      'Dr. Sarah Jenkins': 'Dr. Rajeshwari Sengupta',
      'Sarah Jenkins': 'Dr. Rajeshwari Sengupta',
      'Dr. Robert Chen': 'Dr. Arvind Swaminathan',
      'Robert Chen': 'Dr. Arvind Swaminathan',
      'Dr. Amanda Ross': 'Dr. Priya Kulkarni',
      'Amanda Ross': 'Dr. Priya Kulkarni',
      'Dr. James Wilson': 'Dr. Vikram Malhotra',
      'James Wilson': 'Dr. Vikram Malhotra',
      'David Miller': 'Manoj Verma',
      'Sophia Loren': 'Kavita Reddy',
      'Liam Neeson': 'Harish Choudhury',
      'Emma Watson': 'Pooja Hegde',
      'Bruce Wayne': 'Amitabh Saxena',
      'Mark Miller': 'Ramesh Patel'
    };

    // 2. Users migration
    const rawUsers = localStorage.getItem(KEYS.USERS);
    if (rawUsers) {
      const users = JSON.parse(rawUsers);
      let changed = false;
      for (const u of users) {
        if (nameMap[u.name]) {
          u.name = nameMap[u.name];
          if (u.phone?.includes('+1')) u.phone = u.phone.replace('+1 (555)', '+91 98450');
          changed = true;
        }
      }
      if (changed) localStorage.setItem(KEYS.USERS, JSON.stringify(users));
    }

    // 3. Doctors migration
    const rawDocs = localStorage.getItem(KEYS.DOCTORS);
    if (rawDocs) {
      const docs = JSON.parse(rawDocs);
      let changed = false;
      for (const d of docs) {
        if (nameMap[d.name]) {
          d.name = nameMap[d.name];
          if (d.phone?.includes('+1')) d.phone = d.phone.replace('+1 (555)', '+91 98450');
          changed = true;
        }
      }
      if (changed) localStorage.setItem(KEYS.DOCTORS, JSON.stringify(docs));
    }

    // 4. Patients migration
    const rawPatients = localStorage.getItem(KEYS.PATIENTS);
    if (rawPatients) {
      const pats = JSON.parse(rawPatients);
      let changed = false;
      for (const p of pats) {
        if (nameMap[p.name]) {
          p.name = nameMap[p.name];
          if (p.phone?.includes('+1')) p.phone = p.phone.replace('+1 (555)', '+91 98450');
          if (p.address?.includes('MA') || p.address?.includes('Boston')) {
            p.address = p.address.replace(/Boston, MA|Cambridge, MA|Salem, MA|Chelsea, MA|Somerville, MA/g, 'Bengaluru, KA');
          }
          if (p.emergencyContact) {
            for (const [oldN, newN] of Object.entries(nameMap)) {
              if (p.emergencyContact.includes(oldN)) {
                p.emergencyContact = p.emergencyContact.replace(oldN, newN);
              }
            }
            p.emergencyContact = p.emergencyContact.replace('+1 555', '+91 98450');
          }
          changed = true;
        }
      }
      if (changed) localStorage.setItem(KEYS.PATIENTS, JSON.stringify(pats));
    }

    // 5. Emergency cases
    const rawER = localStorage.getItem(KEYS.EMERGENCY);
    if (rawER) {
      const er = JSON.parse(rawER);
      let changed = false;
      for (const item of er) {
        if (nameMap[item.patientName]) {
          item.patientName = nameMap[item.patientName];
          changed = true;
        }
      }
      if (changed) localStorage.setItem(KEYS.EMERGENCY, JSON.stringify(er));
    }

    // 6. Migrate existing bills from USD to INR and replace names in item desc
    const rawBills = localStorage.getItem(KEYS.BILLS);
    if (rawBills) {
      const bills = JSON.parse(rawBills);
      let changed = false;
      for (const bill of bills) {
        if (bill.total && bill.total < 3500) {
          bill.items = (bill.items || []).map(item => ({
            ...item,
            cost: item.cost < 200 ? item.cost * 12 : Math.round(item.cost * 14)
          }));
          bill.subtotal = bill.items.reduce((sum, item) => sum + (item.qty * item.cost), 0);
          bill.tax = Math.round(bill.subtotal * 0.05 * 100) / 100;
          bill.discount = bill.discount ? Math.round(bill.discount * 12) : 0;
          bill.total = Math.max(0, bill.subtotal + bill.tax - bill.discount);
          if (bill.paymentMode === 'Insurance') bill.paymentMode = 'TPA / Insurance';
          changed = true;
        }
        for (const item of bill.items || []) {
          for (const [oldN, newN] of Object.entries(nameMap)) {
            if (item.desc && item.desc.includes(oldN)) {
              item.desc = item.desc.replace(oldN, newN);
              changed = true;
            }
          }
        }
      }
      if (changed) localStorage.setItem(KEYS.BILLS, JSON.stringify(bills));
    }

    // 7. Migrate medicines unitPrice to realistic INR
    const rawMeds = localStorage.getItem(KEYS.MEDICINES);
    if (rawMeds) {
      const meds = JSON.parse(rawMeds);
      let changed = false;
      for (const m of meds) {
        if (m.unitPrice && m.unitPrice < 20) {
          m.unitPrice = Math.round(m.unitPrice * 14);
          changed = true;
        }
        if (m.supplier && !m.supplier.includes('India')) {
          m.supplier += ' India';
          changed = true;
        }
      }
      if (changed) localStorage.setItem(KEYS.MEDICINES, JSON.stringify(meds));
    }

    // 8. Messages, notifications, events
    const rawNotifs = localStorage.getItem(KEYS.NOTIFICATIONS);
    if (rawNotifs) {
      const notifs = JSON.parse(rawNotifs);
      let changed = false;
      for (const n of notifs) {
        for (const [oldN, newN] of Object.entries(nameMap)) {
          if (n.text && n.text.includes(oldN)) {
            n.text = n.text.replace(oldN, newN);
            changed = true;
          }
        }
      }
      if (changed) localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(notifs));
    }

    const rawMsgs = localStorage.getItem(KEYS.MESSAGES);
    if (rawMsgs) {
      const msgs = JSON.parse(rawMsgs);
      let changed = false;
      for (const m of msgs) {
        for (const [oldN, newN] of Object.entries(nameMap)) {
          if (m.text && m.text.includes(oldN)) {
            m.text = m.text.replace(oldN, newN);
            changed = true;
          }
        }
      }
      if (changed) localStorage.setItem(KEYS.MESSAGES, JSON.stringify(msgs));
    }

    const rawEvents = localStorage.getItem(KEYS.CALENDAR_EVENTS);
    if (rawEvents) {
      const evts = JSON.parse(rawEvents);
      let changed = false;
      for (const e of evts) {
        for (const [oldN, newN] of Object.entries(nameMap)) {
          if (e.title && e.title.includes(oldN)) {
            e.title = e.title.replace(oldN, newN);
            changed = true;
          }
        }
      }
      if (changed) localStorage.setItem(KEYS.CALENDAR_EVENTS, JSON.stringify(evts));
    }
  } catch (e) {
    console.error('HMS Indian Auto-migration error:', e);
  }
};

export const seedAll = async (force = false) => {
  // Check if seeding is already done
  if (!force && localStorage.getItem(KEYS.USERS)) {
    autoMigrateToINR();
    return; // Already seeded
  }

  // 1. SEED USERS (Indian Clinical Staff Profiles)
  const users = [
    {
      id: 'usr-admin-1',
      name: 'Dr. Rohan Sharma (Medical Director)',
      email: 'admin@healthhub.com',
      password: 'admin',
      role: 'Admin',
      phone: '+91 98450 00001',
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150',
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'usr-doctor-1',
      name: 'Dr. Rajeshwari Sengupta',
      email: 'doctor@healthhub.com',
      password: 'doctor',
      role: 'Doctor',
      phone: '+91 98450 10101',
      avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150',
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'usr-reception-1',
      name: 'Sunita Deshmukh',
      email: 'reception@healthhub.com',
      password: 'reception',
      role: 'Receptionist',
      phone: '+91 98450 00002',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'usr-pharmacy-1',
      name: 'Ramesh Patel',
      email: 'pharmacy@healthhub.com',
      password: 'pharmacy',
      role: 'Pharmacist',
      phone: '+91 98450 00003',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'usr-patient-1',
      name: 'Rajesh Kumar',
      email: 'patient@healthhub.com',
      password: 'patient',
      role: 'Patient',
      phone: '+91 98450 12233',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  // 2. SEED DOCTORS (Indian Doctors Directory)
  const doctors = [
    {
      id: docIds.jenkins,
      name: 'Dr. Rajeshwari Sengupta',
      specialization: 'Cardiology',
      phone: '+91 98450 10101',
      email: 'dr.rajeshwari@healthhub.in',
      availability: ['Monday', 'Wednesday', 'Friday'],
      rating: 4.9,
      avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150'
    },
    {
      id: docIds.chen,
      name: 'Dr. Arvind Swaminathan',
      specialization: 'Pediatrics',
      phone: '+91 98450 20202',
      email: 'dr.arvind@healthhub.in',
      availability: ['Monday', 'Tuesday', 'Thursday'],
      rating: 4.8,
      avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150'
    },
    {
      id: docIds.ross,
      name: 'Dr. Priya Kulkarni',
      specialization: 'Neurology',
      phone: '+91 98450 30303',
      email: 'dr.priya@healthhub.in',
      availability: ['Tuesday', 'Wednesday', 'Thursday'],
      rating: 4.7,
      avatar: 'https://images.unsplash.com/photo-1594824813573-246434de83fb?w=150'
    },
    {
      id: docIds.wilson,
      name: 'Dr. Vikram Malhotra',
      specialization: 'Orthopedics',
      phone: '+91 98450 40404',
      email: 'dr.vikram@healthhub.in',
      availability: ['Wednesday', 'Thursday', 'Friday'],
      rating: 4.6,
      avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150'
    }
  ];

  // 3. SEED WARDS
  const wards = [
    {
      id: wardIds.general,
      name: 'General Ward A',
      type: 'General',
      totalBeds: 10,
      occupiedBeds: 2,
      bedList: [
        { bedNo: 'G-101', status: 'Occupied', patientId: patientIds.smith },
        { bedNo: 'G-102', status: 'Available', patientId: null },
        { bedNo: 'G-103', status: 'Occupied', patientId: patientIds.brown },
        { bedNo: 'G-104', status: 'Cleaning', patientId: null },
        { bedNo: 'G-105', status: 'Available', patientId: null },
        { bedNo: 'G-106', status: 'Available', patientId: null },
        { bedNo: 'G-107', status: 'Available', patientId: null },
        { bedNo: 'G-108', status: 'Available', patientId: null },
        { bedNo: 'G-109', status: 'Available', patientId: null },
        { bedNo: 'G-110', status: 'Available', patientId: null }
      ]
    },
    {
      id: wardIds.icu,
      name: 'Intensive Care Unit (ICU)',
      type: 'ICU',
      totalBeds: 4,
      occupiedBeds: 1,
      bedList: [
        { bedNo: 'ICU-201', status: 'Occupied', patientId: patientIds.doe },
        { bedNo: 'ICU-202', status: 'Cleaning', patientId: null },
        { bedNo: 'ICU-203', status: 'Available', patientId: null },
        { bedNo: 'ICU-204', status: 'Reserved', patientId: null }
      ]
    },
    {
      id: wardIds.private,
      name: 'Private Deluxe Wing',
      type: 'Private',
      totalBeds: 4,
      occupiedBeds: 1,
      bedList: [
        { bedNo: 'P-301', status: 'Occupied', patientId: patientIds.davis },
        { bedNo: 'P-302', status: 'Available', patientId: null },
        { bedNo: 'P-303', status: 'Available', patientId: null },
        { bedNo: 'P-304', status: 'Available', patientId: null }
      ]
    },
    {
      id: wardIds.emergency,
      name: 'Emergency Room (ER)',
      type: 'Emergency',
      totalBeds: 6,
      occupiedBeds: 1,
      bedList: [
        { bedNo: 'ER-401', status: 'Occupied', patientId: patientIds.wilson },
        { bedNo: 'ER-402', status: 'Available', patientId: null },
        { bedNo: 'ER-403', status: 'Available', patientId: null },
        { bedNo: 'ER-404', status: 'Available', patientId: null },
        { bedNo: 'ER-405', status: 'Available', patientId: null },
        { bedNo: 'ER-406', status: 'Available', patientId: null }
      ]
    }
  ];

  // 4. SEED PATIENTS (Indian Patient Profiles)
  const patients = [
    {
      id: patientIds.doe,
      name: 'Rajesh Kumar',
      age: 45,
      gender: 'Male',
      phone: '+91 98450 12233',
      address: 'Plot 104, 12th Main, Indiranagar, Bengaluru, KA',
      bloodGroup: 'O+',
      admissionStatus: 'Admitted',
      assignedDoctorId: docIds.jenkins,
      wardId: wardIds.icu,
      allergies: 'Penicillin',
      medicalHistory: 'Hypertension, post-coronary bypass surgery in 2023.',
      emergencyContact: 'Sunita Kumar (+91 98450 12244)',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: patientIds.smith,
      name: 'Priya Nair',
      age: 29,
      gender: 'Female',
      phone: '+91 98451 23344',
      address: '45, 80 Feet Road, Koramangala 4th Block, Bengaluru, KA',
      bloodGroup: 'A-',
      admissionStatus: 'Admitted',
      assignedDoctorId: docIds.chen,
      wardId: wardIds.general,
      allergies: 'Sulfa Drugs',
      medicalHistory: 'Bronchial asthma diagnosed in 2018.',
      emergencyContact: 'Arjun Nair (+91 98451 23355)',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: patientIds.johnson,
      name: 'Rameshwar Joshi',
      age: 62,
      gender: 'Male',
      phone: '+91 98452 34455',
      address: '12/A, 5th Cross, Malleshwaram, Bengaluru, KA',
      bloodGroup: 'B+',
      admissionStatus: 'Discharged',
      assignedDoctorId: docIds.wilson,
      wardId: null,
      allergies: 'None',
      medicalHistory: 'Osteoarthritis, total right hip replacement surgery.',
      emergencyContact: 'Geeta Joshi (+91 98452 34466)',
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: patientIds.davis,
      name: 'Ananya Iyer',
      age: 34,
      gender: 'Female',
      phone: '+91 98453 45566',
      address: '88, Sector 2, HSR Layout, Bengaluru, KA',
      bloodGroup: 'AB+',
      admissionStatus: 'Admitted',
      assignedDoctorId: docIds.ross,
      wardId: wardIds.private,
      allergies: 'Aspirin',
      medicalHistory: 'Chronic neurological migraine, episodic tension headaches.',
      emergencyContact: 'Venkatesh Iyer (+91 98453 45577)',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: patientIds.brown,
      name: 'Vikramaditya Rao',
      age: 50,
      gender: 'Male',
      phone: '+91 98454 56677',
      address: '102, 33rd Cross, Jayanagar 7th Block, Bengaluru, KA',
      bloodGroup: 'O-',
      admissionStatus: 'Admitted',
      assignedDoctorId: docIds.jenkins,
      wardId: wardIds.general,
      allergies: 'Peanuts',
      medicalHistory: 'Type 2 Diabetes Mellitus, well controlled on Metformin.',
      emergencyContact: 'Lakshmi Rao (+91 98454 56688)',
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: patientIds.wilson,
      name: 'Sneha Kulkarni',
      age: 22,
      gender: 'Female',
      phone: '+91 98455 67788',
      address: '77, Inner Circle, Whitefield, Bengaluru, KA',
      bloodGroup: 'A+',
      admissionStatus: 'Admitted',
      assignedDoctorId: docIds.chen,
      wardId: wardIds.emergency,
      allergies: 'Shellfish',
      medicalHistory: 'Acute food-borne gastroenteritis dehydration on admission.',
      emergencyContact: 'Pradeep Kulkarni (+91 98455 67799)',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  // Helper date generators for appointments relative to current time
  const getTodayAt = (hours, mins = 0) => {
    const d = new Date();
    d.setHours(hours, mins, 0, 0);
    return d.toISOString();
  };

  const getTomorrowAt = (hours, mins = 0) => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(hours, mins, 0, 0);
    return d.toISOString();
  };

  const getYesterdayAt = (hours, mins = 0) => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    d.setHours(hours, mins, 0, 0);
    return d.toISOString();
  };

  // 5. SEED APPOINTMENTS
  const appointments = [
    {
      id: 'apt-1',
      patientId: patientIds.doe,
      doctorId: docIds.jenkins,
      date: getTodayAt(10, 0).split('T')[0],
      time: '10:00 AM',
      status: 'Confirmed',
      reason: 'Regular cardiology follow-up and ECG post-CABG checkup.',
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'apt-2',
      patientId: patientIds.smith,
      doctorId: docIds.chen,
      date: getTodayAt(11, 30).split('T')[0],
      time: '11:30 AM',
      status: 'Confirmed',
      reason: 'Bronchial asthma checkup and spirometry validation.',
      createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'apt-3',
      patientId: patientIds.johnson,
      doctorId: docIds.wilson,
      date: getYesterdayAt(14, 0).split('T')[0],
      time: '02:00 PM',
      status: 'Completed',
      reason: 'Post-discharge mobility physiotherapy follow-up.',
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'apt-4',
      patientId: patientIds.davis,
      doctorId: docIds.ross,
      date: getTomorrowAt(9, 30).split('T')[0],
      time: '09:30 AM',
      status: 'Confirmed',
      reason: 'Neurological migraine diagnostics and treatment plan.',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'apt-5',
      patientId: patientIds.brown,
      doctorId: docIds.jenkins,
      date: getTomorrowAt(15, 0).split('T')[0],
      time: '03:00 PM',
      status: 'Pending',
      reason: 'Diabetic peripheral neuropathy evaluation.',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  // 6. SEED MEDICINES (Indian Pharmacy Pricing in ₹)
  const medicines = [
    {
      id: medicineIds.amox,
      name: 'Amoxicillin 250mg',
      category: 'Antibiotics',
      stock: 120,
      unitPrice: 85.00,
      expiryDate: '2027-10-15',
      supplier: 'PharmaCorp Global India'
    },
    {
      id: medicineIds.lipi,
      name: 'Lipitor 20mg',
      category: 'Cardiovascular',
      stock: 8, // Low Stock Alert Trigger!
      unitPrice: 220.00,
      expiryDate: '2026-11-20',
      supplier: 'Apex Laboratories India'
    },
    {
      id: medicineIds.metf,
      name: 'Metformin 500mg',
      category: 'Antidiabetic',
      stock: 240,
      unitPrice: 45.00,
      expiryDate: '2028-01-10',
      supplier: 'BioCare Health Distributors'
    },
    {
      id: medicineIds.ibup,
      name: 'Ibuprofen 400mg',
      category: 'Analgesics',
      stock: 400,
      unitPrice: 25.00,
      expiryDate: '2026-09-01', // Near Expiry Alert Trigger!
      supplier: 'Medline Supplies India'
    },
    {
      id: medicineIds.para,
      name: 'Paracetamol 500mg',
      category: 'Analgesics',
      stock: 15,
      unitPrice: 20.00,
      expiryDate: '2027-05-18',
      supplier: 'Medline Supplies India'
    },
    {
      id: medicineIds.insu,
      name: 'Insulin Humalog',
      category: 'Antidiabetic',
      stock: 45,
      unitPrice: 650.00,
      expiryDate: '2027-03-30',
      supplier: 'BioCare Health Distributors'
    },
    {
      id: medicineIds.gaba,
      name: 'Gabapentin 300mg',
      category: 'Neurological',
      stock: 65,
      unitPrice: 185.00,
      expiryDate: '2026-10-31',
      supplier: 'Apex Laboratories India'
    }
  ];

  // 7. SEED PRESCRIPTIONS
  const prescriptions = [
    {
      id: 'pre-101',
      patientId: patientIds.doe,
      doctorId: docIds.jenkins,
      medicines: [
        { medId: medicineIds.lipi, dosage: '1 tablet daily at night', duration: '30 days' },
        { medId: medicineIds.para, dosage: '1 tablet every 6 hours SOS', duration: '5 days' }
      ],
      notes: 'Take Lipitor at night after meals. Keep daily track of blood pressure levels.',
      date: getYesterdayAt(10, 0).split('T')[0]
    },
    {
      id: 'pre-102',
      patientId: patientIds.smith,
      doctorId: docIds.chen,
      medicines: [
        { medId: medicineIds.amox, dosage: '1 capsule three times daily', duration: '7 days' }
      ],
      notes: 'Complete the entire course of antibiotics. Avoid cold allergens.',
      date: getYesterdayAt(12, 0).split('T')[0]
    }
  ];

  // 8. SEED BILLS (Indian Hospital Invoices in ₹)
  const bills = [
    {
      id: 'bill-201',
      patientId: patientIds.johnson,
      items: [
        { desc: 'Consultation Fee (Dr. Vikram Malhotra - Orthopedics)', qty: 1, cost: 1200.00 },
        { desc: 'Digital X-Ray Right Hip Diagnostic', qty: 1, cost: 1800.00 },
        { desc: 'Physiotherapy Rehabilitation Session', qty: 2, cost: 750.00 }
      ],
      subtotal: 4500.00,
      tax: 225.00, // 5% GST
      discount: 0,
      total: 4725.00,
      status: 'Paid',
      paymentMode: 'UPI (PhonePe)',
      date: getYesterdayAt(15, 0).split('T')[0]
    },
    {
      id: 'bill-202',
      patientId: patientIds.doe,
      items: [
        { desc: 'ICU Critical Bed Charges (ICU-201)', qty: 3, cost: 6500.00 },
        { desc: 'Senior Consultant Cardiology Rounds (Dr. Rajeshwari Sengupta)', qty: 1, cost: 1500.00 },
        { desc: 'Lipitor 20mg Pharmacy Dispensation', qty: 1, cost: 220.00 }
      ],
      subtotal: 21220.00,
      tax: 1061.00,
      discount: 500.00,
      total: 21781.00,
      status: 'Unpaid',
      paymentMode: 'Cash',
      date: getTodayAt(9, 0).split('T')[0]
    },
    {
      id: 'bill-203',
      patientId: patientIds.smith,
      items: [
        { desc: 'Semi-Private Ward Bed Charges (G-101)', qty: 2, cost: 1500.00 },
        { desc: 'Pulmonary Function & Asthma Panel', qty: 1, cost: 1400.00 }
      ],
      subtotal: 4400.00,
      tax: 220.00,
      discount: 200.00,
      total: 4420.00,
      status: 'Partial',
      paymentMode: 'TPA / Insurance',
      date: getTodayAt(11, 0).split('T')[0]
    }
  ];

  // 9. SEED LAB REPORTS
  const labReports = [
    {
      id: 'lab-301',
      patientId: patientIds.doe,
      testName: 'Lipid Profile Panel',
      doctorId: docIds.jenkins,
      status: 'Completed',
      resultText: 'Total Cholesterol: 210 mg/dL (High), HDL: 42 mg/dL, LDL: 135 mg/dL (Borderline High), Triglycerides: 165 mg/dL.',
      date: getYesterdayAt(10, 0).split('T')[0]
    },
    {
      id: 'lab-302',
      patientId: patientIds.smith,
      testName: 'Pulmonary Function Test (PFT)',
      doctorId: docIds.chen,
      status: 'Completed',
      resultText: 'FEV1/FVC ratio is 68%, indicating mild obstructive pulmonary function, consistent with asthma.',
      date: getYesterdayAt(11, 0).split('T')[0]
    },
    {
      id: 'lab-303',
      patientId: patientIds.davis,
      testName: 'Brain MRI Scan & Angio',
      doctorId: docIds.ross,
      status: 'In Progress',
      resultText: 'Scan complete. Radiologist reporting in progress.',
      date: getTodayAt(14, 0).split('T')[0]
    }
  ];

  // 10. SEED HOSPITAL SETTINGS (Indian Super Speciality Hospital)
  const settings = {
    hospitalName: 'HEALTH HUB SUPER SPECIALITY HOSPITAL',
    hospitalLogoText: 'HEALTH HUB',
    hospitalSubTitle: 'A Tertiary Care, Multi-Speciality Medical Institute',
    hospitalAddress: 'Plot 42, Sector 18, Health City, Bengaluru, Karnataka 560100',
    hospitalPhone: '+91 (080) 4968-2000',
    hospitalEmail: 'billing@healthhubhospital.in',
    hospitalWebsite: 'www.healthhubhospital.in',
    gstin: '29AAACH1234M1Z5',
    hospRegNo: 'KA/BLR/MED/2024/9842',
    sacCode: '999312',
    upiVpa: 'healthhub.billing@icici',
    theme: 'light',
    taxRate: 5, // 5% GST (CGST 2.5% + SGST 2.5%)
    currency: '₹'
  };

  // 11. SEED ACTIVITY LOG
  const activityLog = [
    {
      id: 'act-1',
      userId: 'usr-admin-1',
      action: 'CREATE',
      entity: 'users',
      details: 'Medical Director Dr. Rohan Sharma initialized demo relational database configurations.',
      timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'act-2',
      userId: 'usr-admin-1',
      action: 'UPDATE',
      entity: 'wards',
      details: 'Admitted Rajesh Kumar to ICU room, occupying bed ICU-201.',
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'act-3',
      userId: 'usr-reception-1',
      action: 'CREATE',
      entity: 'appointments',
      details: 'Booked appointment for Ananya Iyer with Dr. Priya Kulkarni.',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'act-4',
      userId: 'usr-doctor-1',
      action: 'CREATE',
      entity: 'prescriptions',
      details: 'Wrote prescription pre-101 for Rajesh Kumar (Lipitor, Paracetamol).',
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  // 12. SEED DEPARTMENTS
  const departments = [
    { id: 'dept-cardio', name: 'Cardiology', icon: 'Heart', headDoctorId: docIds.jenkins, docCount: 2, patientCount: 45, todayAppts: 5 },
    { id: 'dept-neuro', name: 'Neurology', icon: 'Brain', headDoctorId: docIds.chen, docCount: 1, patientCount: 20, todayAppts: 2 },
    { id: 'dept-ortho', name: 'Orthopedics', icon: 'Activity', headDoctorId: docIds.ross, docCount: 1, patientCount: 30, todayAppts: 3 },
    { id: 'dept-peds', name: 'Pediatrics', icon: 'Baby', headDoctorId: docIds.wilson, docCount: 1, patientCount: 50, todayAppts: 6 },
    { id: 'dept-genmed', name: 'General Medicine', icon: 'Stethoscope', headDoctorId: docIds.jenkins, docCount: 2, patientCount: 85, todayAppts: 12 },
    { id: 'dept-derm', name: 'Dermatology', icon: 'Sparkles', headDoctorId: docIds.chen, docCount: 1, patientCount: 18, todayAppts: 1 },
    { id: 'dept-gyn', name: 'Gynecology', icon: 'Female', headDoctorId: docIds.ross, docCount: 1, patientCount: 25, todayAppts: 2 },
    { id: 'dept-dent', name: 'Dentistry', icon: 'Smile', headDoctorId: docIds.wilson, docCount: 1, patientCount: 22, todayAppts: 4 },
    { id: 'dept-er', name: 'Emergency', icon: 'Flame', headDoctorId: docIds.jenkins, docCount: 2, patientCount: 14, todayAppts: 8 },
    { id: 'dept-opht', name: 'Ophthalmology', icon: 'Eye', headDoctorId: docIds.chen, docCount: 1, patientCount: 16, todayAppts: 2 }
  ];

  // 13. SEED EMERGENCY ROOM CASES (Indian Emergency Registry)
  const emergencyCases = [
    { id: 'er-1', patientName: 'Manoj Verma', age: 48, gender: 'Male', priority: 'Critical', condition: 'Acute Myocardial Infarction', assignedDoctorId: docIds.jenkins, arrivalTime: new Date(Date.now() - 40 * 60 * 1000).toISOString(), status: 'Admitted', roomNumber: 'ER-101' },
    { id: 'er-2', patientName: 'Kavita Reddy', age: 34, gender: 'Female', priority: 'High', condition: 'Multiple Trauma from Road Accident', assignedDoctorId: docIds.ross, arrivalTime: new Date(Date.now() - 90 * 60 * 1000).toISOString(), status: 'Under Observation', roomNumber: 'ER-102' },
    { id: 'er-3', patientName: 'Harish Choudhury', age: 60, gender: 'Male', priority: 'Critical', condition: 'Acute Ischemic Stroke symptoms', assignedDoctorId: docIds.chen, arrivalTime: new Date(Date.now() - 20 * 60 * 1000).toISOString(), status: 'In Surgery', roomNumber: 'OR-2' },
    { id: 'er-4', patientName: 'Pooja Hegde', age: 29, gender: 'Female', priority: 'Medium', condition: 'Severe Acute Asthma Exacerbation', assignedDoctorId: docIds.wilson, arrivalTime: new Date(Date.now() - 120 * 60 * 1000).toISOString(), status: 'Discharged', roomNumber: 'ER-103' },
    { id: 'er-5', patientName: 'Amitabh Saxena', age: 42, gender: 'Male', priority: 'Low', condition: 'Laceration on forearm suturing', assignedDoctorId: docIds.ross, arrivalTime: new Date(Date.now() - 180 * 60 * 1000).toISOString(), status: 'Treated & Released', roomNumber: 'ER-104' }
  ];

  // 14. SEED STAFF MESSAGES
  const messages = [
    { id: 'msg-1', channelId: 'general', senderId: 'usr-admin-1', senderName: 'Dr. Rohan Kumar Sharma', senderRole: 'Admin', text: 'Namaste Dr. Rajeshwari, please review the latest cardiology schedule for next week.', timestamp: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(), isUnread: false },
    { id: 'msg-2', channelId: 'general', senderId: 'usr-doctor-1', senderName: 'Dr. Rajeshwari Sengupta', senderRole: 'Doctor', text: 'Sure Dr. Rohan, I will look at it and optimize using the schedule assistant.', timestamp: new Date(Date.now() - 35 * 60 * 60 * 1000).toISOString(), isUnread: false },
    { id: 'msg-3', channelId: 'doctors', senderId: 'usr-reception-1', senderName: 'Priya Sundaram', senderRole: 'Receptionist', text: 'Dr. Rajeshwari, patient Rajesh Kumar has arrived for his 10:00 AM checkup.', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), isUnread: true },
    { id: 'msg-4', channelId: 'pharmacy', senderId: 'usr-pharmacist-1', senderName: 'Vikram Joshi', senderRole: 'Pharmacist', text: 'We are running low on Paracetamol and Insulin. Please approve the reorder.', timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), isUnread: true }
  ];

  // 15. SEED SYSTEM NOTIFICATIONS
  const notifications = [
    { id: 'ntf-1', category: 'Appointments', text: 'Dr. Rajeshwari Sengupta has a new appointment with Rajesh Kumar.', timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(), isRead: false },
    { id: 'ntf-2', category: 'Pharmacy', text: 'Paracetamol stock is running low (Current: 15 units).', timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), isRead: false },
    { id: 'ntf-3', category: 'Payments', text: '3 invoices are currently overdue for payment at billing desk.', timestamp: new Date(Date.now() - 120 * 60 * 1000).toISOString(), isRead: false },
    { id: 'ntf-4', category: 'AI Alerts', text: 'AI detected increased patient demand in Cardiology for tomorrow.', timestamp: new Date(Date.now() - 180 * 60 * 1000).toISOString(), isRead: true }
  ];

  // 16. SEED CALENDAR EVENTS
  const calendarEvents = [
    { id: 'evt-1', title: 'Cardiology Board Meeting', start: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] + 'T09:00:00', end: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] + 'T10:30:00', type: 'Meeting', doctorId: docIds.jenkins, description: 'Annual cardiology clinical review.' },
    { id: 'evt-2', title: 'Coronary Bypass Surgery - Rajesh Kumar', start: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] + 'T08:00:00', end: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] + 'T13:00:00', type: 'Operation', doctorId: docIds.jenkins, description: 'Scheduled coronary artery bypass graft.' },
    { id: 'evt-3', title: 'Dr. Arvind Swaminathan Shift hours', start: new Date(Date.now()).toISOString().split('T')[0] + 'T09:00:00', end: new Date(Date.now()).toISOString().split('T')[0] + 'T17:00:00', type: 'Shift', doctorId: docIds.chen, description: 'Regular pediatrics shift.' }
  ];

  // Save collections in localStorage Relational format
  await db.saveAllRaw(KEYS.USERS, users);
  await db.saveAllRaw(KEYS.DOCTORS, doctors);
  await db.saveAllRaw(KEYS.WARDS, wards);
  await db.saveAllRaw(KEYS.PATIENTS, patients);
  await db.saveAllRaw(KEYS.APPOINTMENTS, appointments);
  await db.saveAllRaw(KEYS.MEDICINES, medicines);
  await db.saveAllRaw(KEYS.PRESCRIPTIONS, prescriptions);
  await db.saveAllRaw(KEYS.BILLS, bills);
  await db.saveAllRaw(KEYS.LAB_REPORTS, labReports);
  await db.saveAllRaw(KEYS.SETTINGS, settings);
  await db.saveAllRaw(KEYS.ACTIVITY_LOG, activityLog);
  await db.saveAllRaw(KEYS.DEPARTMENTS, departments);
  await db.saveAllRaw(KEYS.EMERGENCY, emergencyCases);
  await db.saveAllRaw(KEYS.MESSAGES, messages);
  await db.saveAllRaw(KEYS.NOTIFICATIONS, notifications);
  await db.saveAllRaw(KEYS.CALENDAR_EVENTS, calendarEvents);

  console.log('Database successfully seeded with HEALTH HUB Indian mock relational structure.');
};

// Resets demo data completely
export const resetDemo = async () => {
  localStorage.clear();
  await seedAll(true);
};
