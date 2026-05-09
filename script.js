

(function () {
    "use strict";

    var CURRENT_USER_KEY = "flavorbook_current_user";
    var AUTH_TOKEN_KEY = "flavorbook_auth_token";
    var AUTH_TOKEN_VALUE = "allowed_user_authenticated";
    var USERS_KEY = "flavorbook_users";
    var SHARED_PASSWORD = "admin123";
    var THEME_KEY = "flavorbook_theme";
    var ALLOWED_USERS = ["Jocel Ann", "Ashley Kate", "AJ", "Adelfa", "Shirelyn"];
    var ALLOWED_USERS_LOWER = ["jocel ann", "ashley kate", "aj", "adelfa", "shirelyn"];

    function normalizeUsername(text) {
        return String(text || "").trim().replace(/\s+/g, " ").toLowerCase();
    }

    function currentHtmlFile() {
        var path = String(window.location.pathname || "").replace(/\\/g, "/");
        var last = path.split("/").pop() || "";
        var file = last.split("?")[0].split("#")[0];
        if (!file || !/\.html$/i.test(file)) {
            var href = String(window.location.href || "");
            var match = href.match(/([^/?#]+\.html)/i);
            if (match) file = match[1];
        }
        return file;
    }

    function readUsers() {
        try {
            var raw = localStorage.getItem(USERS_KEY);
            var parsed = JSON.parse(raw || "[]");
            return Array.isArray(parsed) ? parsed : [];
        } catch (_err) {
            return [];
        }
    }

    function saveUsers(users) {
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }

    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
    }

    function isLoggedIn() {
        try {
            var raw = localStorage.getItem(CURRENT_USER_KEY);
            if (!raw || raw === "null" || raw === "undefined") return false;
            var user = JSON.parse(raw);
            if (!user || typeof user !== "object") {
                localStorage.removeItem(CURRENT_USER_KEY);
                return false;
            }
            var hasAllowedName = typeof user.name === "string" && ALLOWED_USERS_LOWER.indexOf(normalizeUsername(user.name)) !== -1;
            var hasEmail = typeof user.email === "string" && /\S+@\S+\.\S+/.test(user.email);
            var hasToken = localStorage.getItem(AUTH_TOKEN_KEY) === AUTH_TOKEN_VALUE;
            if ((!hasAllowedName && !hasEmail) || !hasToken) {
                localStorage.removeItem(CURRENT_USER_KEY);
                localStorage.removeItem(AUTH_TOKEN_KEY);
                return false;
            }
            return true;
        } catch (_err) {
            try {
                localStorage.removeItem(CURRENT_USER_KEY);
                localStorage.removeItem(AUTH_TOKEN_KEY);
            } catch (_ignore) {}
            return false;
        }
    }

    // ===== Shared/Auth Redirect Script =====
    (function enforceAuthRedirect() {
        try {
            if (isLoggedIn()) return;
            var file = currentHtmlFile();
            if (/^index\.html$/i.test(file)) return;
            window.location.replace(new URL("index.html", window.location.href).href);
        } catch (_e) {
            // Fail open
        }
    })();

    document.addEventListener("DOMContentLoaded", function () {
        var menuToggle = document.getElementById("menu-toggle");
        var siteNav = document.getElementById("site-nav");
        var logoutButton = document.getElementById("logout-btn");
       

       
        
        if (menuToggle && siteNav) {
            menuToggle.addEventListener("click", function () {
                var openedA = siteNav.classList.toggle("open");
                var openedB = siteNav.classList.toggle("opn");
                menuToggle.setAttribute("aria-expanded", (openedA || openedB) ? "true" : "false");
            });
        }

  
        document.querySelectorAll(".vr").forEach(function (button) {
            button.addEventListener("click", function () {
                var targetId = button.getAttribute("data-target");
                var section = document.getElementById(targetId);
                if (!section) return;
                var isHidden = section.hasAttribute("hidden");
                section.toggleAttribute("hidden", !isHidden);
                button.setAttribute("aria-expanded", isHidden ? "true" : "false");
            });
        });

    
        if (logoutButton) {
            logoutButton.addEventListener("click", function () {
                localStorage.removeItem(CURRENT_USER_KEY);
                localStorage.removeItem(AUTH_TOKEN_KEY);
                window.location.href = new URL("index.html", window.location.href).href;
            });
        }


    
        var authTabs = document.querySelectorAll(".tab");
        var loginForm = document.getElementById("login-form");
        var signupForm = document.getElementById("signup-form");

        authTabs.forEach(function (btn) {
            btn.addEventListener("click", function () {
                var tab = btn.getAttribute("data-tab");
                authTabs.forEach(function (b) {
                    var active = b.getAttribute("data-tab") === tab;
                    b.classList.toggle("active", active);
                    b.setAttribute("aria-selected", active ? "true" : "false");
                });
                if (!loginForm || !signupForm) return;
                if (tab === "login") {
                    loginForm.classList.add("active");
                    signupForm.classList.remove("active");
                } else {
                    signupForm.classList.add("active");
                    loginForm.classList.remove("active");
                }
            });
        });

        var loginMessage = document.getElementById("login-message");
        if (loginForm) {
            loginForm.addEventListener("submit", function (event) {
                event.preventDefault();
                var usernameRaw = document.getElementById("login-username").value;
                var password = document.getElementById("login-password").value;

                if (!String(usernameRaw).trim() || !password) {
                    if (loginMessage) {
                        loginMessage.textContent = "Please enter your username and password.";
                        loginMessage.style.color = "#c23616";
                    }
                    return;
                }

                var normalizedInput = normalizeUsername(usernameRaw);
                var allowedUser = null;
                if (String(password || "") === SHARED_PASSWORD) {
                    for (var i = 0; i < ALLOWED_USERS.length; i++) {
                        if (normalizeUsername(ALLOWED_USERS[i]) === normalizedInput) {
                            allowedUser = ALLOWED_USERS[i];
                            break;
                        }
                    }
                }

                if (allowedUser) {
                    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify({ name: allowedUser, email: "" }));
                    localStorage.setItem(AUTH_TOKEN_KEY, AUTH_TOKEN_VALUE);
                    if (loginMessage) {
                        loginMessage.textContent = "Welcome! Redirecting…";
                        loginMessage.style.color = "#2f9e44";
                    }
                    window.location.href = new URL("home.html", window.location.href).href;
                    return;
                }

                var users = readUsers();
                var identity = String(usernameRaw || "").trim().toLowerCase();
                var matched = users.find(function (u) {
                    var byName = String(u.name || "").trim().toLowerCase() === identity;
                    var byEmail = String(u.email || "").trim().toLowerCase() === identity;
                    return (byName || byEmail) && String(u.password || "") === String(password || "");
                });

                if (matched) {
                    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify({ name: matched.name, email: matched.email }));
                    localStorage.setItem(AUTH_TOKEN_KEY, AUTH_TOKEN_VALUE);
                    if (loginMessage) {
                        loginMessage.textContent = "Welcome! Redirecting…";
                        loginMessage.style.color = "#2f9e44";
                    }
                    window.location.href = new URL("home.html", window.location.href).href;
                    return;
                }

                if (loginMessage) {
                    loginMessage.textContent = "Invalid username or password. Please try again.";
                    loginMessage.style.color = "#c23616";
                }
            });
        }

        var signupMessage = document.getElementById("signup-message");
        if (signupForm) {
            signupForm.addEventListener("submit", function (event) {
                event.preventDefault();
                var name = String(document.getElementById("signup-name").value || "").trim();
                var email = String(document.getElementById("signup-email").value || "").trim().toLowerCase();
                var password = String(document.getElementById("signup-password").value || "");
                var confirmPassword = String(document.getElementById("signup-confirm-password").value || "");

                if (!name || !email || !password || !confirmPassword) {
                    signupMessage.textContent = "Please complete all fields.";
                    signupMessage.style.color = "#c23616";
                    return;
                }
                if (!isValidEmail(email)) {
                    signupMessage.textContent = "Please enter a valid email address.";
                    signupMessage.style.color = "#c23616";
                    return;
                }
                if (password.length < 6) {
                    signupMessage.textContent = "Password must be at least 6 characters.";
                    signupMessage.style.color = "#c23616";
                    return;
                }
                if (password !== confirmPassword) {
                    signupMessage.textContent = "Passwords do not match.";
                    signupMessage.style.color = "#c23616";
                    return;
                }

                var users = readUsers();
                var emailTaken = users.some(function (u) {
                    return String(u.email || "").trim().toLowerCase() === email;
                });
                if (emailTaken) {
                    signupMessage.textContent = "An account with this email already exists.";
                    signupMessage.style.color = "#c23616";
                    return;
                }

                users.push({ name: name, email: email, password: password });
                saveUsers(users);
                localStorage.setItem(CURRENT_USER_KEY, JSON.stringify({ name: name, email: email }));
                localStorage.setItem(AUTH_TOKEN_KEY, AUTH_TOKEN_VALUE);
                signupMessage.textContent = "Account created! Redirecting…";
                signupMessage.style.color = "#2f9e44";
                window.location.href = new URL("home.html", window.location.href).href;
            });
        }
    });
})();
