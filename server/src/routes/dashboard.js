const express = require('express');
const { eq, and, gte } = require('drizzle-orm');
const { db, schema } = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth, requireRole('admin', 'staff'));

router.get('/summary', async (req, res) => {
  try {
    const students = await db
      .select()
      .from(schema.students)
      .where(eq(schema.students.schoolId, req.user.schoolId));

    const staff = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.schoolId, req.user.schoolId));

    const today = new Date().toISOString().slice(0, 10);
    const todaysAttendance = await db
      .select()
      .from(schema.attendance)
      .where(eq(schema.attendance.date, today));

    const enrolled = students.filter((s) => s.stage === 'enrolled');
    const enrolledIds = new Set(enrolled.map((s) => s.id));

    const presentToday = todaysAttendance.filter(
      (a) => a.checkInTime && !a.checkOutTime && enrolledIds.has(a.studentId)
    ).length;
    const checkedOutToday = todaysAttendance.filter(
      (a) => a.checkOutTime && enrolledIds.has(a.studentId)
    ).length;

    const stageCounts = {};
    for (const s of students) stageCounts[s.stage] = (stageCounts[s.stage] || 0) + 1;

    res.json({
      totalStudents: students.length,
      enrolledCount: enrolled.length,
      stageCounts,
      staffCount: staff.filter((u) => u.role === 'staff' || u.role === 'admin').length,
      parentCount: staff.filter((u) => u.role === 'parent').length,
      presentToday,
      checkedOutToday,
      absentToday: enrolled.length - presentToday - checkedOutToday,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load dashboard summary' });
  }
});

module.exports = router;
