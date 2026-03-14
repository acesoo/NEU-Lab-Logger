# NEU Lab Logger

> A laboratory room usage tracking system for New Era University. Professors can check in and out of lab rooms via QR code scanning, while administrators can monitor usage, manage access, and generate reports — all in real time.

**Live Site:** [neu-lab-logger-27e86.web.app](https://neu-lab-logger-27e86.web.app)

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Firebase Setup](#firebase-setup)
- [Deployment](#deployment)
- [Usage Guide](#usage-guide)
- [Security](#security)

---

## Features

### Professor
- ✅ Sign in with institutional Google account (`@neu.edu.ph`)
- ✅ View live room board — see which rooms are available or occupied
- ✅ Check in to multiple rooms simultaneously via QR code scan
- ✅ Check out of individual rooms or all at once
- ✅ Mobile-responsive interface

### Admin
- ✅ Analytics dashboard with KPI cards and charts
- ✅ Live lab logs with force checkout capability
- ✅ User management — block/unblock professors
- ✅ Room utilization and weekly trend reports
- ✅ QR code generator for all lab rooms
- ✅ Access whitelist management
- ✅ CSV export for reports

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (Static Export) |
| Styling | Tailwind CSS |
| Auth | Firebase Authentication (Google OAuth) |
| Database | Cloud Firestore |
| Hosting | Firebase Hosting |
| QR Scanning | html5-qrcode |
| QR Generation | qrcodejs (CDN) |
| Fonts | Playfair Display, DM Sans |

---

## Project Structure

```
neu-lab-logger/
├── src/
│   ├── app/
│   │   ├── layout.js         # Root layout, fonts, viewport
│   │   ├── page.js           # Entry point — routes to Landing or AppShell
│   │   └── globals.css       # Global styles, animations, CSS variables
│   ├── components/
│   │   ├── AppShell.js       # Main layout — sidebar, topbar, nav
│   │   ├── Dashboard.js      # Admin analytics dashboard
│   │   ├── Landing.js        # Login page with Google OAuth modal
│   │   ├── LogsPage.js       # Admin lab logs table
│   │   ├── QRGenerator.js    # Admin QR code generator
│   │   ├── ReportsPage.js    # Reports with dynamic charts
│   │   ├── ScanPage.js       # Professor room board and QR scanner
│   │   ├── UsersPage.js      # User management
│   │   └── WhitelistPage.js  # Access whitelist management
│   ├── context/
│   │   └── AuthContext.js    # Global auth state, session persistence
│   ├── hooks/
│   │   ├── useLogs.js        # Firestore logs listener
│   │   ├── useRooms.js       # Live room occupancy listener
│   │   └── useUsers.js       # Users collection listener
│   └── lib/
│       ├── auth.js           # Google sign-in, domain enforcement
│       ├── firebase.js       # Firebase app initialization
│       └── logRoom.js        # Check-in and check-out logic
├── .env.example              # Environment variable template
├── .gitignore
├── firebase.json             # Firebase Hosting config
├── firestore.rules           # Firestore security rules
├── next.config.js            # Next.js static export config
├── package.json
├── postcss.config.js
└── tailwind.config.js
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- Firebase CLI (`npm install -g firebase-tools`)
- A Firebase project with Firestore and Authentication enabled

### Installation

```bash
# Clone the repository
git clone https://github.com/acesoo/NEU-Lab-Logger.git
cd NEU-Lab-Logger

# Install dependencies
npm install

# Copy environment variables template
cp .env.example .env.local
# Fill in your Firebase config values in .env.local

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Environment Variables

Create a `.env.local` file in the root of the project based on `.env.example`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

Get these values from your [Firebase Console](https://console.firebase.google.com) → Project Settings → Your Apps.

---

## Firebase Setup

### 1. Authentication
- Enable **Google** as a sign-in provider
- Add your domain to the authorized domains list

### 2. Firestore Database
Create the following collections:

**`users/{email}`**
```
email:     string
name:      string
role:      "admin" | "professor"
isBlocked: boolean
status:    "active" | "revoked"
dept:      string
createdAt: timestamp
```

**`logs/{autoId}`**
```
profName:   string
profEmail:  string
roomId:     string
timestamp:  timestamp
checkedOut: timestamp (null if still active)
status:     "active" | "checked-out"
```

### 3. Firestore Indexes
Create these composite indexes in the Firebase Console:

| Collection | Fields | Order |
|------------|--------|-------|
| logs | roomId, status | Ascending |
| logs | status | Ascending |
| logs | profEmail, timestamp | Asc, Desc |

### 4. First Admin Account
Manually create a document in Firestore:

- Collection: `users`
- Document ID: your `@neu.edu.ph` email
- Fields:
  ```
  email:     your@neu.edu.ph
  name:      Your Name
  role:      admin
  status:    active
  isBlocked: false
  ```

Then log in — the system will recognize you as admin automatically.

---

## Deployment

```bash
# Build static export
npm run build

# Deploy to Firebase Hosting
firebase deploy

# Clean up build files (optional, saves disk space)
rm -rf .next out node_modules
```

### After Making Changes
```bash
npm install
npm run build
firebase deploy
```

---

## Usage Guide

### Professors
1. Go to the live site and click **Sign In**
2. Sign in with your `@neu.edu.ph` Google account
3. The **room board** shows all available and occupied rooms
4. Click **Scan & Check In** on any available room and scan its QR code
5. You can be checked in to multiple rooms at the same time
6. Click **Check Out** on your room card to end a session

### Admins
1. Sign in with an admin `@neu.edu.ph` account
2. **Dashboard** — view today's activity, active labs, and charts
3. **Lab Logs** — see all check-ins, force check out any active session
4. **User Management** — block or unblock professor accounts
5. **Reports** — view daily, weekly, or monthly usage trends and export CSV
6. **QR Codes** — generate and print QR codes for each lab room
7. **Whitelist** — add or remove professors from the system

### Adding a New Professor
1. Go to **Whitelist** tab
2. Enter their `@neu.edu.ph` email, name, and department
3. Set role to `professor` and status to `active`
4. They can now sign in immediately

---

## Security

- **Domain restriction** — only `@neu.edu.ph` Google accounts can sign in
- **Firestore rules** — all reads and writes require authentication with a valid NEU email
- **User verification** — every login checks the `users` collection for active, non-blocked status
- **No service account keys** — only client-side Firebase SDK is used
- **Environment variables** — Firebase config is stored in `.env.local`, never committed

### Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null
        && request.auth.token.email.matches('.*@neu\\.edu\\.ph');
    }
  }
}
```

---

## License

This project was built for **New Era University** — Quezon City, Philippines.
