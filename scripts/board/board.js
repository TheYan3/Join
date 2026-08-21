"use strict";

/**
 * Returns the add task dialog.
 * @returns {HTMLDialogElement|null} The add task dialog.
 */
function getAddTaskDialog() {
   return document.getElementById("addTaskDialog");
}

/**
 * Returns the task detail dialog.
 * @returns {HTMLDialogElement|null} The task detail dialog.
 */
function getTaskDetailDialog() {
   return document.getElementById("taskDetailDialog");
}

/**
 * Returns whether one dialog is open.
 *
 * @param {HTMLDialogElement|null} dialog - The dialog.
 * @returns {boolean} Whether the dialog is open.
 */
function isBoardDialogOpen(dialog) {
   return Boolean(dialog?.open);
}

/**
 * Updates the board dialog scroll lock.
 * @returns {void} Nothing.
 */
function updateBoardDialogScrollLock() {
   const shouldLockScroll = isBoardDialogOpen(getAddTaskDialog()) || isBoardDialogOpen(getTaskDetailDialog());
   document.documentElement.classList.toggle("board-dialog-open", shouldLockScroll);
   document.body.classList.toggle("board-dialog-open", shouldLockScroll);
}

/**
 * Sets the add task dialog mode.
 *
 * @param {boolean} isEditMode - Whether the dialog is in edit mode.
 * @returns {void} Nothing.
 */
function setAddTaskDialogMode(isEditMode) {
   const title = document.getElementById("addTaskDialogTitle");
   const buttonText = document.querySelector(".add-task__button-text");
   if (title) title.textContent = isEditMode ? "Edit Task" : "Add Task";
   if (buttonText) buttonText.textContent = isEditMode ? "Save changes" : "Create Task";
}

/**
 * Resets the add task dialog mode.
 * @returns {void} Nothing.
 */
function resetAddTaskDialogMode() {
   const dialog = getAddTaskDialog();
   if (!dialog) return;
   delete dialog.dataset.editTaskId;
   delete dialog.dataset.editTaskKey;
   delete dialog.dataset.editTaskCreator;
   setAddTaskDialogMode(false);
}

/**
 * Clears all fields in one container.
 *
 * @param {HTMLElement|null} container - The container.
 * @returns {void} Nothing.
 */
function clearContainerFields(container) {
   container.querySelectorAll("input, textarea, select").forEach((input) => {
      if (input.type === "checkbox" || input.type === "radio") input.checked = false;
      else {
         input.value = "";
         input.dispatchEvent(new Event("input", { bubbles: true }));
      }
   });
}

/**
 * Returns the add task dialog form container.
 *
 * @param {HTMLDialogElement} dialog - The add task dialog.
 * @returns {HTMLElement} The add task dialog form container.
 */
function getAddTaskDialogContainer(dialog) {
   return dialog.querySelector(".dialog_flex-instructions") || dialog;
}

/**
 * Runs one optional reset helper.
 *
 * @param {*} resetHandler - The optional reset handler.
 * @param {HTMLElement} container - The form container.
 * @returns {void} Nothing.
 */
function runOptionalReset(resetHandler, container) {
   if (typeof resetHandler === "function") resetHandler(container);
}

/**
 * Resets the add task dialog helpers.
 *
 * @param {HTMLElement} container - The form container.
 * @returns {void} Nothing.
 */
function resetAddTaskDialogHelpers(container) {
   [window.resetPriority, window.resetAssigned, window.resetCategory, window.clearSubtasks, window.resetValidation].forEach((resetHandler) => runOptionalReset(resetHandler, container));
}

/**
 * Clears the add task dialog form state.
 * @returns {void} Nothing.
 */
function clearAddTaskDialogForm() {
   const dialog = getAddTaskDialog();
   if (!dialog) return;
   const container = getAddTaskDialogContainer(dialog);
   if (typeof clearAllInputs === "function") clearAllInputs(container);
   else clearContainerFields(container);
   resetAddTaskDialogHelpers(container);
}

/**
 * Opens the dialog.
 *
 * @param {string} [status="triage"] - The target status. Defaults to the triage
 * backlog for the generic Add task button; column buttons pass their own status.
 * @returns {void} Nothing.
 */
function openDialog(status = "triage") {
   const dialog = getAddTaskDialog();
   if (!dialog) return;
   clearAddTaskDialogForm();
   dialog.dataset.taskStatus = status;
   resetAddTaskDialogMode();
   dialog.showModal();
   updateBoardDialogScrollLock();
}

/**
 * Closes the dialog.
 * @returns {void} Nothing.
 */
function closeDialog() {
   const dialog = getAddTaskDialog();
   if (!dialog) return;
   dialog.close();
   delete dialog.dataset.taskStatus;
   resetAddTaskDialogMode();
   updateBoardDialogScrollLock();
}

/**
 * Handles the board success message display state.
 * @returns {void} Nothing.
 */
function handleBoardSuccessMessage() {
   if (localStorage.getItem("showTaskSuccess") !== "true") return;
   const successIsEdit = localStorage.getItem("showTaskSuccessEdit") === "true";
   localStorage.removeItem("showTaskSuccess");
   localStorage.removeItem("showTaskSuccessEdit");
   if (typeof showSuccessMessage === "function") showSuccessMessage(successIsEdit);
}

/**
 * Opens the add dialog for one board status.
 *
 * @param {string} status - The board status.
 * @returns {void} Nothing.
 */
function handleBoardAddButtonClick(status) {
   openDialog(status);
}

/**
 * Opens the detail dialog for one task.
 *
 * @param {string|number} taskId - The task ID.
 * @returns {void} Nothing.
 */
function handleBoardTaskCardClick(taskId) {
   window.BoardTaskDetail.openTaskDetail(taskId);
}

/**
 * Renders the current board tasks.
 *
 * @param {Array<object>} tasks - The current tasks.
 * @returns {void} Nothing.
 */
function renderBoardTasks(tasks) {
   window.BoardCards.renderBoardFromTasks(tasks);
   window.BoardDnd.initializeDraggableCards();
   window.BoardDnd.setupDropZones();
   window.BoardCards.updatePlaceholders();
}

/**
 * Initializes the board.
 * @returns {Promise<void>} A promise that resolves when the board is initialized.
 */
async function initializeBoard() {
   renderBoardTasks(await window.BoardData.loadTasks());
   window.BoardCards.setupColumnAddButtons(handleBoardAddButtonClick);
   window.BoardCards.setupTaskSearch();
   window.BoardCards.setupTaskCardClicks(handleBoardTaskCardClick);
   window.BoardTaskDetail.setupTaskDetailInteractions();
   handleBoardSuccessMessage();
}

/**
 * Returns whether a backdrop click should close a dialog.
 *
 * @param {HTMLDialogElement|null} dialog - The dialog.
 * @param {Event} event - The click event.
 * @returns {boolean} Whether the backdrop click should close the dialog.
 */
function isDialogBackdropClick(dialog, event) {
   return Boolean(dialog && event.target === dialog);
}

/**
 * Handles board backdrop clicks.
 *
 * @param {Event} event - The click event.
 * @returns {void} Nothing.
 */
function handleBoardWindowClick(event) {
   if (isDialogBackdropClick(getAddTaskDialog(), event)) closeDialog();
   if (isDialogBackdropClick(getTaskDetailDialog(), event)) window.BoardTaskDetail.closeTaskDetailDialog();
}

/**
 * Binds scroll-lock updates to one dialog.
 *
 * @param {HTMLDialogElement|null} dialog - The dialog.
 * @returns {void} Nothing.
 */
function bindDialogScrollLock(dialog) {
   dialog?.addEventListener("close", updateBoardDialogScrollLock);
}

/**
 * Binds the board dialog close listeners.
 * @returns {void} Nothing.
 */
function initializeDialogScrollLockBindings() {
   bindDialogScrollLock(getAddTaskDialog());
   bindDialogScrollLock(getTaskDetailDialog());
}

document.addEventListener("DOMContentLoaded", initializeBoard);
document.addEventListener("DOMContentLoaded", initializeDialogScrollLockBindings);
window.addEventListener("click", handleBoardWindowClick);

window.getAddTaskDialog = getAddTaskDialog;
window.getTaskDetailDialog = getTaskDetailDialog;
window.updateBoardDialogScrollLock = updateBoardDialogScrollLock;
window.setAddTaskDialogMode = setAddTaskDialogMode;
window.resetAddTaskDialogMode = resetAddTaskDialogMode;
window.clearAddTaskDialogForm = clearAddTaskDialogForm;
window.openDialog = openDialog;
window.closeDialog = closeDialog;
