// Welcome page: role selection (step 1) and e-mail guide (step 2), joined by
// a one-time splash animation and a live daily-request counter (refreshed
// when step 2 opens and whenever the tab becomes visible again).
//
// The step switch and the limit state are both plain CSS toggles on <body>
// (".welcome--step2", ".welcome--limit") so layout.css/responsive.css can
// decide what that means at every breakpoint without any JS reaching into
// the layout.

// Shared with scripts/auth/index.js: once the splash has played on either
// page, the flag stops it from playing again for the rest of this browser tab.
const SPLASH_SESSION_KEY = "joinSplashPlayed";
const WELCOME_DAILY_LIMIT = 10;
const WELCOME_MAILTO_LINK =
    "mailto:join-issues@gmx.de?subject=Feature%20request&body=Please%20describe%20your%20request%20in%20a%20few%20sentences.%0A%0AIf%20you%20have%20a%20deadline%2C%20just%20mention%20the%20date%20in%20the%20text.";
const WELCOME_FETCH_TIMEOUT_MS = 8000;

document.addEventListener("DOMContentLoaded", initWelcome);

/**
 * Initializes the welcome page.
 * @returns {void} Nothing.
 */
function initWelcome() {
    playOrSkipSplash();
    setCreateRequestMailtoLink();
    bindStepNavigation();
    bindCounterRefresh();
    loadDailyRequestCount();
}

/**
 * Re-counts today's requests whenever the tab becomes visible again, so a
 * page left open in the background does not keep showing a stale number.
 * @returns {void} Nothing.
 */
function bindCounterRefresh() {
    document.addEventListener("visibilitychange", () => {
        if (!document.hidden) loadDailyRequestCount();
    });
}

/**
 * Plays the splash animation once per browser session; on repeat visits the
 * logo appears directly at its final position and the page is shown without
 * the usual delay.
 * @returns {void} Nothing.
 */
function playOrSkipSplash() {
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
    }, 1200);
}

/**
 * Points the step 2 "Create request" button at the prepared mailto link.
 * @returns {void} Nothing.
 */
function setCreateRequestMailtoLink() {
    const mailButton = document.getElementById("welcome-create-request-mail");
    if (mailButton) mailButton.href = WELCOME_MAILTO_LINK;
}

/**
 * Wires up the step 1 <-> step 2 navigation controls.
 * @returns {void} Nothing.
 */
function bindStepNavigation() {
    document.getElementById("welcome-create-request")?.addEventListener("click", showStepTwo);
    document.querySelectorAll(".welcome__back").forEach((backButton) =>
        backButton.addEventListener("click", showStepOne)
    );
}

/**
 * Switches the visible step to step 2 (the e-mail guide) and re-counts
 * today's requests, so the guide always opens with a fresh number.
 * @returns {void} Nothing.
 */
function showStepTwo() {
    document.body.classList.add("welcome--step2");
    loadDailyRequestCount();
}

/**
 * Switches the visible step back to step 1 (role selection).
 * @returns {void} Nothing.
 */
function showStepOne() {
    document.body.classList.remove("welcome--step2");
}

/**
 * Returns the Firebase base URL configured for this app.
 * @returns {string} The base URL.
 */
function getWelcomeBaseUrl() {
    return (window.JOIN_CONFIG && window.JOIN_CONFIG.BASE_URL) || "";
}

/**
 * Loads today's external ticket count and renders the matching guide state.
 * Any failure (network error or timeout) falls back to the "unknown" display
 * and never triggers the limit-reached state.
 * @returns {Promise<void>} A promise that resolves once the counter is rendered.
 */
async function loadDailyRequestCount() {
    try {
        const count = await fetchExternalTicketsCreatedToday();
        renderRequestCounter(count);
    } catch (error) {
        console.error("Loading today's request count failed:", error);
        renderRequestCounter(null);
    }
}

/**
 * Fetches all tasks and counts external tickets created today.
 *
 * Mirrors the "Innerhalb Tageslimit" rule in n8n/issue-collector.json exactly
 * (creator.type "extern" plus an id timestamp from today), so this guide
 * never promises more than the automation actually allows.
 * @returns {Promise<number>} The number of external tickets created today.
 */
async function fetchExternalTicketsCreatedToday() {
    const response = await fetch(`${getWelcomeBaseUrl()}tasks.json`, {
        signal: AbortSignal.timeout(WELCOME_FETCH_TIMEOUT_MS),
    });
    if (!response.ok) throw new Error(`Failed loading tasks: HTTP ${response.status}`);
    const tasks = (await response.json()) || {};
    const todayLabel = new Date().toDateString();
    return Object.values(tasks).filter(
        (task) =>
            task?.creator?.type === "extern" &&
            new Date(Number(task.id)).toDateString() === todayLabel
    ).length;
}

/**
 * Renders the "X of 10" counter and switches the guide between its normal
 * and limit-reached state.
 *
 * @param {number|null} count - Today's external ticket count, or null when it could not be loaded.
 * @returns {void} Nothing.
 */
function renderRequestCounter(count) {
    const usedText = count === null ? "–" : String(count);
    document.querySelectorAll(".welcome__counter-used").forEach((usedElement) => {
        usedElement.textContent = usedText;
    });
    const limitReached = count !== null && count >= WELCOME_DAILY_LIMIT;
    document.body.classList.toggle("welcome--limit", limitReached);
}
