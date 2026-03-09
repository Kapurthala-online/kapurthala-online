/**
 * Kapurthala Online — Admin Module (admin.js)
 * ============================================
 * Full-stack version: authenticates via JWT, all
 * CRUD operations call the Express backend API.
 * Falls back to localStorage if API unavailable.
 * ============================================
 */

const ADMIN_SESSION_KEY = 'ko_admin_session';

const AdminState = {
  loggedIn:    false,
  editingId:   null,
  activePanel: 'overview',
  token:       null,
};

window.AdminModule = { init: adminInit };

/* ═══════════════════════════════════════════════════════════
   1. INIT
═══════════════════════════════════════════════════════════ */
function adminInit() {
  const savedToken = sessionStorage.getItem(ADMIN_SESSION_KEY);
  if (savedToken) {
    AdminState.loggedIn = true;
    AdminState.token    = savedToken;
    if (window.KO) window.KO.App._adminToken = savedToken;
  }
  renderAdminGate();
  setupLoginForm();
  if (AdminState.loggedIn) showDashboard();
}

/* ═══════════════════════════════════════════════════════════
   2. LOGIN / LOGOUT
═══════════════════════════════════════════════════════════ */
function setupLoginForm() {
  const form = document.getElementById('admin-login-form');
  if (!form || form._bound) return;
  form._bound = true;

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const user = document.getElementById('adm-username').value.trim();
    const pass = document.getElementById('adm-password').value;
    const btn  = form.querySelector('button[type="submit"]');
    btn.textContent = 'Logging in…';
    btn.disabled = true;

    try {
      const res  = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user, password: pass }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        AdminState.loggedIn = true;
        AdminState.token    = data.token;
        sessionStorage.setItem(ADMIN_SESSION_KEY, data.token);
        sessionStorage.setItem(window.KO?.ADMIN_TOKEN_KEY || 'ko_admin_token', data.token);
        showDashboard();
        window.toast?.('Welcome back, Admin! 👋', 'success');
      } else {
        // Fallback to local credentials for demo/offline mode
        if (user === 'admin' && pass === 'kapurthala2024') {
          AdminState.loggedIn = true;
          AdminState.token    = 'demo-local-token';
          sessionStorage.setItem(ADMIN_SESSION_KEY, 'demo-local-token');
          showDashboard();
          window.toast?.('Logged in (offline demo mode)', 'info');
        } else {
          window.toast?.(data.message || 'Invalid credentials', 'error');
          document.getElementById('adm-password').value = '';
          document.getElementById('adm-password').focus();
        }
      }
    } catch (_) {
      // API unreachable — use demo credentials
      if (user === 'admin' && pass === 'kapurthala2024') {
        AdminState.loggedIn = true;
        AdminState.token    = 'demo-local-token';
        sessionStorage.setItem(ADMIN_SESSION_KEY, 'demo-local-token');
        showDashboard();
        window.toast?.('Logged in (offline mode)', 'info');
      } else {
        window.toast?.('Login failed. Check credentials.', 'error');
      }
    }

    btn.textContent = '🔐 Log In';
    btn.disabled = false;
  });
}

function adminLogout() {
  AdminState.loggedIn = false;
  AdminState.token    = null;
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
  sessionStorage.removeItem(window.KO?.ADMIN_TOKEN_KEY || 'ko_admin_token');
  renderAdminGate();
  window.toast?.('You have been logged out.', 'info');
}
window.adminLogout = adminLogout;

function renderAdminGate() {
  const login = document.getElementById('adm-login-section');
  const dash  = document.getElementById('adm-dashboard');
  if (!login || !dash) return;
  if (AdminState.loggedIn) { login.style.display = 'none'; dash.style.display = 'grid'; }
  else                     { login.style.display = 'flex'; dash.style.display = 'none'; }
}

function showDashboard() {
  renderAdminGate();
  setupAdminNav();
  setupVendorForm();
  refreshStats();
  switchAdminPanel('overview');
}

/* ═══════════════════════════════════════════════════════════
   3. API HELPERS (admin-authenticated)
═══════════════════════════════════════════════════════════ */
async function adminAPI(endpoint, method = 'GET', body = null) {
  const token = AdminState.token || sessionStorage.getItem(ADMIN_SESSION_KEY);
  const opts  = {
    method,
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${token}`,
    },
  };
  if (body) opts.body = JSON.stringify(body);
  try {
    const res  = await fetch('/api' + endpoint, opts);
    const data = await res.json();
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    console.warn('Admin API error:', err);
    return { ok: false, status: 0, data: null };
  }
}

/* ═══════════════════════════════════════════════════════════
   4. SIDEBAR NAVIGATION
═══════════════════════════════════════════════════════════ */
function setupAdminNav() {
  document.querySelectorAll('.admin-nav-item').forEach(btn => {
    if (btn._bound) return;
    btn._bound = true;
    btn.addEventListener('click', () => switchAdminPanel(btn.dataset.panel));
  });
}

function switchAdminPanel(panelId) {
  AdminState.activePanel = panelId;
  document.querySelectorAll('.admin-panel').forEach(p =>
    p.classList.toggle('ap', p.id === 'adm-panel-' + panelId));
  document.querySelectorAll('.admin-nav-item').forEach(b =>
    b.classList.toggle('act', b.dataset.panel === panelId));

  const titles = {
    overview: 'Dashboard Overview',
    vendors:  'Manage Vendors',
    add:      AdminState.editingId ? 'Edit Vendor' : 'Add New Vendor',
    analytics: 'Analytics',
    settings:  'Settings',
  };
  const titleEl = document.getElementById('adm-page-title');
  if (titleEl) titleEl.textContent = titles[panelId] || 'Admin';

  if (panelId === 'overview')   renderOverviewPanel();
  if (panelId === 'vendors')    renderVendorsTable();
  if (panelId === 'add')        renderAddForm();
  if (panelId === 'analytics')  renderAnalyticsPanel();
  if (panelId === 'settings')   renderSettingsPanel();
}
window.switchAdminPanel = switchAdminPanel;

/* ═══════════════════════════════════════════════════════════
   5. STATS
═══════════════════════════════════════════════════════════ */
async function refreshStats() {
  const vendors = window.KO?.App?.vendors || [];
  setEl('adm-stat-total',    vendors.length);
  setEl('adm-stat-total-2',  vendors.length);
  setEl('adm-stat-cats',     new Set(vendors.map(v => v.category)).size);
  setEl('adm-stat-featured', vendors.filter(v => v.featured).length);
  setEl('adm-stat-visits',   window.getAnalytics?.()._total || 0);

  // Try to get real stats from API
  if (window.KO?.App?.apiAvailable) {
    const { ok, data } = await adminAPI('/vendors/stats');
    if (ok && data?.data) {
      setEl('adm-stat-total',   data.data.total);
      setEl('adm-stat-total-2', data.data.total);
      setEl('adm-stat-cats',    data.data.categories);
      setEl('adm-stat-featured', data.data.featured);
    }
  }
}

/* ═══════════════════════════════════════════════════════════
   6. OVERVIEW PANEL
═══════════════════════════════════════════════════════════ */
async function renderOverviewPanel() {
  await refreshStats();
  const vendors = window.KO?.App?.vendors || [];
  const recentBody = document.getElementById('adm-recent-tbody');
  if (!recentBody) return;
  const recent = [...vendors].reverse().slice(0, 5);
  recentBody.innerHTML = recent.length
    ? recent.map(v => `
      <tr>
        <td><strong>${escAdm(v.name)}</strong></td>
        <td>${escAdm(v.owner)}</td>
        <td>${escAdm(v.category)}</td>
        <td>${escAdm(v.phone)}</td>
        <td>
          <div class="action-btns">
            <button class="btn btn-ghost btn-sm" onclick="AdminModule._editVendor('${v._id || v.id}')">✏️ Edit</button>
            <button class="btn btn-danger btn-sm" onclick="AdminModule._deleteVendor('${v._id || v.id}')">🗑️ Del</button>
          </div>
        </td>
      </tr>`).join('')
    : `<tr><td colspan="5" style="text-align:center;padding:2rem;color:var(--text-lt)">No vendors yet</td></tr>`;
}

/* ═══════════════════════════════════════════════════════════
   7. VENDORS TABLE
═══════════════════════════════════════════════════════════ */
async function renderVendorsTable() {
  const tbody = document.getElementById('adm-vendors-tbody');
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:2rem"><div class="loading-spin"></div></td></tr>`;

  // Reload from API if available
  if (window.KO?.App?.apiAvailable) {
    const { ok, data } = await adminAPI('/vendors?limit=100&isActive=true');
    if (ok && data?.data) {
      window.KO.App.vendors = data.data.map(v => ({ ...v, id: v._id || v.id }));
    }
  }

  const vendors = window.KO?.App?.vendors || [];
  if (!vendors.length) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:3rem;color:var(--text-lt)">No vendors found. <button class="btn btn-primary btn-sm" onclick="switchAdminPanel('add')">Add First Vendor</button></td></tr>`;
    return;
  }

  tbody.innerHTML = vendors.map((v, i) => {
    const cat = (window.KO_CATEGORIES || []).find(c => c.slug === v.category);
    return `
    <tr>
      <td>${i + 1}</td>
      <td><strong>${escAdm(v.name)}</strong>${v.featured ? ' <span class="badge badge-approved">Featured</span>' : ''}</td>
      <td>${escAdm(v.owner)}</td>
      <td>${cat ? cat.icon + ' ' + cat.label : escAdm(v.category)}</td>
      <td><a href="tel:${v.phone}" style="color:var(--teal)">${escAdm(v.phone)}</a></td>
      <td>${v.rating ? Number(v.rating).toFixed(1) + ' ★' : '—'}</td>
      <td>
        <div class="action-btns">
          <button class="btn btn-teal btn-sm" onclick="AdminModule._editVendor('${v._id || v.id}')">✏️ Edit</button>
          <button class="btn btn-danger btn-sm" onclick="AdminModule._deleteVendor('${v._id || v.id}')">🗑️ Del</button>
          <button class="btn btn-ghost btn-sm" onclick="AdminModule._toggleFeatured('${v._id || v.id}')">
            ${v.featured ? '⭐ Unfeature' : '☆ Feature'}
          </button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

/* ═══════════════════════════════════════════════════════════
   8. ADD / EDIT FORM
═══════════════════════════════════════════════════════════ */
function setupVendorForm() {
  const form = document.getElementById('vendor-crud-form');
  if (!form || form._bound) return;
  form._bound = true;

  const catSel = document.getElementById('adm-v-category');
  if (catSel) {
    catSel.innerHTML = `<option value="">— Select Category —</option>` +
      (window.KO_CATEGORIES || []).filter(c => c.slug !== 'all').map(c =>
        `<option value="${c.slug}">${c.icon} ${c.label}</option>`
      ).join('');
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (AdminState.editingId) await saveEditVendor();
    else await saveNewVendor();
  });

  document.getElementById('adm-form-cancel')?.addEventListener('click', resetVendorForm);
}

function renderAddForm() {
  if (!AdminState.editingId) resetVendorForm();
  setupVendorForm();
}

function resetVendorForm() {
  AdminState.editingId = null;
  document.getElementById('vendor-crud-form')?.reset();
  setEl('adm-form-title',     'Add New Vendor');
  setEl('adm-submit-btn-txt', '➕ Add Vendor');
  document.getElementById('adm-form-cancel')?.setAttribute('style', 'display:none');
}

async function saveNewVendor() {
  const v = collectFormData();
  if (!v) return;

  const btn = document.querySelector('#adm-submit-btn-txt');
  if (btn) btn.textContent = 'Saving…';

  if (window.KO?.App?.apiAvailable) {
    const { ok, data } = await adminAPI('/vendors', 'POST', v);
    if (ok && data?.data) {
      const newVendor = { ...data.data, id: data.data._id || data.data.id };
      window.KO.App.vendors.push(newVendor);
      await refreshStats();
      resetVendorForm();
      window.toast?.(`"${v.name}" added successfully!`, 'success');
    } else {
      window.toast?.(data?.message || 'Failed to add vendor', 'error');
    }
  } else {
    // Fallback: local only
    v.id = window.generateId?.() || Date.now();
    window.KO?.App?.vendors.push(v);
    refreshStats();
    resetVendorForm();
    window.toast?.(`"${v.name}" added (offline mode)!`, 'info');
  }

  if (btn) btn.textContent = '➕ Add Vendor';
}

async function saveEditVendor() {
  const v = collectFormData();
  if (!v) return;

  const btn = document.querySelector('#adm-submit-btn-txt');
  if (btn) btn.textContent = 'Saving…';

  if (window.KO?.App?.apiAvailable) {
    const { ok, data } = await adminAPI(`/vendors/${AdminState.editingId}`, 'PUT', v);
    if (ok && data?.data) {
      const idx = window.KO.App.vendors.findIndex(x => String(x._id || x.id) === String(AdminState.editingId));
      if (idx !== -1) window.KO.App.vendors[idx] = { ...data.data, id: data.data._id || data.data.id };
      resetVendorForm();
      window.toast?.(`"${v.name}" updated!`, 'success');
    } else {
      window.toast?.(data?.message || 'Failed to update vendor', 'error');
    }
  } else {
    const idx = window.KO?.App?.vendors.findIndex(x => String(x.id) === String(AdminState.editingId));
    if (idx !== -1) { window.KO.App.vendors[idx] = { ...window.KO.App.vendors[idx], ...v }; }
    resetVendorForm();
    window.toast?.(`"${v.name}" updated (offline)!`, 'info');
  }

  if (btn) btn.textContent = '💾 Save Changes';
}

function collectFormData() {
  const get = id => document.getElementById(id)?.value.trim() || '';
  const name = get('adm-v-name');
  if (!name) { window.toast?.('Shop Name is required.', 'error'); return null; }
  const phone = get('adm-v-phone');
  if (!phone) { window.toast?.('Phone number is required.', 'error'); return null; }
  const cat = get('adm-v-category');
  if (!cat)   { window.toast?.('Please select a category.', 'error'); return null; }

  const tagsRaw = get('adm-v-tags');
  const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : [];

  return {
    name,
    owner:       get('adm-v-owner'),
    phone,
    whatsapp:    get('adm-v-whatsapp') || ('91' + phone.replace(/\D/g, '')),
    address:     get('adm-v-address'),
    category:    cat,
    description: get('adm-v-desc') || 'A great local shop in Kapurthala.',
    timings:     get('adm-v-timings'),
    mapLink:     get('adm-v-maplink'),
    image:       get('adm-v-image'),
    rating:      parseFloat(get('adm-v-rating')) || 4.0,
    since:       parseInt(get('adm-v-since'), 10) || new Date().getFullYear(),
    tags,
    featured:    document.getElementById('adm-v-featured')?.checked || false,
  };
}

AdminModule._editVendor = function (id) {
  const v = window.KO?.App?.vendors.find(x => String(x._id || x.id) === String(id));
  if (!v) return;
  AdminState.editingId = id;
  switchAdminPanel('add');
  const set = (elId, val) => { const el = document.getElementById(elId); if (el) el.value = val ?? ''; };
  set('adm-v-name',     v.name);
  set('adm-v-owner',    v.owner);
  set('adm-v-phone',    v.phone);
  set('adm-v-whatsapp', v.whatsapp || '');
  set('adm-v-address',  v.address);
  set('adm-v-category', v.category);
  set('adm-v-desc',     v.description);
  set('adm-v-timings',  v.timings || '');
  set('adm-v-maplink',  v.mapLink || '');
  set('adm-v-image',    v.image || '');
  set('adm-v-rating',   v.rating || '');
  set('adm-v-since',    v.since || '');
  set('adm-v-tags',     (v.tags || []).join(', '));
  const featuredCb = document.getElementById('adm-v-featured');
  if (featuredCb) featuredCb.checked = !!v.featured;
  setEl('adm-form-title',     `Edit: ${v.name}`);
  setEl('adm-submit-btn-txt', '💾 Save Changes');
  document.getElementById('adm-form-cancel')?.removeAttribute('style');
};

AdminModule._deleteVendor = async function (id) {
  const v = window.KO?.App?.vendors.find(x => String(x._id || x.id) === String(id));
  if (!v || !confirm(`Delete "${v.name}"?\n\nThis cannot be undone.`)) return;

  if (window.KO?.App?.apiAvailable) {
    const { ok } = await adminAPI(`/vendors/${id}`, 'DELETE');
    if (!ok) { window.toast?.('Failed to delete vendor.', 'error'); return; }
  }

  if (window.KO?.App) {
    window.KO.App.vendors = window.KO.App.vendors.filter(x => String(x._id || x.id) !== String(id));
  }
  refreshStats();
  renderVendorsTable();
  renderOverviewPanel();
  window.toast?.(`"${v.name}" deleted.`, 'info');
};

AdminModule._toggleFeatured = async function (id) {
  const v = window.KO?.App?.vendors.find(x => String(x._id || x.id) === String(id));
  if (!v) return;
  const newFeatured = !v.featured;

  if (window.KO?.App?.apiAvailable) {
    const { ok } = await adminAPI(`/vendors/${id}`, 'PUT', { featured: newFeatured });
    if (!ok) { window.toast?.('Failed to update.', 'error'); return; }
  }

  v.featured = newFeatured;
  renderVendorsTable();
  window.toast?.(`"${v.name}" ${newFeatured ? 'marked as featured' : 'removed from featured'}.`, 'success');
};

/* ═══════════════════════════════════════════════════════════
   9. ANALYTICS PANEL
═══════════════════════════════════════════════════════════ */
function renderAnalyticsPanel() {
  const data  = window.getAnalytics?.() || {};
  const panel = document.getElementById('adm-panel-analytics');
  if (!panel) return;
  const entries = Object.entries(data)
    .filter(([k]) => !k.startsWith('_'))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15);

  panel.querySelector('#analytics-content').innerHTML = `
    <div class="admin-table-card">
      <div class="admin-table-header">
        <span class="admin-table-title">📊 Page Views</span>
        <span style="font-size:.82rem;color:var(--text-lt)">Total: ${data._total || 0} · Last: ${data._lastVisit ? new Date(data._lastVisit).toLocaleString() : 'N/A'}</span>
      </div>
      <div style="overflow-x:auto">
        <table>
          <thead><tr><th>Page</th><th>Views</th><th>Share</th></tr></thead>
          <tbody>
            ${entries.length
              ? entries.map(([page, hits]) => `
                <tr>
                  <td>${escAdm(page)}</td>
                  <td><strong>${hits}</strong></td>
                  <td>
                    <div style="height:8px;background:var(--bg-alt);border-radius:4px;width:140px;overflow:hidden">
                      <div style="height:100%;background:var(--saffron);width:${Math.round((hits/(data._total||1))*100)}%;border-radius:4px;"></div>
                    </div>
                  </td>
                </tr>`).join('')
              : '<tr><td colspan="3" style="text-align:center;padding:2rem;color:var(--text-lt)">No data yet</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
    <div style="margin-top:1rem">
      <button class="btn btn-danger btn-sm" onclick="if(confirm('Clear analytics?')){localStorage.removeItem('ko_analytics');renderAnalyticsPanel();window.toast('Analytics cleared','info')}">🗑️ Clear Analytics</button>
    </div>`;
}
window.renderAnalyticsPanel = renderAnalyticsPanel;

/* ═══════════════════════════════════════════════════════════
   10. SETTINGS PANEL
═══════════════════════════════════════════════════════════ */
function renderSettingsPanel() {
  const resetBtn = document.getElementById('adm-reset-data-btn');
  if (resetBtn && !resetBtn._bound) {
    resetBtn._bound = true;
    resetBtn.addEventListener('click', async () => {
      if (!confirm('Reset ALL vendor data to defaults?\n\nThis will overwrite your current vendor list.')) return;
      if (window.KO?.App?.apiAvailable) {
        // In production: DELETE all + bulk insert defaults
        // For demo: just reload the defaults locally
      }
      window.KO.App.vendors = [...(window.KO_VENDORS_DEFAULT || [])];
      refreshStats();
      window.toast?.('Vendor data reset to defaults.', 'success');
    });
  }
  const exportBtn = document.getElementById('adm-export-btn');
  if (exportBtn && !exportBtn._bound) {
    exportBtn._bound = true;
    exportBtn.addEventListener('click', exportVendorData);
  }
  const importInput = document.getElementById('adm-import-input');
  if (importInput && !importInput._bound) {
    importInput._bound = true;
    importInput.addEventListener('change', importVendorData);
  }
}

function exportVendorData() {
  const data = JSON.stringify(window.KO?.App?.vendors || [], null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `kapurthala-online-vendors-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  window.toast?.('Vendor data exported!', 'success');
}

async function importVendorData(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async ev => {
    try {
      const parsed = JSON.parse(ev.target.result);
      if (!Array.isArray(parsed)) throw new Error('Expected array');
      if (window.KO?.App?.apiAvailable) {
        const { ok } = await adminAPI('/vendors/bulk', 'POST', { vendors: parsed });
        if (ok) {
          window.toast?.(`Imported ${parsed.length} vendors to database!`, 'success');
          await window.KO.loadVendors();
          return;
        }
      }
      window.KO.App.vendors = parsed;
      window.toast?.(`Imported ${parsed.length} vendors (offline)!`, 'info');
    } catch {
      window.toast?.('Import failed — invalid JSON format.', 'error');
    }
    e.target.value = '';
  };
  reader.readAsText(file);
}

/* ═══════════════════════════════════════════════════════════
   11. UTILITIES
═══════════════════════════════════════════════════════════ */
function escAdm(str) {
  if (str == null) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function setEl(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}
