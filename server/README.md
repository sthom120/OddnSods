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
- `APP_TIME_ZONE` — calendar timezone used by recurrence logic. Defaults to `Australia/Brisbane`.
- `FIREBASE_PROJECT_ID` — Firebase Admin project ID.
- `FIREBASE_CLIENT_EMAIL` — Firebase Admin service-account email.
- `FIREBASE_PRIVATE_KEY` — Firebase Admin private key. Escaped `\\n` newlines are converted automatically.

## Commands

```bash
npm run dev
npm test
npm start
```
