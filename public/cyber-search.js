async function runResearch() {
            const query = document.getElementById('query').value;
            const output = document.getElementById('output');
            output.innerText = "Scanning threat intelligence...";

            const response = await fetch('/api/research', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query })
            });

            const data = await response.json();
            output.innerText = data.report;
        }