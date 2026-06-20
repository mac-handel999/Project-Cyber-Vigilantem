const PROXY_URL = 'http://localhost:5500/api/check-url';

chrome.webNavigation.onCommitted.addListener(async (details) => {
    if (details.frameId !== 0 || details.url.startsWith('chrome')) return;

    const currentUrl = details.url;
    console.log(`[-] Auditing link trajectory: ${currentUrl}`);

    try {
        const response = await fetch(PROXY_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ urlToCheck: currentUrl })
        });
        
        if (!response.ok) throw new Error(`HTTP Error Status: ${response.status}`);
        const data = await response.json();
        const statusText = data.statusText || 'Analysis Clear';

        // --- STEP 3 IMPLEMENTATION: ROLLING SESSION HISTORY LOG ---
        chrome.storage.local.get({ historyLog: [] }, (result) => {
            let logs = result.historyLog;
            
            // Push new scan entry to the top of the history index
            logs.unshift({
                url: currentUrl,
                status: statusText,
                isMalicious: data.isMalicious || false,
                timestamp: new Date().toLocaleTimeString()
            });

            // Keep only the most recent 5 security audit tracks
            if (logs.length > 5) logs.pop();

            chrome.storage.local.set({ 
                lastScannedUrl: currentUrl,
                scanStatus: statusText,
                historyLog: logs
            });
        });

        // --- STEP 1 IMPLEMENTATION: ACTIVE DISPATCH TO CONTENT INJECTOR ---
        if (data.isMalicious) {
            // Wait slightly for tab rendering layers to finish initializing before sending message payload
            setTimeout(() => {
                chrome.tabs.sendMessage(details.tabId, { 
                    action: "INJECT_THREAT_BANNER", 
                    targetUrl: currentUrl,
                    reason: data.matches ? data.matches[0].threatType : 'MALICIOUS_TARGET'
                }).catch(err => console.log("Tab layer context not ready to receive message yet."));
            }, 600);
        }

    } catch (err) {
        console.error('[!] Extension communication pipeline breakdown:', err.message);
    }
});