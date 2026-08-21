"use strict";

{
   const BOARD_DETAIL_FORM_ASSET_BASE_PATH = window.location.pathname.includes("/templates/")
      ? "../assets/"
      : "./assets/";

   /**
    * Returns the board detail form asset path.
    *
    * @param {string} relativePath - The relative path.
    * @returns {string} The board detail form asset path.
    */
   function boardDetailFormAssetPath(relativePath) {
      return `${BOARD_DETAIL_FORM_ASSET_BASE_PATH}${relativePath}`;
   }

   /**
    * Sets the priority in form.
    *
    * @param {string} priority - The priority.
    * @returns {void} Nothing.
    */
   function setPriorityInForm(priority) {
      const priorityField = document.getElementById("addTaskPriority");
      if (!priorityField) return;
      clearPriorityButtons(priorityField);
      getPriorityButton(priorityField, priority)?.classList.add("add-task__priority-option--active");
   }

   /**
    * Clears all priority buttons.
    *
    * @param {HTMLElement} priorityField - The priority field.
    * @returns {void} Nothing.
    */
   function clearPriorityButtons(priorityField) {
      priorityField.querySelectorAll(".add-task__priority-option").forEach((button) => button.classList.remove("add-task__priority-option--active"));
   }

   /**
    * Returns the matching priority button.
    *
    * @param {HTMLElement} priorityField - The priority field.
    * @param {string} priority - The priority.
    * @returns {HTMLElement|null} The matching priority button.
    */
   function getPriorityButton(priorityField, priority) {
      return priorityField.querySelector(`.add-task__priority-option--${priority || "medium"}`);
   }

   /**
    * Returns the matching category option.
    *
    * @param {string} category - The category.
    * @returns {HTMLElement|null} The matching category option.
    */
   function getCategoryOption(category) {
      return document.querySelector(`#addTaskCategoryMenu .add-task__select-option[data-value="${category}"]`);
   }

   /**
    * Updates the category label.
    *
    * @param {HTMLElement|null} label - The category label.
    * @param {HTMLElement|null} option - The matching category option.
    * @returns {void} Nothing.
    */
   function setCategoryLabel(label, option) {
      if (!label) return;
      label.textContent = option ? option.textContent.trim() : "Select task category";
      label.dataset.lastLabel = label.textContent;
   }

   /**
    * Stores the category input state.
    *
    * @param {HTMLInputElement} input - The hidden category input.
    * @returns {void} Nothing.
    */
   function syncCategoryInputState(input) {
      input.dataset.lastValue = input.value;
      input.dispatchEvent(new Event("input", { bubbles: true }));
   }

   /**
    * Sets the category in form.
    *
    * @param {string} category - The category.
    * @returns {void} Nothing.
    */
   function setCategoryInForm(category) {
      const input = document.getElementById("addTaskCategoryInput");
      const label = document.querySelector("#addTaskCategory .add-task__select-value");
      if (!input) return;
      input.value = category || "";
      setCategoryLabel(label, getCategoryOption(category));
      syncCategoryInputState(input);
   }

   /**
    * Returns the assigned lookup maps.
    *
    * @param {Array<object>} assigned - The assigned list.
    * @returns {object} The assigned lookup maps object.
    */
   function getAssignedLookupMaps(assigned) {
      return {
         values: new Set(assigned.map((person) => person.value)),
         names: new Set(assigned.map((person) => person.name)),
      };
   }

   /**
    * Returns whether one assigned option is selected.
    *
    * @param {HTMLElement} option - The assigned option.
    * @param {object} maps - The selected lookup maps.
    * @returns {boolean} Whether the option is selected.
    */
   function isAssignedOptionSelected(option, maps) {
      return maps.values.has(option.dataset.value || "") || maps.names.has(option.dataset.name || option.textContent.trim());
   }

   /**
    * Returns the assigned checkbox icon path.
    *
    * @param {boolean} isSelected - Whether the option is selected.
    * @returns {string} The assigned checkbox icon path.
    */
   function getAssignedCheckboxIcon(isSelected) {
      return isSelected
         ? boardDetailFormAssetPath("icons/desktop/checkBox--checked.svg")
         : boardDetailFormAssetPath("icons/desktop/checkBox.svg");
   }

   /**
    * Syncs one assigned option with lookup maps.
    *
    * @param {HTMLElement} option - The assigned option.
    * @param {object} maps - The selected lookup maps.
    * @returns {void} Nothing.
    */
   function syncAssignedOption(option, maps) {
      const checkbox = option.querySelector(".add-task__option-checkbox");
      const isSelected = isAssignedOptionSelected(option, maps);
      option.classList.toggle(ASSIGNED_SELECTED_CLASS, isSelected);
      if (checkbox) checkbox.src = getAssignedCheckboxIcon(isSelected);
   }

   /**
    * Synchronizes the assigned options.
    *
    * @param {object} maps - The selected lookup maps.
    * @returns {void} Nothing.
    */
   function syncAssignedOptions(maps) {
      document.querySelectorAll("#addTaskAssignedMenu .add-task__select-option--assigned").forEach((option) => syncAssignedOption(option, maps));
   }

   /**
    * Synchronizes the assigned input state.
    *
    * @param {number} assignedCount - The assigned count.
    * @returns {void} Nothing.
    */
   function syncAssignedInputState(assignedCount) {
      const input = document.getElementById("addTaskAssignedInput");
      if (!input) return;
      input.value = assignedCount > 0 ? "assigned" : "";
      input.dispatchEvent(new Event("input", { bubbles: true }));
   }

   /**
    * Refreshes the assigned initials.
    * @returns {void} Nothing.
    */
   function refreshAssignedInitials() {
      if (typeof getAssignedElements !== "function" || typeof updateContactInitials !== "function") return;
      const elements = getAssignedElements();
      if (elements) updateContactInitials(elements);
   }

   /**
    * Sets the assigned in form.
    *
    * @param {Array<object>} assigned - The assigned list.
    * @returns {void} Nothing.
    */
   function setAssignedInForm(assigned) {
      const assignedList = assigned || [];
      syncAssignedOptions(getAssignedLookupMaps(assignedList));
      syncAssignedInputState(assignedList.length);
      refreshAssignedInitials();
   }

   /**
    * Clears the subtask list.
    *
    * @param {HTMLElement} list - The subtask list.
    * @returns {void} Nothing.
    */
   function clearSubtaskList(list) {
      list.innerHTML = "";
   }

   /**
    * Creates one editable subtask item.
    *
    * @param {object} subtask - The subtask object.
    * @returns {HTMLElement|null} The editable subtask item.
    */
   function createEditableSubtaskItem(subtask) {
      if (typeof createSubtaskItem !== "function") return null;
      const item = createSubtaskItem(subtask.text || "");
      item.dataset.completed = subtask.completed ? "true" : "false";
      return item;
   }

   /**
    * Appends one editable subtask item.
    *
    * @param {HTMLElement} list - The subtask list.
    * @param {object} subtask - The subtask object.
    * @returns {void} Nothing.
    */
   function appendEditableSubtaskItem(list, subtask) {
      const item = createEditableSubtaskItem(subtask);
      if (!item) return;
      list.prepend(item);
      if (typeof setupSubtaskListeners === "function") setupSubtaskListeners(item);
   }

   /**
    * Sets the subtasks in form.
    *
    * @param {Array<object>} subtasks - The subtasks list.
    * @returns {void} Nothing.
    */
   function setSubtasksInForm(subtasks) {
      const list = document.querySelector(".add-task__subtask-list");
      if (!list) return;
      clearSubtaskList(list);
      (subtasks || []).forEach((subtask) => appendEditableSubtaskItem(list, subtask));
   }

   /**
    * Sets the form field value and triggers input.
    *
    * @param {string} id - The field ID.
    * @param {string} value - The field value.
    * @returns {void} Nothing.
    */
   function setFormFieldValueAndTrigger(id, value) {
      const field = document.getElementById(id);
      if (!field) return;
      field.value = value || "";
      field.dispatchEvent(new Event("input", { bubbles: true }));
   }

   /**
    * Fills the add task form for edit.
    *
    * @param {object} taskData - The task data object.
    * @returns {void} Nothing.
    */
   function fillAddTaskFormForEdit(taskData) {
      setFormFieldValueAndTrigger("addTaskTitle", taskData.title);
      setFormFieldValueAndTrigger("addTaskDescription", taskData.description);
      setFormFieldValueAndTrigger("addTaskDate", taskData.date);
      setPriorityInForm(taskData.priority || "medium");
      setCategoryInForm(taskData.category || "");
      setAssignedInForm(taskData.assigned || []);
      setSubtasksInForm(taskData.subtasks || []);
   }

   /**
    * Clears the edit dialog form through the shared board helper.
    * @returns {void} Nothing.
    */
   function clearAddTaskDialogForm() {
      window.clearAddTaskDialogForm?.();
   }

   /**
    * Prepares the edit task dialog data.
    *
    * @param {HTMLDialogElement} dialog - The dialog.
    * @param {string|number} taskId - The task ID.
    * @param {object} taskData - The task data object.
    * @param {string} [taskKey=""] - The task key.
    * @returns {void} Nothing.
    */
   function prepareEditTaskDialogData(dialog, taskId, taskData, taskKey = "") {
      dialog.dataset.taskStatus = taskData.status || "triage";
      dialog.dataset.editTaskId = String(taskId);
      if (taskKey) dialog.dataset.editTaskKey = taskKey;
   }

   /**
    * Opens the edit task dialog.
    *
    * @param {string|number} taskId - The task ID.
    * @returns {Promise<void>} A promise that resolves when the dialog is ready.
    */
   async function openEditTaskDialog(taskId) {
      const dialog = window.getAddTaskDialog?.();
      const taskData = window.BoardData?.getTask(taskId);
      if (!dialog || !taskData) return;
      const taskKey = await window.BoardData.getTaskKey(taskId);
      clearAddTaskDialogForm();
      prepareEditTaskDialogData(dialog, taskId, taskData, taskKey || "");
      window.setAddTaskDialogMode?.(true);
      fillAddTaskFormForEdit(taskData);
      window.BoardTaskDetail?.closeTaskDetailDialog();
      showPreparedEditDialog(dialog);
   }

   /**
    * Shows the prepared edit dialog.
    *
    * @param {HTMLDialogElement} dialog - The dialog.
    * @returns {void} Nothing.
    */
   function showPreparedEditDialog(dialog) {
      dialog.showModal();
      window.updateBoardDialogScrollLock?.();
      requestAnimationFrame(refreshAssignedInitials);
   }

   window.BoardTaskDetailForm = {
      openEditTaskDialog,
      fillAddTaskFormForEdit,
      clearAddTaskDialogForm,
   };
}
