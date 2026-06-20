
# 🛡️ Cyber VigilanTeam: Link Shield

An automated, background threat intelligence browser extension designed to audit active web navigation paths. By intercepting tab routing vectors in real time, it protects users against phishing networks, malware, and credential harvest zones before page interactions occur.

---

## 🚀 Key Features

* **Automated Target Inspection:** Hooks directly into Chrome's web navigation events to audit URLs instantly.
* **Real-Time Payload Interception:** Cross-references active host names with central proxy node engines query endpoints.
* **In-Page Threat Isolation:** Automatically injects a strict full-screen warning overlay across malicious targets, blocking traffic execution loops.
* **Rolling Inspection Logs:** Maintains an interactive session queue tracking the security telemetry configurations of your last 5 visited assets.
* **100% Client-Side Efficiency:** Runs on zero-weight vanilla JavaScript, preserving system processing resources.

---

## 📁 Repository Structure

```text
├── background.js     # Background service worker coordinating threat validation routing
├── content.js        # Content script handling in-page tactical DOM alert injections
├── popup.html        # Interactive telemetry dashboard dropdown panel layout
├── popup.js          # Client-side state manager reading stored session logs
├── manifest.json     # Chrome browser runtime permission rules configuration matrix
└── icon.png          # Active network radar branding visual asset (96x96 PNG)

```

---

## 🛠️ Free Manual Installation Guide

Because this extension is hosted as an open-source security package directly from this repository, you do not need the Chrome Web Store to install it. Follow these steps to deploy it manually:

### 1. Download and Extract the Files

* Click the green **`Code`** button at the top right of this repository page.
* Select **`Download ZIP`** from the dropdown options.
* Locate the downloaded archive file on your system, right-click, and select **`Extract / Unzip Here`**.

### 2. Activate Developer Privileges in Chrome

* Open Google Chrome and type the following navigation target into your address bar:
```text
chrome://extensions/

```


* In the upper right-hand corner of the extensions dashboard screen, locate the **`Developer mode`** toggle switch and flip it to **`ON`**.

### 3. Load the Unpacked Folder

* A new secondary button row will slide into view on the upper left. Click on **`Load unpacked`**.
* A system file browser menu window will open. Navigate to and select the extracted `vigilanteam-link-shield` project directory folder, then click **`Open`**.

The extension is now operational! Look up at your browser extension puzzle icon menu to pin the **Link Shield** dashboard to your browser toolbar.

---

## 📡 Backend Proxy Dependencies

This application communicates asynchronously with a secure, centralized API endpoint proxy router. If you are maintaining a local testing loop environment:

1. Ensure your local Node.js Express framework server (`server.js`) is listening actively on your designated port (e.g., `5500`).
2. Verify that your environment variables (`.env`) contain a valid connection signature token credential mapping for the Google Safe Browsing telemetry infrastructure registry.

---

## ⚖️ License and Security Disclaimers

This software suite is developed strictly for proactive network resource visibility, credential defense optimization, and open-source intelligence research metrics. Use responsibly to secure internal corporate perimeters or personal technical environments.

---

Created with ❤️ by the **{FABIAN CODES HQ}**

