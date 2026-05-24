import { uid } from './helpers.js';

export const STORAGE_KEY    = "habit-tracker-v1";
export const MODE_KEY       = "habit-tracker-mode";
export const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

export let state   = [];
export let appMode = "edit";

// ─── Persistence ─────────────────────────────────────────────────────────────

export function loadState() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        state = raw ? JSON.parse(raw) : [];
    } catch { state = []; }
}

export function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* ignore */ }
}

export function loadMode() {
    appMode = state.length === 0 ? "edit" : (localStorage.getItem(MODE_KEY) || "view");
}

export function persistMode(mode) {
    appMode = mode;
    localStorage.setItem(MODE_KEY, mode);
}

// ─── Finders ─────────────────────────────────────────────────────────────────

export function findCategory(cid)          { return state.find(c => c.id === cid); }
export function findHabit(cid, hid)        { return findCategory(cid)?.habits.find(h => h.id === hid); }
export function findMicro(cid, hid, mid)   { return findHabit(cid, hid)?.microhabits.find(m => m.id === mid); }

// ─── Mutations (save state; render is the caller's responsibility) ────────────

export function addCategory(name) {
    state.push({ id: uid(), name, open: true, habits: [] });
    saveState();
}

export function deleteCategory(cid) {
    if (!confirm("Delete this category and all its habits?")) return false;
    state = state.filter(c => c.id !== cid);
    saveState();
    return true;
}

export function toggleCategory(cid) {
    const c = findCategory(cid);
    if (c) c.open = !c.open;
    saveState();
}

export function addHabit(cid) {
    const c = findCategory(cid);
    if (!c) return;
    c.habits.push({
        id: uid(), name: "New Habit", type: "positive",
        priority: "medium", cue: "", craving: "", response: "", reward: "",
        open: true, microhabits: [],
    });
    saveState();
}

export function deleteHabit(cid, hid) {
    const c = findCategory(cid);
    if (!c) return;
    c.habits = c.habits.filter(h => h.id !== hid);
    saveState();
}

export function toggleHabit(cid, hid) {
    const h = findHabit(cid, hid);
    if (h) h.open = !h.open;
    saveState();
}

// Returns true when a full re-render is needed (type badge change).
export function updateHabit(cid, hid, field, value) {
    const h = findHabit(cid, hid);
    if (!h) return false;
    h[field] = value;
    saveState();
    return field === "type";
}

export function addMicrohabit(cid, hid) {
    const h = findHabit(cid, hid);
    if (!h) return;
    h.microhabits.push({ id: uid(), description: "", r1: 3, r2: 3, r3: 3, r4: 3 });
    saveState();
}

export function deleteMicrohabit(cid, hid, mid) {
    const h = findHabit(cid, hid);
    if (!h) return;
    h.microhabits = h.microhabits.filter(m => m.id !== mid);
    saveState();
}

export function updateMicrohabit(cid, hid, mid, field, value) {
    const m = findMicro(cid, hid, mid);
    if (!m) return;
    m[field] = field !== "description" ? Number(value) : value;
    saveState();
}

// ─── Sort ─────────────────────────────────────────────────────────────────────

export function sortAllByPriority() {
    state.forEach(c =>
        c.habits.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])
    );
    saveState();
}

export function sortAllByType(primaryType) {
    state.forEach(c =>
        c.habits.sort((a, b) => {
            if (a.type === primaryType && b.type !== primaryType) return -1;
            if (b.type === primaryType && a.type !== primaryType) return 1;
            return 0;
        })
    );
    saveState();
}

// ─── Drag-and-Drop state ──────────────────────────────────────────────────────

export let dragSrcCid = null;
export let dragSrcHid = null;

export function setDragSrc(cid, hid) { dragSrcCid = cid; dragSrcHid = hid; }
export function clearDragSrc()       { dragSrcCid = null; dragSrcHid = null; }

export let dragSrcCatId = null;
export function setCatDragSrc(cid) { dragSrcCatId = cid; }
export function clearCatDragSrc()  { dragSrcCatId = null; }
export function isCatDragging()    { return dragSrcCatId !== null; }

export function reorderCategory(toCid) {
    if (dragSrcCatId === toCid) return false;
    const from = state.findIndex(c => c.id === dragSrcCatId);
    const to   = state.findIndex(c => c.id === toCid);
    if (from === -1 || to === -1) return false;
    const [moved] = state.splice(from, 1);
    state.splice(to, 0, moved);
    saveState();
    return true;
}

// Returns true if a reorder happened (caller should re-render).
export function reorderHabit(toCid, toHid) {
    if (dragSrcCid !== toCid || dragSrcHid === toHid) return false;
    const c = findCategory(toCid);
    if (!c) return false;
    const from = c.habits.findIndex(h => h.id === dragSrcHid);
    const to   = c.habits.findIndex(h => h.id === toHid);
    if (from === -1 || to === -1) return false;
    const [moved] = c.habits.splice(from, 1);
    c.habits.splice(to, 0, moved);
    saveState();
    return true;
}
