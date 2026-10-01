// One-off migration for existing (already-seeded) live databases, to bring them up to date
// with the new classrooms / push notifications / billing features without touching existing
// schools, users, students, attendance, or messages data.
//
// Safe to run once against a database that already has `npm run db:push` applied (so the new
// tables/columns exist) and was previously seeded by the original seed.js. It is written to be
// safe to re-run: each step checks for existing rows before creating anything.
//
// Usage (from the server/ folder, with DATABASE_URL pointed at your Supabase database):
//   npm run db:push        # creates the new tables/columns
//   node src/db/migrate-v2.js

require('dotenv').config();
const { eq, isNull, and } = require('drizzle-orm');
const { db, schema, pool } = require('./index');

async function run() {
  const [school] = await db.select().from(schema.schools).limit(1);
  if (!school) {
    console.log('No school found — nothing to migrate (run db:seed first if this is a fresh database).');
    return;
  }
  console.log(`Migrating data for school: ${school.name} (id ${school.id})`);

  // ---------- 1. Classrooms: create from distinct existing students.classroom text values ----------
  const existingClassrooms = await db
    .select()
    .from(schema.classrooms)
    .where(eq(schema.classrooms.schoolId, school.id));

  const classroomByName = new Map(existingClassrooms.map((c) => [c.name, c]));

  const students = await db.select().from(schema.students).where(eq(schema.students.schoolId, school.id));
  const distinctNames = [...new Set(students.map((s) => s.classroom).filter(Boolean))];

  const colorPalette = ['#f97316', '#0ea5a4', '#eab308', '#ec4899', '#6366f1', '#22c55e'];
  let colorIdx = 0;
  for (const name of distinctNames) {
    if (classroomByName.has(name)) continue;
    const [created] = await db
      .insert(schema.classrooms)
      .values({ schoolId: school.id, name, color: colorPalette[colorIdx % colorPalette.length] })
      .returning();
    classroomByName.set(name, created);
    colorIdx += 1;
    console.log(`  created classroom "${name}"`);
  }

  // ---------- 2. Backfill students.classroomId from the (still-present) classroom text field ----------
  let backfilled = 0;
  for (const s of students) {
    if (s.classroomId || !s.classroom) continue;
    const classroom = classroomByName.get(s.classroom);
    if (!classroom) continue;
    await db.update(schema.students).set({ classroomId: classroom.id }).where(eq(schema.students.id, s.id));
    backfilled += 1;
  }
  console.log(`  backfilled classroomId on ${backfilled} student(s)`);

  // ---------- 3. Fee plans — only create if none exist yet for this school ----------
  const existingPlans = await db.select().from(schema.feePlans).where(eq(schema.feePlans.schoolId, school.id));
  let monthlyTuition = existingPlans.find((p) => p.name === 'Monthly Tuition');
  let annualActivity = existingPlans.find((p) => p.name === 'Annual Activity Fee');

  if (!monthlyTuition) {
    [monthlyTuition] = await db
      .insert(schema.feePlans)
      .values({
        schoolId: school.id,
        name: 'Monthly Tuition',
        amount: '8500.00',
        frequency: 'monthly',
        description: 'Standard full-day monthly tuition fee.',
      })
      .returning();
    console.log('  created fee plan "Monthly Tuition"');
  }
  if (!annualActivity) {
    [annualActivity] = await db
      .insert(schema.feePlans)
      .values({
        schoolId: school.id,
        name: 'Annual Activity Fee',
        amount: '3000.00',
        frequency: 'annual',
        description: 'Covers field trips, art supplies, and sports day.',
      })
      .returning();
    console.log('  created fee plan "Annual Activity Fee"');
  }

  // ---------- 4. Sample invoices — only if this school has none yet ----------
  const existingInvoices = await db.select().from(schema.invoices).where(eq(schema.invoices.schoolId, school.id));
  if (existingInvoices.length === 0) {
    const enrolled = students.filter((s) => s.stage === 'enrolled');
    const addDays = (days) => {
      const d = new Date();
      d.setDate(d.getDate() + days);
      return d.toISOString().slice(0, 10);
    };
    const today = new Date().toISOString().slice(0, 10);
    for (let i = 0; i < enrolled.length; i++) {
      const s = enrolled[i];
      const dueDate = i % 3 === 0 ? addDays(-10) : addDays(10 + i);
      const status = i % 3 === 1 ? 'paid' : 'unpaid';
      await db.insert(schema.invoices).values({
        schoolId: school.id,
        studentId: s.id,
        feePlanId: monthlyTuition.id,
        description: monthlyTuition.name,
        amount: monthlyTuition.amount,
        status,
        dueDate,
        paidDate: status === 'paid' ? today : null,
      });
    }
    console.log(`  created ${enrolled.length} sample invoice(s)`);
  } else {
    console.log(`  skipping sample invoices — ${existingInvoices.length} already exist for this school`);
  }

  console.log('Migration complete.');
}

run()
  .then(() => pool.end())
  .catch((err) => {
    console.error(err);
    pool.end();
    process.exit(1);
  });
