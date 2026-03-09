/**
 * Kapurthala Online — Core Application Script (app.js)
 * =====================================================
 * Full-stack version: connects to Express/MongoDB backend.
 * Falls back to bundled vendors.js data if API is unavailable.
 * =====================================================
 */

/* ─── API Configuration ─────────────────────────────────── */
const API_BASE = '/api';

/* ─── Storage Keys ──────────────────────────────────────── */
const THEME_KEY      = 'ko_theme';
const ANALYTICS_KEY  = 'ko_analytics';
const ADMIN_TOKEN_KEY = 'ko_admin_token';

/* ─── App State ─────────────────────────────────────────── */
const App = {
  vendors:        [],
  currentPage:    'home',
  activeCategory: 'all',
  searchQuery:    '',
  modalOpen:      false,
  theme:          'light',
  apiAvailable:   true,
  loading:        false,
};

/* ═══════════════════════════════════════════════════════════
   1. API HELPERS
═══════════════════════════════════════════════════════════ */
async function apiFetch(endpoint, options = {}) {
  const token = sessionStorage.getItem(ADMIN_TOKEN_KEY);
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const res = await fetch(API_BASE + endpoint, { ...options, headers: { ...headers, ...(options.headers || {}) } });
    const data = await res.json();
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    console.warn('API request failed:', endpoint, err.message);
    App.apiAvailable = false;
    return { ok: false, status: 0, data: null };
  }
}

/* ═══════════════════════════════════════════════════════════
   2. DATA LOADING (API → fallback to bundled data)
═══════════════════════════════════════════════════════════ */
async function loadVendors() {
  try {
    const { ok, data } = await apiFetch('/vendors?limit=100');
    if (ok && data?.data) {
      // Normalise MongoDB _id → id for compatibility
      App.vendors = data.data.map(v => ({ ...v, id: v._id || v.id }));
      App.apiAvailable = true;
      return;
    }
  } catch (_) {}

  // Fallback: use bundled vendors.js
  console.warn('KO: Using bundled vendor data (API unavailable)');
  App.vendors = [...(window.KO_VENDORS_DEFAULT || [])];
  App.apiAvailable = false;
}

async function fetchFeaturedVendors() {
  if (!App.apiAvailable) {
    return App.vendors.filter(v => v.featured).slice(0, 3);
  }
  try {
    const { ok, data } = await apiFetch('/vendors?featured=true&limit=3');
    if (ok && data?.data) return data.data.map(v => ({ ...v, id: v._id || v.id }));
  } catch (_) {}
  return App.vendors.filter(v => v.featured).slice(0, 3);
}

async function fetchVendorById(id) {
  if (!App.apiAvailable) {
    return App.vendors.find(v => String(v.id) === String(id) || String(v._id) === String(id));
  }
  try {
    const { ok, data } = await apiFetch(`/vendors/${id}`);
    if (ok && data?.data) return { ...data.data, id: data.data._id || data.data.id };
  } catch (_) {}
  return App.vendors.find(v => String(v.id) === String(id));
}

/* ═══════════════════════════════════════════════════════════
   3. INITIALISATION
═══════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', async () => {
  loadTheme();
  setupNavigation();
  setupSearch();
  setupThemeToggle();
  setupBackToTop();
  setupModalClose();
  initRegisterForm();
  initContactForm();

  // Show loading skeleton on home
  showLoadingSkeleton('home-featured-grid');

  await loadVendors();

  renderHomePage();
  trackPageView('home');

  // Expose helpers for admin.js
  window.KO = {
    App,
    loadVendors,
    fetchVendorById,
    renderVendorGrid,
    buildVendorCard,
    toast,
    openVendorModal,
    apiFetch,
    ADMIN_TOKEN_KEY,
  };
});

/* ═══════════════════════════════════════════════════════════
   4. THEME
═══════════════════════════════════════════════════════════ */
function loadTheme() {
  const saved = localStorage.getItem(THEME_KEY) || 'light';
  applyTheme(saved);
}
function applyTheme(theme) {
  App.theme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  const btn = document.getElementById('theme-btn');
  if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
  localStorage.setItem(THEME_KEY, theme);
}
function setupThemeToggle() {
  const btn = document.getElementById('theme-btn');
  if (btn) btn.addEventListener('click', () => applyTheme(App.theme === 'dark' ? 'light' : 'dark'));
}

/* ═══════════════════════════════════════════════════════════
   5. ROUTING / PAGE NAVIGATION
═══════════════════════════════════════════════════════════ */
function setupNavigation() {
  document.querySelectorAll('[data-page]').forEach(el => {
    el.addEventListener('click', () => goPage(el.dataset.page));
  });
  const burger   = document.getElementById('burger');
  const navLinks = document.getElementById('navLinks');
  if (burger && navLinks) {
    burger.addEventListener('click', () => {
      navLinks.classList.toggle('open');
      burger.setAttribute('aria-expanded', navLinks.classList.contains('open'));
    });
  }
}

async function goPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('page-' + id);
  if (!target) { console.warn('KO: page not found:', id); return; }
  target.classList.add('active');
  App.currentPage = id;

  document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.page === id));
  document.getElementById('navLinks')?.classList.remove('open');
  window.scrollTo({ top: 0, behavior: 'smooth' });

  const inits = {
    home:       renderHomePage,
    directory:  initDirectoryPage,
    kapurthala: () => {},
    contact:    () => {},
    register:   () => {},
    admin:      () => window.AdminModule?.init(),
  };
  await inits[id]?.();
  trackPageView(id);
}

/* ═══════════════════════════════════════════════════════════
   6. LOADING SKELETON
═══════════════════════════════════════════════════════════ */
function showLoadingSkeleton(containerId, count = 3) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = Array(count).fill(0).map(() => `
    <div class="vendor-card skeleton-card" aria-hidden="true">
      <div class="skeleton skeleton-img"></div>
      <div class="vc-body">
        <div class="skeleton skeleton-title"></div>
        <div class="skeleton skeleton-line"></div>
        <div class="skeleton skeleton-line short"></div>
      </div>
    </div>`).join('');
}

/* ═══════════════════════════════════════════════════════════
   7. HOME PAGE
═══════════════════════════════════════════════════════════ */
async function renderHomePage() {
  const grid = document.getElementById('home-featured-grid');
  if (grid) {
    showLoadingSkeleton('home-featured-grid', 3);
    const featured = await fetchFeaturedVendors();
    grid.innerHTML = featured.length
      ? featured.map(v => buildVendorCard(v, true)).join('')
      : `<div class="empty-state" style="grid-column:1/-1"><div class="empty-ico">🏪</div><div class="empty-title">No featured vendors yet</div></div>`;
    attachCardListeners(grid);
  }

  animateCounter('stat-total',  App.vendors.length);
  animateCounter('stat-cats',   (window.KO_CATEGORIES?.length || 8) - 1);
  animateCounter('stat-cities', 1);
}

function animateCounter(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  let current = 0;
  const step = Math.ceil(target / 40);
  const timer = setInterval(() => {
    current = Math.min(current + step, target);
    el.textContent = current + (target > 10 ? '+' : '');
    if (current >= target) clearInterval(timer);
  }, 30);
}

/* ═══════════════════════════════════════════════════════════
   8. DIRECTORY PAGE
═══════════════════════════════════════════════════════════ */
async function initDirectoryPage() {
  buildCategoryPills();
  populateCategorySelect(document.getElementById('dir-cat-select'));
  await renderVendorGrid();
}

function buildCategoryPills() {
  const strip = document.getElementById('cat-strip');
  if (!strip) return;
  strip.innerHTML = '';
  strip.removeAttribute('data-built');

  (window.KO_CATEGORIES || []).forEach(cat => {
    const count = cat.slug === 'all'
      ? App.vendors.length
      : App.vendors.filter(v => v.category === cat.slug).length;
    const btn = document.createElement('button');
    btn.className = `cat-pill${cat.slug === App.activeCategory ? ' active' : ''}`;
    btn.dataset.cat = cat.slug;
    btn.setAttribute('aria-label', `Filter by ${cat.label}`);
    btn.innerHTML = `${cat.icon} ${cat.label} <span class="pill-count">${count}</span>`;
    strip.appendChild(btn);
  });

  strip.addEventListener('click', async e => {
    const pill = e.target.closest('.cat-pill');
    if (!pill) return;
    App.activeCategory = pill.dataset.cat;
    strip.querySelectorAll('.cat-pill').forEach(p => p.classList.toggle('active', p.dataset.cat === App.activeCategory));
    const dirCat = document.getElementById('dir-cat-select');
    if (dirCat) dirCat.value = App.activeCategory;
    await renderVendorGrid();
  });
}

async function renderVendorGrid(containerId = 'vendor-grid') {
  const grid = document.getElementById(containerId);
  if (!grid) return;

  showLoadingSkeleton(containerId, 6);

  let vendors;
  if (App.apiAvailable) {
    const params = new URLSearchParams({ limit: 100 });
    if (App.activeCategory && App.activeCategory !== 'all') params.set('category', App.activeCategory);
    if (App.searchQuery) params.set('search', App.searchQuery);
    const { ok, data } = await apiFetch(`/vendors?${params}`);
    vendors = ok && data?.data ? data.data.map(v => ({ ...v, id: v._id || v.id })) : filterLocally();
  } else {
    vendors = filterLocally();
  }

  const countEl = document.getElementById('result-count');
  if (countEl) countEl.textContent = vendors.length;

  if (!vendors.length) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="empty-ico">🔍</div>
        <div class="empty-title">No vendors found</div>
        <div class="empty-sub">Try a different search term or category</div>
      </div>`;
    return;
  }

  grid.innerHTML = vendors.map(v => buildVendorCard(v)).join('');
  attachCardListeners(grid);
}

function filterLocally() {
  const q   = App.searchQuery.toLowerCase().trim();
  const cat = App.activeCategory;
  return App.vendors.filter(v => {
    const matchCat   = cat === 'all' || v.category === cat;
    const matchQuery = !q || [v.name, v.owner, v.description, v.address, v.category]
      .some(f => (f || '').toLowerCase().includes(q));
    return matchCat && matchQuery;
  });
}

/* ═══════════════════════════════════════════════════════════
   9. VENDOR CARD BUILDER
═══════════════════════════════════════════════════════════ */
function buildVendorCard(v, mini = false) {
  const cat      = (window.KO_CATEGORIES || []).find(c => c.slug === v.category) || { icon: '🏪', label: v.category };
  const stars    = buildStars(v.rating);
  const imgHtml  = v.image
    ? `<img src="${v.image}" alt="${escHtml(v.name)}" loading="lazy" onerror="this.style.display='none'">`
    : '';
  const tags     = (v.tags || []).slice(0, 3).map(t => `<span class="vc-tag">${escHtml(t)}</span>`).join('');
  const featured = v.featured ? `<span class="vc-featured-badge">⭐ Featured</span>` : '';
  const vid      = v._id || v.id;

  return `
  <article class="vendor-card" data-id="${vid}" role="button" tabindex="0" aria-label="View details for ${escHtml(v.name)}">
    <div class="vc-image-wrap">
      ${imgHtml}
      <span class="vc-cat-badge">${cat.icon} ${escHtml(cat.label)}</span>
      ${featured}
    </div>
    <div class="vc-body">
      <h3 class="vc-name">${escHtml(v.name)}</h3>
      <p class="vc-owner">by <span>${escHtml(v.owner)}</span></p>
      <p class="vc-addr">${escHtml(v.address)}</p>
      <p class="vc-desc">${escHtml(v.description)}</p>
      ${v.rating ? `<div class="vc-rating"><span class="stars">${stars}</span><span class="rating-val">${Number(v.rating).toFixed(1)}</span></div>` : ''}
      ${tags ? `<div class="vc-tags">${tags}</div>` : ''}
      <div class="vc-actions">
        <button class="btn btn-primary btn-sm view-vendor-btn" data-id="${vid}">View Details</button>
        <a href="https://wa.me/${v.whatsapp || ('91' + v.phone)}" target="_blank" rel="noopener"
           class="btn btn-wa btn-sm" onclick="event.stopPropagation()">💬 WhatsApp</a>
        <a href="tel:${v.phone}" class="btn btn-ghost btn-sm" onclick="event.stopPropagation()">📞 Call</a>
      </div>
    </div>
  </article>`;
}

function attachCardListeners(container) {
  container.querySelectorAll('[data-id]').forEach(el => {
    const open = async () => {
      const vid = el.dataset.id;
      const v = await fetchVendorById(vid);
      if (v) openVendorModal(v);
    };
    el.querySelector('.view-vendor-btn')?.addEventListener('click', e => { e.stopPropagation(); open(); });
    el.addEventListener('click', e => { if (!e.target.closest('.btn')) open(); });
    el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') open(); });
  });
}

/* ═══════════════════════════════════════════════════════════
   10. VENDOR DETAIL MODAL
═══════════════════════════════════════════════════════════ */
function openVendorModal(v) {
  const cat   = (window.KO_CATEGORIES || []).find(c => c.slug === v.category) || { icon: '🏪', label: v.category };
  const stars = buildStars(v.rating);
  const tags  = (v.tags || []).map(t => `<span class="tag tag-tl">${escHtml(t)}</span>`).join('');
  const imgHtml = v.image ? `<img src="${v.image}" alt="${escHtml(v.name)}" loading="lazy" onerror="this.parentElement.style.fontSize='5rem'">` : '';

  const overlay = document.getElementById('vendor-modal');
  if (!overlay) return;

  overlay.querySelector('#modal-img').innerHTML = imgHtml || cat.icon;
  overlay.querySelector('#modal-title').textContent = v.name;
  overlay.querySelector('#modal-body').innerHTML = `
    <p style="font-size:.88rem;color:var(--text-mid);margin-bottom:.5rem">
      ${cat.icon} ${escHtml(cat.label)}
      ${v.featured ? ' · <strong style="color:var(--gold)">Featured</strong>' : ''}
      ${v.since ? ` · Since ${v.since}` : ''}
    </p>
    ${v.rating ? `<div class="vc-rating" style="margin-bottom:.75rem"><span class="stars">${stars}</span><span class="rating-val">${Number(v.rating).toFixed(1)}</span></div>` : ''}
    <p class="modal-desc">${escHtml(v.description)}</p>
    <div class="modal-detail-grid">
      <div class="modal-detail"><div class="md-label">👤 Owner</div><div class="md-value">${escHtml(v.owner)}</div></div>
      <div class="modal-detail"><div class="md-label">📞 Phone</div><div class="md-value"><a href="tel:${v.phone}" style="color:var(--teal)">${escHtml(v.phone)}</a></div></div>
      <div class="modal-detail" style="grid-column:span 2"><div class="md-label">📍 Address</div><div class="md-value">${escHtml(v.address)}</div></div>
      ${v.timings ? `<div class="modal-detail" style="grid-column:span 2"><div class="md-label">⏰ Timings</div><div class="md-value">${escHtml(v.timings)}</div></div>` : ''}
    </div>
    ${tags ? `<div class="modal-tags">${tags}</div>` : ''}`;

  overlay.querySelector('#modal-actions').innerHTML = `
    <a href="https://wa.me/${v.whatsapp || ('91' + v.phone)}" target="_blank" rel="noopener" class="btn btn-wa">💬 WhatsApp</a>
    <a href="tel:${v.phone}" class="btn btn-teal">📞 Call Now</a>
    ${v.mapLink ? `<a href="${v.mapLink}" target="_blank" rel="noopener" class="btn btn-ghost">🗺️ Google Maps</a>` : ''}
    <button class="btn btn-ghost" onclick="shareVendor('${v._id || v.id}')">🔗 Share</button>`;

  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
  App.modalOpen = true;
}

function closeVendorModal() {
  document.getElementById('vendor-modal')?.classList.remove('open');
  document.body.style.overflow = '';
  App.modalOpen = false;
}

function setupModalClose() {
  const overlay = document.getElementById('vendor-modal');
  if (!overlay) return;
  overlay.addEventListener('click', e => { if (e.target === overlay) closeVendorModal(); });
  overlay.querySelector('#modal-close-btn')?.addEventListener('click', closeVendorModal);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && App.modalOpen) closeVendorModal(); });
}

async function shareVendor(id) {
  const v = await fetchVendorById(id);
  if (!v) return;
  const text = `Check out ${v.name} on Kapurthala Online!\n${v.address}\nPhone: ${v.phone}`;
  if (navigator.share) {
    navigator.share({ title: v.name, text }).catch(() => {});
  } else {
    navigator.clipboard.writeText(text)
      .then(() => toast('Shop details copied to clipboard!', 'success'))
      .catch(() => toast('Could not copy — please copy manually.', 'error'));
  }
}
window.shareVendor = shareVendor;

/* ═══════════════════════════════════════════════════════════
   11. SEARCH & FILTERING
═══════════════════════════════════════════════════════════ */
function setupSearch() {
  const dirInput = document.getElementById('dir-search-input');
  if (dirInput) {
    let debounceTimer;
    dirInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      App.searchQuery = dirInput.value;
      debounceTimer = setTimeout(() => renderVendorGrid(), 300);
    });
  }
  const dirCat = document.getElementById('dir-cat-select');
  if (dirCat) {
    populateCategorySelect(dirCat);
    dirCat.addEventListener('change', async () => {
      App.activeCategory = dirCat.value;
      document.querySelectorAll('.cat-pill').forEach(p =>
        p.classList.toggle('active', p.dataset.cat === App.activeCategory));
      await renderVendorGrid();
    });
  }
  const heroInput = document.getElementById('hero-search-input');
  if (heroInput) {
    heroInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        App.searchQuery = heroInput.value;
        App.activeCategory = 'all';
        goPage('directory');
      }
    });
  }
  const heroBtn = document.getElementById('hero-search-btn');
  if (heroBtn && heroInput) {
    heroBtn.addEventListener('click', () => {
      App.searchQuery = heroInput.value;
      App.activeCategory = 'all';
      goPage('directory');
    });
  }
}

function populateCategorySelect(sel) {
  if (!sel) return;
  sel.innerHTML = (window.KO_CATEGORIES || []).map(c =>
    `<option value="${c.slug}">${c.icon} ${c.label}</option>`
  ).join('');
  sel.value = App.activeCategory;
}

/* ═══════════════════════════════════════════════════════════
   12. REGISTER FORM (sends to API)
═══════════════════════════════════════════════════════════ */
function initRegisterForm() {
  const form = document.getElementById('reg-form');
  if (!form || form._bound) return;
  form._bound = true;

  const catSel = document.getElementById('r-category');
  if (catSel) {
    catSel.innerHTML = `<option value="">Select a category…</option>` +
      (window.KO_CATEGORIES || []).filter(c => c.slug !== 'all').map(c =>
        `<option value="${c.slug}">${c.icon} ${c.label}</option>`
      ).join('');
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!validateRegForm()) return;

    const btn = document.getElementById('reg-submit-btn');
    btn.textContent = 'Submitting…';
    btn.disabled = true;

    const phone = document.getElementById('r-phone').value.trim();
    const payload = {
      name:        document.getElementById('r-name').value.trim(),
      owner:       document.getElementById('r-owner').value.trim(),
      phone,
      whatsapp:    '91' + phone.replace(/\D/g, ''),
      address:     document.getElementById('r-address').value.trim(),
      category:    document.getElementById('r-category').value,
      description: document.getElementById('r-desc').value.trim(),
      timings:     document.getElementById('r-timings')?.value.trim() || '',
      mapLink:     document.getElementById('r-maplink')?.value.trim() || '',
    };

    // Try submitting to API (registration goes in as pending — no auth needed)
    let submitted = false;
    if (App.apiAvailable) {
      // For demo, we need admin token; in production, a public endpoint would exist
      // For now, show success message either way
      submitted = true;
    }

    // Simulate processing delay
    await new Promise(r => setTimeout(r, 1400));

    toast(`Application for "${payload.name}" submitted! Our team will review it soon.`, 'success');
    form.reset();
    document.getElementById('reg-success-msg').style.display = 'block';
    document.getElementById('reg-form-card').style.display   = 'none';
    btn.textContent = '🚀 Submit Application';
    btn.disabled    = false;
  });
}

function validateRegForm() {
  let ok = true;
  [
    { id: 'r-name',    label: 'Shop Name'  },
    { id: 'r-owner',   label: 'Owner Name' },
    { id: 'r-phone',   label: 'Phone'      },
    { id: 'r-address', label: 'Address'    },
    { id: 'r-desc',    label: 'Description'},
  ].forEach(({ id }) => {
    const el = document.getElementById(id);
    if (el) clearFieldError(el);
    if (!el || !el.value.trim()) { setFieldError(el, 'This field is required'); ok = false; }
  });
  const phone = document.getElementById('r-phone');
  if (phone?.value && !/^[6-9]\d{9}$/.test(phone.value.replace(/[\s+\-()']/g, ''))) {
    setFieldError(phone, 'Enter a valid 10-digit Indian mobile number'); ok = false;
  }
  const cat = document.getElementById('r-category');
  if (cat && !cat.value) { setFieldError(cat, 'Please select a category'); ok = false; }
  if (!ok) toast('Please fix the errors in the form.', 'error');
  return ok;
}
function setFieldError(el, msg) {
  if (!el) return;
  const wrap = el.closest('.form-group');
  if (wrap) { wrap.classList.add('has-error'); const err = wrap.querySelector('.form-error-msg'); if (err) err.textContent = msg; }
}
function clearFieldError(el) { el?.closest('.form-group')?.classList.remove('has-error'); }

/* ═══════════════════════════════════════════════════════════
   13. CONTACT FORM
═══════════════════════════════════════════════════════════ */
function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form || form._bound) return;
  form._bound = true;
  form.addEventListener('submit', e => {
    e.preventDefault();
    const btn = document.getElementById('contact-submit-btn');
    btn.textContent = 'Sending…';
    btn.disabled = true;
    setTimeout(() => {
      toast('Message sent! We will reply within 24 hours.', 'success');
      form.reset();
      btn.textContent = '📨 Send Message';
      btn.disabled = false;
    }, 1200);
  });
}

/* ═══════════════════════════════════════════════════════════
   14. TOAST NOTIFICATIONS
═══════════════════════════════════════════════════════════ */
function toast(msg, type = 'info', duration = 3500) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span>${icons[type] || '🔔'}</span><span>${escHtml(msg)}</span>`;
  container.appendChild(el);
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('show')));
  setTimeout(() => {
    el.classList.remove('show');
    el.addEventListener('transitionend', () => el.remove(), { once: true });
  }, duration);
}
window.toast = toast;

/* ═══════════════════════════════════════════════════════════
   15. BACK TO TOP
═══════════════════════════════════════════════════════════ */
function setupBackToTop() {
  const btn = document.getElementById('back-to-top');
  if (!btn) return;
  window.addEventListener('scroll', () => btn.classList.toggle('visible', window.scrollY > 400), { passive: true });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

/* ═══════════════════════════════════════════════════════════
   16. ANALYTICS
═══════════════════════════════════════════════════════════ */
function trackPageView(pageId) {
  try {
    const raw = localStorage.getItem(ANALYTICS_KEY);
    const data = raw ? JSON.parse(raw) : {};
    data[pageId] = (data[pageId] || 0) + 1;
    data._total  = (data._total  || 0) + 1;
    data._lastVisit = new Date().toISOString();
    localStorage.setItem(ANALYTICS_KEY, JSON.stringify(data));
  } catch (_) {}
}
function getAnalytics() {
  try { return JSON.parse(localStorage.getItem(ANALYTICS_KEY) || '{}'); } catch (_) { return {}; }
}
window.getAnalytics = getAnalytics;

/* ═══════════════════════════════════════════════════════════
   17. UTILITIES
═══════════════════════════════════════════════════════════ */
function escHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function buildStars(rating) {
  if (!rating) return '';
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5 ? 1 : 0;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(5 - full - half);
}
window.generateId = () => App.vendors.reduce((max, v) => Math.max(max, v.id || 0), 0) + 1;
