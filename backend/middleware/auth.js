const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'kapurthala-online-dev-secret';

/* ─── Protect admin routes ─────────────────── */
exports.protect = (req, res, next) => {
  let token;

  // Support Bearer token in Authorization header
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) {
    token = auth.split(' ')[1];
  }

  // Also accept token in query param (for easy demo)
  if (!token && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please log in.',
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token. Please log in again.',
    });
  }
};

/* ─── Issue a token (used by auth route) ───── */
exports.generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });
};
