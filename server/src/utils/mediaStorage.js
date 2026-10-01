const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const uploadDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const SUPABASE_URL = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET || 'media';
const useSupabase = Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);

function randomName(originalname) {
  const ext = path.extname(originalname || '') || '';
  return `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
}

// Stores an uploaded file (from multer's memoryStorage — req.file.buffer) and returns a URL
// to save on the record (photoUrl, etc).
//
// - If SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are set, uploads to Supabase Storage via its
//   plain REST API (no SDK needed) and returns the bucket's public URL. This is what makes
//   photos survive a Render redeploy/restart, since Render's own disk is ephemeral.
// - Otherwise falls back to writing the file to the local /uploads folder, served statically —
//   fine for local dev, but NOT persistent on Render's free tier.
async function storeFile(file) {
  if (!file) return null;
  const name = randomName(file.originalname);

  if (useSupabase) {
    const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${SUPABASE_BUCKET}/${name}`;
    const resp = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': file.mimetype || 'application/octet-stream',
        'x-upsert': 'true',
      },
      body: file.buffer,
    });
    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      throw new Error(`Supabase Storage upload failed (${resp.status}): ${text}`);
    }
    return `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_BUCKET}/${name}`;
  }

  fs.writeFileSync(path.join(uploadDir, name), file.buffer);
  return `/uploads/${name}`;
}

module.exports = { storeFile, uploadDir, useSupabase };
