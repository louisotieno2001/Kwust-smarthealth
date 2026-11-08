const express = require('express');
const { asyncHandler } = require('../lib/errors');
const { guestOnly, redirectByRole, requireAuth } = require('../middleware/auth');
const { setFlash } = require('../middleware/flash');
const { loginLimiter, signupLimiter } = require('../middleware/rateLimit');
const { validateStudentSignup, validateClinicianSignup, validateAdminSignup, validateLogin } = require('../validators/auth.validator');
const authService = require('../services/auth.service');
const { logAudit } = require('../lib/audit');
const { signAuthToken, setAuthCookie, clearAuthCookie } = require('../lib/auth');
const { back } = require('../lib/http');

const router = express.Router();

router.get('/', (req, res) => {
  res.render('index', { title: 'KWUST SmartHealth' });
});

router.get('/login', guestOnly, (req, res) => {
  res.render('auth/login', { title: 'Log in' });
});

router.get('/signup', guestOnly, (req, res) => {
  const role = ['student', 'clinician', 'admin'].includes(req.query.role) ? req.query.role : 'student';
  res.render('auth/signup', { title: 'Create an account', role });
});

router.get('/auth/pending', (req, res) => {
  res.render('auth/pending', { title: 'Account pending approval' });
});

router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'KWUST SmartHealth', timestamp: new Date().toISOString() });
});

router.get('/assistant', requireAuth, (req, res) => {
  res.render('assistant', { title: 'Health assistant' });
});

router.post('/auth/signup/student', signupLimiter, asyncHandler(async (req, res) => {
  try {
    validateStudentSignup(req.body);
    const user = await authService.registerStudent({
      fullName: req.body.full_name,
      admissionNumber: req.body.admission_number,
      email: req.body.email,
      phone: req.body.phone,
      password: req.body.password,
    });
    req.user = user;
    await logAudit(req, { action: 'user.signup', entity: 'user', entityId: user.id, metadata: { role: 'student' } });
    setFlash(res, 'success', 'Student account created. You can now log in with your admission number.');
    return res.redirect('/login');
  } catch (error) {
    setFlash(res, 'error', error.message);
    return back(req, res, '/signup?role=student');
  }
}));

router.post('/auth/signup/clinician', signupLimiter, asyncHandler(async (req, res) => {
  try {
    validateClinicianSignup(req.body);
    const user = await authService.registerClinician({
      fullName: req.body.full_name,
      email: req.body.email,
      phone: req.body.phone,
      staffTitle: req.body.staff_title,
      staffNumber: req.body.staff_number,
      password: req.body.password,
    });
    req.user = user;
    await logAudit(req, { action: 'user.signup', entity: 'user', entityId: user.id, metadata: { role: 'clinician' } });
    return res.redirect('/auth/pending');
  } catch (error) {
    setFlash(res, 'error', error.message);
    return back(req, res, '/signup?role=clinician');
  }
}));

router.post('/auth/signup/admin', signupLimiter, asyncHandler(async (req, res) => {
  try {
    validateAdminSignup(req.body);
    const user = await authService.registerAdmin({
      fullName: req.body.full_name,
      email: req.body.email,
      inviteCode: req.body.invite_code,
      password: req.body.password,
    });
    req.user = user;
    await logAudit(req, { action: 'user.signup', entity: 'user', entityId: user.id, metadata: { role: 'admin' } });
    return res.redirect('/auth/pending');
  } catch (error) {
    setFlash(res, 'error', error.message);
    return back(req, res, '/signup?role=admin');
  }
}));

router.post('/auth/login', loginLimiter, asyncHandler(async (req, res) => {
  try {
    validateLogin(req.body);
    const user = await authService.login({
      identifier: req.body.identifier,
      password: req.body.password,
    });
    const token = signAuthToken(user);
    setAuthCookie(res, token);
    req.user = user;
    await logAudit(req, { action: 'user.login', entity: 'user', entityId: user.id, metadata: { role: user.role } });
    setFlash(res, 'success', `Welcome back, ${user.full_name}.`);
    return redirectByRole(res, user);
  } catch (error) {
    setFlash(res, 'error', error.message);
    return back(req, res, '/login');
  }
}));

router.post('/auth/logout', asyncHandler(async (req, res) => {
  if (req.user) {
    await logAudit(req, { action: 'user.logout', entity: 'user', entityId: req.user.id });
  }
  clearAuthCookie(res);
  setFlash(res, 'success', 'You have been logged out.');
  return res.redirect('/login');
}));

module.exports = router;
