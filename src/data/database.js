const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const databasePath = process.env.DB_PATH || path.join(__dirname, 'users.sqlite');
const db = new DatabaseSync(databasePath);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL COLLATE NOCASE UNIQUE,
    age REAL NOT NULL CHECK (age > 0 AND age <= 150)
  )
`);

function allUsers() {
  return db.prepare('SELECT id, name, email, age FROM users ORDER BY id').all();
}

function userById(id) {
  return db.prepare('SELECT id, name, email, age FROM users WHERE id = ?').get(id) || null;
}

function userByEmail(email) {
  return db.prepare('SELECT id, name, email, age FROM users WHERE email = ? COLLATE NOCASE').get(email) || null;
}

function createUser({ name, email, age }) {
  const result = db.prepare('INSERT INTO users (name, email, age) VALUES (?, ?, ?)').run(name, email, age);
  return userById(Number(result.lastInsertRowid));
}

function updateUser(id, { name, email, age }) {
  db.prepare('UPDATE users SET name = ?, email = ?, age = ? WHERE id = ?').run(name, email, age, id);
  return userById(id);
}

function deleteUser(id) {
  const user = userById(id);
  if (user) db.prepare('DELETE FROM users WHERE id = ?').run(id);
  return user;
}

function clearUsers() {
  db.exec('DELETE FROM users; DELETE FROM sqlite_sequence WHERE name = \'users\'');
}

module.exports = { allUsers, userById, userByEmail, createUser, updateUser, deleteUser, clearUsers, db };
