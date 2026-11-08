const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const directus = require('../src/lib/directus');
const { signAuthToken } = require('../src/lib/auth');
const app = require('../src/app');

const student = { id: 1, full_name: 'Amina Hassan', role: 'student', status: 'active', admission_number: 'BBIT/45/26' };
const clinician = { id: 2, full_name: 'Dr. Wanjiku Kamau', role: 'clinician', status: 'active', is_verified: true, staff_title: 'Doctor' };
const admin = { id: 3, full_name: 'System Administrator', role: 'admin', status: 'active', is_verified: true };
const csrf = 'test-csrf-token';

const slot = {
  id: 10,
  clinician_id: { id: clinician.id, full_name: clinician.full_name, staff_title: 'Doctor' },
  date: '2099-01-10',
  start_time: '09:00:00',
  end_time: '10:00:00',
  capacity: 5,
  status: 'open',
  location: 'University Health Center',
};

const medicine = {
  id: 30,
  name: 'Paracetamol 500mg',
  category: 'Analgesic',
  quantity: 10,
  unit: 'tablets',
  reorder_level: 5,
  expiry_date: '2099-12-31',
  status: 'available',
};

function agentAs(user) {
  return `kwust_auth=${signAuthToken(user)}; kwust_csrf=${csrf}`;
}

function postAs(appPath, user) {
  return request(app)
    .post(appPath)
    .set('Cookie', agentAs(user))
    .type('form')
    .send({ _csrf: csrf });
}

test.beforeEach(() => {
  directus.get = async (collection, id) => {
    if (collection === 'users') return [student, clinician, admin].find((user) => String(user.id) === String(id)) || null;
    if (collection === 'appointment_slots') return { ...slot, id };
    if (collection === 'medicines') return { ...medicine, id };
    return null;
  };
  directus.list = async () => [];
  directus.first = async () => null;
  directus.count = async () => 0;
  directus.create = async (collection, data) => ({ id: 100, ...data });
  directus.createMany = async (collection, data) => data;
  directus.update = async (collection, id, data) => ({ id, ...data });
  directus.remove = async () => null;
});

test('student books an open future appointment slot', async () => {
  let created = null;
  directus.create = async (collection, data) => {
    if (collection === 'appointments') created = data;
    return { id: 20, ...data };
  };

  const res = await postAs('/student/appointments', student).send({
    _csrf: csrf,
    slot_id: String(slot.id),
    reason: 'Persistent headache',
  });

  assert.equal(res.status, 302);
  assert.equal(res.headers.location, '/student/appointments');
  assert.ok(created);
  assert.equal(created.student_id, student.id);
  assert.equal(created.clinician_id, clinician.id);
  assert.equal(created.status, 'booked');
});

test('student cannot cancel another student’s appointment', async () => {
  let updates = 0;
  directus.get = async (collection, id) => {
    if (collection === 'users') return student;
    if (collection === 'appointments') return { id, status: 'booked', student_id: { id: 99 } };
    return null;
  };
  directus.update = async (collection, id, data) => {
    updates += 1;
    return { id, ...data };
  };

  const res = await postAs('/student/appointments/20/cancel', student);
  assert.equal(res.status, 302);
  assert.equal(updates, 0);
});

test('clinician creates a record and decrements prescription stock', async () => {
  let createdRecord = null;
  let createdPrescriptions = null;
  let medicineUpdate = null;
  const record = {
    id: 40,
    student_id: { id: student.id, full_name: student.full_name, admission_number: student.admission_number },
    clinician_id: { id: clinician.id, full_name: clinician.full_name, staff_title: clinician.staff_title },
    appointment_id: null,
    visit_date: '2026-11-01',
    chief_complaint: 'Headache',
    symptoms: 'Head pain',
    diagnosis: 'Tension headache',
    notes: 'Rest',
  };

  directus.get = async (collection, id) => {
    if (collection === 'users') return clinician;
    if (collection === 'medicines') return { ...medicine, id };
    if (collection === 'medical_records') return record;
    return null;
  };
  directus.create = async (collection, data) => {
    if (collection === 'medical_records') createdRecord = data;
    return { id: collection === 'medical_records' ? record.id : 111, ...data };
  };
  directus.createMany = async (collection, data) => {
    if (collection === 'prescriptions') createdPrescriptions = data;
    return data;
  };
  directus.update = async (collection, id, data) => {
    if (collection === 'medicines') medicineUpdate = data;
    return { id, ...data };
  };
  directus.list = async (collection) => {
    if (collection === 'prescriptions') {
      return [{
        id: 50,
        record_id: record.id,
        medicine_id: { id: medicine.id, name: medicine.name, category: medicine.category, unit: medicine.unit },
        dosage: '1 tablet',
        frequency: 'Twice daily',
        duration: '3 days',
        quantity: 2,
        instructions: '',
      }];
    }
    return [];
  };

  const res = await postAs('/clinician/records', clinician).send({
    _csrf: csrf,
    student_id: String(student.id),
    visit_date: '2026-11-01',
    chief_complaint: 'Headache',
    symptoms: 'Head pain',
    diagnosis: 'Tension headache',
    notes: 'Rest',
    medicine_id: String(medicine.id),
    quantity: '2',
    dosage: '1 tablet',
    frequency: 'Twice daily',
    duration: '3 days',
    instructions: 'After meals',
  });

  assert.equal(res.status, 302);
  assert.equal(res.headers.location, '/clinician/records/40');
  assert.equal(createdRecord.student_id, String(student.id));
  assert.equal(createdRecord.diagnosis, 'Tension headache');
  assert.equal(createdPrescriptions.length, 1);
  assert.equal(createdPrescriptions[0].quantity, 2);
  assert.equal(medicineUpdate.quantity, 8);
});

test('admin verifies a pending clinician account', async () => {
  let update = null;
  directus.get = async (collection, id) => {
    if (collection === 'users') {
      if (String(id) === String(admin.id)) return admin;
      return { id: 5, full_name: 'Pending Clinician', role: 'clinician', status: 'pending' };
    }
    return null;
  };
  directus.update = async (collection, id, data) => {
    update = data;
    return { id, full_name: 'Pending Clinician', role: 'clinician', ...data };
  };

  const res = await postAs('/admin/users/5/verify', admin);
  assert.equal(res.status, 302);
  assert.equal(update.status, 'active');
  assert.equal(update.is_verified, true);
  assert.equal(update.verified_by, admin.id);
  assert.ok(update.verified_at);
});

test('clinician updates medicine stock', async () => {
  let update = null;
  directus.get = async (collection, id) => {
    if (collection === 'users') return clinician;
    if (collection === 'medicines') return { ...medicine, id, quantity: 3 };
    return null;
  };
  directus.update = async (collection, id, data) => {
    if (collection === 'medicines') update = data;
    return { id, ...data };
  };

  const res = await postAs('/clinician/medicines/30/stock', clinician).send({ _csrf: csrf, quantity: '8' });
  assert.equal(res.status, 302);
  assert.equal(update.quantity, 8);
});
