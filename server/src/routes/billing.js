const express = require('express');
const { eq, and } = require('drizzle-orm');
const { db, schema } = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// ---------- Fee plans ----------
router.get('/plans', requireRole('admin', 'staff'), async (req, res) => {
  const rows = await db
    .select()
    .from(schema.feePlans)
    .where(eq(schema.feePlans.schoolId, req.user.schoolId));
  res.json(rows);
});

router.post('/plans', requireRole('admin'), async (req, res) => {
  try {
    const { name, amount, frequency, description } = req.body;
    if (!name || amount == null) {
      return res.status(400).json({ error: 'name and amount are required' });
    }
    const [created] = await db
      .insert(schema.feePlans)
      .values({
        schoolId: req.user.schoolId,
        name,
        amount: String(amount),
        frequency: frequency || 'monthly',
        description: description || null,
      })
      .returning();
    res.status(201).json(created);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create fee plan' });
  }
});

router.patch('/plans/:id', requireRole('admin'), async (req, res) => {
  const id = Number(req.params.id);
  const allowed = ['name', 'amount', 'frequency', 'description'];
  const updates = {};
  for (const key of allowed) {
    if (key in req.body) updates[key] = key === 'amount' ? String(req.body[key]) : req.body[key];
  }
  const [updated] = await db
    .update(schema.feePlans)
    .set(updates)
    .where(and(eq(schema.feePlans.id, id), eq(schema.feePlans.schoolId, req.user.schoolId)))
    .returning();
  if (!updated) return res.status(404).json({ error: 'Not found' });
  res.json(updated);
});

router.delete('/plans/:id', requireRole('admin'), async (req, res) => {
  const id = Number(req.params.id);
  await db
    .delete(schema.feePlans)
    .where(and(eq(schema.feePlans.id, id), eq(schema.feePlans.schoolId, req.user.schoolId)));
  res.status(204).end();
});

// ---------- Invoices ----------
// Admin/staff see every invoice for the school (optionally filtered); parents only ever see
// invoices for their own linked children.
router.get('/invoices', async (req, res) => {
  try {
    let studentIds = null;
    if (req.user.role === 'parent') {
      const links = await db
        .select()
        .from(schema.guardians)
        .where(eq(schema.guardians.userId, req.user.id));
      studentIds = links.map((l) => l.studentId);
      if (!studentIds.length) return res.json([]);
    }

    let rows = await db
      .select({
        id: schema.invoices.id,
        studentId: schema.invoices.studentId,
        feePlanId: schema.invoices.feePlanId,
        description: schema.invoices.description,
        amount: schema.invoices.amount,
        status: schema.invoices.status,
        issuedDate: schema.invoices.issuedDate,
        dueDate: schema.invoices.dueDate,
        paidDate: schema.invoices.paidDate,
        notes: schema.invoices.notes,
        createdAt: schema.invoices.createdAt,
        studentFirstName: schema.students.firstName,
        studentLastName: schema.students.lastName,
      })
      .from(schema.invoices)
      .innerJoin(schema.students, eq(schema.invoices.studentId, schema.students.id))
      .where(eq(schema.invoices.schoolId, req.user.schoolId));

    if (studentIds) rows = rows.filter((r) => studentIds.includes(r.studentId));
    if (req.query.studentId) rows = rows.filter((r) => r.studentId === Number(req.query.studentId));

    // Surface a derived "overdue" status for display without needing a cron job — an unpaid
    // invoice past its due date reads as overdue, but the stored status only ever changes via
    // an explicit admin action (mark paid / cancel).
    const today = new Date().toISOString().slice(0, 10);
    rows = rows.map((r) => ({
      ...r,
      status: r.status === 'unpaid' && r.dueDate < today ? 'overdue' : r.status,
    }));

    if (req.query.status) rows = rows.filter((r) => r.status === req.query.status);

    rows.sort((a, b) => (a.dueDate < b.dueDate ? 1 : -1));
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to list invoices' });
  }
});

router.post('/invoices', requireRole('admin', 'staff'), async (req, res) => {
  try {
    const { studentId, feePlanId, description, amount, dueDate, notes } = req.body;
    if (!studentId || !dueDate) {
      return res.status(400).json({ error: 'studentId and dueDate are required' });
    }

    let finalAmount = amount;
    let finalDescription = description;
    if (feePlanId && (finalAmount == null || !finalDescription)) {
      const [plan] = await db.select().from(schema.feePlans).where(eq(schema.feePlans.id, Number(feePlanId)));
      if (plan) {
        finalAmount = finalAmount ?? plan.amount;
        finalDescription = finalDescription || plan.name;
      }
    }
    if (finalAmount == null) {
      return res.status(400).json({ error: 'amount is required (directly, or via feePlanId)' });
    }

    const [created] = await db
      .insert(schema.invoices)
      .values({
        schoolId: req.user.schoolId,
        studentId: Number(studentId),
        feePlanId: feePlanId ? Number(feePlanId) : null,
        description: finalDescription || 'Fee',
        amount: String(finalAmount),
        dueDate,
        notes: notes || null,
      })
      .returning();
    res.status(201).json(created);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create invoice' });
  }
});

router.patch('/invoices/:id', requireRole('admin', 'staff'), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const allowed = ['description', 'amount', 'status', 'dueDate', 'notes'];
    const updates = {};
    for (const key of allowed) {
      if (key in req.body) updates[key] = key === 'amount' ? String(req.body[key]) : req.body[key];
    }
    if (updates.status === 'paid') updates.paidDate = new Date().toISOString().slice(0, 10);
    if (updates.status === 'unpaid') updates.paidDate = null;

    const [updated] = await db
      .update(schema.invoices)
      .set(updates)
      .where(and(eq(schema.invoices.id, id), eq(schema.invoices.schoolId, req.user.schoolId)))
      .returning();
    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update invoice' });
  }
});

router.delete('/invoices/:id', requireRole('admin'), async (req, res) => {
  const id = Number(req.params.id);
  await db
    .delete(schema.invoices)
    .where(and(eq(schema.invoices.id, id), eq(schema.invoices.schoolId, req.user.schoolId)));
  res.status(204).end();
});

module.exports = router;
