import { esc, microLabels, microLabelHeader, priorityClass } from './helpers.js';

function renderMicroViewTable(h) {
    if (!h.microhabits.length) return `<p class="empty-msg">No microhabits added yet.</p>`;

    const rows = h.microhabits.map(m => `
      <tr>
        <td class="desc-cell">${esc(m.description || "—")}</td>
        <td class="rating-cell" data-val="${m.r1}">${m.r1}</td>
        <td class="rating-cell" data-val="${m.r2}">${m.r2}</td>
        <td class="rating-cell" data-val="${m.r3}">${m.r3}</td>
        <td class="rating-cell" data-val="${m.r4}">${m.r4}</td>
      </tr>`).join("");

    return `
    <div class="table-scroll">
      <table class="micro-table view-table">
        <thead><tr>
          <th class="desc-cell">Description</th>
          ${microLabels.map(l => `<th>${microLabelHeader(l)}</th>`).join("")}
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

function renderWithHabitGaps(c) {
    const gap = i =>
        `<div class="habit-drop-gap" ondragover="onHabitGapDragOver('${c.id}',event)" ondragleave="onHabitGapDragLeave(event)" ondrop="onHabitGapDrop('${c.id}',${i},event)"></div>`;
    return gap(0) + c.habits.map((h, i) => renderHabitView(c, h) + gap(i + 1)).join("");
}

export function renderHabitView(c, h) {
    const typeBadge = h.type === "positive"
        ? `<span class="badge badge-pos">Positive</span>`
        : `<span class="badge badge-neg">Negative</span>`;
    const open = h.open !== false;

    const loopFields = [
        h.cue      && `<div class="view-field"><span class="view-field-label">Cue</span><span class="view-field-value">${esc(h.cue)}</span></div>`,
        h.craving  && `<div class="view-field"><span class="view-field-label">Craving</span><span class="view-field-value">${esc(h.craving)}</span></div>`,
        h.response && `<div class="view-field"><span class="view-field-label">Response</span><span class="view-field-value">${esc(h.response)}</span></div>`,
        h.reward   && `<div class="view-field"><span class="view-field-label">Reward</span><span class="view-field-value">${esc(h.reward)}</span></div>`,
    ].filter(Boolean).join("");

    const body = open ? `
      <div class="habit-body">
        ${loopFields ? `<div class="view-fields-grid">${loopFields}</div>` : ""}
        <div class="micro-section">
          <div class="section-label">Microhabits</div>
          ${renderMicroViewTable(h)}
        </div>
      </div>` : "";

    return `
    <div class="habit-card view-habit-card" id="habit-${h.id}"
      draggable="true"
      ondragstart="onHabitDragStart('${c.id}','${h.id}',event)"
      ondragend="onHabitDragEnd(event)">
      <div class="habit-header view-habit-header" onclick="toggleHabit('${c.id}','${h.id}')">
        <span class="drag-handle" title="Drag to reorder">⠿</span>
        <span class="habit-name">${esc(h.name)}</span>
        <span class="habit-type-col">${typeBadge}</span>
        <span class="habit-priority-col">
          <span class="priority-pill priority-pill-${h.priority}">${h.priority}</span>
        </span>
        <span class="chevron ${open ? "open" : ""}">&#9660;</span>
      </div>
      ${body}
    </div>`;
}

export function renderCategoryView(c) {
    const body = c.open ? `
      <div class="cat-body">
        ${c.habits.length
            ? renderWithHabitGaps(c)
            : `<p class="empty-msg">No habits yet.</p>`}
      </div>` : "";

    return `
    <div class="category-block" id="cat-${c.id}"
      draggable="true"
      ondragstart="onCatDragStart('${c.id}',event)"
      ondragend="onCatDragEnd()">
      <div class="cat-header">
        <span class="drag-handle cat-drag-handle" title="Drag to reorder">⠿</span>
        <button class="cat-toggle" onclick="toggleCategory('${c.id}')">
          <span class="cat-name">${esc(c.name)}</span>
          <span class="cat-count">${c.habits.length} habit${c.habits.length !== 1 ? "s" : ""}</span>
          <span class="chevron ${c.open ? "open" : ""}">&#9660;</span>
        </button>
      </div>
      ${body}
    </div>`;
}
