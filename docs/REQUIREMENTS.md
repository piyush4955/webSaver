# Product Requirements

This document translates [PRD.md](PRD.md) into implementation and verification criteria for v1.

## Runtime And Permissions

- **REQ-PLAT-01:** The extension targets Chrome desktop and uses Manifest V3.
- **REQ-PLAT-02:** The extension uses an action popup, a background service worker, and an extension dashboard page.
- **REQ-PERM-01:** Use `activeTab` and `scripting` to read the active page only after the user invokes the extension. Do not request persistent access to all websites.
- **REQ-PERM-02:** Do not add `tabs`, `storage`, `downloads`, or other permissions unless implementation demonstrates they are required. Prefer an anchor-based JSON download from the dashboard.
- **REQ-PRIV-01:** Saved records remain in IndexedDB owned by the extension origin. Do not send page data, selected text, or context to a network service.

## Functional Requirements

### Capture And Save

- **REQ-CAP-01:** Clicking the extension action opens the popup for the active tab.
- **REQ-CAP-02:** The popup obtains the active page URL, document title, and current text selection. An empty selection is valid.
- **REQ-CAP-03:** The popup displays the captured URL, title, and selection so the user can check what will be saved. Long values must remain readable without breaking the form layout.
- **REQ-CAP-04:** The user must enter a non-whitespace context note before saving. The interface should prompt for one or two lines; do not enforce a fixed character count in v1.
- **REQ-CAP-05:** A successful save creates a new record and confirms success. Saving the same URL more than once creates separate records because each save can have different context.
- **REQ-CAP-06:** If page details cannot be read on a protected or unsupported page, explain the limitation and prevent creation of an incomplete record.
- **REQ-CAP-07:** The popup provides a way to open the dashboard.

### Persistence And Record Management

- **REQ-DATA-01:** The background service worker owns IndexedDB reads and writes; popup and dashboard request operations through extension runtime messages.
- **REQ-DATA-02:** Each record contains:

| Field | Type | Rule |
|---|---|---|
| `id` | string | Unique stable identifier |
| `url` | string | Required page URL |
| `title` | string | Page title captured at save time; may be empty if the page has no title |
| `selectedText` | string | Captured selection; empty string when no text is selected |
| `context` | string | Required, trimmed user note |
| `createdAt` | string | ISO 8601 timestamp set when created |
| `updatedAt` | string | ISO 8601 timestamp, initially equal to `createdAt` |

- **REQ-DATA-03:** The database schema is versioned and can be opened after the service worker has been suspended and restarted.
- **REQ-DATA-04:** Persistence errors are surfaced to the user; the UI must not report success before the write completes.
- **REQ-MGMT-01:** The dashboard lists saved records newest first and presents URL, title, selected text when present, context, and save date.
- **REQ-MGMT-02:** The dashboard includes an empty state when there are no records.
- **REQ-MGMT-03:** The user can edit a record's context. The updated note remains non-empty after trimming, and `updatedAt` changes.
- **REQ-MGMT-04:** The user can delete a record after confirming the action.
- **REQ-MGMT-05:** The user can export all records as a JSON file. The export contains an export schema version, export timestamp, and the records; it must not require a network request or additional Chrome permission.

### Search

- **REQ-SEARCH-01:** The dashboard filters records as the user types a keyword, without a server or network request.
- **REQ-SEARCH-02:** Search is case-insensitive and matches substring content in `title`, `url`, `selectedText`, or `context`.
- **REQ-SEARCH-03:** Clearing the query restores the full list. A query with no matches shows a distinct no-results state.

## Quality Requirements

- **REQ-UX-01:** Popup and dashboard controls are keyboard accessible, have programmatic labels, and show visible focus.
- **REQ-UX-02:** Save, edit, delete, search, and export provide clear success, empty, or error feedback as appropriate.
- **REQ-UX-03:** Do not render saved page content as HTML. Treat title, URL, selection, and context as untrusted text.
- **REQ-ARCH-01:** Use vanilla JavaScript and browser APIs; do not introduce a UI framework, bundler, or remote dependency without an explicit project decision.
- **REQ-ARCH-02:** Keep extension permissions minimal and document any added permission in the requirements and changelog.
- **REQ-DOC-01:** Update the changelog when user-visible behavior, permissions, data format, or project setup changes.

## Acceptance Checklist

- [ ] Load the unpacked extension in Chrome without manifest or service-worker errors.
- [ ] Save a page with a selection and verify URL, title, selection, context, and timestamps in the dashboard.
- [ ] Save a page without a selection and verify that an empty selection is accepted.
- [ ] Verify blank or whitespace-only context cannot be saved.
- [ ] Verify a save remains available after closing and reopening the extension/browser.
- [ ] Search successfully by title, URL, selected text, and context; verify case-insensitivity and the no-results state.
- [ ] Edit context and verify it persists and the update timestamp changes.
- [ ] Cancel and confirm deletion; verify the item is only removed after confirmation.
- [ ] Export records and verify the downloaded JSON parses and contains all saved records.
- [ ] Try a protected page and verify a clear unsupported-page message with no incomplete save.
- [ ] Confirm the extension makes no network requests and requests no broad host permission.