# Firebase & Google OAuth Setup Guide

Web Content Saver supports optional **Google Sign-In + Cloud Sync** powered by **Firebase Auth & Cloud Firestore**.

---

### Step 1: Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project** and name it (e.g., `web-content-saver`).
3. Once created, click on the **Web icon (`</>`)** to register a web app.
4. Copy the `firebaseConfig` keys into `firebase-config.js`:

```javascript
// firebase-config.js
const FIREBASE_CONFIG = {
  apiKey: "AIzaSy...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789...",
  appId: "1:123456789:web:abcdef..."
};
```

---

### Step 2: Enable Google Authentication

1. In Firebase Console, go to **Build > Authentication > Sign-in method**.
2. Enable the **Google** provider.
3. In the authorized domains section, verify that `firebaseapp.com` is listed.

---

### Step 3: Enable Cloud Firestore Database

1. In Firebase Console, go to **Build > Firestore Database**.
2. Click **Create Database** (Start in production mode or test mode).
3. Under **Security Rules**, paste the following rule to ensure users only read and write their own saves:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/saves/{saveId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

### How Sync Works (Local-First + Cloud Hybrid)

1. **Local-First Speed**: All saves are written immediately to local IndexedDB for instant response and offline access.
2. **Auto Cloud Sync**: When signed in with Google, saves automatically sync with Cloud Firestore in the background.
3. **Multi-Device**: Signing into the extension on another computer instantly pulls and merges all saved notes.
