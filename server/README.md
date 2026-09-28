# OddsnSods server

Node/Express API for OddsnSods.

## Local development

1. Copy `.env.example` to `.env`.
2. Set `MONGO_URI` and `JWT_SECRET`.
3. Keep `CLIENT_ORIGINS=http://localhost:5173` for the local Vite client.
4. Keep the local Firebase service-account JSON at `config/firebase-service-account.json` (it is gitignored), or use the Firebase environment variables listed below.
5. Install dependencies with `npm install`.
6. Run `npm run dev`.

## Environment variables

- `PORT` — Express port. Render can supply this automatically.
- `MONGO_URI` — MongoDB Atlas connection string.
- `JWT_SECRET` — secret used to sign application JWTs.
- `CLIENT_ORIGINS` — comma-separated allowed browser origins, for example the Vercel production URL and any deliberate preview URL.
- `APP_TIME_ZONE` — calendar timezone used by recurrence and reminder logic. Defaults to `Australia/Brisbane`.
- `DUE_NOTIFICATIONS_ENABLED` — set to `true` to run automatic due-date reminders. Defaults to disabled so a development server cannot unexpectedly send reminders.
- `DUE_NOTIFICATION_HOUR` — local hour from `0` to `23` after which due-today reminders may be sent. Defaults to `9`.
- `DUE_NOTIFICATION_CHECK_MINUTES` — reminder scheduler interval from `1` to `60` minutes. Defaults to `15`.
- `FIREBASE_PROJECT_ID` — Firebase Admin project ID.
- `FIREBASE_CLIENT_EMAIL` — Firebase Admin service-account email.
- `FIREBASE_PRIVATE_KEY` — Firebase Admin private key. Escaped `\\n` newlines are converted automatically.

## Due-date reminders

When enabled, the server checks for reminders on a short interval. It creates any recurring occurrence that has become due before checking reminders, so recurrence no longer depends on somebody opening the list.

A due-today item is notified once per recipient per calendar date. An assigned item goes to its assignee. An item assigned to `Anyone` goes to everyone who currently has access to that list. Lists with due dates switched off do not send reminders.

Reminder delivery is claimed atomically in MongoDB before sending, which prevents duplicate reminders when scheduler cycles overlap. If delivery fails completely, the claim is released so a later cycle can retry.

The scheduler runs inside the API process. Production hosting therefore needs an always-running backend process, or this cycle should later be moved to an external scheduled job.

## Commands

```bash
npm run dev
npm test
npm start
```
