require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/students');
const staffRoutes = require('./routes/staff');
const attendanceRoutes = require('./routes/attendance');
const messageRoutes = require('./routes/messages');
const dashboardRoutes = require('./routes/dashboard');
const classroomRoutes = require('./routes/classrooms');
const pushRoutes = require('./routes/push');
const billingRoutes = require('./routes/billing');

const app = express();

// CORS_ORIGIN can be a comma-separated list of allowed origins (e.g. your Vercel URL).
// Left unset, all origins are allowed — fine for a demo, tighten it for real use.
const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors(
    allowedOrigins.length
      ? { origin: allowedOrigins, credentials: true }
      : { origin: true, credentials: true }
  )
);
app.use(express.json());
app.use(morgan('dev'));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.get('/api/health', (req, res) => res.json({ ok: true, service: 'kriyo-server' }));

app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/classrooms', classroomRoutes);
app.use('/api/push', pushRoutes);
app.use('/api/billing', billingRoutes);

// Serve the built frontend (web/dist) if it exists, so the whole app can run
// behind a single port/URL. Falls back to index.html for client-side routes.
const webDist = path.join(__dirname, '..', '..', 'web', 'dist');
const fs = require('fs');
if (fs.existsSync(webDist)) {
  app.use(express.static(webDist));
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(webDist, 'index.html'));
  });
}

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Kriyo server listening on http://localhost:${PORT}`);
});
