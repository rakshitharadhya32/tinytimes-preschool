require('dotenv').config();
const bcrypt = require('bcryptjs');
const { db, schema, pool } = require('./index');

async function seed() {
  console.log('Seeding demo data...');

  const [school] = await db
    .insert(schema.schools)
    .values({ name: 'TinyTimes Preschool' })
    .returning();

  const passwordHash = await bcrypt.hash('password123', 10);

  const [admin] = await db
    .insert(schema.users)
    .values({
      schoolId: school.id,
      name: 'Anitha',
      email: 'admin@tinytimes.demo',
      passwordHash,
      role: 'admin',
      title: 'Director',
      phone: '+91 90000 00001',
    })
    .returning();

  const [staff1] = await db
    .insert(schema.users)
    .values({
      schoolId: school.id,
      name: 'Meera Nair',
      email: 'staff@tinytimes.demo',
      passwordHash,
      role: 'staff',
      title: 'Lead Teacher, Sunflower Room',
      phone: '+91 90000 00002',
    })
    .returning();

  const [staff2] = await db
    .insert(schema.users)
    .values({
      schoolId: school.id,
      name: 'Rohan Das',
      email: 'staff2@tinytimes.demo',
      passwordHash,
      role: 'staff',
      title: 'Lead Teacher, Daisy Room',
      phone: '+91 90000 00004',
    })
    .returning();

  // ---------- Classrooms (first-class, with capacity + assigned teacher) ----------
  const classroomDefs = [
    { name: 'Sunflower Room', capacity: 12, teacherId: staff1.id, color: '#f97316' },
    { name: 'Daisy Room', capacity: 10, teacherId: staff2.id, color: '#0ea5a4' },
    { name: 'Marigold Room', capacity: 10, teacherId: null, color: '#eab308' },
  ];
  const classroomRows = [];
  for (const def of classroomDefs) {
    const [row] = await db
      .insert(schema.classrooms)
      .values({ schoolId: school.id, ...def })
      .returning();
    classroomRows.push(row);
  }

  const stages = ['inquiry', 'tour_scheduled', 'enrolled', 'enrolled', 'enrolled', 'waitlisted'];
  const firstNames = ['Aarav', 'Diya', 'Ishaan', 'Myra', 'Vihaan', 'Ananya', 'Kabir', 'Saanvi', 'Reyansh', 'Aadhya', 'Arjun', 'Zara'];
  const lastNames = ['Sharma', 'Patel', 'Reddy', 'Gupta', 'Iyer', 'Menon', 'Khan', 'Chatterjee'];

  const students = [];
  for (let i = 0; i < 12; i++) {
    const stage = stages[i % stages.length];
    const classroomRow = stage === 'enrolled' ? classroomRows[i % classroomRows.length] : null;
    const [student] = await db
      .insert(schema.students)
      .values({
        schoolId: school.id,
        firstName: firstNames[i],
        lastName: lastNames[i % lastNames.length],
        dob: `202${1 + (i % 3)}-0${1 + (i % 9) % 9}-1${i % 9}`,
        gender: i % 2 === 0 ? 'Female' : 'Male',
        classroomId: classroomRow ? classroomRow.id : null,
        classroom: classroomRow ? classroomRow.name : null,
        stage,
        allergies: i % 5 === 0 ? 'Peanuts' : null,
        notes: null,
      })
      .returning();
    students.push(student);
  }

  // Create one demo parent linked to the first two enrolled students
  const enrolled = students.filter((s) => s.stage === 'enrolled');
  const [parent] = await db
    .insert(schema.users)
    .values({
      schoolId: school.id,
      name: 'Rakshith Kumar',
      email: 'parent@tinytimes.demo',
      passwordHash,
      role: 'parent',
      phone: '+91 90000 00003',
    })
    .returning();

  for (const s of enrolled.slice(0, 2)) {
    await db.insert(schema.guardians).values({ studentId: s.id, userId: parent.id, relationship: 'Parent' });
  }

  const today = new Date().toISOString().slice(0, 10);
  for (const s of enrolled) {
    const checkedIn = Math.random() > 0.3;
    await db.insert(schema.attendance).values({
      studentId: s.id,
      date: today,
      checkInTime: checkedIn ? new Date(new Date().setHours(8, Math.floor(Math.random() * 30))) : null,
      checkedInBy: checkedIn ? staff1.id : null,
    });
  }

  await db.insert(schema.messages).values([
    {
      schoolId: school.id,
      authorId: admin.id,
      title: 'Welcome back!',
      body: 'Excited to kick off the new term. Please make sure water bottles are labeled with your child\'s name.',
    },
    {
      schoolId: school.id,
      authorId: staff1.id,
      classroom: 'Sunflower Room',
      title: 'Art day tomorrow',
      body: 'Sunflower Room will be doing finger painting tomorrow — old clothes recommended!',
    },
    {
      schoolId: school.id,
      authorId: staff1.id,
      studentId: enrolled[0]?.id,
      title: 'Great day today',
      body: `${enrolled[0]?.firstName} had a wonderful day, shared toys nicely during free play and took a full nap.`,
    },
  ]);

  // ---------- Billing ----------
  const [monthlyTuition] = await db
    .insert(schema.feePlans)
    .values({
      schoolId: school.id,
      name: 'Monthly Tuition',
      amount: '8500.00',
      frequency: 'monthly',
      description: 'Standard full-day monthly tuition fee.',
    })
    .returning();

  const [annualActivity] = await db
    .insert(schema.feePlans)
    .values({
      schoolId: school.id,
      name: 'Annual Activity Fee',
      amount: '3000.00',
      frequency: 'annual',
      description: 'Covers field trips, art supplies, and sports day.',
    })
    .returning();

  const addDays = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  };

  for (let i = 0; i < enrolled.length; i++) {
    const s = enrolled[i];
    // Mix of paid, unpaid (due soon), and overdue invoices for a realistic-looking demo.
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
  // One annual activity fee invoice for the demo parent's first child
  if (enrolled[0]) {
    await db.insert(schema.invoices).values({
      schoolId: school.id,
      studentId: enrolled[0].id,
      feePlanId: annualActivity.id,
      description: annualActivity.name,
      amount: annualActivity.amount,
      status: 'unpaid',
      dueDate: addDays(30),
    });
  }

  console.log('Seed complete.');
  console.log('Demo logins (password: password123):');
  console.log('  admin@tinytimes.demo   (admin)');
  console.log('  staff@tinytimes.demo   (staff)');
  console.log('  parent@tinytimes.demo  (parent)');
}

seed()
  .then(() => pool.end())
  .catch((err) => {
    console.error(err);
    pool.end();
    process.exit(1);
  });
