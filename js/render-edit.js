import { esc, microLabels, microLabelHeader, priorityClass } from './helpers.js';

function ratingSelect(cid, hid, mid, field, val) {
    const opts = [1, 2, 3, 4, 5]
        .map(n => `<option value="${n}"${val === n ? " selected" : ""}>${n}</option>`)
        .join("");
    return `<select class="rating-select" onchange="updateMicrohabit('${cid}','${hid}','${mid}','${field}',this.value)">${opts}</select>`;
}

function renderMicroEditTable(c, h) {
    const rows = h.microhabits.length
        ? h.microhabits.map(m => `
          <tr>
            <td class="desc-cell">
              <input type="text" class="micro-input" value="${esc(m.description)}"
                placeholder="I will do X for Y..."
                onchange="updateMicrohabit('${c.id}','${h.id}','${m.id}','description',this.value)" />
            </td>
            <td>${ratingSelect(c.id, h.id, m.id, "r1", m.r1)}</td>
            <td>${ratingSelect(c.id, h.id, m.id, "r2", m.r2)}</td>
            <td>${ratingSelect(c.id, h.id, m.id, "r3", m.r3)}</td>
            <td>${ratingSelect(c.id, h.id, m.id, "r4", m.r4)}</td>
            <td class="action-cell">
              <button class="icon-btn danger" onclick="deleteMicrohabit('${c.id}','${h.id}','${m.id}')" title="Delete">&#x2715;</button>
            </td>
          </tr>`).join("")
        : `<tr><td colspan="6" class="empty-row">No microhabits yet. Add one below.</td></tr>`;

    return `
    <div class="micro-section">
      <div class="section-label">Microhabits</div>
      <div class="table-scroll">
        <table class="micro-table">
          <thead><tr>
            <th class="desc-cell">Description</th>
            ${microLabels.map(l => `<th>${microLabelHeader(l)}</th>`).join("")}
            <th></th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <button class="add-micro-btn" onclick="addMicrohabit('${c.id}','${h.id}')">+ Add microhabit</button>
    </div>`;
}

export function renderHabitEdit(c, h) {
    const typeBadge = h.type === "positive"
        ? `<span class="badge badge-pos">Positive</span>`
        : `<span class="badge badge-neg">Negative</span>`;
    const open = h.open !== false;
    const body = open ? `
      <div class="habit-body">
        <div class="meta-row">
          <label class="field-label">Type
            <select onchange="updateHabit('${c.id}','${h.id}','type',this.value)">
              <option value="positive"${h.type === "positive" ? " selected" : ""}>Positive</option>
              <option value="negative"${h.type === "negative" ? " selected" : ""}>Negative</option>
            </select>
          </label>
          <label class="field-label">Name
            <input type="text" value="${esc(h.name)}"
              onchange="updateHabit('${c.id}','${h.id}','name',this.value)" />
          </label>
          <label class="field-label">Priority
            <select onchange="updateHabit('${c.id}','${h.id}','priority',this.value)">
              <option value="low"${h.priority === "low" ? " selected" : ""}>Low</option>
              <option value="medium"${h.priority === "medium" ? " selected" : ""}>Medium</option>
              <option value="high"${h.priority === "high" ? " selected" : ""}>High</option>
            </select>
          </label>
        </div>
        <div class="fields-grid">
          <label class="field-label">Cue
            <input type="text" value="${esc(h.cue)}" placeholder="What triggers this?"
              onchange="updateHabit('${c.id}','${h.id}','cue',this.value)" />
          </label>
          <label class="field-label">Craving
            <input type="text" value="${esc(h.craving)}" placeholder="What do you want?"
              onchange="updateHabit('${c.id}','${h.id}','craving',this.value)" />
          </label>
          <label class="field-label">Response
            <input type="text" value="${esc(h.response)}" placeholder="What do you do?"
              onchange="updateHabit('${c.id}','${h.id}','response',this.value)" />
          </label>
          <label class="field-label">Reward
            <input type="text" value="${esc(h.reward)}" placeholder="What do you get?"
              onchange="updateHabit('${c.id}','${h.id}','reward',this.value)" />
          </label>
        </div>
        ${renderMicroEditTable(c, h)}
        <div class="habit-footer">
          <button class="danger-btn" onclick="deleteHabit('${c.id}','${h.id}')">Delete habit</button>
        </div>
      </div>` : "";

    return `
    <div class="habit-card" id="habit-${h.id}">
      <div class="habit-header" onclick="toggleHabit('${c.id}','${h.id}')">
        <span class="habit-name">${esc(h.name)}</span>
        <span class="habit-type-col">${typeBadge}</span>
        <span class="habit-priority-col">
          <span class="priority-dot ${priorityClass(h.priority)}" title="Priority: ${h.priority}"></span>
          <span class="priority-label">${h.priority}</span>
        </span>
        <span class="chevron ${open ? "open" : ""}">&#9660;</span>
      </div>
      ${body}
    </div>`;
}

export function renderCategoryEdit(c) {
    const body = c.open ? `
      <div class="cat-body">
        ${c.habits.length
            ? c.habits.map(h => renderHabitEdit(c, h)).join("")
            : `<p class="empty-msg">No habits yet.</p>`}
        <button class="add-habit-btn" onclick="addHabit('${c.id}')">+ Add habit</button>
      </div>` : "";

    return `
    <div class="category-block" id="cat-${c.id}">
      <div class="cat-header">
        <button class="cat-toggle" onclick="toggleCategory('${c.id}')">
          <span class="cat-name">${esc(c.name)}</span>
          <span class="cat-count">${c.habits.length} habit${c.habits.length !== 1 ? "s" : ""}</span>
          <span class="chevron ${c.open ? "open" : ""}">&#9660;</span>
        </button>
        <button class="icon-btn danger" onclick="deleteCategory('${c.id}')" title="Delete category">&#x2715;</button>
      </div>
      ${body}
    </div>`;
}
