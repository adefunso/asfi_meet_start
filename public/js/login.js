const form = document.getElementById("loginForm");
const loginBtn = document.getElementById("loginBtn");
const errorEl = document.getElementById("error");
const recaptchaWidget = document.querySelector(".g-recaptcha");
const recaptchaEnabled = !!recaptchaWidget;

let recaptchaPassed = !recaptchaEnabled;

function onLoginRecaptcha() {
    recaptchaPassed = true;
    if (loginBtn) loginBtn.disabled = false;
}

function onLoginRecaptchaExpired() {
    recaptchaPassed = false;
    if (loginBtn) loginBtn.disabled = true;
}

function setLoginLoading(isLoading) {
    if (!loginBtn) return;
    loginBtn.classList.toggle("btn-loading", isLoading);
    loginBtn.disabled = isLoading || !recaptchaPassed;
}

if (form) {
    form.addEventListener("submit", (e) => {
        e.preventDefault();

        const recaptchaToken = (typeof grecaptcha !== "undefined" && recaptchaEnabled)
            ? grecaptcha.getResponse()
            : "";

        if (recaptchaEnabled && !recaptchaToken) {
            recaptchaPassed = false;
            if (loginBtn) loginBtn.disabled = true;
            iziToast.error({
                message: "Please complete the reCAPTCHA verification.",
                position: "topCenter"
            });
            return;
        }

        const login = {
            user: document.getElementById("user").value,
            pass: document.getElementById("pass").value,
            recaptcha: recaptchaToken
        };

        setLoginLoading(true);

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

                    // Reset the widget so the user can try again with a fresh token.
                    if (recaptchaEnabled && typeof grecaptcha !== "undefined") {
                        grecaptcha.reset();
                    }
                    recaptchaPassed = !recaptchaEnabled;
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
