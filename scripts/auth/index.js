document.addEventListener("DOMContentLoaded", initLogin);

const INDEX_IS_IN_TEMPLATES = window.location.pathname.includes("/templates/");
const ASSET_BASE_PATH = INDEX_IS_IN_TEMPLATES ? "../assets/" : "./assets/";
const INDEX_PAGE_BASE_PATH = INDEX_IS_IN_TEMPLATES ? "./" : "./templates/";
const AUTH_USER_QUERY_KEY = "uid";
// Shared with scripts/welcome.js: once the splash has played on either page,
// the flag stops it from playing again for the rest of this browser tab.
const SPLASH_SESSION_KEY = "joinSplashPlayed";

/**
 * Returns the asset path.
 *
 * @param {string} relativePath - The relative path.
 * @returns {string} The asset path.
 */
function assetPath(relativePath) {
    return `${ASSET_BASE_PATH}${relativePath}`;
}


/**
 * Returns the page path.
 *
 * @param {string} pageFile - The page file.
 * @returns {string} The page path.
 */
function pagePath(pageFile) {
    return `${INDEX_PAGE_BASE_PATH}${pageFile}`;
}


/**
 * Initializes the login.
 * @returns {void} Nothing.
 */
function initLogin() {
    setSplashLogoByViewport();
    setMobileSplashBackground();
    setMainOpacity();
    setupSignupFormValidation();
    hideLoginError();
    hideSignupError();
    setupPasswordVisibility();
    setupLoginButtons();
    bindLoginErrorHideOnInput();
}


/**
 * Returns the auth base URL.
 * @returns {string} The auth base URL.
 */
function getAuthBaseUrl() {
    return (window.JOIN_CONFIG && window.JOIN_CONFIG.BASE_URL) || "";
}


/**
 * Checks whether the valid email is address.
 *
 * @param {string} email - The email.
 * @returns {boolean} Whether the valid email is address.
 */
function isValidEmailAddress(email) {
    const emailPattern = /^[^\s@]+@[^\s@.]+\.[A-Za-z]{2,}$/;
    return emailPattern.test(email);
}


/**
 * Returns the users from database.
 * @returns {Promise<Array<object>>} A promise that resolves to the users from database list.
 */
async function getUsersFromDatabase() {
    const response = await fetch(`${getAuthBaseUrl()}users.json`);
    if (!response.ok) throw new Error(`Failed loading users: HTTP ${response.status}`);
    return (await response.json()) || {};
}


/**
 * Checks whether the email already is registered.
 *
 * @param {Array<object>} usersObject - The users object list.
 * @param {string} email - The email.
 * @returns {boolean} Whether the email already is registered.
 */
function isEmailAlreadyRegistered(usersObject, email) {
    return Boolean(getUserEntryByEmail(usersObject, email));
}


/**
 * Returns the pad to two digits.
 *
 * @param {string} value - The value.
 * @returns {string} The pad to two digits.
 */
function padToTwoDigits(value) {
    return String(value).padStart(2, "0");
}


/**
 * Formats the german timestamp.
 *
 * @param {string} date - The date.
 * @returns {string} The german timestamp.
 */
function formatGermanTimestamp(date) {
    const day = padToTwoDigits(date.getDate());
    const month = padToTwoDigits(date.getMonth() + 1);
    const year = String(date.getFullYear());
    const hour = padToTwoDigits(date.getHours());
    const minute = padToTwoDigits(date.getMinutes());
    const second = padToTwoDigits(date.getSeconds());
    return `${day}${month}${year}${hour}${minute}${second}`;
}


/**
 * Returns the splash logo element.
 * @returns {HTMLElement|null} The splash logo element element, or null when it is not available.
 */
function getSplashLogoElement() {
    return document.querySelector(".splash__logo--image");
}


/**
 * Checks whether the viewport is mobile.
 * @returns {boolean} Whether the viewport is mobile.
 */
function isMobileViewport() {
    return window.matchMedia("(max-width: 600px)").matches;
}


/**
 * Sets the splash logo by viewport.
 * @returns {void} Nothing.
 */
function setSplashLogoByViewport() {
    const splashLogo = getSplashLogoElement();
    if (!splashLogo) return;
    splashLogo.src = isMobileViewport()
        ? assetPath("icons/desktop/logo.svg")
        : assetPath("icons/desktop/Dark_Logo.svg");
}


/**
 * Returns the mobile splash elements.
 * @returns {object} The mobile splash elements object.
 */
function getMobileSplashElements() {
    return {
        splash: document.querySelector(".splash__logo"),
        splashLogo: getSplashLogoElement(),
    };
}


/**
 * Checks whether the mobile splash should apply.
 *
 * @param {*} splash - The splash.
 * @returns {boolean} Whether the mobile splash should apply.
 */
function shouldApplyMobileSplash(splash) {
    return Boolean(splash) && isMobileViewport();
}


/**
 * Builds the splash background reset.
 *
 * @param {*} originalBg - The original bg.
 * @param {*} splashLogo - The splash logo.
 * @returns {*} The splash background reset result.
 */
function buildSplashBackgroundReset(originalBg, splashLogo) {
    return () => {
        document.body.style.backgroundColor = originalBg;
        if (splashLogo) splashLogo.src = assetPath("icons/desktop/Dark_Logo.svg");
    };
}


/**
 * Sets the mobile splash background.
 * @returns {void} Nothing.
 */
function setMobileSplashBackground() {
    const { splash, splashLogo } = getMobileSplashElements();
    if (!shouldApplyMobileSplash(splash)) return;
    const originalBg = getComputedStyle(document.body).backgroundColor;
    const resetBg = buildSplashBackgroundReset(originalBg, splashLogo);
    document.body.style.backgroundColor = "#2a3647";
    splash.addEventListener("animationend", resetBg, { once: true });
    setTimeout(resetBg, 700);
}


/**
 * Sets the main opacity.
 *
 * Plays the splash animation and the delayed fade-in only once per browser
 * session (see SPLASH_SESSION_KEY). On repeat visits within the same session
 * (e.g. coming back from welcome.html) the logo appears directly at its
 * final position and the page content is visible without delay.
 * @returns {void} Nothing.
 */
function setMainOpacity() {
    const mainContent = document.getElementById("main-content");
    const splashLogo = document.querySelector(".splash__logo");
    if (sessionStorage.getItem(SPLASH_SESSION_KEY) === "true") {
        splashLogo?.classList.add("splash__logo--skip");
        mainContent?.classList.add("main-content--opacity");
        return;
    }
    sessionStorage.setItem(SPLASH_SESSION_KEY, "true");
    if (!mainContent) return;
    setTimeout(() => {
        mainContent.classList.add("main-content--opacity");
    }, 700);
}


/**
 * Sets up the password visibility.
 * @returns {void} Nothing.
 */
function setupPasswordVisibility() {
    const passwordFields = getPasswordFields();
    passwordFields.forEach((field) => setupPasswordField(field));
}


/**
 * Returns the password field by icon ID.
 *
 * @param {string|number} iconId - The icon ID used for this operation.
 * @returns {string|null} The password field by icon ID, or null when it is not available.
 */
function getPasswordFieldByIconId(iconId) {
    const icon = document.getElementById(iconId);
    if (!icon) return null;
    const input = icon.closest(".login__input-field")?.querySelector(".login__input--password");
    return input ? { input, icon } : null;
}


/**
 * Returns the password fields.
 * @returns {Array<*>} The password fields list.
 */
function getPasswordFields() {
    const passwordField = getPasswordFieldByIconId("password-icon");
    const confirmField = getPasswordFieldByIconId("confirm-password-icon");
    return [passwordField, confirmField].filter(Boolean);
}


/**
 * Sets up the password field.
 *
 * @param {HTMLElement|null} field - The field.
 * @returns {void} Nothing.
 */
function setupPasswordField(field) {
    field.input.addEventListener("focus", () => showVisibilityIcon(field));
    field.input.addEventListener("blur", () => hideVisibilityIcon(field));
    field.icon.addEventListener("mousedown", (event) => event.preventDefault());
    field.icon.addEventListener("click", () => togglePasswordVisibility(field));
}


/**
 * Shows the visibility icon.
 *
 * @param {HTMLElement|null} field - The field.
 * @returns {void} Nothing.
 */
function showVisibilityIcon(field) {
    if (field.input.type !== "password") return;
    field.icon.src = assetPath("icons/desktop/visibility_off.svg");
    field.icon.style.cursor = "pointer";
}


/**
 * Hides the visibility icon.
 *
 * @param {HTMLElement|null} field - The field.
 * @returns {void} Nothing.
 */
function hideVisibilityIcon(field) {
    field.input.type = "password";
    field.icon.src = assetPath("icons/desktop/lock.svg");
    field.icon.style.cursor = "default";
}


/**
 * Checks whether the icon is lock.
 *
 * @param {HTMLElement|null} field - The field.
 * @returns {boolean} Whether the icon is lock.
 */
function isLockIcon(field) {
    return field.icon.src.includes("lock.svg");
}


/**
 * Shows the password.
 *
 * @param {HTMLElement|null} field - The field.
 * @returns {void} Nothing.
 */
function showPassword(field) {
    field.input.type = "text";
    field.icon.src = assetPath("icons/desktop/visibility.svg");
}


/**
 * Hides the password.
 *
 * @param {HTMLElement|null} field - The field.
 * @returns {void} Nothing.
 */
function hidePassword(field) {
    field.input.type = "password";
    field.icon.src = assetPath("icons/desktop/visibility_off.svg");
}


/**
 * Toggles the password visibility.
 *
 * @param {HTMLElement|null} field - The field.
 * @returns {void} Nothing.
 */
function togglePasswordVisibility(field) {
    if (isLockIcon(field)) return;
    if (field.input.type === "password") showPassword(field);
    else hidePassword(field);
    field.input.focus();
}


/**
 * Sets the button disabled.
 *
 * @param {HTMLElement|null} button - The button.
 * @param {*} disabled - The disabled.
 * @returns {void} Nothing.
 */
function setButtonDisabled(button, disabled) {
    if (!button) return;
    button.disabled = disabled;
}


/**
 * Builds the summary path with user ID.
 *
 * @param {string|number} userId - The user ID used for this operation.
 * @returns {string} The summary path with user ID.
 */
function buildSummaryPathWithUserId(userId) {
    if (!userId) return pagePath("summary.html");
    const query = `${AUTH_USER_QUERY_KEY}=${encodeURIComponent(userId)}`;
    return `${pagePath("summary.html")}?${query}`;
}


/**
 * Redirects the to summary.
 *
 * @param {string} [userId=""] - The user ID used for this operation. Defaults to "".
 * @returns {void} Nothing.
 */
function redirectToSummary(userId = "") {
    location.href = buildSummaryPathWithUserId(userId);
}
