const pool = require('../config/db');

function validateUser(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return 'Request body must be a JSON object';
  for (const field of ['name', 'email', 'age']) {
    if (!Object.prototype.hasOwnProperty.call(input, field)) return `${field[0].toUpperCase()}${field.slice(1)} is required`;
  }
  if (typeof input.name !== 'string' || !input.name.trim()) return 'Name must be a non-empty string';
  if (input.name.trim().length > 100) return 'Name must be 100 characters or fewer';
  if (typeof input.email !== 'string' || !input.email.trim()) return 'Email is required';
  if (input.email.trim().length > 150 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) return 'Email must be a valid email address of 150 characters or fewer';
  if (!Number.isSafeInteger(input.age) || input.age <= 0 || input.age > 150) return 'Age must be a positive integer no greater than 150';
  return null;
}

function parseId(value) {
  if (!/^\d+$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function sendDbError(error, res) {
  if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ success: false, message: 'Email is already in use' });
  console.error(error);
  return res.status(500).json({ success: false, message: 'An unexpected server or database error occurred' });
}

async function findUser(id, res) {
  const [rows] = await pool.execute('SELECT id, name, email, age, created_at FROM users WHERE id = ?', [id]);
  if (!rows.length) {
    res.status(404).json({ success: false, message: `User with ID ${id} was not found` });
    return null;
  }
  return rows[0];
}

exports.getAllUsers = async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT id, name, email, age, created_at FROM users ORDER BY id');
    return res.status(200).json({ success: true, count: rows.length, data: rows });
  } catch (error) { return sendDbError(error, res); }
};

exports.getUserById = async (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ success: false, message: 'User ID must be a positive integer' });
  try {
    const user = await findUser(id, res);
    if (user) return res.status(200).json({ success: true, data: user });
  } catch (error) { return sendDbError(error, res); }
};

exports.createUser = async (req, res) => {
  const validationError = validateUser(req.body);
  if (validationError) return res.status(400).json({ success: false, message: validationError });
  try {
    const user = { name: req.body.name.trim(), email: req.body.email.trim(), age: req.body.age };
    const [result] = await pool.execute('INSERT INTO users (name, email, age) VALUES (?, ?, ?)', [user.name, user.email, user.age]);
    const [rows] = await pool.execute('SELECT id, name, email, age, created_at FROM users WHERE id = ?', [result.insertId]);
    return res.status(201).json({ success: true, message: 'User created successfully', data: rows[0] });
  } catch (error) { return sendDbError(error, res); }
};

exports.updateUser = async (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ success: false, message: 'User ID must be a positive integer' });
  const validationError = validateUser(req.body);
  if (validationError) return res.status(400).json({ success: false, message: validationError });
  try {
    if (!await findUser(id, res)) return;
    await pool.execute('UPDATE users SET name = ?, email = ?, age = ? WHERE id = ?', [req.body.name.trim(), req.body.email.trim(), req.body.age, id]);
    const [rows] = await pool.execute('SELECT id, name, email, age, created_at FROM users WHERE id = ?', [id]);
    return res.status(200).json({ success: true, message: 'User updated successfully', data: rows[0] });
  } catch (error) { return sendDbError(error, res); }
};

exports.deleteUser = async (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ success: false, message: 'User ID must be a positive integer' });
  try {
    const user = await findUser(id, res);
    if (!user) return;
    await pool.execute('DELETE FROM users WHERE id = ?', [id]);
    return res.status(200).json({ success: true, message: 'User deleted successfully', data: user });
  } catch (error) { return sendDbError(error, res); }
};
