const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const directus = require('../src/lib/directus');
const { signAuthToken } = require('../src/lib/auth');
const app = require('../src/app');

const student = {
  id: 1,
  full_name: 'Amina Hassan',
  email: 'amina@student.kwust.ac.ke',
  role: 'student',
  status: 'active',
  admission_number: 'BBIT/45/26',
  admission_number_canonical: 'BBIT/45/2026',
};

const clinician = {
  id: 2,
  full_name: 'Dr. Wanjiku Kamau',
  email: 'wanjiku@kwust.ac.ke',
  role: 'clinician',
  status: 'active',
  is_verified: true,
  staff_title: 'Doctor',
};

const admin = {
  id: 3,
  full_name: 'System Administrator',
  email: 'admin@kwust.ac.ke',
  role: 'admin',
  status: 'active',
  is_verified: true,
};

const slot = {
  id: 10,
  clinician_id: { id: clinician.id, full_name: clinician.full_name, staff_title: 'Doctor' },
  date: '2099-01-10',
  start_time: '09:00:00',
  end_time: '10:00:00',
  capacity: 5,
  location: 'University Health Center',
  status: 'open',
};

const appointment = {
  id: 20,
  status: 'booked',
  reason: 'Persistent headache',
  created_at: '2026-11-01T09:00:00.000Z',
  student_id: {
    id: student.id,
    full_name: student.full_name,
    admission_number: student.admission_number,
    email: student.email,
  },
  clinician_id: { id: clinician.id, full_name: clinician.full_name, staff_title: 'Doctor' },
  slot_id: { ...slot },
};

const medicine = {
  id: 30,
  name: 'Paracetamol 500mg',
  category: 'Analgesic',
  description: 'Pain and fever relief',
  quantity: 3,
  unit: 'tablets',
  reorder_level: 5,
  expiry_date: '2099-12-31',
  status: 'available',
};

const record = {
  id: 40,
  student_id: appointment.student_id,
  clinician_id: appointment.clinician_id,
  appointment_id: { id: appointment.id, status: 'booked' },
  visit_date: '2026-11-01',
  chief_complaint: 'Headache',
  symptoms: 'Head pain for two days',
  diagnosis: 'Tension headache',
  notes: 'Rest and hydration advised.',
  created_at: '2026-11-01T09:00:00.000Z',
};

const prescription = {
  id: 50,
  record_id: record.id,
  medicine_id: { id: medicine.id, name: medicine.name, category: medicine.category, unit: medicine.unit },
  dosage: '1 tablet',
  frequency: 'Twice daily',
  duration: '3 days',
  quantity: 2,
  instructions: 'Take after meals',
};

const reminder = {
  id: 60,
  user_id: student.id,
  title: 'Drink water',
  message: 'Remember to stay hydrated.',
  type: 'general',
  created_at: '2026-11-01T09:00:00.000Z',
  created_by: { id: clinician.id, full_name: clinician.full_name },
  read_at: null,
};

const note = {
  id: 70,
  student_id: student.id,
  title: 'Allergy note',
  content: 'Penicillin allergy.',
  created_at: '2026-11-01T09:00:00.000Z',
};

const todo = {
  id: 80,
  student_id: student.id,
  title: 'Collect prescription',
  due_date: '2099-01-01',
  completed: false,
  created_at: '2026-11-01T09:00:00.000Z',
};

const auditLog = {
  id: 90,
  action: 'user.login',
  entity: 'user',
  entity_id: '1',
  created_at: '2026-11-01T09:00:00.000Z',
  actor_id: { id: admin.id, full_name: admin.full_name, role: 'admin' },
  ip_address: '127.0.0.1',
  user_agent: 'test',
  metadata: {},
};

function users() {
  return [student, clinician, admin];
}

function mockDirectus() {
  directus.get = async (collection, id) => {
    if (collection === 'users') return users().find((user) => String(user.id) === String(id)) || null;
    if (collection === 'appointment_slots') return { ...slot, id };
    if (collection === 'appointments') return { ...appointment, id };
    if (collection === 'medical_records') return { ...record, id };
    if (collection === 'medicines') return { ...medicine, id };
    if (collection === 'reminders') return { ...reminder, id };
    return null;
  };

  directus.list = async (collection) => {
    if (collection === 'users') return users();
    if (collection === 'appointment_slots') return [slot];
    if (collection === 'appointments') return [appointment];
    if (collection === 'medical_records') return [record];
    if (collection === 'prescriptions') return [prescription];
    if (collection === 'medicines') return [medicine];
    if (collection === 'reminders') return [reminder];
    if (collection === 'health_notes') return [note];
    if (collection === 'todos') return [todo];
    if (collection === 'audit_logs') return [auditLog];
    return [];
  };

  directus.first = async () => null;
  directus.count = async () => 1;
  directus.create = async (collection, data) => ({ id: 999, ...data });
  directus.createMany = async (collection, data) => data;
  directus.update = async (collection, id, data) => ({ id, ...data });
  directus.remove = async () => null;
}

function cookieFor(user) {
  return `kwust_auth=${signAuthToken(user)}`;
}

async function expectPage(path, user, status = 200) {
  const res = await request(app).get(path).set('Cookie', cookieFor(user));
  assert.equal(res.status, status, `${path} should return ${status}`);
  assert.doesNotMatch(res.text, /password_hash/i, `${path} should not expose password hashes`);
  return res;
}

test.beforeEach(() => {
  mockDirectus();
});

test('student pages render with representative data', async () => {
  await expectPage('/student/dashboard', student);
  await expectPage('/student/appointments', student);
  await expectPage('/student/appointments/book', student);
  await expectPage('/student/records', student);
  const recordPage = await expectPage(`/student/records/${record.id}`, student);
  assert.match(recordPage.text, /Tension headache/);
  await expectPage('/student/notes', student);
  await expectPage('/student/todos', student);

  const pdf = await request(app)
    .get(`/student/records/${record.id}/pdf`)
    .set('Cookie', cookieFor(student));
  assert.equal(pdf.status, 200);
  assert.match(pdf.headers['content-type'], /application\/pdf/);
});

test('clinician pages render with representative data', async () => {
  await expectPage('/clinician/dashboard', clinician);
  await expectPage('/clinician/slots', clinician);
  await expectPage('/clinician/appointments', clinician);
  await expectPage('/clinician/records', clinician);
  await expectPage('/clinician/records/new', clinician);
  const recordPage = await expectPage(`/clinician/records/${record.id}`, clinician);
  assert.match(recordPage.text, /Tension headache/);
  await expectPage('/clinician/medicines', clinician);
  await expectPage('/clinician/reminders', clinician);

  const pdf = await request(app)
    .get(`/clinician/records/${record.id}/pdf`)
    .set('Cookie', cookieFor(clinician));
  assert.equal(pdf.status, 200);
  assert.match(pdf.headers['content-type'], /application\/pdf/);
});

test('admin pages render with representative data', async () => {
  await expectPage('/admin/dashboard', admin);
  await expectPage('/admin/users', admin);
  await expectPage('/admin/audit-logs', admin);
  await expectPage('/admin/records', admin);
  await expectPage(`/admin/records/${record.id}`, admin);
  await expectPage('/admin/medicines', admin);
  await expectPage('/admin/reports', admin);
});

test('role guards redirect guests and reject cross-role access', async () => {
  const guest = await request(app).get('/student/dashboard');
  assert.equal(guest.status, 302);
  assert.equal(guest.headers.location, '/login');

  const forbidden = await request(app).get('/admin/dashboard').set('Cookie', cookieFor(student));
  assert.equal(forbidden.status, 403);
});

test('authenticated users can open the health assistant tab', async () => {
  for (const user of [student, clinician, admin]) {
    const res = await expectPage('/assistant', user);
    assert.match(res.text, /data-chat/);
    assert.match(res.text, /data-chat-user=/);
    assert.match(res.text, /data-chat-send/);
    assert.match(res.text, /class="portal-sidebar"/);
  }
});

test('authenticated pages use the sidebar portal layout without header or footer', async () => {
  const res = await request(app).get('/student/dashboard').set('Cookie', cookieFor(student));
  assert.equal(res.status, 200);
  assert.match(res.text, /class="portal-sidebar"/);
  assert.match(res.text, /href="\/student\/appointments"/);
  assert.match(res.text, /href="\/assistant"/);
  assert.doesNotMatch(res.text, /class="site-header"/);
  assert.doesNotMatch(res.text, /class="site-footer"/);
});
