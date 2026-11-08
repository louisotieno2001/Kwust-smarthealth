const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');
const geminiService = require('../src/services/gemini.service');

function csrfFrom(html) {
  const match = html.match(/name="csrf-token" content="([^"]+)"/);
  return match ? match[1] : '';
}

test('renders the public landing page', async () => {
  const res = await request(app).get('/');
  assert.equal(res.status, 200);
  assert.match(res.text, /KWUST SmartHealth/);
  assert.match(res.text, /Create an account/);
});

test('renders login and signup pages', async () => {
  const login = await request(app).get('/login');
  assert.equal(login.status, 200);
  assert.match(login.text, /Admission number or email/);
  assert.match(login.text, /name="_csrf"/);

  const studentSignup = await request(app).get('/signup?role=student');
  assert.equal(studentSignup.status, 200);
  assert.match(studentSignup.text, /Admission number/);

  const clinicianSignup = await request(app).get('/signup?role=clinician');
  assert.equal(clinicianSignup.status, 200);
  assert.match(clinicianSignup.text, /No admission number needed/);

  const adminSignup = await request(app).get('/signup?role=admin');
  assert.equal(adminSignup.status, 200);
  assert.match(adminSignup.text, /Administrator invite code/);
});

test('returns a custom 404 page', async () => {
  const res = await request(app).get('/does-not-exist');
  assert.equal(res.status, 404);
  assert.match(res.text, /Page not found/);
});

test('rejects POST requests without a CSRF token', async () => {
  const res = await request(app)
    .post('/auth/signup/clinician')
    .type('form')
    .send({ full_name: 'No Token', email: 'no-token@kwust.ac.ke', password: 'Password@123', confirm_password: 'Password@123' });
  assert.equal(res.status, 403);
});

test('guests can use the health assistant API and password toggles are present', async () => {
  const originalAskHealth = geminiService.askHealth;
  geminiService.askHealth = async () => ({ reply: 'Test health reply.', offline: true });

  try {
    const agent = request.agent(app);
    const home = await agent.get('/');
    assert.doesNotMatch(home.text, /chat-widget/);
    assert.match(home.text, /class="header-actions"/);

    const login = await agent.get('/login');
    assert.match(login.text, /data-password-toggle="password"/);
    assert.match(login.text, />Show</);

    const signup = await agent.get('/signup?role=student');
    assert.match(signup.text, /data-password-toggle="student-password"/);
    assert.match(signup.text, /data-password-toggle="student-confirm"/);

    const token = csrfFrom(home.text);
    assert.ok(token);
    const chat = await agent
      .post('/api/chat')
      .set('x-csrf-token', token)
      .send({ message: 'How can I stay hydrated?' });

    assert.equal(chat.status, 200);
    assert.equal(chat.body.reply, 'Test health reply.');
  } finally {
    geminiService.askHealth = originalAskHealth;
  }
});
