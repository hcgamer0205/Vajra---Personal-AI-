var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// electron/preload.ts
var preload_exports = {};
module.exports = __toCommonJS(preload_exports);
var import_electron = require("electron");
var vajraDesktopApi = {
  isElectron: true,
  platform: process.platform,
  // Window Controls
  minimize: () => import_electron.ipcRenderer.invoke("window:minimize"),
  maximize: () => import_electron.ipcRenderer.invoke("window:maximize"),
  close: () => import_electron.ipcRenderer.invoke("window:close"),
  isMaximized: () => import_electron.ipcRenderer.invoke("window:isMaximized"),
  // System & Special Folders
  getSpecialFolders: () => import_electron.ipcRenderer.invoke("system:getSpecialFolders"),
  getSystemInfo: () => import_electron.ipcRenderer.invoke("system:getInfo"),
  // Application Launching (Strictly Whitelisted)
  openApp: (appName) => import_electron.ipcRenderer.invoke("app:open", appName),
  getAvailableApps: () => import_electron.ipcRenderer.invoke("app:listApproved"),
  // Web & Search
  openUrl: (url) => import_electron.ipcRenderer.invoke("web:openUrl", url),
  searchWeb: (query) => import_electron.ipcRenderer.invoke("web:search", query),
  // Native File Operations
  openPath: (targetPath) => import_electron.ipcRenderer.invoke("file:openPath", targetPath),
  createFolder: (folderPath) => import_electron.ipcRenderer.invoke("file:createFolder", folderPath),
  createFile: (filePath, content) => import_electron.ipcRenderer.invoke("file:createFile", filePath, content),
  moveFile: (srcPath, destPath) => import_electron.ipcRenderer.invoke("file:moveFile", srcPath, destPath),
  copyFile: (srcPath, destPath) => import_electron.ipcRenderer.invoke("file:copyFile", srcPath, destPath),
  renameFile: (oldPath, newPath) => import_electron.ipcRenderer.invoke("file:renameFile", oldPath, newPath),
  deleteFile: (targetPath, confirmed) => import_electron.ipcRenderer.invoke("file:deleteFile", targetPath, confirmed),
  listFiles: (dirPath) => import_electron.ipcRenderer.invoke("file:listFiles", dirPath)
};
import_electron.contextBridge.exposeInMainWorld("vajraDesktop", vajraDesktopApi);
