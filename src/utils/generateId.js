const Counter = require('../models/Counter');

const generatePatientId = async (doctorId) => {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const datePart = `${yy}${mm}${dd}`;
  const key = `patient_${doctorId}_${datePart}`;
  const counter = await Counter.findOneAndUpdate(
    { key }, { $inc: { seq: 1 } }, { new: true, upsert: true }
  );
  return {
    patientId: `BH${datePart}${String(counter.seq).padStart(3, '0')}`,
    serial: counter.seq,
  };
};

const generateReportId = async () => {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const counter = await Counter.findOneAndUpdate(
    { key: `report_${yy}${mm}` }, { $inc: { seq: 1 } }, { new: true, upsert: true }
  );
  return `RPT${yy}${mm}${String(counter.seq).padStart(5, '0')}`;
};

const generateOrderNo = async () => {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const counter = await Counter.findOneAndUpdate(
    { key: `order_${yy}${mm}` }, { $inc: { seq: 1 } }, { new: true, upsert: true }
  );
  return `ORD${yy}${mm}${String(counter.seq).padStart(4, '0')}`;
};

const generateAdmitId = async () => {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const counter = await Counter.findOneAndUpdate(
    { key: `admit_${yy}${mm}` }, { $inc: { seq: 1 } }, { new: true, upsert: true }
  );
  return `ADM${yy}${mm}${String(counter.seq).padStart(4, '0')}`;
};

module.exports = { generatePatientId, generateReportId, generateOrderNo, generateAdmitId };