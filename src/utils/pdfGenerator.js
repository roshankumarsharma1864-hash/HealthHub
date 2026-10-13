import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import QRCode from 'qrcode';
import { formatINRText, amountInWords, INDIAN_HOSPITAL_DEFAULTS } from './currency.js';

// Custom header renderer for branding
const applyLetterhead = (doc, title, settings = {}) => {
  const mergedSettings = { ...INDIAN_HOSPITAL_DEFAULTS, ...settings };

  // Primary brand bar
  doc.setFillColor(30, 64, 175); // Royal Navy Blue
  doc.rect(0, 0, 210, 8, 'F');

  // Secondary teal accent bar
  doc.setFillColor(13, 148, 136); // Teal 600
  doc.rect(0, 8, 210, 2, 'F');

  // Hospital Brand Title
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(30, 64, 175);
  doc.text(mergedSettings.hospitalName || 'HEALTH HUB SUPER SPECIALITY HOSPITAL', 15, 23);

  // Subtitle / Accreditation
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`${mergedSettings.hospitalSubTitle || 'A Tertiary Care, Multi-Speciality Medical Institute'} | NABH Accredited`, 15, 28);
  doc.text(`${mergedSettings.hospitalAddress || 'Bengaluru, Karnataka, India'}`, 15, 33);
  doc.text(`Phone: ${mergedSettings.hospitalPhone}  |  GSTIN: ${mergedSettings.gstin}  |  SAC: ${mergedSettings.sacCode}`, 15, 38);

  // Document Title Banner
  doc.setFontSize(13);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(title.toUpperCase(), 145, 23);
  doc.setFontSize(7.5);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(13, 148, 136);
  doc.text('TAX INVOICE / CASH MEMO', 145, 28);

  // Divider Line
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(15, 42, 195, 42);
};

const applyFooter = (doc) => {
  const pageCount = doc.internal.getNumberOfPages();
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    // Divider
    doc.setDrawColor(241, 245, 249);
    doc.line(15, 280, 195, 280);

    doc.text('This is a computer-generated tax invoice under GST Rules. Hospital Reg No: KA/BLR/MED/2024/9842', 15, 285);
    doc.text(`Page ${i} of ${pageCount}`, 180, 285);
  }
};

export const pdfGenerator = {
  // Generate downloadable Invoice PDF
  async generateInvoice(bill, patient, settings = {}) {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const mergedSettings = { ...INDIAN_HOSPITAL_DEFAULTS, ...settings };
    applyLetterhead(doc, 'Invoice Statement', mergedSettings);

    // Bill Meta Details
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    doc.text('PATIENT / BILL TO:', 15, 49);

    doc.setFont('Helvetica', 'normal');
    doc.text(`Patient Name: ${patient?.name || 'N/A'}`, 15, 54);
    doc.text(`UHID / Patient ID: ${patient?.id ? patient.id.substring(0, 12).toUpperCase() : 'N/A'}`, 15, 59);
    doc.text(`Age / Gender: ${patient?.age || 'N/A'} Yrs / ${patient?.gender || 'N/A'}`, 15, 64);
    doc.text(`Phone: ${patient?.phone || 'N/A'}`, 15, 69);

    // Bill metadata
    doc.setFont('Helvetica', 'bold');
    doc.text('INVOICE SPECIFICATIONS:', 125, 49);
    doc.setFont('Helvetica', 'normal');
    doc.text(`Invoice No: INV-${bill.id.substring(0, 8).toUpperCase()}`, 125, 54);
    doc.text(`Date of Issue: ${bill.date}`, 125, 59);
    doc.text(`Payment Mode: ${bill.paymentMode || 'Cash'}`, 125, 64);
    doc.text(`Status: ${(bill.status || 'UNPAID').toUpperCase()}`, 125, 69);

    // Table body with Indian Rupee formatting
    const tableBody = (bill.items || []).map((item, idx) => [
      idx + 1,
      item.desc,
      '999312',
      item.qty,
      formatINRText(item.cost),
      formatINRText(item.qty * item.cost)
    ]);

    doc.autoTable({
      startY: 75,
      head: [['#', 'Service / Item Description', 'SAC Code', 'Qty', 'Rate (INR)', 'Amount (INR)']],
      body: tableBody,
      headStyles: { fillColor: [30, 64, 175], textColor: [255, 255, 255], fontStyle: 'bold' },
      margin: { left: 15, right: 15 },
      theme: 'striped',
      styles: { fontSize: 8.5 }
    });

    const finalY = doc.lastAutoTable.finalY + 6;

    const subtotal = bill.subtotal || bill.items.reduce((sum, item) => sum + (item.qty * item.cost), 0);
    const cgst = Math.round(subtotal * 0.025 * 100) / 100;
    const sgst = Math.round(subtotal * 0.025 * 100) / 100;
    const discount = bill.discount || 0;
    const total = bill.total || Math.max(0, subtotal + cgst + sgst - discount);

    // Dynamic UPI QR Code on bottom left
    try {
      const upiUrl = `upi://pay?pa=${mergedSettings.upiVpa || 'healthhub.billing@icici'}&pn=HealthHub+Hospital&am=${total.toFixed(2)}&cu=INR&tn=Invoice_${bill.id.substring(0, 8)}`;
      const qrData = await QRCode.toDataURL(upiUrl, { width: 120, margin: 1 });
      doc.addImage(qrData, 'PNG', 15, finalY, 28, 28);
      doc.setFontSize(7.5);
      doc.setFont('Helvetica', 'bold');
      doc.setTextColor(30, 64, 175);
      doc.text('Scan & Pay via UPI (GPay/PhonePe)', 15, finalY + 31);
      doc.setFont('Helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(`UPI VPA: ${mergedSettings.upiVpa || 'healthhub.billing@icici'}`, 15, finalY + 34.5);
    } catch (e) {
      console.warn('QR code skipped in PDF', e);
    }

    // Totals Block on right
    doc.setFontSize(8.5);
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(71, 85, 105);

    doc.text('Subtotal Amount:', 125, finalY + 4);
    doc.text(formatINRText(subtotal), 195, finalY + 4, { align: 'right' });

    doc.text('CGST (2.5%):', 125, finalY + 9);
    doc.text(formatINRText(cgst), 195, finalY + 9, { align: 'right' });

    doc.text('SGST (2.5%):', 125, finalY + 14);
    doc.text(formatINRText(sgst), 195, finalY + 14, { align: 'right' });

    if (discount > 0) {
      doc.text('Hospital Discount:', 125, finalY + 19);
      doc.text(`- ${formatINRText(discount)}`, 195, finalY + 19, { align: 'right' });
    }

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(30, 64, 175);
    const grandY = discount > 0 ? finalY + 26 : finalY + 21;
    doc.text('Net Total Payable:', 125, grandY);
    doc.text(formatINRText(total), 195, grandY, { align: 'right' });

    // Amount in Words Bar
    const wordsY = Math.max(finalY + 40, grandY + 12);
    doc.setFillColor(248, 250, 252);
    doc.rect(15, wordsY - 4, 180, 9, 'F');
    doc.setFontSize(8);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(51, 65, 85);
    doc.text(`Amount in Words:  ${amountInWords(total)}`, 18, wordsY + 2);

    // Signatures
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Patient / Payer Signature', 20, wordsY + 23);
    doc.text('For HEALTH HUB SUPER SPECIALITY HOSPITAL', 125, wordsY + 18);
    doc.setFont('Helvetica', 'bold');
    doc.text('Authorized Billing Officer / Accounts Desk', 125, wordsY + 23);

    applyFooter(doc);
    doc.save(`Invoice_${bill.id.substring(0, 8).toUpperCase()}.pdf`);
  },

  // Generate downloadable Prescription PDF
  generatePrescription(prescription, patient, doctor, settings = {}) {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const mergedSettings = { ...INDIAN_HOSPITAL_DEFAULTS, ...settings };
    applyLetterhead(doc, 'Prescription Record', mergedSettings);

    // Prescription Info
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    doc.text('PATIENT DETAILS:', 15, 50);

    doc.setFont('Helvetica', 'normal');
    doc.text(`Name: ${patient?.name || 'N/A'}`, 15, 55);
    doc.text(`UHID / ID: ${patient?.id ? patient.id.substring(0, 12).toUpperCase() : 'N/A'}`, 15, 60);
    doc.text(`Age/Gender: ${patient?.age || 'N/A'} Yrs / ${patient?.gender || 'N/A'}`, 15, 65);

    doc.setFont('Helvetica', 'bold');
    doc.text('CLINICAL DETAILS:', 125, 50);
    doc.setFont('Helvetica', 'normal');
    doc.text(`Prescription ID: ${prescription.id}`, 125, 55);
    doc.text(`Prescribing Doctor: Dr. ${doctor?.name || 'Rajeshwari Sengupta'}`, 125, 60);
    doc.text(`Department: ${doctor?.specialization || 'Cardiology'}`, 125, 65);
    doc.text(`Date Issued: ${prescription.date}`, 125, 70);

    // Rx symbol
    doc.setFont('Times', 'italic');
    doc.setFontSize(26);
    doc.setTextColor(30, 64, 175);
    doc.text('Rx', 15, 82);

    // Medicines Table
    const tableBody = (prescription.medicines || []).map((m, idx) => [
      idx + 1,
      m.detail?.name || 'Medication name',
      m.dosage,
      m.duration
    ]);

    doc.autoTable({
      startY: 87,
      head: [['#', 'Medicine Name', 'Dosage Instructions', 'Duration']],
      body: tableBody,
      headStyles: { fillColor: [30, 64, 175], textColor: [255, 255, 255] },
      margin: { left: 15, right: 15 },
      theme: 'grid',
      styles: { fontSize: 8.5 }
    });

    const finalY = doc.lastAutoTable.finalY + 10;

    // Doctor Notes
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    doc.text('CLINICAL NOTES & INSTRUCTIONS:', 15, finalY);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    
    // Auto wrap text
    const splitNotes = doc.splitTextToSize(prescription.notes || 'No specific notes provided.', 180);
    doc.text(splitNotes, 15, finalY + 5);

    // Doctor Signature Area
    const sigY = Math.min(240, finalY + 35);
    doc.setDrawColor(203, 213, 225);
    doc.line(130, sigY, 190, sigY);
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`Dr. ${doctor?.name || 'Rajeshwari Sengupta'}`, 130, sigY + 5);
    doc.text(`Medical Council Reg: MCI-49219`, 130, sigY + 9);

    applyFooter(doc);
    doc.save(`Prescription_${prescription.id.substring(0, 8).toUpperCase()}.pdf`);
  }
};

export default pdfGenerator;
