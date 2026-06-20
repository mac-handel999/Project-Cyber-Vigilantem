document.addEventListener('DOMContentLoaded', () => {
    const uiUrl = document.getElementById('uiUrl');
    const uiStatus = document.getElementById('uiStatus');
    const historyBox = document.getElementById('historyBox');

    // Fetch the stored application execution states
    chrome.storage.local.get(['lastScannedUrl', 'scanStatus', 'historyLog'], (data) => {
        
        // 1. Render Current Tab Status Metadata
        if (data.lastScannedUrl) {
            uiUrl.innerText = data.lastScannedUrl;
            uiStatus.innerText = data.scanStatus;
            
            if (data.scanStatus.toLowerCase().includes('malicious')) {
                uiStatus.classList.add('danger');
            } else {
                uiStatus.classList.remove('danger');
            }
        }

        // 2. Render Historical Session Logs
        if (data.historyLog && data.historyLog.length > 0) {
            historyBox.innerHTML = ''; // Wipe loading placeholder templates
            
            data.historyLog.forEach(logItem => {
                const card = document.createElement('div');
                card.className = `history-card ${logItem.isMalicious ? 'threat' : 'clear'}`;

                card.innerHTML = `
                    <div class="history-meta">
                        <span style="color: ${logItem.isMalicious ? '#ff3366' : '#00ffcc'}; font-weight: bold;">
                            ${logItem.status}
                        </span>
                        <span>${logItem.timestamp}</span>
                    </div>
                    <div class="history-url" title="${logItem.url}">${logItem.url}</div>
                `;
                historyBox.appendChild(card);
            });
        } else {
            historyBox.innerHTML = '<div style="font-size:0.8rem; color:#64748b; text-align:center; padding:10px;">No historical vector entries recorded.</div>';
        }
    });
});