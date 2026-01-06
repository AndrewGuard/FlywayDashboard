const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let serverProcess;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false
    },
    icon: path.join(__dirname, 'assets/icon.png')
  });

  // Create application menu
  const template = [
    {
      label: 'File',
      submenu: [
        { role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Documentation',
          click: async () => {
            const { shell } = require('electron');
            await shell.openExternal('https://github.com/AndrewGuard/FlywayDashboard');
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  // Determine the correct path for the server
  const isDev = !app.isPackaged;
  const serverPath = isDev
    ? path.join(__dirname, 'server', 'index.js')
    : path.join(process.resourcesPath, 'server', 'index.js');

  // Start the Express server
  console.log('Starting server from:', serverPath);
  serverProcess = spawn('node', [serverPath], {
    cwd: path.dirname(serverPath),
    env: { ...process.env, PORT: '3001' }
  });

  serverProcess.stdout.on('data', (data) => {
    console.log(`Server: ${data}`);
  });

  serverProcess.stderr.on('data', (data) => {
    console.error(`Server Error: ${data}`);
  });

  // Wait for server to start, then load the app
  setTimeout(() => {
    if (isDev) {
      // In development, load from webpack dev server
      mainWindow.loadURL('http://localhost:3000');
      // Open DevTools in development
      mainWindow.webContents.openDevTools();
    } else {
      // In production, load from build folder
      mainWindow.loadFile(path.join(__dirname, 'build', 'index.html'));
    }
  }, 2000);

  // Handle window close
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Create window when app is ready
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Kill server process when app quits
app.on('before-quit', () => {
  if (serverProcess) {
    console.log('Stopping server...');
    serverProcess.kill();
  }
});

// Handle app quit
app.on('will-quit', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
});
