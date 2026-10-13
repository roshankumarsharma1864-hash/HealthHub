// Currency and Indian Hospital Billing Utilities

/**
 * Format numeric amount into standard Indian Rupee notation (e.g. ₹1,45,200.00)
 */
export const formatINR = (amount, includePaise = true) => {
  const num = Number(amount || 0);
  if (isNaN(num)) return '₹0.00';
  return '₹' + num.toLocaleString('en-IN', {
    minimumFractionDigits: includePaise ? 2 : 0,
    maximumFractionDigits: 2
  });
};

/**
 * Format amount for PDF / text outputs where standard ASCII font is required
 */
export const formatINRText = (amount, includePaise = true) => {
  const num = Number(amount || 0);
  if (isNaN(num)) return 'Rs. 0.00';
  return 'Rs. ' + num.toLocaleString('en-IN', {
    minimumFractionDigits: includePaise ? 2 : 0,
    maximumFractionDigits: 2
  });
};

/**
 * Convert numerical Rupee amount to official Indian words for tax invoices
 * Example: 2450.50 -> "Rupees Two Thousand Four Hundred Fifty and Fifty Paise Only"
 */
export const amountInWords = (amount) => {
  const num = Number(amount || 0);
  if (num === 0) return 'Rupees Zero Only';

  const a = [
    '', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ',
    'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const convertTwoDigits = (n) => {
    if (n < 20) return a[n];
    return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : ' ');
  };

  const convertThreeDigits = (n) => {
    let str = '';
    if (n > 99) {
      str += a[Math.floor(n / 100)] + 'Hundred ';
      n %= 100;
    }
    if (n > 0) {
      str += convertTwoDigits(n);
    }
    return str;
  };

  const rupees = Math.floor(Math.abs(num));
  const paise = Math.round((Math.abs(num) - rupees) * 100);

  let output = '';

  const crore = Math.floor(rupees / 10000000);
  const lakh = Math.floor((rupees % 10000000) / 100000);
  const thousand = Math.floor((rupees % 100000) / 1000);
  const hundreds = rupees % 1000;

  if (crore > 0) output += convertTwoDigits(crore) + 'Crore ';
  if (lakh > 0) output += convertTwoDigits(lakh) + 'Lakh ';
  if (thousand > 0) output += convertTwoDigits(thousand) + 'Thousand ';
  if (hundreds > 0) output += convertThreeDigits(hundreds);

  output = 'Rupees ' + output.trim();

  if (paise > 0) {
    output += ' and ' + convertTwoDigits(paise).trim() + ' Paise';
  }

  return output + ' Only';
};

/**
 * Standard Indian Hospital Accreditation and GST Profile Defaults
 */
export const INDIAN_HOSPITAL_DEFAULTS = {
  hospitalName: 'HEALTH HUB SUPER SPECIALITY HOSPITAL',
  hospitalSubTitle: 'A Tertiary Care, Multi-Speciality Medical Institute',
  hospitalAddress: 'Plot 42, Sector 18, Health City, Bengaluru, Karnataka 560100',
  hospitalPhone: '+91 (080) 4968-2000 / Helpline: 108',
  hospitalEmail: 'billing@healthhubhospital.in',
  hospitalWebsite: 'www.healthhubhospital.in',
  gstin: '29AAACH1234M1Z5',
  hospRegNo: 'KA/BLR/MED/2024/9842',
  sacCode: '999312', // Healthcare Services by Clinical Establishments
  upiVpa: 'healthhub.billing@icici',
  currency: '₹',
  taxRate: 5, // 5% GST (CGST 2.5% + SGST 2.5%)
  accreditations: ['NABH Accredited', 'NABL Certified Lab', 'ISO 9001:2015']
};

/**
 * Supported payment methods in Indian Healthcare
 */
export const INDIAN_PAYMENT_METHODS = [
  { id: 'UPI', label: 'UPI / QR (GPay, PhonePe, Paytm, BHIM)', badge: 'UPI' },
  { id: 'Card', label: 'Credit / Debit Card (RuPay, Visa, MC)', badge: 'Card' },
  { id: 'Cash', label: 'Cash (INR Counter)', badge: 'Cash' },
  { id: 'Insurance', label: 'TPA / Health Insurance (Ayushman / Star / HDFC)', badge: 'TPA' },
  { id: 'NetBanking', label: 'Net Banking (IMPS / NEFT / RTGS)', badge: 'NetBanking' }
];
