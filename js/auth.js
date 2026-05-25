import { supabase } from './supabase.js';

export async function signUp(email, password) {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
    });
    if (error) throw error;
    if (data.user?.identities?.length === 0) {
        throw new Error("An account with this email already exists. Please sign in.");
    }
    return data.session; // null when email confirmation is still required
}

export async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
}

export async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
    });
    if (error) throw error;
}

export async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
}

export function onAuthStateChange(callback) {
    supabase.auth.onAuthStateChange((_event, session) => callback(session));
}
