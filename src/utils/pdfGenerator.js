import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// Custom header renderer for branding
const applyLetterhead = (doc, title, settings) => {
  // Primary brand color: Violet
  doc.setFillColor(109, 40, 217); // Violet-700
  doc.rect(0, 0, 210, 8, 'F');

  // Secondary bar
  doc.setFillColor(139, 92, 246); // Violet-500
  doc.rect(0, 8, 210, 2, 'F');

  // Hospital Brand Title
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(109, 40, 217);
  doc.text(settings.hospitalName || 'Careflow Medical Center', 15, 30);

  // Subtitle/Info
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text(settings.hospitalAddress || '750 Health Plaza Blvd, Boston, MA', 15, 36);
  doc.text(`Phone: ${settings.hospitalPhone || '+1 (555) 100-2000'}  |  Email: ${settings.hospitalEmail || 'contact@careflow.com'}`, 15, 41);

  // Document Title Banner
  doc.setFontSize(14);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(30, 41, 59); // slate-800
  doc.text(title.toUpperCase(), 145, 30);

  // Divider Line
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.5);
  doc.line(15, 46, 195, 46);
};

const applyFooter = (doc) => {
  const pageCount = doc.internal.getNumberOfPages();
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184); // slate-400

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    // Divider
    doc.setDrawColor(241, 245, 249);
    doc.line(15, 280, 195, 280);

    doc.text('This is a computer-generated medical record and requires no physical signature.', 15, 285);
    doc.text(`Page ${i} of ${pageCount}`, 180, 285);
  }
};

export const pdfGenerator = {
  // Generate downloadable Invoice PDF
  generateInvoice(bill, patient, settings = {}) {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    applyLetterhead(doc, 'Invoice Statement', settings);

    // Bill Meta Details
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85); // slate-700
    doc.text('INVOICE TO:', 15, 54);

    doc.setFont('Helvetica', 'normal');
    doc.text(`Patient Name: ${patient?.name || 'N/A'}`, 15, 60);
    doc.text(`Patient ID: ${patient?.id || 'N/A'}`, 15, 65);
    doc.text(`Age/Gender: ${patient?.age || 'N/A'} / ${patient?.gender || 'N/A'}`, 15, 70);
    doc.text(`Phone: ${patient?.phone || 'N/A'}`, 15, 75);

    // Bill metadata
    doc.setFont('Helvetica', 'bold');
    doc.text('INVOICE DETAILS:', 125, 54);
    doc.setFont('Helvetica', 'normal');
    doc.text(`Invoice ID: ${bill.id}`, 125, 60);
    doc.text(`Date Issued: ${bill.date}`, 125, 65);
    doc.text(`Payment Mode: ${bill.paymentMode}`, 125, 70);
    doc.text(`Status: ${bill.status.toUpperCase()}`, 125, 75);

    // Draw table
    const tableBody = bill.items.map((item, idx) => [
      idx + 1,
      item.desc,
      item.qty,
      `$${item.cost.toFixed(2)}`,
      `$${(item.qty * item.cost).toFixed(2)}`
    ]);

    doc.autoTable({
      startY: 83,
      head: [['#', 'Description', 'Qty', 'Unit Price', 'Total']],
      body: tableBody,
      headStyles: { fillColor: [109, 40, 217], textColor: [255, 255, 255] },
      margin: { left: 15, right: 15 },
      theme: 'striped',
      styles: { fontSize: 9 }
    });

    const finalY = doc.lastAutoTable.finalY + 8;

    // Totals Block
    doc.setFontSize(9);
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    
    doc.text('Subtotal:', 130, finalY);
    doc.text(`$${bill.subtotal.toFixed(2)}`, 175, finalY, { align: 'right' });

    doc.text('Tax (5%):', 130, finalY + 5);
    doc.text(`$${bill.tax.toFixed(2)}`, 175, finalY + 5, { align: 'right' });

    doc.text('Discount:', 130, finalY + 10);
    doc.text(`-$${(bill.discount || 0).toFixed(2)}`, 175, finalY + 10, { align: 'right' });

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(109, 40, 217);
    doc.text('Grand Total:', 130, finalY + 16);
    doc.text(`$${bill.total.toFixed(2)}`, 175, finalY + 16, { align: 'right' });

    applyFooter(doc);
    doc.save(`invoice_${bill.id.substring(0, 8)}.pdf`);
  },

  // Generate downloadable Prescription PDF
  generatePrescription(prescription, patient, doctor, settings = {}) {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    applyLetterhead(doc, 'Prescription Record', settings);

    // Prescription Info
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);
    doc.text('PATIENT DETAILS:', 15, 54);
    doc.setFont('Helvetica', 'normal');
    doc.text(`Name: ${patient?.name || 'N/A'}`, 15, 60);
    doc.text(`Patient ID: ${patient?.id || 'N/A'}`, 15, 65);
    doc.text(`Age/Gender: ${patient?.age || 'N/A'} / ${patient?.gender || 'N/A'}`, 15, 70);

    doc.setFont('Helvetica', 'bold');
    doc.text('CLINICAL DETAILS:', 125, 54);
    doc.setFont('Helvetica', 'normal');
    doc.text(`Prescription ID: ${prescription.id}`, 125, 60);
    doc.text(`Prescribing Doctor: Dr. ${doctor?.name || 'Sarah Jenkins'}`, 125, 65);
    doc.text(`Department: ${doctor?.specialization || 'Cardiology'}`, 125, 70);
    doc.text(`Date Issued: ${prescription.date}`, 125, 75);

    // Rx symbol
    doc.setFont('Times', 'italic');
    doc.setFontSize(26);
    doc.setTextColor(109, 40, 217);
    doc.text('Rx', 15, 87);

    // Medicines Table
    const tableBody = prescription.medicines.map((m, idx) => [
      idx + 1,
      m.detail?.name || 'Medication name',
      m.dosage,
      m.duration
    ]);

    doc.autoTable({
      startY: 92,
      head: [['#', 'Medicine Name', 'Dosage Instructions', 'Duration']],
      body: tableBody,
      headStyles: { fillColor: [109, 40, 217], textColor: [255, 255, 255] },
      margin: { left: 15, right: 15 },
      theme: 'grid',
      styles: { fontSize: 9 }
    });

    const finalY = doc.lastAutoTable.finalY + 12;

    // Doctor Notes
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);
    doc.text('CLINICAL NOTES & INSTRUCTIONS:', 15, finalY);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105); // slate-600
    
    // Auto wrap text
    const splitNotes = doc.splitTextToSize(prescription.notes || 'No specific notes provided.', 180);
    doc.text(splitNotes, 15, finalY + 6);

    // Doctor Signature Area
    const sigY = Math.min(240, finalY + 40);
    doc.setDrawColor(203, 213, 225);
    doc.line(130, sigY, 190, sigY);
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(`Dr. ${doctor?.name || 'Sarah Jenkins'}`, 130, sigY + 5);
    doc.text(`Signed Electronically`, 130, sigY + 9);

    applyFooter(doc);
    doc.save(`prescription_${prescription.id.substring(0, 8)}.pdf`);
  }
};
export default pdfGenerator;
