# Laro ng Lahi Desktop Application

This directory contains the configuration to run **Laro ng Lahi** as a desktop application using **Electron**.

## Prerequisites

Since this application relies on the existing PHP backend, you must have **XAMPP** (or similar) running.
1. Start **Apache** and **MySQL** in XAMPP Control Panel.
2. Ensure you can access the game at `http://localhost/laro_ng_lahi/`.

## Setup Instructions

The following tools are required to build the desktop app:

1.  **Install Node.js**:
    - Download and install the LTS version from [nodejs.org](https://nodejs.org/).
    - This will install both `node` and `npm`.

2.  **Install Dependencies**:
    - Open your terminal (Command Prompt or PowerShell) in this folder (`c:\xampp\htdocs\laro_ng_lahi`).
    - Run the following command:
      ```bash
      npm install
      ```

## Running the App

To test the desktop application locally:

```bash
npm start
```

This will open a dedicated window for the game. If it shows a "Connection Failed" error, make sure your XAMPP server is running.

## Building the App (Creating .exe)

To create a distributable installer (e.g., for Windows):

```bash
npm run dist
```

The output file (installer or executable) will be found in the `dist` folder.
