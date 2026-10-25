var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// electron/main.ts
var import_electron = require("electron");
var import_path = __toESM(require("path"));
var import_fs = __toESM(require("fs"));
var import_os = __toESM(require("os"));
var import_child_process = require("child_process");
var mainWindow = null;
var APPROVED_APPS = {
  calculator: { winCmd: "calc.exe", displayName: "Calculator" },
  calc: { winCmd: "calc.exe", displayName: "Calculator" },
  notepad: { winCmd: "notepad.exe", displayName: "Notepad" },
  notes: { winCmd: "notepad.exe", displayName: "Notepad" },
  "file explorer": { winCmd: "explorer.exe", displayName: "File Explorer" },
  explorer: { winCmd: "explorer.exe", displayName: "File Explorer" },
  files: { winCmd: "explorer.exe", displayName: "File Explorer" },
  terminal: { winCmd: "wt.exe", displayName: "Windows Terminal" },
  powershell: { winCmd: "powershell.exe", displayName: "PowerShell" },
  cmd: { winCmd: "cmd.exe", displayName: "Command Prompt" },
  chrome: { winCmd: "chrome.exe", displayName: "Google Chrome" },
  browser: { winCmd: "msedge.exe", displayName: "Microsoft Edge" },
  edge: { winCmd: "msedge.exe", displayName: "Microsoft Edge" },
  paint: { winCmd: "mspaint.exe", displayName: "Paint" },
  taskmgr: { winCmd: "taskmgr.exe", displayName: "Task Manager" },
  "task manager": { winCmd: "taskmgr.exe", displayName: "Task Manager" }
};
function getSpecialFolders() {
  const home = import_os.default.homedir();
  return {
    home,
    documents: import_path.default.join(home, "Documents"),
    downloads: import_path.default.join(home, "Downloads"),
    desktop: import_path.default.join(home, "Desktop"),
    pictures: import_path.default.join(home, "Pictures"),
    music: import_path.default.join(home, "Music"),
    videos: import_path.default.join(home, "Videos"),
    appData: import_path.default.join(home, "AppData", "Roaming", "VAJRA")
  };
}
function resolveSafePath(inputPath) {
  if (!inputPath || inputPath.trim() === "") {
    return import_os.default.homedir();
  }
  const special = getSpecialFolders();
  const trimmed = inputPath.trim();
  const lower = trimmed.toLowerCase();
  if (lower === "documents" || lower === "my documents" || lower === "docs") {
    return special.documents;
  }
  if (lower === "downloads" || lower === "my downloads") {
    return special.downloads;
  }
  if (lower === "desktop") {
    return special.desktop;
  }
  if (lower === "home" || lower === "~") {
    return special.home;
  }
  if (trimmed.startsWith("~/") || trimmed.startsWith("~\\")) {
    return import_path.default.join(special.home, trimmed.slice(2));
  }
  if (import_path.default.isAbsolute(trimmed)) {
    return import_path.default.normalize(trimmed);
  }
  return import_path.default.resolve(special.documents, trimmed);
}
function createWindow() {
  const iconPath = process.platform === "win32" ? import_path.default.join(__dirname, "../build/icon.ico") : import_path.default.join(__dirname, "../public/icon.png");
  mainWindow = new import_electron.BrowserWindow({
    width: 1366,
    height: 860,
    minWidth: 1024,
    minHeight: 680,
    backgroundColor: "#080104",
    title: "VAJRA \u2014 Virtual Advanced Intelligence & Response Assistant",
    icon: import_fs.default.existsSync(iconPath) ? iconPath : void 0,
    frame: true,
    autoHideMenuBar: true,
    titleBarStyle: "default",
    webPreferences: {
      preload: import_path.default.join(__dirname, "preload.cjs"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      webSecurity: true
    }
  });
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http:") || url.startsWith("https:")) {
      import_electron.shell.openExternal(url);
      return { action: "deny" };
    }
    return { action: "allow" };
  });
  const isDev = process.env.NODE_ENV === "development" || !import_electron.app.isPackaged;
  if (isDev && process.env.ELECTRON_START_URL) {
    mainWindow.loadURL(process.env.ELECTRON_START_URL);
  } else {
    const indexPath = import_path.default.join(__dirname, "../dist/index.html");
    if (import_fs.default.existsSync(indexPath)) {
      mainWindow.loadFile(indexPath);
    } else {
      mainWindow.loadURL("http://localhost:3000");
    }
  }
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}
function setupIpcHandlers() {
  import_electron.ipcMain.handle("window:minimize", () => {
    mainWindow?.minimize();
  });
  import_electron.ipcMain.handle("window:maximize", () => {
    if (!mainWindow) return;
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  });
  import_electron.ipcMain.handle("window:close", () => {
    mainWindow?.close();
  });
  import_electron.ipcMain.handle("window:isMaximized", () => {
    return mainWindow?.isMaximized() ?? false;
  });
  import_electron.ipcMain.handle("system:getSpecialFolders", () => {
    return getSpecialFolders();
  });
  import_electron.ipcMain.handle("system:getInfo", () => {
    return {
      platform: import_os.default.platform(),
      arch: import_os.default.arch(),
      version: import_os.default.release(),
      hostname: import_os.default.hostname(),
      uptime: import_os.default.uptime(),
      totalMemory: import_os.default.totalmem(),
      freeMemory: import_os.default.freemem()
    };
  });
  import_electron.ipcMain.handle("app:listApproved", () => {
    return Object.values(APPROVED_APPS).map((a) => a.displayName);
  });
  import_electron.ipcMain.handle("app:open", async (_, appName) => {
    if (!appName || typeof appName !== "string") {
      return { success: false, message: "Invalid application identifier provided." };
    }
    const key = appName.toLowerCase().trim();
    const appEntry = APPROVED_APPS[key] || Object.entries(APPROVED_APPS).find(([k]) => key.includes(k))?.[1];
    if (!appEntry) {
      return {
        success: false,
        message: `Application "${appName}" is not in the approved native launch matrix for security reasons.`
      };
    }
    return new Promise((resolve) => {
      if (process.platform === "win32") {
        (0, import_child_process.exec)(`start "" "${appEntry.winCmd}"`, (err) => {
          if (err) {
            (0, import_child_process.exec)(appEntry.winCmd, (err2) => {
              if (err2) {
                resolve({
                  success: false,
                  message: `Could not launch ${appEntry.displayName} on this system (${err2.message}).`
                });
              } else {
                resolve({
                  success: true,
                  message: `Successfully dispatched and launched ${appEntry.displayName}.`
                });
              }
            });
          } else {
            resolve({
              success: true,
              message: `Successfully launched native ${appEntry.displayName}.`
            });
          }
        });
      } else {
        const genericCmd = process.platform === "darwin" ? `open -a "${appEntry.displayName}"` : `xdg-open "${appEntry.winCmd}"`;
        (0, import_child_process.exec)(genericCmd, (err) => {
          if (err) {
            resolve({
              success: false,
              message: `Platform execution for ${appEntry.displayName} encountered error: ${err.message}`
            });
          } else {
            resolve({
              success: true,
              message: `Launched ${appEntry.displayName}.`
            });
          }
        });
      }
    });
  });
  import_electron.ipcMain.handle("web:openUrl", async (_, rawUrl) => {
    if (!rawUrl || typeof rawUrl !== "string") {
      return { success: false, message: "Invalid URL supplied." };
    }
    let url = rawUrl.trim();
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = `https://${url}`;
    }
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        return { success: false, message: "Only HTTP and HTTPS URLs are permitted." };
      }
      await import_electron.shell.openExternal(url);
      return {
        success: true,
        message: `Opened ${url} in default web browser.`,
        target: url
      };
    } catch (err) {
      return { success: false, message: `Failed to open URL: ${err.message}` };
    }
  });
  import_electron.ipcMain.handle("web:search", async (_, query) => {
    if (!query || typeof query !== "string") {
      return { success: false, message: "Invalid search query." };
    }
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query.trim())}`;
    try {
      await import_electron.shell.openExternal(searchUrl);
      return {
        success: true,
        message: `Executed Google search for "${query}".`,
        target: searchUrl
      };
    } catch (err) {
      return { success: false, message: `Web search execution failed: ${err.message}` };
    }
  });
  import_electron.ipcMain.handle("file:openPath", async (_, targetPath) => {
    const resolved = resolveSafePath(targetPath);
    if (!import_fs.default.existsSync(resolved)) {
      return { success: false, message: `Path does not exist: ${resolved}` };
    }
    try {
      const result = await import_electron.shell.openPath(resolved);
      if (result) {
        return { success: false, message: `Could not open path: ${result}` };
      }
      return { success: true, message: `Opened: ${resolved}`, target: resolved };
    } catch (err) {
      return { success: false, message: `Failed to open path: ${err.message}` };
    }
  });
  import_electron.ipcMain.handle("file:createFolder", async (_, folderPath) => {
    const resolved = resolveSafePath(folderPath);
    try {
      if (import_fs.default.existsSync(resolved)) {
        return { success: true, message: `Folder already exists at: ${resolved}`, target: resolved };
      }
      import_fs.default.mkdirSync(resolved, { recursive: true });
      return { success: true, message: `Created folder at: ${resolved}`, target: resolved };
    } catch (err) {
      return { success: false, message: `Failed to create folder: ${err.message}` };
    }
  });
  import_electron.ipcMain.handle("file:createFile", async (_, filePath, content = "") => {
    const resolved = resolveSafePath(filePath);
    try {
      const parentDir = import_path.default.dirname(resolved);
      if (!import_fs.default.existsSync(parentDir)) {
        import_fs.default.mkdirSync(parentDir, { recursive: true });
      }
      import_fs.default.writeFileSync(resolved, content, "utf-8");
      return { success: true, message: `Created file at: ${resolved}`, target: resolved };
    } catch (err) {
      return { success: false, message: `Failed to create file: ${err.message}` };
    }
  });
  import_electron.ipcMain.handle("file:moveFile", async (_, srcPath, destPath) => {
    const resolvedSrc = resolveSafePath(srcPath);
    let resolvedDest = resolveSafePath(destPath);
    if (!import_fs.default.existsSync(resolvedSrc)) {
      return { success: false, message: `Source file does not exist: ${resolvedSrc}` };
    }
    try {
      if (import_fs.default.existsSync(resolvedDest) && import_fs.default.statSync(resolvedDest).isDirectory()) {
        resolvedDest = import_path.default.join(resolvedDest, import_path.default.basename(resolvedSrc));
      }
      import_fs.default.renameSync(resolvedSrc, resolvedDest);
      return { success: true, message: `Moved file to: ${resolvedDest}`, target: resolvedDest };
    } catch (err) {
      return { success: false, message: `Failed to move file: ${err.message}` };
    }
  });
  import_electron.ipcMain.handle("file:copyFile", async (_, srcPath, destPath) => {
    const resolvedSrc = resolveSafePath(srcPath);
    let resolvedDest = resolveSafePath(destPath);
    if (!import_fs.default.existsSync(resolvedSrc)) {
      return { success: false, message: `Source file does not exist: ${resolvedSrc}` };
    }
    try {
      if (import_fs.default.existsSync(resolvedDest) && import_fs.default.statSync(resolvedDest).isDirectory()) {
        resolvedDest = import_path.default.join(resolvedDest, import_path.default.basename(resolvedSrc));
      }
      import_fs.default.copyFileSync(resolvedSrc, resolvedDest);
      return { success: true, message: `Copied file to: ${resolvedDest}`, target: resolvedDest };
    } catch (err) {
      return { success: false, message: `Failed to copy file: ${err.message}` };
    }
  });
  import_electron.ipcMain.handle("file:renameFile", async (_, oldPath, newPath) => {
    const resolvedOld = resolveSafePath(oldPath);
    const resolvedNew = resolveSafePath(newPath);
    if (!import_fs.default.existsSync(resolvedOld)) {
      return { success: false, message: `Target does not exist: ${resolvedOld}` };
    }
    try {
      import_fs.default.renameSync(resolvedOld, resolvedNew);
      return { success: true, message: `Renamed to: ${resolvedNew}`, target: resolvedNew };
    } catch (err) {
      return { success: false, message: `Failed to rename: ${err.message}` };
    }
  });
  import_electron.ipcMain.handle("file:deleteFile", async (_, targetPath, confirmed = false) => {
    const resolved = resolveSafePath(targetPath);
    if (!import_fs.default.existsSync(resolved)) {
      return { success: false, message: `File or folder does not exist: ${resolved}` };
    }
    if (!confirmed && mainWindow) {
      const choice = import_electron.dialog.showMessageBoxSync(mainWindow, {
        type: "warning",
        buttons: ["Cancel", "Delete Permanently"],
        defaultId: 0,
        cancelId: 0,
        title: "VAJRA Security Confirmation",
        message: `Are you sure you want to permanently delete: 
${resolved}?`
      });
      if (choice !== 1) {
        return { success: false, message: "Deletion operation cancelled by user." };
      }
    }
    try {
      const stat = import_fs.default.statSync(resolved);
      if (stat.isDirectory()) {
        import_fs.default.rmSync(resolved, { recursive: true, force: true });
      } else {
        import_fs.default.unlinkSync(resolved);
      }
      return { success: true, message: `Deleted: ${resolved}`, target: resolved };
    } catch (err) {
      return { success: false, message: `Failed to delete: ${err.message}` };
    }
  });
  import_electron.ipcMain.handle("file:listFiles", async (_, dirPath) => {
    const resolved = resolveSafePath(dirPath || getSpecialFolders().documents);
    if (!import_fs.default.existsSync(resolved)) {
      return { success: false, message: `Directory does not exist: ${resolved}`, items: [] };
    }
    try {
      const entries = import_fs.default.readdirSync(resolved, { withFileTypes: true });
      const items = entries.map((entry) => {
        const fullPath = import_path.default.join(resolved, entry.name);
        let size = 0;
        let updatedAt = (/* @__PURE__ */ new Date()).toISOString();
        try {
          const st = import_fs.default.statSync(fullPath);
          size = st.size;
          updatedAt = st.mtime.toISOString();
        } catch {
        }
        return {
          name: entry.name,
          path: fullPath,
          isDirectory: entry.isDirectory(),
          size,
          updatedAt
        };
      });
      return { success: true, message: `Listed ${items.length} items in ${resolved}`, items, target: resolved };
    } catch (err) {
      return { success: false, message: `Failed to list directory: ${err.message}`, items: [] };
    }
  });
}
import_electron.app.whenReady().then(() => {
  setupIpcHandlers();
  createWindow();
  import_electron.app.on("activate", () => {
    if (import_electron.BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
import_electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    import_electron.app.quit();
  }
});
