/**
 * Kapurthala Online — Express Server
 * =====================================
 * Startup:  node server.js
 * Dev:      npm run dev   (requires nodemon)
 * Seed DB:  node seed.js
 */

require('dotenv').config();
const express    = require('express');
const mongoose   = require('mongoose');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const compression = require('compression');
const rateLimit  = require('express-rate-limit');
const path       = require('path');

const vendorRoutes = require('./routes/vendors');
const authRoutes   = require('./routes/auth');

const app  = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/kapurthala_online';

/* ─── Security & Performance Middleware ─────── */
app.use(helmet({
  contentSecurityPolicy: false,  // Disabled so frontend can load external resources
}));
app.use(compression());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

/* ─── CORS ──────────────────────────────────── */
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5000',
  'http://127.0.0.1:5000',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g., file://, Postman, mobile)
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

/* ─── Body Parsing ───────────────────────────── */
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

/* ─── Rate Limiting ─────────────────────────── */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 200,
  message: { success: false, message: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', apiLimiter);

/* ─── Serve Frontend Static Files ───────────── */
const FRONTEND_PATH = path.join(__dirname, '..', 'frontend');
app.use(express.static(FRONTEND_PATH));

/* ─── API Routes ────────────────────────────── */
app.use('/api/vendors', vendorRoutes);
app.use('/api/auth',    authRoutes);

/* ─── Health Check ───────────────────────────── */
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()) + 's',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

/* ─── Catch-all: serve frontend for SPA ─────── */
app.get('*', (req, res) => {
  res.sendFile(path.join(FRONTEND_PATH, 'index.html'));
});

/* ─── Global Error Handler ───────────────────── */
app.use((err, req, res, next) => {
  console.error('[Server Error]', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message,
  });
});

/* ─── Connect MongoDB & Start ────────────────── */
mongoose
  .connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
  })
  .then(() => {
    console.log('✅  MongoDB connected:', MONGODB_URI);
    app.listen(PORT, () => {
      console.log('');
      console.log('┌──────────────────────────────────────────┐');
      console.log('│   🏪  Kapurthala Online — Server Started  │');
      console.log('├──────────────────────────────────────────┤');
      console.log(`│  Local:  http://localhost:${PORT}             │`);
      console.log(`│  API:    http://localhost:${PORT}/api/vendors  │`);
      console.log(`│  Health: http://localhost:${PORT}/api/health   │`);
      console.log('│  Env:    ' + (process.env.NODE_ENV || 'development').padEnd(31) + '│');
      console.log('└──────────────────────────────────────────┘');
      console.log('');
    });
  })
  .catch((err) => {
    console.error('❌  MongoDB connection failed:', err.message);
    console.error('   Make sure MongoDB is running: mongod --dbpath /data/db');
    process.exit(1);
  });

/* ─── Graceful Shutdown ─────────────────────── */
process.on('SIGTERM', async () => {
  console.log('\n🛑  SIGTERM received. Shutting down gracefully...');
  await mongoose.connection.close();
  process.exit(0);
});

module.exports = app;
