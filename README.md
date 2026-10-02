# EcoMeter Frontend

React + Vite frontend for Case Study 45: Energy Usage Monitor.

## Folder placement

Keep this folder inside the same project root as the backend:

```text
eco-meter/
├── config/
├── controllers/
├── middleware/
├── models/
├── routes/
├── server.js
├── package.json
├── .env
├── postman_collection.json
├── API_ENDPOINTS.md
├── README.md
└── frontend/
    ├── src/
    ├── package.json
    ├── .env.example
    └── ...
```

## Run frontend

Open a second terminal:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Vite normally opens the frontend at `http://localhost:5173`.

The backend should keep running separately at `http://localhost:4000`.

## Firebase Web App setup

The Google Sign-In button uses the Firebase Web SDK. In Firebase Console, add a Web App to the same Firebase project and copy its web configuration into `frontend/.env`.

Set:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

Email/password login uses the backend JWT endpoints. Google Sign-In uses Firebase Auth and then exchanges the Firebase ID token for the backend JWT through `/api/auth/firebase-login`.

## Main frontend features

- JWT register/login
- Firebase Google sign-in
- Dashboard with usage and bill summary
- Socket.io live usage updates
- Device CRUD and on/off control
- Energy reading creation and history
- Current, predicted and monthly bill estimates
- Energy-saving tips
- Usage threshold alerts
- Firebase notification form
