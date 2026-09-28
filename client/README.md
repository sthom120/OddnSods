# OddsnSods client

OddsnSods is a lightweight shared-list app for personal lists, shared responsibility, assignments, due dates, recurrence and browser notifications.

## Local development

1. Copy `.env.example` to `.env`.
2. Fill in the Firebase web configuration and VAPID key.
3. Keep `VITE_API_URL=http://localhost:3000/api` while running the backend locally.
4. Install dependencies with `npm install`.
5. Start Vite with `npm run dev`.

## Useful commands

```bash
npm run dev
npm run build
npm run lint
npm run preview
```

## Deployment

The client is intended to be deployed as a Vite SPA. `vercel.json` provides a fallback so direct visits to routes such as `/today` and `/list/:id` are served by the React app.

Set `VITE_API_URL` to the deployed backend API URL and configure the Firebase `VITE_FIREBASE_*` variables in the hosting environment.
