const users = require('../data/database');

function validateUser(input, { partial = false, excludeId = null } = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return 'Request body must be a JSON object';
  }

  for (const field of ['name', 'email', 'age']) {
    if (partial && !Object.prototype.hasOwnProperty.call(input, field)) continue;
    if (!Object.prototype.hasOwnProperty.call(input, field)) {
      return `${field[0].toUpperCase()}${field.slice(1)} is required`;
    }
    const value = input[field];
    if (field === 'name' && (typeof value !== 'string' || !value.trim())) {
      return 'Name must be a non-empty string';
    }
    if (field === 'email') {
      if (typeof value !== 'string' || !value.trim()) return 'Email is required';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return 'Email must be a valid email address';
      const duplicate = users.userByEmail(value.trim());
      if (duplicate && duplicate.id !== excludeId) return 'Email is already in use';
    }
    if (field === 'age' && (typeof value !== 'number' || !Number.isFinite(value) || value <= 0 || value > 150)) {
      return 'Age must be a positive number no greater than 150';
    }
  }
  return null;
}

function parseId(value) {
  if (!/^\d+$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function findUser(req, res) {
  const id = parseId(req.params.id);
  if (id === null) {
    res.status(400).json({ success: false, message: 'User ID must be a positive integer' });
    return null;
  }
  const user = users.userById(id);
  if (!user) {
    res.status(404).json({ success: false, message: `User with ID ${id} was not found` });
    return null;
  }
  return user;
}

exports.getAllUsers = (req, res) => {
  const allUsers = users.allUsers();
  res.status(200).json({ success: true, count: allUsers.length, data: allUsers });
};

exports.getUserById = (req, res) => {
  const user = findUser(req, res);
  if (user) res.status(200).json({ success: true, data: user });
};

exports.createUser = (req, res) => {
  const validationError = validateUser(req.body);
  if (validationError) return res.status(validationError === 'Email is already in use' ? 409 : 400).json({ success: false, message: validationError });

  const user = users.createUser({ name: req.body.name.trim(), email: req.body.email.trim(), age: req.body.age });
  return res.status(201).json({ success: true, message: 'User created successfully', data: user });
};

exports.updateUser = (req, res) => {
  const user = findUser(req, res);
  if (!user) return;
  const validationError = validateUser(req.body, { excludeId: user.id });
  if (validationError) return res.status(validationError === 'Email is already in use' ? 409 : 400).json({ success: false, message: validationError });

  try {
    const updatedUser = users.updateUser(user.id, { name: req.body.name.trim(), email: req.body.email.trim(), age: req.body.age });
    return res.status(200).json({ success: true, message: 'User updated successfully', data: updatedUser });
  } catch (error) {
    if (error.code === 'ERR_SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ success: false, message: 'Email is already in use' });
    }
    throw error;
  }
};

exports.deleteUser = (req, res) => {
  const user = findUser(req, res);
  if (!user) return;
  users.deleteUser(user.id);
  return res.status(200).json({ success: true, message: 'User deleted successfully', data: user });
};
