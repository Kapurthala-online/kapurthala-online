const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { generateToken } = require('../middleware/auth');

// In-memory admin (for prototype; replace with DB in production)
const ADMIN = {
  username: process.env.ADMIN_USERNAME || 'admin',
  // Store hashed password; default: kapurthala2024
  passwordHash: bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'kapurthala2024', 10),
};

/* POST /api/auth/login */
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password are required.' });
  }

  if (username !== ADMIN.username) {
    return res.status(401).json({ success: false, message: 'Invalid credentials.' });
  }

  const match = await bcrypt.compare(password, ADMIN.passwordHash);
  if (!match) {
    return res.status(401).json({ success: false, message: 'Invalid credentials.' });
  }

  const token = generateToken({ username, role: 'admin' });

  res.json({
    success: true,
    token,
    expiresIn: '8h',
    user: { username, role: 'admin' },
  });
});

/* POST /api/auth/verify — check if token is still valid */
router.get('/verify', require('../middleware/auth').protect, (req, res) => {
  res.json({ success: true, user: req.admin });
});

module.exports = router;
