# Product Requirements Document

## Status

Draft for v1. Product decisions below reflect the initial scope agreed for this project. Implementation has not started.

## Product Summary

Web Content Saver is a Chrome desktop extension for keeping a small, searchable collection of useful web pages together with the reason each page mattered to the user. A save contains the page URL and title, optional selected text, and a required short context note. All records stay in the extension's local IndexedDB database.

## Problem

Bookmarks preserve where a page is but not why it was saved or which passage was useful. When users return later, they must revisit pages and reconstruct their original intent. This extension captures that context at the moment of discovery and makes it searchable later.

## Target User

People researching, learning, or collecting reference material who want a lightweight personal archive without creating an account or sending saved content to a service.

## Goals

- Save the current page with little interruption.
- Preserve the user's selected passage when one is selected.
- Require a short reason so each saved item has useful context.
- Keep saved data local and let users search and manage it from a dashboard.
- Keep the v1 implementation in vanilla JavaScript with no framework or remote backend.

## Primary User Flow

1. The user selects text on a page if desired, then clicks the extension icon.
2. The popup shows the current page URL, title, and captured selection, plus a required context field.
3. The user enters a one- or two-line reason and saves.
4. The extension confirms the save and offers access to the dashboard.
5. In the dashboard, the user browses recent saves, searches across their content, edits a reason, deletes an item, or exports the collection.

## V1 Scope

- Chrome desktop, Manifest V3.
- Popup capture of the active page URL, title, optional selected text, and required context.
- IndexedDB persistence local to the extension.
- Dashboard opened in an extension tab; newest items appear first.
- Case-insensitive keyword search across title, URL, selected text, and context.
- Edit context, delete a save, and export all saves as JSON.
- Useful empty, loading, success, and error states.

## Out Of Scope

- Accounts, synchronization, cloud storage, or a remote API.
- Other browsers or mobile support.
- Automatic page capture, background browsing history access, or full-page archiving.
- Tags, folders, sharing, collaboration, or AI-generated summaries.
- Importing an export file in v1.

## Product Principles

- **Private by default:** saved content does not leave the browser.
- **Explicit capture:** save only after the user opens the popup and submits the form.
- **Context first:** selected text is optional; the user's reason is required.
- **Recoverable:** destructive deletion is confirmed; export gives users a portable copy.

## Success Criteria

- A user can save a page with and without selected text, and the saved values survive closing and reopening the browser.
- A user can find a save by a keyword present in any searchable field.
- A user can edit context, delete a record, and export all records from the dashboard.
- The extension requests only the permissions needed for the agreed capture flow and makes no network requests.

## Constraints And Risks

- Chrome restricts script injection on browser-internal and other protected pages. The popup must explain when the active page cannot be captured and must not silently save incomplete page metadata.
- Manifest V3 service workers can stop between events. IndexedDB connections and message handling must work when the worker is restarted.
- “One or two lines” is guidance for the context note, not a reliable character count because line wrapping varies by viewport. V1 requires non-empty text but does not impose an arbitrary character limit.

## Related Specification

See [REQUIREMENTS.md](REQUIREMENTS.md) for detailed functional, privacy, data, and acceptance requirements.