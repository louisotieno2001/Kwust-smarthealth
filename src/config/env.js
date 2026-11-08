const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

function integer(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';

const env = {
  nodeEnv,
  isProduction,
  port: integer(process.env.PORT || process.env.SERVER_PORT, 5000),
  appUrl: process.env.APP_URL || 'http://localhost:5000',

  db: {
    host: process.env.DB_HOST || 'localhost',
    port: integer(process.env.DB_PORT, 5432),
    database: process.env.DB_DATABASE || process.env.DB_NAME || 'KWUST_SmartHealth',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  },

  directus: {
    url: (process.env.DIRECTUS_URL || 'http://localhost:8055').replace(/\/+$/, ''),
    publicUrl: (process.env.DIRECTUS_PUBLIC_URL || 'http://localhost:8055').replace(/\/+$/, ''),
    token: process.env.DIRECTUS_TOKEN || '',
    adminEmail: process.env.DIRECTUS_ADMIN_EMAIL || '',
    adminPassword: process.env.DIRECTUS_ADMIN_PASSWORD || '',
  },

  auth: {
    jwtSecret: process.env.JWT_SECRET || 'development-only-jwt-secret-change-me',
    sessionSecret: process.env.SESSION_SECRET || 'development-only-session-secret-change-me',
    adminSignupCode: process.env.ADMIN_SIGNUP_CODE || '',
    bcryptRounds: integer(process.env.BCRYPT_ROUNDS, 12),
  },

  ai: {
    order: (process.env.AI_PROVIDER_ORDER || 'gemini,openai,anthropic')
      .split(',')
      .map((name) => name.trim().toLowerCase())
      .filter(Boolean),
    timeoutMs: integer(process.env.AI_TIMEOUT_MS, 15000),
    maxTokens: integer(process.env.AI_MAX_TOKENS, 1024),
  },

  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
  },

  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    baseUrl: (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, ''),
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  },

  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY || '',
    baseUrl: (process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com').replace(/\/+$/, ''),
    model: process.env.ANTHROPIC_MODEL || 'claude-3-5-haiku-latest',
    version: process.env.ANTHROPIC_VERSION || '2023-06-01',
  },
};

if (isProduction) {
  const missing = [];
  if (!process.env.JWT_SECRET) missing.push('JWT_SECRET');
  if (!process.env.SESSION_SECRET) missing.push('SESSION_SECRET');
  if (!process.env.DIRECTUS_TOKEN && !(process.env.DIRECTUS_ADMIN_EMAIL && process.env.DIRECTUS_ADMIN_PASSWORD)) {
    missing.push('DIRECTUS_TOKEN or DIRECTUS_ADMIN_EMAIL/DIRECTUS_ADMIN_PASSWORD');
  }
  if (missing.length) {
    throw new Error(`Missing required production environment variables: ${missing.join(', ')}`);
  }
}

module.exports = { env };
