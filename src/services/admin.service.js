const directus = require('../lib/directus');
const { AppError } = require('../lib/errors');
const medicineService = require('./medicine.service');

const USER_FIELDS = 'id,full_name,email,role,status,is_verified,admission_number,staff_title,staff_number,phone,created_at,last_login_at,verified_by,verified_at';

async function listUsers({ q, role, status } = {}) {
  const filter = {};
  if (role) filter.role = { _eq: role };
  if (status) filter.status = { _eq: status };

  const users = await directus.list('users', {
    filter: Object.keys(filter).length ? filter : undefined,
    sort: ['full_name'],
    fields: USER_FIELDS,
    limit: -1,
  });

  if (!q) return users;
  const term = q.toLowerCase();
  return users.filter((user) => [
    user.full_name,
    user.email,
    user.admission_number,
    user.staff_number,
    user.staff_title,
  ].some((value) => String(value || '').toLowerCase().includes(term)));
}

async function setUserStatus(id, status, adminId) {
  const user = await directus.get('users', id, { fields: USER_FIELDS });
  if (!user) throw new AppError('User not found.', 404);
  const payload = { status };
  if (status === 'active') {
    payload.is_verified = true;
    payload.verified_by = adminId;
    payload.verified_at = new Date().toISOString();
  }
  return directus.update('users', id, payload);
}

async function deactivateUser(id) {
  const user = await directus.get('users', id, { fields: USER_FIELDS });
  if (!user) throw new AppError('User not found.', 404);
  return directus.update('users', id, { status: 'suspended' });
}

async function listAuditLogs({ q, action, dateFrom } = {}) {
  const filter = {};
  if (action) filter.action = { _eq: action };
  if (dateFrom) filter.created_at = { _gte: dateFrom };

  let logs = await directus.list('audit_logs', {
    filter: Object.keys(filter).length ? filter : undefined,
    sort: ['-created_at'],
    fields: '*,actor_id.id,actor_id.full_name,actor_id.role',
    limit: 500,
  });

  if (q) {
    const term = q.toLowerCase();
    logs = logs.filter((log) => [
      log.action,
      log.entity,
      log.entity_id,
      log.actor_id?.full_name,
      log.ip_address,
    ].some((value) => String(value || '').toLowerCase().includes(term)));
  }
  return logs;
}

async function dashboardStats() {
  const [
    studentCount,
    clinicianCount,
    adminCount,
    pendingCount,
    appointmentCount,
    recordCount,
    lowStock,
  ] = await Promise.all([
    directus.count('users', { role: { _eq: 'student' } }),
    directus.count('users', { role: { _eq: 'clinician' } }),
    directus.count('users', { role: { _eq: 'admin' } }),
    directus.count('users', { status: { _eq: 'pending' } }),
    directus.count('appointments', { status: { _eq: 'booked' } }),
    directus.count('medical_records'),
    medicineService.lowStock(),
  ]);

  return {
    studentCount,
    clinicianCount,
    adminCount,
    pendingCount,
    appointmentCount,
    recordCount,
    lowStockCount: lowStock.length,
    lowStock,
  };
}

module.exports = {
  listUsers,
  setUserStatus,
  deactivateUser,
  listAuditLogs,
  dashboardStats,
};
