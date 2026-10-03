/**
 * Security Roadmap Generator — client controller
 *
 * The previous version built the roadmap with template-literal innerHTML, which
 * let AI-supplied titles and URLs be injected as markup, and it never restored
 * the saved tick state even though it stored it. This version builds the DOM
 * explicitly and persists per-week completion.
 */

const BACKEND_URL = '/api/generate-roadmap';

const ROADMAP_KEY = 'pcv-roadmap';
const PROGRESS_KEY = 'pcv-roadmap-progress';

const form = document.getElementById('roadmap-form');
const goalInput = document.getElementById('goal');
const output = document.getElementById('roadmap-output');
const generateBtn = document.getElementById('generate-btn');
const clearBtn = document.getElementById('clear-btn');

function readStore(key) {
    try {
        return JSON.parse(localStorage.getItem(key));
    } catch (err) {
        return null;
    }
}

function writeStore(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
        /* Storage unavailable; the roadmap still renders for this session. */
    }
}

function message(text, isError) {
    const box = document.createElement('div');
    box.className = 'roadmap-message' + (isError ? ' roadmap-message--error' : '');
    box.textContent = text;
    output.replaceChildren(box);
}

/** Only allow http(s) links to be rendered as anchors. */
function safeLink(href) {
    try {
        const parsed = new URL(href, window.location.origin);
        return (parsed.protocol === 'http:' || parsed.protocol === 'https:') ? parsed.href : null;
    } catch (err) {
        return null;
    }
}

function resourceGroup(title, icon, items) {
    if (!Array.isArray(items) || items.length === 0) return null;

    const section = document.createElement('div');
    section.className = 'resource-section';

    const heading = document.createElement('h4');
    heading.textContent = title + ' ' + icon;

    const list = document.createElement('div');
    list.className = 'resource-list';

    const ul = document.createElement('ul');

    items.forEach(function (item) {
        const href = safeLink(item && item.link);
        const label = document.createElement('li');

        if (href) {
            const anchor = document.createElement('a');
            anchor.href = href;
            anchor.target = '_blank';
            anchor.rel = 'noopener noreferrer';
            anchor.textContent = (item && item.title) || href;
            label.append(anchor);
        } else {
            label.textContent = (item && item.title) || 'Unavailable resource';
        }

        ul.append(label);
    });

    list.append(ul);
    section.append(heading, list);
    return section;
}

function renderRoadmap(weeks, progress) {
    const done = Array.isArray(progress) ? progress : [];

    const cards = weeks.map(function (week, index) {
        const card = document.createElement('article');
        card.className = 'roadmap-item' + (done[index] ? ' is-complete' : '');
        card.dataset.reveal = String(Math.min(index * 40, 240));

        const heading = document.createElement('h3');
        heading.dataset.week = 'Week ' + (week.week ?? index + 1);
        heading.append(document.createTextNode(week.topic || 'Study block'));

        card.append(heading);

        const videos = resourceGroup('Video tutorials', '▶', week.videos);
        const reading = resourceGroup('Courses & docs', '◈', week.web);

        if (videos) card.append(videos);
        if (reading) card.append(reading);
        if (!videos && !reading) {
            const empty = document.createElement('p');
            empty.className = 'resource-section';
            empty.textContent = 'No resources returned for this week.';
            card.append(empty);
        }

        const label = document.createElement('label');
        label.className = 'week-done';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = Boolean(done[index]);
        checkbox.addEventListener('change', function () {
            card.classList.toggle('is-complete', checkbox.checked);
            persistProgress();
        });

        label.append(checkbox, document.createTextNode('Mark week complete'));
        card.append(label);

        return card;
    });

    output.replaceChildren(...cards);
    if (window.PCVReveal) window.PCVReveal.refresh();
}

function persistProgress() {
    const state = Array.from(output.querySelectorAll('input[type="checkbox"]')).map(function (box) {
        return box.checked;
    });
    writeStore(PROGRESS_KEY, state);
}

async function generate() {
    const goal = goalInput.value.trim();

    if (!goal) {
        message('Enter a cybersecurity goal to generate a roadmap.', true);
        goalInput.focus();
        return;
    }

    generateBtn.disabled = true;
    message('Architecting your curriculum...', false);

    try {
        const response = await fetch(BACKEND_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ goal: goal })
        });

        if (!response.ok) {
            throw new Error('Backend returned HTTP ' + response.status);
        }

        const data = await response.json();
        const weeks = Array.isArray(data.weeks) ? data.weeks : [];

        if (!weeks.length) {
            message('The generator returned no roadmap. Try a more specific goal.', true);
            return;
        }

        writeStore(ROADMAP_KEY, weeks);
        writeStore(PROGRESS_KEY, []);
        renderRoadmap(weeks, []);
    } catch (err) {
        message('Could not reach the roadmap generator. Details: ' + err.message, true);
        console.error('[!] Roadmap generation failed:', err);
    } finally {
        generateBtn.disabled = false;
    }
}

function clearAll() {
    if (!confirm('Clear the entire saved roadmap and progress? This cannot be undone.')) return;

    try {
        localStorage.removeItem(ROADMAP_KEY);
        localStorage.removeItem(PROGRESS_KEY);
    } catch (err) {
        /* Nothing to clean up if storage is unavailable. */
    }

    output.replaceChildren();
    goalInput.value = '';
}

form.addEventListener('submit', function (event) {
    event.preventDefault();
    generate();
});

clearBtn.addEventListener('click', clearAll);

document.querySelectorAll('[data-goal]').forEach(function (chip) {
    chip.addEventListener('click', function () {
        goalInput.value = chip.getAttribute('data-goal');
        generate();
    });
});

window.addEventListener('load', function () {
    const saved = readStore(ROADMAP_KEY);
    if (Array.isArray(saved) && saved.length) {
        renderRoadmap(saved, readStore(PROGRESS_KEY));
    }
});