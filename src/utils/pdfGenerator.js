const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');

const drawHeader = (doc) => {
  doc.fontSize(20).font('Helvetica-Bold').text('BOISHAKHI HOSPITAL', { align: 'center' });
  doc.fontSize(9).font('Helvetica').text('Mission More, Lalmonirhat', { align: 'center' });
  doc.text('Mobile: 01717525151, 01975775391', { align: 'center' });
  doc.text('Email: boishakhihospital@gmail.com, web: boishakhihospital.com', { align: 'center' });
  doc.moveDown(0.5);
  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown(0.5);
};

const drawFooter = (doc) => {
  const y = doc.page.height - 60;
  doc.moveTo(50, y).lineTo(545, y).stroke();
  doc.fontSize(8).text(
    'https://boishakhihospital.com  |  boishakhihospital@gmail.com  |  01717525151',
    50, y + 8, { align: 'center', width: 495 }
  );
};

exports.generateReportPDF = async (result, res) => {
  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  const chunks = [];
  doc.on('data', (c) => chunks.push(c));
  doc.on('end', () => {
    const pdf = Buffer.concat(chunks);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${result.reportNo}.pdf"`);
    res.end(pdf);
  });

  drawHeader(doc);
  const p = result.patient || {};
  doc.fontSize(10).font('Helvetica-Bold');
  doc.text(`Report No: ${result.reportNo || '-'}`, 50, doc.y, { continued: true, width: 250 });
  doc.text(`Date: ${new Date().toLocaleDateString('en-GB')}`, { align: 'right' });
  doc.font('Helvetica');
  doc.text(`Patient ID: ${p.patientId || '-'}`);
  doc.text(`Patient Name: ${p.name || '-'}`);
  doc.text(`Age: ${p.age || '-'}    Gender: ${p.gender || '-'}`);
  doc.text(`Phone: ${p.phone || '-'}`);
  doc.moveDown(0.5);
  doc.text(`Test: ${result.testName}`);
  doc.text(`Sample ID: ${result.sampleId || '-'}`);
  doc.moveDown(0.5);

  const tableTop = doc.y;
  doc.font('Helvetica-Bold').fontSize(10);
  doc.text('Test', 50, tableTop, { width: 200 });
  doc.text('Result', 250, tableTop, { width: 100 });
  doc.text('Reference Value', 350, tableTop, { width: 100 });
  doc.text('Unit', 460, tableTop, { width: 80 });
  doc.moveDown(0.3);
  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown(0.3);

  doc.font('Helvetica').fontSize(9);
  let lastGroup = '';
  (result.values || []).forEach((v) => {
    if (v.group && v.group !== lastGroup) {
      lastGroup = v.group;
      doc.font('Helvetica-Bold').text(v.group, 50, doc.y);
      doc.font('Helvetica');
    }
    const y = doc.y;
    doc.text(v.parameterName || '', 50, y, { width: 200 });
    doc.text(v.result || '', 250, y, { width: 100 });
    doc.text(v.referenceRange || '', 350, y, { width: 100 });
    doc.text(v.unit || '', 460, y, { width: 80 });
  });

  doc.moveDown(1);
  if (result.remarks) {
    doc.font('Helvetica-Bold').text('Remarks:', 50, doc.y);
    doc.font('Helvetica').text(result.remarks);
    doc.moveDown(0.5);
  }

  try {
    const qr = await QRCode.toDataURL(`https://boishakhihospital.com/report/verify/${result.reportNo}`);
    doc.image(qr, 470, doc.y, { width: 70 });
  } catch (e) {}

  doc.font('Helvetica').fontSize(9);
  doc.text('Reported By: Lab Technician', 50, doc.y + 10);
  doc.text(`Permitted By: ${result.permittedBy?.name || '-'}`, 50);
  doc.text('Status: FINAL', 50);
  drawFooter(doc);
  doc.end();
};

exports.generatePatientSlip = (patient, doctor, res) => {
  const PDFDocument = require('pdfkit');
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 15, bottom: 5, left: 30, right: 30 },
  });

  const chunks = [];
  doc.on('data', (c) => chunks.push(c));
  doc.on('end', () => {
    const pdf = Buffer.concat(chunks);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${patient.patientId}.pdf"`);
    res.end(pdf);
  });

  const LEFT = 30;
  const RIGHT = 565;
  const WIDTH = RIGHT - LEFT;
  const BLACK = '#000000';

  // ─────────────────────────────────────────────────────────
  // Helper: draw a single copy block at given Y
  // ─────────────────────────────────────────────────────────
  const drawCopy = (label, yStart) => {
    let y = yStart;

    // ── Header (centered) ──
    doc.font('Helvetica-Bold').fontSize(17).fillColor(BLACK)
      .text('BOISHAKHI HOSPITAL', LEFT, y, { align: 'center', width: WIDTH });
    y += 20;

    doc.font('Helvetica').fontSize(8).fillColor(BLACK)
      .text('Mission More, Lalmonirhat', LEFT, y, { align: 'center', width: WIDTH });
    y += 10;

    doc.fillColor(BLACK).text(
      'Mobile: 01717525151, 01975775391  |  Email: boishakhihospital@gmail.com  |  web: boishakhihospital.com',
      LEFT, y,
      { align: 'center', width: WIDTH }
    );
    y += 12;

    // ── Thin divider ──
    doc.moveTo(LEFT, y).lineTo(RIGHT, y).strokeColor(BLACK).lineWidth(0.7).stroke();
    y += 6;

    // ── Copy label (right aligned) ──
    doc.font('Helvetica-Bold').fontSize(8).fillColor(BLACK)
      .text(label, LEFT, y, { align: 'right', width: WIDTH });
    y += 12;

    // ── Patient ID banner ──
    doc.rect(LEFT, y, WIDTH, 22).strokeColor(BLACK).lineWidth(0.6).stroke();
    doc.fillColor(BLACK).font('Helvetica-Bold').fontSize(10)
      .text('Patient ID:', LEFT + 8, y + 6);
    doc.fontSize(13)
      .text(patient.patientId || '-', LEFT + 85, y + 4);
    doc.fontSize(10).font('Helvetica-Bold')
      .text(`Serial: ${patient.serial || '-'}`, LEFT, y + 6,
        { align: 'right', width: WIDTH - 8 });
    y += 28;

    // ── Patient info 2-column ──
    const colW = WIDTH / 2;
    const rowH = 16;

    const field = (lbl, val, x, yy, w) => {
      doc.font('Helvetica-Bold').fontSize(9).fillColor(BLACK)
        .text(lbl, x, yy, { width: w });
      doc.font('Helvetica').fontSize(10).fillColor(BLACK)
        .text(val || '-', x + 72, yy, { width: w - 72 });
    };

    field('Name:', patient.name, LEFT + 4, y, colW - 8);
    field('Phone:', patient.phone, LEFT + colW + 4, y, colW - 8);
    y += rowH;

    field('Age:', `${patient.age || '-'} years`, LEFT + 4, y, colW - 8);
    field('Gender:', patient.gender, LEFT + colW + 4, y, colW - 8);
    y += rowH;

    field(
      'Date:',
      patient.appointmentDate
        ? new Date(patient.appointmentDate).toLocaleDateString('en-GB')
        : '-',
      LEFT + 4, y, colW - 8
    );
    field('Fee:', `Tk. ${patient.consultationFee || 0}`, LEFT + colW + 4, y, colW - 8);
    y += rowH;

    field('Address:', patient.address, LEFT + 4, y, WIDTH - 8);
    y += rowH + 4;

    // ── Doctor info box ──
    const docBoxH = 48;
    doc.rect(LEFT, y, WIDTH, docBoxH).strokeColor(BLACK).lineWidth(0.6).stroke();
    doc.fillColor(BLACK).font('Helvetica-Bold').fontSize(8)
      .text('DOCTOR INFORMATION', LEFT + 8, y + 5);
    doc.moveTo(LEFT + 8, y + 15).lineTo(RIGHT - 8, y + 15)
      .strokeColor(BLACK).lineWidth(0.5).stroke();

    const d = doctor || {};
    const dLeft = LEFT + 8;
    const dRight = LEFT + colW + 8;

    doc.font('Helvetica-Bold').fontSize(9).fillColor(BLACK)
      .text(`Name: Dr. ${d.name || '-'}`, dLeft, y + 20);
    if (d.title) {
      doc.font('Helvetica').fontSize(8).fillColor(BLACK)
        .text(`Title: ${d.title}`, dRight, y + 20, { width: colW - 16 });
    }

    if (d.designation) {
      doc.font('Helvetica').fontSize(8).fillColor(BLACK)
        .text(`Designation: ${d.designation}`, dLeft, y + 32, { width: colW - 16 });
    }
    if (d.medicalCollege) {
      doc.font('Helvetica').fontSize(8).fillColor(BLACK)
        .text(`${d.medicalCollege}`, dRight, y + 32, { width: colW - 16 });
    }

    y += docBoxH + 6;
  };

  // ═════════════════════════════════════════════
  // TOP COPY — HOSPITAL COPY
  // ═════════════════════════════════════════════
  drawCopy('HOSPITAL COPY', 15);

  // ── Cutting line in the middle ──
  const middleY = 400;
  doc.moveTo(LEFT, middleY).lineTo(RIGHT, middleY)
    .dash(4, { space: 4 })
    .strokeColor(BLACK)
    .lineWidth(0.8)
    .stroke();
  doc.undash();

  // Scissor marks
  doc.font('Helvetica').fontSize(8).fillColor(BLACK)
    .text('✂ - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -',
      LEFT, middleY + 4, { align: 'center', width: WIDTH, lineBreak: false });

  // ═════════════════════════════════════════════
  // BOTTOM COPY — PATIENT COPY
  // ═════════════════════════════════════════════
  drawCopy('PATIENT COPY', 415);

  // ⭐ Footer removed completely — no more extra page

  doc.end();
};

exports.generateInvoice = (order, res) => {
  const PDFDocument = require('pdfkit');
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 15, bottom: 5, left: 30, right: 30 },
  });

  const chunks = [];
  doc.on('data', (c) => chunks.push(c));
  doc.on('end', () => {
    const pdf = Buffer.concat(chunks);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${order.orderNo}.pdf"`);
    res.end(pdf);
  });

  const LEFT = 30;
  const RIGHT = 565;
  const WIDTH = RIGHT - LEFT;
  const BLACK = '#000000';

  // ─────────────────────────────────────────────
  // Header (centered)
  // ─────────────────────────────────────────────
  doc.font('Helvetica-Bold').fontSize(18).fillColor(BLACK)
    .text('BOISHAKHI HOSPITAL', LEFT, 15, { align: 'center', width: WIDTH });

  doc.font('Helvetica').fontSize(8).fillColor(BLACK)
    .text('Mission More, Lalmonirhat', LEFT, doc.y, { align: 'center', width: WIDTH });

  doc.text(
    'Mobile: 01717525151, 01975775391  |  Email: boishakhihospital@gmail.com  |  web: boishakhihospital.com',
    LEFT, doc.y, { align: 'center', width: WIDTH }
  );

  doc.moveDown(0.4);
  doc.moveTo(LEFT, doc.y).lineTo(RIGHT, doc.y)
    .strokeColor(BLACK).lineWidth(0.8).stroke();
  doc.moveDown(0.5);

  // ─────────────────────────────────────────────
  // Invoice title bar
  // ─────────────────────────────────────────────
  const titleY = doc.y;
  doc.rect(LEFT, titleY, WIDTH, 22).strokeColor(BLACK).lineWidth(0.6).stroke();
  doc.font('Helvetica-Bold').fontSize(11).fillColor(BLACK)
    .text('TEST INVOICE', LEFT + 8, titleY + 6);

  doc.font('Helvetica-Bold').fontSize(10).fillColor(BLACK)
    .text(`Invoice No: ${order.orderNo}`, LEFT, titleY + 6,
      { align: 'right', width: WIDTH - 8 });

  doc.y = titleY + 28;

  // ─────────────────────────────────────────────
  // Patient info box (2-column)
  // ─────────────────────────────────────────────
  const p = order.patient || {};
  const boxTop = doc.y;
  const boxH = 58;
  doc.rect(LEFT, boxTop, WIDTH, boxH).strokeColor(BLACK).lineWidth(0.6).stroke();

  const colW = WIDTH / 2;
  const field = (lbl, val, x, yy, w) => {
    doc.font('Helvetica-Bold').fontSize(9).fillColor(BLACK)
      .text(lbl, x, yy, { width: w });
    doc.font('Helvetica').fontSize(10).fillColor(BLACK)
      .text(val || '-', x + 72, yy, { width: w - 72 });
  };

  field('Patient ID:', p.patientId, LEFT + 8, boxTop + 6, colW - 16);
  field('Name:', p.name, LEFT + colW + 8, boxTop + 6, colW - 16);

  field('Age / Gender:', `${p.age || '-'} / ${p.gender || '-'}`,
    LEFT + 8, boxTop + 22, colW - 16);
  field('Phone:', p.phone, LEFT + colW + 8, boxTop + 22, colW - 16);

  field(
    'Date:',
    new Date(order.createdAt).toLocaleDateString('en-GB'),
    LEFT + 8, boxTop + 38, colW - 16
  );
  field(
    'Payment Status:',
    order.paymentStatus || '-',
    LEFT + colW + 8, boxTop + 38, colW - 16
  );

  doc.y = boxTop + boxH + 8;

  // ─────────────────────────────────────────────
  // Table
  // ─────────────────────────────────────────────
  const tableTop = doc.y;
  const rowH = 20;
  const testColW = WIDTH - 120;   // "Test Name" column
  const feeColW = 120;             // "Fee" column

  // Header
  doc.rect(LEFT, tableTop, testColW, rowH).strokeColor(BLACK).lineWidth(0.6).stroke();
  doc.rect(LEFT + testColW, tableTop, feeColW, rowH).strokeColor(BLACK).lineWidth(0.6).stroke();

  doc.font('Helvetica-Bold').fontSize(10).fillColor(BLACK);
  doc.text('Test Name', LEFT + 8, tableTop + 5, { width: testColW - 16 });
  doc.text('Fee', LEFT + testColW, tableTop + 5,
    { width: feeColW - 8, align: 'right' });

  let y = tableTop + rowH;

  // Rows
  doc.font('Helvetica').fontSize(10);
  (order.items || []).forEach((item) => {
    if (y + rowH > doc.page.height - 180) {
      // If near bottom, still try — but with our layout usually fits
    }

    doc.rect(LEFT, y, testColW, rowH).strokeColor(BLACK).lineWidth(0.4).stroke();
    doc.rect(LEFT + testColW, y, feeColW, rowH).strokeColor(BLACK).lineWidth(0.4).stroke();

    doc.fillColor(BLACK).font('Helvetica').fontSize(10)
      .text(item.testName || '-', LEFT + 8, y + 5, { width: testColW - 16 });
    doc.text(`Tk. ${item.fee || 0}`, LEFT + testColW, y + 5,
      { width: feeColW - 8, align: 'right' });

    y += rowH;
  });

  // ─────────────────────────────────────────────
  // Totals block (right-aligned)
  // ─────────────────────────────────────────────
  y += 10;
  const totalsBoxW = 260;
  const totalsBoxX = RIGHT - totalsBoxW;
  const totalsRowH = 20;
  const totals = [
    { label: 'Total:', value: `Tk. ${order.totalAmount || 0}`, bold: false },
    { label: 'Paid:', value: `Tk. ${order.paidAmount || 0}`, bold: false },
    { label: 'Due:', value: `Tk. ${order.dueAmount || 0}`, bold: true },
  ];

  totals.forEach((t, i) => {
    const rowY = y + i * totalsRowH;
    doc.rect(totalsBoxX, rowY, totalsBoxW, totalsRowH)
      .strokeColor(BLACK).lineWidth(0.5).stroke();

    doc.font(t.bold ? 'Helvetica-Bold' : 'Helvetica')
      .fontSize(11).fillColor(BLACK)
      .text(t.label, totalsBoxX + 8, rowY + 5);
    doc.font(t.bold ? 'Helvetica-Bold' : 'Helvetica')
      .fontSize(11).fillColor(BLACK)
      .text(t.value, totalsBoxX, rowY + 5,
        { width: totalsBoxW - 8, align: 'right' });
  });

  doc.end();
};



///added cbc pdf
exports.generateCbcReportPDF = async (report, res) => {
  const PDFDocument = require('pdfkit');
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 30, bottom: 10, left: 30, right: 30 },
  });
  const chunks = [];
  doc.on('data', (c) => chunks.push(c));
  doc.on('end', () => {
    const pdf = Buffer.concat(chunks);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${report.reportNo}.pdf"`);
    res.end(pdf);
  });

  const LEFT = 30;
  const RIGHT = 565;
  const WIDTH = RIGHT - LEFT;

  // ─── Header ───
  doc.fontSize(16).font('Helvetica-Bold').text('BOISHAKHI HOSPITAL', { align: 'center' });
  doc.fontSize(8).font('Helvetica').text('Mission More, Lalmonirhat', { align: 'center' });
  doc.text('Mobile: 01717525151, 01975775391', { align: 'center' });
  doc.text('Email: boishakhihospital@gmail.com, web: boishakhihospital.com', { align: 'center' });

  doc.moveDown(0.2);
  doc.moveTo(LEFT, doc.y).lineTo(RIGHT, doc.y).stroke();
  doc.moveDown(0.2);

  const p = report.patient || {};
  const d = report.doctor || {};

  doc.fontSize(9).font('Helvetica-Bold');
  doc.text(`Report No: ${report.reportNo || '-'}`, LEFT, doc.y, { continued: true });
  doc.text(
    `Date: ${new Date(report.reportDate || report.createdAt).toLocaleDateString('en-GB')}`,
    { align: 'right' }
  );
  doc.moveDown(0.2);

  // ─── Patient Info Box ───
  const boxTop = doc.y;
  const boxH = 58;
  doc.rect(LEFT, boxTop, WIDTH, boxH).stroke();

  doc.font('Helvetica').fontSize(9);
  doc.text(`Patient ID: ${p.patientId || '-'}`, LEFT + 6, boxTop + 5);
  doc.text(`Name: ${p.name || '-'}`, LEFT + 6, boxTop + 19);
  doc.text(`Age: ${p.age || '-'}    Gender: ${p.gender || '-'}`, LEFT + 6, boxTop + 33);
  doc.text(`Phone: ${p.phone || '-'}`, LEFT + 6, boxTop + 47);

  const colRight = LEFT + WIDTH / 2 + 10;
  doc.font('Helvetica-Bold').text(`Refer By: Dr. ${d.name || '-'}`, colRight, boxTop + 5);
  doc.font('Helvetica').fontSize(8);
  if (d.title) doc.text(`Title: ${d.title}`, colRight, boxTop + 19);
  if (d.designation) doc.text(`Designation: ${d.designation}`, colRight, boxTop + 31);
  if (d.medicalCollege) doc.text(`${d.medicalCollege}`, colRight, boxTop + 43);

  doc.y = boxTop + boxH + 6;

  // ─── Table ───
  const tableTop = doc.y;
  const rowH = 15;
  const secH = 15;

  const colX = { test: LEFT, result: LEFT + 250, ref: LEFT + 350, unit: LEFT + 480 };
  const colW = { test: 250, result: 100, ref: 130, unit: 55 };

  doc.rect(LEFT, tableTop, WIDTH, rowH).fillAndStroke('#e5e7eb', '#000');
  doc.fillColor('black').font('Helvetica-Bold').fontSize(9);
  doc.text('Test', colX.test + 4, tableTop + 4, { width: colW.test - 8 });
  doc.text('Result', colX.result + 4, tableTop + 4, { width: colW.result - 8 });
  doc.text('Reference Value', colX.ref + 4, tableTop + 4, { width: colW.ref - 8 });
  doc.text('Unit', colX.unit + 4, tableTop + 4, { width: colW.unit - 8 });

  let y = tableTop + rowH;

  (report.rows || []).forEach((row) => {
    if (y + rowH > doc.page.height - 100) {
      doc.addPage();
      y = 40;
    }
    if (row.type === 'title') {
      doc.rect(LEFT, y, WIDTH, secH).stroke();
      doc.fillColor('black').font('Helvetica-Bold').fontSize(10);
      doc.text(row.test || '', LEFT + 4, y + 3, { width: WIDTH - 8 });
      y += secH;
    } else if (row.type === 'section') {
      doc.rect(LEFT, y, WIDTH, secH).fillAndStroke('#f3f4f6', '#000');
      doc.fillColor('black').font('Helvetica-Bold').fontSize(9);
      doc.text(row.test || '', LEFT + 4, y + 3.5, { width: WIDTH - 8 });
      y += secH;
    } else {
      doc.rect(LEFT, y, WIDTH, rowH).stroke();
      doc.fillColor('black').font('Helvetica').fontSize(9);
      doc.text(row.test || '', colX.test + 4, y + 3.5, { width: colW.test - 8 });
      doc.text(row.result || '', colX.result + 4, y + 3.5, { width: colW.result - 8 });
      doc.text(row.reference || '', colX.ref + 4, y + 3.5, { width: colW.ref - 8 });
      doc.text(row.unit || '', colX.unit + 4, y + 3.5, { width: colW.unit - 8 });
      y += rowH;
    }
  });

  // ─── Remarks ───
  if (report.remarks) {
    y += 6;
    doc.font('Helvetica-Bold').fontSize(9).text('Remarks:', LEFT, y);
    doc.font('Helvetica').fontSize(9).text(report.remarks, LEFT, y + 12, { width: WIDTH });
    y += 30;
  }

  // ─── Signatures (fixed near bottom) ───
  const sigY = Math.max(y + 20, doc.page.height - 130);
  doc.font('Helvetica').fontSize(9);
  doc.text('__________________________', LEFT, sigY);
  doc.text('Reported By', LEFT + 25, sigY + 13);
  doc.text('__________________________', RIGHT - 150, sigY);
  doc.text('Authorized Signature', RIGHT - 130, sigY + 13);

  // ─── Footer (moved up to avoid page break) ───
  const footerY = doc.page.height - 50;
  doc.moveTo(LEFT, footerY).lineTo(RIGHT, footerY).stroke();
  doc.fontSize(7).text(
    'https://boishakhihospital.com  |  boishakhihospital@gmail.com  |  01717525151',
    LEFT,
    footerY + 8,
    { align: 'center', width: WIDTH }
  );

  doc.end();
};


//added urine pdf
exports.generateUrineReportPDF = async (report, res) => {
  const PDFDocument = require('pdfkit');
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 30, bottom: 10, left: 30, right: 30 },
  });
  const chunks = [];
  doc.on('data', (c) => chunks.push(c));
  doc.on('end', () => {
    const pdf = Buffer.concat(chunks);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${report.reportNo}.pdf"`);
    res.end(pdf);
  });

  const LEFT = 30;
  const RIGHT = 565;
  const WIDTH = RIGHT - LEFT;

  // ─── Header ───
  doc.fontSize(16).font('Helvetica-Bold').text('BOISHAKHI HOSPITAL', { align: 'center' });
  doc.fontSize(8).font('Helvetica').text('Mission More, Lalmonirhat', { align: 'center' });
  doc.text('Mobile: 01717525151, 01975775391', { align: 'center' });
  doc.text('Email: boishakhihospital@gmail.com, web: boishakhihospital.com', { align: 'center' });

  doc.moveDown(0.2);
  doc.moveTo(LEFT, doc.y).lineTo(RIGHT, doc.y).stroke();
  doc.moveDown(0.2);

  const p = report.patient || {};
  const d = report.doctor || {};

  doc.fontSize(9).font('Helvetica-Bold');
  doc.text(`Report No: ${report.reportNo || '-'}`, LEFT, doc.y, { continued: true });
  doc.text(
    `Date: ${new Date(report.reportDate || report.createdAt).toLocaleDateString('en-GB')}`,
    { align: 'right' }
  );
  doc.moveDown(0.2);

  // ─── Patient Info Box ───
  const boxTop = doc.y;
  const boxH = 58;
  doc.rect(LEFT, boxTop, WIDTH, boxH).stroke();

  doc.font('Helvetica').fontSize(9);
  doc.text(`Patient ID: ${p.patientId || '-'}`, LEFT + 6, boxTop + 5);
  doc.text(`Name: ${p.name || '-'}`, LEFT + 6, boxTop + 19);
  doc.text(`Age: ${p.age || '-'}    Gender: ${p.gender || '-'}`, LEFT + 6, boxTop + 33);
  doc.text(`Phone: ${p.phone || '-'}`, LEFT + 6, boxTop + 47);

  const colRight = LEFT + WIDTH / 2 + 10;
  doc.font('Helvetica-Bold').text(`Refer By: Dr. ${d.name || '-'}`, colRight, boxTop + 5);
  doc.font('Helvetica').fontSize(8);
  if (d.title) doc.text(`Title: ${d.title}`, colRight, boxTop + 19);
  if (d.designation) doc.text(`Designation: ${d.designation}`, colRight, boxTop + 31);
  if (d.medicalCollege) doc.text(`${d.medicalCollege}`, colRight, boxTop + 43);

  doc.y = boxTop + boxH + 6;

  // ─── Table ───
  const tableTop = doc.y;
  const rowH = 15;
  const secH = 15;

  const colX = { test: LEFT, result: LEFT + 210, ref: LEFT + 350, unit: LEFT + 460 };
  const colW = { test: 210, result: 140, ref: 110, unit: 75 };

  doc.rect(LEFT, tableTop, WIDTH, rowH).fillAndStroke('#e5e7eb', '#000');
  doc.fillColor('black').font('Helvetica-Bold').fontSize(9);
  doc.text('Test', colX.test + 4, tableTop + 4, { width: colW.test - 8 });
  doc.text('Result', colX.result + 4, tableTop + 4, { width: colW.result - 8 });
  doc.text('Reference Value', colX.ref + 4, tableTop + 4, { width: colW.ref - 8 });
  doc.text('Unit', colX.unit + 4, tableTop + 4, { width: colW.unit - 8 });

  let y = tableTop + rowH;

  (report.rows || []).forEach((row) => {
    if (y + rowH > doc.page.height - 100) {
      doc.addPage();
      y = 40;
    }
    if (row.type === 'section') {
      doc.rect(LEFT, y, WIDTH, secH).fillAndStroke('#f3f4f6', '#000');
      doc.fillColor('black').font('Helvetica-Bold').fontSize(9);
      doc.text(row.test || '', LEFT + 4, y + 3.5, { width: WIDTH - 8 });
      y += secH;
    } else {
      doc.rect(LEFT, y, WIDTH, rowH).stroke();
      doc.fillColor('black').font('Helvetica').fontSize(9);
      doc.text(row.test || '', colX.test + 4, y + 3.5, { width: colW.test - 8 });
      doc.text(row.result || '', colX.result + 4, y + 3.5, { width: colW.result - 8 });
      doc.text(row.reference || '', colX.ref + 4, y + 3.5, { width: colW.ref - 8 });
      doc.text(row.unit || '', colX.unit + 4, y + 3.5, { width: colW.unit - 8 });
      y += rowH;
    }
  });

  // ─── Remarks ───
  if (report.remarks) {
    y += 6;
    doc.font('Helvetica-Bold').fontSize(9).text('Remarks:', LEFT, y);
    doc.font('Helvetica').fontSize(9).text(report.remarks, LEFT, y + 12, { width: WIDTH });
    y += 30;
  }

  // ─── Signatures (fixed near bottom) ───
  const sigY = Math.max(y + 20, doc.page.height - 130);
  doc.font('Helvetica').fontSize(9);
  doc.text('__________________________', LEFT, sigY);
  doc.text('Reported By', LEFT + 25, sigY + 13);
  doc.text('__________________________', RIGHT - 150, sigY);
  doc.text('Authorized Signature', RIGHT - 130, sigY + 13);

  // ─── Footer (moved up to avoid page break) ───
  const footerY = doc.page.height - 50;
  doc.moveTo(LEFT, footerY).lineTo(RIGHT, footerY).stroke();
  doc.fontSize(7).text(
    'https://boishakhihospital.com  |  boishakhihospital@gmail.com  |  01717525151',
    LEFT,
    footerY + 8,
    { align: 'center', width: WIDTH }
  );

  doc.end();
};



exports.generateAdmitPDF = (admit, res) => {
  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  const chunks = [];
  doc.on('data', (c) => chunks.push(c));
  doc.on('end', () => {
    const pdf = Buffer.concat(chunks);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${admit.admitId}.pdf"`);
    res.end(pdf);
  });

  drawHeader(doc);
  doc.font('Helvetica-Bold').fontSize(12).text('ADMITTED PATIENT RECEIPT');
  doc.moveDown(0.3);
  doc.font('Helvetica').fontSize(10);
  doc.text(`Admit ID: ${admit.admitId}`);
  doc.text(`Patient Name: ${admit.patientName}`);
  doc.text(`Phone: ${admit.patientPhone || '-'}`);
  if (admit.doctor) doc.text(`Doctor: Dr. ${admit.doctor.name}`);
  doc.text(`Operation Name: ${admit.operationName || '-'}`);
  if (admit.operationCategory) doc.text(`Operation Category: ${admit.operationCategory.name}`);
  doc.text(`Admit Date: ${new Date(admit.admitDate).toLocaleDateString('en-GB')}`);
  if (admit.dischargeDate) {
    const days = Math.ceil((new Date(admit.dischargeDate) - new Date(admit.admitDate)) / (1000 * 60 * 60 * 24));
    doc.text(`Discharge Date: ${new Date(admit.dischargeDate).toLocaleDateString('en-GB')}`);
    doc.text(`Total Days: ${days}`);
  }
  doc.text(`Cabin/Bed: ${admit.cabinOrBed || '-'}`);
  doc.moveDown(0.5);

  doc.font('Helvetica-Bold').text('Charges:', 50, doc.y);
  doc.font('Helvetica');
  (admit.charges || []).forEach((c) => {
    doc.text(`${c.title}`, 50, doc.y, { continued: true, width: 400 });
    doc.text(`৳${c.amount}`, { align: 'right' });
  });
  doc.moveDown(0.3);
  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  doc.font('Helvetica-Bold');
  doc.text(`Total: ৳${admit.totalAmount}`, { align: 'right' });
  doc.text(`Paid: ৳${admit.paidAmount}`, { align: 'right' });
  doc.text(`Due: ৳${admit.dueAmount}`, { align: 'right' });

  if (admit.remarks) {
    doc.moveDown(0.5);
    doc.font('Helvetica').text(`Remarks: ${admit.remarks}`);
  }
  drawFooter(doc);
  doc.end();
};