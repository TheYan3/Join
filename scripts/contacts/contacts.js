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
   const data = ContactsFeature.data;
   const view = ContactsFeature.view;
   const form = ContactsFeature.form;

   /**
    * Finds a contact by its ID.
    *
    * @param {string|number} contactId - The contact ID.
    * @returns {object|undefined} The matching contact.
    */
   function getContactById(contactId) {
      return state.contacts.find((contact) => String(contact.id) === String(contactId));
   }

   /**
    * Loads the contacts page data and bindings.
    * @returns {Promise<void>} A promise that resolves when setup is complete.
    */
   async function initContactsPage() {
      await data.loadContacts();
      refreshContactView();
      applyContactDeeplinkFromUrl();
      bindEvents();
   }

   /**
    * Opens the contact given by the "contact" URL parameter, if any.
    *
    * Reached from the task detail overlay's "Profil" button. An unknown or
    * missing ID is ignored - the page just loads normally.
    * @returns {void} Nothing.
    */
   function applyContactDeeplinkFromUrl() {
      const contactId = new URLSearchParams(window.location.search).get("contact");
      if (!contactId || !getContactById(contactId)) return;
      showSelectedContact(contactId);
      refreshContactView();
   }

   /**
    * Refreshes the list and responsive layout.
    * @returns {void} Nothing.
    */
   function refreshContactView() {
      view.renderContacts();
      view.switchView();
   }

   /**
    * Handles clicks on a contact row.
    *
    * @param {Event} event - The click event.
    * @returns {void} Nothing.
    */
   function handleContactClick(event) {
      const clickedContactId = getClickedContactId(event);
      if (!clickedContactId) return;
      isSelectedContact(clickedContactId) ? clearSelectedContact() : showSelectedContact(clickedContactId);
   }

   /**
    * Reads the clicked contact ID from the list.
    *
    * @param {Event} event - The click event.
    * @returns {string|null} The clicked contact ID.
    */
   function getClickedContactId(event) {
      return event.target.closest(".contact-item")?.dataset.id || null;
   }

   /**
    * Checks whether a contact is already selected.
    *
    * @param {string|number} contactId - The contact ID.
    * @returns {boolean} Whether the contact is selected.
    */
   function isSelectedContact(contactId) {
      return String(state.selectedContactId) === String(contactId);
   }

   /**
    * Clears the current contact selection.
    * @returns {void} Nothing.
    */
   function clearSelectedContact() {
      state.selectedContactId = null;
      view.closeDetailMenu();
      hideDetailView();
      refreshContactView();
   }

   /**
    * Hides the contact detail panel.
    * @returns {void} Nothing.
    */
   function hideDetailView() {
      document.getElementById("detail-view")?.classList.add("d-none");
   }

   /**
    * Selects a contact and shows its details.
    *
    * @param {string|number} contactId - The contact ID.
    * @returns {void} Nothing.
    */
   function showSelectedContact(contactId) {
      const contact = selectContact(contactId);
      if (contact) renderSelectedContact(contact);
   }

   /**
    * Stores the selected contact ID.
    *
    * @param {string|number} contactId - The contact ID.
    * @returns {object|undefined} The selected contact.
    */
   function selectContact(contactId) {
      state.selectedContactId = contactId;
      return getContactById(contactId);
   }

   /**
    * Renders the selected contact state.
    *
    * @param {object} contact - The selected contact.
    * @returns {void} Nothing.
    */
   function renderSelectedContact(contact) {
      view.renderContacts();
      view.showDetail(contact);
      view.switchView();
   }

   /**
    * Returns from the detail panel to the list.
    * @returns {void} Nothing.
    */
   function handleBackToList() {
      clearSelectedContact();
   }

   /**
    * Binds all contact page events.
    * @returns {void} Nothing.
    */
   function bindEvents() {
      bindAddContact();
      bindListEvents();
      bindFormEvents();
      bindDetailActions();
      bindMenuActions();
      bindWindowEvents();
   }

   /**
    * Binds the add contact button.
    * @returns {void} Nothing.
    */
   function bindAddContact() {
      addClickListener("btn-add-contact", prepareCreateMode);
   }

   /**
    * Prepares the form for a new contact.
    * @returns {void} Nothing.
    */
   function prepareCreateMode() {
      form.resetMode();
      view.closeDetailMenu();
   }

   /**
    * Binds the contacts list events.
    * @returns {void} Nothing.
    */
   function bindListEvents() {
      addElementListener("contacts-list-content", "click", handleContactClick);
   }

   /**
    * Binds the contact form events.
    * @returns {void} Nothing.
    */
   function bindFormEvents() {
      addElementListener("contact-form", "submit", form.handleSubmit);
      addElementListener("contact-form-cancel", "click", form.handleSecondaryAction);
   }

   /**
    * Binds the detail action buttons.
    * @returns {void} Nothing.
    */
   function bindDetailActions() {
      addClickListener("btn-edit", form.handleEdit);
      addClickListener("btn-delete", form.deleteSelected);
      addClickListener("btn-back-to-list", handleBackToList);
   }

   /**
    * Binds the mobile detail menu actions.
    * @returns {void} Nothing.
    */
   function bindMenuActions() {
      addClickListener("btn-contact-detail-menu", handleDetailMenuButtonClick);
      addClickListener("btn-contact-detail-edit", handleDetailMenuEdit);
      addClickListener("btn-contact-detail-delete", handleDetailMenuDelete);
      document.addEventListener("click", handleDocumentClick);
   }

   /**
    * Toggles the mobile detail menu button.
    *
    * @param {Event} event - The click event.
    * @returns {void} Nothing.
    */
   function handleDetailMenuButtonClick(event) {
      event.stopPropagation();
      view.toggleDetailMenu();
   }

   /**
    * Opens edit mode from the detail menu.
    * @returns {void} Nothing.
    */
   function handleDetailMenuEdit() {
      view.closeDetailMenu();
      document.getElementById("btn-edit")?.click();
   }

   /**
    * Deletes a contact from the detail menu.
    * @returns {void} Nothing.
    */
   function handleDetailMenuDelete() {
      view.closeDetailMenu();
      document.getElementById("btn-delete")?.click();
   }

   /**
    * Closes the detail menu on outside clicks.
    *
    * @param {Event} event - The click event.
    * @returns {void} Nothing.
    */
   function handleDocumentClick(event) {
      if (shouldCloseDetailMenu(event)) view.closeDetailMenu();
   }

   /**
    * Checks whether the detail menu should close.
    *
    * @param {Event} event - The click event.
    * @returns {boolean} Whether the menu should close.
    */
   function shouldCloseDetailMenu(event) {
      const menu = document.getElementById("contact-detail-menu");
      return Boolean(menu)
         && !menu.classList.contains("d-none")
         && !event.target.closest("#contact-detail-menu")
         && !event.target.closest("#btn-contact-detail-menu");
   }

   /**
    * Binds responsive window events.
    * @returns {void} Nothing.
    */
   function bindWindowEvents() {
      window.addEventListener("resize", view.switchView);
   }

   /**
    * Adds a click listener to an element.
    *
    * @param {string} id - The element ID.
    * @param {Function} handler - The click handler.
    * @returns {void} Nothing.
    */
   function addClickListener(id, handler) {
      addElementListener(id, "click", handler);
   }

   /**
    * Adds an event listener to an element.
    *
    * @param {string} id - The element ID.
    * @param {string} eventName - The event name.
    * @param {Function} handler - The event handler.
    * @returns {void} Nothing.
    */
   function addElementListener(id, eventName, handler) {
      document.getElementById(id)?.addEventListener(eventName, handler);
   }

   ContactsFeature.entry = {
      initContactsPage,
      bindEvents,
      handleContactClick,
      handleBackToList,
   };

   window.ContactsFeature = ContactsFeature;

   if (document.readyState === "loading") {
      window.addEventListener("DOMContentLoaded", initContactsPage);
   } else {
      initContactsPage();
   }
}
