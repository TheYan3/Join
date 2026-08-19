const TEMPLATE_ASSET_BASE_PATH = window.location.pathname.includes("/templates/")
   ? "../assets/"
   : "./assets/";

/**
 * Returns the template asset path.
 *
 * @param {string} relativePath - The relative path.
 * @returns {string} The template asset path.
 */
function templateAssetPath(relativePath) {
    return `${TEMPLATE_ASSET_BASE_PATH}${relativePath}`;
}


/**
 * Escapes HTML special characters so user input can't inject markup.
 *
 * @param {*} value - The raw value.
 * @returns {string} The escaped text.
 */
function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
    })[char]);
}


/**
 * Sets the good morning.
 * @returns {string} The good morning.
 */
function setGoodMorning() {
    return `
        Good Morning,
    `;
}


/**
 * Sets the good afternoon.
 * @returns {string} The good afternoon.
 */
function setGoodAfternoon() {
    return `
        Good Afternoon,
    `;
}


/**
 * Sets the good evening.
 * @returns {string} The good evening.
 */
function setGoodEvening() {
    return `
        Good Evening,
    `;
}


/**
 * Sets the good night.
 * @returns {string} The good night.
 */
function setGoodNight() {
    return `
        Good Night,
    `;
}


/**
 * Creates the subtask HTML.
 *
 * @param {object} subtaskText - The subtask text object.
 * @returns {string} The subtask HTML.
 */
function createSubtaskHTML(subtaskText) {
   const pencilIcon = templateAssetPath("icons/desktop/subtask__pencil.svg");
   const trashIcon = templateAssetPath("icons/desktop/subtask__trash.svg");
   const checkIcon = templateAssetPath("icons/desktop/check.svg");
   return [
      `<span class="add-task__subtask-text">${subtaskText}</span>`,
      `<div class="add-task__subtask-item-actions"><button type="button" class="add-task__subtask-item-button add-task__subtask-item-button--edit" data-action="edit"><img src="${pencilIcon}" alt="" class="add-task__subtask-item-icon" /></button>`,
      `<button type="button" class="add-task__subtask-item-button add-task__subtask-item-button--delete-edit" data-action="delete-edit" style="display: none;"><img src="${trashIcon}" alt="" class="add-task__subtask-item-icon" /></button>`,
      `<span class="add-task__subtask-dividingline"></span><button type="button" class="add-task__subtask-item-button add-task__subtask-item-button--delete" data-action="delete"><img src="${trashIcon}" alt="" class="add-task__subtask-item-icon" /></button>`,
      `<button type="button" class="add-task__subtask-item-button add-task__subtask-item-button--check" data-action="check" style="display: none;"><img src="${checkIcon}" alt="" class="add-task__subtask-item-icon" /></button></div>`,
   ].join("");
}


/**
 * Creates the initial HTML.
 *
 * @param {string} initialsText - The initials text.
 * @param {string} [color="#ff7a00"] - The color. Defaults to "#ff7a00".
 * @returns {string} The initial HTML.
 */
function createInitialHTML(initialsText, color = "#ff7a00") {
    return `<span class="add-task__assigned-initial" style="background-color: ${color};">${initialsText}</span>`;
}


/**
 * Creates the overflow HTML.
 *
 * @param {number} remainingCount - The remaining count.
 * @returns {string} The overflow HTML.
 */
function createOverflowHTML(remainingCount) {
    return `<span class="add-task__assigned-overflow">+${remainingCount}</span>`;
}


/**
 * Returns the task card subtasks HTML.
 *
 * @param {Array<object>} completedSubtasks - The completed subtasks list.
 * @param {Array<object>} totalSubtasks - The total subtasks list.
 * @param {object} subtaskProgress - The subtask progress object.
 * @returns {string} The task card subtasks HTML.
 */
function taskCardSubtasksHTML(completedSubtasks, totalSubtasks, subtaskProgress) {
    return `
        <div class="task-card__progress">
            <div class="task-card__progress-track">
                <div class="task-card__progress-bar" style="width: ${subtaskProgress}%"></div>
            </div>
            <span class="task-card__progress-text">${completedSubtasks}/${totalSubtasks} Subtasks</span>
        </div>
    `;
}


/**
 * Returns the task card avatar HTML.
 *
 * @param {string} colorClass - The color class.
 * @param {string} initialsText - The initials text.
 * @returns {string} The task card avatar HTML.
 */
function taskCardAvatarHTML(colorClass, initialsText) {
   return `<span class="avatar avatar--${colorClass}">${initialsText}</span>`;
}


/**
 * Returns the task card avatar overflow HTML.
 *
 * @param {number} remainingCount - The remaining count.
 * @returns {string} The task card avatar overflow HTML.
 */
function taskCardAvatarOverflowHTML(remainingCount) {
    return `<span class="avatar avatar--overflow">+${remainingCount}</span>`;
}


/**
 * Returns the task card HTML.
 *
 * @param {string} categoryClass - The category class.
 * @param {HTMLElement|null} categoryLabel - The category label.
 * @param {string} title - The title.
 * @param {string} description - The description.
 * @param {Array<object>} subtasksHTML - The subtasks HTML list.
 * @param {HTMLElement|null} avatarsHTML - The avatars HTML.
 * @param {HTMLElement|null} priorityIconSrc - The priority icon src.
 * @returns {string} The task card HTML.
 */
function taskCardHTML(categoryClass, categoryLabel, title, description, subtasksHTML, avatarsHTML, priorityIconSrc) {
   return `
      <span class="task-card__label ${categoryClass}">${categoryLabel}</span>
      <h3 class="task-card__title">${escapeHtml(title)}</h3>
      <p class="task-card__description">${escapeHtml(description)}</p>
      ${subtasksHTML}
      <div class="task-card__meta">
         <div class="task-card__avatars">
            ${avatarsHTML}
         </div>
         <img class="task-card__priority" src="${priorityIconSrc}" alt="Priority" />
      </div>
   `;
}


/**
 * Returns the task card fallback HTML.
 *
 * @param {string} categoryClass - The category class.
 * @param {HTMLElement|null} categoryLabel - The category label.
 * @param {string} title - The title.
 * @param {string} description - The description.
 * @param {Array<object>} subtasksHTML - The subtasks HTML list.
 * @param {HTMLElement|null} avatarsHTML - The avatars HTML.
 * @param {HTMLElement|null} priorityIconSrc - The priority icon src.
 * @returns {string} The task card fallback HTML.
 */
function taskCardFallbackHTML(categoryClass, categoryLabel, title, description, subtasksHTML, avatarsHTML, priorityIconSrc) {
   return `<span class="task-card__label ${categoryClass}">${categoryLabel}</span><h3 class="task-card__title">${escapeHtml(title)}</h3><p class="task-card__description">${escapeHtml(description)}</p>${subtasksHTML}<div class="task-card__meta"><div class="task-card__avatars">${avatarsHTML}</div><img class="task-card__priority" src="${priorityIconSrc}" alt="Priority" /></div>`;
}


/**
 * Returns the board placeholder HTML.
 *
 * @param {string} [text="No tasks found"] - The placeholder text. Defaults to "No tasks found".
 * @returns {string} The board placeholder HTML.
 */
function boardPlaceholderHTML(text = "No tasks found") {
   return `<div class="board-task-placeholder">${text}</div>`;
}


/**
 * Returns the task card move button icon HTML.
 *
 * @param {string} iconSrc - The icon source.
 * @returns {string} The task card move button icon HTML.
 */
function taskCardMoveButtonIconHTML(iconSrc) {
   return `<img class="task-card__move-icon" src="${iconSrc}" alt="" />`;
}


/**
 * Returns the mobile move menu HTML.
 *
 * @param {string} itemsHTML - The list items HTML.
 * @returns {string} The mobile move menu HTML.
 */
function boardMobileMoveMenuHTML(itemsHTML) {
   return `<div class="board-mobile-move-menu__title">Move to</div><ul class="board-mobile-move-menu__list">${itemsHTML}</ul>`;
}


/**
 * Returns the mobile move menu item HTML.
 *
 * @param {string} status - The target status.
 * @param {string} label - The target label.
 * @returns {string} The mobile move menu item HTML.
 */
function boardMobileMoveMenuItemHTML(status, label) {
   return `<li class="board-mobile-move-menu__item"><button type="button" class="board-mobile-move-menu__button" data-target-status="${status}">${label}</button></li>`;
}


/**
 * Returns the task detail empty item HTML.
 *
 * @param {string} text - The empty text.
 * @returns {string} The task detail empty item HTML.
 */
function taskDetailEmptyItemHTML(text) {
   return `<span>${text}</span>`;
}


/**
 * Returns the task detail assigned item HTML.
 *
 * @param {string} colorClass - The avatar color class.
 * @param {string} initialsText - The initials text.
 * @param {string} name - The display name.
 * @returns {string} The task detail assigned item HTML.
 */
function taskDetailAssignedItemHTML(colorClass, initialsText, name) {
   return `<span class="avatar avatar--${colorClass}">${escapeHtml(initialsText)}</span><span class="task-detail__assigned-name">${escapeHtml(name)}</span>`;
}


/**
 * Returns the task detail subtask item HTML.
 *
 * @param {number} index - The subtask index.
 * @param {boolean} checked - Whether the subtask is checked.
 * @param {string} text - The subtask text.
 * @returns {string} The task detail subtask item HTML.
 */
function taskDetailSubtaskItemHTML(index, checked, text) {
   const checkedAttribute = checked ? " checked" : "";
   const textClass = checked ? " task-detail__subtask-text--done" : "";
   return `<input type="checkbox" class="task-detail__subtask-checkbox"${checkedAttribute} data-subtask-index="${index}"><span class="task-detail__subtask-text${textClass}">${escapeHtml(text)}</span>`;
}


/**
 * Returns the contact group header HTML.
 *
 * @param {string} letter - The first letter.
 * @returns {string} The contact group header HTML.
 */
function contactGroupHeaderHTML(letter) {
   return `<div class="group-header">${letter}</div><hr>`;
}


/**
 * Returns the contact list item HTML.
 *
 * @param {object} contact - The contact object.
 * @param {string} initials - The initials.
 * @param {string} activeClass - The active class.
 * @returns {string} The contact list item HTML.
 */
function contactListItemHTML(contact, initials, activeClass) {
   return `
      <div class="contact-item ${activeClass}" data-id="${contact.id}">
         <div class="initials" style="background:${contact.color}">${escapeHtml(initials)}</div>
         <div class="contact-info">
            <span class="name">${escapeHtml(contact.name)}</span>
            <span class="email">${escapeHtml(contact.email)}</span>
         </div>
      </div>
   `;
}


/**
 * Returns the contact group section HTML.
 *
 * @param {string} letter - The first letter.
 * @param {string} itemsHTML - The list items HTML.
 * @returns {string} The contact group section HTML.
 */
function contactGroupSectionHTML(letter, itemsHTML) {
   return `${contactGroupHeaderHTML(letter)}${itemsHTML}`;
}
