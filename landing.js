/**
 * Landing Page Interactive Logic for Web Content Saver
 */

document.addEventListener('DOMContentLoaded', () => {
  // 0. Cool Neobrutalist Preloader Boot Sequence
  const preloader = document.getElementById('preloader');
  const progressFill = document.getElementById('progress-fill');
  const progressPercent = document.getElementById('progress-percent');
  const terminalLines = document.getElementById('terminal-lines');

  let progress = 0;
  let isSkipped = false;

  const bootLogs = [
    { text: '> MOUNTING LOCAL STORAGE ENGINE... [OK]', color: 'text-cyan', at: 15 },
    { text: '> INJECTING MANIFEST V3 SCRIPTS... [OK]', color: 'text-yellow', at: 40 },
    { text: '> CONNECTING FIREBASE FIRESTORE SYNC... [OK]', color: 'text-mint', at: 65 },
    { text: '> COMPILING NEOBRUTALIST DASHBOARD... [OK]', color: 'text-pink', at: 85 },
    { text: '> SYSTEM READY. LAUNCHING WEB SAVER!', color: 'text-mint', at: 100 }
  ];

  let currentLogIdx = 0;

  function addTerminalLine(text, colorClass) {
    if (!terminalLines) return;
    const line = document.createElement('div');
    line.className = `term-line ${colorClass || ''}`;
    line.textContent = text;
    terminalLines.appendChild(line);
  }

  function dismissPreloader() {
    if (isSkipped) return;
    isSkipped = true;
    if (preloader) {
      preloader.classList.add('preloader-hidden');
      setTimeout(() => {
        preloader.style.display = 'none';
      }, 600);
    }
  }

  // Preloader interval
  const bootInterval = setInterval(() => {
    if (isSkipped) {
      clearInterval(bootInterval);
      return;
    }

    progress += Math.floor(Math.random() * 8) + 4;
    if (progress > 100) progress = 100;

    if (progressFill) progressFill.style.width = `${progress}%`;
    if (progressPercent) progressPercent.textContent = `${progress}%`;

    while (currentLogIdx < bootLogs.length && progress >= bootLogs[currentLogIdx].at) {
      addTerminalLine(bootLogs[currentLogIdx].text, bootLogs[currentLogIdx].color);
      currentLogIdx++;
    }

    if (progress >= 100) {
      clearInterval(bootInterval);
      setTimeout(dismissPreloader, 350);
    }
  }, 40);

  // Skip preloader on click or keypress
  if (preloader) {
    preloader.addEventListener('click', dismissPreloader);
  }
  document.addEventListener('keydown', (e) => {
    if (!isSkipped && preloader && !preloader.classList.contains('preloader-hidden')) {
      dismissPreloader();
    }
  }, { once: true });
  // Demo State
  let demoSaves = [
    {
      id: 'demo-1',
      title: 'Deep Dive: Manifest V3 Service Workers & IndexedDB',
      url: 'https://developer.chrome.com/docs/extensions/mv3',
      domain: 'developer.chrome.com',
      quote: 'Service workers terminate when idle. Always open IndexedDB connections per transaction to prevent stall.',
      context: 'Essential pattern for our background message listener restart.',
      time: '10 mins ago'
    },
    {
      id: 'demo-2',
      title: 'Neobrutalism Design Guide & UI Principles',
      url: 'https://uxdesign.cc/neobrutalism-ui-trend',
      domain: 'uxdesign.cc',
      quote: 'High contrast borders, solid drop shadows, and unapologetic functional color accents.',
      context: 'Color palette reference for our dashboard cards and badges.',
      time: 'Yesterday'
    }
  ];

  // DOM Elements - Demo
  const demoFeedContainer = document.getElementById('demo-cards-feed');
  const demoFeedCount = document.getElementById('demo-feed-count');
  const demoSaveForm = document.getElementById('demo-save-form');
  const demoContextInput = document.getElementById('demo-context-input');
  const demoSearchInput = document.getElementById('demo-search-input');
  const demoSubmitBtn = document.getElementById('demo-submit-btn');

  // DOM Elements - Contact Modal
  const contactModal = document.getElementById('contact-modal');
  const navContactBtn = document.getElementById('nav-contact-btn');
  const footerContactBtn = document.getElementById('footer-contact-btn');
  const closeContactModal = document.getElementById('close-contact-modal');
  const cancelContactBtn = document.getElementById('cancel-contact-btn');
  const contactForm = document.getElementById('contact-form');
  const contactStatus = document.getElementById('contact-status');

  // 1. Render Demo Cards
  function renderDemoFeed() {
    const query = (demoSearchInput.value || '').trim().toLowerCase();
    demoFeedContainer.innerHTML = '';

    const filtered = demoSaves.filter(item => {
      if (!query) return true;
      return (
        item.title.toLowerCase().includes(query) ||
        item.context.toLowerCase().includes(query) ||
        item.quote.toLowerCase().includes(query) ||
        item.domain.toLowerCase().includes(query)
      );
    });

    demoFeedCount.textContent = demoSaves.length.toString();

    if (filtered.length === 0) {
      const emptyEl = document.createElement('div');
      emptyEl.style.padding = '20px';
      emptyEl.style.textAlign = 'center';
      emptyEl.style.color = '#888888';
      emptyEl.textContent = 'No cards matched your query.';
      demoFeedContainer.appendChild(emptyEl);
      return;
    }

    filtered.forEach(item => {
      const card = document.createElement('div');
      card.className = 'demo-feed-card';

      // Header row
      const headerRow = document.createElement('div');
      headerRow.style.display = 'flex';
      headerRow.style.justifyContent = 'space-between';
      headerRow.style.alignItems = 'center';

      const domainPill = document.createElement('span');
      domainPill.className = 'code-pill';
      domainPill.textContent = item.domain;

      const timeText = document.createElement('span');
      timeText.style.fontFamily = "'Space Mono', monospace";
      timeText.style.fontSize = '10px';
      timeText.style.color = '#888888';
      timeText.textContent = item.time;

      headerRow.appendChild(domainPill);
      headerRow.appendChild(timeText);

      // Title
      const titleEl = document.createElement('div');
      titleEl.className = 'demo-card-title';
      titleEl.textContent = item.title;

      // Quote (if any)
      card.appendChild(headerRow);
      card.appendChild(titleEl);

      if (item.quote) {
        const quoteBox = document.createElement('div');
        quoteBox.className = 'sim-quote-box';
        quoteBox.textContent = `"${item.quote}"`;
        card.appendChild(quoteBox);
      }

      // Context
      const contextBox = document.createElement('div');
      contextBox.className = 'demo-context-box';
      contextBox.textContent = `💡 WHY SAVED: ${item.context}`;
      card.appendChild(contextBox);

      demoFeedContainer.appendChild(card);
    });
  }

  // 2. Add New Demo Card
  demoSaveForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const note = demoContextInput.value.trim();
    if (!note) return;

    demoSubmitBtn.disabled = true;
    demoSubmitBtn.textContent = 'Saving to Sandbox...';

    setTimeout(() => {
      demoSubmitBtn.disabled = false;
      demoSubmitBtn.textContent = '⚡ Save Content to Dashboard';

      demoSaves.unshift({
        id: 'demo-' + Date.now(),
        title: 'Deep Dive: Manifest V3 Service Workers & IndexedDB',
        url: 'https://developer.chrome.com/docs/extensions/mv3',
        domain: 'developer.chrome.com',
        quote: 'Service workers terminate when idle. Always open IndexedDB connections per transaction to prevent stall.',
        context: note,
        time: 'Just now'
      });

      renderDemoFeed();
      demoFeedContainer.scrollTop = 0;
    }, 300);
  });

  demoSearchInput.addEventListener('input', renderDemoFeed);

  // 3. Contact Modal Management
  function openContactModal() {
    contactModal.classList.remove('hidden');
    contactStatus.classList.add('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeContact() {
    contactModal.classList.add('hidden');
    document.body.style.overflow = '';
  }

  if (navContactBtn) navContactBtn.addEventListener('click', openContactModal);
  if (footerContactBtn) footerContactBtn.addEventListener('click', openContactModal);
  if (closeContactModal) closeContactModal.addEventListener('click', closeContact);
  if (cancelContactBtn) cancelContactBtn.addEventListener('click', closeContact);

  contactModal.addEventListener('click', (e) => {
    if (e.target === contactModal) closeContact();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !contactModal.classList.contains('hidden')) {
      closeContact();
    }
  });

  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    contactStatus.classList.remove('hidden');
    contactForm.reset();
    setTimeout(() => {
      closeContact();
    }, 2000);
  });

  // Initial Render
  renderDemoFeed();
});
