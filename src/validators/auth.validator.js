const { AppError } = require('../lib/errors');
const { isValidAdmission } = require('../lib/admission');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function requirePassword(password, confirmPassword) {
  if (!password || password.length < 8) {
    throw new AppError('Password must be at least 8 characters long.', 400);
  }
  if (password !== confirmPassword) {
    throw new AppError('Passwords do not match.', 400);
  }
}

function validateStudentSignup(body) {
  if (!isValidAdmission(body.admission_number)) {
    throw new AppError('Enter a valid admission number, for example BBIT/45/26.', 400);
  }
  if (body.email && !EMAIL_RE.test(String(body.email).trim())) {
    throw new AppError('Enter a valid email address or leave the email field blank.', 400);
  }
  requirePassword(body.password, body.confirm_password);
}

function validateClinicianSignup(body) {
  if (!body.email || !EMAIL_RE.test(String(body.email).trim())) {
    throw new AppError('A valid email address is required.', 400);
  }
  requirePassword(body.password, body.confirm_password);
}

function validateAdminSignup(body) {
  if (!body.email || !EMAIL_RE.test(String(body.email).trim())) {
    throw new AppError('A valid email address is required.', 400);
  }
  if (!body.invite_code) {
    throw new AppError('Administrator invite code is required.', 400);
  }
  requirePassword(body.password, body.confirm_password);
}

function validateLogin(body) {
  if (!body.identifier || !String(body.identifier).trim()) {
    throw new AppError('Enter your admission number or email address.', 400);
  }
  if (!body.password) {
    throw new AppError('Enter your password.', 400);
  }
}

module.exports = {
  EMAIL_RE,
  validateStudentSignup,
  validateClinicianSignup,
  validateAdminSignup,
  validateLogin,
};
