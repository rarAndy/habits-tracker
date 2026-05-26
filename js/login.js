import { signIn, signInWithGoogle, onAuthStateChange } from './auth.js';

onAuthStateChange((session) => {
    if (session) window.location.replace('/app');
});

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
    const btn      = document.getElementById("auth-submit-btn");
    btn.disabled    = true;
    btn.textContent = "…";
    try {
        await signIn(email, password);
    } catch (err) {
        setError(err.message);
        btn.disabled    = false;
        btn.textContent = "Sign In";
    }
}

document.getElementById("auth-form")?.addEventListener("submit", handleSubmit);
document.getElementById("google-btn")?.addEventListener("click", async () => {
    setError("");
    try { await signInWithGoogle(); }
    catch (err) { setError(err.message); }
});
