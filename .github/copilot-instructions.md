# Project Guidelines

## Source Of Truth

- Follow [docs/PRD.md](../docs/PRD.md) for product scope and [docs/REQUIREMENTS.md](../docs/REQUIREMENTS.md) for implementation and acceptance criteria.
- If code and these documents disagree, preserve existing user data and behavior, then update the relevant document and changelog as part of the change.

## Architecture

- Build a Chrome desktop Manifest V3 extension using vanilla JavaScript and browser APIs; do not add frameworks or a build system without an explicit decision.
- Keep the popup focused on capture, the background service worker as the IndexedDB owner, and the dashboard focused on browse/search/manage/export.
- Send popup/dashboard storage operations to the background using extension runtime messages. Keep IndexedDB as the source of truth; do not duplicate saved records in `chrome.storage`.
- Use `activeTab` and `scripting` for user-invoked current-page capture. Do not request broad host access or collect data in the background.
- Keep saved data local. Do not add analytics, remote calls, accounts, or sync.

## Implementation Practices

- Use semantic HTML, accessible labels, keyboard-operable controls, and visible focus states.
- Treat all saved or page-provided strings as untrusted text; render with text APIs, not HTML injection.
- Handle service-worker restarts, IndexedDB failures, unsupported pages, and empty/loading/error states explicitly.
- Keep changes small and preserve established behavior. Do not add dependencies unless they solve a concrete requirement and are documented.
- Update [CHANGELOG.md](../CHANGELOG.md) for user-visible behavior, permission, data-schema, or setup changes.

## Verification

- Use the acceptance checklist in [docs/REQUIREMENTS.md](../docs/REQUIREMENTS.md) for behavior changes.
- Test extension behavior in Chrome by loading the project unpacked and checking the service-worker console for errors.
- Report checks that could not be run; do not claim browser verification without actually performing it.