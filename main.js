// 1. Define your API URL at the VERY TOP of the file so all functions can see it
const API_URL = 'http://localhost:5000/api/check-url';

// 2. This is your main function to check the URL safety
async function checkUrlSafety() {
    const inputElement = document.getElementById('input-bar'); 
    const resultDiv = document.getElementById('resultContainer');

    // Make sure the HTML elements actually exist before using them
    if (!inputElement || !resultDiv) {
        console.error("Missing HTML elements! Check your IDs in index.html");
        return;
    }

    const urlInput = inputElement.value; // Now urlInput is explicitly defined!

    if (!urlInput) {
        alert("Please enter a URL first!");
        return;
    }

    resultDiv.style.display = 'block';
    resultDiv.innerHTML = 'Checking with server...';

    try {
        // We use API_URL (defined at the top) and urlInput (defined above)
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ urlToCheck: urlInput }) 
        });

        const data = await response.json();
        console.log("Server response:", data);

        // Display results to the user
        if (data.matches) {
            resultDiv.style.backgroundColor = '#f8d7da';
            resultDiv.style.color = '#721c24';
            resultDiv.innerHTML = `<strong>Warning!</strong> Unsafe URL detected!`;
        } else {
            resultDiv.style.backgroundColor = '#d4edda';
            resultDiv.style.color = '#155724';
            resultDiv.innerHTML = "<strong>Safe!</strong> No threats detected.";
        }

    } catch (error) {
        resultDiv.innerHTML = "Error connecting to backend server.";
        console.error("Something went wrong:", error);
    }
}

// 3. Attach the function to your button click at the bottom
document.getElementById('search-btn').addEventListener('click', () => {
    checkUrlSafety(); 
});