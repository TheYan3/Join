"use strict";

{
   const BOARD_STATUS_SEQUENCE = ["triage", "todo", "in-progress", "await-feedback", "done"];
   const BOARD_STATUS_LABELS = {
      triage: "Triage",
      todo: "To do",
      "in-progress": "In progress",
      "await-feedback": "Await feedback",
      done: "Done",
   };
   let activeMobileMoveMenu = null;

   /**
    * Returns the move status label.
    *
    * @param {string} status - The status.
    * @returns {string} The move status label.
    */
   function getMoveStatusLabel(status) {
      return BOARD_STATUS_LABELS[String(status || "")] || String(status || "");
   }

   /**
    * Returns the adjacent move targets.
    *
    * @param {string} status - The current status.
    * @returns {Array<string>} The adjacent move targets.
    */
   function getAdjacentMoveTargets(status) {
      const currentIndex = BOARD_STATUS_SEQUENCE.indexOf(String(status || ""));
      if (currentIndex === -1) return [];
      const targets = [];
      if (currentIndex > 0) targets.push(BOARD_STATUS_SEQUENCE[currentIndex - 1]);
      if (currentIndex < BOARD_STATUS_SEQUENCE.length - 1) targets.push(BOARD_STATUS_SEQUENCE[currentIndex + 1]);
      return targets;
   }

   /**
    * Stops menu click propagation.
    *
    * @param {Event} event - The click event.
    * @returns {void} Nothing.
    */
   function stopMenuPropagation(event) {
      event.stopPropagation();
   }

   /**
    * Closes the mobile move menu.
    * @returns {void} Nothing.
    */
   function closeMobileMoveMenu() {
      if (!activeMobileMoveMenu) return;
      activeMobileMoveMenu.classList.remove("board-mobile-move-menu--opened");
      activeMobileMoveMenu.innerHTML = "";
      activeMobileMoveMenu = null;
   }

   /**
    * Creates the mobile move menu host.
    * @returns {HTMLDivElement} The mobile move menu host.
    */
   function createMobileMoveMenuHost() {
      const menu = document.createElement("div");
      menu.id = "boardMobileMoveMenu";
      menu.className = "board-mobile-move-menu";
      menu.addEventListener("click", stopMenuPropagation);
      menu.addEventListener("click", handleMobileMoveMenuClick);
      return menu;
   }

   /**
    * Returns the mobile move menu.
    * @returns {HTMLDivElement} The mobile move menu.
    */
   function getMobileMoveMenu() {
      const existingMenu = document.getElementById("boardMobileMoveMenu");
      if (existingMenu) return existingMenu;
      const menu = createMobileMoveMenuHost();
      document.body.appendChild(menu);
      return menu;
   }

   /**
    * Positions the mobile move menu.
    *
    * @param {HTMLElement|null} menu - The menu.
    * @param {HTMLElement|null} button - The button.
    * @returns {void} Nothing.
    */
   function positionMobileMoveMenu(menu, button) {
      if (!menu || !button) return;
      const rect = button.getBoundingClientRect();
      const menuWidth = menu.offsetWidth || 160;
      const left = Math.min(Math.max(16, rect.right - menuWidth), window.innerWidth - menuWidth - 16);
      const top = Math.min(rect.bottom + 8, window.innerHeight - menu.offsetHeight - 16);
      menu.style.left = `${left}px`;
      menu.style.top = `${Math.max(16, top)}px`;
   }

   /**
    * Returns the active board search value.
    * @returns {string} The active board search value.
    */
   function getCurrentBoardSearchValue() {
      return document.getElementById("findTaskInput")?.value || document.getElementById("findTaskInputMobile")?.value || "";
   }

   /**
    * Reapplies the current board search filter.
    * @returns {void} Nothing.
    */
   function reapplyCurrentSearchFilter() {
      filterTasks(getCurrentBoardSearchValue());
   }

   /**
    * Handles the mobile move action.
    *
    * @param {string|number} taskId - The task ID.
    * @param {string} targetStatus - The target status.
    * @returns {Promise<void>} A promise that resolves when the move is complete.
    */
   async function handleMobileMoveAction(taskId, targetStatus) {
      if (!taskId || !targetStatus) return;
      try {
         await window.BoardData?.updateTaskStatus(taskId, targetStatus);
         window.BoardCards?.renderBoardFromTasks(window.BoardData?.getAllTasks?.() || []);
         reapplyCurrentSearchFilter();
         window.BoardCards?.updatePlaceholders?.();
      } catch (error) {
         console.error("Mobile move action failed:", error);
      } finally {
         closeMobileMoveMenu();
      }
   }

   /**
    * Handles clicks inside the mobile move menu.
    *
    * @param {Event} event - The click event.
    * @returns {void} Nothing.
    */
   function handleMobileMoveMenuClick(event) {
      const button = event.target.closest(".board-mobile-move-menu__button");
      const menu = event.currentTarget;
      if (!button) return;
      handleMobileMoveAction(menu.dataset.taskId, button.dataset.targetStatus);
   }

   /**
    * Builds the mobile move menu item HTML.
    *
    * @param {string} status - The target status.
    * @returns {string} The mobile move menu item HTML.
    */
   function buildMobileMoveMenuItemHTML(status) {
      return typeof boardMobileMoveMenuItemHTML === "function"
         ? boardMobileMoveMenuItemHTML(status, getMoveStatusLabel(status))
         : "";
   }

   /**
    * Builds the mobile move menu HTML.
    *
    * @param {Array<string>} targets - The move targets.
    * @returns {string} The mobile move menu HTML.
    */
   function buildMobileMoveMenuHTML(targets) {
      const itemsHTML = targets.map(buildMobileMoveMenuItemHTML).join("");
      return typeof boardMobileMoveMenuHTML === "function" ? boardMobileMoveMenuHTML(itemsHTML) : itemsHTML;
   }

   /**
    * Fills the mobile move menu.
    *
    * @param {HTMLDivElement} menu - The menu host.
    * @param {string|number} taskId - The task ID.
    * @param {Array<string>} targets - The move targets.
    * @returns {void} Nothing.
    */
   function fillMobileMoveMenu(menu, taskId, targets) {
      menu.dataset.taskId = String(taskId);
      menu.innerHTML = buildMobileMoveMenuHTML(targets);
   }

   /**
    * Checks whether the active menu should toggle closed.
    *
    * @param {HTMLDivElement} menu - The menu host.
    * @param {string|number} taskId - The task ID.
    * @returns {boolean} Whether the menu should close.
    */
   function shouldToggleCurrentMobileMoveMenu(menu, taskId) {
      return activeMobileMoveMenu === menu && menu.dataset.taskId === String(taskId);
   }

   /**
    * Shows the mobile move menu.
    *
    * @param {HTMLDivElement} menu - The menu host.
    * @param {HTMLElement} button - The trigger button.
    * @returns {void} Nothing.
    */
   function showMobileMoveMenu(menu, button) {
      menu.classList.add("board-mobile-move-menu--opened");
      activeMobileMoveMenu = menu;
      positionMobileMoveMenu(menu, button);
   }

   /**
    * Opens the mobile move menu.
    *
    * @param {object} taskData - The task data object.
    * @param {HTMLElement} button - The trigger button.
    * @returns {void} Nothing.
    */
   function openMobileMoveMenu(taskData, button) {
      const targets = getAdjacentMoveTargets(taskData?.status);
      if (!taskData || !button || targets.length === 0) return;
      const menu = getMobileMoveMenu();
      if (shouldToggleCurrentMobileMoveMenu(menu, taskData.id)) return closeMobileMoveMenu();
      fillMobileMoveMenu(menu, taskData.id, targets);
      showMobileMoveMenu(menu, button);
   }

   /**
    * Configures one task card move button.
    *
    * @param {HTMLButtonElement} button - The move button.
    * @returns {void} Nothing.
    */
   function configureTaskCardMoveButton(button) {
      button.type = "button";
      button.className = "task-card__move-button";
      button.setAttribute("aria-label", "Move task");
      button.innerHTML = typeof taskCardMoveButtonIconHTML === "function"
         ? taskCardMoveButtonIconHTML(window.BoardCards.boardCardsAssetPath("icons/desktop/swap_horiz.svg"))
         : "";
   }

   /**
    * Handles one task card move button click.
    *
    * @param {object} taskData - The task data object.
    * @param {HTMLButtonElement} button - The move button.
    * @param {Event} event - The click event.
    * @returns {void} Nothing.
    */
   function handleTaskCardMoveClick(taskData, button, event) {
      event.stopPropagation();
      openMobileMoveMenu(window.BoardData?.getTask?.(taskData.id) || taskData, button);
   }

   /**
    * Creates the task card mobile move button.
    *
    * @param {object} taskData - The task data object.
    * @returns {HTMLButtonElement} The task card move button.
    */
   function createTaskCardMoveButton(taskData) {
      const button = document.createElement("button");
      configureTaskCardMoveButton(button);
      button.addEventListener("click", (event) => handleTaskCardMoveClick(taskData, button, event));
      return button;
   }

   /**
    * Initializes the mobile move menu interactions.
    * @returns {void} Nothing.
    */
   function initializeMobileMoveMenuInteractions() {
      if (document.body.dataset.boardMobileMoveInitialized === "true") return;
      document.body.dataset.boardMobileMoveInitialized = "true";
      document.addEventListener("click", closeMobileMoveMenu);
      window.addEventListener("resize", closeMobileMoveMenu);
      window.addEventListener("scroll", closeMobileMoveMenu, true);
   }

   /**
    * Sets the card visibility.
    *
    * @param {HTMLElement} card - The task card.
    * @param {boolean} shouldShow - Whether the card should stay visible.
    * @returns {void} Nothing.
    */
   function setCardVisibility(card, shouldShow) {
      card.style.display = shouldShow ? "" : "none";
   }

   /**
    * Returns the normalized card search text.
    *
    * @param {HTMLElement} card - The task card.
    * @returns {string} The normalized card search text.
    */
   function getCardSearchText(card) {
      const fallbackTitle = card.querySelector(".task-card__title")?.textContent || "";
      const fallbackDescription = card.querySelector(".task-card__description")?.textContent || "";
      return String(card.dataset.searchText || `${fallbackTitle} ${fallbackDescription}`).toLowerCase();
   }

   /**
    * Checks whether the card matches the search term.
    *
    * @param {HTMLElement} card - The task card.
    * @param {string} lowerSearchTerm - The normalized search term.
    * @returns {boolean} Whether the card matches the search term.
    */
   function cardMatchesSearch(card, lowerSearchTerm) {
      return getCardSearchText(card).includes(lowerSearchTerm);
   }

   /**
    * Shows all task cards.
    *
    * @param {NodeListOf<HTMLElement>} allCards - The task cards.
    * @returns {void} Nothing.
    */
   function showAllTaskCards(allCards) {
      allCards.forEach((card) => setCardVisibility(card, true));
   }

   /**
    * Applies the search filter to all cards.
    *
    * @param {NodeListOf<HTMLElement>} allCards - The task cards.
    * @param {string} lowerSearchTerm - The normalized search term.
    * @returns {void} Nothing.
    */
   function applySearchFilter(allCards, lowerSearchTerm) {
      allCards.forEach((card) => setCardVisibility(card, cardMatchesSearch(card, lowerSearchTerm)));
   }

   /**
    * Filters the tasks.
    *
    * @param {*} searchTerm - The search term.
    * @returns {void} Nothing.
    */
   function filterTasks(searchTerm) {
      const allCards = document.querySelectorAll(".task-card");
      const lowerSearchTerm = String(searchTerm || "").toLowerCase().trim();
      if (lowerSearchTerm === "") showAllTaskCards(allCards);
      else applySearchFilter(allCards, lowerSearchTerm);
      updatePlaceholders();
   }

   /**
    * Inserts one placeholder into a task directory.
    *
    * @param {HTMLElement} taskDirectory - The task directory.
    * @returns {void} Nothing.
    */
   function insertPlaceholder(taskDirectory) {
      if (typeof boardPlaceholderHTML === "function") taskDirectory.insertAdjacentHTML("afterbegin", boardPlaceholderHTML());
   }

   /**
    * Ensures the placeholder exists.
    *
    * @param {HTMLElement} column - The board column.
    * @returns {HTMLDivElement|null} The placeholder element.
    */
   function ensurePlaceholderExists(column) {
      const taskDirectory = column.querySelector(".board-task-directory");
      if (!taskDirectory) return null;
      if (!taskDirectory.querySelector(".board-task-placeholder")) insertPlaceholder(taskDirectory);
      return taskDirectory.querySelector(".board-task-placeholder");
   }

   /**
    * Returns the visible task cards in one directory.
    *
    * @param {HTMLElement} taskDirectory - The task directory.
    * @returns {Array<HTMLElement>} The visible task cards.
    */
   function getVisibleTaskCards(taskDirectory) {
      return Array.from(taskDirectory.querySelectorAll(".task-card")).filter((card) => card.style.display !== "none");
   }

   /**
    * Toggles one placeholder.
    *
    * @param {HTMLElement|null} placeholder - The placeholder.
    * @param {boolean} shouldShow - Whether the placeholder should show.
    * @returns {void} Nothing.
    */
   function togglePlaceholder(placeholder, shouldShow) {
      if (placeholder) placeholder.style.display = shouldShow ? "" : "none";
   }

   /**
    * Processes one column placeholder.
    *
    * @param {HTMLElement} column - The board column.
    * @returns {void} Nothing.
    */
   function processColumnPlaceholder(column) {
      const taskDirectory = column.querySelector(".board-task-directory");
      if (!taskDirectory) return;
      const hasVisibleCards = getVisibleTaskCards(taskDirectory).length > 0;
      const placeholder = hasVisibleCards ? taskDirectory.querySelector(".board-task-placeholder") : ensurePlaceholderExists(column);
      togglePlaceholder(placeholder, !hasVisibleCards);
   }

   /**
    * Updates the placeholders.
    * @returns {void} Nothing.
    */
   function updatePlaceholders() {
      document.querySelectorAll(".board-task-column").forEach(processColumnPlaceholder);
   }

   /**
    * Returns the normalized task search text.
    *
    * @param {object} taskData - The task data object.
    * @returns {string} The normalized task search text.
    */
   function buildTaskSearchText(taskData) {
      return `${String(taskData.title || "")} ${String(taskData.description || "")}`.toLowerCase().trim();
   }

   /**
    * Sets the task card base data.
    *
    * @param {HTMLElement} card - The task card.
    * @param {object} taskData - The task data object.
    * @returns {void} Nothing.
    */
   function setTaskCardData(card, taskData) {
      card.className = "task-card";
      card.dataset.taskId = taskData.id;
      card.dataset.searchText = buildTaskSearchText(taskData);
   }

   /**
    * Fills the task card content.
    *
    * @param {HTMLElement} card - The task card.
    * @param {object} taskData - The task data object.
    * @returns {void} Nothing.
    */
   function fillTaskCardContent(card, taskData) {
      const viewData = window.BoardCards.getTaskCardRenderData(taskData);
      card.innerHTML = window.BoardCards.buildTaskCardHTML(taskData, viewData);
      card.appendChild(createTaskCardMoveButton(taskData));
   }

   /**
    * Enables drag and drop for one task card.
    *
    * @param {HTMLElement} card - The task card.
    * @returns {void} Nothing.
    */
   function initializeTaskCardDrag(card) {
      if (window.BoardDnd?.makeCardDraggable) window.BoardDnd.makeCardDraggable(card);
   }

   /**
    * Creates the task card.
    *
    * @param {object} taskData - The task data object.
    * @returns {HTMLElement} The task card element.
    */
   function createTaskCard(taskData) {
      const card = document.createElement("article");
      setTaskCardData(card, taskData);
      fillTaskCardContent(card, taskData);
      initializeTaskCardDrag(card);
      return card;
   }

   /**
    * Returns the normalized task data.
    *
    * @param {object} taskData - The task data object.
    * @returns {object} The normalized task data.
    */
   function normalizeTaskData(taskData) {
      const category = typeof taskData.category === "string" ? taskData.category : String(taskData.category || "");
      return { ...taskData, category };
   }

   /**
    * Adds the task to one column.
    *
    * @param {object} taskData - The task data object.
    * @param {object} columns - The board columns.
    * @returns {void} Nothing.
    */
   function addTaskToColumn(taskData, columns) {
      const normalizedTask = normalizeTaskData(taskData);
      const taskDirectory = columns[normalizedTask.status];
      if (!taskDirectory) return;
      taskDirectory.querySelector(".board-task-placeholder")?.remove();
      taskDirectory.appendChild(createTaskCard(normalizedTask));
   }

   /**
    * Clears the board task cards.
    * @returns {void} Nothing.
    */
   function clearBoardTaskCards() {
      document.querySelectorAll(".board-task-directory .task-card").forEach((card) => card.remove());
   }

   /**
    * Renders the board from tasks.
    *
    * @param {Array<object>} tasks - The tasks list.
    * @returns {void} Nothing.
    */
   function renderBoardFromTasks(tasks) {
      const columns = window.BoardCards.getBoardColumns();
      clearBoardTaskCards();
      tasks.forEach((taskData) => addTaskToColumn({ ...taskData, status: taskData.status || "triage" }, columns));
      updatePlaceholders();
   }

   document.addEventListener("DOMContentLoaded", initializeMobileMoveMenuInteractions);

   Object.assign(window.BoardCards, {
      clearBoardTaskCards,
      filterTasks,
      renderBoardFromTasks,
      updatePlaceholders,
   });
}
