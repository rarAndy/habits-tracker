import { signIn, signUp, signInWithGoogle, onAuthStateChange } from './auth.js';
import { checkUsernameAvailable } from './state.js';

let authTab = "signin";

// ─── Pre-select tab from query param ─────────────────────────────────────────

if (new URLSearchParams(window.location.search).get('tab') === 'signup') {
    authTab = "signup";
}

// ─── Detect email confirmation redirect ──────────────────────────────────────

const wasEmailConfirm = (() => {
    const hash  = new URLSearchParams(window.location.hash.slice(1));
    const query = new URLSearchParams(window.location.search);
    return hash.get('type') === 'signup' || query.get('type') === 'signup';
})();

if (wasEmailConfirm) {
    setAuthStatus("Confirming your account…");
    window.history.replaceState({}, '', window.location.pathname);
}

// ─── UI helpers ───────────────────────────────────────────────────────────────

function setAuthStatus(msg) {
    const el = document.getElementById("auth-status");
    if (!el) return;
    el.textContent = msg;
    el.classList.toggle("hidden", !msg);
}

function setAuthError(msg) {
    const el = document.getElementById("auth-error");
    if (!el) return;
    el.textContent = msg;
    el.classList.toggle("hidden", !msg);
}

function resetBtn() {
    const btn = document.getElementById("auth-submit-btn");
    if (!btn) return;
    btn.disabled    = false;
    btn.textContent = authTab === "signin" ? "Sign In" : "Sign Up";
}

function setTab(tab) {
    authTab = tab;
    document.querySelectorAll(".auth-tab").forEach(t =>
        t.classList.toggle("active", t.dataset.tab === tab)
    );
    const btn = document.getElementById("auth-submit-btn");
    if (btn) btn.textContent = tab === "signin" ? "Sign In" : "Sign Up";
    document.getElementById("auth-username-wrap")?.classList.toggle("hidden", tab !== "signup");
    setAuthError("");
}

// ─── Auth handlers ────────────────────────────────────────────────────────────

async function handleSubmit(e) {
    e.preventDefault();
    setAuthError("");
    const email    = document.getElementById("auth-email").value;
    const password = document.getElementById("auth-password").value;
    const btn      = document.getElementById("auth-submit-btn");
    btn.disabled    = true;
    btn.textContent = "…";

    try {
        if (authTab === "signin") {
            await signIn(email, password);
        } else {
            const username = document.getElementById("auth-username")?.value.trim() ?? "";
            if (username.length < 3 || username.length > 30) {
                setAuthError("Username must be 3–30 characters.");
                resetBtn();
                return;
            }
            const available = await checkUsernameAvailable(username);
            if (!available) {
                setAuthError("Username already taken.");
                resetBtn();
                return;
            }
            const session = await signUp(email, password, username);
            if (!session) {
                setAuthError("Check your email to confirm your account.");
                resetBtn();
            }
        }
    } catch (err) {
        setAuthError(err.message);
        resetBtn();
    }
}

// ─── Auth state ───────────────────────────────────────────────────────────────

onAuthStateChange(async (session) => {
    if (!session) return;
    if (wasEmailConfirm) {
        setAuthStatus("Authentication successful, logging in…");
        await new Promise(r => setTimeout(r, 1500));
    }
    window.location.replace('/app');
});

// ─── Event listeners ──────────────────────────────────────────────────────────

document.getElementById("auth-form")?.addEventListener("submit", handleSubmit);
document.getElementById("tab-signin")?.addEventListener("click", () => setTab("signin"));
document.getElementById("tab-signup")?.addEventListener("click", () => setTab("signup"));
document.getElementById("google-btn")?.addEventListener("click", async () => {
    setAuthError("");
    try { await signInWithGoogle(); }
    catch (err) { setAuthError(err.message); }
});
