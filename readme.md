# ⚡ Web Content Saver

> **Save what you found. Remember why it mattered.**

**Web Content Saver** is a Chrome Manifest V3 extension for saving useful web pages together with the exact text you found important and a short note explaining why you saved it.

Instead of creating ordinary bookmarks that only remember where something was, Web Content Saver preserves the **page + selected quote + personal context** in a searchable dashboard.

It uses **IndexedDB** for local-first storage and supports optional **Google Sign-In + Firebase Firestore** synchronization for cloud backup and multi-device access.

---

## ✨ What This Project Does

The basic workflow is:

```text
🌐 Browse a Web Page
        ↓
✂️ Select useful text (optional)
        ↓
⚡ Open Web Content Saver
        ↓
📝 Add "Why did I save this?"
        ↓
💾 Save
        ↓
📊 Search & manage everything from Dashboard
        ↓
☁️ Optional Google/Firebase cloud sync
```

### Why not just use bookmarks?

A bookmark tells you:

> "I saved this website."

Web Content Saver tells you:

> "I saved this website because this specific information was useful to me."

---

# 🚀 Features

## 1. ⚡ One-Click Page Capture

The extension popup automatically captures:

* 🌐 Current page URL
* 🏷️ Page title
* ✂️ Currently selected text
* 📝 Your personal context/reason

You only need to provide the reason for saving.

---

## 2. ✂️ Selected Text / Quote Capture

Select an important paragraph, definition, code snippet, explanation, or quote before opening the extension.

The selected text is automatically captured and stored with the page.

### Example

```text
PAGE
https://developer.chrome.com/

CAPTURED QUOTE
"Service workers terminate when idle..."

WHY SAVED
Useful pattern for understanding Manifest V3 background workers.
```

If nothing is selected, the save still works.

---

## 3. 🧠 Context-First Saving

Every saved item requires a **non-empty context note**.

This prevents your collection from becoming a pile of links that you later forget the purpose of.

### Example

❌ **Bookmark**

```text
https://example.com/article
```

✅ **Web Content Saver**

```text
https://example.com/article

Quote:
"IndexedDB provides a way to persist..."

Why saved:
"Useful for the local storage architecture of my Chrome extension."
```

---

## 4. 📊 Searchable Dashboard

The dashboard provides a central place to manage saved content.

Search works across:

* Page title
* URL
* Selected text
* Context note

Search is:

* 🔎 Real-time
* 🔤 Case-insensitive
* ⚡ Local
* 🚫 No server-side search required

---

## 5. ✏️ Edit Saved Context

Forgot to explain something properly?

You can edit the **Why Saved** note directly from the dashboard.

The updated record receives a new `updatedAt` timestamp.

---

## 6. 🗑️ Delete with Confirmation

Saved records can be deleted from the dashboard.

Deletion requires confirmation to reduce accidental removal.

---

## 7. 📋 Copy Quote & Copy Link

Each saved card provides quick actions to:

* Copy the captured quote
* Copy the original page URL

Useful when transferring research into notes, assignments, documentation, or projects.

---

## 8. 📦 JSON Export

Export your entire collection as a JSON file.

The export contains:

* Export schema version
* Export timestamp
* All saved records

This gives you a portable backup of your saved content.

---

## 9. 🔐 Local-First Storage

The extension stores saved records in **IndexedDB**.

The local record contains:

```text
id
url
title
selectedText
context
createdAt
updatedAt
```

This means the extension can work locally without requiring a server for normal saving and searching.

---

## 10. ☁️ Optional Google Sign-In + Firebase Sync

The project also includes optional cloud functionality using:

* Google Sign-In
* Firebase Authentication
* Cloud Firestore

When signed in:

```text
Local IndexedDB
      ↕
Firebase Firestore
      │
      └── Google Authentication
```

The project uses a **local-first + cloud-sync model**.

Cloud synchronization supports:

* Uploading local saves
* Pulling cloud saves
* Updating cloud records
* Deleting cloud records
* Syncing records when signing in on another device

Firebase is an optional cloud layer. Local IndexedDB remains the primary storage layer.

---

## 11. ⌨️ Keyboard Shortcut

The extension can be opened using:

### Windows / Linux

```text
Alt + Shift + S
```

### macOS

```text
MacCtrl + Shift + S
```

---

## 12. 🛡️ Protected Page Detection

Chrome does not allow normal script access to certain browser-controlled pages.

The extension detects unsupported pages such as:

```text
chrome://
chrome-extension://
devtools://
edge://
about:
view-source:
Chrome Web Store
```

Instead of silently saving incomplete information, the extension shows a clear unsupported-page state.

---

# 🎨 UI / Design

The project follows a distinctive **Neobrutalist / Obsidian Brutalist** visual style.

### Design characteristics

* 🟨 High-contrast neon accents
* 🩷 Hot-pink action states
* 🟦 Cyan telemetry elements
* ⬛ Dark/obsidian dashboard
* ▫️ Heavy borders
* 💥 Solid drop shadows
* 📐 Strong geometric layouts
* 🖥️ Responsive dashboard cards

The same visual language is used across:

```text
Landing Page
      ↓
Extension Popup
      ↓
Dashboard
```

---

# 🖥️ Project Structure

```text
bootcamp4/
│
├── 📄 manifest.json
├── 📄 background.js
├── 📄 firebase-config.js
│
├── 📁 popup/
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
│
├── 📁 dashboard/
│   ├── dashboard.html
│   ├── dashboard.css
│   └── dashboard.js
│
├── 📁 icons/
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
│
├── 📄 index.html
├── 📄 landing.css
├── 📄 landing.js
│
├── 📄 build_zip.js
├── 📄 generate_icons.js
├── 📄 package.json
├── 📄 package-lock.json
│
├── 📁 docs/
│   ├── PRD.md
│   ├── REQUIREMENTS.md
│   └── FIREBASE_SETUP.md
│
├── 📄 CHANGELOG.md
├── 📄 .gitignore
└── 📄 vercel.json
```

---

# 🧩 Architecture

The extension is divided into three main UI layers and a background service worker.

```text
                  WEB CONTENT SAVER
                         │
          ┌──────────────┼──────────────┐
          │              │              │
       POPUP         DASHBOARD      LANDING PAGE
          │              │              │
          └──────────────┼──────────────┘
                         ↓
                BACKGROUND SERVICE
                     WORKER
                         │
                  ┌──────┴──────┐
                  ↓             ↓
              IndexedDB      Firebase
              Local Store    Firestore
                                 │
                                 ↓
                        Google Authentication
```

---

## `background.js`

Acts as the central data layer.

It handles:

* IndexedDB initialization
* Save operations
* Fetch operations
* Context updates
* Delete operations
* Authentication state
* Firebase synchronization
* Communication between popup/dashboard and storage

---

## `popup/`

Handles the quick-save workflow.

```text
Active Tab
    ↓
Capture URL + Title
    ↓
Capture Selection
    ↓
Enter Context
    ↓
Save
```

---

## `dashboard/`

Handles collection management:

```text
Load records
    ↓
Display newest first
    ↓
Search
    ↓
Edit / Copy / Delete
    ↓
Export JSON
```

---

## `index.html`

Provides the project's landing/home experience, including:

* Product explanation
* Feature showcase
* Interactive demo
* Installation walkthrough
* Contact modal
* Preloader/boot sequence

---

# 🛠️ Tech Stack

| Technology                        | Purpose                              |
| --------------------------------- | ------------------------------------ |
| **JavaScript**                    | Application logic                    |
| **HTML5**                         | Extension and landing-page structure |
| **CSS3**                          | UI and Neobrutalist styling          |
| **Chrome Extensions Manifest V3** | Browser extension platform           |
| **Chrome Scripting API**          | Reading selected page text           |
| **Chrome Identity API**           | Google authentication                |
| **IndexedDB**                     | Local persistence                    |
| **Firebase Authentication**       | Google/Firebase login                |
| **Cloud Firestore**               | Optional cloud synchronization       |
| **Node.js**                       | Utility scripts                      |
| **JSON**                          | Manifest/config/export data          |

No frontend framework is required for the core extension UI.

---

# 📦 Installation

## Option 1 — Install as an Unpacked Chrome Extension

### Step 1 — Download / clone the repository

```bash
git clone https://github.com/piyush4955/webSaver.git
cd webSaver/bootcamp4
```

### Step 2 — Open Chrome Extensions

Go to:

```text
chrome://extensions
```

### Step 3 — Enable Developer Mode

Turn on:

```text
Developer mode
```

### Step 4 — Load the extension

Click:

```text
Load unpacked
```

Select the project's:

```text
bootcamp4/
```

folder.

### Step 5 — Pin the extension

Open the Chrome Extensions menu and pin:

```text
Web Content Saver
```

---

# ▶️ How to Use

## Save a Page

### 1. Open any supported webpage

For example:

```text
https://example.com/
```

### 2. Select useful text

This is optional.

Select:

```text
→ Important paragraph
→ Quote
→ Code
```

### 3. Open Web Content Saver

Click the extension icon or use:

```text
Alt + Shift + S
```

### 4. Review captured information

The popup shows:

* Page title
* Page URL
* Selected text

### 5. Add context

Write why you are saving it.

Example:

```text
Important explanation of IndexedDB transactions.
Useful for my browser extension project.
```

### 6. Click Save

The record is stored locally.

### 7. Open Dashboard

From the success screen, open the dashboard to manage your saved content.

---

# 🔎 Searching Your Saves

Open the Dashboard and type into the search field.

For example:

```text
firebase
```

The dashboard searches:

* Title
* URL
* Selected Text
* Context

### Example

Search:

```text
indexeddb
```

Results can include:

```text
✓ "IndexedDB storage patterns"
✓ URL containing indexeddb
✓ Quote mentioning IndexedDB
✓ Context mentioning IndexedDB
```

---

# ☁️ Firebase Setup

Firebase cloud sync is available as an optional feature.

Detailed instructions are provided here:

```text
docs/FIREBASE_SETUP.md
```

The setup covers:

* Creating a Firebase project
* Registering the web app
* Configuring Firebase credentials
* Enabling Google Authentication
* Creating Firestore
* Applying Firestore security rules
* Using local-first + cloud synchronization
* Firestore data model

### Firestore Data Model

```text
users/
└── {userId}/
    └── saves/
        ├── {recordId}
        ├── {recordId}
        └── ...
```

Each user's saves are isolated using their Firebase user ID.

---

# 📤 JSON Export

The Dashboard includes:

```text
↓ EXPORT JSON
```

The generated export is designed to be portable and contains an export version, timestamp, and saved records.

### Example Structure

```json
{
  "schemaVersion": 1,
  "exportedAt": "2026-09-26T00:00:00.000Z",
  "records": [
    {
      "id": "...",
      "url": "https://example.com/",
      "title": "Example",
      "selectedText": "Important text...",
      "context": "Why I saved this...",
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

---

# 🔒 Privacy Model

The extension is designed around a **local-first architecture**.

## Without Cloud Sign-In

```text
Web Page
    ↓
Extension
    ↓
IndexedDB
    ↓
Dashboard
```

No server is required for:

* Saving
* Searching
* Editing
* Deleting
* Exporting local records

---

## With Google/Firebase Sign-In

```text
Web Page
    ↓
Extension
    ↓
IndexedDB ─────────→ Firestore
    ↑                   ↓
    └───────────────────┘
            Sync
```

Only the cloud-sync functionality uses Firebase network services.

---

# 📚 Documentation

The repository includes dedicated project documentation.

## Product Requirements

```text
docs/PRD.md
```

Defines:

* Product problem
* Target user
* Goals
* User flow
* V1 scope
* Out-of-scope features
* Product principles
* Success criteria
* Constraints and risks

---

## Detailed Requirements

```text
docs/REQUIREMENTS.md
```

Defines:

* Runtime requirements
* Chrome permissions
* Functional requirements
* Data model
* Search requirements
* UX requirements
* Architecture requirements
* Acceptance checklist

---

## Firebase Setup

```text
docs/FIREBASE_SETUP.md
```

Contains the Google Authentication and Firestore configuration guide.

---

# 🧪 Verification Checklist

After loading the extension, test the following:

* [ ] Save a page with selected text
* [ ] Save a page without selected text
* [ ] Verify blank context cannot be saved
* [ ] Verify saved data appears in Dashboard
* [ ] Search by title
* [ ] Search by URL
* [ ] Search by selected text
* [ ] Search by context
* [ ] Verify case-insensitive search
* [ ] Edit a context note
* [ ] Delete a save
* [ ] Confirm deletion behavior
* [ ] Copy a quote
* [ ] Copy a URL
* [ ] Export JSON
* [ ] Test an unsupported Chrome page
* [ ] Test the keyboard shortcut
* [ ] Test Google Sign-In if Firebase is configured
* [ ] Test cloud synchronization if Firebase is configured

---

# 📁 Useful Scripts

The repository contains Node.js utility scripts.

## Generate Extension ZIP

```bash
node build_zip.js
```

This creates:

```text
web-content-saver.zip
```

containing the files required for the extension bundle.

---

## Generate Icons

```bash
node generate_icons.js
```

The project also includes generated extension icons under:

```text
icons/
```

---

# 🗺️ Current Scope

## ✅ Implemented

* Chrome Manifest V3 extension
* Page URL capture
* Page title capture
* Selected text capture
* Required context note
* Local IndexedDB persistence
* Searchable dashboard
* Context editing
* Delete confirmation
* Copy quote
* Copy URL
* JSON export
* Unsupported-page handling
* Keyboard shortcut
* Neobrutalist UI
* Landing page
* Interactive landing-page demo
* Google authentication integration
* Firebase Firestore synchronization
* Local-first cloud sync architecture
* Project documentation

---

# 🔮 Possible Future Improvements

Potential extensions to the current architecture include:

* 🏷️ Tags and categories
* 📁 Folders / collections
* 🔄 Importing JSON backups
* 🧠 AI-generated summaries
* 🤖 AI-powered semantic search
* 📱 Mobile companion application
* 🌐 Support for additional browsers
* 🔗 Sharing saved collections
* 📈 Usage analytics
* 📝 Richer note editing

---

# 📜 Version

Current project version:

```text
1.0.0
```

See `CHANGELOG.md` for the implementation history and user-visible changes.

---

# 👨‍💻 Project

## Web Content Saver

A lightweight, context-first way to turn useful web discoveries into a searchable personal knowledge collection.

> **Don't just save the link. Save the reason.**
