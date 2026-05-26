import { supabase } from './supabase.js';
import { onAuthStateChange } from './auth.js';

let currentUserId = null;
let currentEmail  = null;

async function loadProfile(userId, email) {
    document.getElementById('profile-email').value = email ?? '';
    const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('user_id', userId)
        .maybeSingle();
    if (error) { showMsg(error.message, 'error'); return; }
    if (data) document.getElementById('profile-username').value = data.username;
}

async function handleSave(e) {
    e.preventDefault();
    const username = document.getElementById('profile-username').value.trim();
    const btn      = document.getElementById('profile-save-btn');

    if (username.length < 3 || username.length > 30) {
        showMsg('Username must be 3–30 characters.', 'error');
        return;
    }

    btn.disabled    = true;
    btn.textContent = '…';

    const { error } = await supabase
        .from('profiles')
        .upsert({ user_id: currentUserId, username, email: currentEmail }, { onConflict: 'user_id' });

    btn.disabled    = false;
    btn.textContent = 'Save Changes';

    if (error) {
        showMsg(error.code === '23505' ? 'Username already taken.' : error.message, 'error');
    } else {
        showMsg('Profile updated.', 'success');
    }
}

function showMsg(text, type) {
    const el = document.getElementById('profile-msg');
    if (!el) return;
    el.textContent = text;
    el.className   = `profile-msg profile-msg--${type}`;
}

onAuthStateChange((session) => {
    if (!session) { window.location.replace('/'); return; }
    currentUserId = session.user.id;
    currentEmail  = session.user.email;
    loadProfile(session.user.id, session.user.email);
});

document.getElementById('profile-form')?.addEventListener('submit', handleSave);
