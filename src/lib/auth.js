const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { env } = require('../config/env');

const AUTH_COOKIE = 'kwust_auth';
const CSRF_COOKIE = 'kwust_csrf';
const FLASH_COOKIE = 'kwust_flash';
const AUTH_MAX_AGE = 8 * 60 * 60 * 1000;

function hashPassword(password) {
  return bcrypt.hash(password, env.auth.bcryptRounds);
}

function verifyPassword(password, hash) {
  if (!hash) return false;
  return bcrypt.compare(password, hash);
}

function signAuthToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role, status: user.status },
    env.auth.jwtSecret,
    { expiresIn: '8h' },
  );
}

function verifyAuthToken(token) {
  try {
    return jwt.verify(token, env.auth.jwtSecret);
  } catch {
    return null;
  }
}

function cookieOptions(maxAge) {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.isProduction,
    path: '/',
    maxAge,
  };
}

function setAuthCookie(res, token) {
  res.cookie(AUTH_COOKIE, token, cookieOptions(AUTH_MAX_AGE));
}

function clearAuthCookie(res) {
  res.clearCookie(AUTH_COOKIE, cookieOptions(undefined));
}

function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

function safeEqual(a, b) {
  if (!a || !b) return false;
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

function requiresStaffVerification(user) {
  return Boolean(user && (user.role === 'clinician' || user.role === 'admin'));
}

function isAccountVerified(user) {
  if (!user) return false;
  if (!requiresStaffVerification(user)) return true;
  return user.is_verified === true || Boolean(user.verified_at || user.verified_by);
}

function publicUser(user) {
  if (!user) return null;
  const { password_hash, ...safe } = user;
  return safe;
}

module.exports = {
  AUTH_COOKIE,
  CSRF_COOKIE,
  FLASH_COOKIE,
  AUTH_MAX_AGE,
  hashPassword,
  verifyPassword,
  signAuthToken,
  verifyAuthToken,
  cookieOptions,
  setAuthCookie,
  clearAuthCookie,
  randomToken,
  safeEqual,
  requiresStaffVerification,
  isAccountVerified,
  publicUser,
};
