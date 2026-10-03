/**
 * PROJECT CYBER VIGILANTEEM — theme bootstrap
 *
 * Loaded synchronously in <head>, before the stylesheets, so the stored
 * theme is applied on the very first paint. This avoids the flash of the
 * wrong theme that a deferred script would cause.
 *
 * Keep in sync with theme.js (same storage key).
 */
(function () {
    try {
        var stored = localStorage.getItem('pcv-theme');
        var theme = (stored === 'light' || stored === 'dark')
            ? stored
            : (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches
                ? 'light'
                : 'dark');
        document.documentElement.setAttribute('data-theme', theme);
        document.documentElement.style.colorScheme = theme;
        // Signals that JS is running, so reveal animations may hide content
        // safely. Without this class the content stays visible.
        document.documentElement.classList.add('js-reveal');
    } catch (err) {
        document.documentElement.setAttribute('data-theme', 'dark');
    } finally {
        document.documentElement.classList.add('js-reveal');
    }
})();