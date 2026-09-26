/**
 * Web Content Saver - Dashboard Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const statTotalCount = document.getElementById('stat-total-count');
  const statTodayCount = document.getElementById('stat-today-count');
  const searchInput = document.getElementById('search-input');
  const clearSearchBtn = document.getElementById('clear-search-btn');
  const cardsContainer = document.getElementById('cards-container');
  const emptyState = document.getElementById('empty-state');
  const noResultsState = document.getElementById('no-results-state');
  const searchTermDisplay = document.getElementById('search-term-display');
  const resetSearchBtn = document.getElementById('reset-search-btn');
  const exportJsonBtn = document.getElementById('export-json-btn');
  const toastBanner = document.getElementById('toast-banner');

  // Modal Elements
  const deleteModal = document.getElementById('delete-modal');
  const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
  const confirmDeleteBtn = document.getElementById('confirm-delete-btn');

  // State
  let allRecords = [];
  let pendingDeleteId = null;
  let toastTimeout = null;

  // 1. Fetch Records from Background Worker
  function loadRecords() {
    chrome.runtime.sendMessage({ type: 'GET_ALL_RECORDS' }, (response) => {
      if (chrome.runtime.lastError) {
        showToast('Error loading records: ' + chrome.runtime.lastError.message, true);
        return;
      }
      if (response && response.success) {
        allRecords = response.records || [];
        applyFilterAndRender();
      } else {
        showToast('Failed to load saves from IndexedDB.', true);
      }
    });
  }

  // 2. Filter & Render
  function applyFilterAndRender() {
    const query = searchInput.value.trim().toLowerCase();
    
    // Update Stats
    if (statTotalCount) {
      statTotalCount.textContent = allRecords.length.toString();
    }
    if (statTodayCount) {
      const todayStr = new Date().toISOString().slice(0, 10);
      const todayCount = allRecords.filter(r => (r.createdAt || '').slice(0, 10) === todayStr).length;
      statTodayCount.textContent = todayCount.toString();
    }

    // Toggle clear search button visibility
    if (query.length > 0) {
      clearSearchBtn.classList.remove('hidden');
    } else {
      clearSearchBtn.classList.add('hidden');
    }

    if (allRecords.length === 0) {
      cardsContainer.innerHTML = '';
      emptyState.classList.remove('hidden');
      noResultsState.classList.add('hidden');
      return;
    }

    emptyState.classList.add('hidden');

    const filtered = allRecords.filter((rec) => {
      if (!query) return true;
      const matchTitle = (rec.title || '').toLowerCase().includes(query);
      const matchUrl = (rec.url || '').toLowerCase().includes(query);
      const matchSelection = (rec.selectedText || '').toLowerCase().includes(query);
      const matchContext = (rec.context || '').toLowerCase().includes(query);
      return matchTitle || matchUrl || matchSelection || matchContext;
    });

    if (filtered.length === 0 && query.length > 0) {
      cardsContainer.innerHTML = '';
      searchTermDisplay.textContent = query;
      noResultsState.classList.remove('hidden');
      return;
    }

    noResultsState.classList.add('hidden');
    renderCards(filtered);
  }

  // 3. Render Card DOM safely
  function renderCards(records) {
    cardsContainer.innerHTML = '';

    records.forEach((rec) => {
      const card = document.createElement('article');
      card.className = 'item-card';
      card.setAttribute('data-id', rec.id);

      // --- Header ---
      const header = document.createElement('div');
      header.className = 'card-header';

      const metaTop = document.createElement('div');
      metaTop.className = 'card-meta-top';

      let domain = 'web';
      try {
        domain = new URL(rec.url).hostname;
      } catch {
        domain = 'link';
      }

      const domainPill = document.createElement('span');
      domainPill.className = 'domain-pill';
      domainPill.textContent = domain;
      domainPill.title = rec.url;

      const dateText = document.createElement('time');
      dateText.className = 'date-text';
      dateText.textContent = formatDate(rec.createdAt);
      dateText.title = `Created: ${rec.createdAt}${rec.updatedAt !== rec.createdAt ? '\nUpdated: ' + rec.updatedAt : ''}`;

      metaTop.appendChild(domainPill);
      metaTop.appendChild(dateText);

      const titleLink = document.createElement('a');
      titleLink.className = 'card-title-link';
      titleLink.href = rec.url;
      titleLink.target = '_blank';
      titleLink.rel = 'noopener noreferrer';
      titleLink.title = `Open: ${rec.url}`;

      const titleSpan = document.createElement('span');
      titleSpan.textContent = rec.title || rec.url;
      titleLink.appendChild(titleSpan);

      const linkIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      linkIcon.setAttribute('width', '14');
      linkIcon.setAttribute('height', '14');
      linkIcon.setAttribute('viewBox', '0 0 24 24');
      linkIcon.setAttribute('fill', 'none');
      linkIcon.setAttribute('stroke', 'currentColor');
      linkIcon.setAttribute('stroke-width', '2.5');
      linkIcon.setAttribute('stroke-linecap', 'round');
      linkIcon.setAttribute('stroke-linejoin', 'round');
      linkIcon.innerHTML = '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line>';
      titleLink.appendChild(linkIcon);

      header.appendChild(metaTop);
      header.appendChild(titleLink);

      // --- Body ---
      const body = document.createElement('div');
      body.className = 'card-body';

      // Context Box
      const contextBox = document.createElement('div');
      contextBox.className = 'context-box';

      const contextHeader = document.createElement('div');
      contextHeader.className = 'context-label';

      const contextLabelText = document.createElement('span');
      contextLabelText.textContent = '💡 WHY SAVED:';
      contextHeader.appendChild(contextLabelText);

      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'btn btn-secondary btn-small';
      editBtn.textContent = 'Edit Note';
      contextHeader.appendChild(editBtn);

      const contextViewEl = document.createElement('div');
      contextViewEl.className = 'context-text';
      contextViewEl.textContent = rec.context;

      // Edit Mode Form (Hidden initially)
      const editContainer = document.createElement('div');
      editContainer.className = 'edit-context-container hidden';

      const editTextarea = document.createElement('textarea');
      editTextarea.className = 'edit-textarea';
      editTextarea.value = rec.context;

      const editActions = document.createElement('div');
      editActions.className = 'edit-actions';

      const cancelEditBtn = document.createElement('button');
      cancelEditBtn.type = 'button';
      cancelEditBtn.className = 'btn btn-secondary btn-small';
      cancelEditBtn.textContent = 'Cancel';

      const saveEditBtn = document.createElement('button');
      saveEditBtn.type = 'button';
      saveEditBtn.className = 'btn btn-primary btn-small';
      saveEditBtn.textContent = 'Save';

      editActions.appendChild(cancelEditBtn);
      editActions.appendChild(saveEditBtn);
      editContainer.appendChild(editTextarea);
      editContainer.appendChild(editActions);

      // Edit Button Interaction
      editBtn.addEventListener('click', () => {
        contextViewEl.classList.add('hidden');
        editBtn.classList.add('hidden');
        editContainer.classList.remove('hidden');
        editTextarea.value = rec.context;
        editTextarea.focus();
      });

      cancelEditBtn.addEventListener('click', () => {
        editContainer.classList.add('hidden');
        contextViewEl.classList.remove('hidden');
        editBtn.classList.remove('hidden');
      });

      saveEditBtn.addEventListener('click', () => {
        const newText = editTextarea.value.trim();
        if (!newText) {
          showToast('Context note cannot be empty.', true);
          return;
        }

        saveEditBtn.disabled = true;
        saveEditBtn.textContent = 'Saving...';

        chrome.runtime.sendMessage({
          type: 'UPDATE_RECORD_CONTEXT',
          payload: { id: rec.id, context: newText }
        }, (res) => {
          saveEditBtn.disabled = false;
          saveEditBtn.textContent = 'Save';

          if (res && res.success) {
            rec.context = newText;
            rec.updatedAt = res.record.updatedAt;
            contextViewEl.textContent = newText;
            editContainer.classList.add('hidden');
            contextViewEl.classList.remove('hidden');
            editBtn.classList.remove('hidden');
            showToast('Context note updated successfully!');
          } else {
            showToast(res ? res.error : 'Failed to update note.', true);
          }
        });
      });

      contextBox.appendChild(contextHeader);
      contextBox.appendChild(contextViewEl);
      contextBox.appendChild(editContainer);
      body.appendChild(contextBox);

      // Quote Selection Box (if present)
      if (rec.selectedText && rec.selectedText.trim().length > 0) {
        const quoteBox = document.createElement('div');
        quoteBox.className = 'quote-box';

        const quoteHeader = document.createElement('div');
        quoteHeader.className = 'quote-header';

        const quoteLabel = document.createElement('span');
        quoteLabel.className = 'quote-label';
        quoteLabel.textContent = '“ CAPTURED QUOTE';

        const copyQuoteBtn = document.createElement('button');
        copyQuoteBtn.type = 'button';
        copyQuoteBtn.className = 'btn btn-secondary btn-small';
        copyQuoteBtn.textContent = 'Copy Quote';

        copyQuoteBtn.addEventListener('click', async () => {
          try {
            await navigator.clipboard.writeText(rec.selectedText);
            copyQuoteBtn.textContent = 'Copied! ✓';
            setTimeout(() => { copyQuoteBtn.textContent = 'Copy Quote'; }, 1500);
          } catch {
            showToast('Could not copy to clipboard.', true);
          }
        });

        quoteHeader.appendChild(quoteLabel);
        quoteHeader.appendChild(copyQuoteBtn);

        const quoteContent = document.createElement('blockquote');
        quoteContent.className = 'card-quote-text';
        quoteContent.textContent = rec.selectedText;

        quoteBox.appendChild(quoteHeader);
        quoteBox.appendChild(quoteContent);
        body.appendChild(quoteBox);
      }

      // --- Footer ---
      const footer = document.createElement('div');
      footer.className = 'card-footer';

      const copyUrlBtn = document.createElement('button');
      copyUrlBtn.type = 'button';
      copyUrlBtn.className = 'btn btn-secondary btn-small';
      copyUrlBtn.textContent = 'Copy Link';

      copyUrlBtn.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(rec.url);
          copyUrlBtn.textContent = 'Link Copied! ✓';
          setTimeout(() => { copyUrlBtn.textContent = 'Copy Link'; }, 1500);
        } catch {
          showToast('Could not copy link.', true);
        }
      });

      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'btn btn-danger btn-small';
      deleteBtn.textContent = 'Delete';

      deleteBtn.addEventListener('click', () => {
        pendingDeleteId = rec.id;
        deleteModal.classList.remove('hidden');
      });

      footer.appendChild(copyUrlBtn);
      footer.appendChild(deleteBtn);

      // Assemble card
      card.appendChild(header);
      card.appendChild(body);
      card.appendChild(footer);

      cardsContainer.appendChild(card);
    });
  }

  // 4. Date formatting helper
  function formatDate(isoString) {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  }

  // 5. Search events
  searchInput.addEventListener('input', applyFilterAndRender);

  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    applyFilterAndRender();
    searchInput.focus();
  });

  resetSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    applyFilterAndRender();
    searchInput.focus();
  });

  // 6. Delete confirmation modal handlers
  cancelDeleteBtn.addEventListener('click', () => {
    pendingDeleteId = null;
    deleteModal.classList.add('hidden');
  });

  deleteModal.addEventListener('click', (e) => {
    if (e.target === deleteModal) {
      pendingDeleteId = null;
      deleteModal.classList.add('hidden');
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !deleteModal.classList.contains('hidden')) {
      pendingDeleteId = null;
      deleteModal.classList.add('hidden');
    }
  });

  confirmDeleteBtn.addEventListener('click', () => {
    if (!pendingDeleteId) return;

    confirmDeleteBtn.disabled = true;
    confirmDeleteBtn.textContent = 'Deleting...';

    chrome.runtime.sendMessage({
      type: 'DELETE_RECORD',
      payload: { id: pendingDeleteId }
    }, (res) => {
      confirmDeleteBtn.disabled = false;
      confirmDeleteBtn.textContent = 'Yes, Delete Record';
      deleteModal.classList.add('hidden');

      if (res && res.success) {
        allRecords = allRecords.filter(r => r.id !== pendingDeleteId);
        pendingDeleteId = null;
        applyFilterAndRender();
        showToast('Record deleted successfully.');
      } else {
        showToast(res ? res.error : 'Failed to delete record.', true);
      }
    });
  });

  // 7. Export JSON Handler
  exportJsonBtn.addEventListener('click', () => {
    if (allRecords.length === 0) {
      showToast('No saved content available to export.', true);
      return;
    }

    const exportData = {
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      recordCount: allRecords.length,
      records: allRecords
    };

    try {
      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const filename = `web-content-saver-export-${timestamp}.json`;

      const downloadAnchor = document.createElement('a');
      downloadAnchor.href = url;
      downloadAnchor.download = filename;
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();

      setTimeout(() => {
        document.body.removeChild(downloadAnchor);
        URL.revokeObjectURL(url);
      }, 200);

      showToast(`Exported ${allRecords.length} records to ${filename}`);
    } catch (err) {
      console.error('Export error:', err);
      showToast('Failed to export records.', true);
    }
  });

  // 8. Toast notification helper
  function showToast(message, isError = false) {
    if (toastTimeout) {
      clearTimeout(toastTimeout);
    }

    toastBanner.textContent = message;
    if (isError) {
      toastBanner.classList.add('error');
    } else {
      toastBanner.classList.remove('error');
    }

    toastBanner.classList.remove('hidden');

    toastTimeout = setTimeout(() => {
      toastBanner.classList.add('hidden');
    }, 3500);
  }

  // 9. Google Auth & Cloud Sync Management
  const authSignedOut = document.getElementById('auth-signed-out');
  const authSignedIn = document.getElementById('auth-signed-in');
  const googleLoginBtn = document.getElementById('google-login-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const syncNowBtn = document.getElementById('sync-now-btn');
  const userNameEl = document.getElementById('user-name');
  const userEmailEl = document.getElementById('user-email');
  const userAvatarEl = document.getElementById('user-avatar');

  function checkAuthState() {
    chrome.runtime.sendMessage({ type: 'AUTH_GET_CURRENT_USER' }, (res) => {
      if (res && res.success && res.user) {
        renderSignedInUser(res.user);
      } else {
        renderSignedOutUser();
      }
    });
  }

  function renderSignedInUser(user) {
    if (!authSignedIn || !authSignedOut) return;
    authSignedOut.classList.add('hidden');
    authSignedIn.classList.remove('hidden');

    if (userNameEl) userNameEl.textContent = user.displayName || 'Google User';
    if (userEmailEl) userEmailEl.textContent = user.email || '';
    if (userAvatarEl) {
      const initial = (user.displayName || user.email || 'U').charAt(0).toUpperCase();
      userAvatarEl.textContent = initial;
    }
  }

  function renderSignedOutUser() {
    if (!authSignedIn || !authSignedOut) return;
    authSignedIn.classList.add('hidden');
    authSignedOut.classList.remove('hidden');
  }

  if (googleLoginBtn) {
    googleLoginBtn.addEventListener('click', () => {
      googleLoginBtn.disabled = true;
      googleLoginBtn.innerHTML = '<span>SIGNING IN...</span>';

      chrome.runtime.sendMessage({ type: 'AUTH_SIGN_IN_GOOGLE' }, (res) => {
        googleLoginBtn.disabled = false;
        googleLoginBtn.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" class="google-icon">
            <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"/>
            <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"/>
            <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12 0 14.8s.7 5.1 1.9 7.5l3.7-2.9z"/>
            <path fill="#34A853" d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16.5C3.7 20.2 7.5 23.5 12 23.5z"/>
          </svg>
          <span>SIGN IN</span>
        `;

        if (res && res.success) {
          renderSignedInUser(res.user);
          loadRecords();
          showToast('Signed in with Google! Cloud sync active.');
        } else {
          const errMsg = res ? res.error : 'Sign in failed.';
          showToast(errMsg, true);
        }
      });
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      chrome.runtime.sendMessage({ type: 'AUTH_SIGN_OUT' }, () => {
        renderSignedOutUser();
        showToast('Signed out of cloud sync.');
      });
    });
  }

  if (syncNowBtn) {
    syncNowBtn.addEventListener('click', () => {
      syncNowBtn.disabled = true;
      syncNowBtn.textContent = 'Syncing...';

      chrome.runtime.sendMessage({ type: 'SYNC_CLOUD_DATA' }, (res) => {
        syncNowBtn.disabled = false;
        syncNowBtn.textContent = '⟳ Sync';

        if (res && res.success) {
          allRecords = res.records || [];
          applyFilterAndRender();
          showToast('Cloud sync completed!');
        } else {
          showToast(res ? res.error : 'Sync failed.', true);
        }
      });
    });
  }

  // Load initial data and auth state
  loadRecords();
  checkAuthState();
});
