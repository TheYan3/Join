"use strict";

{
   const BOARD_BASE_URL = window.JOIN_CONFIG.BASE_URL;
   const taskKeyById = {};
   const tasksById = {};
   const STATUS_BY_DIRECTORY_ID = {
      TriageTask: "triage",
      TodoTask: "todo",
      InProgressTask: "in-progress",
      AwaitTask: "await-feedback",
      DoneTask: "done",
   };

   /**
    * Clears the task caches.
    * @returns {void} Nothing.
    */
   function clearTaskCaches() {
      Object.keys(taskKeyById).forEach((taskId) => delete taskKeyById[taskId]);
      Object.keys(tasksById).forEach((taskId) => delete tasksById[taskId]);
   }

   /**
    * Returns the status by directory ID.
    *
    * @param {string|number} directoryId - The directory ID.
    * @returns {string|null} The status by directory ID.
    */
   function getStatusByDirectoryId(directoryId) {
      return STATUS_BY_DIRECTORY_ID[directoryId] || null;
   }

   /**
    * Returns the task collection URL.
    * @returns {string} The task collection URL.
    */
   function getTaskCollectionUrl() {
      return `${BOARD_BASE_URL}tasks.json`;
   }

   /**
    * Returns the URL for one task key.
    *
    * @param {string} taskKey - The task key.
    * @returns {string} The task URL.
    */
   function getTaskUrl(taskKey) {
      return `${BOARD_BASE_URL}tasks/${taskKey}.json`;
   }

   /**
    * Returns all task entries from Firebase data.
    *
    * @param {*} data - The raw Firebase data.
    * @returns {Array<Array<*>>} The task entries.
    */
   function getTaskEntries(data) {
      if (!data) return [];
      return Array.isArray(data) ? data.map((task, index) => [String(index), task]) : Object.entries(data);
   }

   /**
    * Returns the matching task entry.
    *
    * @param {Array<Array<*>>} entries - The task entries.
    * @param {string|number} taskId - The task ID.
    * @returns {Array<*>|undefined} The matching task entry.
    */
   function findTaskEntry(entries, taskId) {
      return entries.find(([, task]) => task && String(task.id ?? "") === String(taskId));
   }

   /**
    * Requests all task data.
    * @returns {Promise<*>} A promise that resolves to the task data.
    */
   async function requestTaskData() {
      const response = await fetch(getTaskCollectionUrl(), { signal: window.JOIN_CONFIG.pageAbortSignal });
      return response.ok ? response.json() : null;
   }

   /**
    * Finds the task key by ID.
    *
    * @param {string|number} taskId - The task ID.
    * @returns {Promise<string|null>} A promise that resolves to the task key.
    */
   async function findTaskKeyById(taskId) {
      const data = await requestTaskData();
      const match = findTaskEntry(getTaskEntries(data), taskId);
      return match ? match[0] : null;
   }

   /**
    * Returns the task key.
    *
    * @param {string|number} taskId - The task ID.
    * @returns {Promise<string>} A promise that resolves to the task key.
    */
   async function getTaskKey(taskId) {
      const taskIdString = String(taskId);
      let taskKey = taskKeyById[taskIdString];
      if (!taskKey) taskKey = await findAndRememberTaskKey(taskIdString);
      return taskKey;
   }

   /**
    * Finds and stores one task key.
    *
    * @param {string} taskIdString - The normalized task ID.
    * @returns {Promise<string|null>} A promise that resolves to the stored task key.
    */
   async function findAndRememberTaskKey(taskIdString) {
      const taskKey = await findTaskKeyById(taskIdString);
      if (taskKey) taskKeyById[taskIdString] = taskKey;
      return taskKey;
   }

   /**
    * Returns the stored task payload.
    *
    * @param {string|number} taskId - The task ID.
    * @param {object} taskData - The task data object.
    * @returns {object} The stored task payload.
    */
   function getStoredTaskPayload(taskId, taskData) {
      return { ...taskData, id: taskData.id ?? taskId };
   }

   /**
    * Remembers one task and key.
    *
    * @param {string|number} taskId - The task ID.
    * @param {string} taskKey - The task key.
    * @param {object} taskData - The task data object.
    * @returns {void} Nothing.
    */
   function rememberTask(taskId, taskKey, taskData) {
      taskKeyById[String(taskId)] = taskKey;
      tasksById[String(taskId)] = taskData;
   }

   /**
    * Stores the task.
    *
    * @param {string|number} taskId - The task ID.
    * @param {object} taskData - The task data object.
    * @returns {Promise<void>} A promise that resolves when the task is stored.
    */
   async function putTask(taskId, taskData) {
      const taskKey = await getTaskKey(taskId);
      const payload = getStoredTaskPayload(taskId, taskData);
      if (!taskKey) throw new Error(`Task key not found for id ${taskId}`);
      await sendTaskRequest(getTaskUrl(taskKey), "PUT", payload);
      rememberTask(taskId, taskKey, payload);
   }

   /**
    * Sends a task request.
    *
    * @param {string} url - The request URL.
    * @param {string} method - The HTTP method.
    * @param {object} [taskData] - The optional task payload.
    * @returns {Promise<void>} A promise that resolves when the request succeeds.
    */
   async function sendTaskRequest(url, method, taskData) {
      const options = { method };
      if (taskData) options.headers = { "Content-Type": "application/json" };
      if (taskData) options.body = JSON.stringify(taskData);
      const response = await fetch(url, options);
      if (!response.ok) throw new Error(`Task ${method.toLowerCase()} failed: HTTP ${response.status}`);
   }

   /**
    * Deletes the task.
    *
    * @param {string|number} taskId - The task ID.
    * @returns {Promise<void>} A promise that resolves when the task is deleted.
    */
   async function deleteTask(taskId) {
      const taskKey = await getTaskKey(taskId);
      if (!taskKey) throw new Error(`Task key not found for id ${taskId}`);
      await sendTaskRequest(getTaskUrl(taskKey), "DELETE");
      delete taskKeyById[String(taskId)];
      delete tasksById[String(taskId)];
   }

   /**
    * Updates the task status.
    *
    * @param {string|number} taskId - The task ID.
    * @param {string} newStatus - The new status.
    * @returns {Promise<void>} A promise that resolves when the task status is updated.
    */
   async function updateTaskStatus(taskId, newStatus) {
      const currentTask = tasksById[String(taskId)];
      if (!taskId || !newStatus || !currentTask) return;
      const updatedTask = { ...currentTask, id: currentTask.id ?? taskId, status: newStatus };
      await putTask(taskId, updatedTask);
      tasksById[String(taskId)] = updatedTask;
   }

   /**
    * Checks whether a task entry is valid.
    *
    * @param {Array<*>} entry - The task entry.
    * @returns {boolean} Whether the entry is valid.
    */
   function isValidTaskEntry(entry) {
      const [, task] = entry;
      return Boolean(task && typeof task === "object");
   }

   /**
    * Normalizes one task entry.
    *
    * @param {Array<*>} entry - The task entry.
    * @returns {object} The normalized task.
    */
   function normalizeTaskEntry(entry) {
      const [key, task] = entry;
      const resolvedId = task.id ?? key;
      const normalizedTask = { ...task, id: resolvedId };
      rememberTask(resolvedId, key, normalizedTask);
      return normalizedTask;
   }

   /**
    * Normalizes the Firebase tasks.
    *
    * @param {*} data - The raw Firebase data.
    * @returns {Array<object>} The normalized Firebase tasks.
    */
   function normalizeFirebaseTasks(data) {
      return getTaskEntries(data).filter(isValidTaskEntry).map(normalizeTaskEntry);
   }

   /**
    * Loads the tasks.
    * @returns {Promise<Array<object>>} A promise that resolves to the tasks list.
    */
   async function loadTasks() {
      clearTaskCaches();
      try {
         return normalizeFirebaseTasks(await requestTaskData());
      } catch (error) {
         if (error.name === "AbortError") return [];
         console.error("Task loading failed:", error);
         return [];
      }
   }

   /**
    * Returns the task.
    *
    * @param {string|number} taskId - The task ID.
    * @returns {object|null} The task.
    */
   function getTask(taskId) {
      return tasksById[String(taskId)] || null;
   }

   /**
    * Returns all tasks.
    * @returns {Array<object>} The tasks list.
    */
   function getAllTasks() {
      return Object.values(tasksById);
   }

   window.BoardData = {
      deleteTask,
      getAllTasks,
      getStatusByDirectoryId,
      getTask,
      getTaskKey,
      loadTasks,
      putTask,
      updateTaskStatus,
   };
}
