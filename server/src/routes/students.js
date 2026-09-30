const express = require('express');
const bcrypt = require('bcryptjs');
const { eq, and } = require('drizzle-orm');
const { db, schema } = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { upload } = require('../utils/upload');

const router = express.Router();
router.use(requireAuth);

// List students, optionally filtered by stage/classroom. Parents only see their linked children.
router.get('/', async (req, res) => {
  const { stage, classroom } = req.query;
  try {
    if (req.user.role === 'parent') {
      const links = await db
        .select({ studentId: schema.guardians.studentId })
        .from(schema.guardians)
        .where(eq(schema.guardians.userId, req.user.id));
      const ids = links.map((l) => l.studentId);
      if (ids.length === 0) return res.json([]);
      const all = await db
        .select()
        .from(schema.students)
        .where(eq(schema.students.schoolId, req.user.schoolId));
      return res.json(all.filter((s) => ids.includes(s.id)));
    }

    let rows = await db
      .select()
      .from(schema.students)
      .where(eq(schema.students.schoolId, req.user.schoolId));

    if (stage) rows = rows.filter((s) => s.stage === stage);
    if (classroom) rows = rows.filter((s) => s.classroom === classroom);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to list students' });
  }
});

router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const [student] = await db.select().from(schema.students).where(eq(schema.students.id, id));
  if (!student) return res.status(404).json({ error: 'Not found' });
  res.json(student);
});

// Create a new inquiry / student (admin, staff)
router.post('/', requireRole('admin', 'staff'), async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      dob,
      gender,
      classroom,
      stage,
      allergies,
      notes,
    } = req.body;
    if (!firstName || !lastName) {
      return res.status(400).json({ error: 'firstName and lastName are required' });
    }
    const [created] = await db
      .insert(schema.students)
      .values({
        schoolId: req.user.schoolId,
        firstName,
        lastName,
        dob: dob || null,
        gender: gender || null,
        classroom: classroom || null,
        stage: stage || 'inquiry',
        allergies: allergies || null,
        notes: notes || null,
      })
      .returning();
    res.status(201).json(created);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create student' });
  }
});

// Update student fields, including moving enrollment stage (kanban drag)
router.patch('/:id', requireRole('admin', 'staff'), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const allowed = [
      'firstName',
      'lastName',
      'dob',
      'gender',
      'classroom',
      'stage',
      'allergies',
      'notes',
      'photoUrl',
    ];
    const updates = { updatedAt: new Date() };
    for (const key of allowed) {
      if (key in req.body) updates[key] = req.body[key];
    }
    const [updated] = await db
      .update(schema.students)
      .set(updates)
      .where(and(eq(schema.students.id, id), eq(schema.students.schoolId, req.user.schoolId)))
      .returning();
    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update student' });
  }
});

router.delete('/:id', requireRole('admin'), async (req, res) => {
  const id = Number(req.params.id);
  await db
    .delete(schema.students)
    .where(and(eq(schema.students.id, id), eq(schema.students.schoolId, req.user.schoolId)));
  res.status(204).end();
});

router.post('/:id/photo', requireRole('admin', 'staff'), upload.single('photo'), async (req, res) => {
  const id = Number(req.params.id);
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const photoUrl = `/uploads/${req.file.filename}`;
  const [updated] = await db
    .update(schema.students)
    .set({ photoUrl, updatedAt: new Date() })
    .where(eq(schema.students.id, id))
    .returning();
  res.json(updated);
});

// ---------- Guardians (parent links) ----------
router.get('/:id/guardians', requireRole('admin', 'staff'), async (req, res) => {
  const id = Number(req.params.id);
  const rows = await db
    .select({
      id: schema.guardians.id,
      relationship: schema.guardians.relationship,
      userId: schema.users.id,
      name: schema.users.name,
      email: schema.users.email,
      phone: schema.users.phone,
    })
    .from(schema.guardians)
    .innerJoin(schema.users, eq(schema.guardians.userId, schema.users.id))
    .where(eq(schema.guardians.studentId, id));
  res.json(rows);
});

// Create a parent account (or link existing one by email) to a student
router.post('/:id/guardians', requireRole('admin', 'staff'), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, email, phone, relationship, password } = req.body;
    if (!email) return res.status(400).json({ error: 'email is required' });

    let [existing] = await db.select().from(schema.users).where(eq(schema.users.email, email.toLowerCase().trim()));

    if (!existing) {
      const passwordHash = await bcrypt.hash(password || 'kriyo123', 10);
      [existing] = await db
        .insert(schema.users)
        .values({
          schoolId: req.user.schoolId,
          name: name || email,
          email: email.toLowerCase().trim(),
          passwordHash,
          role: 'parent',
          phone: phone || null,
        })
        .returning();
    }

    const [link] = await db
      .insert(schema.guardians)
      .values({ studentId: id, userId: existing.id, relationship: relationship || 'Parent' })
      .returning();

    res.status(201).json({ link, user: { id: existing.id, name: existing.name, email: existing.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add guardian' });
  }
});

router.delete('/:id/guardians/:guardianId', requireRole('admin', 'staff'), async (req, res) => {
  const guardianId = Number(req.params.guardianId);
  await db.delete(schema.guardians).where(eq(schema.guardians.id, guardianId));
  res.status(204).end();
});

module.exports = router;
