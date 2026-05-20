/* ═══════════════════════════════════════════════
   vault.js — Parola Defteri Modülü
   ═══════════════════════════════════════════════ */
(() => {
  'use strict';

  const STORE = 'parolam_vault';
  const CATS = {
    web: '🌐', app: '📱', email: '📧',
    social: '💬', finance: '🏦', other: '📁',
  };

  // ── DOM ──────────────────────────────────────
  const $ = id => document.getElementById(id);

  const vaultSearch     = $('vault-search');
  const addBtn          = $('vault-add-btn');
  const formWrapper     = $('vault-form-wrapper');
  const form            = $('vault-form');
  const editIdInput     = $('vault-edit-id');
  const siteInput       = $('vault-site');
  const usernameInput   = $('vault-username');
  const passwordInput   = $('vault-password');
  const pwToggle        = $('vault-pw-toggle');
  const useGenBtn       = $('vault-pw-use-generated');
  const notesInput      = $('vault-notes');
  const catSelect       = $('vault-category');
  const saveText        = $('vault-save-text');
  const cancelBtn       = $('vault-form-cancel');
  const statTotal       = $('vault-stat-total');
  const statWeek        = $('vault-stat-week');
  const list            = $('vault-list');
  const emptyState      = $('vault-empty');
  const confirmOverlay  = $('vault-confirm-overlay');
  const confirmText     = $('vault-confirm-text');
  const confirmCancel   = $('vault-confirm-cancel');
  const confirmOk       = $('vault-confirm-ok');

  // ── State ────────────────────────────────────
  let entries = [];
  let deleteId = null;

  // ── Utils ────────────────────────────────────
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

  function save() { localStorage.setItem(STORE, JSON.stringify(entries)); }

  function load() {
    try { entries = JSON.parse(localStorage.getItem(STORE)) || []; }
    catch { entries = []; }
  }

  function fmtDate(ts) {
    return new Date(ts).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  function toast(msg) {
    if (typeof showToast === 'function') { showToast(msg); return; }
    const t = document.createElement('div');
    t.classList.add('toast');
    t.innerText = msg;
    document.body.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 2000);
  }

  // ── Clipboard ────────────────────────────────
  async function clip(text, btn) {
    try {
      await navigator.clipboard.writeText(text);
      toast('Panoya kopyalandı!');
      if (btn) {
        const b = document.createElement('span');
        b.className = 'v-copy-badge';
        b.textContent = '✓';
        btn.appendChild(b);
        setTimeout(() => b.remove(), 900);
      }
    } catch { toast('Kopyalama başarısız'); }
  }

  // ── Eye Toggle ───────────────────────────────
  pwToggle.addEventListener('click', () => {
    const show = passwordInput.type === 'password';
    passwordInput.type = show ? 'text' : 'password';
    pwToggle.querySelector('.ico-show').classList.toggle('hidden', show);
    pwToggle.querySelector('.ico-hide').classList.toggle('hidden', !show);
  });

  // ── Use Generated Password ──────────────────
  useGenBtn.addEventListener('click', () => {
    const generated = document.getElementById('result');
    if (generated && generated.innerText && generated.innerText !== 'Şifreniz burada görünecek' && !generated.innerText.startsWith('Hata:') && generated.innerText !== 'Seçim yapın!') {
      passwordInput.value = generated.innerText;
      passwordInput.type = 'text';
      pwToggle.querySelector('.ico-show').classList.add('hidden');
      pwToggle.querySelector('.ico-hide').classList.remove('hidden');
      toast('Üretilen şifre aktarıldı!');
    } else {
      // Switch to generator page
      document.getElementById('page-vault').classList.remove('active');
      document.getElementById('page-generator').classList.add('active');
      document.getElementById('tab-vault').classList.remove('active');
      document.getElementById('tab-generator').classList.add('active');
      toast('Önce bir şifre üretin, sonra geri dönün');
    }
  });

  // ── Form Toggle ──────────────────────────────
  function openForm(entry = null) {
    form.reset();
    passwordInput.type = 'password';
    pwToggle.querySelector('.ico-show').classList.remove('hidden');
    pwToggle.querySelector('.ico-hide').classList.add('hidden');

    if (entry) {
      saveText.textContent = 'Güncelle';
      editIdInput.value    = entry.id;
      siteInput.value      = entry.site;
      usernameInput.value  = entry.username || '';
      passwordInput.value  = entry.password;
      notesInput.value     = entry.notes || '';
      catSelect.value      = entry.category || 'web';
    } else {
      saveText.textContent = 'Kaydet';
      editIdInput.value    = '';
    }

    formWrapper.classList.remove('collapsed');
    setTimeout(() => siteInput.focus(), 150);
  }

  function closeForm() {
    formWrapper.classList.add('collapsed');
    form.reset();
    editIdInput.value = '';
  }

  addBtn.addEventListener('click', () => {
    if (formWrapper.classList.contains('collapsed')) {
      openForm();
    } else {
      closeForm();
    }
  });

  cancelBtn.addEventListener('click', closeForm);

  // ── Save Entry ───────────────────────────────
  form.addEventListener('submit', e => {
    e.preventDefault();
    const id   = editIdInput.value;
    const site = siteInput.value.trim();
    const user = usernameInput.value.trim();
    const pw   = passwordInput.value;
    const note = notesInput.value.trim();
    const cat  = catSelect.value;

    if (!site || !pw) return;

    if (id) {
      const idx = entries.findIndex(e => e.id === id);
      if (idx !== -1) {
        entries[idx] = { ...entries[idx], site, username: user, password: pw, notes: note, category: cat, updatedAt: Date.now() };
        toast('Parola güncellendi!');
      }
    } else {
      entries.push({ id: uid(), site, username: user, password: pw, notes: note, category: cat, createdAt: Date.now(), updatedAt: Date.now() });
      toast('Parola kaydedildi!');
    }

    save();
    render(vaultSearch.value.trim());
    closeForm();
  });

  // ── Delete ───────────────────────────────────
  function openConfirm(id, site) {
    deleteId = id;
    confirmText.textContent = `"${site}" parolası kalıcı olarak silinecek.`;
    confirmOverlay.classList.remove('hidden');
  }

  function closeConfirm() {
    confirmOverlay.classList.add('hidden');
    deleteId = null;
  }

  confirmCancel.addEventListener('click', closeConfirm);
  confirmOverlay.addEventListener('click', e => { if (e.target === confirmOverlay) closeConfirm(); });

  confirmOk.addEventListener('click', () => {
    if (!deleteId) return;
    entries = entries.filter(e => e.id !== deleteId);
    save();
    render(vaultSearch.value.trim());
    closeConfirm();
    toast('Parola silindi!');
  });

  // ── Render ───────────────────────────────────
  function render(q = '') {
    const filtered = entries
      .filter(e => {
        if (!q) return true;
        const lq = q.toLowerCase();
        return e.site.toLowerCase().includes(lq)
            || (e.username && e.username.toLowerCase().includes(lq))
            || (e.notes && e.notes.toLowerCase().includes(lq));
      })
      .sort((a, b) => b.createdAt - a.createdAt);

    statTotal.textContent = entries.length;
    const week = Date.now() - 7 * 864e5;
    statWeek.textContent = entries.filter(e => e.createdAt > week).length;

    if (!filtered.length) {
      list.innerHTML = '';
      emptyState.classList.remove('hidden');
      return;
    }

    emptyState.classList.add('hidden');

    list.innerHTML = filtered.map((e, i) => `
      <div class="v-card" data-id="${e.id}" style="animation-delay:${i * 40}ms">
        <div class="v-cat">${CATS[e.category] || '📁'}</div>
        <div class="v-info">
          <div class="v-site">${esc(e.site)}</div>
          ${e.username ? `<div class="v-user">${esc(e.username)}</div>` : ''}
          <div class="v-pw-row">
            <span class="v-pw-text" data-revealed="0">••••••••••</span>
            <button class="v-pw-peek" title="Göster/Gizle" aria-label="Şifreyi göster/gizle">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
          </div>
          ${e.notes ? `<div class="v-notes">${esc(e.notes)}</div>` : ''}
          <div class="v-date">${fmtDate(e.createdAt)}</div>
        </div>
        <div class="v-actions">
          ${e.username ? `
          <button class="v-act act-copy-user" title="Kullanıcı adını kopyala" aria-label="Kullanıcı adını kopyala">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </button>` : ''}
          <button class="v-act act-copy" title="Şifreyi kopyala" aria-label="Şifreyi kopyala">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          </button>
          <button class="v-act act-edit" title="Düzenle" aria-label="Düzenle">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="v-act act-delete" title="Sil" aria-label="Sil">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </div>
    `).join('');

    // Wire events
    list.querySelectorAll('.v-card').forEach(card => {
      const id = card.dataset.id;
      const entry = entries.find(e => e.id === id);
      if (!entry) return;

      // Peek
      const dots = card.querySelector('.v-pw-text');
      card.querySelector('.v-pw-peek').addEventListener('click', ev => {
        ev.stopPropagation();
        const show = dots.dataset.revealed === '0';
        dots.textContent = show ? entry.password : '••••••••••';
        dots.dataset.revealed = show ? '1' : '0';
      });

      // Copy password
      card.querySelector('.act-copy').addEventListener('click', ev => {
        ev.stopPropagation();
        clip(entry.password, ev.currentTarget);
      });

      // Copy username
      const cu = card.querySelector('.act-copy-user');
      if (cu) cu.addEventListener('click', ev => { ev.stopPropagation(); clip(entry.username, ev.currentTarget); });

      // Edit
      card.querySelector('.act-edit').addEventListener('click', ev => {
        ev.stopPropagation();
        openForm(entry);
        formWrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });

      // Delete
      card.querySelector('.act-delete').addEventListener('click', ev => { ev.stopPropagation(); openConfirm(id, entry.site); });

      // Expand notes
      if (entry.notes) {
        card.style.cursor = 'pointer';
        card.addEventListener('click', () => card.classList.toggle('expanded'));
      }
    });
  }

  // ── Search ───────────────────────────────────
  let st;
  vaultSearch.addEventListener('input', () => {
    clearTimeout(st);
    st = setTimeout(() => render(vaultSearch.value.trim()), 180);
  });

  // ── Keyboard ─────────────────────────────────
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !confirmOverlay.classList.contains('hidden')) {
      closeConfirm();
    }
  });

  // ── Init ─────────────────────────────────────
  load();
  render();
})();
