import { contextBridge, ipcRenderer } from 'electron';

export interface FileItemInfo {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  updatedAt: string;
}

export interface SpecialFolders {
  home: string;
  documents: string;
  downloads: string;
  desktop: string;
  pictures: string;
  music: string;
  videos: string;
  appData: string;
}

export interface NativeActionResult {
  success: boolean;
  message: string;
  data?: any;
  target?: string;
  requiresConfirmation?: boolean;
}

const vajraDesktopApi = {
  isElectron: true,
  platform: process.platform,

  // Window Controls
  minimize: () => ipcRenderer.invoke('window:minimize'),
  maximize: () => ipcRenderer.invoke('window:maximize'),
  close: () => ipcRenderer.invoke('window:close'),
  isMaximized: () => ipcRenderer.invoke('window:isMaximized'),

  // System & Special Folders
  getSpecialFolders: (): Promise<SpecialFolders> => ipcRenderer.invoke('system:getSpecialFolders'),
  getSystemInfo: (): Promise<{
    platform: string;
    arch: string;
    version: string;
    hostname: string;
    uptime: number;
    totalMemory: number;
    freeMemory: number;
  }> => ipcRenderer.invoke('system:getInfo'),

  // Application Launching (Strictly Whitelisted)
  openApp: (appName: string): Promise<NativeActionResult> => ipcRenderer.invoke('app:open', appName),
  getAvailableApps: (): Promise<string[]> => ipcRenderer.invoke('app:listApproved'),

  // Web & Search
  openUrl: (url: string): Promise<NativeActionResult> => ipcRenderer.invoke('web:openUrl', url),
  searchWeb: (query: string): Promise<NativeActionResult> => ipcRenderer.invoke('web:search', query),

  // Native File Operations
  openPath: (targetPath: string): Promise<NativeActionResult> => ipcRenderer.invoke('file:openPath', targetPath),
  createFolder: (folderPath: string): Promise<NativeActionResult> => ipcRenderer.invoke('file:createFolder', folderPath),
  createFile: (filePath: string, content?: string): Promise<NativeActionResult> => ipcRenderer.invoke('file:createFile', filePath, content),
  moveFile: (srcPath: string, destPath: string): Promise<NativeActionResult> => ipcRenderer.invoke('file:moveFile', srcPath, destPath),
  copyFile: (srcPath: string, destPath: string): Promise<NativeActionResult> => ipcRenderer.invoke('file:copyFile', srcPath, destPath),
  renameFile: (oldPath: string, newPath: string): Promise<NativeActionResult> => ipcRenderer.invoke('file:renameFile', oldPath, newPath),
  deleteFile: (targetPath: string, confirmed?: boolean): Promise<NativeActionResult> => ipcRenderer.invoke('file:deleteFile', targetPath, confirmed),
  listFiles: (dirPath?: string): Promise<NativeActionResult & { items?: FileItemInfo[] }> => ipcRenderer.invoke('file:listFiles', dirPath),
};

contextBridge.exposeInMainWorld('vajraDesktop', vajraDesktopApi);

export type VajraDesktopApi = typeof vajraDesktopApi;
