import {
    state, appMode, currentUsername,
    loadState, loadMode, persistMode, setCurrentUser,
    addCategory, deleteCategory, toggleCategory,
    addHabit, deleteHabit, toggleHabit, updateHabit,
    addMicrohabit, deleteMicrohabit, updateMicrohabit,
    sortAllByPriority, sortAllByType,
    setDragSrc, clearDragSrc, dragSrcCid, dragSrcHid, isHabitDragging, insertHabitAt,
    setCatDragSrc, clearCatDragSrc, isCatDragging, dragSrcCatId, insertCategoryAt,
} from './state.js';

import { esc } from './helpers.js';
import { renderCategoryEdit } from './render-edit.js';
import { renderCategoryHabitsNew, renderWithCatGaps } from './render-view.js';
import { renderToday } from './render-today.js';
import { renderTracker } from './render-tracker.js';
import { loadCompletions, toggleCompletion, getGlobalStreak } from './completions.js';
import { exportJSON, exportCSV, triggerImport, handleImport } from './io.js';
import { applyTemplate } from './template.js';
import { signOut, onAuthStateChange } from './auth.js';

// ─── Theme ────────────────────────────────────────────────────────────────────

const THEME_KEY = 'loopabl-theme';
const SIDEBAR_KEY = 'loopabl-sidebar';

function toggleSidebar() {
    const isClosed = document.body.classList.toggle('sidebar-closed');
    localStorage.setItem(SIDEBAR_KEY, isClosed ? 'closed' : 'open');
    renderTopbar();
}

function loadTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'light') document.body.classList.add('light');
    else if (saved === 'catppuccin') document.body.classList.add('catppuccin');
}

function toggleTheme() {
    const body = document.body;
    if (body.classList.contains('light')) {
        body.classList.remove('light');
        body.classList.add('catppuccin');
        localStorage.setItem(THEME_KEY, 'catppuccin');
    } else if (body.classList.contains('catppuccin')) {
        body.classList.remove('catppuccin');
        localStorage.setItem(THEME_KEY, 'dark');
    } else {
        body.classList.add('light');
        localStorage.setItem(THEME_KEY, 'light');
    }
    renderTopbar();
}

function currentThemeIcon() {
    if (document.body.classList.contains('light'))
        return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
    if (document.body.classList.contains('catppuccin'))
        return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>`;
    return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
}

function currentThemeTitle() {
    if (document.body.classList.contains('light')) return 'Light — click for Catppuccin';
    if (document.body.classList.contains('catppuccin')) return 'Catppuccin — click for dark';
    return 'Dark — click for light';
}

// ─── View State ───────────────────────────────────────────────────────────────

let activeView = 'today';       // 'today' | 'habits' | 'tracker'
let activeCategory = null;      // category id or null (show all)

function setView(view, catId = null) {
    activeView = view;
    activeCategory = catId ?? null;
    if (view === 'habits' && appMode !== 'view' && appMode !== 'edit') persistMode('view');
    render();
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

async function handleSignOut() {
    try { await signOut(); } catch (err) { console.error("Sign out failed:", err); }
    window.location.replace('/');
}

async function onSession(session) {
    if (!session) { window.location.replace('/login'); return; }
    setCurrentUser(session.user.id, session.user.email);
    try {
        await loadState();
    } catch (err) {
        console.error("loadState failed:", err);
        window.location.replace('/login');
        return;
    }
    try {
        await loadCompletions(session.user.id);
    } catch (err) {
        console.error("loadCompletions failed:", err);
    }
    loadMode();
    render();
}

// ─── Mode ─────────────────────────────────────────────────────────────────────

function setAppMode(mode) {
    persistMode(mode);
    render();
}

// ─── Drag-and-Drop ────────────────────────────────────────────────────────────

function onHabitDragStart(cid, hid, e) {
    e.stopPropagation();
    setDragSrc(cid, hid);
    e.dataTransfer.effectAllowed = "move";
    e.currentTarget.classList.add("dragging");
    document.getElementById(`cat-${cid}`)?.classList.add("habit-drag-active");
}

function onHabitGapDragOver(cid, e) {
    if (!isHabitDragging()) return;
    if (dragSrcCid !== cid) return;
    const gap = e.currentTarget;
    const draggedEl = document.getElementById(`habit-${dragSrcHid}`);
    if (gap.nextElementSibling === draggedEl || gap.previousElementSibling === draggedEl) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    gap.classList.add("drop-active");
    gap.previousElementSibling?.classList.add("shift-up");
}

function onHabitGapDragLeave(e) {
    e.currentTarget.classList.remove("drop-active");
    e.currentTarget.previousElementSibling?.classList.remove("shift-up");
}

function onHabitGapDrop(cid, index, e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove("drop-active");
    e.currentTarget.previousElementSibling?.classList.remove("shift-up");
    if (insertHabitAt(cid, index)) render();
}

function onHabitDragEnd() {
    clearDragSrc();
    document.querySelectorAll(".habit-drag-active").forEach(el => el.classList.remove("habit-drag-active"));
    document.querySelectorAll(".dragging, .drop-active, .shift-up").forEach(el =>
        el.classList.remove("dragging", "drop-active", "shift-up")
    );
}

function onCatDragStart(cid, e) {
    setCatDragSrc(cid);
    e.dataTransfer.effectAllowed = "move";
    e.currentTarget.classList.add("cat-dragging");
    document.getElementById("app")?.classList.add("app--cat-dragging");
}

function onCatGapDragOver(e) {
    if (!isCatDragging()) return;
    const gap = e.currentTarget;
    const draggedEl = document.getElementById(`cat-${dragSrcCatId}`);
    if (gap.nextElementSibling === draggedEl || gap.previousElementSibling === draggedEl) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    gap.classList.add("drop-active");
    gap.previousElementSibling?.classList.add("shift-up");
}

function onCatGapDragLeave(e) {
    e.currentTarget.classList.remove("drop-active");
    e.currentTarget.previousElementSibling?.classList.remove("shift-up");
}

function onCatGapDrop(index, e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove("drop-active");
    e.currentTarget.previousElementSibling?.classList.remove("shift-up");
    if (insertCategoryAt(index)) render();
}

function onCatDragEnd() {
    clearCatDragSrc();
    document.getElementById("app")?.classList.remove("app--cat-dragging");
    document.querySelectorAll(".cat-dragging, .drop-active, .shift-up").forEach(el =>
        el.classList.remove("cat-dragging", "drop-active", "shift-up")
    );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

const NAV = [
    { id: 'today',   label: 'Today',      icon: iconSun()  },
    { id: 'habits',  label: 'All habits', icon: iconList() },
    { id: 'tracker', label: 'Tracker',    icon: iconCal()  },
];

function iconSun() {
    return `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
}
function iconList() {
    return `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>`;
}
function iconCal() {
    return `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`;
}
function logoMark() {
    return `<svg class="logo-mark" viewBox="0 0 48 24" fill="none" aria-hidden="true"><path d="M24,12 C24,6 20,2 14,2 C8,2 4,6 4,12 C4,18 8,22 14,22 C20,22 24,18 24,12 C24,6 28,2 34,2 C40,2 44,6 44,12 C44,18 40,22 34,22 C28,22 24,18 24,12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

function renderSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;

    const navHtml = NAV.map(n => {
        const isActive = activeView === n.id && activeCategory === null;
        return `<button class="sb-item${isActive ? ' on' : ''}" onclick="setView('${n.id}')">${n.icon} ${esc(n.label)}</button>`;
    }).join('');

    const catsHtml = state.map(c => {
        const isActive = activeView === 'habits' && activeCategory === c.id;
        return `
          <button class="sb-cat${isActive ? ' on' : ''}" onclick="setView('habits','${c.id}')">
            <span class="sb-cat-dot"></span>
            <span>${esc(c.name)}</span>
            <span class="sb-cat-n">${c.habits.length}</span>
          </button>`;
    }).join('');

    const initials = currentUsername ? currentUsername[0].toUpperCase() : 'A';
    const streak = getGlobalStreak();
    const streakLabel = streak > 0 ? `${streak}-day streak` : 'No streak yet';

    sidebar.innerHTML = `
      <div class="sb-brand">
        <a href="/" class="logo">${logoMark()} Loopabl</a>
      </div>

      <div class="sb-section">${navHtml}</div>

      <div class="sb-section">
        <div class="sb-section-head">
          <span class="eyebrow">Categories</span>
          <button class="sb-add" onclick="openAddCategory()" title="New category">+</button>
        </div>
        ${catsHtml || '<span style="padding:4px 10px;font-size:12px;color:var(--text3)">No categories yet</span>'}
      </div>

      <div class="sb-spacer"></div>

      <div class="profile-wrap-sb">
        <button class="sb-foot" onclick="toggleProfileMenu(event)">
          <div class="sb-avatar">${esc(initials)}</div>
          <div style="display:flex;flex-direction:column;text-align:left;min-width:0">
            <span style="font-size:12.5px;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(currentUsername || 'Account')}</span>
            <span style="font-size:11px;color:var(--text3)">${esc(streakLabel)}</span>
          </div>
          <span style="margin-left:auto;color:var(--text3);font-size:16px;flex-shrink:0">⋯</span>
        </button>
        <div id="profile-menu" class="profile-menu">
          <a href="/profile" class="profile-menu-item">Edit Profile</a>
          <button class="profile-menu-item profile-menu-danger" type="button" onclick="handleSignOut()">Sign Out</button>
        </div>
      </div>`;
}

// ─── Topbar ───────────────────────────────────────────────────────────────────

function renderTopbar() {
    const topbar = document.getElementById('topbar');
    if (!topbar) return;

    let crumbs = [];
    let actions = '';

    if (activeView === 'today') {
        const d = new Date();
        const day = d.toLocaleDateString('en-US', { weekday: 'long' });
        const date = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
        crumbs = ['Today', `${day} · ${date}`];

    } else if (activeView === 'habits') {
        const cat = activeCategory ? state.find(c => c.id === activeCategory) : null;
        crumbs = cat ? ['Habits', cat.name] : ['Habits'];
        const isView = appMode === 'view';
        actions = `
          <div class="seg">
            <button class="${isView ? 'on' : ''}" onclick="setAppMode('view')">View</button>
            <button class="${!isView ? 'on' : ''}" onclick="setAppMode('edit')">Edit</button>
          </div>
          ${isView ? `<button class="btn ghost" onclick="sortAllByPriority()">Sort</button>` : ''}
          <button class="btn primary" onclick="openAddHabit()">+ New habit</button>`;

    } else if (activeView === 'tracker') {
        crumbs = ['Tracker'];
        actions = `
          <button class="btn ghost" onclick="exportJSON()">Export</button>
          <button class="btn ghost" onclick="triggerImport()">Import</button>
          <input type="file" id="import-input" accept=".json,.csv" style="display:none" onchange="handleImport(event)" />`;
    }

    const crumbsHtml = crumbs.map((c, i) =>
        `${i > 0 ? '<span class="sb-crumb-sep">/</span>' : ''}<span class="sb-crumb ${i === crumbs.length - 1 ? 'active' : 'dim'}">${esc(c)}</span>`
    ).join('');

    const sidebarIcon = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/></svg>`;
    topbar.innerHTML = `
      <button class="sb-search-trigger" onclick="toggleSidebar()" title="Toggle sidebar" style="padding:0 8px;margin-right:2px">${sidebarIcon}</button>
      <div class="sb-crumbs">${crumbsHtml}</div>
      <div class="sb-topbar-spacer"></div>
      <button class="sb-search-trigger">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        Search
        <span class="kbd">⌘K</span>
      </button>
      <button class="sb-search-trigger" onclick="toggleTheme()" title="${currentThemeTitle()}" style="padding:0 8px">
        ${currentThemeIcon()}
      </button>
      ${actions}
      ${activeView === 'habits' && appMode === 'edit' ? `
        <div class="toolbar-dropdown">
          <button class="btn ghost toolbar-btn-caret" onclick="toggleExportMenu(event)">Export <span class="btn-caret">▾</span></button>
          <div class="toolbar-dropdown-menu" id="export-menu">
            <button onclick="exportJSON(); closeExportMenu()">JSON</button>
            <button onclick="exportCSV(); closeExportMenu()">CSV</button>
          </div>
        </div>
        <button class="btn ghost" onclick="triggerImport()">Import</button>
        <input type="file" id="import-input" accept=".json,.csv" style="display:none" onchange="handleImport(event)" />
      ` : ''}`;
}

// ─── Content ──────────────────────────────────────────────────────────────────

function renderContent() {
    const app = document.getElementById('app');
    if (!app) return;

    if (activeView === 'today') {
        app.innerHTML = renderToday(currentUsername);
        return;
    }

    if (activeView === 'tracker') {
        app.innerHTML = renderTracker();
        return;
    }

    // habits view
    const isView = appMode === 'view';
    app.classList.toggle('app--view', isView);

    if (!isView) {
        // edit mode
        const wrap = document.createElement('div');
        wrap.className = 'ss-edit-wrap';
        if (!state.length) {
            wrap.innerHTML = `<div class="empty-state"><p>No categories yet.</p><p>Add one below.</p></div>`;
        } else if (activeCategory) {
            const cat = state.find(c => c.id === activeCategory);
            wrap.innerHTML = cat ? renderCategoryEdit(cat) : '';
        } else {
            wrap.innerHTML = state.map(renderCategoryEdit).join('');
        }
        // add-bar for edit mode
        const addBar = document.createElement('div');
        addBar.className = 'add-bar';
        addBar.innerHTML = `
          <input id="new-cat" type="text" placeholder="New category name…" />
          <button id="add-cat-btn" class="btn-primary" type="button">+ Add Category</button>`;
        app.innerHTML = '';
        app.appendChild(addBar);
        app.appendChild(wrap);
        attachAddCatHandlers();
    } else {
        // view mode
        if (!state.length) {
            app.innerHTML = `<div class="ss-habits"><div class="empty-state"><p>No habits yet.</p><p>Switch to Edit to add some.</p></div></div>`;
            return;
        }
        if (activeCategory) {
            const cat = state.find(c => c.id === activeCategory);
            app.innerHTML = cat
                ? `<div class="ss-habits">${renderCategoryHabitsNew(cat)}</div>`
                : `<div class="ss-habits"><p class="empty-state">Category not found.</p></div>`;
        } else {
            app.innerHTML = `<div class="ss-habits">${renderAllCategories()}</div>`;
        }
    }
}

function renderAllCategories() {
    return state.map(c => `
      <div class="ss-cat-block" id="cat-${c.id}">
        <div class="ss-cat-block-head">
          <button class="ss-cat-toggle" onclick="toggleCategory('${c.id}')">
            <span class="ss-cat-block-name">${esc(c.name)}</span>
            <span class="ss-cat-block-count">${c.habits.length} habit${c.habits.length !== 1 ? 's' : ''}</span>
            <span class="chevron ${c.open ? 'open' : ''}">&#9660;</span>
          </button>
        </div>
        ${c.open !== false ? renderCategoryHabitsNew(c, false) : ''}
      </div>`).join('');
}

// ─── Main Render ──────────────────────────────────────────────────────────────

function render() {
    renderSidebar();
    renderTopbar();
    renderContent();
}

// ─── UI Helpers ───────────────────────────────────────────────────────────────

function openAddCategory() {
    const name = window.prompt('New category name:');
    if (!name?.trim()) return;
    addCategory(name.trim());
    render();
}

function openAddHabit() {
    if (appMode !== 'edit') { setAppMode('edit'); return; }
    // in edit mode, focus the add-habit area for the active category
    if (activeCategory) {
        document.querySelector(`#cat-${activeCategory} .add-habit-btn`)?.click();
    } else {
        state.length && document.querySelector('.add-habit-btn')?.click();
    }
}

function submitCategoryInput() {
    const inp = document.getElementById("new-cat");
    if (!(inp instanceof HTMLInputElement)) return;
    const name = inp.value.trim();
    if (!name) return;
    addCategory(name);
    inp.value = "";
    render();
}

function toggleExportMenu(e) {
    e.stopPropagation();
    document.getElementById("export-menu")?.classList.toggle("open");
}

function closeExportMenu() {
    document.getElementById("export-menu")?.classList.remove("open");
}

function toggleProfileMenu(e) {
    e.stopPropagation();
    document.getElementById("profile-menu")?.classList.toggle("open");
}

function closeProfileMenu() {
    document.getElementById("profile-menu")?.classList.remove("open");
}

function attachAddCatHandlers() {
    document.getElementById("add-cat-btn")?.addEventListener("click", submitCategoryInput);
    document.getElementById("new-cat")?.addEventListener("keydown", e => {
        if (e.key === "Enter") submitCategoryInput();
    });
}

function attachUiHandlers() {
    loadTheme();
    if (localStorage.getItem(SIDEBAR_KEY) === 'closed') document.body.classList.add('sidebar-closed');
    window.addEventListener("habit-import", () => { loadMode(); render(); });
    document.addEventListener("click", () => { closeExportMenu(); closeProfileMenu(); });

    const appEl = document.getElementById("app");
    appEl?.addEventListener("dragover", e => {
        if (isCatDragging() || isHabitDragging()) e.preventDefault();
    });
    appEl?.addEventListener("drop", e => {
        if (isCatDragging() || isHabitDragging()) { e.preventDefault(); e.stopPropagation(); }
    });
}

// ─── Window Bindings (for inline HTML event handlers) ────────────────────────

Object.assign(window, {
    setView,
    setAppMode,
    openAddCategory,
    openAddHabit,
    toggleCategory:   cid              => { toggleCategory(cid);                            render(); },
    deleteCategory:   cid              => { if (deleteCategory(cid))                        render(); },
    addHabit:         cid              => { addHabit(cid);                                  render(); },
    deleteHabit:      (cid, hid)       => { deleteHabit(cid, hid);                          render(); },
    toggleHabit:      (cid, hid)       => { toggleHabit(cid, hid);                          render(); },
    updateHabit:      (cid, hid, f, v) => { if (updateHabit(cid, hid, f, v))               render(); },
    addMicrohabit:    (cid, hid)       => { addMicrohabit(cid, hid);                        render(); },
    deleteMicrohabit: (cid, hid, mid)  => { deleteMicrohabit(cid, hid, mid);                render(); },
    updateMicrohabit,
    sortAllByPriority: () => { sortAllByPriority(); render(); },
    sortAllByType: type => { sortAllByType(type); render(); },
    onHabitDragStart,
    onHabitGapDragOver,
    onHabitGapDragLeave,
    onHabitGapDrop,
    onHabitDragEnd,
    onCatDragStart,
    onCatGapDragOver,
    onCatGapDragLeave,
    onCatGapDrop,
    onCatDragEnd,
    checkHabit: async (hid) => { await toggleCompletion(hid); render(); },
    applyTemplate: () => { if (applyTemplate()) { persistMode('view'); render(); } },
    toggleExportMenu,
    closeExportMenu,
    exportJSON,
    exportCSV,
    triggerImport,
    handleImport,
    handleSignOut,
    toggleProfileMenu,
    toggleTheme,
    toggleSidebar,
});

// ─── Boot ─────────────────────────────────────────────────────────────────────

attachUiHandlers();
onAuthStateChange(onSession);
