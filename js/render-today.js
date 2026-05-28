import { state } from './state.js';
import { esc, checkSvg } from './helpers.js';
import { isCompletedToday, getStreak } from './completions.js';

function getTimeOfDay() {
    const h = new Date().getHours();
    if (h < 12) return 'morning';
    if (h < 17) return 'afternoon';
    return 'evening';
}

function renderTodayHabit(h) {
    const done = isCompletedToday(h.id);
    const streak = getStreak(h.id);
    const typeChip = h.type === 'positive'
        ? `<span class="chip pos dot">Positive</span>`
        : `<span class="chip neg dot">Negative</span>`;

    return `
    <article class="ss-hcard" id="habit-${h.id}">
      <div class="ss-hcard-head">
        <div class="ss-hcard-title">
          <span style="font-size:14px;color:var(--text);flex:1;min-width:0;${done ? 'opacity:0.35;text-decoration:line-through' : ''}">${esc(h.name)}</span>
          <div class="ss-hcard-meta">
            ${typeChip}
            ${streak > 0 ? `<span class="meta">↻ ${streak}d</span>` : ''}
          </div>
        </div>
        <div class="ss-hcard-actions">
          <button class="m-check${done ? ' done' : ''}"
            onclick="checkHabit('${h.id}')"
            title="${done ? 'Mark incomplete' : 'Mark complete'}">
            ${done ? checkSvg : ''}
          </button>
        </div>
      </div>
    </article>`;
}

export function renderToday(username) {
    const allHabits = state.flatMap(c => c.habits);
    const total = allHabits.length;
    const done = allHabits.filter(h => isCompletedToday(h.id)).length;
    const maxStreak = total > 0 ? Math.max(0, ...allHabits.map(h => getStreak(h.id))) : 0;
    const pct = total > 0 ? Math.round(done / total * 100) : 0;

    const d = new Date();
    const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
    const monthDay = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    const name = username ? esc(username) : 'there';

    const habitsByCategory = state
        .filter(c => c.habits.length > 0)
        .map(c => ({ cat: c, habits: c.habits }));

    const emptyState = !total
        ? `<div style="padding:3rem 0">
             <p style="color:var(--text3);font-size:14px;margin-bottom:12px">No habits yet.</p>
             <button class="btn primary" onclick="setView('habits')">Go to Habits →</button>
           </div>`
        : '';

    const listHtml = habitsByCategory.map(({ cat, habits }) => `
      <div style="margin-bottom:28px">
        <div style="font-size:11px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:var(--text3);padding:4px 4px 8px">${esc(cat.name)}</div>
        <div class="ss-today-list">
          ${habits.map(renderTodayHabit).join('')}
        </div>
      </div>`).join('');

    const remaining = total - done;
    const subtitle = total === 0 ? 'No habits yet — add some in Habits.'
        : done === total ? 'All done for today.'
        : `${remaining} left`;

    return `
    <div class="ss-today">
      <div class="ss-today-head">
        <div>
          <div style="font-size:11px;font-weight:500;letter-spacing:0.04em;color:var(--text3);margin-bottom:8px;text-transform:none">${esc(dayName)}, ${esc(monthDay)}</div>
          <h1 style="font-size:28px;font-weight:500;margin:0 0 6px;line-height:1.15;color:var(--text)">
            Good ${getTimeOfDay()}, ${name}.
          </h1>
          <p style="font-size:14px;color:var(--text2);margin:0">${subtitle}</p>
        </div>
        <div class="ss-today-stats">
          <div class="ss-stat">
            <div style="font-size:11px;font-weight:500;color:var(--text3)">Streak</div>
            <div class="ss-stat-num">${maxStreak}<span>days</span></div>
          </div>
          <div class="ss-stat">
            <div style="font-size:11px;font-weight:500;color:var(--text3)">Today</div>
            <div class="ss-stat-num">${done}<span>/ ${total}</span></div>
            <div class="ss-bar"><div style="width:${pct}%"></div></div>
          </div>
        </div>
      </div>
      ${emptyState || listHtml}
    </div>`;
}
