import { supabase } from './supabase.js';

// Map<habitId, Set<"YYYY-MM-DD">>
const completions = new Map();
let currentUserId = null;

function localDateStr(d = new Date()) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export async function loadCompletions(userId) {
    currentUserId = userId;
    completions.clear();

    const { data, error } = await supabase
        .from('completions')
        .select('habit_id, date')
        .eq('user_id', userId);

    if (error) throw error;

    for (const row of data ?? []) {
        if (!completions.has(row.habit_id)) completions.set(row.habit_id, new Set());
        // Supabase returns DATE as "YYYY-MM-DD" string — store as-is
        completions.get(row.habit_id).add(row.date);
    }
}

export function isCompletedToday(habitId) {
    return completions.get(habitId)?.has(localDateStr()) ?? false;
}

export function getStreak(habitId) {
    const dates = completions.get(habitId);
    if (!dates || dates.size === 0) return 0;

    const d = new Date();
    d.setHours(0, 0, 0, 0);

    // If not done today, start counting from yesterday (streak still alive)
    if (!dates.has(localDateStr(d))) {
        d.setDate(d.getDate() - 1);
        if (!dates.has(localDateStr(d))) return 0;
    }

    let streak = 0;
    while (dates.has(localDateStr(d))) {
        streak++;
        d.setDate(d.getDate() - 1);
    }
    return streak;
}

export async function toggleCompletion(habitId) {
    const today = localDateStr();
    if (!completions.has(habitId)) completions.set(habitId, new Set());
    const dates = completions.get(habitId);

    if (dates.has(today)) {
        dates.delete(today);
        await supabase.from('completions')
            .delete()
            .eq('user_id', currentUserId)
            .eq('habit_id', habitId)
            .eq('date', today);
    } else {
        dates.add(today);
        await supabase.from('completions')
            .insert({ user_id: currentUserId, habit_id: habitId, date: today });
    }
}
