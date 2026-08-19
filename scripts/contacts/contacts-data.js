"use strict";

{
   const ContactsFeature = window.ContactsFeature || {};
   ContactsFeature.state = ContactsFeature.state || {
      selectedContactId: null,
      editingContactId: null,
      editingContactKey: null,
      contacts: [],
   };
   const state = ContactsFeature.state;

   /**
    * Returns the contacts API base URL.
    * @returns {string} The contacts base URL.
    */
   function getContactsBaseUrl() {
      return window.JOIN_CONFIG.BASE_URL;
   }

   /**
    * Normalizes one contact from Firebase data.
    *
    * @param {object} contact - The raw contact data.
    * @param {string} firebaseKey - The Firebase key.
    * @returns {object|null} The normalized contact.
    */
   function normalizeContact(contact, firebaseKey) {
      if (!contact || typeof contact !== "object") return null;
      return { ...contact, id: contact.id ?? firebaseKey, _firebaseKey: firebaseKey };
   }

   /**
    * Converts Firebase contact data into an array.
    *
    * @param {object|Array<object>} data - The Firebase response data.
    * @returns {Array<object>} The normalized contacts.
    */
   function normalizeFirebaseContacts(data) {
      if (!data) return [];
      return buildContactEntries(data).map(([key, contact]) => normalizeContact(contact, key)).filter(Boolean);
   }

   /**
    * Builds key and contact pairs from Firebase data.
    *
    * @param {object|Array<object>} data - The Firebase response data.
    * @returns {Array<Array<*>>} The contact entries.
    */
   function buildContactEntries(data) {
      return Array.isArray(data) ? data.map((contact, index) => [String(index), contact]) : Object.entries(data);
   }

   /**
    * Loads all contacts from Firebase.
    * @returns {Promise<Array<object>>} A promise that resolves to the contacts list.
    */
   async function loadContacts() {
      try {
         state.contacts = normalizeFirebaseContacts(await fetchContactsJson());
      } catch (error) {
         handleLoadError(error);
      }
      return state.contacts;
   }

   /**
    * Fetches the raw contacts JSON.
    * @returns {Promise<object|Array<object>>} A promise that resolves to the raw data.
    */
   async function fetchContactsJson() {
      const response = await fetch(buildContactsCollectionUrl());
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
   }

   /**
    * Builds the contacts collection URL.
    * @returns {string} The contacts collection URL.
    */
   function buildContactsCollectionUrl() {
      return `${getContactsBaseUrl()}contacts.json`;
   }

   /**
    * Handles contact loading errors.
    *
    * @param {Error} error - The loading error.
    * @returns {void} Nothing.
    */
   function handleLoadError(error) {
      console.error("Contact loading failed:", error);
      state.contacts = [];
   }

   /**
    * Saves a new contact to Firebase.
    *
    * @param {object} contact - The new contact data.
    * @returns {Promise<void>} A promise that resolves when the request is done.
    */
   async function addContact(contact) {
      await sendContactRequest(buildContactsCollectionUrl(), "POST", contact, "Contact save failed");
   }

   /**
    * Finds the Firebase key for a contact ID.
    *
    * @param {string|number} contactId - The contact ID.
    * @returns {Promise<string|null>} A promise that resolves to the Firebase key.
    */
   async function findContactKeyById(contactId) {
      return state.contacts.find((contact) => String(contact.id) === String(contactId))?._firebaseKey || null;
   }

   /**
    * Updates an existing contact in Firebase.
    *
    * @param {string|number} contactId - The contact ID.
    * @param {object} contactData - The updated contact data.
    * @param {string|null} [contactKeyOverride=null] - The fallback Firebase key.
    * @returns {Promise<void>} A promise that resolves when the request is done.
    */
   async function updateContact(contactId, contactData, contactKeyOverride = null) {
      const contactKey = await resolveContactKey(contactId, contactKeyOverride);
      await sendContactRequest(buildContactUrl(contactKey), "PUT", buildContactPayload(contactId, contactData), "Contact update failed");
   }

   /**
    * Resolves the Firebase key for a contact.
    *
    * @param {string|number} contactId - The contact ID.
    * @param {string|null} [contactKeyOverride=null] - The fallback Firebase key.
    * @returns {Promise<string>} A promise that resolves to the Firebase key.
    */
   async function resolveContactKey(contactId, contactKeyOverride = null) {
      const contactKey = (await findContactKeyById(contactId)) || contactKeyOverride;
      if (!contactKey) throw new Error(`Contact key not found for id ${contactId}`);
      return contactKey;
   }

   /**
    * Builds the payload for a contact update.
    *
    * @param {string|number} contactId - The contact ID.
    * @param {object} contactData - The contact data.
    * @returns {object} The request payload.
    */
   function buildContactPayload(contactId, contactData) {
      return { ...contactData, id: contactData.id ?? contactId };
   }

   /**
    * Builds the URL for one contact record.
    *
    * @param {string} contactKey - The Firebase key.
    * @returns {string} The contact URL.
    */
   function buildContactUrl(contactKey) {
      return `${getContactsBaseUrl()}contacts/${contactKey}.json`;
   }

   /**
    * Deletes a contact from Firebase.
    *
    * @param {string|number} contactId - The contact ID.
    * @returns {Promise<void>} A promise that resolves when the request is done.
    */
   async function deleteContact(contactId) {
      const contactKey = await resolveContactKey(contactId);
      await sendContactRequest(buildContactUrl(contactKey), "DELETE", null, "Contact delete failed");
   }

   /**
    * Sends a contact request to Firebase.
    *
    * @param {string} url - The request URL.
    * @param {string} method - The HTTP method.
    * @param {object|null} payload - The request payload.
    * @param {string} errorPrefix - The error message prefix.
    * @returns {Promise<void>} A promise that resolves when the request is done.
    */
   async function sendContactRequest(url, method, payload, errorPrefix) {
      const response = await fetch(url, buildRequestOptions(method, payload));
      if (!response.ok) throw new Error(`${errorPrefix}: HTTP ${response.status}`);
   }

   /**
    * Builds fetch options for contact requests.
    *
    * @param {string} method - The HTTP method.
    * @param {object|null} payload - The request payload.
    * @returns {object} The fetch options.
    */
   function buildRequestOptions(method, payload) {
      if (payload === null) return { method };
      return {
         method,
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify(payload),
      };
   }

   ContactsFeature.data = {
      normalizeContact,
      normalizeFirebaseContacts,
      loadContacts,
      addContact,
      updateContact,
      deleteContact,
      findContactKeyById,
   };

   window.ContactsFeature = ContactsFeature;
}
