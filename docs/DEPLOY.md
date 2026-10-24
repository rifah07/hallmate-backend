# Deploy the HallMate API for free (no credit card)

About an hour. Everything here is free and asks for no card: **Vercel** (the API), **Neon** (PostgreSQL, you already have it), **Cloudinary** (images and PDFs), **Resend** (email), and optionally **SSLCommerz sandbox** (payments).

Do the steps in order. Each one ends with a check, so you know it worked before moving on.

> The web app isn't built yet. Deploy the API now; when the web app is live, come back to step 7 to point the two at each other.

---

## Step 0: Make sure it works on your machine (10 min)

```bash
cd "/home/rifah/Desktop/Mern and Pern/hallmate-backend"
git status --short            # should be empty: deploy only committed code
npm run test:db && npm test && docker stop hallmate-test-db
npm run build && npm start    # http://localhost:5000/health, then Ctrl+C
```

**Check:** tests pass (except the 5 profile-picture tests, which need real Cloudinary keys) and `/health` answers.

## Step 1: Generate the secrets (2 min)

Run this three times and keep the three outputs in a notes app for the next steps:

```bash
openssl rand -hex 32
```

| Use | Becomes |
|---|---|
| 1st | `JWT_SECRET` |
| 2nd | `JWT_REFRESH_SECRET` (must differ from the first) |
| 3rd | `INTERNAL_API_KEY` (the web app will use the same one) |

Put the first two in your local `.env` as well. The API now refuses to start with secrets shorter than 32 characters.

## Step 2: Database, on Neon (10 min)

1. Open [console.neon.tech](https://console.neon.tech), choose your project, then **Connect**.
2. Copy two connection strings:
   - **Pooled** (the host contains `-pooler`): this becomes `DATABASE_URL`, used by the app.
   - **Direct** (switch "Connection pooling" off): this becomes `DIRECT_URL`, used for migrations.
3. Put both in your local `.env`, then create the tables in Neon:

```bash
npx prisma migrate status     # should say "Database schema is up to date"
npx prisma migrate deploy     # only if status lists migrations not applied yet
```

> All 11 migrations were already applied to Neon on 2026-10-23 (by accident, while preparing the test database; see the note at the end). `migrate status` should confirm it, so this step is a check.

4. Seed the first super admin and the hall's public content. In your local `.env`, set `SUPER_ADMIN_EMAIL` and a strong `SUPER_ADMIN_PASSWORD` (12+ characters). Keep your real Cloudinary keys in `.env` too: the seed copies the hall's photos and notice PDFs from hall.jnu.ac.bd into your Cloudinary, so the new site doesn't depend on the old server.

```bash
npm run db:seed
```

**Check:** it prints `Super Admin created successfully` (university ID `0000000000`) and `Hall content: 3 provosts, 4 house tutors, 1 staff, 9 facilities, 3 notices, 22 photos`. Running it again is safe: both parts skip themselves. Remove `SUPER_ADMIN_PASSWORD` from `.env` afterwards.

The content comes from `prisma/data/hall-content.json` (sources listed at its top). After seeding, the hall edits it through the admin API, never through the file.

> If `migrate deploy` stops on a unique-index error for `room_occupants_userId_key`, a student has two beds in the old data. Open `npx prisma studio`, delete one of her `room_occupants` rows, and run it again.

## Step 3: Cloudinary (5 min)

Use your existing Cloudinary account (or create a free one at [cloudinary.com](https://cloudinary.com)). The dashboard shows **Cloud name**, **API key** and **API secret**.

## Step 4: Email, with Resend (5 min)

1. Sign up at [resend.com](https://resend.com) (free, no card) with the email you want test mail to reach.
2. **API Keys → Create API key** (permission: sending access).

| Variable | Value |
|---|---|
| `RESEND_API_KEY` | the key |
| `EMAIL_FROM` | leave empty (uses `onboarding@resend.dev`) |
| `EMAIL_FROM_NAME` | `HallMate` |

> **The limit to know:** until you verify a domain you own in Resend (**Domains → Add domain**, then add the DNS records it shows), Resend delivers **only to your own Resend account address**. Students won't receive emails yet. HallMate handles this: when a one-time password can't be emailed, the provost's screen shows it once so the office can hand it over in person. Password-reset codes still need email: until a domain is verified, a resident who forgets her password can't reset it herself. A `*.vercel.app` address can't be verified because you don't control its DNS. A cheap domain later fixes this: verify it, set `EMAIL_FROM=no-reply@yourdomain`, redeploy.

## Step 5: Deploy the API on Vercel (15 min)

1. Push your branch, open the pull request on GitHub and merge it into `master`.
2. On [vercel.com](https://vercel.com): **Add New → Project → import `hallmate-backend`**.
3. **Framework Preset: Other.** Leave the build and output settings empty: `vercel.json` already sets them.
4. Open **Environment Variables** and add:

| Name | Value |
|---|---|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Neon **pooled** URL |
| `JWT_SECRET` | secret 1 |
| `JWT_REFRESH_SECRET` | secret 2 |
| `INTERNAL_API_KEY` | secret 3 |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | from step 3 |
| `RESEND_API_KEY`, `EMAIL_FROM_NAME` | from step 4 |
| `BCRYPT_ROUNDS` | `12` |
| `API_PUBLIC_URL` | leave for now (set it in step 6) |
| `WEB_APP_URL` | `http://localhost:3000` for now (step 7) |
| `ALLOWED_ORIGINS` | `http://localhost:3000` for now (step 7) |

Don't add `SUPER_ADMIN_*` or `DIRECT_URL` here: only your machine needs them.

5. Click **Deploy**.

**Check:** the deployment page says *Ready*. Copy the domain it shows (for example `hallmate-backend.vercel.app`).

### What `vercel.json` does (so you can explain it)

| Setting | Why |
|---|---|
| `buildCommand` | `prisma generate` creates the database client, then `npm run build` bundles the app with esbuild |
| `functions` → `api/index.js` | The one serverless function; it loads the bundled Express app from `dist/app.js` |
| `includeFiles: dist/**` | Ships the bundle and `openapi.json` with the function |
| `rewrites` | Every URL goes to that function, so Express does the routing |
| `outputDirectory: public` | Only `robots.txt` is served as a static file. If it were `dist`, anyone could download the source maps, which contain the whole backend's source code |
| `regions: cle1` | Ohio, next to the Neon database (`us-east-2`). Each query crosses that distance, so keeping them close matters more than being close to the user |

## Step 6: Tell the API its own address (2 min)

In Vercel: **Settings → Environment Variables**, set `API_PUBLIC_URL` to `https://<your-domain>.vercel.app`, then **Deployments → ⋯ → Redeploy**.

**Check these in a browser:**
- `https://<your-domain>.vercel.app/health` shows `"Server is running smoothly"`
- `https://<your-domain>.vercel.app/api-docs` shows the API docs
- Log in at `POST /api/auth/login` from the docs page with university ID `0000000000` and your super admin password: the response contains an `accessToken`

## Step 7: Later, when the web app is live

Set these in the API project and redeploy:

| Name | Value |
|---|---|
| `WEB_APP_URL` | `https://<web-app>.vercel.app` |
| `ALLOWED_ORIGINS` | the same URL |

The web app gets `BACKEND_URL=https://<your-domain>.vercel.app` and the same `INTERNAL_API_KEY`.

## Step 8 (optional): Online payments with the SSLCommerz sandbox

1. Register at [developer.sslcommerz.com/registration](https://developer.sslcommerz.com/registration/). The sandbox is free, and they email you a **Store ID** and **Store Password**.
2. Add them in Vercel as `SSLCOMMERZ_STORE_ID` and `SSLCOMMERZ_STORE_PASSWORD`, and keep `SSLCOMMERZ_LIVE=false`. Redeploy.
3. Test with the sandbox's test cards or test bKash numbers (listed in their docs).

Taking real money needs a merchant account in the hall's or university's name (trade license, bank account). Then set the live store credentials and `SSLCOMMERZ_LIVE=true`. Until then, without credentials, the pay button tells students to pay at the hall office, and the provost records cash and bank payments.

---

## Checklist

- [ ] Tests pass locally; `npm start` works
- [ ] Three secrets generated; JWT secrets 32+ characters and different
- [ ] Migrations applied to Neon; super admin seeded; seed password removed from `.env`
- [ ] Resend key set (test emails reach your own inbox)
- [ ] Vercel project deployed; `API_PUBLIC_URL` set; `/health` and `/api-docs` work
- [ ] Logged in as super admin; then changed the password (`POST /api/auth/change-password`)

## When something goes wrong

| Symptom | Likely cause and fix |
|---|---|
| Build fails at `prisma generate` | `DATABASE_URL` is missing in Vercel (it must exist, even though generate doesn't connect) |
| Every request answers 500 right after deploy | An env variable is missing or too short. **Deployments → the latest → Logs** lists exactly which one (`Invalid environment variables`) |
| `Cannot find module '@/...'` | The build ran `tsc` output instead of `npm run build`. Check `buildCommand` in `vercel.json` |
| Login works but emails never arrive | Without a verified domain Resend only delivers to your own account address; the logs show Resend's explanation |
| `/api-docs` is empty | `dist/openapi.json` wasn't built: check the build log for `dist/openapi.json: 92 paths` |
| Requests are slow | Check the function region is `cle1` (**Settings → Functions**); the first request after idle also wakes the Neon database |
| Everyone gets 429 Too Many Requests | The web app isn't sending `INTERNAL_API_KEY`, so all its users count as one client |

**Where to read logs:** Vercel → your project → **Logs**. Every server error appears there with its route and stack trace.

---

### Note: what happened on 2026-10-23

`prisma.config.ts` makes the CLI prefer `DIRECT_URL` (right for Neon). Your `.env` holds the Neon `DIRECT_URL`, so `npm run test:db`, which only overrode `DATABASE_URL`, applied the migrations to Neon instead of the local test database. Those migrations changed only tables no code had written to yet, plus a `currentRoomId` backfill and a unique index (which succeeded). `test:db` now sets both URLs, and `jest.setup.js` refuses to run unless both point at localhost.

