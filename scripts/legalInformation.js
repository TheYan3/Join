(function () {
    const isInTemplates = window.location.pathname.includes("/templates/");
    const assetBasePath = isInTemplates ? "../assets/" : "./assets/";

    document.addEventListener("DOMContentLoaded", transformNavbarForLogin);

    /**
     * Transforms the navbar for login.
     * @returns {void} Nothing.
     */
    function transformNavbarForLogin() {
        const urlParams = new URLSearchParams(window.location.search);
        const from = urlParams.get("from");
        if (from === "landing") {
            const previousPage = isInTemplates ? "../welcome.html" : "./welcome.html";
            replaceNavMenuWithBackButton("Back", previousPage);
            hideHeaderElements();
            centerHeaderContent();
            return;
        }
        if (from === "welcome") {
            const previousPage = isInTemplates ? "../index.html" : "./index.html";
            replaceNavMenuWithBackButton("Back", previousPage);
            hideHeaderElements();
            centerHeaderContent();
            return;
        }
        if (from === "login" || from === "signup") {
            const isFromSignup = from === "signup";
            const previousPage = isFromSignup
                ? "./signup.html"
                : isInTemplates
                    ? "../login.html"
                    : "./login.html";
            const buttonText = isFromSignup ? "Sign up" : "Log in";
            replaceNavMenuWithBackButton(buttonText, previousPage);
            hideHeaderElements();
            centerHeaderContent();
        }
    }

    /**
     * Replaces the nav menu with back button.
     *
     * @param {string} buttonText - The button text.
     * @param {string} previousPage - The previous page path.
     * @returns {void} Nothing.
     */
    function replaceNavMenuWithBackButton(buttonText, previousPage) {
        const navMenu = document.querySelector(".navBar__menu");
        if (!navMenu) return;

        navMenu.innerHTML = `
        <button class="navBar__backToLogin" id="back-to-login">
            <img src="${assetBasePath}icons/desktop/login.svg" alt="${buttonText}" class="navBar__backToLogin-icon">
            <span class="navBar__backToLogin-text">${buttonText}</span>
        </button>
    `;

        document.getElementById("back-to-login")?.addEventListener("click", () => {
            location.href = previousPage;
        });
    }

    /**
     * Hides the nav buttons and user icon.
     * @returns {void} Nothing.
     */
    function hideHeaderElements() {
        const navQuicklinks = document.querySelectorAll(".navBar__quicklink");
        const helpIcon = document.getElementById("help");
        const userInitials = document.getElementById("login__initials");

        navQuicklinks.forEach((item) => item.classList.add("d-none"));
        helpIcon?.classList.add("d-none");
        userInitials?.classList.add("d-none");
    }

    /**
     * Centers the header content.
     * @returns {void} Nothing.
     */
    function centerHeaderContent() {
        const header = document.querySelector(".header");
        const topBar = document.querySelector(".topBar");
        if (header) {
            header.style.display = "flex";
            header.style.alignItems = "center";
        }
        if (topBar) {
            topBar.style.display = "flex";
            topBar.style.justifyContent = "center";
        }
    }
})();
