const rateLimit = require('express-rate-limit');
const { setFlash } = require('./flash');

function htmlLimiterRedirect(req, res) {
  setFlash(res, 'error', 'Too many attempts. Please wait a few minutes and try again.');
  const fallback = req.path.startsWith('/api/') ? '/login' : '/login';
  return res.status(429).redirect(req.get('referer') || fallback);
}

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 12,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    if (req.path.startsWith('/api/')) {
      return res.status(429).json({ error: 'Too many attempts. Please try again later.' });
    }
    return htmlLimiterRedirect(req, res);
  },
});

const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    if (req.path.startsWith('/api/')) {
      return res.status(429).json({ error: 'Too many attempts. Please try again later.' });
    }
    return htmlLimiterRedirect(req, res);
  },
});

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 15,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (req, res) => res.status(429).json({
    error: 'You are sending messages too quickly. Please wait a moment.',
  }),
});

module.exports = { loginLimiter, signupLimiter, chatLimiter };
