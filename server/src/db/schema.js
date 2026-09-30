const {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  date,
  time,
  pgEnum,
} = require('drizzle-orm/pg-core');
const { relations } = require('drizzle-orm');

// ---------- Enums ----------
const roleEnum = pgEnum('role', ['admin', 'staff', 'parent']);
const enrollmentStageEnum = pgEnum('enrollment_stage', [
  'inquiry',
  'tour_scheduled',
  'enrolled',
  'waitlisted',
  'withdrawn',
]);

// ---------- Tables ----------
const schools = pgTable('schools', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

const users = pgTable('users', {
  id: serial('id').primaryKey(),
  schoolId: integer('school_id').references(() => schools.id).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  role: roleEnum('role').notNull(),
  phone: varchar('phone', { length: 50 }),
  title: varchar('title', { length: 120 }), // job title for staff
  photoUrl: text('photo_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

const students = pgTable('students', {
  id: serial('id').primaryKey(),
  schoolId: integer('school_id').references(() => schools.id).notNull(),
  firstName: varchar('first_name', { length: 120 }).notNull(),
  lastName: varchar('last_name', { length: 120 }).notNull(),
  dob: date('dob'),
  gender: varchar('gender', { length: 30 }),
  classroom: varchar('classroom', { length: 120 }),
  stage: enrollmentStageEnum('stage').notNull().default('inquiry'),
  allergies: text('allergies'),
  notes: text('notes'),
  photoUrl: text('photo_url'),
  inquiryDate: date('inquiry_date').defaultNow(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Many-to-many link between parent users and students (siblings supported)
const guardians = pgTable('guardians', {
  id: serial('id').primaryKey(),
  studentId: integer('student_id').references(() => students.id, { onDelete: 'cascade' }).notNull(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  relationship: varchar('relationship', { length: 60 }).default('Parent'),
});

const attendance = pgTable('attendance', {
  id: serial('id').primaryKey(),
  studentId: integer('student_id').references(() => students.id, { onDelete: 'cascade' }).notNull(),
  date: date('date').notNull(),
  checkInTime: timestamp('check_in_time'),
  checkOutTime: timestamp('check_out_time'),
  checkedInBy: integer('checked_in_by').references(() => users.id),
  checkedOutBy: integer('checked_out_by').references(() => users.id),
  notes: text('notes'),
});

const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  schoolId: integer('school_id').references(() => schools.id).notNull(),
  authorId: integer('author_id').references(() => users.id).notNull(),
  studentId: integer('student_id').references(() => students.id, { onDelete: 'cascade' }), // null = broader audience
  classroom: varchar('classroom', { length: 120 }), // null + no studentId = whole-school broadcast
  title: varchar('title', { length: 255 }),
  body: text('body').notNull(),
  photoUrl: text('photo_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ---------- Relations (for query convenience) ----------
const usersRelations = relations(users, ({ many, one }) => ({
  school: one(schools, { fields: [users.schoolId], references: [schools.id] }),
  guardianLinks: many(guardians),
}));

const studentsRelations = relations(students, ({ many, one }) => ({
  school: one(schools, { fields: [students.schoolId], references: [schools.id] }),
  guardianLinks: many(guardians),
  attendance: many(attendance),
  messages: many(messages),
}));

const guardiansRelations = relations(guardians, ({ one }) => ({
  student: one(students, { fields: [guardians.studentId], references: [students.id] }),
  user: one(users, { fields: [guardians.userId], references: [users.id] }),
}));

const attendanceRelations = relations(attendance, ({ one }) => ({
  student: one(students, { fields: [attendance.studentId], references: [students.id] }),
}));

const messagesRelations = relations(messages, ({ one }) => ({
  student: one(students, { fields: [messages.studentId], references: [students.id] }),
  author: one(users, { fields: [messages.authorId], references: [users.id] }),
}));

module.exports = {
  roleEnum,
  enrollmentStageEnum,
  schools,
  users,
  students,
  guardians,
  attendance,
  messages,
  usersRelations,
  studentsRelations,
  guardiansRelations,
  attendanceRelations,
  messagesRelations,
};
