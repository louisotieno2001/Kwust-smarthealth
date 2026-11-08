const express = require('express');
const directus = require('../lib/directus');
const { asyncHandler, AppError } = require('../lib/errors');
const { requireRole } = require('../middleware/auth');
const { setFlash } = require('../middleware/flash');
const { logAudit } = require('../lib/audit');
const { back } = require('../lib/http');
const adminService = require('../services/admin.service');
const recordService = require('../services/record.service');
const medicineService = require('../services/medicine.service');
const appointmentService = require('../services/appointment.service');
const pdfService = require('../services/pdf.service');

const router = express.Router();
router.use(requireRole('admin'));

router.get('/dashboard', asyncHandler(async (req, res) => {
  const [stats, recentLogs, pendingUsers, recentRecords] = await Promise.all([
    adminService.dashboardStats(),
    adminService.listAuditLogs(),
    adminService.listUsers({ status: 'pending' }),
    recordService.listRecords(),
  ]);
  res.render('admin/dashboard', {
    title: 'Admin dashboard',
    stats,
    recentLogs: recentLogs.slice(0, 10),
    pendingUsers: pendingUsers.slice(0, 8),
    recentRecords: recentRecords.slice(0, 6),
  });
}));

router.get('/users', asyncHandler(async (req, res) => {
  const users = await adminService.listUsers({
    q: req.query.q,
    role: req.query.role,
    status: req.query.status,
  });
  res.render('admin/users', {
    title: 'User management',
    users,
    q: req.query.q || '',
    selectedRole: req.query.role || '',
    selectedStatus: req.query.status || '',
  });
}));

router.post('/users/:id/verify', asyncHandler(async (req, res) => {
  try {
    const user = await adminService.setUserStatus(req.params.id, 'active', req.user.id);
    await logAudit(req, { action: 'user.verify', entity: 'user', entityId: user.id, metadata: { role: user.role } });
    setFlash(res, 'success', `${user.full_name} has been verified.`);
  } catch (error) {
    setFlash(res, 'error', error.message);
  }
  return back(req, res, '/admin/users');
}));

router.post('/users/:id/suspend', asyncHandler(async (req, res) => {
  try {
    if (String(req.params.id) === String(req.user.id)) {
      throw new AppError('You cannot suspend your own administrator account.', 400);
    }
    const user = await adminService.setUserStatus(req.params.id, 'suspended', req.user.id);
    await logAudit(req, { action: 'user.suspend', entity: 'user', entityId: user.id });
    setFlash(res, 'success', `${user.full_name} has been suspended.`);
  } catch (error) {
    setFlash(res, 'error', error.message);
  }
  return back(req, res, '/admin/users');
}));

router.post('/users/:id/reactivate', asyncHandler(async (req, res) => {
  try {
    const user = await adminService.setUserStatus(req.params.id, 'active', req.user.id);
    await logAudit(req, { action: 'user.reactivate', entity: 'user', entityId: user.id });
    setFlash(res, 'success', `${user.full_name} has been reactivated.`);
  } catch (error) {
    setFlash(res, 'error', error.message);
  }
  return back(req, res, '/admin/users');
}));

router.post('/users/:id/reject', asyncHandler(async (req, res) => {
  try {
    if (String(req.params.id) === String(req.user.id)) {
      throw new AppError('You cannot reject your own administrator account.', 400);
    }
    const user = await adminService.setUserStatus(req.params.id, 'rejected', req.user.id);
    await logAudit(req, { action: 'user.reject', entity: 'user', entityId: user.id });
    setFlash(res, 'success', `${user.full_name}'s account request was rejected.`);
  } catch (error) {
    setFlash(res, 'error', error.message);
  }
  return back(req, res, '/admin/users');
}));

router.get('/audit-logs', asyncHandler(async (req, res) => {
  const logs = await adminService.listAuditLogs({
    q: req.query.q,
    action: req.query.action,
    dateFrom: req.query.date_from,
  });
  res.render('admin/audit-logs', {
    title: 'Audit logs',
    logs,
    q: req.query.q || '',
    selectedAction: req.query.action || '',
    dateFrom: req.query.date_from || '',
  });
}));

router.get('/records', asyncHandler(async (req, res) => {
  const records = await recordService.listRecords({ q: req.query.q, diagnosis: req.query.diagnosis });
  res.render('admin/records', { title: 'Medical records oversight', records, q: req.query.q || '', diagnosis: req.query.diagnosis || '' });
}));

router.get('/records/:id', asyncHandler(async (req, res) => {
  const record = await recordService.getRecord(req.params.id);
  if (!record) throw new AppError('Medical record not found.', 404);
  res.render('admin/record-show', { title: 'Medical record', record });
}));

router.get('/records/:id/pdf', asyncHandler(async (req, res) => {
  const record = await recordService.getRecord(req.params.id);
  if (!record) throw new AppError('Medical record not found.', 404);
  await logAudit(req, { action: 'record.pdf', entity: 'medical_record', entityId: record.id, metadata: { as: 'admin' } });
  pdfService.streamRecordPdf(record, res);
}));

router.get('/medicines', asyncHandler(async (req, res) => {
  const [medicines, categories] = await Promise.all([
    medicineService.listMedicines({ q: req.query.q, category: req.query.category, status: req.query.status }),
    medicineService.categories(),
  ]);
  res.render('admin/medicines', {
    title: 'Medicine oversight',
    medicines,
    categories,
    q: req.query.q || '',
    selectedCategory: req.query.category || '',
    selectedStatus: req.query.status || '',
  });
}));

router.get('/reports', asyncHandler(async (req, res) => {
  const [appointments, records, medicines, stats] = await Promise.all([
    appointmentService.listAllAppointments(),
    recordService.listRecords(),
    medicineService.listMedicines(),
    adminService.dashboardStats(),
  ]);

  const appointmentStatus = appointments.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, {});

  const diagnoses = records.reduce((acc, item) => {
    const key = item.diagnosis?.trim();
    if (key) acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const topDiagnoses = Object.entries(diagnoses)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([diagnosis, count]) => ({ diagnosis, count }));

  const medicineStatus = medicines.reduce((acc, item) => {
    acc[item.effective_status] = (acc[item.effective_status] || 0) + 1;
    return acc;
  }, {});

  res.render('admin/reports', {
    title: 'System reports',
    stats,
    appointmentStatus,
    topDiagnoses,
    medicineStatus,
  });
}));

module.exports = router;
