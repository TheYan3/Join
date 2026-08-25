document.addEventListener("DOMContentLoaded", initSummary);

const SUMMARY_BASE_URL =
    window.JOIN_CONFIG.BASE_URL;
const SUMMARY_AUTH_USER_QUERY_KEY = "uid";
const SUMMARY_GUEST_NAME = "guest user";
const SUMMARY_GUEST_EMAIL = "guest@join.local";

let summaryIsGuestUser = false;

/**
 * Initializes the summary.
 * @returns {Promise<void>} A promise that resolves when the operation is complete.
 */
async function initSummary() {
    await loadGreetingUserName();
    showGreetingFullscreen();
}


/**
 * Returns the summary auth user ID.
 * @returns {string} The summary auth user ID.
 */
function getSummaryAuthUserId() {
    const params = new URLSearchParams(window.location.search);
    return String(params.get(SUMMARY_AUTH_USER_QUERY_KEY) || "").trim();
}


/**
 * Fetches the summary user.
 *
 * @param {string|number} userId - The user ID used for this operation.
 * @returns {Promise<object>} A promise that resolves to the summary user object.
 */
async function fetchSummaryUser(userId) {
    const response = await fetch(`${SUMMARY_BASE_URL}users/${encodeURIComponent(userId)}.json`, {
        signal: window.JOIN_CONFIG.pageAbortSignal,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
}


/**
 * Sets the greeting user name.
 *
 * @param {string} name - The name.
 * @returns {void} Nothing.
 */
function setGreetingUserName(name) {
    const nameElement = document.querySelector(".greetings__name");
    if (!nameElement) return;
    const trimmedName = String(name || "").trim();
    if (!trimmedName) return;
    nameElement.style.display = "";
    nameElement.textContent = trimmedName;
}


/**
 * Checks whether the summary guest is user.
 *
 * @param {object} user - The user object.
 * @returns {boolean} Whether the summary guest is user.
 */
function isSummaryGuestUser(user) {
    const name = String(user?.name || "").trim().toLowerCase();
    const email = String(user?.email || "").trim().toLowerCase();
    return name === SUMMARY_GUEST_NAME || email === SUMMARY_GUEST_EMAIL;
}


/**
 * Hides the greeting user name.
 * @returns {void} Nothing.
 */
function hideGreetingUserName() {
    const nameElement = document.querySelector(".greetings__name");
    if (!nameElement) return;
    nameElement.style.display = "none";
}


/**
 * Loads the greeting user name.
 * @returns {Promise<void>} A promise that resolves when the operation is complete.
 */
async function loadGreetingUserName() {
    const userId = getSummaryAuthUserId();
    if (!userId) return;
    try {
        const user = await fetchSummaryUser(userId);
        summaryIsGuestUser = isSummaryGuestUser(user);
        if (summaryIsGuestUser) return hideGreetingUserName();
        setGreetingUserName(user?.name);
    } catch (error) {
        if (error.name === "AbortError") return;
        console.error("Summary user loading failed:", error);
    }
}


/**
 * Formats the guest greeting.
 *
 * @param {string} greetingText - The greeting text.
 * @returns {string} The guest greeting.
 */
function formatGuestGreeting(greetingText) {
    const normalized = String(greetingText || "").replace(",", "").trim();
    return `${normalized}!`;
}


/**
 * Shows the greeting fullscreen.
 * @returns {void} Nothing.
 */
function showGreetingFullscreen() {
    const isMobile = window.matchMedia("(max-width: 1160px)").matches;
    if (!isMobile || !shouldPlayGreetingAnimation()) return loadSummaryWithGreeting();
    const greetings = document.querySelector(".overview__greetings");
    const summaryMain = document.querySelector("main.main");
    if (!greetings || !summaryMain) return loadSummaryWithGreeting();
    activateGreetingView(summaryMain, greetings);
    setTimeout(() => hideGreetingAndLoad(summaryMain, greetings), 1200);
}


/**
 * Checks whether the greeting animation should play.
 * @returns {boolean} Whether the greeting animation should play.
 */
function shouldPlayGreetingAnimation() {
    if (isReloadNavigation()) return true;
    return isFromLoginPage();
}


/**
 * Checks whether the navigation is reload.
 * @returns {boolean} Whether the navigation is reload.
 */
function isReloadNavigation() {
    const navEntry = performance.getEntriesByType("navigation")[0];
    return navEntry?.type === "reload";
}


/**
 * Checks whether the from login is page.
 * @returns {boolean} Whether the from login is page.
 */
function isFromLoginPage() {
    return document.referrer.includes("login.html");
}


/**
 * Loads the summary with greeting.
 * @returns {void} Nothing.
 */
function loadSummaryWithGreeting() {
    getCurrentTime();
    loadSummaryData();
}


/**
 * Activates the greeting view.
 *
 * @param {*} summaryMain - The summary main.
 * @param {*} greetings - The greetings.
 * @returns {void} Nothing.
 */
function activateGreetingView(summaryMain, greetings) {
    getCurrentTime();
    summaryMain.classList.add("summary-greeting-active");
    greetings.classList.add("greeting-fullscreen");
}


/**
 * Hides the greeting and load.
 *
 * @param {*} summaryMain - The summary main.
 * @param {*} greetings - The greetings.
 * @returns {void} Nothing.
 */
function hideGreetingAndLoad(summaryMain, greetings) {
    summaryMain.classList.remove("summary-greeting-active");
    greetings.classList.remove("greeting-fullscreen");
    loadSummaryData();
    animateSummaryFadeIn(summaryMain);
}


/**
 * Animates the summary fade in.
 *
 * @param {*} summaryMain - The summary main.
 * @returns {void} Nothing.
 */
function animateSummaryFadeIn(summaryMain) {
    summaryMain.classList.remove("summary-fade-in");
    requestAnimationFrame(() => {
        summaryMain.classList.add("summary-fade-in");
    });
}


/**
 * Loads the summary data.
 * @returns {Promise<void>} A promise that resolves when the operation is complete.
 */
async function loadSummaryData() {
    const tasks = await loadTasksFromFirebase();
    updateBacklogCount(tasks);
    updateDoneCount(tasks);
    updateTasksOnBoardCount(tasks);
    updateTasksInProgressCount(tasks);
    updateAwaitingFeedbackCount(tasks);
    updateUrgentCount(tasks);
    updateUpcomingDeadline(tasks);
}


/**
 * Loads the tasks from Firebase.
 * @returns {Promise<Array<*>>} A promise that resolves to the tasks from Firebase list.
 */
async function loadTasksFromFirebase() {
    try {
        const response = await fetch(`${SUMMARY_BASE_URL}tasks.json`, {
            signal: window.JOIN_CONFIG.pageAbortSignal,
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (!data) return [];
        if (Array.isArray(data)) {
            return data.filter((task) => task && typeof task === "object");
        }
        return Object.values(data).filter((task) => task && typeof task === "object");
    } catch (error) {
        if (error.name === "AbortError") return [];
        console.error("Summary task loading failed:", error);
        return [];
    }
}


/**
 * Updates the backlog count.
 *
 * @param {Array<object>} tasks - The tasks list.
 * @returns {void} Nothing.
 */
function updateBacklogCount(tasks) {
    const todoCount = tasks.filter(task => task.status === "todo").length;
    const backlogElement = document.getElementById("backlogCount");
    if (backlogElement) backlogElement.textContent = todoCount;
}


/**
 * Updates the done count.
 *
 * @param {Array<object>} tasks - The tasks list.
 * @returns {void} Nothing.
 */
function updateDoneCount(tasks) {
    const doneCount = tasks.filter(task => task.status === "done").length;
    const doneElement = document.getElementById("doneCount");
    if (doneElement) doneElement.textContent = doneCount;
}


/**
 * Updates the tasks on board count.
 *
 * @param {Array<object>} tasks - The tasks list.
 * @returns {void} Nothing.
 */
function updateTasksOnBoardCount(tasks) {
    const totalCount = tasks.length;
    const boardElement = document.getElementById("tasksOnBoardCount");
    if (boardElement) boardElement.textContent = totalCount;
}


/**
 * Updates the tasks in progress count.
 *
 * @param {Array<object>} tasks - The tasks list.
 * @returns {void} Nothing.
 */
function updateTasksInProgressCount(tasks) {
    const progressCount = tasks.filter(task => task.status === "in-progress").length;
    const progressElement = document.getElementById("tasksInProgressCount");
    if (progressElement) progressElement.textContent = progressCount;
}


/**
 * Updates the awaiting feedback count.
 *
 * @param {Array<object>} tasks - The tasks list.
 * @returns {void} Nothing.
 */
function updateAwaitingFeedbackCount(tasks) {
    const feedbackCount = tasks.filter(task => task.status === "await-feedback").length;
    const feedbackElement = document.getElementById("awaitingFeedbackCount");
    if (feedbackElement) feedbackElement.textContent = feedbackCount;
}


/**
 * Updates the urgent count.
 *
 * @param {Array<object>} tasks - The tasks list.
 * @returns {void} Nothing.
 */
function updateUrgentCount(tasks) {
    const urgentCount = tasks.filter(task => task.priority === "urgent").length;
    const urgentElement = document.getElementById("urgentCount");
    if (urgentElement) urgentElement.textContent = urgentCount;
}


/**
 * Updates the upcoming deadline.
 *
 * @param {Array<object>} tasks - The tasks list.
 * @returns {void} Nothing.
 */
function updateUpcomingDeadline(tasks) {
    const urgentTasks = tasks.filter(task => task.priority === "urgent" && task.date);
    if (urgentTasks.length === 0) {
        const deadlineElement = document.getElementById("upcomingDeadline");
        if (deadlineElement) deadlineElement.textContent = "-";
        return;
    }
    const sortedUrgent = urgentTasks.sort((a, b) => parseGermanDate(a.date) - parseGermanDate(b.date));
    const nextDeadline = sortedUrgent[0].date;
    const deadlineElement = document.getElementById("upcomingDeadline");
    if (deadlineElement) deadlineElement.textContent = formatDeadlineDate(nextDeadline);
}


/**
 * Parses the german date.
 *
 * @param {string} dateString - The date string.
 * @returns {string} The german date.
 */
function parseGermanDate(dateString) {
    const parts = dateString.split('/');
    if (parts.length !== 3) return new Date(dateString);
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    return new Date(year, month, day);
}


/**
 * Formats the deadline date.
 *
 * @param {string} dateString - The date string.
 * @returns {string} The deadline date.
 */
function formatDeadlineDate(dateString) {
    const date = parseGermanDate(dateString);
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const month = months[date.getMonth()];
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month} ${day}, ${year}`;
}


/**
 * Returns the current time.
 * @returns {void} Nothing.
 */
function getCurrentTime() {
    let currentDate = new Date();
    let currentHour = currentDate.getHours();
    setCurrentTime(currentHour);
}


/**
 * Sets the current time.
 *
 * @param {object} currentHour - The current hour.
 * @returns {void} Nothing.
 */
function setCurrentTime(currentHour) {
    let greetings = document.getElementById('greetings');
    const greetingText =
        currentHour < 7  ? setGoodNight() :
        currentHour < 12 ? setGoodMorning() :
        currentHour < 18 ? setGoodAfternoon() :
        setGoodEvening();
    greetings.innerHTML = summaryIsGuestUser
        ? formatGuestGreeting(greetingText)
        : greetingText;
}