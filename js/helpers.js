export const microLabels = ["Visibility", "Attractiveness", "Difficulty", "Satisfaction"];

export const checkSvg = `<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="1.5,6 4.5,9.5 10.5,2.5"/></svg>`;

export function localDateStr(d = new Date()) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export const microLabelHelp = {
    Visibility:     "How easy it is to see or notice the step in your routine.",
    Attractiveness: "How appealing or motivating this microhabit feels.",
    Difficulty:     "How simple it is to do consistently.",
    Satisfaction:   "How rewarding it feels to complete the microhabit.",
};

export function uid() {
    return crypto.randomUUID();
}

export function esc(s) {
    return String(s == null ? "" : s)
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

export function priorityClass(p) {
    return { low: "p-low", medium: "p-med", high: "p-high" }[p] || "";
}

export function microLabelHeader(label) {
    return `${label} <span class="help-icon" title="${esc(microLabelHelp[label] || "")}">?</span>`;
}
