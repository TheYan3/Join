// ===== ASSIGNED SELECT =====

// ASSIGNED SELECT: Konstanten + konsolidierter DOM-Getter
const ASSIGNED_SELECTED_CLASS = "add-task__select-option--selected";
const ASSIGNED_OPEN_CLASS = "add-task__select--open";
const ASSIGNED_PLACEHOLDER_TEXT = "Select contacts to assign";
const ASSIGNED_ASSET_BASE_PATH = window.location.pathname.includes("/templates/")
   ? "../assets/"
   : "./assets/";
const ASSIGNED_CONTACTS_BASE_URL =
   window.JOIN_CONFIG.BASE_URL;

/**
 * Returns the assigned asset path.
 *
 * @param {string} relativePath - The relative path.
 * @returns {string} The assigned asset path.
 */
function assignedAssetPath(relativePath) {
   return `${ASSIGNED_ASSET_BASE_PATH}${relativePath}`;
}


/**
 * Returns the initials from name.
 *
 * @param {string} name - The name.
 * @returns {string} The initials from name.
 */
function getInitialsFromName(name) {
   const parts = String(name || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);
   if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
   }
   if (parts[0]) return parts[0].slice(0, 2).toUpperCase();
   return "??";
}


/**
 * Returns the assigned contact entries.
 *
 * @param {object} data - The data object.
 * @returns {Array<Array<*>>} The assigned contact entries.
 */
function getAssignedContactEntries(data) {
   if (!data) return [];
   return Array.isArray(data)
      ? data.map((contact, index) => [String(index), contact])
      : Object.entries(data);
}


/**
 * Checks whether the assigned contact entry is valid.
 *
 * @param {Array<*>} entry - The assigned contact entry.
 * @returns {boolean} Whether the assigned contact entry is valid.
 */
function isValidAssignedContactEntry(entry) {
   const [, contact] = entry;
   return Boolean(contact && typeof contact === "object");
}


/**
 * Maps one assigned contact entry.
 *
 * @param {Array<*>} entry - The assigned contact entry.
 * @returns {object} The mapped assigned contact.
 */
function mapAssignedContactEntry(entry) {
   const [key, contact] = entry;
   const resolvedName = String(contact.name || "").trim();
   return {
      id: contact.id ?? key,
      name: resolvedName,
      initials: getInitialsFromName(resolvedName),
      color: String(contact.color || "").trim(),
   };
}


/**
 * Sorts the assigned contacts.
 *
 * @param {Array<object>} contacts - The assigned contacts.
 * @returns {Array<object>} The sorted assigned contacts.
 */
function sortAssignedContacts(contacts) {
   return contacts.filter((contact) => contact.name !== "").sort((a, b) => a.name.localeCompare(b.name));
}


/**
 * Normalizes the assigned contacts.
 *
 * @param {object} data - The data object.
 * @returns {object} The assigned contacts object.
 */
function normalizeAssignedContacts(data) {
   return sortAssignedContacts(getAssignedContactEntries(data).filter(isValidAssignedContactEntry).map(mapAssignedContactEntry));
}


/**
 * Loads the assigned contacts from Firebase.
 * @returns {Promise<Array<object>>} A promise that resolves to the assigned contacts from Firebase list.
 */
async function loadAssignedContactsFromFirebase() {
   const response = await fetch(`${ASSIGNED_CONTACTS_BASE_URL}contacts.json`, {
      signal: window.JOIN_CONFIG.pageAbortSignal,
   });
   if (!response.ok) {
      throw new Error(`Assigned contacts load failed: HTTP ${response.status}`);
   }
   const data = await response.json();
   return normalizeAssignedContacts(data);
}


/**
 * Returns the assigned elements.
 * @returns {object|null} The assigned elements object, or null when it is not available.
 */
function getAssignedElements() {
   const select = document.getElementById("addTaskAssigned");
   if (!select) return null;
   const menu = document.getElementById("addTaskAssignedMenu"), input = document.getElementById("addTaskAssignedInput"), label = select.querySelector(".add-task__select-value"), initials = document.getElementById("addTaskAssignedInitials"), selectionGroup = select.closest(".add-task__information-group--selection");
   if (!menu || !input || !label) return null;
   return { select, menu, input, label, initials, group: selectionGroup };
}


/**
 * Returns the search input.
 *
 * @param {HTMLElement|null} select - The select.
 * @returns {*} The search input result.
 */
function getSearchInput(select) {
   return select.querySelector(".add-task__select-input");
}


/**
 * Prevents the search deletion.
 *
 * @param {Event} event - The event object that triggered the handler.
 * @param {HTMLInputElement|null} searchInput - The search input.
 * @returns {void} Nothing.
 */
function preventSearchDeletion(event, searchInput) {
   const cursorPosition = searchInput.selectionStart;
   if (event.key === "Backspace" && cursorPosition <= 4) {
      event.preventDefault();
   }
   if (event.key === "Delete" && cursorPosition < 4) {
      event.preventDefault();
   }
}


/**
 * Ensures the search prefix.
 *
 * @param {HTMLInputElement|null} searchInput - The search input.
 * @returns {void} Nothing.
 */
function ensureSearchPrefix(searchInput) {
   if (!searchInput.value.startsWith("To: ")) {
      const searchText = searchInput.value.replace(/^To: /, "");
      searchInput.value = "To: " + searchText;
      const cursorPos = 4 + searchText.length;
      searchInput.setSelectionRange(cursorPos, cursorPos);
   }
}


/**
 * Returns the search text.
 *
 * @param {HTMLInputElement|null} searchInput - The search input.
 * @returns {string} The search text.
 */
function getSearchText(searchInput) {
   return searchInput.value.substring(4).toLowerCase().trim();
}


/**
 * Sets up the search listeners.
 *
 * @param {HTMLInputElement|null} searchInput - The search input.
 * @param {HTMLElement|null} menu - The menu.
 * @returns {void} Nothing.
 */
function setupSearchListeners(searchInput, menu) {
   if (searchInput.dataset.listenersInitialized === "true") return;
   searchInput.dataset.listenersInitialized = "true";
   searchInput.addEventListener("keydown", (event) => handleSearchKeydown(event, searchInput));
   searchInput.addEventListener("input", (event) => handleSearchInput(event, searchInput, menu));
}


/**
 * Returns the container width.
 *
 * @param {HTMLElement|null} container - The container.
 * @returns {number} The container width value.
 */
function getContainerWidth(container) {
   return container.offsetWidth;
}


/**
 * Calculates the max initials.
 *
 * @param {number} containerWidth - The container width.
 * @returns {*} The max initials result.
 */
function calculateMaxInitials(containerWidth) {
   const initialWidth = 50; // 42px + 8px gap
   const totalSlots = Math.floor(containerWidth / initialWidth);
   return totalSlots;
}


/**
 * Returns the max display count.
 *
 * @param {number} selectedCount - The selected count.
 * @param {number} maxSlots - The max slots.
 * @returns {number} The max display count value.
 */
function getMaxDisplayCount(selectedCount, maxSlots) {
   if (shouldShowOverflow(selectedCount, maxSlots)) {
      return maxSlots - 1;
   }
   return maxSlots;
}


/**
 * Returns the selected options.
 *
 * @param {HTMLElement|null} menu - The menu.
 * @returns {string} The selected options.
 */
function getSelectedOptions(menu) {
   return menu.querySelectorAll(`.${ASSIGNED_SELECTED_CLASS}`);
}


/**
 * Returns the select wrapper.
 *
 * @param {HTMLElement|null} select - The select.
 * @returns {*} The select wrapper result.
 */
function getSelectWrapper(select) {
   return select?.closest(".add-task__select-wrapper");
}


/**
 * Returns the initials parameters.
 *
 * @param {object} elements - The elements object.
 * @returns {object|null} The initials parameters object, or null when it is not available.
 */
function getInitialsParameters(elements) {
   if (!elements.initials) return null;
   const selectedOptions = getSelectedOptions(elements.menu);
   const menuOpen = isAssignedMenuOpen(elements);
   clearInitialsContainer(elements.initials);
   const containerWidth = getContainerWidth(elements.initials);
   const maxSlots = calculateMaxInitials(containerWidth);
   const maxDisplay = getMaxDisplayCount(selectedOptions.length, maxSlots);
   return { selectedOptions, menuOpen, maxDisplay };
}


/**
 * Sets up the select click listener.
 *
 * @param {object} elements - The elements object.
 * @returns {void} Nothing.
 */
function setupSelectClickListener(elements) {
   elements.select.addEventListener("click", (event) => {
      event.stopPropagation();
      const clickedInput = event.target.closest(".add-task__select-input");
      if (!clickedInput) toggleAssignedMenu(elements);
   });
}


/**
 * Sets up the menu click listener.
 *
 * @param {object} elements - The elements object.
 * @returns {void} Nothing.
 */
function setupMenuClickListener(elements) {
   elements.menu.addEventListener("click", (event) => {
      handleAssignedOptionClick(event, elements);
   });
}


/**
 * Sets up the search input listeners for assigned.
 *
 * @param {object} elements - The elements object.
 * @returns {void} Nothing.
 */
function setupSearchInputListenersForAssigned(elements) {
   const searchInput = getSearchInput(elements.select);
   if (!searchInput) return;
   searchInput.addEventListener("click", (e) => e.stopPropagation());
   searchInput.addEventListener("mousedown", (e) => e.stopPropagation());
   searchInput.addEventListener("focus", () => {
      if (!isAssignedMenuOpen(elements)) toggleAssignedMenu(elements);
   });
}


/**
 * Sets up the document close listener.
 *
 * @param {object} elements - The elements object.
 * @returns {void} Nothing.
 */
function setupDocumentCloseListener(elements) {
   document.addEventListener("click", (event) => {
      const clickedInput = event.target.closest(".add-task__select-input");
      if (clickedInput) return;
      closeAssignedMenu(elements);
   });
}


/**
 * Sets up the assigned listeners.
 *
 * @param {object} elements - The elements object.
 * @returns {void} Nothing.
 */
function setupAssignedListeners(elements) {
   if (!elements) return;
   setupSelectClickListener(elements);
   setupMenuClickListener(elements);
   setupSearchInputListenersForAssigned(elements);
   setupDocumentCloseListener(elements);
}


/**
 * Clears the assigned menu.
 *
 * @param {HTMLElement|null} menu - The menu.
 * @returns {void} Nothing.
 */
function clearAssignedMenu(menu) {
   menu.innerHTML = "";
}


/**
 * Loads the assigned contacts into the menu.
 *
 * @param {object} elements - The elements object.
 * @returns {Promise<void>} A promise that resolves when the contacts are loaded.
 */
async function loadAssignedContacts(elements) {
   try {
      renderAssignedContacts(elements.menu, await loadAssignedContactsFromFirebase());
   } catch (error) {
      if (error.name === "AbortError") return;
      console.error("Assigned contacts loading failed:", error);
      clearAssignedMenu(elements.menu);
   }
}


/**
 * Stores the current assigned input state.
 *
 * @param {object} elements - The elements object.
 * @returns {void} Nothing.
 */
function rememberAssignedInputState(elements) {
   if (!elements.input.value) return;
   elements.input.dataset.lastValue = elements.input.value;
   elements.label.dataset.lastLabel = elements.label.textContent;
}


/**
 * Initializes the assigned select state.
 *
 * @param {object} elements - The elements object.
 * @returns {void} Nothing.
 */
function initializeAssignedSelectState(elements) {
   elements.select.setAttribute("aria-expanded", "false");
   elements.label.dataset.placeholder = elements.label.textContent;
   rememberAssignedInputState(elements);
}


/**
 * Initializes the assigned select.
 * @returns {Promise<void>} A promise that resolves when the operation is complete.
 */
async function initAssignedSelect() {
   const elements = getAssignedElements();
   if (!elements) return;
   await loadAssignedContacts(elements);
   initializeAssignedSelectState(elements);
   setupAssignedListeners(elements);
}
