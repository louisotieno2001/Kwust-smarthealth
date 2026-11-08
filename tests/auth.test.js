const test = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const request = require('supertest');
const directus = require('../src/lib/directus');
const app = require('../src/app');

function csrfFrom(html) {
  const match = html.match(/name="_csrf" value="([^"]+)"/);
  assert.ok(match, 'CSRF token should be present');
  return match[1];
}

function studentUser(overrides = {}) {
  return {
    id: 'student-1',
    full_name: 'Amina Hassan',
    email: 'amina@student.kwust.ac.ke',
    password_hash: bcrypt.hashSync('Student@12345', 4),
    role: 'student',
    status: 'active',
    is_verified: false,
    admission_number: 'BBIT/45/26',
    admission_number_canonical: 'BBIT/45/2026',
    ...overrides,
  };
}

function clinicianUser(overrides = {}) {
  return {
    id: 'clinician-1',
    full_name: 'Dr. Wanjiku Kamau',
    email: 'wanjiku@kwust.ac.ke',
    password_hash: bcrypt.hashSync('Clinician@12345', 4),
    role: 'clinician',
    status: 'active',
    is_verified: true,
    staff_title: 'Doctor',
    ...overrides,
  };
}

test.beforeEach(() => {
  directus.create = async (collection, data) => ({ id: `${collection}-1`, ...data });
  directus.update = async (collection, id, data) => ({ id, ...data });
  directus.first = async () => null;
});

test('student logs in with an admission number variation', async () => {
  const agent = request.agent(app);
  let seenFilter = null;
  directus.first = async (collection, params) => {
    seenFilter = params.filter;
    return studentUser();
  };

  const page = await agent.get('/login');
  const token = csrfFrom(page.text);
  const res = await agent.post('/auth/login').type('form').send({
    _csrf: token,
    identifier: 'bbit-045-2026',
    password: 'Student@12345',
  });

  assert.equal(res.status, 302);
  assert.equal(res.headers.location, '/student/dashboard');
  assert.equal(seenFilter.admission_number_canonical._eq, 'BBIT/45/2026');
});

test('clinician signs up without an admission number', async () => {
  const agent = request.agent(app);
  const page = await agent.get('/signup?role=clinician');
  const token = csrfFrom(page.text);

  let createdUser = null;
  directus.create = async (collection, data) => {
    if (collection === 'users') createdUser = data;
    return { id: `${collection}-1`, ...data };
  };

  const res = await agent.post('/auth/signup/clinician').type('form').send({
    _csrf: token,
    full_name: 'Nurse Test',
    email: 'nurse.test@kwust.ac.ke',
    staff_title: 'Nurse',
    password: 'Password@123',
    confirm_password: 'Password@123',
  });

  assert.equal(res.status, 302);
  assert.equal(res.headers.location, '/auth/pending');
  assert.ok(createdUser);
  assert.equal(createdUser.admission_number, null);
  assert.equal(createdUser.role, 'clinician');
  assert.equal(createdUser.status, 'pending');
});

test('student signs up with a valid admission number', async () => {
  const agent = request.agent(app);
  const page = await agent.get('/signup?role=student');
  const token = csrfFrom(page.text);

  let createdUser = null;
  directus.create = async (collection, data) => {
    if (collection === 'users') createdUser = data;
    return { id: `${collection}-1`, ...data };
  };

  const res = await agent.post('/auth/signup/student').type('form').send({
    _csrf: token,
    full_name: 'New Student',
    admission_number: 'BBIT/045/2026',
    email: 'new.student@kwust.ac.ke',
    password: 'Password@123',
    confirm_password: 'Password@123',
  });

  assert.equal(res.status, 302);
  assert.equal(res.headers.location, '/login');
  assert.equal(createdUser.role, 'student');
  assert.equal(createdUser.admission_number_canonical, 'BBIT/45/2026');
});

test('student signup rejects an invalid admission number', async () => {
  const agent = request.agent(app);
  const page = await agent.get('/signup?role=student');
  const token = csrfFrom(page.text);

  let created = false;
  directus.create = async (collection, data) => {
    if (collection === 'users') created = true;
    return { id: `${collection}-1`, ...data };
  };

  const res = await agent.post('/auth/signup/student').type('form').send({
    _csrf: token,
    full_name: 'Bad Admission',
    admission_number: '45/26',
    password: 'Password@123',
    confirm_password: 'Password@123',
  });

  assert.equal(res.status, 302);
  assert.equal(created, false);

  const followUp = await agent.get('/signup?role=student');
  assert.match(followUp.text, /valid admission number/i);
});

test('administrator signup requires the invite code', async () => {
  process.env.ADMIN_SIGNUP_CODE = 'TEST-ADMIN-CODE';
  const agent = request.agent(app);
  const page = await agent.get('/signup?role=admin');
  const token = csrfFrom(page.text);

  const bad = await agent.post('/auth/signup/admin').type('form').send({
    _csrf: token,
    full_name: 'Bad Admin',
    email: 'bad.admin@kwust.ac.ke',
    invite_code: 'wrong',
    password: 'Password@123',
    confirm_password: 'Password@123',
  });
  assert.equal(bad.status, 302);
  assert.equal(bad.headers.location, '/signup?role=admin');
});

test('suspended users cannot log in', async () => {
  const agent = request.agent(app);
  directus.first = async () => clinicianUser({ status: 'suspended' });
  const page = await agent.get('/login');
  const token = csrfFrom(page.text);
  const res = await agent.post('/auth/login').type('form').send({
    _csrf: token,
    identifier: 'wanjiku@kwust.ac.ke',
    password: 'Clinician@12345',
  });

  assert.equal(res.status, 302);
  assert.equal(res.headers.location, '/login');
  const followUp = await agent.get('/login');
  assert.match(followUp.text, /suspended/i);
});

test('unverified staff cannot log in even with an active account', async () => {
  const agent = request.agent(app);
  directus.first = async () => clinicianUser({ is_verified: false });

  const page = await agent.get('/login');
  const token = csrfFrom(page.text);
  const res = await agent.post('/auth/login').type('form').send({
    _csrf: token,
    identifier: 'wanjiku@kwust.ac.ke',
    password: 'Clinician@12345',
  });

  assert.equal(res.status, 302);
  assert.equal(res.headers.location, '/login');
  const followUp = await agent.get('/login');
  assert.match(followUp.text, /awaiting verification/i);
});
