"use strict";

{
   const AVATAR_COLORS = ["orange", "teal", "purple"];
   const BOARD_CARDS_ASSET_BASE_PATH = window.location.pathname.includes("/templates/")
      ? "../assets/"
      : "./assets/";

   /**
    * Returns the board cards asset path.
    *
    * @param {string} relativePath - The relative path.
    * @returns {string} The board cards asset path.
    */
   function boardCardsAssetPath(relativePath) {
      return `${BOARD_CARDS_ASSET_BASE_PATH}${relativePath}`;
   }

   /**
    * Returns both board search inputs.
    * @returns {Array<HTMLInputElement>} The available search inputs.
    */
   function getTaskSearchInputs() {
      return [document.getElementById("findTaskInput"), document.getElementById("findTaskInputMobile")].filter(Boolean);
   }

   /**
    * Syncs all board search inputs.
    *
    * @param {Array<HTMLInputElement>} searchInputs - The search inputs.
    * @param {HTMLInputElement} source - The changed input.
    * @param {string} value - The new value.
    * @returns {void} Nothing.
    */
   function syncSearchInputs(searchInputs, source, value) {
      searchInputs.forEach((input) => {
         if (input !== source) input.value = value;
      });
   }

   /**
    * Handles one board search input change.
    *
    * @param {Array<HTMLInputElement>} searchInputs - The search inputs.
    * @param {Event} event - The input event.
    * @returns {void} Nothing.
    */
   function handleSearchInput(searchInputs, event) {
      const value = event.target.value;
      syncSearchInputs(searchInputs, event.target, value);
      window.BoardCards.filterTasks(value);
   }

   /**
    * Binds one search input.
    *
    * @param {HTMLInputElement} searchInput - The search input.
    * @param {Array<HTMLInputElement>} searchInputs - The search inputs.
    * @returns {void} Nothing.
    */
   function bindSearchInput(searchInput, searchInputs) {
      searchInput.addEventListener("input", (event) => handleSearchInput(searchInputs, event));
   }

   /**
    * Sets up the task search.
    * @returns {void} Nothing.
    */
   function setupTaskSearch() {
      const searchInputs = getTaskSearchInputs();
      searchInputs.forEach((searchInput) => bindSearchInput(searchInput, searchInputs));
   }

   /**
    * Returns the priority icon.
    *
    * @param {string} priority - The priority.
    * @returns {string} The priority icon.
    */
   function getPriorityIcon(priority) {
      const icons = {
         urgent: boardCardsAssetPath("icons/desktop/Priority orange.svg"),
         medium: boardCardsAssetPath("icons/desktop/Priority gleich.svg"),
         low: boardCardsAssetPath("icons/desktop/Priority green.svg"),
      };
      return icons[priority] || icons.medium;
   }

   /**
    * Returns the priority label.
    *
    * @param {string} priority - The priority.
    * @returns {string} The priority label.
    */
   function getPriorityLabel(priority) {
      const labels = { urgent: "Urgent", medium: "Medium", low: "Low" };
      return labels[String(priority || "")] || "Medium";
   }

   /**
    * Returns the category label.
    *
    * @param {string} category - The category.
    * @returns {string} The category label.
    */
   function getCategoryLabel(category) {
      const categoryStr = String(category || "");
      const labels = { technical: "Technical Task", "user-story": "User Story" };
      return labels[categoryStr] || categoryStr;
   }

   /**
    * Returns the avatar display count.
    *
    * @param {number} totalAssignees - The total assignee count.
    * @returns {number} The avatar display count.
    */
   function getAvatarDisplayCount(totalAssignees) {
      const maxAvatars = Math.floor((172 - 32) / (32 - 8)) + 1;
      return totalAssignees > maxAvatars ? maxAvatars - 1 : totalAssignees;
   }

   /**
    * Returns one avatar color class.
    *
    * @param {number} index - The assignee index.
    * @returns {string} The avatar color class.
    */
   function getAvatarColor(index) {
      return AVATAR_COLORS[index % AVATAR_COLORS.length];
   }

   /**
    * Renders one task card avatar.
    *
    * @param {object} assignee - The assignee object.
    * @param {number} index - The assignee index.
    * @returns {string} The avatar HTML.
    */
   function renderSingleAvatar(assignee, index) {
      return typeof taskCardAvatarHTML === "function"
         ? taskCardAvatarHTML(getAvatarColor(index), assignee.initials || "?")
         : "";
   }

   /**
    * Renders the avatar overflow.
    *
    * @param {number} remaining - The hidden assignee count.
    * @returns {string} The avatar overflow HTML.
    */
   function renderAvatarOverflow(remaining) {
      return typeof taskCardAvatarOverflowHTML === "function" ? taskCardAvatarOverflowHTML(remaining) : "";
   }

   /**
    * Builds the avatars HTML.
    *
    * @param {object} taskData - The task data object.
    * @returns {string} The avatars HTML.
    */
   function buildAvatarsHTML(taskData) {
      const assignees = taskData.assigned || [];
      const displayCount = getAvatarDisplayCount(assignees.length);
      const avatarsHTML = assignees.slice(0, displayCount).map(renderSingleAvatar).join("");
      const remaining = assignees.length - displayCount;
      if (assignees.length === 0) return "";
      return remaining > 0 ? avatarsHTML + renderAvatarOverflow(remaining) : avatarsHTML;
   }

   /**
    * Returns the subtask stats.
    *
    * @param {Array<object>} subtasks - The subtasks list.
    * @returns {object} The subtask stats object.
    */
   function getSubtaskStats(subtasks) {
      const total = subtasks?.length || 0;
      const completed = (subtasks || []).filter((item) => item.completed).length;
      const progress = total ? (completed / total) * 100 : 0;
      return { total, completed, progress };
   }

   /**
    * Builds the subtasks HTML.
    *
    * @param {Array<object>} subtasks - The subtasks list.
    * @returns {string} The subtasks HTML.
    */
   function buildSubtasksHTML(subtasks) {
      const { total, completed, progress } = getSubtaskStats(subtasks);
      if (typeof taskCardSubtasksHTML !== "function" || total === 0) return "";
      return taskCardSubtasksHTML(completed, total, progress);
   }

   /**
    * Returns the task card render data.
    *
    * @param {object} taskData - The task data object.
    * @returns {object} The task card render data object.
    */
   function getTaskCardRenderData(taskData) {
      return {
         categoryClass: taskData.category === "technical" ? "task-card__label--teal" : "",
         categoryLabel: getCategoryLabel(taskData.category),
         priorityIconSrc: getPriorityIcon(taskData.priority),
         avatarsHTML: buildAvatarsHTML(taskData),
         subtasksHTML: buildSubtasksHTML(taskData.subtasks),
      };
   }

   /**
    * Returns the task card template function.
    * @returns {Function|null} The task card template function.
    */
   function getTaskCardTemplate() {
      if (typeof taskCardHTML === "function") return taskCardHTML;
      return typeof taskCardFallbackHTML === "function" ? taskCardFallbackHTML : null;
   }

   /**
    * Returns the task card template arguments.
    *
    * @param {object} taskData - The task data object.
    * @param {object} viewData - The prepared view data.
    * @returns {Array<*>} The task card template arguments.
    */
   function getTaskCardTemplateArgs(taskData, viewData) {
      return [viewData.categoryClass, viewData.categoryLabel, taskData.title, taskData.description, viewData.subtasksHTML, viewData.avatarsHTML, viewData.priorityIconSrc];
   }

   /**
    * Builds the task card HTML.
    *
    * @param {object} taskData - The task data object.
    * @param {object} viewData - The view data object.
    * @returns {string} The task card HTML.
    */
   function buildTaskCardHTML(taskData, viewData) {
      const template = getTaskCardTemplate();
      return template ? template(...getTaskCardTemplateArgs(taskData, viewData)) : "";
   }

   /**
    * Returns the board columns.
    * @returns {object} The board columns object.
    */
   function getBoardColumns() {
      return {
         triage: document.getElementById("TriageTask"),
         todo: document.getElementById("TodoTask"),
         "in-progress": document.getElementById("InProgressTask"),
         "await-feedback": document.getElementById("AwaitTask"),
         done: document.getElementById("DoneTask"),
      };
   }

   /**
    * Handles one add button click.
    *
    * @param {*} onAddClick - The add click handler.
    * @param {HTMLElement} button - The clicked button.
    * @returns {void} Nothing.
    */
   function handleColumnAddClick(onAddClick, button) {
      onAddClick(button.dataset.status || "todo");
   }

   /**
    * Sets up the column add buttons.
    *
    * @param {*} onAddClick - The add click handler.
    * @returns {void} Nothing.
    */
   function setupColumnAddButtons(onAddClick) {
      document.querySelectorAll(".board-column__add").forEach((button) => {
         button.addEventListener("click", () => handleColumnAddClick(onAddClick, button));
      });
   }

   /**
    * Handles a board grid click.
    *
    * @param {*} onCardClick - The card click handler.
    * @param {Event} event - The click event.
    * @returns {void} Nothing.
    */
   function handleTaskGridClick(onCardClick, event) {
      const card = event.target.closest(".task-card");
      if (event.target.closest(".task-card__move-button")) return;
      if (!card || window.BoardDnd?.isDragging?.()) return;
      onCardClick(card.dataset.taskId);
   }

   /**
    * Sets up the task card clicks.
    *
    * @param {*} onCardClick - The card click handler.
    * @returns {void} Nothing.
    */
   function setupTaskCardClicks(onCardClick) {
      const grid = document.querySelector(".board-task-grid");
      if (!grid || grid.dataset.cardClickInitialized === "true") return;
      grid.dataset.cardClickInitialized = "true";
      grid.addEventListener("click", (event) => handleTaskGridClick(onCardClick, event));
   }

   window.BoardCards = {
      boardCardsAssetPath,
      getBoardColumns,
      getTaskCardRenderData,
      buildTaskCardHTML,
      getCategoryLabel,
      getPriorityIcon,
      getPriorityLabel,
      setupColumnAddButtons,
      setupTaskCardClicks,
      setupTaskSearch,
   };
}
