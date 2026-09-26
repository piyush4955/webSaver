# Changelog

All notable project changes will be documented in this file.

## [1.0.0] - 2026-09-26

### Added
- **Manifest V3 Setup (`manifest.json`)**: Configured extension with minimal permissions (`activeTab`, `scripting`), action popup, background worker, icons, and keyboard shortcut command (`Alt+Shift+S` / `MacCtrl+Shift+S`).
- **IndexedDB Storage Layer (`background.js`)**:
  - Implemented schema version 1 (`web_content_saver_db`, store `saves`, indexed on `createdAt`, `updatedAt`, `url`).
  - Added message handlers for `SAVE_RECORD`, `GET_ALL_RECORDS`, `UPDATE_RECORD_CONTEXT`, `DELETE_RECORD`, and `OPEN_DASHBOARD`.
  - Guaranteed lifecycle resilience across service worker idle / wake cycles.
- **Capture Popup UI (`popup/`)**:
  - Neobrutalist design with high contrast borders, solid drop shadows, and vibrant badges.
  - Automatic page URL, title, and selected text extraction via `activeTab` and `scripting.executeScript`.
  - Non-empty context note validation with real-time feedback.
  - Graceful protection detection with clear warnings for restricted browser pages (`chrome://`, webstore, etc.).
  - Success screen with one-click direct navigation to the Dashboard.
- **Dashboard Interface (`dashboard/`)**:
  - Generated and applied high-fidelity **Obsidian Brutalist** design in Stitch (`projects/8936818394335710231`).
  - Integrated full dark Neobrutalist layout matching the reference sidebar:
    - Neon yellow top banner with diamond logo (`WEB SAVER`).
    - Dashed structural divider (`--------`).
    - Active hot pink tab button (`■ ALL SAVES`).
    - Real-time `TOTAL` (yellow) and `TODAY` (cyan) telemetry metrics.
    - Full-width neon yellow `↓ EXPORT JSON` button.
  - Responsive obsidian card grid layout with live search, copy actions, inline edit mode, and delete confirmation modal.
- **Firebase & Google OAuth Integration (`firebase-config.js`)**:
  - Added lightweight REST client for Firebase Authentication and Cloud Firestore (no heavy bundler or SDK bloat).
  - Integrated `chrome.identity` WebAuthFlow for Google Sign-In.
  - Implemented automatic hybrid background synchronization between local IndexedDB and Firestore.
  - Added user profile card in dashboard sidebar with live cloud sync status (`LOCAL ONLY` vs `CLOUD SYNCED`).
  - Added comprehensive setup documentation in [`docs/FIREBASE_SETUP.md`](docs/FIREBASE_SETUP.md).
- **Launch Home Page (`index.html`, `landing.css`, `landing.js`)**:
  - Obsidian Neobrutalist landing page showcasing product capabilities, problem-solution narrative, and telemetry metrics.
  - Interactive Live Playground: Side-by-side simulated extension popup capture and dynamic real-time dashboard feed.
  - Step-by-Step Installation Guide (60-second walkthrough with code pills and hotkey tags).
  - Feature Highlights: Grid highlighting Context-first captures, quote extraction, local IndexedDB privacy, Firebase sync, and JSON export.
  - Direct extension download bundle (`web-content-saver.zip`) generated via `build_zip.js`.
  - Responsive navigation with smooth scrolling and an interactive "Contact Me" modal.
- **Neobrutalist Preloader Screen (`index.html`, `landing.css`, `landing.js`)**:
  - Implemented high-impact cyber preloader with live terminal telemetry boot logs (`SYS_BOOT`).
  - Added striped neon yellow progress bar with real-time percentage counter (`0%` to `100%`).
  - Smooth pop-in and slide-up dismissal animations with instant click/keypress skip support.
- **Contact & Creator Socials (`index.html`, `landing.css`)**:
  - Added direct social links for GitHub ([@sumittk1](https://github.com/sumittk1)) and Instagram ([@sumitt_k1](https://www.instagram.com/sumitt_k1)) in the contact modal and footer.
  - Interactive contact modal with direct message dispatch and Neobrutalist buttons.
- **Extension Assets**: Script-generated crisp Neobrutalist PNG icons (16x16, 32x32, 48x48, 128x128).