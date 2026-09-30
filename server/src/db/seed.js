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
      email: 'admin@kriyo.demo',
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
      email: 'staff@kriyo.demo',
      passwordHash,
      role: 'staff',
      title: 'Lead Teacher, Sunflower Room',
      phone: '+91 90000 00002',
    })
    .returning();

  const classrooms = ['Sunflower Room', 'Daisy Room', 'Marigold Room'];
  const stages = ['inquiry', 'tour_scheduled', 'enrolled', 'enrolled', 'enrolled', 'waitlisted'];
  const firstNames = ['Aarav', 'Diya', 'Ishaan', 'Myra', 'Vihaan', 'Ananya', 'Kabir', 'Saanvi', 'Reyansh', 'Aadhya', 'Arjun', 'Zara'];
  const lastNames = ['Sharma', 'Patel', 'Reddy', 'Gupta', 'Iyer', 'Menon', 'Khan', 'Chatterjee'];

  const students = [];
  for (let i = 0; i < 12; i++) {
    const stage = stages[i % stages.length];
    const [student] = await db
      .insert(schema.students)
      .values({
        schoolId: school.id,
        firstName: firstNames[i],
        lastName: lastNames[i % lastNames.length],
        dob: `202${1 + (i % 3)}-0${1 + (i % 9) % 9}-1${i % 9}`,
        gender: i % 2 === 0 ? 'Female' : 'Male',
        classroom: stage === 'enrolled' ? classrooms[i % classrooms.length] : null,
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
      email: 'parent@kriyo.demo',
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

  console.log('Seed complete.');
  console.log('Demo logins (password: password123):');
  console.log('  admin@kriyo.demo   (admin)');
  console.log('  staff@kriyo.demo   (staff)');
  console.log('  parent@kriyo.demo  (parent)');
}

seed()
  .then(() => pool.end())
  .catch((err) => {
    console.error(err);
    pool.end();
    process.exit(1);
  });
