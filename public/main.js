const API_URL = 'http://localhost:5000/api/check-url';
// Automatically points to your current hosted Vercel domain path
const BACKEND_URL = '/api/check-url';


// 1. New Helper Function to validate URLs
function isValidURL(string) {
    // This pattern checks for standard URL structures (with or without http/https)
    const urlPattern = new RegExp(
        '^(https?:\\/\\/)?' + // optional protocol (http or https)
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
        '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
        '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
        '(\\#[-a-z\\d_]*)?$', 'i' // fragment locator
    );
    
    return urlPattern.test(string);
}

// 2. Your main function
async function checkUrlSafety() {
    const inputElement = document.getElementById('input-bar'); 
    const resultDiv = document.getElementById('resultContainer');

    if (!inputElement || !resultDiv) {
        console.error("Missing HTML elements!");
        return;
    }

    const urlInput = inputElement.value.trim(); // .trim() removes accidental spaces

    // Check if the input is completely empty
    if (!urlInput) {
        alert("Please enter a URL first!");
        return;
    }

    // NEW: Check if the input is actually a valid URL structure
    if (!isValidURL(urlInput)) {
        resultDiv.style.display = 'block';
        resultDiv.style.backgroundColor = '#fff3cd'; // Yellow warning box
        resultDiv.style.color = '#856404';
        resultDiv.innerHTML = "<strong>Invalid Input:</strong> Please enter a valid URL (e.g., 'example.com' or 'https://google.com').";
        return; // STOP right here! Do not call the backend.
    }

    // If it passes validation, proceed to check with the server
    resultDiv.style.display = 'block';
    resultDiv.innerHTML = 'Checking with server...';

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ urlToCheck: urlInput }) 
        });

        const data = await response.json();

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

document.getElementById('search-btn').addEventListener('click', () => {
    checkUrlSafety(); 
});






























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