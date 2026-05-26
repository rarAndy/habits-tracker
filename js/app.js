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

import { renderCategoryEdit } from './render-edit.js';
import { renderWithCatGaps } from './render-view.js';
import { exportJSON, exportCSV, triggerImport, handleImport } from './io.js';
import { applyTemplate } from './template.js';
import { signOut, onAuthStateChange } from './auth.js';

// ─── Auth ─────────────────────────────────────────────────────────────────────

async function handleSignOut() {
    try { await signOut(); } catch (err) { console.error("Sign out failed:", err); }
    window.location.replace('/login');
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
    loadMode();
    render();
    const profileBtn = document.getElementById("profile-btn");
    if (profileBtn) profileBtn.title = currentUsername ?? "Profile";
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

// ─── Category Drag-and-Drop ───────────────────────────────────────────────────

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

// ─── Main Render ──────────────────────────────────────────────────────────────

function render() {
    const root = document.getElementById("app");
    if (!root) return;

    const isView = appMode === "view";
    root.classList.toggle("app--view", isView);
    document.body.classList.toggle("mode-view", isView);
    document.getElementById("mode-edit-btn")?.classList.toggle("active", !isView);
    document.getElementById("mode-view-btn")?.classList.toggle("active", isView);

    if (appMode === "view") {
        root.innerHTML = state.length
            ? renderWithCatGaps(state)
            : `<div class="empty-state"><p>Nothing to show yet.</p><p>Switch to Edit Mode to add habits.</p></div>`;
    } else {
        root.innerHTML = state.length
            ? state.map(renderCategoryEdit).join("")
            : `<div class="empty-state"><p>No categories yet.</p><p>Add one using the field above.</p></div>`;
    }
}

// ─── UI Handlers ──────────────────────────────────────────────────────────────

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

function attachUiHandlers() {
    document.getElementById("add-cat-btn")?.addEventListener("click", submitCategoryInput);
    document.getElementById("new-cat")?.addEventListener("keydown", e => {
        if (e.key === "Enter") submitCategoryInput();
    });
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
    setAppMode,
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
    applyTemplate: () => { if (applyTemplate()) { persistMode('view'); render(); } },
    toggleExportMenu,
    closeExportMenu,
    exportJSON,
    exportCSV,
    triggerImport,
    handleImport,
    handleSignOut,
    toggleProfileMenu,
});

// ─── Boot ─────────────────────────────────────────────────────────────────────

attachUiHandlers();
onAuthStateChange(onSession);
