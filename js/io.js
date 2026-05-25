import { uid } from './helpers.js';
import { state, saveState } from './state.js';

// ─── JSON ─────────────────────────────────────────────────────────────────────

export function exportJSON() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    downloadBlob(blob, "habits.json");
}

// ─── CSV ──────────────────────────────────────────────────────────────────────

const CSV_HEADERS = [
    "Category", "Habit", "Type", "Priority",
    "Cue", "Craving", "Response", "Reward",
    "Microhabit", "Visibility", "Attractiveness", "Difficulty", "Satisfaction",
];

function csvCell(val) {
    const s = String(val == null ? "" : val);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function csvRow(cells) { return cells.map(csvCell).join(","); }

export function exportCSV() {
    const rows = [csvRow(CSV_HEADERS)];

    for (const cat of state) {
        if (!cat.habits.length) {
            rows.push(csvRow([cat.name, "", "", "", "", "", "", "", "", "", "", "", ""]));
            continue;
        }
        for (const hab of cat.habits) {
            const habCols = [cat.name, hab.name, hab.type, hab.priority, hab.cue, hab.craving, hab.response, hab.reward];
            if (!hab.microhabits.length) {
                rows.push(csvRow([...habCols, "", "", "", "", ""]));
                continue;
            }
            for (const m of hab.microhabits) {
                rows.push(csvRow([...habCols, m.description, m.r1, m.r2, m.r3, m.r4]));
            }
        }
    }

    downloadBlob(new Blob([rows.join("\n")], { type: "text/csv" }), "habits.csv");
}

// ─── Import ───────────────────────────────────────────────────────────────────

export function triggerImport() {
    document.getElementById("import-input")?.click();
}

export function handleImport(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
        const text = e.target?.result;
        if (typeof text !== "string") return;
        try {
            if (file.name.endsWith(".json")) importJSON(text);
            else if (file.name.endsWith(".csv")) importCSV(text);
            else throw new Error("Unsupported file type. Use .json or .csv");
        } catch (err) {
            alert("Import failed: " + err.message);
        }
        event.target.value = ""; // allow re-importing same file
    };
    reader.readAsText(file);
}

function importJSON(text) {
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) throw new Error("Expected a JSON array of categories");
    for (const cat of parsed) {
        if (typeof cat.id !== "string" || typeof cat.name !== "string" || !Array.isArray(cat.habits))
            throw new Error(`Invalid category structure: "${cat.name ?? cat.id}"`);
        for (const hab of cat.habits) {
            if (typeof hab.id !== "string" || typeof hab.name !== "string" || !Array.isArray(hab.microhabits))
                throw new Error(`Invalid habit structure: "${hab.name ?? hab.id}"`);
        }
    }
    state.splice(0, state.length, ...parsed);
    saveState();
    window.dispatchEvent(new CustomEvent("habit-import"));
}

function importCSV(text) {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) throw new Error("CSV file appears empty");

    const categories = new Map(); // name → Category

    for (const line of lines.slice(1)) {
        if (!line.trim()) continue;
        const [catName, habName, habType, habPriority, habCue, habCraving, habResponse, habReward,
               microDesc, vis, attr, diff, sat] = parseCSVLine(line);

        if (!catName) continue;
        if (!categories.has(catName)) {
            categories.set(catName, { id: uid(), name: catName, open: true, habits: [] });
        }
        const cat = categories.get(catName);

        if (!habName) continue;
        let habit = cat.habits.find(h => h.name === habName);
        if (!habit) {
            habit = {
                id: uid(), name: habName,
                type: habType || "positive",
                priority: habPriority || "medium",
                cue: habCue || "", craving: habCraving || "",
                response: habResponse || "", reward: habReward || "",
                open: true, microhabits: [],
            };
            cat.habits.push(habit);
        }

        if (microDesc) {
            habit.microhabits.push({
                id: uid(), description: microDesc,
                r1: clampRating(vis),
                r2: clampRating(attr),
                r3: clampRating(diff),
                r4: clampRating(sat),
            });
        }
    }

    state.splice(0, state.length, ...categories.values());
    saveState();
    window.dispatchEvent(new CustomEvent("habit-import"));
}

function clampRating(val) {
    const n = Number(val);
    return Number.isInteger(n) && n >= 1 && n <= 5 ? n : 3;
}

function parseCSVLine(line) {
    const result = [];
    let cell = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
            if (inQuotes && line[i + 1] === '"') { cell += '"'; i++; }
            else inQuotes = !inQuotes;
        } else if (ch === ',' && !inQuotes) {
            result.push(cell); cell = "";
        } else {
            cell += ch;
        }
    }
    result.push(cell);
    return result;
}

// ─── Util ─────────────────────────────────────────────────────────────────────

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a   = Object.assign(document.createElement("a"), { href: url, download: filename });
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
