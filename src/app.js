const fs = require('fs');
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const methodOverride = require('method-override');

const { env } = require('./config/env');
const { loadUser } = require('./middleware/auth');
const { loadFlash } = require('./middleware/flash');
const { csrfProtection, verifyCsrf } = require('./middleware/csrf');
const { notFound, errorHandler } = require('./lib/errors');
const { formatDate, formatDateTime } = require('./services/pdf.service');

const indexRoutes = require('./routes/index');
const studentRoutes = require('./routes/student');
const clinicianRoutes = require('./routes/clinician');
const adminRoutes = require('./routes/admin');
const apiRoutes = require('./routes/api');

const app = express();
const publicDir = path.join(__dirname, '..', 'public');
const assetCache = new Map();

function assetUrl(relativePath) {
  const cleanPath = String(relativePath || '').replace(/^\/+/, '');
  if (!assetCache.has(cleanPath)) {
    let version = '';
    try {
      version = Math.floor(fs.statSync(path.join(publicDir, cleanPath)).mtimeMs).toString(36);
    } catch (error) {
      version = '';
    }
    assetCache.set(cleanPath, `/${cleanPath}${version ? `?v=${version}` : ''}`);
  }
  return assetCache.get(cleanPath);
}

app.disable('x-powered-by');
if (env.isProduction) app.set('trust proxy', 1);

const cspDirectives = {
  defaultSrc: ["'self'"],
  imgSrc: ["'self'", 'data:'],
  styleSrc: ["'self'"],
  scriptSrc: ["'self'"],
  connectSrc: ["'self'"],
  fontSrc: ["'self'"],
  objectSrc: ["'none'"],
  baseUri: ["'self'"],
  formAction: ["'self'"],
  frameAncestors: ["'none'"],
};
if (!env.isProduction) cspDirectives.upgradeInsecureRequests = null;

app.use(helmet({
  contentSecurityPolicy: { directives: cspDirectives },
  crossOriginEmbedderPolicy: false,
}));
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false, limit: '100kb' }));
app.use(cookieParser(env.auth.sessionSecret));
app.use(methodOverride('_method'));
app.use(express.static(publicDir, { maxAge: env.isProduction ? '7d' : 0 }));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));

app.locals.appName = 'KWUST SmartHealth';
app.locals.asset = assetUrl;
app.locals.formatDate = formatDate;
app.locals.formatDateTime = formatDateTime;
app.locals.formatTime = (value) => (value ? String(value).slice(0, 5) : '—');
app.locals.roleLabel = (role) => ({
  student: 'Student',
  clinician: 'Clinician',
  admin: 'Administrator',
}[role] || role || 'User');
app.locals.statusLabel = (status) => ({
  active: 'Active',
  pending: 'Pending',
  suspended: 'Suspended',
  rejected: 'Rejected',
  booked: 'Booked',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No show',
  open: 'Open',
  closed: 'Closed',
  available: 'Available',
  low_stock: 'Low stock',
  out_of_stock: 'Out of stock',
  expired: 'Expired',
}[status] || status || '—');
app.locals.statusClass = (status) => ({
  active: 'success',
  available: 'success',
  open: 'success',
  completed: 'success',
  pending: 'warning',
  booked: 'info',
  low_stock: 'warning',
  suspended: 'danger',
  rejected: 'danger',
  cancelled: 'danger',
  no_show: 'danger',
  out_of_stock: 'danger',
  expired: 'danger',
  closed: 'muted',
}[status] || 'muted');
app.locals.initials = (name) => String(name || '?')
  .split(/\s+/)
  .filter(Boolean)
  .slice(0, 2)
  .map((part) => part[0].toUpperCase())
  .join('');

app.use((req, res, next) => {
  res.locals.currentPath = req.path;
  res.locals.user = null;
  res.locals.flash = null;
  next();
});

app.use(loadUser);
app.use(loadFlash);
app.use(csrfProtection);
app.use(verifyCsrf);

app.use('/', indexRoutes);
app.use('/student', studentRoutes);
app.use('/clinician', clinicianRoutes);
app.use('/admin', adminRoutes);
app.use('/api', apiRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
