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
        // icon: path.join(__dirname, 'public/assets/icons/icon.png'), // Ensure icon exists or remove
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

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('will-quit', () => {
    // Kill the server process when app quits
    if (serverProcess) {
        serverProcess.kill();
        serverProcess = null;
    }
});
