const Patient = require('../models/Patient');
const TestOrder = require('../models/TestOrder');
const TestResult = require('../models/TestResult');
const AdmitPatient = require('../models/AdmitPatient');

exports.getStats = async (req, res) => {
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const [todayPatients, todayOrders, pendingResults, pendingPermit, admitted] = await Promise.all([
    Patient.countDocuments({ createdAt: { $gte: start } }),
    TestOrder.find({ createdAt: { $gte: start } }),
    TestResult.countDocuments({ status: 'SUBMITTED' }),
    TestResult.countDocuments({ status: 'PERMITTED' }),
    AdmitPatient.countDocuments({ status: 'ADMITTED' }),
  ]);
  const todayRevenue = todayOrders.reduce((s, o) => s + (o.paidAmount || 0), 0);
  const todayDue = todayOrders.reduce((s, o) => s + (o.dueAmount || 0), 0);
  res.json({
    todayPatients, todayTests: todayOrders.length,
    todayRevenue, todayDue, pendingResults, pendingPermit, admitted,
  });
};