const { test } = require('node:test');
const assert = require('node:assert/strict');

test('MySQL-backed API CRUD integration', async (t) => {
  require('dotenv').config();
  const pool = require('../src/config/db');
  const app = require('../src/server');
  const email = `api-test-${Date.now()}@example.com`;
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  async function request(method, path, body) {
    const response = await fetch(baseUrl + path, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : undefined
    });
    return { status: response.status, json: await response.json() };
  }

  try {
    let id;
    await t.test('creates and reads persistent user rows', async () => {
      const created = await request('POST', '/api/users', { name: 'API Test User', email, age: 25 });
      assert.equal(created.status, 201);
      id = created.json.data.id;
      const [stored] = await pool.execute('SELECT email FROM users WHERE id = ?', [id]);
      assert.equal(stored[0].email, email);
      assert.equal((await request('GET', `/api/users/${id}`)).json.data.email, email);
      assert.ok((await request('GET', '/api/users')).json.count >= 1);
    });
    await t.test('validates, updates, handles duplicate email, and deletes', async () => {
      assert.equal((await request('POST', '/api/users', { name: '', email, age: 25 })).status, 400);
      assert.equal((await request('POST', '/api/users', { name: 'Duplicate', email, age: 25 })).status, 409);
      const updated = await request('PUT', `/api/users/${id}`, { name: 'Updated Test', email: `updated-${email}`, age: 26 });
      assert.equal(updated.status, 200);
      assert.equal(updated.json.data.name, 'Updated Test');
      assert.equal((await request('DELETE', `/api/users/${id}`)).status, 200);
      assert.equal((await request('GET', `/api/users/${id}`)).status, 404);
      assert.equal((await request('GET', '/api/users/not-an-id')).status, 400);
    });
  } finally {
    if (server.listening) await new Promise((resolve) => server.close(resolve));
    await pool.execute('DELETE FROM users WHERE email LIKE ?', [`%${email}`]).catch(() => {});
    await pool.end();
  }
});
