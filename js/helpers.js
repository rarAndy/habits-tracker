export const microLabels = ["Visibility", "Attractiveness", "Difficulty", "Satisfaction"];

export const microLabelHelp = {
    Visibility:     "How easy it is to see or notice the step in your routine.",
    Attractiveness: "How appealing or motivating this microhabit feels.",
    Difficulty:     "How simple it is to do consistently.",
    Satisfaction:   "How rewarding it feels to complete the microhabit.",
};

export function uid() {
    return Math.random().toString(36).slice(2, 9);
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
