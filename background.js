/**
 * Web Content Saver - Background Service Worker (Manifest V3)
 * Manages local IndexedDB storage, Firebase Auth, and cloud synchronization.
 */

importScripts('firebase-config.js');

const DB_NAME = 'web_content_saver_db';
const DB_VERSION = 1;
const STORE_NAME = 'saves';

/**
 * Opens or upgrades the IndexedDB database instance.
 * @returns {Promise<IDBDatabase>}
 */
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt', { unique: false });
        store.createIndex('updatedAt', 'updatedAt', { unique: false });
        store.createIndex('url', 'url', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Failed to open IndexedDB'));
  });
}

/**
 * Gets currently authenticated user from local storage.
 * @returns {Promise<Object|null>}
 */
async function getCurrentUser() {
  return new Promise((resolve) => {
    chrome.storage.local.get('authUser', (res) => {
      resolve(res ? res.authUser : null);
    });
  });
}

/**
 * Sets or clears current user session.
 */
async function setCurrentUser(user) {
  return new Promise((resolve) => {
    if (user) {
      chrome.storage.local.set({ authUser: user }, () => resolve(user));
    } else {
      chrome.storage.local.remove('authUser', () => resolve(null));
    }
  });
}

/**
 * Saves a new record into IndexedDB and triggers cloud sync if authenticated.
 * @param {Object} data - { url, title, selectedText, context }
 * @returns {Promise<Object>} The saved record
 */
async function saveRecord(data) {
  const url = (data.url || '').trim();
  const context = (data.context || '').trim();

  if (!url) {
    throw new Error('URL is required to save content.');
  }
  if (!context) {
    throw new Error('A context note is required before saving.');
  }

  const now = new Date().toISOString();
  const record = {
    id: typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : 'rec_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9),
    url: url,
    title: (data.title || '').trim(),
    selectedText: (data.selectedText || '').trim(),
    context: context,
    createdAt: now,
    updatedAt: now
  };

  const db = await openDB();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.add(record);

    req.onsuccess = () => resolve(record);
    req.onerror = () => reject(req.error || new Error('Failed to save record to IndexedDB.'));
  });

  // Background Cloud Sync
  try {
    const user = await getCurrentUser();
    if (user && user.idToken) {
      syncSaveToFirestore(user.uid, user.idToken, record).catch((err) => {
        console.warn('Background cloud sync deferred:', err);
      });
    }
  } catch (syncErr) {
    console.warn('Sync notice:', syncErr);
  }

  return record;
}

/**
 * Retrieves all saved records, sorted by createdAt (newest first).
 * @returns {Promise<Array<Object>>}
 */
async function getAllRecords() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();

    req.onsuccess = () => {
      const records = req.result || [];
      records.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      resolve(records);
    };
    req.onerror = () => reject(req.error || new Error('Failed to fetch records.'));
  });
}

/**
 * Updates the context note of an existing record.
 */
async function updateRecordContext(id, newContext) {
  const trimmed = (newContext || '').trim();
  if (!trimmed) {
    throw new Error('Context note cannot be empty.');
  }

  const db = await openDB();
  const updatedRecord = await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const getReq = store.get(id);

    getReq.onsuccess = () => {
      const record = getReq.result;
      if (!record) {
        reject(new Error(`Record with ID ${id} not found.`));
        return;
      }

      record.context = trimmed;
      record.updatedAt = new Date().toISOString();

      const putReq = store.put(record);
      putReq.onsuccess = () => resolve(record);
      putReq.onerror = () => reject(putReq.error || new Error('Failed to update record.'));
    };

    getReq.onerror = () => reject(getReq.error || new Error('Failed to retrieve record for update.'));
  });

  // Cloud Sync update
  try {
    const user = await getCurrentUser();
    if (user && user.idToken) {
      syncSaveToFirestore(user.uid, user.idToken, updatedRecord).catch(console.warn);
    }
  } catch (e) {
    console.warn(e);
  }

  return updatedRecord;
}

/**
 * Deletes a record by ID.
 */
async function deleteRecord(id) {
  const db = await openDB();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(id);

    req.onsuccess = () => resolve(id);
    req.onerror = () => reject(req.error || new Error('Failed to delete record.'));
  });

  // Cloud Sync delete
  try {
    const user = await getCurrentUser();
    if (user && user.idToken) {
      deleteSaveFromFirestore(user.uid, user.idToken, id).catch(console.warn);
    }
  } catch (e) {
    console.warn(e);
  }

  return id;
}

/**
 * Performs full bidirectional sync between local IndexedDB and Firestore.
 */
async function syncCloudData() {
  const user = await getCurrentUser();
  if (!user || !user.idToken) {
    throw new Error("Please sign in to sync with Firebase.");
  }

  const cloudRecords = await fetchAllFirestoreSaves(user.uid, user.idToken);
  const localRecords = await getAllRecords();
  const localMap = new Map(localRecords.map(r => [r.id, r]));

  const db = await openDB();

  // 1. Merge cloud records into local
  for (const cloudRec of cloudRecords) {
    const localRec = localMap.get(cloudRec.id);
    if (!localRec || new Date(cloudRec.updatedAt) > new Date(localRec.updatedAt)) {
      await new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put(cloudRec);
        tx.oncomplete = resolve;
      });
    }
  }

  // 2. Upload local records that aren't in cloud yet
  const cloudMap = new Map(cloudRecords.map(r => [r.id, r]));
  for (const localRec of localRecords) {
    if (!cloudMap.has(localRec.id)) {
      await syncSaveToFirestore(user.uid, user.idToken, localRec);
    }
  }

  return await getAllRecords();
}

let isAuthInProgress = false;

/**
 * Initiates Google OAuth flow using Chrome Identity API.
 */
async function signInWithGoogle() {
  if (isAuthInProgress) {
    throw new Error('A sign-in window is already open. Please check your open windows.');
  }

  const redirectUri = chrome.identity.getRedirectURL();
  const clientId = FIREBASE_CONFIG.clientId || "104860381622-2hc0ser5i1pholgq1lfd0jgq2i2ihj8q.apps.googleusercontent.com";

  // Construct Google OAuth URL
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${encodeURIComponent(clientId)}&` +
    `response_type=id_token%20token&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `scope=${encodeURIComponent('openid email profile')}&` +
    `nonce=${Math.random().toString(36).substring(2)}`;

  isAuthInProgress = true;

  return new Promise((resolve, reject) => {
    chrome.identity.launchWebAuthFlow(
      { url: authUrl, interactive: true },
      async (redirectUrl) => {
        isAuthInProgress = false;

        if (chrome.runtime.lastError || !redirectUrl) {
          const rawErr = chrome.runtime.lastError ? chrome.runtime.lastError.message : 'Login cancelled.';
          if (rawErr.includes('Only one web auth flow')) {
            reject(new Error('Please close any other Google login popup window and try again.'));
          } else {
            reject(new Error(rawErr));
          }
          return;
        }

        try {
          // Parse id_token from redirect hash fragment
          const hashIndex = redirectUrl.indexOf('#');
          const queryParams = new URLSearchParams(hashIndex >= 0 ? redirectUrl.substring(hashIndex + 1) : new URL(redirectUrl).search);
          const idToken = queryParams.get('id_token');

          if (!idToken) {
            throw new Error('Google authentication did not return an ID token.');
          }

          const firebaseUser = await signInWithFirebaseGoogleIdToken(idToken);
          await setCurrentUser(firebaseUser);
          await syncCloudData().catch(console.warn);
          resolve(firebaseUser);
        } catch (err) {
          reject(err);
        }
      }
    );
  });
}

/**
 * Message listener for extension components (Popup & Dashboard).
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || !message.type) return false;

  switch (message.type) {
    case 'SAVE_RECORD':
      saveRecord(message.payload)
        .then((record) => sendResponse({ success: true, record }))
        .catch((err) => sendResponse({ success: false, error: err.message }));
      return true;

    case 'GET_ALL_RECORDS':
      getAllRecords()
        .then((records) => sendResponse({ success: true, records }))
        .catch((err) => sendResponse({ success: false, error: err.message }));
      return true;

    case 'UPDATE_RECORD_CONTEXT':
      updateRecordContext(message.payload.id, message.payload.context)
        .then((record) => sendResponse({ success: true, record }))
        .catch((err) => sendResponse({ success: false, error: err.message }));
      return true;

    case 'DELETE_RECORD':
      deleteRecord(message.payload.id)
        .then((id) => sendResponse({ success: true, id }))
        .catch((err) => sendResponse({ success: false, error: err.message }));
      return true;

    case 'OPEN_DASHBOARD':
      chrome.tabs.create({ url: chrome.runtime.getURL('dashboard/dashboard.html') });
      sendResponse({ success: true });
      return false;

    // --- Authentication & Sync Handlers ---
    case 'AUTH_GET_CURRENT_USER':
      getCurrentUser()
        .then((user) => sendResponse({ success: true, user, isConfigured: isFirebaseConfigured() }))
        .catch((err) => sendResponse({ success: false, error: err.message }));
      return true;

    case 'AUTH_SIGN_IN_GOOGLE':
      signInWithGoogle()
        .then((user) => sendResponse({ success: true, user }))
        .catch((err) => sendResponse({ success: false, error: err.message }));
      return true;

    case 'AUTH_SIGN_OUT':
      setCurrentUser(null)
        .then(() => sendResponse({ success: true }))
        .catch((err) => sendResponse({ success: false, error: err.message }));
      return true;

    case 'SYNC_CLOUD_DATA':
      syncCloudData()
        .then((records) => sendResponse({ success: true, records }))
        .catch((err) => sendResponse({ success: false, error: err.message }));
      return true;

    default:
      sendResponse({ success: false, error: `Unknown message type: ${message.type}` });
      return false;
  }
});
