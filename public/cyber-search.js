
let BACKEND_URL = '/api/research'; 

const currentHost = window.location.hostname;
const currentPort = window.location.port;

if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
    // If your Live Server is running on port 5500, point it directly to the Express server on 5000
    if (currentPort === '5500') {
        BACKEND_URL = 'http://localhost:5500/api/research';
    } else if (currentPort === '6700') {
        BACKEND_URL = 'http://localhost:6700/api/research';
    } else {
        BACKEND_URL = 'http://localhost:5500/api/research';
    }
}




async function runResearch() {
            const query = document.getElementById('query').value;
            const output = document.getElementById('output');
            output.innerText = "Scanning threat intelligence...";

            const response = await fetch( BACKEND_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query })
            });

            const data = await response.json();
            output.innerText = data.report;
        }