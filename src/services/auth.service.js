const directus = require('../lib/directus');
const { AppError } = require('../lib/errors');
const {
  normalizeAdmission,
  isValidAdmission,
  canonicalizeAdmission,
} = require('../lib/admission');
const { hashPassword, verifyPassword, publicUser, isAccountVerified } = require('../lib/auth');

function normalizeEmail(email) {
  return String(email ?? '').trim().toLowerCase();
}

async function findUserByIdentifier(identifier) {
  const value = String(identifier ?? '').trim();
  if (!value) return null;

  if (value.includes('@')) {
    return directus.first('users', {
      filter: { email: { _eq: normalizeEmail(value) } },
      fields: '*',
    });
  }

  if (!isValidAdmission(value)) return null;
  const canonical = canonicalizeAdmission(value);
  return directus.first('users', {
    filter: {
      role: { _eq: 'student' },
      admission_number_canonical: { _eq: canonical },
    },
    fields: '*',
  });
}

async function ensureEmailAvailable(email, excludeId = null) {
  const normalized = normalizeEmail(email);
  if (!normalized) return;
  const filter = { email: { _eq: normalized } };
  if (excludeId) filter.id = { _neq: excludeId };
  const existing = await directus.first('users', { filter, fields: 'id' });
  if (existing) throw new AppError('An account with this email already exists.', 409);
}

async function registerStudent({ fullName, admissionNumber, email, phone, password }) {
  if (!fullName || fullName.trim().length < 3) {
    throw new AppError('Please enter your full name.', 400);
  }
  if (!isValidAdmission(admissionNumber)) {
    throw new AppError('Enter a valid admission number, for example BBIT/45/26.', 400);
  }

  const canonical = canonicalizeAdmission(admissionNumber);
  const existing = await directus.first('users', {
    filter: { admission_number_canonical: { _eq: canonical } },
    fields: 'id',
  });
  if (existing) {
    throw new AppError('This admission number is already registered. Please log in instead.', 409);
  }

  const normalizedEmail = normalizeEmail(email);
  if (normalizedEmail) await ensureEmailAvailable(normalizedEmail);

  const passwordHash = await hashPassword(password);
  const user = await directus.create('users', {
    full_name: fullName.trim(),
    email: normalizedEmail || null,
    password_hash: passwordHash,
    role: 'student',
    status: 'active',
    admission_number: normalizeAdmission(admissionNumber),
    admission_number_canonical: canonical,
    phone: phone?.trim() || null,
  });

  return publicUser(user);
}

async function registerClinician({ fullName, email, phone, staffTitle, staffNumber, password }) {
  if (!fullName || fullName.trim().length < 3) {
    throw new AppError('Please enter your full name.', 400);
  }
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || !normalizedEmail.includes('@')) {
    throw new AppError('A valid email address is required for clinician accounts.', 400);
  }
  await ensureEmailAvailable(normalizedEmail);

  const passwordHash = await hashPassword(password);
  const user = await directus.create('users', {
    full_name: fullName.trim(),
    email: normalizedEmail,
    password_hash: passwordHash,
    role: 'clinician',
    status: 'pending',
    admission_number: null,
    admission_number_canonical: null,
    phone: phone?.trim() || null,
    staff_title: staffTitle?.trim() || 'Clinician',
    staff_number: staffNumber?.trim() || null,
  });

  return publicUser(user);
}

async function registerAdmin({ fullName, email, password, inviteCode }) {
  if (!fullName || fullName.trim().length < 3) {
    throw new AppError('Please enter your full name.', 400);
  }
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || !normalizedEmail.includes('@')) {
    throw new AppError('A valid email address is required for administrator accounts.', 400);
  }
  if (!process.env.ADMIN_SIGNUP_CODE) {
    throw new AppError('Administrator signup is not configured.', 403);
  }
  if (inviteCode !== process.env.ADMIN_SIGNUP_CODE) {
    throw new AppError('Invalid administrator invite code.', 403);
  }
  await ensureEmailAvailable(normalizedEmail);

  const passwordHash = await hashPassword(password);
  const user = await directus.create('users', {
    full_name: fullName.trim(),
    email: normalizedEmail,
    password_hash: passwordHash,
    role: 'admin',
    status: 'pending',
    admission_number: null,
    admission_number_canonical: null,
    staff_title: 'Administrator',
  });

  return publicUser(user);
}

async function login({ identifier, password }) {
  const user = await findUserByIdentifier(identifier);
  if (!user) throw new AppError('Invalid login details. Check your admission number or email.', 401);

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) throw new AppError('Invalid login details. Check your password.', 401);

  if (user.status === 'pending') {
    throw new AppError('Your account is awaiting administrator approval.', 403);
  }
  if (user.status === 'suspended') {
    throw new AppError('Your account has been suspended. Contact the administrator.', 403);
  }
  if (user.status === 'rejected') {
    throw new AppError('Your account request was rejected. Contact the administrator.', 403);
  }
  if (user.status !== 'active') {
    throw new AppError('Your account is not active.', 403);
  }
  if (!isAccountVerified(user)) {
    throw new AppError('Your staff account is awaiting verification by an administrator.', 403);
  }

  try {
    await directus.update('users', user.id, { last_login_at: new Date().toISOString() });
  } catch (error) {
    console.error('Unable to update last login:', error.message);
  }

  return publicUser(user);
}

module.exports = {
  normalizeEmail,
  findUserByIdentifier,
  registerStudent,
  registerClinician,
  registerAdmin,
  login,
};
