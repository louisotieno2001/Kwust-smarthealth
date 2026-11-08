const { env } = require('../config/env');
const { FLASH_COOKIE } = require('../lib/auth');

function encodeFlash(flash) {
  return Buffer.from(JSON.stringify(flash), 'utf8').toString('base64url');
}

function decodeFlash(value) {
  try {
    return JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

function setFlash(res, type, message) {
  res.cookie(FLASH_COOKIE, encodeFlash({ type, message }), {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.isProduction,
    path: '/',
    maxAge: 60_000,
  });
}

function loadFlash(req, res, next) {
  const raw = req.cookies?.[FLASH_COOKIE];
  if (raw) {
    res.locals.flash = decodeFlash(raw);
    res.clearCookie(FLASH_COOKIE, {
      httpOnly: true,
      sameSite: 'lax',
      secure: env.isProduction,
      path: '/',
    });
  }
  next();
}

module.exports = { setFlash, loadFlash };
