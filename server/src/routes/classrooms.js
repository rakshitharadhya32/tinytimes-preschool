const express = require('express');
const { eq, and } = require('drizzle-orm');
const { db, schema } = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// List classrooms for the school, with teacher name + live student count attached.
router.get('/', async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(schema.classrooms)
      .where(eq(schema.classrooms.schoolId, req.user.schoolId));

    const teachers = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.schoolId, req.user.schoolId));
    const teacherById = new Map(teachers.map((t) => [t.id, t]));

    const students = await db
      .select()
      .from(schema.students)
      .where(eq(schema.students.schoolId, req.user.schoolId));
    const countByClassroom = new Map();
    for (const s of students) {
      if (!s.classroomId) continue;
      countByClassroom.set(s.classroomId, (countByClassroom.get(s.classroomId) || 0) + 1);
    }

    res.json(
      rows.map((c) => ({
        ...c,
        teacherName: c.teacherId ? teacherById.get(c.teacherId)?.name || null : null,
        studentCount: countByClassroom.get(c.id) || 0,
      }))
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to list classrooms' });
  }
});

router.post('/', requireRole('admin', 'staff'), async (req, res) => {
  try {
    const { name, capacity, teacherId, color } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });
    const [created] = await db
      .insert(schema.classrooms)
      .values({
        schoolId: req.user.schoolId,
        name,
        capacity: capacity ? Number(capacity) : null,
        teacherId: teacherId ? Number(teacherId) : null,
        color: color || '#f97316',
      })
      .returning();
    res.status(201).json(created);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create classroom' });
  }
});

router.patch('/:id', requireRole('admin', 'staff'), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const allowed = ['name', 'capacity', 'teacherId', 'color'];
    const updates = {};
    for (const key of allowed) if (key in req.body) updates[key] = req.body[key];

    const [updated] = await db
      .update(schema.classrooms)
      .set(updates)
      .where(and(eq(schema.classrooms.id, id), eq(schema.classrooms.schoolId, req.user.schoolId)))
      .returning();
    if (!updated) return res.status(404).json({ error: 'Not found' });

    // Keep the legacy students.classroom text label in sync for anything still reading it
    // (attendance grouping, announcement classroom targeting).
    if ('name' in updates) {
      await db
        .update(schema.students)
        .set({ classroom: updated.name })
        .where(eq(schema.students.classroomId, id));
    }

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update classroom' });
  }
});

router.delete('/:id', requireRole('admin'), async (req, res) => {
  try {
    const id = Number(req.params.id);
    // Unassign any students pointing at this classroom rather than blocking the delete.
    await db
      .update(schema.students)
      .set({ classroomId: null })
      .where(eq(schema.students.classroomId, id));
    await db
      .delete(schema.classrooms)
      .where(and(eq(schema.classrooms.id, id), eq(schema.classrooms.schoolId, req.user.schoolId)));
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete classroom' });
  }
});

module.exports = router;
