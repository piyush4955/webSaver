/**
 * Firebase Configuration & REST Client for Chrome Extension (Manifest V3)
 * Uses standard REST APIs for Authentication and Firestore without requiring heavy external SDKs.
 */

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAlIYSZAkV9hvpjA_QX29cjPhLINMBz4l8",
  authDomain: "bootcampwebsaver.firebaseapp.com",
  projectId: "bootcampwebsaver",
  storageBucket: "bootcampwebsaver.firebasestorage.app",
  messagingSenderId: "104860381622",
  appId: "1:104860381622:web:d98019388e18ed7db31117",
  measurementId: "G-XWCDS9PRFB",
  clientId: "104860381622-2hc0ser5i1pholgq1lfd0jgq2i2ihj8q.apps.googleusercontent.com"
};

/**
 * Checks if Firebase has been configured with valid credentials.
 */
function isFirebaseConfigured() {
  return (
    FIREBASE_CONFIG.apiKey &&
    !FIREBASE_CONFIG.apiKey.startsWith("YOUR_") &&
    FIREBASE_CONFIG.projectId &&
    !FIREBASE_CONFIG.projectId.startsWith("YOUR_")
  );
}

/**
 * Exchanges Google OAuth access token / id_token for Firebase User Credentials.
 * @param {string} googleIdToken
 * @returns {Promise<Object>} Firebase user profile & tokens
 */
async function signInWithFirebaseGoogleIdToken(googleIdToken) {
  if (!isFirebaseConfigured()) {
    throw new Error("Firebase is not configured yet. Please add your credentials in firebase-config.js.");
  }

  const endpoint = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=${FIREBASE_CONFIG.apiKey}`;
  const requestBody = {
    postBody: `id_token=${encodeURIComponent(googleIdToken)}&providerId=google.com`,
    requestUri: `https://${FIREBASE_CONFIG.authDomain}`,
    returnIdpCredential: true,
    returnSecureToken: true
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error ? data.error.message : 'Firebase authentication failed.');
  }

  return {
    uid: data.localId,
    email: data.email,
    displayName: data.displayName || data.email.split('@')[0],
    photoUrl: data.profilePicture || '',
    idToken: data.idToken,
    refreshToken: data.refreshToken,
    expiresIn: data.expiresIn
  };
}

/**
 * Uploads or updates a save record in user's Firestore collection.
 * Path: users/{uid}/saves/{recordId}
 */
async function syncSaveToFirestore(userId, idToken, record) {
  if (!isFirebaseConfigured() || !userId || !idToken) return null;

  const endpoint = `https://firestore.googleapis.com/v1/projects/${FIREBASE_CONFIG.projectId}/databases/(default)/documents/users/${userId}/saves/${record.id}?key=${FIREBASE_CONFIG.apiKey}`;

  const firestoreDoc = {
    fields: {
      id: { stringValue: record.id },
      url: { stringValue: record.url },
      title: { stringValue: record.title || '' },
      selectedText: { stringValue: record.selectedText || '' },
      context: { stringValue: record.context || '' },
      createdAt: { stringValue: record.createdAt },
      updatedAt: { stringValue: record.updatedAt }
    }
  };

  const res = await fetch(endpoint, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`
    },
    body: JSON.stringify(firestoreDoc)
  });

  if (!res.ok) {
    const err = await res.json();
    console.warn('Firestore sync error for record:', record.id, err);
  }
}

/**
 * Deletes a record from Firestore.
 */
async function deleteSaveFromFirestore(userId, idToken, recordId) {
  if (!isFirebaseConfigured() || !userId || !idToken) return null;

  const endpoint = `https://firestore.googleapis.com/v1/projects/${FIREBASE_CONFIG.projectId}/databases/(default)/documents/users/${userId}/saves/${recordId}?key=${FIREBASE_CONFIG.apiKey}`;

  await fetch(endpoint, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${idToken}`
    }
  });
}

/**
 * Fetches all saved records for a user from Firestore.
 */
async function fetchAllFirestoreSaves(userId, idToken) {
  if (!isFirebaseConfigured() || !userId || !idToken) return [];

  const endpoint = `https://firestore.googleapis.com/v1/projects/${FIREBASE_CONFIG.projectId}/databases/(default)/documents/users/${userId}/saves?pageSize=300&key=${FIREBASE_CONFIG.apiKey}`;

  const res = await fetch(endpoint, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${idToken}`
    }
  });

  if (!res.ok) {
    console.warn('Could not fetch cloud saves:', await res.text());
    return [];
  }

  const data = await res.json();
  const documents = data.documents || [];

  return documents.map(doc => {
    const f = doc.fields || {};
    return {
      id: f.id ? f.id.stringValue : doc.name.split('/').pop(),
      url: f.url ? f.url.stringValue : '',
      title: f.title ? f.title.stringValue : '',
      selectedText: f.selectedText ? f.selectedText.stringValue : '',
      context: f.context ? f.context.stringValue : '',
      createdAt: f.createdAt ? f.createdAt.stringValue : new Date().toISOString(),
      updatedAt: f.updatedAt ? f.updatedAt.stringValue : new Date().toISOString()
    };
  });
}
