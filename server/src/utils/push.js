const webpush = require('web-push');
const { eq, inArray, and } = require('drizzle-orm');
const { db, schema } = require('../db');

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@example.com';

const enabled = Boolean(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY);
if (enabled) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

// Sends a web push notification to every parent who should see this announcement, mirroring
// the same audience rule used by the messages feed filter (GET /api/messages):
// no classroom + no studentId -> whole school; studentId -> that student's guardians;
// classroom -> guardians of students in that classroom.
async function notifyNewMessage(message) {
  if (!enabled) return; // VAPID keys not configured — skip silently, nothing to break.

  let targetUserIds = [];

  if (!message.classroom && !message.studentId) {
    const parents = await db
      .select()
      .from(schema.users)
      .where(and(eq(schema.users.schoolId, message.schoolId), eq(schema.users.role, 'parent')));
    targetUserIds = parents.map((u) => u.id);
  } else {
    let matchingStudentIds = [];
    if (message.studentId) {
      matchingStudentIds = [message.studentId];
    } else {
      const students = await db
        .select()
        .from(schema.students)
        .where(eq(schema.students.schoolId, message.schoolId));
      matchingStudentIds = students.filter((s) => s.classroom === message.classroom).map((s) => s.id);
    }

    if (matchingStudentIds.length) {
      const links = await db
        .select()
        .from(schema.guardians)
        .where(inArray(schema.guardians.studentId, matchingStudentIds));
      targetUserIds = [...new Set(links.map((l) => l.userId))];
    }
  }

  if (!targetUserIds.length) return;

  const subs = await db
    .select()
    .from(schema.pushSubscriptions)
    .where(inArray(schema.pushSubscriptions.userId, targetUserIds));

  if (!subs.length) return;

  const payload = JSON.stringify({
    title: message.title || 'New announcement',
    body: message.body.length > 160 ? `${message.body.slice(0, 157)}...` : message.body,
  });

  await Promise.all(
    subs.map((sub) =>
      webpush
        .sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, payload)
        .catch(async (err) => {
          // 404/410 = the browser/OS says this subscription is gone for good — clean it up
          // so we stop wasting sends on it.
          if (err.statusCode === 404 || err.statusCode === 410) {
            await db.delete(schema.pushSubscriptions).where(eq(schema.pushSubscriptions.id, sub.id));
          } else {
            console.error('Push send failed for subscription', sub.id, err.statusCode || err.message);
          }
        })
    )
  );
}

module.exports = { notifyNewMessage, VAPID_PUBLIC_KEY, enabled };
