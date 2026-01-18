const { app, BrowserWindow } = require('electron');
const path = require('path');
const { fork } = require('child_process');

let mainWindow;
let serverProcess;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 720,
        backgroundColor: '#2e2c29',
        icon: path.join(__dirname, 'public/assets/app_icon/laro_ng_lahi_app_icon.png'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
        },
        autoHideMenuBar: true
    });

    const SERVER_PORT = 3000;
    const appUrl = `http://localhost:${SERVER_PORT}`;

    // Start the Express server
    startServer();

    // Check if server is ready
    const checkServer = () => {
        const http = require('http');
        http.get(appUrl, (res) => {
            if (res.statusCode === 200 || res.statusCode === 302 || res.statusCode === 404) {
                mainWindow.loadURL(appUrl);
            } else {
                setTimeout(checkServer, 1000);
            }
        }).on('error', (err) => {
            setTimeout(checkServer, 1000);
        });
    };

    checkServer();

    mainWindow.webContents.on('did-fail-load', () => {
        // Retry logic or show error
        setTimeout(checkServer, 1000);
    });
}

function startServer() {
    if (serverProcess) return;

    const serverPath = path.join(__dirname, 'src/server.js');

    // Spawn server process
    serverProcess = fork(serverPath, [], {
        env: { ...process.env, PORT: 3000 },
        stdio: 'inherit'
    });

    serverProcess.on('error', (err) => {
        console.error('Failed to start server:', err);
    });
}

app.setAsDefaultProtocolClient('laronglahi');

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', (event, commandLine, workingDirectory) => {
        // Someone tried to run a second instance, we should focus our window.
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();

            // Handle deep link
            const url = commandLine.find(arg => arg.startsWith('laronglahi://'));
            if (url) handleDeepLink(url);
        }
    });

    app.whenReady().then(() => {
        createWindow();

        // Handle deep link on cold start (Windows)
        const url = process.argv.find(arg => arg.startsWith('laronglahi://'));
        if (url) {
            // Delay slightly to ensure window/server is ready
            setTimeout(() => handleDeepLink(url), 3000);
        }

        app.on('activate', () => {
            if (BrowserWindow.getAllWindows().length === 0) {
                createWindow();
            }
        });
    });
}

function handleDeepLink(url) {
    console.log("Deep link received:", url);
    try {
        // Expected format: laronglahi://reset-password?oobCode=XYZ
        const urlObj = new URL(url);
        const oobCode = urlObj.searchParams.get('oobCode');

        if (oobCode) {
            // Navigate the window to the reset page with the code
            const resetUrl = `http://localhost:3000/reset_new_password.html?oobCode=${oobCode}`;
            mainWindow.loadURL(resetUrl);
        }
    } catch (e) {
        console.error("Failed to parse deep link:", e);
    }
}

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('will-quit', () => {
    // Kill the server process when app quits
    if (serverProcess) {
        if (process.platform === 'win32') {
            try {
                const { execSync } = require('child_process');
                execSync(`taskkill /pid ${serverProcess.pid} /f /t`);
            } catch (e) {
                console.error('Failed to kill server process via taskkill:', e);
                serverProcess.kill();
            }
        } else {
            serverProcess.kill();
        }
        serverProcess = null;
    }
});
