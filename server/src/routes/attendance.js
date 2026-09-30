const express = require('express');
const { eq, and, inArray } = require('drizzle-orm');
const { db, schema } = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// Attendance roster for a given date (default today), joined with student info.
// Staff/admin see the whole school; parents see only their linked children.
router.get('/', async (req, res) => {
  const date = req.query.date || todayStr();
  try {
    let studentIds = null;
    if (req.user.role === 'parent') {
      const links = await db
        .select({ studentId: schema.guardians.studentId })
        .from(schema.guardians)
        .where(eq(schema.guardians.userId, req.user.id));
      studentIds = links.map((l) => l.studentId);
      if (studentIds.length === 0) return res.json([]);
    }

    let students = await db
      .select()
      .from(schema.students)
      .where(
        and(eq(schema.students.schoolId, req.user.schoolId), eq(schema.students.stage, 'enrolled'))
      );

    if (studentIds) students = students.filter((s) => studentIds.includes(s.id));
    if (req.query.classroom) students = students.filter((s) => s.classroom === req.query.classroom);

    const records = await db.select().from(schema.attendance).where(eq(schema.attendance.date, date));
    const byStudent = new Map(records.map((r) => [r.studentId, r]));

    const roster = students.map((s) => ({
      student: s,
      attendance: byStudent.get(s.id) || null,
    }));
    res.json({ date, roster });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load attendance' });
  }
});

router.get('/history/:studentId', async (req, res) => {
  const studentId = Number(req.params.studentId);
  const rows = await db
    .select()
    .from(schema.attendance)
    .where(eq(schema.attendance.studentId, studentId));
  rows.sort((a, b) => (a.date < b.date ? 1 : -1));
  res.json(rows.slice(0, 60));
});

router.post('/checkin', requireRole('admin', 'staff'), async (req, res) => {
  try {
    const { studentId, date } = req.body;
    const d = date || todayStr();
    const [existing] = await db
      .select()
      .from(schema.attendance)
      .where(and(eq(schema.attendance.studentId, studentId), eq(schema.attendance.date, d)));

    if (existing) {
      const [updated] = await db
        .update(schema.attendance)
        .set({ checkInTime: new Date(), checkedInBy: req.user.id })
        .where(eq(schema.attendance.id, existing.id))
        .returning();
      return res.json(updated);
    }

    const [created] = await db
      .insert(schema.attendance)
      .values({ studentId, date: d, checkInTime: new Date(), checkedInBy: req.user.id })
      .returning();
    res.status(201).json(created);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to check in' });
  }
});

router.post('/checkout', requireRole('admin', 'staff'), async (req, res) => {
  try {
    const { studentId, date } = req.body;
    const d = date || todayStr();
    const [existing] = await db
      .select()
      .from(schema.attendance)
      .where(and(eq(schema.attendance.studentId, studentId), eq(schema.attendance.date, d)));

    if (!existing) return res.status(400).json({ error: 'Student has not checked in today' });

    const [updated] = await db
      .update(schema.attendance)
      .set({ checkOutTime: new Date(), checkedOutBy: req.user.id })
      .where(eq(schema.attendance.id, existing.id))
      .returning();
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to check out' });
  }
});

module.exports = router;
