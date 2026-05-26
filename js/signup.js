import { signUp, signInWithGoogle, onAuthStateChange } from './auth.js';
import { checkUsernameAvailable } from './state.js';

const wasEmailConfirm = (() => {
    const hash  = new URLSearchParams(window.location.hash.slice(1));
    const query = new URLSearchParams(window.location.search);
    return hash.get('type') === 'signup' || query.get('type') === 'signup';
})();

if (wasEmailConfirm) {
    setStatus("Confirming your account…");
    window.history.replaceState({}, '', window.location.pathname);
}

onAuthStateChange(async (session) => {
    if (!session) return;
    if (wasEmailConfirm) {
        setStatus("Account confirmed, logging in…");
        await new Promise(r => setTimeout(r, 1200));
    }
    window.location.replace('/app');
});

function setStatus(msg) {
    const el = document.getElementById("auth-status");
    if (!el) return;
    el.textContent = msg;
    el.classList.toggle("hidden", !msg);
}

function setError(msg) {
    const el = document.getElementById("auth-error");
    if (!el) return;
    el.textContent = msg;
    el.classList.toggle("hidden", !msg);
}

async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const email    = document.getElementById("auth-email").value;
    const password = document.getElementById("auth-password").value;
    const username = document.getElementById("auth-username").value.trim();
    const btn      = document.getElementById("auth-submit-btn");

    if (username.length < 3 || username.length > 30) {
        setError("Username must be 3–30 characters.");
        return;
    }

    btn.disabled    = true;
    btn.textContent = "…";

    try {
        const available = await checkUsernameAvailable(username);
        if (!available) {
            setError("Username already taken.");
            btn.disabled    = false;
            btn.textContent = "Sign Up";
            return;
        }
        const session = await signUp(email, password, username);
        if (!session) {
            setStatus("Check your email to confirm your account.");
            btn.disabled    = false;
            btn.textContent = "Sign Up";
        }
    } catch (err) {
        setError(err.message);
        btn.disabled    = false;
        btn.textContent = "Sign Up";
    }
}

document.getElementById("auth-form")?.addEventListener("submit", handleSubmit);
document.getElementById("google-btn")?.addEventListener("click", async () => {
    setError("");
    try { await signInWithGoogle(); }
    catch (err) { setError(err.message); }
});
