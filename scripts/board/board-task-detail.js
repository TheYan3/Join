"use strict";

{
   const TASK_DETAIL_AVATAR_COLORS = ["orange", "teal", "purple"];

   /**
    * Returns the task detail dialog.
    * @returns {HTMLDialogElement|null} The task detail dialog.
    */
   function getTaskDetailDialog() {
      return document.getElementById("taskDetailDialog");
   }

   /**
    * Closes the task detail dialog.
    * @returns {void} Nothing.
    */
   function closeTaskDetailDialog() {
      const dialog = getTaskDetailDialog();
      if (!dialog) return;
      dialog.close();
      delete dialog.dataset.taskId;
      window.updateBoardDialogScrollLock?.();
   }

   /**
    * Sets the task detail label.
    *
    * @param {string} category - The task category.
    * @returns {void} Nothing.
    */
   function setTaskDetailLabel(category) {
      const label = document.getElementById("taskDetailCategory");
      if (!label) return;
      label.className = "task-detail__label";
      if (category === "technical") label.classList.add("task-detail__label--teal");
      label.textContent = window.BoardCards?.getCategoryLabel(category) || "No category";
   }

   /**
    * Sets text on one task detail element.
    *
    * @param {string} id - The element ID.
    * @param {string} value - The text value.
    * @param {string} fallback - The fallback text.
    * @returns {void} Nothing.
    */
   function setTaskDetailText(id, value, fallback) {
      const element = document.getElementById(id);
      if (element) element.textContent = value || fallback;
   }

   /**
    * Sets the task detail priority.
    *
    * @param {string} priority - The task priority.
    * @returns {void} Nothing.
    */
   function setTaskDetailPriority(priority) {
      const text = document.getElementById("taskDetailPriorityText");
      const icon = document.getElementById("taskDetailPriorityIcon");
      const label = window.BoardCards?.getPriorityLabel(priority) || "Medium";
      if (text) text.textContent = label;
      if (icon) {
         icon.src = window.BoardCards?.getPriorityIcon(priority) || "";
         icon.alt = label;
      }
   }

   /**
    * Creates one task detail list item from HTML.
    *
    * @param {string} className - The item class name.
    * @param {string} html - The item HTML.
    * @returns {HTMLLIElement} The task detail list item.
    */
   function createTaskDetailListItem(className, html) {
      const item = document.createElement("li");
      item.className = className;
      item.innerHTML = html;
      return item;
   }

   /**
    * Creates the task detail empty item.
    *
    * @param {string} text - The empty text.
    * @returns {HTMLLIElement} The task detail empty item.
    */
   function createTaskDetailEmptyItem(text) {
      const html = typeof taskDetailEmptyItemHTML === "function" ? taskDetailEmptyItemHTML(text) : text;
      return createTaskDetailListItem("task-detail__empty", html);
   }

   /**
    * Returns one task detail avatar color class.
    *
    * @param {number} index - The assignee index.
    * @returns {string} The avatar color class.
    */
   function getTaskDetailAvatarColor(index) {
      return TASK_DETAIL_AVATAR_COLORS[index % TASK_DETAIL_AVATAR_COLORS.length];
   }

   /**
    * Creates one assigned list item.
    *
    * @param {object} assignee - The assignee object.
    * @param {number} index - The assignee index.
    * @returns {HTMLLIElement} The assigned list item.
    */
   function createTaskDetailAssignedItem(assignee, index) {
      const html = typeof taskDetailAssignedItemHTML === "function"
         ? taskDetailAssignedItemHTML(getTaskDetailAvatarColor(index), assignee.initials || "?", assignee.name || "Unnamed")
         : "";
      return createTaskDetailListItem("task-detail__assigned-item", html);
   }

   /**
    * Returns the task detail subtask text.
    *
    * @param {object} subtask - The subtask object.
    * @param {number} index - The subtask index.
    * @returns {string} The task detail subtask text.
    */
   function getTaskDetailSubtaskText(subtask, index) {
      return subtask.text || `Subtask ${index + 1}`;
   }

   /**
    * Creates one subtask list item.
    *
    * @param {object} subtask - The subtask object.
    * @param {number} index - The subtask index.
    * @returns {HTMLLIElement} The subtask list item.
    */
   function createTaskDetailSubtaskItem(subtask, index) {
      const html = typeof taskDetailSubtaskItemHTML === "function"
         ? taskDetailSubtaskItemHTML(index, Boolean(subtask.completed), getTaskDetailSubtaskText(subtask, index))
         : "";
      return createTaskDetailListItem("task-detail__subtask-item", html);
   }

   /**
    * Renders one task detail list.
    *
    * @param {string} listId - The list element ID.
    * @param {Array<object>} items - The list items.
    * @param {string} emptyText - The empty text.
    * @param {*} createItem - The item factory.
    * @returns {void} Nothing.
    */
   function renderTaskDetailList(listId, items, emptyText, createItem) {
      const list = document.getElementById(listId);
      if (!list) return;
      list.innerHTML = "";
      if (items.length === 0) return list.appendChild(createTaskDetailEmptyItem(emptyText));
      items.forEach((item, index) => list.appendChild(createItem(item, index)));
   }

   /**
    * Renders the task detail assigned list.
    *
    * @param {Array<object>} assignees - The assignees list.
    * @returns {void} Nothing.
    */
   function renderTaskDetailAssigned(assignees) {
      renderTaskDetailList("taskDetailAssignedList", assignees, "No assignees", createTaskDetailAssignedItem);
   }

   /**
    * Renders the task detail subtasks.
    *
    * @param {Array<object>} subtasks - The subtasks list.
    * @returns {void} Nothing.
    */
   function renderTaskDetailSubtasks(subtasks) {
      renderTaskDetailList("taskDetailSubtasksList", subtasks, "No subtasks", createTaskDetailSubtaskItem);
   }

   /**
    * Sets the task detail creator line.
    *
    * Shows the reporter and whether they are a team member ("intern") or an
    * external stakeholder who submitted the request by e-mail ("extern").
    * @param {object|null} creator - The creator object.
    * @returns {void} Nothing.
    */
   function setTaskDetailCreator(creator) {
      const label = creator?.email || creator?.name || "";
      setTaskDetailText("taskDetailCreator", label, "Unknown");
      const badge = document.getElementById("taskDetailCreatorType");
      if (!badge) return;
      const type = creator?.type === "extern" ? "extern" : creator?.type === "intern" ? "intern" : "";
      badge.textContent = type ? (type === "extern" ? "External" : "Internal") : "";
      badge.className = type
         ? `task-detail__creator-badge task-detail__creator-badge--${type}`
         : "task-detail__creator-badge";
   }

   /**
    * Toggles the AI-generated badge in the task detail header.
    *
    * Shown whenever the ticket came in through the e-mail issue collector
    * (creator.type "extern"), matching the summary's request count.
    * @param {object|null} creator - The creator object.
    * @returns {void} Nothing.
    */
   function setTaskDetailAiBadge(creator) {
      document.getElementById("taskDetailAiBadge")
         ?.classList.toggle("task-detail__ai-badge--visible", creator?.type === "extern");
   }

   /**
    * Renders the task detail.
    *
    * @param {object} taskData - The task data object.
    * @returns {void} Nothing.
    */
   function renderTaskDetail(taskData) {
      setTaskDetailLabel(taskData.category);
      setTaskDetailText("taskDetailTitle", taskData.title, "Untitled task");
      setTaskDetailText("taskDetailDescription", taskData.description, "No description");
      setTaskDetailText("taskDetailDate", taskData.date, "No due date");
      setTaskDetailPriority(taskData.priority);
      setTaskDetailCreator(taskData.creator);
      setTaskDetailAiBadge(taskData.creator);
      renderTaskDetailAssigned(taskData.assigned || []);
      renderTaskDetailSubtasks(taskData.subtasks || []);
   }

   /**
    * Opens the task detail.
    *
    * @param {string|number} taskId - The task ID.
    * @returns {void} Nothing.
    */
   function openTaskDetail(taskId) {
      const dialog = getTaskDetailDialog();
      const taskData = window.BoardData?.getTask(taskId);
      if (!dialog || !taskData) return;
      dialog.dataset.taskId = String(taskId);
      renderTaskDetail(taskData);
      dialog.showModal();
      window.updateBoardDialogScrollLock?.();
   }

   /**
    * Returns the selected detail checkbox.
    *
    * @param {Event} event - The change event.
    * @returns {HTMLInputElement|null} The selected detail checkbox.
    */
   function getTaskDetailCheckbox(event) {
      return event.target.closest(".task-detail__subtask-checkbox");
   }

   /**
    * Returns the detail subtask index.
    *
    * @param {HTMLInputElement|null} checkbox - The subtask checkbox.
    * @returns {number} The detail subtask index.
    */
   function getTaskDetailSubtaskIndex(checkbox) {
      return Number.parseInt(checkbox?.dataset.subtaskIndex || "", 10);
   }

   /**
    * Returns the task detail subtask toggle payload.
    *
    * @param {Event} event - The change event.
    * @returns {object|null} The task detail subtask toggle payload.
    */
   function getTaskDetailSubtaskTogglePayload(event) {
      const checkbox = getTaskDetailCheckbox(event);
      const taskId = getTaskDetailDialog()?.dataset.taskId;
      const subtaskIndex = getTaskDetailSubtaskIndex(checkbox);
      const currentTask = window.BoardData?.getTask(taskId);
      if (!checkbox || !taskId || Number.isNaN(subtaskIndex) || !currentTask?.subtasks?.[subtaskIndex]) return null;
      return { checkbox, taskId, subtaskIndex, currentTask };
   }

   /**
    * Returns the task with one toggled subtask.
    *
    * @param {object} task - The task object.
    * @param {number} subtaskIndex - The subtask index.
    * @param {boolean} isCompleted - Whether the subtask is completed.
    * @returns {object} The updated task.
    */
   function getTaskWithToggledSubtask(task, subtaskIndex, isCompleted) {
      const subtasks = (task.subtasks || []).map((subtask, index) => index === subtaskIndex ? { ...subtask, completed: isCompleted } : subtask);
      return { ...task, subtasks };
   }

   /**
    * Reloads the board and keeps the detail open.
    *
    * @param {string|number} taskId - The task ID.
    * @returns {Promise<void>} A promise that resolves when the board is reloaded.
    */
   async function reloadBoardAndKeepDetailOpen(taskId) {
      const tasks = await window.BoardData.loadTasks();
      window.BoardCards?.renderBoardFromTasks(tasks);
      window.BoardDnd?.initializeDraggableCards();
      openTaskDetail(taskId);
   }

   /**
    * Persists the task detail subtask toggle.
    *
    * @param {string|number} taskId - The task ID.
    * @param {object} updatedTask - The updated task object.
    * @returns {Promise<void>} A promise that resolves when the subtask toggle is stored.
    */
   async function persistTaskDetailSubtaskToggle(taskId, updatedTask) {
      await window.BoardData.putTask(taskId, updatedTask);
      await reloadBoardAndKeepDetailOpen(taskId);
   }

   /**
    * Reverts one detail checkbox state.
    *
    * @param {HTMLInputElement} checkbox - The subtask checkbox.
    * @returns {void} Nothing.
    */
   function revertTaskDetailCheckbox(checkbox) {
      checkbox.checked = !checkbox.checked;
   }

   /**
    * Handles the task detail subtask toggle.
    *
    * @param {Event} event - The change event.
    * @returns {Promise<void>} A promise that resolves when the change is handled.
    */
   async function handleTaskDetailSubtaskToggle(event) {
      const payload = getTaskDetailSubtaskTogglePayload(event);
      if (!payload) return;
      const updatedTask = getTaskWithToggledSubtask(payload.currentTask, payload.subtaskIndex, payload.checkbox.checked);
      try {
         await persistTaskDetailSubtaskToggle(payload.taskId, updatedTask);
      } catch (error) {
         revertTaskDetailCheckbox(payload.checkbox);
         console.error("Subtask update failed:", error);
      }
   }

   /**
    * Handles deleting the task.
    *
    * @param {string|number} taskId - The task ID.
    * @returns {Promise<void>} A promise that resolves when the task is deleted.
    */
   async function handleDeleteTask(taskId) {
      try {
         await window.BoardData.deleteTask(taskId);
         closeTaskDetailDialog();
         window.BoardCards?.renderBoardFromTasks(await window.BoardData.loadTasks());
      } catch (error) {
         console.error("Task delete failed:", error);
      }
   }

   /**
    * Handles the task detail delete click.
    *
    * @param {HTMLDialogElement|null} dialog - The dialog.
    * @returns {Promise<void>} A promise that resolves when the delete is handled.
    */
   async function handleTaskDetailDeleteClick(dialog) {
      const taskId = dialog?.dataset.taskId;
      if (taskId) await handleDeleteTask(taskId);
   }

   /**
    * Handles the task detail edit click.
    *
    * @param {HTMLDialogElement|null} dialog - The dialog.
    * @returns {Promise<void>} A promise that resolves when the edit is handled.
    */
   async function handleTaskDetailEditClick(dialog) {
      const taskId = dialog?.dataset.taskId;
      if (taskId) await window.BoardTaskDetailForm?.openEditTaskDialog(taskId);
   }

   /**
    * Binds one task detail button.
    *
    * @param {string} id - The button ID.
    * @param {string} eventName - The event name.
    * @param {*} handler - The event handler.
    * @returns {void} Nothing.
    */
   function bindTaskDetailButton(id, eventName, handler) {
      document.getElementById(id)?.addEventListener(eventName, handler);
   }

   /**
    * Handles the task detail delete button click.
    *
    * @param {HTMLDialogElement} dialog - The dialog.
    * @returns {void} Nothing.
    */
   function handleTaskDetailDeleteButtonClick(dialog) {
      handleTaskDetailDeleteClick(dialog);
   }

   /**
    * Handles the task detail edit button click.
    *
    * @param {HTMLDialogElement} dialog - The dialog.
    * @returns {void} Nothing.
    */
   function handleTaskDetailEditButtonClick(dialog) {
      handleTaskDetailEditClick(dialog);
   }

   /**
    * Binds the detail subtask list.
    * @returns {void} Nothing.
    */
   function bindTaskDetailSubtasks() {
      document.getElementById("taskDetailSubtasksList")?.addEventListener("change", handleTaskDetailSubtaskToggle);
   }

   /**
    * Binds the detail action buttons.
    *
    * @param {HTMLDialogElement} dialog - The dialog.
    * @returns {void} Nothing.
    */
   function bindTaskDetailActions(dialog) {
      bindTaskDetailButton("taskDetailClose", "click", closeTaskDetailDialog);
      bindTaskDetailButton("taskDetailDelete", "click", () => handleTaskDetailDeleteButtonClick(dialog));
      bindTaskDetailButton("taskDetailEdit", "click", () => handleTaskDetailEditButtonClick(dialog));
   }

   /**
    * Sets up the task detail interactions.
    * @returns {void} Nothing.
    */
   function setupTaskDetailInteractions() {
      const dialog = getTaskDetailDialog();
      if (!dialog || dialog.dataset.initialized === "true") return;
      dialog.dataset.initialized = "true";
      bindTaskDetailSubtasks();
      bindTaskDetailActions(dialog);
   }

   window.BoardTaskDetail = {
      closeTaskDetailDialog,
      openTaskDetail,
      setupTaskDetailInteractions,
   };
}
