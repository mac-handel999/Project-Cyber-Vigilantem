/**
 * PROJECT CYBER VIGILANTEEM — theme + shell controller
 *
 * Responsibilities:
 *  1. Resolve the initial theme (stored preference, else OS preference)
 *  2. Toggle dark/light and persist the choice
 *  3. Mobile navigation disclosure
 *  4. Scroll-reveal for [data-reveal] elements
 *
 * The first paint is protected by theme-boot.js, loaded synchronously in
 * each page's <head>. This file only handles interaction.
 */
(function () {
    'use strict';

    var STORAGE_KEY = 'pcv-theme';
    var root = document.documentElement;

    function storedTheme() {
        try {
            return localStorage.getItem(STORAGE_KEY);
        } catch (err) {
            return null;
        }
    }

    function storeTheme(theme) {
        try {
            localStorage.setItem(STORAGE_KEY, theme);
        } catch (err) {
            /* Storage unavailable (private mode); the toggle still works for this session. */
        }
    }

    function applyTheme(theme) {
        root.setAttribute('data-theme', theme);
        root.style.colorScheme = theme;

        document.querySelectorAll('[data-theme-toggle]').forEach(function (btn) {
            var label = btn.querySelector('[data-theme-label]');
            btn.setAttribute('aria-label',
                theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
            btn.setAttribute('title',
                theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
            if (label) {
                label.textContent = theme === 'dark' ? 'Dark' : 'Light';
            }
        });

        /* Keep the browser chrome / mobile status bar in step with the theme. */
        var meta = document.querySelector('meta[name="theme-color"]');
        if (meta) {
            meta.setAttribute('content', theme === 'dark' ? '#04070f' : '#eef3fb');
        }
    }

    function currentTheme() {
        return root.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    }

    function setupThemeToggle() {
        applyTheme(currentTheme());

        document.querySelectorAll('[data-theme-toggle]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var next = currentTheme() === 'dark' ? 'light' : 'dark';
                applyTheme(next);
                storeTheme(next);
            });
        });

        /* Follow the OS only while the visitor has not made an explicit choice. */
        if (window.matchMedia) {
            var query = window.matchMedia('(prefers-color-scheme: light)');
            var onChange = function (event) {
                if (!storedTheme()) {
                    applyTheme(event.matches ? 'light' : 'dark');
                }
            };
            if (query.addEventListener) {
                query.addEventListener('change', onChange);
            } else if (query.addListener) {
                query.addListener(onChange);
            }
        }
    }

    function setupNavToggle() {
        var toggle = document.querySelector('[data-nav-toggle]');
        var nav = document.getElementById('site-nav');
        if (!toggle || !nav) return;

        toggle.addEventListener('click', function () {
            var open = nav.classList.toggle('is-open');
            toggle.setAttribute('aria-expanded', String(open));
        });

        /* Collapse the menu after navigating to an in-page or cross-page target. */
        nav.addEventListener('click', function (event) {
            if (event.target.closest('a')) {
                nav.classList.remove('is-open');
                toggle.setAttribute('aria-expanded', 'false');
            }
        });
    }

    var revealObserver = null;

    function revealNow(el) {
        if (el.classList.contains('is-revealed')) return;
        var delay = parseInt(el.getAttribute('data-reveal'), 10) || 0;
        el.style.animationDelay = delay + 'ms';
        el.classList.add('is-revealed');
        if (revealObserver) revealObserver.unobserve(el);
    }

    function revealAll() {
        Array.prototype.forEach.call(document.querySelectorAll('[data-reveal]'), revealNow);
    }

    function setupReveal() {
        // Content must never depend on this observer firing
        document.documentElement.classList.add('js-reveal');

        var items = document.querySelectorAll('[data-reveal]');
        if (!items.length) return;

        if (!('IntersectionObserver' in window)) {
            revealAll();
            return;
        }

        // The bottom margin is positive, not negative: it extends the trigger
        // zone below the fold so content that already sits on screen is never
        // left stranded at opacity 0 waiting for a scroll that may not come.
        revealObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                revealNow(entry.target);
            });
        }, { rootMargin: '0px 0px 10% 0px', threshold: 0 });

        items.forEach(function (el) { revealObserver.observe(el); });

        // Safety nets. theme-boot.js sets .js-reveal unconditionally, so if
        // this file fails to run the page would otherwise stay blank forever.
        // Anything already on screen reveals at once, and a final timer reveals
        // whatever is left regardless of observer behaviour.
        items.forEach(function (el) {
            var r = el.getBoundingClientRect();
            if (r.top < window.innerHeight && r.bottom > 0) revealNow(el);
        });

        window.setTimeout(revealAll, 3000);
    }

    /**
     * Re-scan for [data-reveal] elements added after first paint.
     * Content modules (e.g. a generated roadmap) call this after rendering.
     */
    function refreshReveal() {
        if (!revealObserver) {
            // No observer means setupReveal bailed out; reveal directly rather
            // than leaving freshly rendered content stuck at opacity 0.
            revealAll();
            return;
        }
        document.querySelectorAll('[data-reveal]:not(.is-revealed)').forEach(function (el) {
            revealObserver.observe(el);
            var r = el.getBoundingClientRect();
            if (r.top < window.innerHeight && r.bottom > 0) revealNow(el);
        });
    }

    window.PCVReveal = { refresh: refreshReveal };

    function init() {
        setupThemeToggle();
        setupNavToggle();
        setupReveal();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();