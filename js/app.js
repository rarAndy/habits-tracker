import {
    state, appMode,
    loadState, saveState, loadMode, persistMode,
    addCategory, deleteCategory, toggleCategory,
    addHabit, deleteHabit, toggleHabit, updateHabit,
    addMicrohabit, deleteMicrohabit, updateMicrohabit,
    sortAllByPriority, sortAllByType,
    setDragSrc, clearDragSrc, reorderHabit,
    setCatDragSrc, clearCatDragSrc, isCatDragging, reorderCategory,
} from './state.js';

import { renderCategoryEdit } from './render-edit.js';
import { renderCategoryView } from './render-view.js';
import { exportJSON, exportCSV, triggerImport, handleImport } from './io.js';
import { applyTemplate } from './template.js';

// ─── Mode ─────────────────────────────────────────────────────────────────────

function setAppMode(mode) {
    saveState(); // flush any pending changes before switching
    persistMode(mode);
    render();
}

// ─── Drag-and-Drop ────────────────────────────────────────────────────────────

function onHabitDragStart(cid, hid, e) {
    e.stopPropagation();
    setDragSrc(cid, hid);
    e.dataTransfer.effectAllowed = "move";
    e.currentTarget.classList.add("dragging");
}

function onHabitDragOver(e) {
    if (isCatDragging()) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    e.currentTarget.classList.add("drag-over");
}

function onHabitDragLeave(e) {
    e.stopPropagation();
    e.currentTarget.classList.remove("drag-over");
}

function onHabitDrop(cid, hid, e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove("drag-over");
    if (reorderHabit(cid, hid)) render();
}

function onHabitDragEnd() {
    clearDragSrc();
    document.querySelectorAll(".drag-over, .dragging").forEach(el =>
        el.classList.remove("drag-over", "dragging")
    );
}

// ─── Category Drag-and-Drop ───────────────────────────────────────────────────

function onCatDragStart(cid, e) {
    if (!e.target.closest('.cat-drag-handle')) return;
    setCatDragSrc(cid);
    e.dataTransfer.effectAllowed = "move";
    e.currentTarget.classList.add("cat-dragging");
}

function onCatDragOver(e) {
    if (!isCatDragging()) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    e.currentTarget.classList.add("cat-drag-over");
}

function onCatDragLeave(e) {
    if (e.currentTarget.contains(e.relatedTarget)) return;
    e.currentTarget.classList.remove("cat-drag-over");
}

function onCatDrop(cid, e) {
    e.preventDefault();
    e.currentTarget.classList.remove("cat-drag-over");
    if (reorderCategory(cid)) render();
}

function onCatDragEnd() {
    clearCatDragSrc();
    document.querySelectorAll(".cat-drag-over, .cat-dragging").forEach(el =>
        el.classList.remove("cat-drag-over", "cat-dragging")
    );
}

// ─── Main Render ──────────────────────────────────────────────────────────────

function render() {
    const root = document.getElementById("app");
    if (!root) return;

    // Sync toolbar active states
    document.getElementById("mode-edit-btn")?.classList.toggle("active", appMode === "edit");
    document.getElementById("mode-view-btn")?.classList.toggle("active", appMode === "view");

    // Add-category bar only in edit mode
    const addBar = document.querySelector(".add-bar");
    if (addBar instanceof HTMLElement) addBar.style.display = appMode === "edit" ? "" : "none";

    if (appMode === "view") {
        root.innerHTML = state.length
            ? state.map(renderCategoryView).join("")
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

function handleCategoryInput(e) {
    if (e.key === "Enter") submitCategoryInput();
}

function toggleExportMenu(e) {
    e.stopPropagation();
    document.getElementById("export-menu")?.classList.toggle("open");
}

function closeExportMenu() {
    document.getElementById("export-menu")?.classList.remove("open");
}

function attachUiHandlers() {
    document.getElementById("add-cat-btn")?.addEventListener("click", submitCategoryInput);
    document.getElementById("new-cat")?.addEventListener("keydown", handleCategoryInput);
    window.addEventListener("habit-import", () => { loadMode(); render(); });
    document.addEventListener("click", closeExportMenu);
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
    updateMicrohabit, // saves only; no render needed for rating/description edits
    sortAllByPriority: () => { sortAllByPriority(); render(); },
    sortAllByType: type => { sortAllByType(type); render(); },
    onHabitDragStart,
    onHabitDragOver,
    onHabitDragLeave,
    onHabitDrop,
    onHabitDragEnd,
    onCatDragStart,
    onCatDragOver,
    onCatDragLeave,
    onCatDrop,
    onCatDragEnd,
    applyTemplate: () => { if (applyTemplate()) { persistMode('view'); render(); } },
    toggleExportMenu,
    closeExportMenu,
    exportJSON,
    exportCSV,
    triggerImport,
    handleImport,
});

// ─── Boot ─────────────────────────────────────────────────────────────────────

loadState();
loadMode();
render();
attachUiHandlers();
