import {
    state, appMode,
    loadState, loadMode, persistMode,
    addCategory, deleteCategory, toggleCategory,
    addHabit, deleteHabit, toggleHabit, updateHabit,
    addMicrohabit, deleteMicrohabit, updateMicrohabit,
    sortAllByPriority, sortAllByType,
    setDragSrc, clearDragSrc, dragSrcCid, dragSrcHid, isHabitDragging, insertHabitAt,
    setCatDragSrc, clearCatDragSrc, isCatDragging, dragSrcCatId, insertCategoryAt,
} from './state.js';

import { renderCategoryEdit } from './render-edit.js';
import { renderCategoryView } from './render-view.js';
import { exportJSON, exportCSV, triggerImport, handleImport } from './io.js';
import { applyTemplate } from './template.js';

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

// ─── Category Gap Renderer ────────────────────────────────────────────────────

function renderWithCatGaps(cats) {
    const gap = i =>
        `<div class="cat-drop-gap" ondragover="onCatGapDragOver(event)" ondragleave="onCatGapDragLeave(event)" ondrop="onCatGapDrop(${i},event)"></div>`;
    return gap(0) + cats.map((c, i) => renderCategoryView(c) + gap(i + 1)).join("");
}

// ─── Main Render ──────────────────────────────────────────────────────────────

function render() {
    const root = document.getElementById("app");
    if (!root) return;

    // Sync toolbar active states and app mode class
    root.classList.toggle("app--view", appMode === "view");
    document.getElementById("mode-edit-btn")?.classList.toggle("active", appMode === "edit");
    document.getElementById("mode-view-btn")?.classList.toggle("active", appMode === "view");

    // Add-category bar only in edit mode
    const addBar = document.querySelector(".add-bar");
    if (addBar instanceof HTMLElement) addBar.style.display = appMode === "edit" ? "" : "none";

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

    // Suppress the "forbidden" X cursor when a category is being dragged over
    // non-gap areas (category blocks, empty space). Gap divs handle their own dragover.
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
    updateMicrohabit, // saves only; no render needed for rating/description edits
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
});

// ─── Boot ─────────────────────────────────────────────────────────────────────

loadState();
loadMode();
render();
attachUiHandlers();
