
// let dailyCount = 0;
// let lastResetDate = new Date().getDate();



// Function to generate the roadmap
async function generate() {
    const goal = document.getElementById('goal').value;
    const output = document.getElementById('roadmap-output');
    
    if (!goal) return alert("Please enter a cybersecurity goal.");
    
    output.innerHTML = "<em>Architecting your curriculum...</em>";

    try {
        const res = await fetch('/api/generate-roadmap', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ goal })
        });
        const data = await res.json();
        
        // Store current roadmap in localStorage so we can restore checkboxes after render
        localStorage.setItem('current-roadmap', JSON.stringify(data.weeks));
        renderRoadmap(data.weeks);
    } catch (err) {
        output.innerHTML = "Error: Could not connect to server.";
    }
}

// Function to render the roadmap and restore saved state
function renderRoadmap(weeks) {
    const output = document.getElementById('roadmap-output');
    output.innerHTML = weeks.map((w, index) => `
        <div class="roadmap-item">
            <h3>Week ${w.week}: ${w.topic}</h3>
            
            <div class="resource-section">
                <h4>📺 Video Tutorials</h4>
                <div class="resource-list">
                    <ul>${w.videos.map(v => `<li><a href="${v.link}" target="_blank">${v.title}</a></li>`).join('')}</ul>
                </div>
            </div>

            <div class="resource-section">
                <h4>🌐 Web Courses & Docs</h4>
                <div class="resource-list">
                    <ul>${w.web.map(web => `<li><a href="${web.link}" target="_blank">${web.title}</a></li>`).join('')}</ul>
                </div>
            </div>
            
            <label><input type="checkbox" onchange="saveProgress()"> Mark Week Complete</label>
        </div>
    `).join('');
}





// Save progress to LocalStorage
function saveProgress() {
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    const state = Array.from(checkboxes).map(c => c.checked);
    localStorage.setItem('roadmap-progress', JSON.stringify(state));
}

// Load progress on initial page load
window.onload = () => {
    const savedRoadmap = localStorage.getItem('current-roadmap');
    if (savedRoadmap) {
        renderRoadmap(JSON.parse(savedRoadmap));
    }
};


function clearAll() {
    if (confirm("Are you sure you want to clear your entire roadmap? This cannot be undone.")) {
        // 1. Clear Local Storage
        localStorage.removeItem('current-roadmap');
        localStorage.removeItem('roadmap-progress');
        
        // 2. Clear the DOM
        document.getElementById('roadmap-output').innerHTML = "";
        
        // 3. Optional: Clear the input field
        document.getElementById('goal').value = "";
        
        console.log("Data cleared successfully.");
    }
}