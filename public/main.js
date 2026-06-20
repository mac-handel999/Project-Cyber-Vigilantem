
// ==========================================
// DYNAMIC PORT & ENVIRONMENT DETECTION
// ==========================================


let BACKEND_URL = '/api/check-url'; 

const currentHost = window.location.hostname;
const currentPort = window.location.port;

if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
    // If your Live Server is running on port 5500, point it directly to the Express server on 5000
    if (currentPort === '5500') {
        BACKEND_URL = 'http://localhost:5500/api/check-url';
    } else if (currentPort === '6700') {
        BACKEND_URL = 'http://localhost:6700/api/check-url';
    } else {
        BACKEND_URL = 'http://localhost:5500/api/check-url';
    }
}






// let BACKEND_URL = '/api/check-url'; // Default for Vercel production

// // Check where the frontend is currently loading from
// const currentHost = window.location.hostname;
// const currentPort = window.location.port;

// if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
//     // If you are testing on your laptop VS Code or phone's local network IP
//     if (currentPort === '5000') {
//         BACKEND_URL = 'http://localhost:5000/api/check-url'; // Your VS Code standard backend port
//     } else {
//          BACKEND_URL = 'http://localhost:6700/api/check-url'; // Your Phone's IDE Port
       
//     }
// }

// Strict URL Format Validator
function isValidURL(string) {
    const urlPattern = new RegExp(
        '^(https?:\\/\\/)?' + 
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + 
        '((\\d{1,3}\\.){3}\\d{1,3}))' + 
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + 
        '(\\?[;&a-z\\d%_.~+=-]*)?' + 
        '(\\#[-a-z\\d_]*)?$', 'i'
    );
    return urlPattern.test(string);
}

// Main Execution Event Listener
document.getElementById('search-btn').addEventListener('click', async () => {
    const urlInput = document.getElementById('input-bar').value.trim();
    const resultDiv = document.getElementById('resultContainer');
    
    if (!urlInput) {
        alert("Please enter a URL first.");
        return;
    }
    
    if (!isValidURL(urlInput)) {
        resultDiv.style.display = 'block';
        resultDiv.style.backgroundColor = '#fff3cd';
        resultDiv.style.color = '#856404';
        resultDiv.style.border = '1px solid #ffeeba';
        resultDiv.innerHTML = "<strong>Invalid Input Structure:</strong> Please enter a proper web link address (e.g., 'mysite.com').";
        return; 
    }

    // Processing Status
    resultDiv.style.display = 'block';
    resultDiv.style.backgroundColor = '#e2e3e5';
    resultDiv.style.color = '#383d41';
    resultDiv.style.border = '1px solid #d6d8db';
    resultDiv.innerHTML = `<div class="spinner"></div> Scanning URL vectors via Google Cloud Protection Index...`;

    try {
        const res = await fetch(BACKEND_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ urlToCheck: urlInput })
        });
        const data = await res.json();

        if (data.matches) {
            // UNCLEAN / MALICIOUS THREAT DETECTED
            resultDiv.style.backgroundColor = '#f8d7da';
            resultDiv.style.color = '#721c24';
            resultDiv.style.border = '1px solid #f5c6cb';
            
            // Extract rich data points directly out of the Google response array
            const threatDetails = data.matches.map(match => {
                return `
                    <li><strong>Threat Category:</strong> ${match.threatType.replace('_', ' ')}</li>
                    <li><strong>Target Platform:</strong> ${match.platformType.replace('_', ' ')}</li>
                    <li><strong>Indicator Type:</strong> ${match.threatEntryType}</li>
                `;
            }).join('');

            resultDiv.innerHTML = `
                <div style="font-size: 18px; margin-bottom: 8px;">🛑 <strong>CRITICAL SECURITY ALERT!</strong></div>
                <p>This link is blacklisted and classified unsafe by Google Safe Browsing engines.</p>
                <hr style="border-top: 1px solid #f5c6cb; margin: 10px 0;">
                <strong style="text-decoration: underline;">Threat Intelligence Logs:</strong>
                <ul style="margin-top: 8px; padding-left: 20px; list-style-type: square;">
                    ${threatDetails}
                </ul>
                <p style="font-size: 13px; margin-top: 10px; font-style: italic;">Recommendation: Close the tab immediately. Do not input personal identifiers, keys, or passwords on the target interface.</p>
            `;
        } else {
            // CLEAN / SECURE RESPONSE
            resultDiv.style.backgroundColor = '#d4edda';
            resultDiv.style.color = '#155724';
            resultDiv.style.border = '1px solid #c3e6cb';
            
            // Get clean contextual timestamp details
            const scanTime = new Date().toLocaleTimeString();

            resultDiv.innerHTML = `
                <div style="font-size: 18px; margin-bottom: 8px;">✅ <strong>SCAN CLEAN / NO THREATS FOUND</strong></div>
                <p>The system successfully processed your verification request against current threat matrices.</p>
                <hr style="border-top: 1px solid #c3e6cb; margin: 10px 0;">
                <ul style="padding-left: 20px; list-style-type: circle;">
                    <li><strong>Target URL Status:</strong> Verified Unflagged</li>
                    <li><strong>Database Match Status:</strong> 0 records matched (No active malware signatures or phishing nodes found)</li>
                    <li><strong>Scan Completion Time:</strong> ${scanTime}</li>
                    <li><strong>Verification Authority:</strong> Google Safe Browsing v4 Network API</li>
                </ul>
                <p style="font-size: 13px; margin-top: 10px; font-style: italic;">Note: While this URL is not currently blacklisted, always double-check the sender's identity before interacting with external links.</p>
            `;
        }
    } catch (err) {
        resultDiv.style.backgroundColor = '#f8d7da';
        resultDiv.style.color = '#721c24';
        resultDiv.style.border = '1px solid #f5c6cb';
        resultDiv.innerHTML = `
            <strong>System Error:</strong> Unable to establish contact with the backend pipeline proxy.<br>
            <span style="font-size: 12px; font-family: monospace;">Attempted Endpoint target: ${BACKEND_URL}</span>
        `;
    }
});

























// const API_URL = 'http://localhost:5000/api/check-url';
// const API_URL_2 = 'http://localhost:6700/api/check-url';
// // Automatically points to your current hosted Vercel domain path
// const BACKEND_URL = '/api/check-url';


// // 1. New Helper Function to validate URLs
// function isValidURL(string) {
//     // This pattern checks for standard URL structures (with or without http/https)
//     const urlPattern = new RegExp(
//         '^(https?:\\/\\/)?' + // optional protocol (http or https)
//         '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
//         '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
//         '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
//         '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
//         '(\\#[-a-z\\d_]*)?$', 'i' // fragment locator
//     );
    
//     return urlPattern.test(string);
// }

// // 2. Your main function
// async function checkUrlSafety() {
//     const inputElement = document.getElementById('input-bar'); 
//     const resultDiv = document.getElementById('resultContainer');

//     if (!inputElement || !resultDiv) {
//         console.error("Missing HTML elements!");
//         return;
//     }

//     const urlInput = inputElement.value.trim(); // .trim() removes accidental spaces

//     // Check if the input is completely empty
//     if (!urlInput) {
//         alert("Please enter a URL first!");
//         return;
//     }

//     // NEW: Check if the input is actually a valid URL structure
//     if (!isValidURL(urlInput)) {
//         resultDiv.style.display = 'block';
//         resultDiv.style.backgroundColor = '#fff3cd'; // Yellow warning box
//         resultDiv.style.color = '#856404';
//         resultDiv.innerHTML = "<strong>Invalid Input:</strong> Please enter a valid URL (e.g., 'example.com' or 'https://google.com').";
//         return; // STOP right here! Do not call the backend.
//     }

//     // If it passes validation, proceed to check with the server
//     resultDiv.style.display = 'block';
//     resultDiv.innerHTML = 'Checking with server...';

//     try {
//         const response = await fetch(API_URL, {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({ urlToCheck: urlInput }) 
//         });

//         const data = await response.json();

//         if (data.matches) {
//             resultDiv.style.backgroundColor = '#f8d7da';
//             resultDiv.style.color = '#721c24';
//             resultDiv.innerHTML = `<strong>Warning!</strong> Unsafe URL detected!`;
//         } else {
//             resultDiv.style.backgroundColor = '#d4edda';
//             resultDiv.style.color = '#155724';
//             resultDiv.innerHTML = "<strong>Safe!</strong> No threats detected.";
//         }

//     } catch (error) {
//         resultDiv.innerHTML = "Error connecting to backend server.";
//         console.error("Something went wrong:", error);
//     }
// }

// document.getElementById('search-btn').addEventListener('click', () => {
//     checkUrlSafety(); 
// });






























// // 1. Define your API URL at the VERY TOP of the file so all functions can see it
// const API_URL = 'http://localhost:5000/api/check-url';

// // 2. This is your main function to check the URL safety
// async function checkUrlSafety() {
//     const inputElement = document.getElementById('input-bar'); 
//     const resultDiv = document.getElementById('resultContainer');

//     // Make sure the HTML elements actually exist before using them
//     if (!inputElement || !resultDiv) {
//         console.error("Missing HTML elements! Check your IDs in index.html");
//         return;
//     }

//     const urlInput = inputElement.value; // Now urlInput is explicitly defined!

//     if (!urlInput) {
//         alert("Please enter a URL first!");
//         return;
//     }

//     resultDiv.style.display = 'block';
//     resultDiv.innerHTML = 'Checking with server...';

//     try {
//         // We use API_URL (defined at the top) and urlInput (defined above)
//         const response = await fetch(API_URL, {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({ urlToCheck: urlInput }) 
//         });

//         const data = await response.json();
//         console.log("Server response:", data);

//         // Display results to the user
//         if (data.matches) {
//             resultDiv.style.backgroundColor = '#f8d7da';
//             resultDiv.style.color = '#721c24';
//             resultDiv.innerHTML = `<strong>Warning!</strong> Unsafe URL detected!`;
//         } else {
//             resultDiv.style.backgroundColor = '#d4edda';
//             resultDiv.style.color = '#155724';
//             resultDiv.innerHTML = "<strong>Safe!</strong> No threats detected.";
//         }

//     } catch (error) {
//         resultDiv.innerHTML = "Error connecting to backend server.";
//         console.error("Something went wrong:", error);
//     }
// }

// // 3. Attach the function to your button click at the bottom
// document.getElementById('search-btn').addEventListener('click', () => {
//     checkUrlSafety(); 
// });