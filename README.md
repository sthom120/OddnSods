# OddsnSods

<p align="center">
  <img src="client/public/oddsnsods-logo.png" alt="OddsnSods logo" width="280" />
</p>

<p align="center">
  A lightweight shared-list app for keeping personal and shared responsibilities out of your head and in one clear place.
</p>

<p align="center">
  <a href="https://oddsnsods.vercel.app"><strong>Live demo</strong></a>
  ·
  <a href="https://github.com/sthom120/OddnSods/actions"><strong>CI</strong></a>
</p>

## Overview

OddsnSods is a full-stack responsive web app for creating flexible personal and shared lists. Rather than forcing users into preset list types, each list can be named and configured to suit the job at hand.

The project focuses on reducing mental load and making shared responsibility simple: users can create lists, share them with existing accounts, assign items, add due dates, create recurring tasks and receive browser notifications.

## Features

- Create, rename and delete custom lists
- Keep lists private or share them with other users
- Add, edit, complete and delete list items
- Optional assignees per list
- Optional due dates per list
- Daily, weekly, fortnightly and monthly recurrence
- Completed-item history with a personal show/hide preference
- Cross-list **Today** and **Upcoming** views
- Assignment and due-date push notifications with deep links back to the relevant list
- Installable Progressive Web App (PWA)
- Responsive mobile-first interface
- JWT-based authentication with hashed passwords
- CI checks for the client and server

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | React, Vite, React Router |
| Backend | Node.js, Express |
| Database | MongoDB Atlas, Mongoose |
| Authentication | JWT, bcryptjs |
| Notifications | Firebase Cloud Messaging / Firebase Admin |
| Frontend hosting | Vercel |
| API hosting | Render |
| CI | GitHub Actions |

## Architecture

```text
Browser / installed PWA
        |
        v
Vercel - React + Vite frontend
        |
        | HTTPS / JSON API
        v
Render - Express API
        |
        +------> MongoDB Atlas
        |
        +------> Firebase Cloud Messaging
```

The client and server are kept as separate applications inside the same repository:

```text
OddsnSods/
├── client/                 # React/Vite frontend
│   ├── public/             # PWA, icons and service worker assets
│   └── src/                # pages, components and client utilities
├── server/                 # Express/Mongoose API
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   └── utils/
└── .github/workflows/      # automated CI
```

## Running locally

### Prerequisites

- Node.js 20.19+ or a compatible newer release
- MongoDB connection string
- Firebase web configuration for browser notifications
- Firebase Admin credentials if testing notification delivery locally

### 1. Clone the repository

```bash
git clone https://github.com/sthom120/OddnSods.git
cd OddnSods
```

### 2. Configure the backend

```bash
cd server
cp .env.example .env
npm install
npm run dev
```

At minimum, configure `MONGO_URI`, `JWT_SECRET` and `CLIENT_ORIGINS` in `server/.env`.

### 3. Configure the frontend

In a second terminal:

```bash
cd client
cp .env.example .env
npm install
npm run dev
```

Set `VITE_API_URL=http://localhost:3000/api` and provide the Firebase web configuration values listed in `client/.env.example`.

## Testing and quality checks

Backend tests use Node's built-in test runner. The frontend is linted and production-built in CI.

```bash
# server
cd server
npm test

# client
cd client
npm run lint
npm run build
```

GitHub Actions runs these checks automatically on repository changes.

## Deployment

The production frontend is deployed to Vercel and the API is deployed to Render. MongoDB Atlas stores production data and Firebase Cloud Messaging handles push delivery.

The frontend uses environment-based API configuration, while CORS on the API is restricted through `CLIENT_ORIGINS`.

> Note: the due-date reminder scheduler currently runs inside the API process. Production hosting therefore needs the backend process to be awake when scheduled reminder checks are expected to run.

## Security and privacy notes

- Passwords are hashed before storage.
- Authentication uses signed JWTs.
- Server-side list access controls distinguish list owners from shared members.
- Sensitive environment files and Firebase service-account credentials are excluded from Git.
- Production browser origins are explicitly allow-listed by the API.

## Project status

OddsnSods is a working deployed MVP and is still being refined. Current development is focused on product polish, reliability and portfolio-quality presentation rather than adding project-management complexity.

Potential future work includes stronger account recovery/email verification, richer notification preferences and further PWA/offline improvements.

## Author

Built by [Sarah Thomson](https://github.com/sthom120) as a full-stack portfolio project.
