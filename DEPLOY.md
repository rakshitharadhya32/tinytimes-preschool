# Deploying TinyTimes Preschool for free

This stack keeps everything on free tiers, with no credit card needed for any of the three
services:

- **Database** → [Supabase](https://supabase.com) (free Postgres)
- **Backend API** → [Render](https://render.com) (free web service)
- **Frontend** → [Vercel](https://vercel.com) (free static hosting)

You'll need a GitHub account too, since both Render and Vercel deploy by connecting to a repo.

Total time: ~20 minutes, most of it waiting for the first deploys to finish.

---

## 1. Push the code to GitHub

If you haven't already:

```bash
cd kriyo-app
git add -A
git commit -m "Initial commit"
```

Then create a new **empty** repo on [github.com/new](https://github.com/new) (don't add a
README/gitignore there), and push:

```bash
git remote add origin https://github.com/<your-username>/<your-repo>.git
git branch -M main
git push -u origin main
```

## 2. Create the database on Supabase

1. Sign up at [supabase.com](https://supabase.com) and create a new project (pick any region
   close to you). Save the database password you set — you'll need it.
2. Once the project is ready, go to **Project Settings → Database → Connection string**, and
   copy the **URI** under **Connection pooling → Session mode** (port `6543` or `5432` depending
   on what Supabase shows you — Session mode avoids issues with prepared statements). It looks
   like:
   ```
   postgresql://postgres.xxxxxxxxxxxx:[YOUR-PASSWORD]@aws-0-xx-xxxx-1.pooler.supabase.com:5432/postgres
   ```
   Replace `[YOUR-PASSWORD]` with the password you set in step 1.

## 3. Create the tables and seed demo data

Do this once, from your own machine, pointed at the Supabase database:

```bash
cd server
npm install
```

Edit `.env` (or copy from `.env.example`) and set:

```
DATABASE_URL=<the Supabase connection string from step 2>
JWT_SECRET=<any long random string>
PGSSL=true
```

Then run:

```bash
npm run db:push     # creates all tables in Supabase
npm run db:seed     # loads the demo school, users, students, attendance, announcements
```

Check the Supabase dashboard's **Table Editor** — you should see `schools`, `users`, `students`,
etc. populated.

## 4. Deploy the backend to Render

1. Sign up at [render.com](https://render.com) and connect your GitHub account.
2. Click **New → Blueprint**, pick your repo — Render will pick up `render.yaml` at the root
   automatically and propose a `tinytimes-api` web service.
3. Before deploying, you'll be prompted for the env vars marked `sync: false`:
   - `DATABASE_URL` → the same Supabase connection string from step 2
   - `CORS_ORIGIN` → leave blank for now, you'll fill this in after step 5
4. Deploy. The first build takes a couple of minutes. Once live, Render gives you a URL like
   `https://tinytimes-api.onrender.com`. Test it:
   ```bash
   curl https://tinytimes-api.onrender.com/api/health
   # {"ok":true,"service":"kriyo-server"}
   ```

   **Free-tier note**: a free Render web service spins down after 15 minutes of no traffic. The
   next request wakes it up but takes 30–50 seconds — expected behavior, not a bug.

## 5. Deploy the frontend to Vercel

1. Sign up at [vercel.com](https://vercel.com) and connect your GitHub account.
2. **Add New → Project**, pick the same repo. When asked for the **root directory**, choose
   `web`. Vercel should auto-detect Vite and pick up `vercel.json`.
3. Under **Environment Variables**, add:
   ```
   VITE_API_URL = https://tinytimes-api.onrender.com
   ```
   (your actual Render URL from step 4, no trailing slash).
4. Deploy. You'll get a URL like `https://your-app.vercel.app`.

## 6. Lock down CORS (optional but recommended)

Back in Render, open the `tinytimes-api` service → **Environment**, and set:

```
CORS_ORIGIN = https://your-app.vercel.app
```

Save — Render redeploys automatically. This makes the API only accept requests from your
frontend's domain instead of any origin.

## 7. Try it

Open your Vercel URL and log in with the seeded demo accounts (password `password123` for all):

| Role   | Email               |
|--------|---------------------|
| Admin  | admin@tinytimes.demo    |
| Staff  | staff@tinytimes.demo    |
| Parent | parent@tinytimes.demo   |

---

## Known free-tier limitations

- **Cold starts**: Render's free web service sleeps after 15 minutes of inactivity; the first
  request after that takes 30–50 seconds to wake it up.
- **Uploaded photos are not persistent**: Render's free tier has an ephemeral filesystem, so
  photos uploaded via Announcements (or student profile photos) are lost on redeploy or when the
  service restarts. For a real deployment, swap the local disk storage in
  `server/src/utils/upload.js` for Supabase Storage (or S3/Cloudinary) — the rest of the app
  doesn't need to change, since photos are just stored as a URL string on each record.
- **Supabase free tier** pauses a project after a week of no API requests; visiting the dashboard
  or hitting the API wakes it back up within a minute or two.

## Redeploying after code changes

Both Render and Vercel auto-deploy on every push to `main`:

```bash
git add -A
git commit -m "Your change"
git push
```
