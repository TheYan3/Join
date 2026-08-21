// Navigation and header interactions shared across pages.

const ACTIVE_CLASS = "navBar__quicklink--active";
const NAV_ITEM_SELECTOR = ".navBar__quicklink, .legalInformation";
const DEFAULT_BASE_URL =
   "https://join-4bce1-default-rtdb.europe-west1.firebasedatabase.app/";
const GLOBAL_AUTH_USER_QUERY_KEY = "uid";

document.documentElement.classList.add("app-loading");

window.JOIN_CONFIG = window.JOIN_CONFIG || {};
window.JOIN_CONFIG.BASE_URL = window.JOIN_CONFIG.BASE_URL || DEFAULT_BASE_URL;

const UI_IDS = {
   navSummary: "nav-summary",
   navAddTask: "nav-add-task",
   navBoard: "nav-board",
   navContacts: "nav-contacts",
   navPrivacyPolicy: "nav-Privacy-Policy",
   navLegalNotice: "nav-Legal-Notice",
   help: "help",
   loginInitials: "login__initials",
   dropdownHelp: "dropdownHelp",
   dropdownPrivacyPolicy: "dropdownPrivacyPolicy",
   dropdownLegalNotice: "dropdownLegalNotice",
   dropdownLog: "dropdownLog",
   arrowBack: "help__arrowBack",
};
const PAGE_FILES = {
   summary: "summary.html",
   addTask: "add-task.html",
   board: "board.html",
   contacts: "contacts.html",
   privacy: "privacy-Policy.html",
   legal: "legalnotice.html",
   help: "help.html",
};
const PROTECTED_PAGE_FILES = new Set([
   PAGE_FILES.summary,
   PAGE_FILES.addTask,
   PAGE_FILES.board,
   PAGE_FILES.contacts,
]);
const IS_IN_TEMPLATES = window.location.pathname.includes("/templates/");
const PAGE_BASE_PATH = IS_IN_TEMPLATES ? "./" : "./templates/";
/**
 * Returns the page path.
 *
 * @param {string} pageFile - The page file.
 * @returns {string} The page path.
 */
function getPagePath(pageFile) {
   return `${PAGE_BASE_PATH}${pageFile}`;
}
const NAV_LINKS = [
   ["navSummary", getPagePath(PAGE_FILES.summary), "navSummary"],
   ["navAddTask", getPagePath(PAGE_FILES.addTask), "navAddTask"],
   ["navBoard", getPagePath(PAGE_FILES.board), "navBoard"],
   ["navContacts", getPagePath(PAGE_FILES.contacts), "navContacts"],
   ["navPrivacyPolicy", getPagePath(PAGE_FILES.privacy), "navPrivacyPolicy"],
   ["navLegalNotice", getPagePath(PAGE_FILES.legal), "navLegalNotice"],
   ["help", getPagePath(PAGE_FILES.help), null],
   ["dropdownHelp", getPagePath(PAGE_FILES.help), null],
   ["dropdownPrivacyPolicy", getPagePath(PAGE_FILES.privacy), "navPrivacyPolicy"],
   ["dropdownLegalNotice", getPagePath(PAGE_FILES.legal), "navLegalNotice"],
];

/**
 * Returns the toast container.
 * @returns {HTMLDivElement} The toast container element.
 */
function getToastContainer() {
   let container = document.getElementById("app-toast-container");
   if (container) return container;
   container = document.createElement("div");
   container.id = "app-toast-container";
   container.className = "app-toast-container";
   container.setAttribute("aria-live", "polite");
   container.setAttribute("aria-atomic", "true");
   document.body.appendChild(container);
   return container;
}

/**
 * Shows the app toast.
 *
 * @param {string} message - The message.
 * @param {object} [options={}] - The options object. Defaults to {}.
 * @returns {HTMLDivElement} The app toast element.
 */
function showAppToast(message, options = {}) {
   const container = getToastContainer();
   const toast = document.createElement("div");
   const type = options.type || "success";
   toast.className = `app-toast app-toast--${type}`;
   toast.textContent = message;
   container.appendChild(toast);

   requestAnimationFrame(() => toast.classList.add("app-toast--visible"));

   const duration = Number(options.duration) > 0 ? Number(options.duration) : 1200;
   setTimeout(() => {
      toast.classList.remove("app-toast--visible");
      setTimeout(() => toast.remove(), 220);
   }, duration);

   return toast;
}

window.showAppToast = showAppToast;

/**
 * Returns the nav items.
 * @returns {NodeListOf<Element>} The nav items collection.
 */
function getNavItems() {
   return document.querySelectorAll(NAV_ITEM_SELECTOR);
}

/**
 * Sets the active nav.
 *
 * @param {HTMLElement|null} clickedItem - The clicked item.
 * @returns {void} Nothing.
 */
function setActiveNav(clickedItem) {
   clearActiveNav();
   if (clickedItem) clickedItem.classList.add(ACTIVE_CLASS);
}

/**
 * Clears the active nav.
 * @returns {void} Nothing.
 */
function clearActiveNav() {
   getNavItems().forEach((item) => item.classList.remove(ACTIVE_CLASS));
}

/**
 * Returns the UI elements.
 * @returns {object} The UI elements object.
 */
function getUiElements() {
   return Object.fromEntries(
      Object.entries(UI_IDS).map(([key, id]) => [key, document.getElementById(id)])
   );
}

/**
 * Binds the click.
 *
 * @param {HTMLElement|null} element - The element.
 * @param {*} handler - The handler.
 * @returns {void} Nothing.
 */
function bindClick(element, handler) {
   if (!element) return;
   element.addEventListener("click", handler);
}

/**
 * Binds the nav link.
 *
 * @param {HTMLElement|null} element - The element.
 * @param {string} targetPath - The target path.
 * @param {HTMLElement|null} activeItem - The active item.
 * @returns {void} Nothing.
 */
function bindNavLink(element, targetPath, activeItem) {
   bindClick(element, () => {
      if (activeItem) setActiveNav(activeItem);
      else clearActiveNav();
      location.href = withAuthUserQuery(targetPath);
   });
}

/**
 * Binds the navigation.
 *
 * @param {object} ui - The UI object.
 * @returns {void} Nothing.
 */
function bindNavigation(ui) {
   NAV_LINKS.forEach(([elementKey, path, activeKey]) =>
      bindNavLink(ui[elementKey], path, activeKey ? ui[activeKey] : null)
   );
}

/**
 * Binds the login toggle.
 *
 * @param {*} loginInitials - The login initials.
 * @returns {void} Nothing.
 */
function bindLoginToggle(loginInitials) {
   bindClick(loginInitials, () => {
      const dropdownMenu = document.getElementById("dropdownMenu");
      if (!dropdownMenu || !loginInitials) return;
      dropdownMenu.classList.toggle("header__dropdown--opened");
      loginInitials.classList.toggle("login__initials--opened");
   });
}

/**
 * Closes the dropdown on outside click.
 *
 * @param {Event} event - The event object that triggered the handler.
 * @param {*} loginInitials - The login initials.
 * @returns {void} Nothing.
 */
function closeDropdownOnOutsideClick(event, loginInitials) {
   const dropdownMenu = document.getElementById("dropdownMenu");
   if (!dropdownMenu || !loginInitials) return;
   if (!dropdownMenu.contains(event.target) && event.target !== loginInitials) {
      dropdownMenu.classList.remove("header__dropdown--opened");
      loginInitials.classList.remove("login__initials--opened");
   }
}

/**
 * Binds the window dropdown close.
 *
 * @param {*} loginInitials - The login initials.
 * @returns {void} Nothing.
 */
function bindWindowDropdownClose(loginInitials) {
   window.addEventListener("click", (event) =>
      closeDropdownOnOutsideClick(event, loginInitials)
   );
}

/**
 * Binds the back arrow.
 *
 * @param {HTMLElement|null} arrowBack - The arrow back.
 * @returns {void} Nothing.
 */
function bindBackArrow(arrowBack) {
   bindClick(arrowBack, () => window.history.back());
}

/**
 * Binds the summary card redirect.
 * @returns {void} Nothing.
 */
function bindSummaryCardRedirect() {
   document.addEventListener("click", (event) => {
      if (event.target.closest(".summary__card")) {
         location.href = withAuthUserQuery(getPagePath(PAGE_FILES.board));
      }
   });
}


/**
 * Returns the auth user ID from URL.
 * @returns {string} The auth user ID from URL.
 */
function getAuthUserIdFromUrl() {
   const params = new URLSearchParams(window.location.search);
   return String(params.get(GLOBAL_AUTH_USER_QUERY_KEY) || "").trim();
}

/**
 * Returns the auth source from URL.
 * @returns {string} The auth source from URL.
 */
function getAuthSourceFromUrl() {
   const params = new URLSearchParams(window.location.search);
   return String(params.get("from") || "").trim();
}


/**
 * Returns the current page file name.
 * @returns {string} The current page file name.
 */
function getCurrentPageFileName() {
   return String(window.location.pathname.split("/").pop() || "").toLowerCase();
}


/**
 * Checks whether the page is protected.
 * @returns {boolean} Whether the page is protected.
 */
function isProtectedPage() {
   return PROTECTED_PAGE_FILES.has(getCurrentPageFileName());
}


/**
 * Enforces the auth guard.
 * @returns {boolean} Whether the auth guard.
 */
function enforceAuthGuard() {
   if (!isProtectedPage()) return false;
   if (getAuthUserIdFromUrl()) return false;
   location.replace(getLoginEntryPath());
   return true;
}


/**
 * Builds the auth user query.
 *
 * @param {string} path - The path.
 * @returns {string} The auth user query.
 */
function withAuthUserQuery(path) {
   const userId = getAuthUserIdFromUrl();
   const authSource = getAuthSourceFromUrl();
   if (!userId && !authSource) return path;

   const url = new URL(path, window.location.href);
   if (userId) {
      url.searchParams.set(
         GLOBAL_AUTH_USER_QUERY_KEY,
         encodeURIComponent(userId)
      );
   }
   if (authSource) url.searchParams.set("from", authSource);

   return `${url.pathname}${url.search}`;
}


/**
 * Returns the login entry path.
 * @returns {string} The login entry path.
 */
function getLoginEntryPath() {
   return IS_IN_TEMPLATES ? "../login.html" : "./login.html";
}


/**
 * Returns the signup entry path.
 * @returns {string} The signup entry path.
 */
function getSignupEntryPath() {
   return IS_IN_TEMPLATES ? "./signup.html" : "./templates/signup.html";
}


/**
 * Binds the auth entry buttons.
 * @returns {void} Nothing.
 */
function bindAuthEntryButtons() {
   bindClick(document.getElementById("signup-button"), () => {
      location.href = getSignupEntryPath();
   });
   bindClick(document.getElementById("signup__arrowBack"), () => {
      location.href = getLoginEntryPath();
   });
}


/**
 * Binds the logout button.
 *
 * @param {HTMLElement|null} logoutButton - The logout button.
 * @returns {void} Nothing.
 */
function bindLogoutButton(logoutButton) {
   bindClick(logoutButton, () => {
      location.href = getLoginEntryPath();
   });
}


/**
 * Fetches the auth user from database.
 *
 * @param {string|number} userId - The user ID used for this operation.
 * @returns {Promise<object>} A promise that resolves to the auth user from database object.
 */
async function fetchAuthUserFromDatabase(userId) {
   const response = await fetch(
      `${window.JOIN_CONFIG.BASE_URL}users/${encodeURIComponent(userId)}.json`
   );
   if (!response.ok) throw new Error(`Failed loading user: HTTP ${response.status}`);
   return await response.json();
}


/**
 * Builds the initial from name.
 *
 * @param {string} name - The name.
 * @returns {string} The initial from name.
 */
function buildInitialFromName(name) {
   const trimmedName = String(name || "").trim();
   if (!trimmedName) return "";
   const parts = trimmedName.split(/\s+/).filter(Boolean);
   const firstInitial = parts[0].charAt(0).toUpperCase();
   const secondLetter = parts[0].charAt(1).toUpperCase();
   const lastInitial =
      parts.length > 1
         ? parts[parts.length - 1].charAt(0).toUpperCase()
         : secondLetter || firstInitial;
   return `${firstInitial}${lastInitial}`;
}


/**
 * Resolves the header initial.
 *
 * @param {object} user - The user object.
 * @returns {string} The header initial.
 */
function resolveHeaderInitial(user) {
   const storedInitial = String(user?.initial || "").trim().toUpperCase();
   if (storedInitial) return storedInitial;
   return buildInitialFromName(user?.name);
}


/**
 * Applies the header initials.
 * @returns {Promise<void>} A promise that resolves when the operation is complete.
 */
async function applyHeaderInitials() {
   const initialsElement = document.getElementById("login__initials");
   if (!initialsElement) return;
   const userId = getAuthUserIdFromUrl();
   if (!userId) return;
   try {
      const authUser = await fetchAuthUserFromDatabase(userId);
      window.JOIN_CURRENT_USER = {
         email: String(authUser?.email || "").trim(),
         name: String(authUser?.name || "").trim(),
      };
      const initial = resolveHeaderInitial(authUser);
      if (initial) initialsElement.textContent = initial;
   } catch (error) {
      console.error("Loading header initials failed:", error);
   }
}


/**
 * Returns the creator record for the signed-in user.
 *
 * Tasks created inside the app are always "intern"; tickets generated from
 * stakeholder e-mails are written by n8n with type "extern".
 * @returns {object} The creator object with email, name and type.
 */
function getInternalCreator() {
   const user = window.JOIN_CURRENT_USER || {};
   return {
      email: user.email || "",
      name: user.name || "",
      type: "intern",
   };
}

window.getInternalCreator = getInternalCreator;

/**
 * Initializes the global UI.
 * @returns {void} Nothing.
 */
function initGlobalUi() {
   try {
      if (enforceAuthGuard()) return;
      const ui = getUiElements();
      applyHeaderInitials();
      bindNavigation(ui);
      bindLoginToggle(ui.loginInitials);
      bindWindowDropdownClose(ui.loginInitials);
      bindBackArrow(ui.arrowBack);
      bindSummaryCardRedirect();
      bindAuthEntryButtons();
      bindLogoutButton(ui.dropdownLog);
   } finally {
      document.documentElement.classList.remove("app-loading");
   }
}

if (document.readyState === "loading") {
   document.addEventListener("DOMContentLoaded", initGlobalUi);
} else {
   initGlobalUi();
}
