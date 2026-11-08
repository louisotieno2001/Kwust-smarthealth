const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { env } = require('../src/config/env');

let server;
let directus;
let baseUrl;
const requests = [];

function readBody(req) {
  return new Promise((resolve) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
  });
}

test.before(async () => {
  server = http.createServer(async (req, res) => {
    const body = await readBody(req);
    requests.push({ method: req.method, url: req.url, headers: req.headers, body });
    res.setHeader('Content-Type', 'application/json');

    if (req.url === '/items/broken') {
      res.statusCode = 400;
      res.end(JSON.stringify({ errors: [{ message: 'Broken request' }] }));
      return;
    }

    if (req.method === 'DELETE') {
      res.statusCode = 204;
      res.end();
      return;
    }

    if (req.url.startsWith('/items/users/1')) {
      res.end(JSON.stringify({ data: { id: 1, full_name: 'Amina Hassan' } }));
      return;
    }

    if (req.url.startsWith('/items/users')) {
      if (req.method === 'GET' && req.url.includes('aggregate')) {
        res.end(JSON.stringify({ data: [{ count: '7' }] }));
        return;
      }
      if (req.method === 'GET') {
        res.end(JSON.stringify({ data: [{ id: 1, full_name: 'Amina Hassan' }] }));
        return;
      }
      res.end(JSON.stringify({ data: { id: 2, ...JSON.parse(body || '{}') } }));
      return;
    }

    res.end(JSON.stringify({ data: null }));
  });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
  env.directus.url = baseUrl;
  env.directus.token = 'test-directus-token';
  directus = require('../src/lib/directus');
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

test('query sends the Directus authorization header', async () => {
  const response = await directus.query('/items/users?limit=1');
  assert.equal(response.data.data[0].full_name, 'Amina Hassan');
  assert.equal(requests.at(-1).headers.authorization, 'Bearer test-directus-token');
});

test('wrapper helpers use items API structure', async () => {
  const users = await directus.list('users', { limit: 1 });
  assert.equal(users[0].id, 1);

  const user = await directus.get('users', 1);
  assert.equal(user.full_name, 'Amina Hassan');

  const created = await directus.create('users', { full_name: 'New User' });
  assert.equal(created.full_name, 'New User');
  assert.equal(requests.at(-1).method, 'POST');

  const updated = await directus.update('users', 2, { full_name: 'Updated User' });
  assert.equal(updated.full_name, 'Updated User');
  assert.equal(requests.at(-1).method, 'PATCH');

  await directus.remove('users', 2);
  assert.equal(requests.at(-1).method, 'DELETE');

  const total = await directus.count('users', { role: { _eq: 'student' } });
  assert.equal(total, 7);
});

test('buildQuery serializes Directus filters as JSON', () => {
  const query = directus.buildQuery({
    filter: { role: { _eq: 'student' } },
    sort: ['full_name', '-created_at'],
    limit: 5,
    fields: 'id,full_name',
  });
  const search = new URLSearchParams(query);
  assert.deepEqual(JSON.parse(search.get('filter')), { role: { _eq: 'student' } });
  assert.equal(search.get('sort'), 'full_name,-created_at');
  assert.equal(search.get('limit'), '5');
  assert.equal(search.get('fields'), 'id,full_name');
});

test('Directus errors are normalized', async () => {
  await assert.rejects(
    () => directus.query('/items/broken'),
    (error) => error.status === 400 && /Broken request/.test(error.message),
  );
});
