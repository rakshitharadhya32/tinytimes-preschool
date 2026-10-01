const {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  date,
  time,
  boolean,
  numeric,
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
const feeFrequencyEnum = pgEnum('fee_frequency', ['one_time', 'monthly', 'quarterly', 'annual']);
const invoiceStatusEnum = pgEnum('invoice_status', ['unpaid', 'paid', 'overdue', 'cancelled']);

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

// Classrooms as a first-class concept: capacity, assigned teacher, a color for UI chips.
const classrooms = pgTable('classrooms', {
  id: serial('id').primaryKey(),
  schoolId: integer('school_id').references(() => schools.id).notNull(),
  name: varchar('name', { length: 120 }).notNull(),
  capacity: integer('capacity'),
  teacherId: integer('teacher_id').references(() => users.id),
  color: varchar('color', { length: 20 }).default('#f97316'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

const students = pgTable('students', {
  id: serial('id').primaryKey(),
  schoolId: integer('school_id').references(() => schools.id).notNull(),
  firstName: varchar('first_name', { length: 120 }).notNull(),
  lastName: varchar('last_name', { length: 120 }).notNull(),
  dob: date('dob'),
  gender: varchar('gender', { length: 30 }),
  // Deprecated free-text classroom name — kept for backward compatibility with existing data;
  // new code should use classroomId. Nullable, no longer written by new code paths.
  classroom: varchar('classroom', { length: 120 }),
  classroomId: integer('classroom_id').references(() => classrooms.id),
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

// Web push subscriptions — one row per browser/device a parent (or staff) enabled notifications on.
const pushSubscriptions = pgTable('push_subscriptions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  endpoint: text('endpoint').notNull().unique(),
  p256dh: text('p256dh').notNull(),
  auth: text('auth').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ---------- Billing ----------
const feePlans = pgTable('fee_plans', {
  id: serial('id').primaryKey(),
  schoolId: integer('school_id').references(() => schools.id).notNull(),
  name: varchar('name', { length: 150 }).notNull(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  frequency: feeFrequencyEnum('frequency').notNull().default('monthly'),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

const invoices = pgTable('invoices', {
  id: serial('id').primaryKey(),
  schoolId: integer('school_id').references(() => schools.id).notNull(),
  studentId: integer('student_id').references(() => students.id, { onDelete: 'cascade' }).notNull(),
  feePlanId: integer('fee_plan_id').references(() => feePlans.id),
  description: varchar('description', { length: 255 }).notNull(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  status: invoiceStatusEnum('status').notNull().default('unpaid'),
  issuedDate: date('issued_date').defaultNow().notNull(),
  dueDate: date('due_date').notNull(),
  paidDate: date('paid_date'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ---------- Relations (for query convenience) ----------
const usersRelations = relations(users, ({ many, one }) => ({
  school: one(schools, { fields: [users.schoolId], references: [schools.id] }),
  guardianLinks: many(guardians),
  pushSubscriptions: many(pushSubscriptions),
}));

const classroomsRelations = relations(classrooms, ({ one, many }) => ({
  school: one(schools, { fields: [classrooms.schoolId], references: [schools.id] }),
  teacher: one(users, { fields: [classrooms.teacherId], references: [users.id] }),
  students: many(students),
}));

const studentsRelations = relations(students, ({ many, one }) => ({
  school: one(schools, { fields: [students.schoolId], references: [schools.id] }),
  classroomRef: one(classrooms, { fields: [students.classroomId], references: [classrooms.id] }),
  guardianLinks: many(guardians),
  attendance: many(attendance),
  messages: many(messages),
  invoices: many(invoices),
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

const pushSubscriptionsRelations = relations(pushSubscriptions, ({ one }) => ({
  user: one(users, { fields: [pushSubscriptions.userId], references: [users.id] }),
}));

const feePlansRelations = relations(feePlans, ({ many }) => ({
  invoices: many(invoices),
}));

const invoicesRelations = relations(invoices, ({ one }) => ({
  student: one(students, { fields: [invoices.studentId], references: [students.id] }),
  feePlan: one(feePlans, { fields: [invoices.feePlanId], references: [feePlans.id] }),
}));

module.exports = {
  roleEnum,
  enrollmentStageEnum,
  feeFrequencyEnum,
  invoiceStatusEnum,
  schools,
  users,
  classrooms,
  students,
  guardians,
  attendance,
  messages,
  pushSubscriptions,
  feePlans,
  invoices,
  usersRelations,
  classroomsRelations,
  studentsRelations,
  guardiansRelations,
  attendanceRelations,
  messagesRelations,
  pushSubscriptionsRelations,
  feePlansRelations,
  invoicesRelations,
};
