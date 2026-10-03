const form = document.getElementById("loginForm");
const loginBtn = document.getElementById("loginBtn");
const errorEl = document.getElementById("error");

// Cloudflare Turnstile renders a widget onto the form. The response token is
// read from the hidden cf-turnstile-response field when the form is submitted.
const turnstileSiteKey = form ? (form.dataset.turnstileSiteKey || "") : "";
const turnstileEnabled = turnstileSiteKey !== "";

let turnstilePassed = false;

function onLoginTurnstile() {
    turnstilePassed = true;
    if (loginBtn) loginBtn.disabled = false;
}

function onLoginTurnstileExpired() {
    turnstilePassed = false;
    if (loginBtn) loginBtn.disabled = true;
}

function setLoginLoading(isLoading) {
    if (!loginBtn) return;
    loginBtn.classList.toggle("btn-loading", isLoading);
    loginBtn.disabled = isLoading;
}

function getTurnstileToken() {
    const field = document.querySelector('input[name="cf-turnstile-response"]');
    return field ? field.value : "";
}

if (form) {
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        setLoginLoading(true);

        const turnstileToken = getTurnstileToken();
        if (turnstileEnabled && !turnstileToken) {
            const message = "Please complete the Turnstile verification.";
            iziToast.error({
                message: message,
                position: "topCenter"
            });
            if (errorEl) errorEl.innerText = message;
            setLoginLoading(false);
            return;
        }

        const login = {
            user: document.getElementById("user").value,
            pass: document.getElementById("pass").value,
            turnstile_token: turnstileToken
        };

        fetch("/api/login", {
            method: "POST",
            body: JSON.stringify(login),
            headers: {
                "Content-type": "application/JSON"
            }
        }).then(res => res.json())
            .then(data => {

                if (data.status == "error") {
                    iziToast.error({
                        message: data.error,
                        position: "topCenter"
                    });
                    if (errorEl) errorEl.innerText = data.error;

                    setLoginLoading(false);
                }
                else {
                    iziToast.success({
                        message: data.success,
                        position: "topCenter"
                    });
                    window.location.reload();
                }
            })
            .catch(() => {
                iziToast.error({
                    message: "Something went wrong. Please try again.",
                    position: "topCenter"
                });
                setLoginLoading(false);
            });
    });
}

function show_pass() {
    var pass = document.getElementById("pass");
    if (pass.type === "password") {
        pass.type = "text";
    } else {
        pass.type = "password";
    }
}
