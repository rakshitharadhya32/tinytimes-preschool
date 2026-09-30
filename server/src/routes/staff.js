const express = require('express');
const bcrypt = require('bcryptjs');
const { eq, and, inArray } = require('drizzle-orm');
const { db, schema } = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth, requireRole('admin', 'staff'));

router.get('/', async (req, res) => {
  const rows = await db
    .select()
    .from(schema.users)
    .where(
      and(
        eq(schema.users.schoolId, req.user.schoolId),
        inArray(schema.users.role, ['admin', 'staff'])
      )
    );
  res.json(rows.map(({ passwordHash, ...rest }) => rest));
});

router.post('/', requireRole('admin'), async (req, res) => {
  try {
    const { name, email, password, phone, title, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email, and password are required' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const [created] = await db
      .insert(schema.users)
      .values({
        schoolId: req.user.schoolId,
        name,
        email: email.toLowerCase().trim(),
        passwordHash,
        role: role === 'admin' ? 'admin' : 'staff',
        phone: phone || null,
        title: title || null,
      })
      .returning();
    const { passwordHash: _, ...safe } = created;
    res.status(201).json(safe);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Email already in use' });
    console.error(err);
    res.status(500).json({ error: 'Failed to create staff member' });
  }
});

router.patch('/:id', requireRole('admin'), async (req, res) => {
  const id = Number(req.params.id);
  const allowed = ['name', 'phone', 'title', 'role'];
  const updates = {};
  for (const key of allowed) if (key in req.body) updates[key] = req.body[key];
  const [updated] = await db
    .update(schema.users)
    .set(updates)
    .where(and(eq(schema.users.id, id), eq(schema.users.schoolId, req.user.schoolId)))
    .returning();
  if (!updated) return res.status(404).json({ error: 'Not found' });
  const { passwordHash, ...safe } = updated;
  res.json(safe);
});

router.delete('/:id', requireRole('admin'), async (req, res) => {
  const id = Number(req.params.id);
  if (id === req.user.id) return res.status(400).json({ error: "You can't remove your own account" });
  await db.delete(schema.users).where(and(eq(schema.users.id, id), eq(schema.users.schoolId, req.user.schoolId)));
  res.status(204).end();
});

module.exports = router;
