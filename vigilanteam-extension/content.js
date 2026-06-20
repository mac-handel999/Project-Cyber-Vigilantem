chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "INJECT_THREAT_BANNER") {
        
        // Block duplicate warning nodes if already rendered
        if (document.getElementById('vigilanteam-alert-overlay')) return;

        // Build a persistent fullscreen warning overlay frame
        const overlay = document.createElement('div');
        overlay.id = 'vigilanteam-alert-overlay';
        
        // Applying strict structural inline styles to override original target site styling
        Object.assign(overlay.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100vw',
            height: '100vh',
            backgroundColor: '#020205',
            color: '#ff3366',
            zIndex: '2147483647', // Maximizes depth visibility to overlay all elements
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            fontFamily: '"Segoe UI", system-ui, sans-serif',
            padding: '30px',
            boxSizing: 'border-box',
            textAlign: 'center'
        });

        overlay.innerHTML = `
            <div style="border: 2px solid #ff3366; padding: 40px; border-radius: 12px; background-color: #0b0c10; max-width: 600px; box-shadow: 0 0 30px rgba(255, 51, 102, 0.25);">
                <h1 style="font-size: 2.2rem; margin: 0 0 15px 0; color: #fff; letter-spacing: 2px;">⚠️ THREAT VECTOR INTERCEPTED</h1>
                <p style="color: #ffaa00; font-weight: bold; text-transform: uppercase; margin-bottom: 20px; font-size: 0.9rem; letter-spacing: 1px;">
                    Category Classification: ${message.reason}
                </p>
                <p style="color: #cbd5e1; font-size: 1rem; line-height: 1.6; margin-bottom: 25px;">
                    Project Cyber Vigilan-Team has identified the target resource <span style="color: #ff3366; font-family: monospace; word-break: break-all;">${message.targetUrl}</span> as dangerous. Navigating further may expose credentials or compromise system assets.
                </p>
                <button id="abortNavBtn" style="background-color: transparent; border: 2px solid #00ffcc; color: #00ffcc; padding: 12px 30px; font-weight: bold; border-radius: 4px; cursor: pointer; transition: 0.3s; font-size: 1rem;">
                    ABORT TRAFFIC AND RETURN
                </button>
            </div>
        `;

        document.body.appendChild(overlay);

        // Attach tactical click listener to safely retreat back into browsing safety logs
        document.getElementById('abortNavBtn').addEventListener('click', () => {
            window.history.back();
            // Fallback strategy if back trajectory index historical entry is empty
            setTimeout(() => { window.location.href = 'about:blank'; }, 300);
        });
    }
});