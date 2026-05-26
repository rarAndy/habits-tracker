import { state } from './state.js';
import { esc } from './helpers.js';
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
    const checkSvg = `<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="1.5,6 4.5,9.5 10.5,2.5"/></svg>`;
    const typeChip = h.type === 'positive'
        ? `<span class="chip pos dot">Positive</span>`
        : `<span class="chip neg dot">Negative</span>`;

    return `
    <article class="ss-hcard" id="habit-${h.id}">
      <div class="ss-hcard-head">
        <div class="ss-hcard-title">
          <h3 class="serif" style="font-size:18px;font-weight:400;margin:0;line-height:1.2;${done ? 'color:var(--text3);text-decoration:line-through;text-decoration-color:var(--border2)' : ''}">${esc(h.name)}</h3>
          <div class="ss-hcard-meta">
            ${typeChip}
            ${streak > 0 ? `<span class="meta">↻ ${streak}-day streak</span>` : ''}
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
        ? `<div class="empty-state" style="padding:3rem 1rem">
             <p>No habits yet.</p>
             <p><button class="btn primary" onclick="setView('habits')">Go to Habits →</button></p>
           </div>`
        : '';

    const listHtml = habitsByCategory.map(({ cat, habits }) => `
      <div style="margin-bottom:24px">
        <div class="eyebrow accent" style="margin-bottom:10px">${esc(cat.name)}</div>
        <div class="ss-today-list">
          ${habits.map(renderTodayHabit).join('')}
        </div>
      </div>`).join('');

    const remaining = total - done;
    const subtitle = total === 0 ? 'No habits yet — add some in Habits.'
        : done === total ? 'All done for today. Well done.'
        : `${remaining} habit${remaining !== 1 ? 's' : ''} left today.`;

    return `
    <div class="ss-today">
      <div class="ss-today-head">
        <div>
          <span class="eyebrow accent">${esc(dayName)} · ${esc(monthDay)}</span>
          <h1 class="serif" style="font-size:34px;font-weight:400;margin:6px 0 4px;line-height:1.05">
            Good ${getTimeOfDay()}, <em>${name}.</em>
          </h1>
          <p class="small" style="margin:0">${subtitle}</p>
        </div>
        <div class="ss-today-stats">
          <div class="ss-stat">
            <span class="eyebrow">Streak</span>
            <div class="ss-stat-num">${maxStreak}<span>days</span></div>
          </div>
          <div class="ss-stat">
            <span class="eyebrow">Today</span>
            <div class="ss-stat-num">${done}<span>/ ${total}</span></div>
            <div class="ss-bar"><div style="width:${pct}%"></div></div>
          </div>
        </div>
      </div>
      ${emptyState || listHtml}
    </div>`;
}
