'use strict';

// A lightweight replacement for the theme's scrolling header and mobile menu.
const header = document.querySelector('.site-header');
if (header) {
  const menuButton = header.querySelector('.mobile-menu-button');
  const nav = header.querySelector('.site-nav');
  const main = document.querySelector('main');
  const footer = document.querySelector('.site-footer');
  const appointment = header.querySelector('.appointment-link');
  const desktop = window.matchMedia('(min-width: 1024px)');
  let menuOpen = false;
  function setMenu(open, returnFocus = false) {
    menuOpen = open && !desktop.matches;
    header.classList.toggle('menu-open', menuOpen);
    document.body.classList.toggle('menu-active', menuOpen);
    menuButton.setAttribute('aria-expanded', String(menuOpen));
    menuButton.setAttribute('aria-label', menuOpen ? 'Close menu' : 'Open menu');
    [main, footer, appointment].forEach(element => { if (element) element.inert = menuOpen; });
    if (menuOpen) nav.querySelector('a').focus();
    else if (returnFocus) menuButton.focus();
  }
  header.classList.add('enhanced');
  menuButton.hidden = false;
  menuButton.addEventListener('click', () => setMenu(!menuOpen, menuOpen));
  nav.addEventListener('click', event => {
    if (event.target.closest('a')) setMenu(false);
  });
  document.addEventListener('keydown', event => {
    if (!menuOpen) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      setMenu(false, true);
    } else if (event.key === 'Tab') {
      const links = [...nav.querySelectorAll('a')];
      const focusable = [menuButton, ...links];
      const index = focusable.indexOf(document.activeElement);
      const next = (index + (event.shiftKey ? -1 : 1) + focusable.length) % focusable.length;
      event.preventDefault();
      focusable[next].focus();
    }
  });
  desktop.addEventListener('change', () => setMenu(false));
  let scrollPending = false;
  function updateHeader() {
    header.classList.toggle('scrolled', window.scrollY > 100);
    scrollPending = false;
  }
  window.addEventListener('scroll', () => {
    if (!scrollPending) {
      scrollPending = true;
      window.requestAnimationFrame(updateHeader);
    }
  }, {passive: true});
  window.addEventListener('pageshow', updateHeader);
  updateHeader();
}

// The HTML is the sole publication data source, including for crawlers and no-JS users.
const publicationList = document.querySelector('#publications-list');
if (publicationList) {
  const search = document.querySelector('#publication-search');
  const toggle = document.querySelector('#toggle-publications');
  const status = document.querySelector('#publication-count');
  const items = [...publicationList.children].map(element => ({
    element, text: element.textContent.toLocaleLowerCase()
  }));
  let expanded = false;
  function renderPublications() {
    const query = search.value.trim().toLocaleLowerCase();
    const matches = items.filter(item => item.text.includes(query));
    const shown = query || expanded ? matches : matches.slice(0, 5);
    items.forEach(item => { item.element.hidden = !shown.includes(item); });
    status.textContent = matches.length === 0 ? 'No publications match your search.' :
      `Showing ${shown.length} of ${matches.length} publications${query ? ' matching your search' : ''}.`;
    toggle.hidden = Boolean(query) || matches.length <= 5;
    toggle.textContent = expanded ? 'Show Less' : 'Show More';
    toggle.setAttribute('aria-expanded', String(expanded));
  }
  document.querySelector('.publication-tools').hidden = false;
  search.addEventListener('input', renderPublications);
  toggle.addEventListener('click', () => {
    expanded = !expanded;
    renderPublications();
    if (!expanded) search.focus({preventScroll: false});
  });
  renderPublications();
}

// Automatic production analytics, with advertising features disabled.
const analyticsId = 'G-YCWX23VR6P';
let analyticsStarted = false;
function startAnalytics() {
  if (analyticsStarted || !['ryanchuangmd.com', 'www.ryanchuangmd.com'].includes(location.hostname)) return;
  analyticsStarted = true;
  window[`ga-disable-${analyticsId}`] = false;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag('consent', 'default', {
    analytics_storage: 'granted', ad_storage: 'denied',
    ad_user_data: 'denied', ad_personalization: 'denied'
  });
  window.gtag('js', new Date());
  window.gtag('config', analyticsId, {
    allow_google_signals: false, allow_ad_personalization_signals: false,
    send_page_view: false, page_location: location.origin + location.pathname,
    page_referrer: '', cookie_flags: 'SameSite=Lax;Secure'
  });
  window.gtag('event', 'page_view', {
    page_location: location.origin + location.pathname,
    page_title: document.title, page_referrer: ''
  });
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${analyticsId}`;
  document.head.append(script);
}
// Respect browser privacy signals without displaying a banner or settings UI.
if (navigator.globalPrivacyControl !== true && navigator.doNotTrack !== '1') startAnalytics();
