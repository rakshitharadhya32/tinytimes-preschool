require('dotenv').config();

const url = process.env.DATABASE_URL || '';
const looksHosted = /supabase\.co|render\.com|neon\.tech|amazonaws\.com/.test(url);
const sslEnv = process.env.PGSSL;
const useSSL = sslEnv ? sslEnv === 'true' : looksHosted;

/** @type {import('drizzle-kit').Config} */
module.exports = {
  schema: './src/db/schema.js',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL,
    ssl: useSSL ? 'require' : false,
  },
};
