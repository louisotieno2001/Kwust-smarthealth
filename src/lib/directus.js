const axios = require('axios');
const { env } = require('../config/env');

let cachedToken = env.directus.token || null;
let tokenExpiresAt = env.directus.token ? Number.POSITIVE_INFINITY : 0;
let authPromise = null;

function isTokenUsable() {
  return Boolean(cachedToken) && Date.now() < tokenExpiresAt - 60_000;
}

function normalizeAxiosError(error) {
  if (error.response) {
    const payload = error.response.data;
    const message = payload?.errors?.[0]?.message
      || payload?.error
      || `Directus request failed (${error.response.status})`;
    const wrapped = new Error(message);
    wrapped.status = error.response.status;
    wrapped.payload = payload;
    return wrapped;
  }

  if (['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'ECONNABORTED'].includes(error.code)) {
    const wrapped = new Error('Unable to reach Directus. Confirm the Directus service is running.');
    wrapped.status = 503;
    return wrapped;
  }

  return error;
}

async function authenticate() {
  if (!env.directus.adminEmail || !env.directus.adminPassword) {
    throw new Error('Directus credentials are not configured');
  }

  try {
    const response = await axios(`${env.directus.url}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: {
        email: env.directus.adminEmail,
        password: env.directus.adminPassword,
      },
    });

    const payload = response.data || {};
    cachedToken = payload?.data?.access_token || payload?.access_token;
    if (!cachedToken) {
      throw new Error('Directus authentication did not return an access token');
    }

    const expires = Number(payload?.data?.expires || payload?.expires || 900_000);
    tokenExpiresAt = Date.now() + expires;
    return cachedToken;
  } catch (error) {
    throw normalizeAxiosError(error);
  }
}

async function getToken(force = false) {
  if (!force && isTokenUsable()) return cachedToken;
  if (!authPromise) {
    authPromise = authenticate().finally(() => {
      authPromise = null;
    });
  }
  return authPromise;
}

async function query(path, config = {}, retry = true) {
  const token = await getToken();
  const { headers, ...rest } = config;

  try {
    return await axios(`${env.directus.url}${path}`, {
      timeout: 30_000,
      ...rest,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...(headers || {}),
      },
    });
  } catch (error) {
    if (error.response?.status === 401 && retry) {
      cachedToken = null;
      tokenExpiresAt = 0;
      await getToken(true);
      return query(path, config, false);
    }
    throw normalizeAxiosError(error);
  }
}

function buildQuery(params = {}) {
  const search = new URLSearchParams();
  const jsonKeys = new Set(['filter', 'deep', 'aggregate', 'groupBy', 'alias']);

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    if (key === 'sort' && Array.isArray(value)) {
      search.set(key, value.join(','));
    } else if (jsonKeys.has(key) && typeof value !== 'string') {
      search.set(key, JSON.stringify(value));
    } else {
      search.set(key, String(value));
    }
  }

  const queryString = search.toString();
  return queryString ? `?${queryString}` : '';
}

async function list(collection, params = {}) {
  const response = await query(`/items/${collection}${buildQuery(params)}`);
  return response?.data?.data || [];
}

async function get(collection, id, params = {}) {
  if (id === undefined || id === null || id === '') return null;
  const response = await query(`/items/${collection}/${encodeURIComponent(id)}${buildQuery(params)}`);
  return response?.data?.data || null;
}

async function first(collection, params = {}) {
  const items = await list(collection, { ...params, limit: 1 });
  return items[0] || null;
}

async function create(collection, data) {
  const response = await query(`/items/${collection}`, { method: 'POST', data });
  return response?.data?.data || null;
}

async function createMany(collection, data) {
  if (!data.length) return [];
  const response = await query(`/items/${collection}`, { method: 'POST', data });
  return response?.data?.data || [];
}

async function update(collection, id, data) {
  const response = await query(`/items/${collection}/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    data,
  });
  return response?.data?.data || null;
}

async function remove(collection, id) {
  const response = await query(`/items/${collection}/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  return response?.data?.data || null;
}

async function count(collection, filter = undefined) {
  const params = { 'aggregate[count]': '*', limit: 1 };
  if (filter) params.filter = filter;
  const response = await query(`/items/${collection}${buildQuery(params)}`);
  const row = response?.data?.data?.[0] || {};
  return Number(row.count ?? row.countDistinct ?? 0) || 0;
}

async function schemaRequest(path, config = {}) {
  return query(path, config);
}

module.exports = {
  query,
  buildQuery,
  list,
  get,
  first,
  create,
  createMany,
  update,
  remove,
  count,
  schemaRequest,
  getToken,
  authenticate,
};
