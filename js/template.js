import { uid } from './helpers.js';
import { state, saveState } from './state.js';

// ─── Builders ─────────────────────────────────────────────────────────────────

function micro(description, r1, r2, r3, r4) {
    return { id: uid(), description, r1, r2, r3, r4 };
}

function habit(name, type, priority, cue, craving, response, reward, microhabits) {
    return { id: uid(), name, type, priority, cue, craving, response, reward, open: false, microhabits };
}

function cat(name, habits) {
    return { id: uid(), name, open: true, habits };
}

// ─── Template factory (fresh UIDs on every call) ──────────────────────────────

function buildTemplate() {
    return [
        cat("Morning Routine", [
            habit(
                "Drink a glass of water on waking", "positive", "low",
                "Alarm goes off",
                "Feel awake and hydrated before the day begins",
                "Drink 500ml of water within 5 minutes of waking",
                "Mental clarity and an immediate energy boost",
                [
                    micro("Place a full glass of water on your bedside table the night before", 5, 4, 5, 3),
                    micro("Add a slice of lemon for taste and extra motivation", 3, 4, 4, 4),
                ]
            ),
            habit(
                "10-minute morning movement", "positive", "high",
                "After drinking morning water",
                "Feel energised and strong before the day's demands kick in",
                "Do a 10-minute stretch or light walk",
                "Natural energy lift and a positive mood to start the day",
                [
                    micro("Lay out workout clothes the night before as a visual trigger", 5, 3, 5, 3),
                    micro("Follow a guided 10-minute morning stretch routine", 3, 4, 4, 4),
                    micro("Walk to the end of the street and back for fresh air", 3, 3, 5, 3),
                ]
            ),
            habit(
                "Checking phone immediately on waking", "negative", "medium",
                "Waking up and reaching for the phone out of habit",
                "Feel calm and present before the noise of the day begins",
                "Charge phone in another room overnight so it is not within reach",
                "A peaceful, intentional start free from notifications and stress",
                [
                    micro("Charge phone in the kitchen instead of the bedroom", 4, 2, 4, 4),
                ]
            ),
            habit(
                "5-minute morning journal", "positive", "medium",
                "While making or drinking morning coffee or tea",
                "Feel mentally clear and intentional about the day ahead",
                "Write 3 things grateful for and 1 clear intention for the day",
                "A focused mindset and a stronger sense of direction",
                [
                    micro("Keep journal open on the desk with pen resting on top", 5, 3, 5, 3),
                    micro("Write 3 specific things you are genuinely grateful for today", 3, 4, 4, 5),
                ]
            ),
        ]),

        cat("Health & Fitness", [
            habit(
                "30-minute workout", "positive", "high",
                "After finishing breakfast",
                "Feel physically strong and full of energy",
                "Complete a 30-minute strength or cardio session",
                "Energy, confidence, and a sense of physical accomplishment",
                [
                    micro("Schedule workouts in your calendar as non-negotiable blocks", 4, 2, 5, 3),
                    micro("Set out gym bag and clothes the night before", 5, 3, 5, 3),
                    micro("Begin every session with a 5-minute warm-up to reduce friction", 3, 3, 5, 4),
                ]
            ),
            habit(
                "Drink 2 litres of water daily", "positive", "medium",
                "Hourly phone reminder throughout the day",
                "Feel hydrated, clear-headed, and physically energised",
                "Drink a full glass of water each time the reminder sounds",
                "Better focus, energy levels, and physical performance",
                [
                    micro("Keep a 2L water bottle visible on your desk at all times", 5, 3, 5, 4),
                    micro("Drink a full glass before sitting down to each meal", 4, 3, 5, 3),
                ]
            ),
            habit(
                "Late-night snacking", "negative", "medium",
                "Watching TV or relaxing after 9pm",
                "Feel satisfied and comfortable before bed",
                "Brush teeth right after dinner to close the eating window mentally",
                "Better sleep quality and reduced unnecessary calorie intake",
                [
                    micro("Move snacks out of sight or to a higher, less accessible shelf", 5, 2, 4, 4),
                    micro("Make a herbal tea as a satisfying, low-effort alternative", 3, 3, 4, 3),
                ]
            ),
            habit(
                "In bed by 10:30pm", "positive", "high",
                "Phone alarm at 9:45pm every evening",
                "Feel fully rested and recovered for the next day",
                "Begin wind-down: dim lights, stop all screens, and prepare for sleep",
                "7–8 hours of quality sleep and noticeably easier mornings",
                [
                    micro("Set a recurring bedtime alarm at 9:45pm labelled 'wind down'", 5, 2, 5, 4),
                    micro("Dim overhead lights and turn off all screens at the alarm", 4, 3, 4, 4),
                ]
            ),
            habit(
                "Take the stairs", "positive", "low",
                "Arriving at any building that has an elevator",
                "Feel naturally active without needing to carve out extra gym time",
                "Always choose the stairs as the default option",
                "Cumulative daily movement and steadily improving cardiovascular fitness",
                [
                    micro("Add a small reminder sticker inside your bag or on your work pass", 4, 3, 5, 3),
                ]
            ),
        ]),

        cat("Focus & Deep Work", [
            habit(
                "90-minute deep work block", "positive", "high",
                "After completing the morning routine",
                "Make meaningful, visible progress on the most important work",
                "Sit down for one focused session on a single top-priority task",
                "Tangible progress, momentum, and a reduced cognitive load for the rest of the day",
                [
                    micro("Write tomorrow's single top-priority task before going to bed tonight", 4, 4, 4, 4),
                    micro("Put phone on Do Not Disturb and close all unnecessary browser tabs", 4, 2, 5, 4),
                    micro("Use a 90-minute countdown timer to anchor and contain the session", 4, 3, 5, 4),
                ]
            ),
            habit(
                "Mindless social media browsing", "negative", "high",
                "Feeling bored, restless, or switching between tasks",
                "Feel stimulated, entertained, and connected without real effort",
                "Remove apps from the home screen and check only at two scheduled times daily",
                "Significantly more reclaimed time and a measurable improvement in focus depth",
                [
                    micro("Move all social apps into a single folder on the last screen of the phone", 4, 2, 4, 4),
                    micro("Set daily screen time limits for each social app in phone settings", 3, 2, 4, 4),
                ]
            ),
            habit(
                "Sunday weekly review", "positive", "medium",
                "Recurring calendar block every Sunday at 5pm",
                "Feel organised, prepared, and fully in control of the week ahead",
                "Review goals, wins, and blockers from the past week, then plan the next",
                "Clarity going into Monday, reduced anxiety, and better week-on-week decisions",
                [
                    micro("Block Sunday 5–6pm in your calendar as a recurring weekly event", 5, 3, 5, 4),
                    micro("Use a consistent one-page review template to structure the session", 4, 4, 4, 4),
                ]
            ),
            habit(
                "Read for 30 minutes", "positive", "medium",
                "After lunch or as part of the evening wind-down",
                "Learn something new and steadily grow your knowledge base",
                "Read a non-fiction or educational book for at least 30 minutes",
                "New ideas, better long-term retention, and genuine mental relaxation",
                [
                    micro("Leave your current book on the pillow or lunch table as a visual cue", 5, 4, 5, 4),
                    micro("Set a 30-minute timer so you do not need to watch the clock", 4, 3, 5, 3),
                ]
            ),
        ]),

        cat("Evening Wind-Down", [
            habit(
                "Prepare for tomorrow", "positive", "medium",
                "9pm recurring calendar reminder",
                "Feel ready and in control before the day ends",
                "Lay out clothes, pack the bag, and write exactly 3 priority tasks for tomorrow",
                "Calmer, more decisive mornings with zero decision fatigue",
                [
                    micro("Write exactly 3 tasks for tomorrow — no more, no less", 4, 4, 5, 4),
                    micro("Pack your bag and lay out tomorrow's clothes in one go", 4, 3, 5, 3),
                ]
            ),
            habit(
                "10-minute guided meditation", "positive", "high",
                "After brushing teeth as the final step of the bedtime routine",
                "Feel calm, centred, and genuinely ready for restful sleep",
                "Complete a 10-minute guided breathing or body-scan meditation",
                "Reduced anxiety, lower cortisol levels, and measurably deeper sleep",
                [
                    micro("Open the meditation app and queue tomorrow's session before getting into bed", 4, 4, 5, 5),
                    micro("Do 3 rounds of 4-7-8 breathing before starting the guided session", 3, 4, 5, 5),
                ]
            ),
            habit(
                "Scrolling phone in bed", "negative", "high",
                "Lying in bed feeling restless or unable to switch off",
                "Feel entertained and unwound after a demanding day",
                "Replace phone scrolling with reading a physical book or a calm podcast",
                "Faster sleep onset, better sleep quality, and no late-night anxiety loops",
                [
                    micro("Leave phone charging on a surface across the room every night", 5, 2, 4, 4),
                ]
            ),
            habit(
                "Evening gratitude reflection", "positive", "low",
                "Lying in bed just before turning off the light",
                "End the day feeling positive, grounded, and appreciative",
                "Silently reflect on 3 specific good things that happened today",
                "Improved mood, more positive sleep associations, and a growing sense of contentment",
                [
                    micro("Use the final 2 minutes before sleep to recall 3 genuine wins or moments of gratitude", 3, 4, 5, 5),
                ]
            ),
        ]),
    ];
}

// ─── Public ───────────────────────────────────────────────────────────────────

export function applyTemplate() {
    if (!confirm(
        "Load example template?\n\nThis will permanently replace all current categories, habits, and microhabits with preset example data.\n\nThis cannot be undone."
    )) return false;

    state.splice(0, state.length, ...buildTemplate());
    saveState();
    return true;
}
