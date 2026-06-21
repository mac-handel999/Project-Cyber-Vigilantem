document.addEventListener('DOMContentLoaded', () => {
    const targetInput = document.getElementById('targetInput');
    const scanBtn = document.getElementById('scanBtn');
    
    const ui = {
        reconState: document.getElementById('reconState'),
        status: document.getElementById('techStatus'),
        server: document.getElementById('techServer'),
        html: document.getElementById('techHtml'),
        title: document.getElementById('techTitle'),
        library: document.getElementById('techLibrary'),
        cms: document.getElementById('techCms'),
        author: document.getElementById('techAuthor'),
        hsts: document.getElementById('techHsts'),
        headers: document.getElementById('techHeaders')
    };

    // Replace this string with your live backend server address when deploying to Vercel
    const BACKEND_ENDPOINT = 'http://localhost:5500/api/analyze-web';

    async function dispatchTargetReconnaissance() {
        const rawUrlValue = targetInput.value.trim();

        if (!rawUrlValue) {
            ui.reconState.innerText = "Error: Empty Input";
            ui.reconState.style.borderColor = "#ff3366";
            ui.reconState.style.color = "#ff3366";
            return;
        }

        // Set layout processing loader indicators
        ui.reconState.innerText = "Analyzing...";
        ui.reconState.style.borderColor = "#ffaa00";
        ui.reconState.style.color = "#ffaa00";

        try {
            const response = await fetch(BACKEND_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetUrl: rawUrlValue })
            });

            if (!response.ok) throw new Error("Backend infrastructure rejected request loop context.");
            const data = await response.json();

            // Render returned data blocks out of the proxy payload cleanly into fields
            ui.status.innerText = `[${data.status}] OK / Redirect Resolved`;
            ui.server.innerText = data.httpServer;
            ui.html.innerText = data.htmlVersion;
            ui.title.innerText = data.title;
            ui.library.innerText = data.framework;
            ui.cms.innerText = data.generator;
            ui.author.innerText = data.author;
            ui.hsts.innerText = data.hsts;
            ui.headers.innerText = data.uncommonHeaders;

            // Success configuration updates
            ui.reconState.innerText = "Analysis Clear";
            ui.reconState.style.borderColor = "var(--neon-mint)";
            ui.reconState.style.color = "var(--neon-mint)";

        } catch (err) {
            console.error("[!] Recon network transit exception:", err.message);
            ui.reconState.innerText = "Sync Fault";
            ui.reconState.style.borderColor = "#ff3366";
            ui.reconState.style.color = "#ff3366";
            
            // Clear out interface strings to notify structural failure states
            ui.status.innerText = "Failed to establish telemetry path.";
            ui.server.innerText = "Unavailable";
            ui.title.innerText = "Host unreachable or blocking inspection requests.";
            ui.headers.innerText = "None mapped.";
        }
    }

    scanBtn.addEventListener('click', dispatchTargetReconnaissance);
    
    // Add event hook to allow execution by hitting the keyboard Enter key directly inside the input bar
    targetInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') dispatchTargetReconnaissance();
    });
});