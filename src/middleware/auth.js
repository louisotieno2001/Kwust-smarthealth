const directus = require('../lib/directus');
const {
  AUTH_COOKIE,
  verifyAuthToken,
  clearAuthCookie,
  publicUser,
  isAccountVerified,
} = require('../lib/auth');

async function loadUser(req, res, next) {
  const token = req.cookies?.[AUTH_COOKIE];
  if (!token) return next();

  const payload = verifyAuthToken(token);
  if (!payload?.sub) {
    clearAuthCookie(res);
    return next();
  }

  try {
    const user = await directus.get('users', payload.sub);
    if (!user || user.status !== 'active' || !isAccountVerified(user)) {
      clearAuthCookie(res);
      return next();
    }
    req.user = publicUser(user);
    res.locals.user = req.user;
  } catch (error) {
    console.error('Unable to load authenticated user:', error.message);
    clearAuthCookie(res);
  }

  return next();
}

function redirectByRole(res, user) {
  if (!user) return res.redirect('/login');
  if (user.role === 'student') return res.redirect('/student/dashboard');
  if (user.role === 'clinician') return res.redirect('/clinician/dashboard');
  if (user.role === 'admin') return res.redirect('/admin/dashboard');
  return res.redirect('/');
}

function requireAuth(req, res, next) {
  if (req.user) return next();
  if (req.path.startsWith('/api/')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  return res.redirect('/login');
}

function requireRole(...roles) {
  return function roleGuard(req, res, next) {
    if (!req.user) {
      if (req.path.startsWith('/api/')) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      return res.redirect('/login');
    }

    if (!roles.includes(req.user.role)) {
      if (req.path.startsWith('/api/')) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      return res.status(403).render('errors/403', {
        title: 'Forbidden',
        message: 'You do not have permission to access this page.',
      });
    }

    return next();
  };
}

function guestOnly(req, res, next) {
  if (req.user) return redirectByRole(res, req.user);
  return next();
}

function requireVerified(req, res, next) {
  if (req.user?.status === 'active') return next();
  if (req.path.startsWith('/api/')) {
    return res.status(403).json({ error: 'Account is not active' });
  }
  return res.status(403).render('errors/403', {
    title: 'Account not active',
    message: 'Your account is awaiting approval or has been suspended.',
  });
}

module.exports = {
  loadUser,
  requireAuth,
  requireRole,
  requireVerified,
  guestOnly,
  redirectByRole,
};
