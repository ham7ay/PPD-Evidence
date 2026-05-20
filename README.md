# 🚔 PPD Evidence Management System

A full-stack evidence locker & treasury management web app for the **Paradise Police Department** roleplay org.

Dark navy command-center UI with Firebase Auth + Firestore, evidence locker workflow, automatic black→white money conversion, treasury management, full reports (PDF/CSV export), admin panel, and live charts.

---

## 🎨 Features

- **Officer login** (email + password via Firebase Auth)
- **Dashboard** — total confiscated black money, white money, evidence items, recent activity
- **Evidence Locker** — officers enter name + batch code, select confiscated items + quantity, log permanently
- **Auto currency conversion** — `1 Black Money = 2.5 White Money`
- **Treasury System** — add / withdraw / return white money with full transaction history
- **Reports Page** — officer-wise, daily, totals — export to **PDF + CSV**
- **Evidence History** — search & filter by officer, batch, item, date, evidence ID
- **Admin Panel** — manage items, officers, delete evidence, reset treasury, analytics charts
- **Charts & Analytics** — daily confiscations, top items, money totals (Recharts)
- **Bonus** — toast notifications, loading animations, confirm modals, evidence receipt, sound on add

---

## 📁 Project Structure

```
ppd-evidence/
├── frontend/                     # React + Vite + Tailwind dashboard
│   ├── public/
│   └── src/
│       ├── components/           # Sidebar, Topbar, Cards, Modal, Charts...
│       ├── pages/                # Login, Dashboard, Locker, Treasury, Reports, History, Admin
│       ├── services/             # firebase.js, api.js
│       ├── context/              # AuthContext
│       └── utils/                # helpers, currency
├── backend/                      # Node.js + Express API
│   ├── routes/                   # /auth, /items, /evidence, /treasury, /reports
│   ├── middleware/               # auth verification
│   └── config/                   # firebase-admin init
└── README.md
```

---

## 🛠️ Prerequisites

- **Node.js 18+** and npm
- Free **Firebase** project (Authentication + Firestore enabled)
- **VS Code** (recommended)

---

## 🚀 Quick Start (Local)

### 1. Open in VS Code
```bash
code ppd-evidence
```

### 2. Install dependencies
```bash
# Terminal 1
cd frontend
npm install

# Terminal 2
cd backend
npm install
```

### 3. Set up Firebase

1. Go to https://console.firebase.google.com → **Add project** → name it `ppd-evidence` (or anything)
2. **Authentication → Sign-in method → Email/Password → Enable**
3. **Firestore Database → Create database → Production mode → pick a region close to you**
4. **⚙️ Project Settings → General → Your apps → `</>` web icon**, register app `PPD Evidence Web`
5. Copy the `firebaseConfig` values shown — you'll need them next
6. **⚙️ Project Settings → Service Accounts → Generate new private key** → save the JSON file

### 4. Configure frontend env

Copy `frontend/.env.example` → `frontend/.env` and paste your Firebase web config:
```
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=ppd-evidence.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=ppd-evidence
VITE_FIREBASE_STORAGE_BUCKET=ppd-evidence.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_API_URL=http://localhost:5000
```

### 5. Configure backend env

Place the service-account JSON at `backend/config/serviceAccountKey.json`.

Copy `backend/.env.example` → `backend/.env`:
```
PORT=5000
FRONTEND_URL=http://localhost:5173
ADMIN_EMAIL=admin@ppd.local
```

### 6. Apply Firestore security rules

Paste the contents of `firestore.rules` (in repo root) into Firebase Console → Firestore → Rules → **Publish**.

### 7. Run it
```bash
# Terminal 1
cd backend
npm run dev

# Terminal 2
cd frontend
npm run dev
```

Open http://localhost:5173

### 8. Create the admin account

On the login screen, click **Register**, use:
- Email: `admin@ppd.local`
- Password: `admin123`

The first user who registers with the email matching `ADMIN_EMAIL` (default `admin@ppd.local`) is auto-promoted to admin. They can promote others from the Admin Panel.

### 9. Seed sample data

After logging in as admin, go to **Admin Panel → Seed Sample Items** to populate the 5 default confiscatable items (Illegal Weapon, Drugs, Fake Passport, Gold Bars, Stolen Jewelry).

---

## 🌍 Deploy Online (Vercel + Render — free tier)

### Frontend → Vercel
1. Push the repo to GitHub
2. Go to https://vercel.com → **New Project** → import your repo
3. Root directory: `frontend`
4. Framework preset: **Vite**
5. Add the same `VITE_*` env vars from your `.env` — but change `VITE_API_URL` to your Render URL once you have it (step below)
6. Deploy

### Backend → Render
1. https://render.com → **New → Web Service** → connect GitHub
2. Root directory: `backend`
3. Build command: `npm install`
4. Start command: `npm start`
5. Add env vars from `backend/.env`, plus:
   - `FRONTEND_URL` = your Vercel URL (e.g. `https://ppd-evidence.vercel.app`)
   - `FIREBASE_SERVICE_ACCOUNT` = paste the **entire JSON** content of `serviceAccountKey.json` as one line (Render will read this instead of the file)
6. Deploy
7. Copy the Render URL (e.g. `https://ppd-evidence-backend.onrender.com`)
8. Go back to Vercel → update `VITE_API_URL` to that Render URL → redeploy

### Heads-up: Render free tier
After 15 min of no traffic the backend sleeps; first request takes ~30 sec to wake.

---

## 🔐 Default Admin
```
email:    admin@ppd.local
password: admin123
```
Change the password after first login (Profile page).

---

## 📦 Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, Vite, Tailwind CSS, React Router, Recharts, Framer Motion, Lucide icons, react-hot-toast, jsPDF |
| Backend | Node.js, Express, Firebase Admin SDK |
| Database | Firestore (NoSQL, real-time, persistent) |
| Auth | Firebase Authentication (Email/Password) |
| Deploy | Vercel (frontend) + Render (backend) |

---

## 💱 Currency rule
Hardcoded: `whiteMoney = blackMoney × 2.5`. Change in `backend/utils/currency.js` and `frontend/src/utils/currency.js` if needed.

---

Built for Paradise PD 🚔
