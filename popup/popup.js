/**
 * Web Content Saver - Popup Logic
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Elements
  const saveForm = document.getElementById('save-form');
  const unsupportedView = document.getElementById('unsupported-view');
  const successView = document.getElementById('success-view');

  const pageTitleEl = document.getElementById('page-title');
  const pageDomainEl = document.getElementById('page-domain');
  const pageUrlEl = document.getElementById('page-url');

  const selectionContainer = document.getElementById('selection-container');
  const selectedTextEl = document.getElementById('selected-text');
  const clearSelectionBtn = document.getElementById('clear-selection-btn');

  const contextInput = document.getElementById('context-input');
  const validationError = document.getElementById('validation-error');
  const errorBanner = document.getElementById('error-banner');
  const errorMessageEl = document.getElementById('error-message');
  const saveBtn = document.getElementById('save-btn');

  const openDashboardBtn = document.getElementById('open-dashboard-btn');
  const unsupportedOpenDashboard = document.getElementById('unsupported-open-dashboard');
  const successOpenDashboard = document.getElementById('success-open-dashboard');
  const saveAnotherBtn = document.getElementById('save-another-btn');
  const savedPreviewNote = document.getElementById('saved-preview-note');
  const unsupportedSchemeEl = document.getElementById('unsupported-scheme');

  // State
  let currentTab = null;
  let capturedSelection = '';

  // Dashboard opener helper
  function openDashboard() {
    chrome.runtime.sendMessage({ type: 'OPEN_DASHBOARD' }, () => {
      window.close();
    });
  }

  openDashboardBtn.addEventListener('click', openDashboard);
  unsupportedOpenDashboard.addEventListener('click', openDashboard);
  successOpenDashboard.addEventListener('click', openDashboard);

  // Clear selection action
  clearSelectionBtn.addEventListener('click', () => {
    capturedSelection = '';
    selectionContainer.classList.add('hidden');
  });

  // Save another note on same page
  saveAnotherBtn.addEventListener('click', () => {
    successView.classList.add('hidden');
    saveForm.classList.remove('hidden');
    contextInput.value = '';
    contextInput.focus();
  });

  // Clear validation on input
  contextInput.addEventListener('input', () => {
    if (contextInput.value.trim().length > 0) {
      validationError.classList.add('hidden');
    }
  });

  // 1. Inspect Active Tab
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tabs || tabs.length === 0) {
      showUnsupported('No active tab found');
      return;
    }

    currentTab = tabs[0];
    const url = currentTab.url || '';

    // Check for restricted / unsupported schemes
    const isRestricted = (
      !url ||
      url.startsWith('chrome://') ||
      url.startsWith('chrome-extension://') ||
      url.startsWith('devtools://') ||
      url.startsWith('edge://') ||
      url.startsWith('about:') ||
      url.startsWith('view-source:') ||
      url.startsWith('https://chromewebstore.google.com') ||
      url.startsWith('https://chrome.google.com/webstore')
    );

    if (isRestricted) {
      const schemeMatch = url.match(/^([a-z0-9-]+:)/i);
      const scheme = schemeMatch ? schemeMatch[1] : url;
      showUnsupported(scheme);
      return;
    }

    // Populate Page Metadata safely
    pageTitleEl.textContent = currentTab.title || 'Untitled Page';
    pageTitleEl.title = currentTab.title || '';
    pageUrlEl.textContent = url;
    pageUrlEl.title = url;

    try {
      const parsedUrl = new URL(url);
      pageDomainEl.textContent = parsedUrl.hostname || 'web';
    } catch {
      pageDomainEl.textContent = 'web';
    }

    // Capture Text Selection via scripting
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId: currentTab.id },
        func: () => window.getSelection().toString()
      });

      if (results && results[0] && typeof results[0].result === 'string') {
        const sel = results[0].result.trim();
        if (sel.length > 0) {
          capturedSelection = sel;
          selectedTextEl.textContent = sel;
          selectionContainer.classList.remove('hidden');
        }
      }
    } catch (scriptErr) {
      // Non-fatal if page doesn't allow script injection (e.g. some PDFs)
      console.warn('Could not read selection from page:', scriptErr);
    }

    contextInput.focus();

  } catch (err) {
    console.error('Error initializing popup:', err);
    showUnsupported('Error accessing tab');
  }

  function showUnsupported(schemeText) {
    unsupportedSchemeEl.textContent = schemeText;
    saveForm.classList.add('hidden');
    unsupportedView.classList.remove('hidden');
  }

  // 2. Handle Form Submission
  saveForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const note = contextInput.value.trim();
    if (!note) {
      validationError.classList.remove('hidden');
      contextInput.focus();
      return;
    }

    // Hide any previous errors
    errorBanner.classList.add('hidden');
    validationError.classList.add('hidden');

    // UI Loading state
    saveBtn.disabled = true;
    const originalText = saveBtn.innerHTML;
    saveBtn.innerHTML = '<span class="btn-text">⏳ Saving...</span>';

    const payload = {
      url: currentTab.url,
      title: currentTab.title || 'Untitled Page',
      selectedText: capturedSelection,
      context: note
    };

    chrome.runtime.sendMessage({ type: 'SAVE_RECORD', payload }, (response) => {
      saveBtn.disabled = false;
      saveBtn.innerHTML = originalText;

      if (chrome.runtime.lastError) {
        showError(chrome.runtime.lastError.message || 'Communication error.');
        return;
      }

      if (!response || !response.success) {
        showError(response ? response.error : 'Failed to save record.');
        return;
      }

      // Success
      savedPreviewNote.textContent = `"${note}"`;
      saveForm.classList.add('hidden');
      successView.classList.remove('hidden');
    });
  });

  function showError(msg) {
    errorMessageEl.textContent = msg;
    errorBanner.classList.remove('hidden');
  }
});
