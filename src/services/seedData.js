import { KEYS, db } from './db.js';

// Pre-defined UUIDs to maintain referential integrity in seed data
const docIds = {
  jenkins: 'doc-sarah-jenkins-101',
  chen: 'doc-robert-chen-102',
  ross: 'doc-amanda-ross-103',
  wilson: 'doc-james-wilson-104'
};

const patientIds = {
  doe: 'pat-john-doe-001',
  smith: 'pat-jane-smith-002',
  johnson: 'pat-robert-johnson-003',
  davis: 'pat-emily-davis-004',
  brown: 'pat-michael-brown-005',
  wilson: 'pat-lisa-wilson-006'
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

export const seedAll = async (force = false) => {
  // Check if seeding is already done
  if (!force && localStorage.getItem(KEYS.USERS)) {
    return; // Already seeded
  }

  // 1. SEED USERS
  const users = [
    {
      id: 'usr-admin-1',
      name: 'System Administrator',
      email: 'admin@healthhub.com',
      password: 'admin', // Demo password
      role: 'Admin',
      phone: '+1 (555) 019-2831',
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150',
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'usr-doctor-1',
      name: 'Dr. Sarah Jenkins',
      email: 'doctor@healthhub.com',
      password: 'doctor',
      role: 'Doctor',
      phone: '+1 (555) 014-9988',
      avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150',
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'usr-reception-1',
      name: 'Emma Watson',
      email: 'reception@healthhub.com',
      password: 'reception',
      role: 'Receptionist',
      phone: '+1 (555) 018-2234',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'usr-pharmacy-1',
      name: 'Mark Miller',
      email: 'pharmacy@healthhub.com',
      password: 'pharmacy',
      role: 'Pharmacist',
      phone: '+1 (555) 012-7711',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'usr-patient-1',
      name: 'John Doe',
      email: 'patient@healthhub.com',
      password: 'patient',
      role: 'Patient',
      phone: '+1 (555) 011-2233',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  // 2. SEED DOCTORS
  const doctors = [
    {
      id: docIds.jenkins,
      name: 'Dr. Sarah Jenkins',
      specialization: 'Cardiology',
      phone: '+1 (555) 014-9988',
      email: 'jenkins@healthhub.com',
      availability: ['Monday', 'Wednesday', 'Friday'],
      rating: 4.9,
      avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150'
    },
    {
      id: docIds.chen,
      name: 'Dr. Robert Chen',
      specialization: 'Pediatrics',
      phone: '+1 (555) 013-4411',
      email: 'chen@healthhub.com',
      availability: ['Monday', 'Tuesday', 'Thursday'],
      rating: 4.8,
      avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150'
    },
    {
      id: docIds.ross,
      name: 'Dr. Amanda Ross',
      specialization: 'Neurology',
      phone: '+1 (555) 015-8822',
      email: 'ross@healthhub.com',
      availability: ['Tuesday', 'Wednesday', 'Thursday'],
      rating: 4.7,
      avatar: 'https://images.unsplash.com/photo-1594824813573-246434de83fb?w=150'
    },
    {
      id: docIds.wilson,
      name: 'Dr. James Wilson',
      specialization: 'Orthopedics',
      phone: '+1 (555) 017-6655',
      email: 'wilson@healthhub.com',
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
      name: 'Private Suite Wing',
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

  // 4. SEED PATIENTS
  const patients = [
    {
      id: patientIds.doe,
      name: 'John Doe',
      age: 45,
      gender: 'Male',
      phone: '+1 (555) 011-2233',
      address: '100 Health Ave, Boston, MA',
      bloodGroup: 'O+',
      admissionStatus: 'Admitted',
      assignedDoctorId: docIds.jenkins,
      wardId: wardIds.icu,
      allergies: 'Penicillin',
      medicalHistory: 'Hypertension, bypass surgery in 2023.',
      emergencyContact: 'Jane Doe (+1 555-011-2244)',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: patientIds.smith,
      name: 'Jane Smith',
      age: 29,
      gender: 'Female',
      phone: '+1 (555) 015-3344',
      address: '74 Oak Lane, Boston, MA',
      bloodGroup: 'A-',
      admissionStatus: 'Admitted',
      assignedDoctorId: docIds.chen,
      wardId: wardIds.general,
      allergies: 'Sulfa Drugs',
      medicalHistory: 'Asthma diagnosis in 2018.',
      emergencyContact: 'David Smith (+1 555-015-3355)',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: patientIds.johnson,
      name: 'Robert Johnson',
      age: 62,
      gender: 'Male',
      phone: '+1 (555) 019-4455',
      address: '25 Pine Rd, Salem, MA',
      bloodGroup: 'B+',
      admissionStatus: 'Discharged',
      assignedDoctorId: docIds.wilson,
      wardId: null,
      allergies: 'None',
      medicalHistory: 'Osteoarthritis, minor hip replacement surgery.',
      emergencyContact: 'Sarah Johnson (+1 555-019-4466)',
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: patientIds.davis,
      name: 'Emily Davis',
      age: 34,
      gender: 'Female',
      phone: '+1 (555) 013-8877',
      address: '50 Maple Ave, Cambridge, MA',
      bloodGroup: 'AB+',
      admissionStatus: 'Admitted',
      assignedDoctorId: docIds.ross,
      wardId: wardIds.private,
      allergies: 'Aspirin',
      medicalHistory: 'Migraines, recurring tension headaches.',
      emergencyContact: 'John Davis (+1 555-013-8888)',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: patientIds.brown,
      name: 'Michael Brown',
      age: 50,
      gender: 'Male',
      phone: '+1 (555) 012-4455',
      address: '12 Birch Hill, Chelsea, MA',
      bloodGroup: 'O-',
      admissionStatus: 'Admitted',
      assignedDoctorId: docIds.jenkins,
      wardId: wardIds.general,
      allergies: 'Peanuts',
      medicalHistory: 'Type 2 Diabetes, controlled via medication.',
      emergencyContact: 'Lucy Brown (+1 555-012-4466)',
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: patientIds.wilson,
      name: 'Lisa Wilson',
      age: 22,
      gender: 'Female',
      phone: '+1 (555) 014-7766',
      address: '88 River Rd, Somerville, MA',
      bloodGroup: 'A+',
      admissionStatus: 'Admitted',
      assignedDoctorId: docIds.chen,
      wardId: wardIds.emergency,
      allergies: 'Shellfish',
      medicalHistory: 'Acute food poisoning on admission.',
      emergencyContact: 'Tom Wilson (+1 555-014-7755)',
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
      reason: 'Regular cardiology follow-up post-bypass checkup.',
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'apt-2',
      patientId: patientIds.smith,
      doctorId: docIds.chen,
      date: getTodayAt(11, 30).split('T')[0],
      time: '11:30 AM',
      status: 'Confirmed',
      reason: 'Asthma checkup and lung capacity validation.',
      createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'apt-3',
      patientId: patientIds.johnson,
      doctorId: docIds.wilson,
      date: getYesterdayAt(14, 0).split('T')[0],
      time: '02:00 PM',
      status: 'Completed',
      reason: 'Discharge follow-up and mobility therapy validation.',
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'apt-4',
      patientId: patientIds.davis,
      doctorId: docIds.ross,
      date: getTomorrowAt(9, 30).split('T')[0],
      time: '09:30 AM',
      status: 'Confirmed',
      reason: 'Chronic migraine diagnostics and treatment plan.',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'apt-5',
      patientId: patientIds.brown,
      doctorId: docIds.jenkins,
      date: getTomorrowAt(15, 0).split('T')[0],
      time: '03:00 PM',
      status: 'Pending',
      reason: 'Diabetic neuropathy consultation.',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  // 6. SEED MEDICINES
  const medicines = [
    {
      id: medicineIds.amox,
      name: 'Amoxicillin 250mg',
      category: 'Antibiotics',
      stock: 120,
      unitPrice: 8.50,
      expiryDate: '2027-10-15',
      supplier: 'PharmaCorp Global'
    },
    {
      id: medicineIds.lipi,
      name: 'Lipitor 20mg',
      category: 'Cardiovascular',
      stock: 8, // Low Stock Alert Trigger!
      unitPrice: 22.00,
      expiryDate: '2026-11-20',
      supplier: 'Apex Labs'
    },
    {
      id: medicineIds.metf,
      name: 'Metformin 500mg',
      category: 'Antidiabetic',
      stock: 240,
      unitPrice: 5.25,
      expiryDate: '2028-01-10',
      supplier: 'BioCare Distributors'
    },
    {
      id: medicineIds.ibup,
      name: 'Ibuprofen 400mg',
      category: 'Analgesics',
      stock: 400,
      unitPrice: 2.10,
      expiryDate: '2026-09-01', // Near Expiry Alert Trigger!
      supplier: 'Medline Supplies'
    },
    {
      id: medicineIds.para,
      name: 'Paracetamol 500mg',
      category: 'Analgesics',
      stock: 15,
      unitPrice: 1.50,
      expiryDate: '2027-05-18',
      supplier: 'Medline Supplies'
    },
    {
      id: medicineIds.insu,
      name: 'Insulin Humalog',
      category: 'Antidiabetic',
      stock: 45,
      unitPrice: 42.00,
      expiryDate: '2027-03-30',
      supplier: 'BioCare Distributors'
    },
    {
      id: medicineIds.gaba,
      name: 'Gabapentin 300mg',
      category: 'Neurological',
      stock: 65,
      unitPrice: 18.75,
      expiryDate: '2026-10-31',
      supplier: 'Apex Labs'
    }
  ];

  // 7. SEED PRESCRIPTIONS
  const prescriptions = [
    {
      id: 'pre-101',
      patientId: patientIds.doe,
      doctorId: docIds.jenkins,
      medicines: [
        { medId: medicineIds.lipi, dosage: '1 tablet daily', duration: '30 days' },
        { medId: medicineIds.para, dosage: '1 tablet every 6 hours as needed', duration: '5 days' }
      ],
      notes: 'Take Lipitor at night. Keep check of blood pressure levels daily.',
      date: getYesterdayAt(10, 0).split('T')[0]
    },
    {
      id: 'pre-102',
      patientId: patientIds.smith,
      doctorId: docIds.chen,
      medicines: [
        { medId: medicineIds.amox, dosage: '1 capsule three times daily', duration: '7 days' }
      ],
      notes: 'Complete the entire course of antibiotics.',
      date: getYesterdayAt(12, 0).split('T')[0]
    }
  ];

  // 8. SEED BILLS
  const bills = [
    {
      id: 'bill-201',
      patientId: patientIds.johnson,
      items: [
        { desc: 'Consultation Fee (Dr. James Wilson)', qty: 1, cost: 150.00 },
        { desc: 'X-Ray Right Hip Diagnostic', qty: 1, cost: 250.00 },
        { desc: 'Physical Therapy Session', qty: 2, cost: 75.00 }
      ],
      total: 550.00,
      status: 'Paid',
      paymentMode: 'Insurance',
      date: getYesterdayAt(15, 0).split('T')[0]
    },
    {
      id: 'bill-202',
      patientId: patientIds.doe,
      items: [
        { desc: 'ICU Bed Charges (ICU-201)', qty: 3, cost: 500.00 },
        { desc: 'Cardiology Specialist Fee (Dr. Sarah Jenkins)', qty: 1, cost: 200.00 },
        { desc: 'Lipitor Prescription Fulfill', qty: 1, cost: 22.00 }
      ],
      total: 1722.00,
      status: 'Unpaid',
      paymentMode: 'Cash',
      date: getTodayAt(9, 0).split('T')[0]
    },
    {
      id: 'bill-203',
      patientId: patientIds.smith,
      items: [
        { desc: 'General Ward Bed Charges (G-101)', qty: 2, cost: 150.00 },
        { desc: 'Asthma Diagnostic Panel', qty: 1, cost: 120.00 }
      ],
      total: 420.00,
      status: 'Partial',
      paymentMode: 'Card',
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
      testName: 'Brain MRI scan',
      doctorId: docIds.ross,
      status: 'In Progress',
      resultText: 'Scan complete. Radiologist report pending.',
      date: getTodayAt(14, 0).split('T')[0]
    }
  ];

  // 10. SEED HOSPITAL SETTINGS
  const settings = {
    hospitalName: 'HEALTH HUB',
    hospitalLogoText: 'HEALTH HUB',
    hospitalAddress: '750 Health Plaza Blvd, Boston, MA 02111',
    hospitalPhone: '+1 (555) 100-2000',
    hospitalEmail: 'contact@healthhub.com',
    theme: 'light',
    taxRate: 5, // 5% VAT
    currency: '$'
  };

  // 11. SEED ACTIVITY LOG
  const activityLog = [
    {
      id: 'act-1',
      userId: 'usr-admin-1',
      action: 'CREATE',
      entity: 'users',
      details: 'System Administrator initialized demo relational database configurations.',
      timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'act-2',
      userId: 'usr-admin-1',
      action: 'UPDATE',
      entity: 'wards',
      details: 'Admitted John Doe to ICU room, occupying bed ICU-201.',
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'act-3',
      userId: 'usr-reception-1',
      action: 'CREATE',
      entity: 'appointments',
      details: 'Booked appointment for Emily Davis with Dr. Amanda Ross.',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'act-4',
      userId: 'usr-doctor-1',
      action: 'CREATE',
      entity: 'prescriptions',
      details: 'Wrote prescription pre-101 for John Doe (Lipitor, Paracetamol).',
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

  // 13. SEED EMERGENCY ROOM CASES
  const emergencyCases = [
    { id: 'er-1', patientName: 'David Miller', age: 48, gender: 'Male', priority: 'Critical', condition: 'Acute Myocardial Infarction', assignedDoctorId: docIds.jenkins, arrivalTime: new Date(Date.now() - 40 * 60 * 1000).toISOString(), status: 'Admitted', roomNumber: 'ER-101' },
    { id: 'er-2', patientName: 'Sophia Loren', age: 34, gender: 'Female', priority: 'High', condition: 'Multiple Trauma from MVA', assignedDoctorId: docIds.ross, arrivalTime: new Date(Date.now() - 90 * 60 * 1000).toISOString(), status: 'Under Observation', roomNumber: 'ER-102' },
    { id: 'er-3', patientName: 'Liam Neeson', age: 60, gender: 'Male', priority: 'Critical', condition: 'Stroke symptoms', assignedDoctorId: docIds.chen, arrivalTime: new Date(Date.now() - 20 * 60 * 1000).toISOString(), status: 'In Surgery', roomNumber: 'OR-2' },
    { id: 'er-4', patientName: 'Emma Watson', age: 29, gender: 'Female', priority: 'Medium', condition: 'Severe Asthma Exacerbation', assignedDoctorId: docIds.wilson, arrivalTime: new Date(Date.now() - 120 * 60 * 1000).toISOString(), status: 'Discharged', roomNumber: 'ER-103' },
    { id: 'er-5', patientName: 'Bruce Wayne', age: 42, gender: 'Male', priority: 'Low', condition: 'Laceration on forearm', assignedDoctorId: docIds.ross, arrivalTime: new Date(Date.now() - 180 * 60 * 1000).toISOString(), status: 'Treated & Released', roomNumber: 'ER-104' }
  ];

  // 14. SEED STAFF MESSAGES
  const messages = [
    { id: 'msg-1', senderId: 'usr-admin-1', receiverId: 'usr-doctor-1', text: 'Hello Dr. Sarah, please review the latest cardiology schedule for next week.', timestamp: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(), isUnread: false },
    { id: 'msg-2', senderId: 'usr-doctor-1', receiverId: 'usr-admin-1', text: 'Sure, I will look at it and optimize using the schedule assistant.', timestamp: new Date(Date.now() - 35 * 60 * 60 * 1000).toISOString(), isUnread: false },
    { id: 'msg-3', senderId: 'usr-reception-1', receiverId: 'usr-doctor-1', text: 'Dr. Sarah, patient John Doe has arrived for his 10:00 AM checkup.', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), isUnread: true },
    { id: 'msg-4', senderId: 'usr-pharmacist-1', receiverId: 'usr-admin-1', text: 'We are running low on Paracetamol and Insulin. Please approve the reorder.', timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), isUnread: true }
  ];

  // 15. SEED SYSTEM NOTIFICATIONS
  const notifications = [
    { id: 'ntf-1', category: 'Appointments', text: 'Dr. Sarah Jenkins has a new appointment with John Doe.', timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(), isRead: false },
    { id: 'ntf-2', category: 'Pharmacy', text: 'Paracetamol stock is running low (Current: 120 units).', timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), isRead: false },
    { id: 'ntf-3', category: 'Payments', text: '3 invoices are currently overdue for payment.', timestamp: new Date(Date.now() - 120 * 60 * 1000).toISOString(), isRead: false },
    { id: 'ntf-4', category: 'AI Alerts', text: 'AI detected increased patient demand in Cardiology for tomorrow.', timestamp: new Date(Date.now() - 180 * 60 * 1000).toISOString(), isRead: true }
  ];

  // 16. SEED CALENDAR EVENTS
  const calendarEvents = [
    { id: 'evt-1', title: 'Cardiology Board Meeting', start: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] + 'T09:00:00', end: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] + 'T10:30:00', type: 'Meeting', doctorId: docIds.jenkins, description: 'Annual cardiology budget and staff review.' },
    { id: 'evt-2', title: 'Coronary Bypass Surgery - John Doe', start: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] + 'T08:00:00', end: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] + 'T13:00:00', type: 'Operation', doctorId: docIds.jenkins, description: 'Scheduled coronary artery bypass graft.' },
    { id: 'evt-3', title: 'Dr. Chen Shift hours', start: new Date(Date.now()).toISOString().split('T')[0] + 'T09:00:00', end: new Date(Date.now()).toISOString().split('T')[0] + 'T17:00:00', type: 'Shift', doctorId: docIds.chen, description: 'Regular neurology shift.' }
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

  console.log('Database successfully seeded with HEALTH HUB mock relational structure.');
};

// Resets demo data completely
export const resetDemo = async () => {
  localStorage.clear();
  await seedAll(true);
};
