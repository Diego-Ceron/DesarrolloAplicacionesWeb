const THEME_KEY = "medicitas-theme"

function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
}

function getSavedTheme() {
    return localStorage.getItem(THEME_KEY) || "light";
}

function saveTheme(theme) {
    localStorage.setItem(THEME_KEY, theme);
    applyTheme(theme);
}

const themeButton = document.getElementById("theme-button");

if (themeButton) {
    themeButton.addEventListener("click", () => {
        const currentTheme = getSavedTheme();
        const newTheme = currentTheme === "light" ? "dark" : "light";

        saveTheme(newTheme);
    });
}

applyTheme(getSavedTheme());