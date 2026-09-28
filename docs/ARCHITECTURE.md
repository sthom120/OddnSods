# Architecture

OddsnSods is a small full-stack web application with a React/Vite client and a Node/Express API.

## Runtime overview

```text
User
  |
  v
React + Vite client (Vercel)
  |
  | REST/JSON over HTTPS
  v
Express API (Render)
  |                 \
  |                  \ push delivery
  v                   v
MongoDB Atlas      Firebase Cloud Messaging
```

## Client responsibilities

The client handles:

- authentication state and protected routes
- list, item, Today and Upcoming views
- list sharing and item assignment UI
- due-date and recurrence controls
- notification permission/registration
- foreground notification toasts
- installable PWA behaviour

## Server responsibilities

The API handles:

- registration and login
- JWT authentication and route protection
- list ownership and sharing permissions
- item CRUD operations
- recurrence generation
- due-date reminder claiming and delivery
- Firebase installation registration and cleanup

## Data model

The main MongoDB documents are:

- **User** — account identity and password hash
- **List** — owner, members and per-list feature settings
- **Item** — title, completion state, assignment, due date and recurrence data
- **Notification installation** — browser/Firebase installation details used for push delivery

## Notification flow

1. The browser requests notification permission and registers its Firebase installation with the API.
2. Assignment or due-date events are evaluated by the server.
3. The server sends the notification through Firebase Admin.
4. The service worker displays background notifications and preserves a path back to the relevant list.
5. Clicking a notification focuses an existing OddsnSods window or opens the target list in a new one.

## Deployment

- **Frontend:** Vercel
- **API:** Render
- **Database:** MongoDB Atlas
- **Push notifications:** Firebase Cloud Messaging
- **CI:** GitHub Actions

Environment-specific configuration is supplied through environment variables. Secrets are not committed to the repository.
