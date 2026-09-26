const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const os = require('node:os');
const fs = require('node:fs');
const { DatabaseSync } = require('node:sqlite');

// Keep test data separate from the database used by a locally running server.
const testDatabasePath = path.join(os.tmpdir(), `user-api-test-${process.pid}.sqlite`);
process.env.DB_PATH = testDatabasePath;

const app = require('../src/server');
const users = require('../src/data/database');

test('user API supports CRUD, validation, and error responses', async (t) => {
  users.clearUsers();
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  async function request(method, url, body) {
    const response = await fetch(`${baseUrl}${url}`, {
      method,
      headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    return { response, json: await response.json() };
  }

  try {
    await t.test('health check and initially empty list', async () => {
      const health = await request('GET', '/');
      assert.equal(health.response.status, 200);
      assert.equal(health.json.status, 'success');
      const list = await request('GET', '/api/users');
      assert.equal(list.json.count, 0);
    });

    await t.test('validates missing fields, malformed email, and age', async () => {
      const missing = await request('POST', '/api/users', { email: 'x@example.com', age: 20 });
      assert.equal(missing.response.status, 400);
      const email = await request('POST', '/api/users', { name: 'Test', email: 'invalid', age: 20 });
      assert.equal(email.response.status, 400);
      const age = await request('POST', '/api/users', { name: 'Test', email: 'test@example.com', age: -1 });
      assert.equal(age.response.status, 400);
    });

    let userId;
    await t.test('creates and retrieves a user', async () => {
      const created = await request('POST', '/api/users', { name: 'Test User', email: 'test@example.com', age: 25 });
      assert.equal(created.response.status, 201);
      userId = created.json.data.id;
      const found = await request('GET', `/api/users/${userId}`);
      assert.equal(found.response.status, 200);
      assert.equal(found.json.data.email, 'test@example.com');
      const reopenedDatabase = new DatabaseSync(testDatabasePath);
      assert.equal(reopenedDatabase.prepare('SELECT email FROM users WHERE id = ?').get(userId).email, 'test@example.com');
      reopenedDatabase.close();
    });

    await t.test('prevents duplicate emails and invalid IDs', async () => {
      const duplicate = await request('POST', '/api/users', { name: 'Other', email: 'TEST@example.com', age: 22 });
      assert.equal(duplicate.response.status, 409);
      const invalidId = await request('GET', '/api/users/nope');
      assert.equal(invalidId.response.status, 400);
      const missingUser = await request('GET', '/api/users/999999');
      assert.equal(missingUser.response.status, 404);
    });

    await t.test('updates and deletes a user', async () => {
      const updated = await request('PUT', `/api/users/${userId}`, { name: 'Updated User', email: 'updated@example.com', age: 26 });
      assert.equal(updated.response.status, 200);
      assert.equal(updated.json.data.name, 'Updated User');
      const deleted = await request('DELETE', `/api/users/${userId}`);
      assert.equal(deleted.response.status, 200);
      const afterDelete = await request('GET', `/api/users/${userId}`);
      assert.equal(afterDelete.response.status, 404);
    });

    await t.test('formats malformed JSON and unknown route errors', async () => {
      const invalidJson = await fetch(`${baseUrl}/api/users`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{broken'
      });
      assert.equal(invalidJson.status, 400);
      assert.equal((await invalidJson.json()).success, false);
      const unknown = await request('GET', '/no-such-route');
      assert.equal(unknown.response.status, 404);
    });
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    users.db.close();
    for (const suffix of ['', '-shm', '-wal']) {
      try { fs.unlinkSync(testDatabasePath + suffix); } catch (error) { if (error.code !== 'ENOENT') throw error; }
    }
  }
});
