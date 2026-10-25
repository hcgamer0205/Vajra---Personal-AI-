import { app, BrowserWindow, ipcMain, shell, dialog } from 'electron';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { exec, execFile } from 'child_process';

// Keep global reference of window to prevent garbage collection
let mainWindow: BrowserWindow | null = null;

// Approved Windows Applications Whitelist
const APPROVED_APPS: Record<string, { winCmd: string; displayName: string; fallbackUrls?: string[] }> = {
  calculator: { winCmd: 'calc.exe', displayName: 'Calculator' },
  calc: { winCmd: 'calc.exe', displayName: 'Calculator' },
  notepad: { winCmd: 'notepad.exe', displayName: 'Notepad' },
  notes: { winCmd: 'notepad.exe', displayName: 'Notepad' },
  'file explorer': { winCmd: 'explorer.exe', displayName: 'File Explorer' },
  explorer: { winCmd: 'explorer.exe', displayName: 'File Explorer' },
  files: { winCmd: 'explorer.exe', displayName: 'File Explorer' },
  terminal: { winCmd: 'wt.exe', displayName: 'Windows Terminal' },
  powershell: { winCmd: 'powershell.exe', displayName: 'PowerShell' },
  cmd: { winCmd: 'cmd.exe', displayName: 'Command Prompt' },
  chrome: { winCmd: 'chrome.exe', displayName: 'Google Chrome' },
  browser: { winCmd: 'msedge.exe', displayName: 'Microsoft Edge' },
  edge: { winCmd: 'msedge.exe', displayName: 'Microsoft Edge' },
  paint: { winCmd: 'mspaint.exe', displayName: 'Paint' },
  taskmgr: { winCmd: 'taskmgr.exe', displayName: 'Task Manager' },
  'task manager': { winCmd: 'taskmgr.exe', displayName: 'Task Manager' },
};

function getSpecialFolders() {
  const home = os.homedir();
  return {
    home,
    documents: path.join(home, 'Documents'),
    downloads: path.join(home, 'Downloads'),
    desktop: path.join(home, 'Desktop'),
    pictures: path.join(home, 'Pictures'),
    music: path.join(home, 'Music'),
    videos: path.join(home, 'Videos'),
    appData: path.join(home, 'AppData', 'Roaming', 'VAJRA'),
  };
}

/**
 * Resolve target path securely, normalizing shortcuts like "Documents", "Downloads", "~"
 */
function resolveSafePath(inputPath: string): string {
  if (!inputPath || inputPath.trim() === '') {
    return os.homedir();
  }

  const special = getSpecialFolders();
  const trimmed = inputPath.trim();

  const lower = trimmed.toLowerCase();
  if (lower === 'documents' || lower === 'my documents' || lower === 'docs') {
    return special.documents;
  }
  if (lower === 'downloads' || lower === 'my downloads') {
    return special.downloads;
  }
  if (lower === 'desktop') {
    return special.desktop;
  }
  if (lower === 'home' || lower === '~') {
    return special.home;
  }

  if (trimmed.startsWith('~/') || trimmed.startsWith('~\\')) {
    return path.join(special.home, trimmed.slice(2));
  }

  if (path.isAbsolute(trimmed)) {
    return path.normalize(trimmed);
  }

  // If relative, default relative to Documents or Home
  return path.resolve(special.documents, trimmed);
}

function createWindow() {
  const iconPath = process.platform === 'win32'
    ? path.join(__dirname, '../build/icon.ico')
    : path.join(__dirname, '../public/icon.png');

  mainWindow = new BrowserWindow({
    width: 1366,
    height: 860,
    minWidth: 1024,
    minHeight: 680,
    backgroundColor: '#080104',
    title: 'VAJRA — Virtual Advanced Intelligence & Response Assistant',
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    frame: true,
    autoHideMenuBar: true,
    titleBarStyle: 'default',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      webSecurity: true,
    },
  });

  // Ensure External links open in default web browser, not inside the Electron webview
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  // Load the app
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  if (isDev && process.env.ELECTRON_START_URL) {
    mainWindow.loadURL(process.env.ELECTRON_START_URL);
  } else {
    const indexPath = path.join(__dirname, '../dist/index.html');
    if (fs.existsSync(indexPath)) {
      mainWindow.loadFile(indexPath);
    } else {
      mainWindow.loadURL('http://localhost:3000');
    }
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Register IPC Handlers
function setupIpcHandlers() {
  // Window Controls
  ipcMain.handle('window:minimize', () => {
    mainWindow?.minimize();
  });

  ipcMain.handle('window:maximize', () => {
    if (!mainWindow) return;
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  });

  ipcMain.handle('window:close', () => {
    mainWindow?.close();
  });

  ipcMain.handle('window:isMaximized', () => {
    return mainWindow?.isMaximized() ?? false;
  });

  // System Info
  ipcMain.handle('system:getSpecialFolders', () => {
    return getSpecialFolders();
  });

  ipcMain.handle('system:getInfo', () => {
    return {
      platform: os.platform(),
      arch: os.arch(),
      version: os.release(),
      hostname: os.hostname(),
      uptime: os.uptime(),
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
    };
  });

  // App Launcher (Approved List Only)
  ipcMain.handle('app:listApproved', () => {
    return Object.values(APPROVED_APPS).map((a) => a.displayName);
  });

  ipcMain.handle('app:open', async (_, appName: string) => {
    if (!appName || typeof appName !== 'string') {
      return { success: false, message: 'Invalid application identifier provided.' };
    }

    const key = appName.toLowerCase().trim();
    const appEntry = APPROVED_APPS[key] || Object.entries(APPROVED_APPS).find(([k]) => key.includes(k))?.[1];

    if (!appEntry) {
      return {
        success: false,
        message: `Application "${appName}" is not in the approved native launch matrix for security reasons.`,
      };
    }

    return new Promise((resolve) => {
      if (process.platform === 'win32') {
        exec(`start "" "${appEntry.winCmd}"`, (err) => {
          if (err) {
            // Try direct fallback
            exec(appEntry.winCmd, (err2) => {
              if (err2) {
                resolve({
                  success: false,
                  message: `Could not launch ${appEntry.displayName} on this system (${err2.message}).`,
                });
              } else {
                resolve({
                  success: true,
                  message: `Successfully dispatched and launched ${appEntry.displayName}.`,
                });
              }
            });
          } else {
            resolve({
              success: true,
              message: `Successfully launched native ${appEntry.displayName}.`,
            });
          }
        });
      } else {
        // macOS/Linux Fallback
        const genericCmd = process.platform === 'darwin' ? `open -a "${appEntry.displayName}"` : `xdg-open "${appEntry.winCmd}"`;
        exec(genericCmd, (err) => {
          if (err) {
            resolve({
              success: false,
              message: `Platform execution for ${appEntry.displayName} encountered error: ${err.message}`,
            });
          } else {
            resolve({
              success: true,
              message: `Launched ${appEntry.displayName}.`,
            });
          }
        });
      }
    });
  });

  // Web & URL Handling
  ipcMain.handle('web:openUrl', async (_, rawUrl: string) => {
    if (!rawUrl || typeof rawUrl !== 'string') {
      return { success: false, message: 'Invalid URL supplied.' };
    }

    let url = rawUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }

    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return { success: false, message: 'Only HTTP and HTTPS URLs are permitted.' };
      }

      await shell.openExternal(url);
      return {
        success: true,
        message: `Opened ${url} in default web browser.`,
        target: url,
      };
    } catch (err: any) {
      return { success: false, message: `Failed to open URL: ${err.message}` };
    }
  });

  ipcMain.handle('web:search', async (_, query: string) => {
    if (!query || typeof query !== 'string') {
      return { success: false, message: 'Invalid search query.' };
    }

    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query.trim())}`;
    try {
      await shell.openExternal(searchUrl);
      return {
        success: true,
        message: `Executed Google search for "${query}".`,
        target: searchUrl,
      };
    } catch (err: any) {
      return { success: false, message: `Web search execution failed: ${err.message}` };
    }
  });

  // Native File Operations
  ipcMain.handle('file:openPath', async (_, targetPath: string) => {
    const resolved = resolveSafePath(targetPath);
    if (!fs.existsSync(resolved)) {
      return { success: false, message: `Path does not exist: ${resolved}` };
    }

    try {
      const result = await shell.openPath(resolved);
      if (result) {
        return { success: false, message: `Could not open path: ${result}` };
      }
      return { success: true, message: `Opened: ${resolved}`, target: resolved };
    } catch (err: any) {
      return { success: false, message: `Failed to open path: ${err.message}` };
    }
  });

  ipcMain.handle('file:createFolder', async (_, folderPath: string) => {
    const resolved = resolveSafePath(folderPath);
    try {
      if (fs.existsSync(resolved)) {
        return { success: true, message: `Folder already exists at: ${resolved}`, target: resolved };
      }
      fs.mkdirSync(resolved, { recursive: true });
      return { success: true, message: `Created folder at: ${resolved}`, target: resolved };
    } catch (err: any) {
      return { success: false, message: `Failed to create folder: ${err.message}` };
    }
  });

  ipcMain.handle('file:createFile', async (_, filePath: string, content = '') => {
    const resolved = resolveSafePath(filePath);
    try {
      const parentDir = path.dirname(resolved);
      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
      }
      fs.writeFileSync(resolved, content, 'utf-8');
      return { success: true, message: `Created file at: ${resolved}`, target: resolved };
    } catch (err: any) {
      return { success: false, message: `Failed to create file: ${err.message}` };
    }
  });

  ipcMain.handle('file:moveFile', async (_, srcPath: string, destPath: string) => {
    const resolvedSrc = resolveSafePath(srcPath);
    let resolvedDest = resolveSafePath(destPath);

    if (!fs.existsSync(resolvedSrc)) {
      return { success: false, message: `Source file does not exist: ${resolvedSrc}` };
    }

    try {
      // If dest is directory, append filename
      if (fs.existsSync(resolvedDest) && fs.statSync(resolvedDest).isDirectory()) {
        resolvedDest = path.join(resolvedDest, path.basename(resolvedSrc));
      }
      fs.renameSync(resolvedSrc, resolvedDest);
      return { success: true, message: `Moved file to: ${resolvedDest}`, target: resolvedDest };
    } catch (err: any) {
      return { success: false, message: `Failed to move file: ${err.message}` };
    }
  });

  ipcMain.handle('file:copyFile', async (_, srcPath: string, destPath: string) => {
    const resolvedSrc = resolveSafePath(srcPath);
    let resolvedDest = resolveSafePath(destPath);

    if (!fs.existsSync(resolvedSrc)) {
      return { success: false, message: `Source file does not exist: ${resolvedSrc}` };
    }

    try {
      if (fs.existsSync(resolvedDest) && fs.statSync(resolvedDest).isDirectory()) {
        resolvedDest = path.join(resolvedDest, path.basename(resolvedSrc));
      }
      fs.copyFileSync(resolvedSrc, resolvedDest);
      return { success: true, message: `Copied file to: ${resolvedDest}`, target: resolvedDest };
    } catch (err: any) {
      return { success: false, message: `Failed to copy file: ${err.message}` };
    }
  });

  ipcMain.handle('file:renameFile', async (_, oldPath: string, newPath: string) => {
    const resolvedOld = resolveSafePath(oldPath);
    const resolvedNew = resolveSafePath(newPath);

    if (!fs.existsSync(resolvedOld)) {
      return { success: false, message: `Target does not exist: ${resolvedOld}` };
    }

    try {
      fs.renameSync(resolvedOld, resolvedNew);
      return { success: true, message: `Renamed to: ${resolvedNew}`, target: resolvedNew };
    } catch (err: any) {
      return { success: false, message: `Failed to rename: ${err.message}` };
    }
  });

  ipcMain.handle('file:deleteFile', async (_, targetPath: string, confirmed = false) => {
    const resolved = resolveSafePath(targetPath);
    if (!fs.existsSync(resolved)) {
      return { success: false, message: `File or folder does not exist: ${resolved}` };
    }

    // Require explicit confirmation for safety
    if (!confirmed && mainWindow) {
      const choice = dialog.showMessageBoxSync(mainWindow, {
        type: 'warning',
        buttons: ['Cancel', 'Delete Permanently'],
        defaultId: 0,
        cancelId: 0,
        title: 'VAJRA Security Confirmation',
        message: `Are you sure you want to permanently delete: \n${resolved}?`,
      });

      if (choice !== 1) {
        return { success: false, message: 'Deletion operation cancelled by user.' };
      }
    }

    try {
      const stat = fs.statSync(resolved);
      if (stat.isDirectory()) {
        fs.rmSync(resolved, { recursive: true, force: true });
      } else {
        fs.unlinkSync(resolved);
      }
      return { success: true, message: `Deleted: ${resolved}`, target: resolved };
    } catch (err: any) {
      return { success: false, message: `Failed to delete: ${err.message}` };
    }
  });

  ipcMain.handle('file:listFiles', async (_, dirPath?: string) => {
    const resolved = resolveSafePath(dirPath || getSpecialFolders().documents);
    if (!fs.existsSync(resolved)) {
      return { success: false, message: `Directory does not exist: ${resolved}`, items: [] };
    }

    try {
      const entries = fs.readdirSync(resolved, { withFileTypes: true });
      const items = entries.map((entry) => {
        const fullPath = path.join(resolved, entry.name);
        let size = 0;
        let updatedAt = new Date().toISOString();
        try {
          const st = fs.statSync(fullPath);
          size = st.size;
          updatedAt = st.mtime.toISOString();
        } catch {}

        return {
          name: entry.name,
          path: fullPath,
          isDirectory: entry.isDirectory(),
          size,
          updatedAt,
        };
      });

      return { success: true, message: `Listed ${items.length} items in ${resolved}`, items, target: resolved };
    } catch (err: any) {
      return { success: false, message: `Failed to list directory: ${err.message}`, items: [] };
    }
  });
}

// App lifecycle
app.whenReady().then(() => {
  setupIpcHandlers();
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
