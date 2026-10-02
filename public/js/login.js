const form = document.getElementById("loginForm");
const loginBtn = document.getElementById("loginBtn");
const errorEl = document.getElementById("error");

// Score-based reCAPTCHA Enterprise keys have no visible checkbox. The site key
// is rendered onto the form and a fresh token is minted on demand with
// grecaptcha.enterprise.execute() right before the form is submitted.
const recaptchaSiteKey = form ? (form.dataset.recaptchaSiteKey || "") : "";
const recaptchaEnabled = recaptchaSiteKey !== "";
const RECAPTCHA_ACTION = "login";

function setLoginLoading(isLoading) {
    if (!loginBtn) return;
    loginBtn.classList.toggle("btn-loading", isLoading);
    loginBtn.disabled = isLoading;
}

function getRecaptchaToken() {
    return new Promise((resolve, reject) => {
        if (!recaptchaEnabled) return resolve("");

        if (typeof grecaptcha === "undefined" || !grecaptcha.enterprise) {
            return reject(new Error("reCAPTCHA failed to load. Please refresh and try again."));
        }

        grecaptcha.enterprise.ready(() => {
            grecaptcha.enterprise
                .execute(recaptchaSiteKey, { action: RECAPTCHA_ACTION })
                .then(resolve)
                .catch(() => reject(new Error("Unable to complete the reCAPTCHA verification.")));
        });
    });
}

if (form) {
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        setLoginLoading(true);

        let recaptchaToken = "";
        try {
            recaptchaToken = await getRecaptchaToken();
        } catch (err) {
            const message = err.message || "Unable to complete the reCAPTCHA verification.";
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
            recaptcha: recaptchaToken,
            recaptchaAction: RECAPTCHA_ACTION
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
