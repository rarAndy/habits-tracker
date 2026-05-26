import { uid } from './helpers.js';
import { supabase } from './supabase.js';

const STORAGE_KEY    = "habit-tracker-v1";
const MODE_KEY       = "habit-tracker-mode";
const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

export let state           = [];
export let appMode         = "edit";
export let currentEmail    = null;
export let currentUsername = null;
let currentUserId          = null;

export function setCurrentUser(userId, email) {
    currentUserId  = userId;
    currentEmail   = email;
    currentUsername = null;
}

// ─── Persistence ─────────────────────────────────────────────────────────────

export async function loadState() {
    if (!currentUserId) { state = []; return; }

    const [habitsRes, profileRes] = await Promise.all([
        supabase.from('habits_data').select('data').eq('user_id', currentUserId).maybeSingle(),
        supabase.from('profiles').select('username').eq('user_id', currentUserId).maybeSingle(),
    ]);

    if (habitsRes.error)  throw habitsRes.error;
    if (profileRes.error) throw profileRes.error;

    state = habitsRes.data?.data ?? [];
    if (habitsRes.data === null) saveState();

    if (profileRes.data === null) {
        // First login after sign-up — create profile from user_metadata
        const { data: userData } = await supabase.auth.getUser();
        const username = userData?.user?.user_metadata?.username;
        if (username) {
            const { error } = await supabase
                .from('profiles')
                .insert({ user_id: currentUserId, username, email: currentEmail });
            if (error) throw error;
            currentUsername = username;
        }
    } else {
        currentUsername = profileRes.data.username;
    }
}

export async function checkUsernameAvailable(username) {
    const { data } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .maybeSingle();
    return data === null;
}

export function saveState() {
    if (!currentUserId) return;
    supabase
        .from('habits_data')
        .upsert({ user_id: currentUserId, data: state, updated_at: new Date().toISOString() })
        .then(({ error }) => { if (error) console.error('Save failed:', error); });
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
    const idx = state.findIndex(c => c.id === cid);
    if (idx !== -1) state.splice(idx, 1);
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
export function isHabitDragging()    { return dragSrcHid !== null; }

export let dragSrcCatId = null;
export function setCatDragSrc(cid) { dragSrcCatId = cid; }
export function clearCatDragSrc()  { dragSrcCatId = null; }
export function isCatDragging()    { return dragSrcCatId !== null; }

function insertAt(arr, from, insertIndex) {
    if (insertIndex === from || insertIndex === from + 1) return false;
    const [moved] = arr.splice(from, 1);
    arr.splice(insertIndex > from ? insertIndex - 1 : insertIndex, 0, moved);
    return true;
}

export function insertHabitAt(cid, insertIndex) {
    const c = findCategory(cid);
    if (!c) return false;
    const from = c.habits.findIndex(h => h.id === dragSrcHid);
    if (from === -1 || !insertAt(c.habits, from, insertIndex)) return false;
    saveState();
    return true;
}

export function insertCategoryAt(insertIndex) {
    const from = state.findIndex(c => c.id === dragSrcCatId);
    if (from === -1 || !insertAt(state, from, insertIndex)) return false;
    saveState();
    return true;
}

