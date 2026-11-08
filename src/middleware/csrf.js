const { env } = require('../config/env');
const { AppError } = require('../lib/errors');
const { CSRF_COOKIE, randomToken, safeEqual } = require('../lib/auth');

function csrfProtection(req, res, next) {
  let token = req.cookies?.[CSRF_COOKIE];
  if (!token) {
    token = randomToken(32);
    res.cookie(CSRF_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: env.isProduction,
      path: '/',
    });
  }
  res.locals.csrfToken = token;
  next();
}

function verifyCsrf(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();

  const submitted = req.body?._csrf || req.get('x-csrf-token');
  const expected = req.cookies?.[CSRF_COOKIE];

  if (!submitted || !expected || !safeEqual(submitted, expected)) {
    if (req.path.startsWith('/api/')) {
      return res.status(403).json({ error: 'Invalid CSRF token' });
    }
    return next(new AppError('Invalid or expired form token. Please refresh and try again.', 403));
  }

  return next();
}

module.exports = { csrfProtection, verifyCsrf };
