"use strict";

{
   const TASK_DETAIL_AVATAR_COLORS = ["orange", "teal", "purple"];
   const TASK_DETAIL_ASSET_BASE_PATH = window.location.pathname.includes("/templates/")
      ? "../assets/"
      : "./assets/";

   /**
    * Returns the task detail asset path.
    *
    * @param {string} relativePath - The relative path.
    * @returns {string} The task detail asset path.
    */
   function taskDetailAssetPath(relativePath) {
      return `${TASK_DETAIL_ASSET_BASE_PATH}${relativePath}`;
   }

   // Module-level cache: contacts.json is only fetched once per page load,
   // reused by every task detail open (creator lookup, "(You)" suffix).
   let taskDetailContactsCache = null;

   /**
    * Normalizes raw contacts.json data into a flat lookup array.
    *
    * @param {object|Array<object>} data - The raw Firebase contacts data.
    * @returns {Array<object>} The normalized contacts with id, name and email.
    */
   function normalizeTaskDetailContacts(data) {
      if (!data) return [];
      const entries = Array.isArray(data)
         ? data.map((contact, index) => [String(index), contact])
         : Object.entries(data);
      return entries
         .filter(([, contact]) => contact && typeof contact === "object")
         .map(([key, contact]) => ({
            id: contact.id ?? key,
            name: String(contact.name || "").trim(),
            email: String(contact.email || "").trim(),
         }));
   }

   /**
    * Loads and caches the contacts list for the task detail overlay.
    *
    * Fails soft: a load error leaves the cache at an empty list so the
    * overlay still renders, just without contact-matched creator info.
    * @returns {Promise<Array<object>>} A promise that resolves to the contacts list.
    */
   async function loadTaskDetailContacts() {
      if (taskDetailContactsCache) return taskDetailContactsCache;
      try {
         const response = await fetch(`${window.JOIN_CONFIG.BASE_URL}contacts.json`);
         if (!response.ok) throw new Error(`HTTP ${response.status}`);
         taskDetailContactsCache = normalizeTaskDetailContacts(await response.json());
      } catch (error) {
         console.error("Loading contacts for task detail failed:", error);
         taskDetailContactsCache = [];
      }
      return taskDetailContactsCache;
   }

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
         ? taskDetailAssignedItemHTML(
              getTaskDetailAvatarColor(index),
              assignee.initials || "?",
              assignee.name || "Unnamed",
              isTaskDetailAssigneeCurrentUser(assignee)
           )
         : "";
      return createTaskDetailListItem("task-detail__assigned-item", html);
   }

   /**
    * Extracts the contact ID from an assignee's "contact-<id>" value.
    *
    * @param {object} assignee - The assignee object.
    * @returns {string} The contact ID, or an empty string if not present.
    */
   function getTaskDetailAssigneeContactId(assignee) {
      const value = String(assignee?.value || "");
      return value.startsWith("contact-") ? value.slice("contact-".length) : "";
   }

   /**
    * Checks whether an assignee is the signed-in user.
    *
    * Resolves the assignee's contact via the Phase 2 contacts cache to get
    * its e-mail, then compares it against window.JOIN_CURRENT_USER. Guests
    * have no matching contact e-mail, so nobody gets flagged for them.
    * @param {object} assignee - The assignee object.
    * @returns {boolean} Whether the assignee is the signed-in user.
    */
   function isTaskDetailAssigneeCurrentUser(assignee) {
      const currentEmail = String(window.JOIN_CURRENT_USER?.email || "").toLowerCase().trim();
      if (!currentEmail) return false;
      const contactId = getTaskDetailAssigneeContactId(assignee);
      if (!contactId) return false;
      const contact = (taskDetailContactsCache || []).find((c) => String(c.id) === contactId);
      const contactEmail = String(contact?.email || "").toLowerCase().trim();
      return Boolean(contactEmail) && contactEmail === currentEmail;
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
    * Finds the cached contact whose e-mail matches the given address.
    *
    * @param {string} email - The e-mail address to look up.
    * @returns {object|null} The matching contact, or null if none was found.
    */
   function findTaskDetailContactByEmail(email) {
      const normalized = String(email || "").toLowerCase().trim();
      if (!normalized) return null;
      return (
         (taskDetailContactsCache || []).find(
            (contact) => contact.email.toLowerCase().trim() === normalized
         ) || null
      );
   }

   /**
    * Builds a mailto href with a "Re: <task title>" subject.
    *
    * @param {string} email - The recipient e-mail address.
    * @param {string} taskTitle - The task title.
    * @returns {string} The mailto href.
    */
   function buildTaskDetailMailtoHref(email, taskTitle) {
      return `mailto:${email}?subject=${encodeURIComponent(`Re: ${taskTitle}`)}`;
   }

   /**
    * Sets the creator badge image (Member vs. Extern).
    *
    * @param {string} type - The resolved creator type ("intern" or "extern").
    * @returns {void} Nothing.
    */
   function setTaskDetailCreatorBadge(type) {
      const badge = document.getElementById("taskDetailCreatorBadge");
      if (!badge) return;
      const isExtern = type === "extern";
      badge.src = taskDetailAssetPath(`icons/desktop/${isExtern ? "Extern-batch.svg" : "Member-batch.svg"}`);
      badge.alt = isExtern ? "Extern" : "Member";
   }

   /**
    * Hides the creator action button (no button applies).
    * @returns {void} Nothing.
    */
   function hideTaskDetailCreatorAction() {
      document.getElementById("taskDetailCreatorAction")?.classList.add("d-none");
   }

   /**
    * Shows the creator action button as a mailto link.
    *
    * @param {string} email - The recipient e-mail address.
    * @param {string} taskTitle - The task title, used in the mail subject.
    * @returns {void} Nothing.
    */
   function showTaskDetailCreatorEmailAction(email, taskTitle) {
      const action = document.getElementById("taskDetailCreatorAction");
      if (!action) return;
      action.classList.remove("d-none");
      action.href = buildTaskDetailMailtoHref(email, taskTitle);
      delete action.dataset.contactId;
      const icon = document.getElementById("taskDetailCreatorActionIcon");
      if (icon) {
         icon.src = taskDetailAssetPath("icons/desktop/attach_email.svg");
         icon.alt = "E-mail";
      }
      setTaskDetailText("taskDetailCreatorActionLabel", "E-mail", "E-mail");
   }

   /**
    * Shows the creator action button as a profile link.
    *
    * The actual navigation target is wired up separately (contacts deeplink);
    * here the button only carries the matched contact's ID.
    * @param {string|number} contactId - The matched contact's ID.
    * @returns {void} Nothing.
    */
   function showTaskDetailCreatorProfileAction(contactId) {
      const action = document.getElementById("taskDetailCreatorAction");
      if (!action) return;
      action.classList.remove("d-none");
      action.href = "#";
      action.dataset.contactId = String(contactId);
      const icon = document.getElementById("taskDetailCreatorActionIcon");
      if (icon) {
         icon.src = taskDetailAssetPath("icons/desktop/person-creatror-btn.svg");
         icon.alt = "Profil";
      }
      setTaskDetailText("taskDetailCreatorActionLabel", "Profil", "Profil");
   }

   /**
    * Renders the creator action button (Profile or E-mail), or hides it.
    *
    * Member creators with a matching contact get a Profile button; everyone
    * else (extern creators, or intern creators without a matching contact -
    * a known gap between users.json and contacts.json) falls back to the
    * e-mail button. No e-mail at all means no button.
    * @param {object} creator - The creator object.
    * @param {string} taskTitle - The task title, used in the mail subject.
    * @returns {void} Nothing.
    */
   function renderTaskDetailCreatorAction(creator, taskTitle) {
      if (creator.type === "extern") {
         if (creator.email) return showTaskDetailCreatorEmailAction(creator.email, taskTitle);
         return hideTaskDetailCreatorAction();
      }
      const contact = findTaskDetailContactByEmail(creator.email);
      if (contact) return showTaskDetailCreatorProfileAction(contact.id);
      if (creator.email) return showTaskDetailCreatorEmailAction(creator.email, taskTitle);
      hideTaskDetailCreatorAction();
   }

   /**
    * Sets the task detail creator line.
    *
    * Shows the reporter's display name, a badge for whether they are a team
    * member ("intern") or an external stakeholder who submitted the request
    * by e-mail ("extern"), and an action button (Profile/E-mail). Hides the
    * whole row when there is no usable creator data.
    * @param {object|null} creator - The creator object.
    * @param {string} taskTitle - The task title, used in the mail subject.
    * @returns {void} Nothing.
    */
   function setTaskDetailCreator(creator, taskTitle) {
      const row = document.getElementById("taskDetailCreatorRow");
      if (!row) return;
      if (!creator || (!creator.name && !creator.email)) {
         row.classList.add("d-none");
         return;
      }
      row.classList.remove("d-none");
      setTaskDetailText("taskDetailCreator", creator.name || creator.email, "");
      setTaskDetailCreatorBadge(creator.type === "extern" ? "extern" : "intern");
      renderTaskDetailCreatorAction(creator, taskTitle);
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
      setTaskDetailCreator(taskData.creator, taskData.title);
      setTaskDetailAiBadge(taskData.creator);
      renderTaskDetailAssigned(taskData.assigned || []);
      renderTaskDetailSubtasks(taskData.subtasks || []);
   }

   /**
    * Opens the task detail.
    *
    * Loads the contacts cache first (once per page, see
    * loadTaskDetailContacts) so the creator row and the assigned list can
    * resolve a matching contact right away.
    * @param {string|number} taskId - The task ID.
    * @returns {Promise<void>} A promise that resolves when the dialog is open.
    */
   async function openTaskDetail(taskId) {
      const dialog = getTaskDetailDialog();
      const taskData = window.BoardData?.getTask(taskId);
      if (!dialog || !taskData) return;
      await loadTaskDetailContacts();
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
    * Builds the contacts page URL that opens one contact directly.
    *
    * Reuses the shared getPagePath/withAuthUserQuery helpers from script.js
    * so the "uid" (and "from") query params survive the jump - otherwise
    * the auth guard on contacts.html would bounce back to login.html.
    * @param {string|number} contactId - The contact ID to open.
    * @returns {string} The contacts page URL.
    */
   function buildContactsDeeplinkUrl(contactId) {
      const target = new URL(withAuthUserQuery(getPagePath(PAGE_FILES.contacts)), window.location.href);
      target.searchParams.set("contact", String(contactId));
      return `${target.pathname}${target.search}`;
   }

   /**
    * Handles clicks on the creator action button.
    *
    * Mailto links (no contactId) are left alone so the browser opens the
    * mail client as usual. Profile links close the dialog first, then
    * navigate to the matched contact on the contacts page.
    * @param {MouseEvent} event - The click event.
    * @returns {void} Nothing.
    */
   function handleTaskDetailCreatorActionClick(event) {
      const contactId = event.currentTarget.dataset.contactId;
      if (!contactId) return;
      event.preventDefault();
      closeTaskDetailDialog();
      window.location.href = buildContactsDeeplinkUrl(contactId);
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
      bindTaskDetailButton("taskDetailCreatorAction", "click", handleTaskDetailCreatorActionClick);
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
