require('dotenv').config();
const { Pool } = require('pg');
const { drizzle } = require('drizzle-orm/node-postgres');
const schema = require('./schema');

// Hosted Postgres providers (Supabase, Render, Neon, etc.) require SSL.
// Auto-detect common hosted hostnames, or force it explicitly with PGSSL=true/false.
const url = process.env.DATABASE_URL || '';
const looksHosted = /supabase\.co|render\.com|neon\.tech|amazonaws\.com/.test(url);
const sslEnv = process.env.PGSSL;
const useSSL = sslEnv ? sslEnv === 'true' : looksHosted;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: useSSL ? { rejectUnauthorized: false } : false,
});

const db = drizzle(pool, { schema });

module.exports = { db, pool, schema };
