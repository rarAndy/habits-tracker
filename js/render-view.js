import { esc, microLabels, microLabelHeader, checkSvg } from './helpers.js';
import { isCompletedToday, getStreak } from './completions.js';

// ─── Habit card (new ss-hcard design) ────────────────────────────────────────

function renderHabitCard(c, h) {
    const done   = isCompletedToday(h.id);
    const streak = getStreak(h.id);

    const typeChip = h.type === 'positive'
        ? `<span class="chip pos dot">Positive</span>`
        : `<span class="chip neg dot">Negative</span>`;
    const priorityChip = h.priority === 'high'
        ? `<span class="chip high dot">High</span>`
        : h.priority === 'medium'
        ? `<span class="chip med dot">Medium</span>`
        : `<span class="chip low dot">Low</span>`;
    const streakMeta = streak > 0
        ? `<span class="meta" style="white-space:nowrap">↻ ${streak}d</span>`
        : '';

    const microCount = h.microhabits?.length ?? 0;
    const microStrip = microCount > 0 ? `
      <div class="ss-hcard-loop">
        ${h.microhabits.slice(0, 5).map((m, i) => `
          <span class="ss-orb" title="${esc(m.description || '')}">${i + 1}</span>
          ${i < Math.min(microCount, 5) - 1 ? `<span class="ss-line"></span>` : ''}
        `).join('')}
        <span class="meta" style="margin-left:10px">${microCount} micro</span>
      </div>` : '';

    const hasBody = h.open !== false && (h.cue || h.craving || h.response || h.reward || microCount > 0);

    return `
    <article class="ss-hcard view-habit-card" id="habit-${h.id}"
      draggable="true"
      ondragstart="onHabitDragStart('${c.id}','${h.id}',event)"
      ondragend="onHabitDragEnd(event)">
      <div class="ss-hcard-head">
        <span class="ss-grip" title="Drag to reorder">⠿</span>
        <div class="ss-hcard-title">
          <span style="font-size:14px;color:var(--text);cursor:pointer;flex:1;min-width:0;${done ? 'opacity:0.4;text-decoration:line-through' : ''}"
            onclick="toggleHabit('${c.id}','${h.id}')">${esc(h.name)}</span>
          <div class="ss-hcard-meta">
            ${typeChip}
            ${priorityChip}
            ${streakMeta}
          </div>
        </div>
        <div class="ss-hcard-actions">
          <button class="m-check${done ? ' done' : ''}"
            onclick="event.stopPropagation(); checkHabit('${h.id}')"
            title="${done ? 'Mark incomplete' : 'Mark complete'}">
            ${done ? checkSvg : ''}
          </button>
        </div>
      </div>
      ${hasBody ? renderHabitBody(h) : ''}
      ${microStrip}
    </article>`;
}

function renderHabitBody(h) {
    const loopFields = [
        h.cue      && `<div class="view-field"><span class="view-field-label">Cue</span><span class="view-field-value">${esc(h.cue)}</span></div>`,
        h.craving  && `<div class="view-field"><span class="view-field-label">Craving</span><span class="view-field-value">${esc(h.craving)}</span></div>`,
        h.response && `<div class="view-field"><span class="view-field-label">Response</span><span class="view-field-value">${esc(h.response)}</span></div>`,
        h.reward   && `<div class="view-field"><span class="view-field-label">Reward</span><span class="view-field-value">${esc(h.reward)}</span></div>`,
    ].filter(Boolean).join('');

    if (!loopFields && !h.microhabits?.length) return '';

    return `
    <div class="habit-body" style="border-top:1px solid var(--rule);margin-top:10px;padding-top:12px">
      ${loopFields ? `<div class="view-fields-grid">${loopFields}</div>` : ''}
      ${h.microhabits?.length ? `
        <div class="micro-section">
          <div class="section-label">Microhabits</div>
          ${renderMicroViewTable(h)}
        </div>` : ''}
    </div>`;
}

function renderMicroViewTable(h) {
    if (!h.microhabits.length) return '';
    const rows = h.microhabits.map(m => `
      <tr>
        <td class="desc-cell">${esc(m.description || '—')}</td>
        <td class="rating-cell" data-val="${m.r1}">${m.r1}</td>
        <td class="rating-cell" data-val="${m.r2}">${m.r2}</td>
        <td class="rating-cell" data-val="${m.r3}">${m.r3}</td>
        <td class="rating-cell" data-val="${m.r4}">${m.r4}</td>
      </tr>`).join('');
    return `
    <div class="table-scroll">
      <table class="micro-table view-table">
        <thead><tr>
          <th class="desc-cell">Description</th>
          ${microLabels.map(l => `<th>${microLabelHeader(l)}</th>`).join('')}
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

// ─── Category habits renderer (new design, view mode) ────────────────────────

export function renderCategoryHabitsNew(c, showHeader = true) {
    const gap = i =>
        `<div class="habit-drop-gap" ondragover="onHabitGapDragOver('${c.id}',event)" ondragleave="onHabitGapDragLeave(event)" ondrop="onHabitGapDrop('${c.id}',${i},event)"></div>`;

    const habitsHtml = c.habits.length
        ? gap(0) + c.habits.map((h, i) => renderHabitCard(c, h) + gap(i + 1)).join('')
        : `<p class="empty-msg">No habits yet.</p>`;

    const completedCount = c.habits.filter(h => isCompletedToday(h.id)).length;

    const header = showHeader ? `
      <div class="ss-habits-head">
        <div>
          <span class="eyebrow accent">Category · ${c.habits.length} habit${c.habits.length !== 1 ? 's' : ''}</span>
          <h1 class="serif" style="font-size:30px;font-weight:400;margin:4px 0">${esc(c.name)}</h1>
        </div>
        <div class="ss-habits-meta">
          <div>
            <span class="meta">Done today</span>
            <div class="serif" style="font-size:22px;line-height:1.1;margin-top:2px">${completedCount}<span style="font-size:12px;color:var(--text3);margin-left:4px">/ ${c.habits.length}</span></div>
          </div>
        </div>
      </div>` : '';

    return `
    ${header}
    <div class="ss-habits-list" id="cat-${c.id}">
      ${habitsHtml}
      <button class="add-dashed" onclick="addHabit('${c.id}')">+ Add habit to ${esc(c.name)}</button>
    </div>`;
}

