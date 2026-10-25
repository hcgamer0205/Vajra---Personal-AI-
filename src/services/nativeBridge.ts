/**
 * VAJRA Desktop Bridge Architecture
 * 
 * Provides unified native OS interaction for:
 * 1. Native Windows Application Execution (Calculator, Notepad, File Explorer, Chrome, Terminal, etc.)
 * 2. Real Native File Operations (Creating folders, creating files, moving, copying, renaming, opening)
 * 3. Default Browser Web Navigation & Search (YouTube, Google, Wikipedia)
 * 4. Graceful In-Browser Fallbacks (Interactive In-App Calculator, Scratchpad, Workspace Explorer)
 */

import { VajraAction } from '../types';
import { isValidSafeUrl, sanitizeUrl } from './security';

export interface NativeBridgeStatus {
  isConnected: boolean;
  isElectron: boolean;
  runtimeType: 'electron_native' | 'browser_sandbox';
  platform: string;
  capabilities: {
    canLaunchOSApps: boolean;
    canAccessFileSystem: boolean;
    canOpenBrowserTabs: boolean;
    canRunLocalLLM: boolean;
  };
  supportedApps: string[];
}

class NativeBridgeService {
  /**
   * Checks if running inside the native VAJRA Electron desktop application
   */
  isElectronAvailable(): boolean {
    return typeof window !== 'undefined' && Boolean(window.vajraDesktop?.isElectron);
  }

  /**
   * Checks if running on mobile device or viewport
   */
  isMobileDevice(): boolean {
    if (typeof window === 'undefined') return false;
    return (
      window.innerWidth <= 768 ||
      ('ontouchstart' in window && window.innerWidth <= 1024) ||
      Boolean(window.matchMedia?.('(pointer: coarse)').matches)
    );
  }

  /**
   * Mobile Capability: Native Web Share or Clipboard Fallback
   */
  async shareContent(title: string, text: string, url?: string): Promise<{ success: boolean; message: string }> {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return { success: true, message: 'Shared successfully via system sheet.' };
      } catch (err: any) {
        if (err.name === 'AbortError') {
          return { success: false, message: 'Share dismissed.' };
        }
      }
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(url ? `${text}\n${url}` : text);
        return { success: true, message: 'Copied content to clipboard.' };
      } catch {}
    }

    return { success: false, message: 'Sharing not available on this platform.' };
  }

  /**
   * Mobile Capability: Safe Deep-Linking (tel, mailto, maps)
   */
  openDeepLink(uri: string): { success: boolean; message: string } {
    if (typeof window === 'undefined') return { success: false, message: 'Window unavailable' };
    if (!isValidSafeUrl(uri)) {
      return { success: false, message: "VAJRA can't open that type of mobile link." };
    }
    const clean = sanitizeUrl(uri) || uri;
    const lower = clean.toLowerCase();
    if (lower.startsWith('tel:') || lower.startsWith('mailto:') || lower.startsWith('sms:')) {
      window.location.href = clean;
      return { success: true, message: `Dispatched system intent: ${clean}` };
    }
    if (lower.startsWith('maps:') || lower.includes('google.com/maps')) {
      window.open(clean, '_blank', 'noopener,noreferrer');
      return { success: true, message: `Opened navigation coordinates in maps.` };
    }
    window.open(clean, '_blank', 'noopener,noreferrer');
    return { success: true, message: `Navigated to link: ${clean}` };
  }

  /**
   * Returns current native bridge status
   */
  getStatus(): NativeBridgeStatus {
    const isElectron = this.isElectronAvailable();
    const isMobile = this.isMobileDevice();
    return {
      isConnected: true,
      isElectron,
      runtimeType: isElectron ? 'electron_native' : 'browser_sandbox',
      platform: isElectron ? window.vajraDesktop?.platform || 'win32' : isMobile ? 'mobile_web' : 'desktop_web',
      capabilities: {
        canLaunchOSApps: isElectron,
        canAccessFileSystem: isElectron,
        canOpenBrowserTabs: true,
        canRunLocalLLM: true,
      },
      supportedApps: [
        'Calculator',
        'Notepad',
        'File Explorer',
        'Google Chrome',
        'Command Prompt',
        'PowerShell',
        'Paint',
        'Task Manager',
      ],
    };
  }

  /**
   * Execute an application launch.
   */
  async launchApp(
    appName: string,
    onFallback?: (tool: 'calculator' | 'notepad' | 'file_explorer') => void
  ): Promise<{
    success: boolean;
    mode: 'native' | 'in_app_fallback' | 'external_tab' | 'unsupported';
    message: string;
  }> {
    const normalized = appName.toLowerCase().trim();
    const isMobile = this.isMobileDevice();

    // 1. If running in native Electron Desktop app
    if (this.isElectronAvailable() && window.vajraDesktop) {
      try {
        const res = await window.vajraDesktop.openApp(appName);
        return {
          success: res.success,
          mode: 'native',
          message: res.message,
        };
      } catch (err: any) {
        return {
          success: false,
          mode: 'unsupported',
          message: `Native launch exception: ${err.message}`,
        };
      }
    }

    // 2. In-Browser / Mobile Sandboxed fallback for essential tools
    if (normalized.includes('calc')) {
      onFallback?.('calculator');
      return {
        success: true,
        mode: 'in_app_fallback',
        message: isMobile
          ? 'Launched VAJRA Mobile Math Engine.'
          : 'Launched VAJRA In-App Calculator tool (Native app active in Windows Desktop wrapper).',
      };
    }

    if (normalized.includes('note') || normalized.includes('text') || normalized.includes('pad')) {
      onFallback?.('notepad');
      return {
        success: true,
        mode: 'in_app_fallback',
        message: isMobile
          ? 'Launched VAJRA Touch Scratchpad.'
          : 'Launched VAJRA In-App Scratchpad & Note Editor (Native Notepad active in Windows Desktop wrapper).',
      };
    }

    if (normalized.includes('file') || normalized.includes('explorer') || normalized.includes('finder')) {
      onFallback?.('file_explorer');
      return {
        success: true,
        mode: 'in_app_fallback',
        message: isMobile
          ? 'Opened VAJRA Mobile Workspace Explorer.'
          : 'Opened VAJRA Session File Explorer (Native Windows File Explorer active in Desktop wrapper).',
      };
    }

    if (normalized.includes('chrome') || normalized.includes('browser')) {
      window.open('https://www.google.com', '_blank', 'noopener,noreferrer');
      return {
        success: true,
        mode: 'external_tab',
        message: 'Opened a new Google Chrome / Browser window tab.',
      };
    }

    // 3. For unsupported desktop operations on mobile:
    if (isMobile) {
      return {
        success: false,
        mode: 'unsupported',
        message: "VAJRA mobile doesn't have access to this desktop capability. Providing in-app workspace alternative.",
      };
    }

    return {
      success: false,
      mode: 'unsupported',
      message: `Direct OS execution of "${appName}" requires the VAJRA Windows Desktop Application (VAJRA-Setup.exe).`,
    };
  }

  /**
   * Execute web navigation or search
   */
  async openWebsite(url: string): Promise<{ success: boolean; message: string }> {
    const lower = url.toLowerCase().trim();
    if (
      lower.startsWith('tel:') ||
      lower.startsWith('mailto:') ||
      lower.startsWith('sms:') ||
      lower.startsWith('maps:')
    ) {
      return this.openDeepLink(url);
    }

    if (!isValidSafeUrl(url)) {
      return { success: false, message: "VAJRA can't open that type of mobile link." };
    }

    const safeUrl = sanitizeUrl(url) || url;

    if (this.isElectronAvailable() && window.vajraDesktop) {
      return await window.vajraDesktop.openUrl(safeUrl);
    }
    window.open(safeUrl, '_blank', 'noopener,noreferrer');
    return { success: true, message: `Navigated to ${safeUrl}` };
  }

  async searchWeb(query: string): Promise<{ success: boolean; message: string }> {
    if (this.isElectronAvailable() && window.vajraDesktop) {
      return await window.vajraDesktop.searchWeb(query);
    }
    const target = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    window.open(target, '_blank', 'noopener,noreferrer');
    return { success: true, message: `Opened Google search for "${query}"` };
  }

  /**
   * File Operations Execution via Desktop Bridge
   */
  async openPath(targetPath: string): Promise<{ success: boolean; message: string }> {
    if (this.isElectronAvailable() && window.vajraDesktop) {
      return await window.vajraDesktop.openPath(targetPath);
    }
    if (this.isMobileDevice()) {
      return {
        success: false,
        message: "VAJRA mobile doesn't have access to this desktop capability. Open the In-App Workspace Explorer instead.",
      };
    }
    return {
      success: false,
      message: `Opening system folder "${targetPath}" requires the VAJRA Desktop Application.`,
    };
  }

  async createFolder(folderPath: string): Promise<{ success: boolean; message: string; target?: string }> {
    if (this.isElectronAvailable() && window.vajraDesktop) {
      return await window.vajraDesktop.createFolder(folderPath);
    }
    if (this.isMobileDevice()) {
      return {
        success: false,
        message: "VAJRA mobile doesn't have access to this desktop capability. Open the In-App Workspace Explorer instead.",
      };
    }
    return {
      success: false,
      message: `Creating folder "${folderPath}" on local filesystem requires the VAJRA Desktop Application.`,
    };
  }

  async createFile(filePath: string, content = ''): Promise<{ success: boolean; message: string; target?: string }> {
    if (this.isElectronAvailable() && window.vajraDesktop) {
      return await window.vajraDesktop.createFile(filePath, content);
    }
    if (this.isMobileDevice()) {
      return {
        success: false,
        message: "VAJRA mobile doesn't have access to this desktop capability. Open the In-App Scratchpad instead.",
      };
    }
    return {
      success: false,
      message: `Creating file "${filePath}" on local filesystem requires the VAJRA Desktop Application.`,
    };
  }

  async moveFile(srcPath: string, destPath: string): Promise<{ success: boolean; message: string; target?: string }> {
    if (this.isElectronAvailable() && window.vajraDesktop) {
      return await window.vajraDesktop.moveFile(srcPath, destPath);
    }
    if (this.isMobileDevice()) {
      return {
        success: false,
        message: "VAJRA mobile doesn't have access to this desktop capability. File operations are simulated in Session Explorer.",
      };
    }
    return {
      success: false,
      message: `Moving files on local filesystem requires the VAJRA Desktop Application.`,
    };
  }

  async copyFile(srcPath: string, destPath: string): Promise<{ success: boolean; message: string; target?: string }> {
    if (this.isElectronAvailable() && window.vajraDesktop) {
      return await window.vajraDesktop.copyFile(srcPath, destPath);
    }
    if (this.isMobileDevice()) {
      return {
        success: false,
        message: "VAJRA mobile doesn't have access to this desktop capability. File operations are simulated in Session Explorer.",
      };
    }
    return {
      success: false,
      message: `Copying files on local filesystem requires the VAJRA Desktop Application.`,
    };
  }

  async renameFile(oldPath: string, newPath: string): Promise<{ success: boolean; message: string; target?: string }> {
    if (this.isElectronAvailable() && window.vajraDesktop) {
      return await window.vajraDesktop.renameFile(oldPath, newPath);
    }
    if (this.isMobileDevice()) {
      return {
        success: false,
        message: "VAJRA mobile doesn't have access to this desktop capability. File operations are simulated in Session Explorer.",
      };
    }
    return {
      success: false,
      message: `Renaming files on local filesystem requires the VAJRA Desktop Application.`,
    };
  }

  async deleteFile(targetPath: string, confirmed = false): Promise<{ success: boolean; message: string; target?: string }> {
    if (this.isElectronAvailable() && window.vajraDesktop) {
      return await window.vajraDesktop.deleteFile(targetPath, confirmed);
    }
    if (this.isMobileDevice()) {
      return {
        success: false,
        message: "VAJRA mobile doesn't have access to this desktop capability.",
      };
    }
    return {
      success: false,
      message: `Deleting files on local filesystem requires the VAJRA Desktop Application.`,
    };
  }

  async listFiles(dirPath?: string) {
    if (this.isElectronAvailable() && window.vajraDesktop) {
      return await window.vajraDesktop.listFiles(dirPath);
    }
    return {
      success: true,
      message: 'Viewing local virtual session files.',
      items: [
        { name: 'Documents', path: '/documents', isDirectory: true, size: 0, updatedAt: new Date().toISOString() },
        { name: 'Downloads', path: '/downloads', isDirectory: true, size: 0, updatedAt: new Date().toISOString() },
        { name: 'research_notes.txt', path: '/documents/research_notes.txt', isDirectory: false, size: 1024, updatedAt: new Date().toISOString() },
        { name: 'quantum_telemetry.json', path: '/documents/quantum_telemetry.json', isDirectory: false, size: 2048, updatedAt: new Date().toISOString() },
      ],
    };
  }

  /**
   * Dispatches any structured VajraAction
   */
  async executeVajraAction(
    action: VajraAction,
    onFallback?: (tool: 'calculator' | 'notepad' | 'file_explorer') => void
  ): Promise<{ success: boolean; message: string }> {
    switch (action.type) {
      case 'OPEN_APP':
        return await this.launchApp(action.appName || 'Calculator', onFallback);

      case 'OPEN_WEBSITE':
        if (!action.url) return { success: false, message: 'No URL specified for action.' };
        return await this.openWebsite(action.url);

      case 'SEARCH_WEB':
        return await this.searchWeb(action.query || 'VAJRA AI');

      case 'OPEN_PATH':
        return await this.openPath(action.targetPath || 'Documents');

      case 'CREATE_FOLDER':
        return await this.createFolder(action.targetPath || 'New Folder');

      case 'CREATE_FILE':
        return await this.createFile(action.targetPath || 'notes.txt', action.fileContent || '');

      case 'MOVE_FILE':
        return await this.moveFile(action.targetPath || '', action.destinationPath || '');

      case 'COPY_FILE':
        return await this.copyFile(action.targetPath || '', action.destinationPath || '');

      case 'RENAME_FILE':
        return await this.renameFile(action.targetPath || '', action.destinationPath || '');

      case 'DELETE_FILE':
        return await this.deleteFile(action.targetPath || '', action.confirmed ?? false);

      case 'SYSTEM_ACTION':
        if (action.title?.toLowerCase().includes('share') || action.description?.toLowerCase().includes('share')) {
          return await this.shareContent(
            action.title || 'VAJRA Assistant',
            action.description || 'Shared from VAJRA Mobile',
            action.url
          );
        }
        return { success: true, message: action.description || 'System directive completed.' };

      default:
        return { success: false, message: 'Unrecognized action type.' };
    }
  }
}

export const nativeBridge = new NativeBridgeService();
