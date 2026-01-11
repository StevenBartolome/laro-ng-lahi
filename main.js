const { app, BrowserWindow } = require('electron');
const http = require('http');
const path = require('path');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 720,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        },
        autoHideMenuBar: true
    });

    const appUrl = 'http://localhost/laro_ng_lahi/index.php';

    // Function to check if server is running
    const checkServer = () => {
        const req = http.get(appUrl, (res) => {
            // If we get a response, the server is up
            mainWindow.loadURL(appUrl);
        }).on('error', (e) => {
            // If error, load the local error page
            mainWindow.loadFile(path.join(__dirname, 'server_error.html'));
        });
    };

    checkServer();

    // Recheck on reload if we are on error page
    mainWindow.webContents.on('did-fail-load', () => {
        mainWindow.loadFile(path.join(__dirname, 'server_error.html'));
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
