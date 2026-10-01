const express = require('express');
const { eq } = require('drizzle-orm');
const { db, schema } = require('../db');
const { requireAuth } = require('../middleware/auth');
const { VAPID_PUBLIC_KEY, enabled } = require('../utils/push');

const router = express.Router();

// Public (no auth) so the frontend can check whether push is configured at all before
// showing an "enable notifications" control.
router.get('/vapid-public-key', (req, res) => {
  res.json({ publicKey: enabled ? VAPID_PUBLIC_KEY : null, enabled });
});

router.use(requireAuth);

router.post('/subscribe', async (req, res) => {
  try {
    const { endpoint, keys } = req.body || {};
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ error: 'Invalid subscription payload' });
    }
    const [existing] = await db
      .select()
      .from(schema.pushSubscriptions)
      .where(eq(schema.pushSubscriptions.endpoint, endpoint));

    if (existing) {
      await db
        .update(schema.pushSubscriptions)
        .set({ userId: req.user.id, p256dh: keys.p256dh, auth: keys.auth })
        .where(eq(schema.pushSubscriptions.id, existing.id));
    } else {
      await db.insert(schema.pushSubscriptions).values({
        userId: req.user.id,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
      });
    }
    res.status(201).json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save subscription' });
  }
});

router.post('/unsubscribe', async (req, res) => {
  const { endpoint } = req.body || {};
  if (endpoint) {
    await db.delete(schema.pushSubscriptions).where(eq(schema.pushSubscriptions.endpoint, endpoint));
  }
  res.status(204).end();
});

module.exports = router;
