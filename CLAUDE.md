# Habit Tracker

A vanilla JS habit tracking app based on the Atomic Habits framework (cue → craving → response → reward). No build step, no framework — ES modules loaded directly in the browser.

## Running the app

Open `index.html` in a browser (use a local server — ES modules require HTTP, not `file://`):

```
npx serve .
# or
python -m http.server
```

## Architecture

All state lives in `localStorage` under the key `habit-tracker-v1`. The app renders by replacing `innerHTML` of `#app` on every state change — no virtual DOM, no diffing.

### Module map

| File | Role |
|---|---|
| `js/state.js` | Single source of truth. All mutations save to localStorage. Exports live bindings (`let state`, `let appMode`). |
| `js/app.js` | Entry point. Event handlers, drag-and-drop logic, `render()`, window bindings for inline HTML handlers. |
| `js/render-edit.js` | Renders categories/habits as editable forms (edit mode). |
| `js/render-view.js` | Renders categories/habits as read-only cards with drag handles (view mode). |
| `js/helpers.js` | `uid()`, `esc()` (HTML escape), microhabit label constants. |
| `js/io.js` | JSON and CSV export/import. Import fires a `habit-import` CustomEvent. |
| `js/template.js` | `applyTemplate()` — replaces state with a preset example. |

### Data shape

```js
// state: Category[]
{
  id: string,
  name: string,
  open: boolean,
  habits: [{
    id, name, type: "positive"|"negative",
    priority: "low"|"medium"|"high",
    cue, craving, response, reward: string,
    open: boolean,
    microhabits: [{ id, description, r1, r2, r3, r4: 1-5 }]
  }]
}
```

Microhabit ratings map to: r1=Visibility, r2=Attractiveness, r3=Difficulty, r4=Satisfaction.

## Drag-and-drop

Two separate DnD systems coexist — be careful not to mix them.

**Category drag (view mode only)**
- Source: `.category-block` (draggable anywhere on the block, not just the handle)
- Drop targets: `.cat-drop-gap` divs rendered between categories by `renderWithCatGaps()` in `app.js`
- Category blocks themselves are NOT drop targets — they have no `ondragover`/`ondrop`
- `#app` has a passive dragover listener to suppress the browser's X cursor during category drag
- State function: `insertCategoryAt(index)` in `state.js`

**Habit drag (view mode only, within same category)**
- Source: `.view-habit-card` (draggable from the `⠿` handle area)
- Drop targets: other habit cards in the same category (`ondragover` on each card)
- Cross-category drops are blocked: `onHabitDragOver` checks `dragSrcCid === catId`
- State function: `reorderHabit(toCid, toHid, insertBefore)` in `state.js`

`onHabitDragStart` calls `e.stopPropagation()` to prevent habit drags from bubbling to the category block's `ondragstart`.

## Key conventions

- **Render is always a full redraw.** Mutations call `saveState()` then the caller calls `render()`. Never mutate DOM directly.
- **Inline HTML handlers** are used throughout (e.g. `onclick="deleteHabit('${c.id}','${h.id}')"`) — all referenced functions must be on `window`, assigned in `app.js`.
- **`esc()`** must wrap all user-supplied strings in templates to prevent XSS.
- **No comments explaining what code does** — only comments for non-obvious constraints or invariants.
- Edit mode and view mode render completely different HTML; `#app.app--view` removes category `margin-bottom` since gap divs own the spacing in view mode.
