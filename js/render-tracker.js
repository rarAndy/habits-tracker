import { state } from './state.js';
import { getAllDatesWithCounts, getStreak, getGlobalStreak } from './completions.js';
import { esc } from './helpers.js';

function localDateStr(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function buildHeatmapGrid(dateCounts, totalHabits, weeks = 18) {
    const grid = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Start from the Monday `weeks` weeks ago
    const start = new Date(today);
    const dayOfWeek = (today.getDay() + 6) % 7; // Monday = 0
    start.setDate(today.getDate() - dayOfWeek - (weeks - 1) * 7);

    for (let w = 0; w < weeks; w++) {
        const col = [];
        for (let d = 0; d < 7; d++) {
            const date = new Date(start);
            date.setDate(start.getDate() + w * 7 + d);
            if (date > today) {
                col.push(-1); // future — skip
            } else {
                const dateStr = localDateStr(date);
                const count = dateCounts.get(dateStr) ?? 0;
                const max = Math.max(totalHabits, 1);
                const ratio = count / max;
                const level = count === 0 ? 0 : ratio < 0.25 ? 1 : ratio < 0.5 ? 2 : ratio < 0.75 ? 3 : 4;
                col.push(level);
            }
        }
        grid.push(col);
    }
    return { grid, start };
}

function getMonthLabels(start, weeks) {
    const labels = [];
    let lastMonth = -1;
    for (let w = 0; w < weeks; w++) {
        const d = new Date(start);
        d.setDate(start.getDate() + w * 7);
        const m = d.getMonth();
        if (m !== lastMonth) {
            labels.push({ col: w, label: d.toLocaleDateString('en-US', { month: 'short' }) });
            lastMonth = m;
        }
    }
    return labels;
}

export function renderTracker() {
    const allHabits = state.flatMap(c => c.habits);
    const totalHabits = allHabits.length;
    const dateCounts = getAllDatesWithCounts();
    const globalStreak = getGlobalStreak();
    const weeks = 18;

    const { grid, start } = buildHeatmapGrid(dateCounts, totalHabits, weeks);
    const monthLabels = getMonthLabels(start, weeks);

    // Heatmap month header
    const monthHeaderCells = Array.from({ length: weeks }, (_, w) => {
        const label = monthLabels.find(l => l.col === w);
        return `<span class="meta" style="width:14px;text-align:left;overflow:hidden;white-space:nowrap;font-size:10px">${label ? label.label : ''}</span>`;
    }).join('');

    // Heatmap columns
    const colsHtml = grid.map(col => {
        const cells = col.map(v =>
            v < 0
                ? `<span class="heatmap-cell" style="background:transparent;border:none"></span>`
                : `<span class="heatmap-cell heat heat-${v}" title=""></span>`
        ).join('');
        return `<div class="heatmap-col">${cells}</div>`;
    }).join('');

    const dayLabels = ['Mon', '', 'Wed', '', 'Fri', '', ''].map(l =>
        `<span class="meta" style="font-size:10px;height:14px;line-height:14px">${l}</span>`
    ).join('');

    // Stats
    const totalCompletions = Array.from(dateCounts.values()).reduce((a, b) => a + b, 0);
    const maxStreak = totalHabits > 0 ? Math.max(0, ...allHabits.map(h => getStreak(h.id))) : 0;

    // Per-habit progress bars
    const habitBars = allHabits.length
        ? allHabits.slice(0, 8).map(h => {
            const streak = getStreak(h.id);
            const cat = state.find(c => c.habits.some(hh => hh.id === h.id));
            // count completions in last 4 weeks
            const fourWeeksAgo = new Date();
            fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
            let recentCount = 0;
            const dateSet = getAllDatesWithCounts(); // approximation — just use global
            // Actually we need per-habit data — use getStreak as a proxy
            const pct = Math.min(100, Math.round((streak / 14) * 100));
            return `
            <div class="ss-loop-row">
              <div style="flex:1;min-width:0">
                <div style="font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(h.name)}</div>
                <div class="meta" style="margin-top:2px">${cat ? esc(cat.name) : ''} · ${streak > 0 ? `${streak}-day streak` : 'No streak'}</div>
              </div>
              <div style="width:180px;flex-shrink:0">
                <div class="ss-bar" style="height:5px"><div style="width:${pct}%"></div></div>
              </div>
              <span class="meta" style="width:32px;text-align:right;flex-shrink:0">${streak}d</span>
            </div>`;
        }).join('')
        : '<p class="meta" style="padding:12px 0">No habits yet.</p>';

    return `
    <div class="ss-tracker">
      <div class="ss-tracker-head">
        <div style="font-size:11px;font-weight:500;letter-spacing:0.04em;color:rgba(255,255,255,0.3);margin-bottom:8px">Tracker</div>
        <h1 style="font-size:28px;font-weight:500;margin:0 0 6px;line-height:1.15;color:rgba(255,255,255,0.87)">
          ${totalCompletions > 0 ? `${totalCompletions} completions logged.` : 'No completions yet.'}
        </h1>
        <p style="font-size:14px;color:rgba(255,255,255,0.4);margin:0">${globalStreak > 0 ? `${globalStreak}-day streak · ` : ''}${totalHabits} habit${totalHabits !== 1 ? 's' : ''} tracked.</p>
      </div>

      <div class="ss-card" style="padding:22px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <span class="serif" style="font-size:18px">Daily completion</span>
          <div style="display:flex;align-items:center;gap:6px">
            <span class="meta">Less</span>
            ${[0,1,2,3,4].map(v => `<span class="heat heat-${v}" style="width:11px;height:11px;display:inline-block"></span>`).join('')}
            <span class="meta">More</span>
          </div>
        </div>
        <div class="heat-frame">
          <div class="heat-months" style="display:flex;gap:3px;padding-left:36px;margin-bottom:4px">
            ${monthHeaderCells}
          </div>
          <div class="heat-row">
            <div class="heat-days" style="padding-top:0">${dayLabels}</div>
            <div class="heatmap-x" style="display:flex;gap:3px">${colsHtml}</div>
          </div>
        </div>
      </div>

      <div class="ss-tracker-row">
        <div class="ss-card">
          <span class="eyebrow">Current streak</span>
          <div class="serif" style="font-size:26px;line-height:1.1;margin:4px 0">${globalStreak} <span style="font-size:12px;color:var(--text3)">days</span></div>
          <p class="meta">Consecutive days with completions</p>
        </div>
        <div class="ss-card">
          <span class="eyebrow">Best streak</span>
          <div class="serif" style="font-size:26px;line-height:1.1;margin:4px 0">${maxStreak} <span style="font-size:12px;color:var(--text3)">days</span></div>
          <p class="meta">Across all habits</p>
        </div>
        <div class="ss-card">
          <span class="eyebrow">Total completions</span>
          <div class="serif" style="font-size:26px;line-height:1.1;margin:4px 0">${totalCompletions}</div>
          <p class="meta">All time</p>
        </div>
        <div class="ss-card">
          <span class="eyebrow">Habits tracked</span>
          <div class="serif" style="font-size:26px;line-height:1.1;margin:4px 0">${totalHabits}</div>
          <p class="meta">Across ${state.length} categor${state.length !== 1 ? 'ies' : 'y'}</p>
        </div>
      </div>

      <div class="ss-card" style="padding:22px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <span class="serif" style="font-size:18px">By habit</span>
          <span class="meta">Streak progress</span>
        </div>
        ${habitBars}
      </div>
    </div>`;
}
