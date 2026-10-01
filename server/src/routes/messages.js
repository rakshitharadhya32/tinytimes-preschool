const express = require('express');
const { eq, and, or, isNull, desc } = require('drizzle-orm');
const { db, schema } = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { upload } = require('../utils/upload');
const { storeFile } = require('../utils/mediaStorage');
const { notifyNewMessage } = require('../utils/push');

const router = express.Router();
router.use(requireAuth);

// Feed: staff/admin see everything for the school; parents see broadcasts,
// classroom posts matching their child(ren)'s classroom, and posts about their child.
router.get('/', async (req, res) => {
  try {
    const all = await db
      .select({
        id: schema.messages.id,
        title: schema.messages.title,
        body: schema.messages.body,
        photoUrl: schema.messages.photoUrl,
        classroom: schema.messages.classroom,
        studentId: schema.messages.studentId,
        createdAt: schema.messages.createdAt,
        authorName: schema.users.name,
      })
      .from(schema.messages)
      .innerJoin(schema.users, eq(schema.messages.authorId, schema.users.id))
      .where(eq(schema.messages.schoolId, req.user.schoolId))
      .orderBy(desc(schema.messages.createdAt));

    if (req.user.role !== 'parent') return res.json(all);

    const links = await db
      .select({ studentId: schema.guardians.studentId })
      .from(schema.guardians)
      .where(eq(schema.guardians.userId, req.user.id));
    const myStudentIds = links.map((l) => l.studentId);

    const myStudents = myStudentIds.length
      ? await db.select().from(schema.students).where(eq(schema.students.schoolId, req.user.schoolId))
      : [];
    const myClassrooms = new Set(
      myStudents.filter((s) => myStudentIds.includes(s.id)).map((s) => s.classroom)
    );

    const filtered = all.filter((m) => {
      if (!m.classroom && !m.studentId) return true; // school-wide broadcast
      if (m.studentId && myStudentIds.includes(m.studentId)) return true;
      if (m.classroom && myClassrooms.has(m.classroom)) return true;
      return false;
    });
    res.json(filtered);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load messages' });
  }
});

router.post('/', requireRole('admin', 'staff'), upload.single('photo'), async (req, res) => {
  try {
    const { title, body, classroom, studentId } = req.body;
    if (!body) return res.status(400).json({ error: 'body is required' });
    const photoUrl = req.file ? await storeFile(req.file) : null;

    const [created] = await db
      .insert(schema.messages)
      .values({
        schoolId: req.user.schoolId,
        authorId: req.user.id,
        studentId: studentId ? Number(studentId) : null,
        classroom: classroom || null,
        title: title || null,
        body,
        photoUrl,
      })
      .returning();
    res.status(201).json(created);

    // Push notifications are best-effort — never let a notification failure affect the
    // already-saved, already-responded-to announcement.
    notifyNewMessage(created).catch((err) => console.error('Push notify failed:', err));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to post message' });
  }
});

router.delete('/:id', requireRole('admin', 'staff'), async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(schema.messages).where(and(eq(schema.messages.id, id), eq(schema.messages.schoolId, req.user.schoolId)));
  res.status(204).end();
});

module.exports = router;
