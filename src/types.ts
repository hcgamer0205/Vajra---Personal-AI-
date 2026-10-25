export type Role = 'user' | 'assistant' | 'system';

export type AssistantState =
  | 'idle'
  | 'listening'
  | 'understanding'
  | 'thinking'
  | 'planning'
  | 'awaiting_confirmation'
  | 'executing'
  | 'verifying'
  | 'speaking'
  | 'paused'
  | 'recovering'
  | 'success'
  | 'error'
  | 'backgrounded'
  | 'protected';

export type ActionType =
  | 'OPEN_WEBSITE'
  | 'SEARCH_WEB'
  | 'OPEN_APP'
  | 'OPEN_PATH'
  | 'CREATE_FOLDER'
  | 'CREATE_FILE'
  | 'MOVE_FILE'
  | 'COPY_FILE'
  | 'RENAME_FILE'
  | 'DELETE_FILE'
  | 'LIST_FILES'
  | 'SYSTEM_ACTION'
  | 'OPEN_SETTINGS'
  | 'DIAL_PHONE'
  | 'DRAFT_SMS'
  | 'DRAFT_EMAIL'
  | 'OPEN_CAMERA'
  | 'OPEN_MAPS'
  | 'ADJUST_VOLUME'
  | 'GET_DEVICE_INFO'
  | 'MANAGE_VAJRA_NOTE'
  | 'GLOBAL_STOP';

export interface VajraAction {
  id: string;
  type: ActionType;
  title: string;
  url?: string;
  query?: string;
  appName?: string;
  targetPath?: string;
  destinationPath?: string;
  fileContent?: string;
  description?: string;
  requiresConfirmation?: boolean;
  confirmed?: boolean;
  status?: 'pending' | 'executed' | 'cancelled' | 'blocked' | 'failed';
  isNativeRequired?: boolean;
  resultMessage?: string;
  phoneNumber?: string;
  messageText?: string;
  recipientName?: string;
  settingsScreen?: 'wifi' | 'bluetooth' | 'display' | 'sound' | 'battery' | 'apps' | 'accessibility' | 'main';
  volumeDirection?: 'up' | 'down' | 'mute';
  volumeStream?: 'media' | 'ring' | 'alarm';
  destination?: string;
  noteTitle?: string;
  noteBody?: string;
  noteAction?: 'create' | 'read' | 'list' | 'delete';
}

// Alias for backwards compatibility
export type NovaAction = VajraAction;

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
  isStreaming?: boolean;
  error?: boolean;
  actions?: VajraAction[];
}

export interface ModelOption {
  id: string;
  name: string;
  description: string;
  isDefault?: boolean;
}

export interface ChatConfig {
  model: string;
  systemInstruction?: string;
  temperature?: number;
}

export interface VajraUserConfig {
  assistantName: string;
  language: string;
  voiceOutput: boolean;
  voiceInputMode: 'push_to_talk' | 'continuous' | 'manual';
  startupBehavior: 'active_command' | 'standby' | 'voice_ready';
  theme: string;
  selectedModel: string;
}

// Global declaration for Electron Native Desktop Bridge
declare global {
  interface Window {
    vajraDesktop?: {
      isElectron: boolean;
      platform: string;
      minimize: () => Promise<void>;
      maximize: () => Promise<void>;
      close: () => Promise<void>;
      isMaximized: () => Promise<boolean>;
      getSpecialFolders: () => Promise<{
        home: string;
        documents: string;
        downloads: string;
        desktop: string;
        pictures: string;
        music: string;
        videos: string;
        appData: string;
      }>;
      getSystemInfo: () => Promise<{
        platform: string;
        arch: string;
        version: string;
        hostname: string;
        uptime: number;
        totalMemory: number;
        freeMemory: number;
      }>;
      openApp: (appName: string) => Promise<{ success: boolean; message: string }>;
      getAvailableApps: () => Promise<string[]>;
      openUrl: (url: string) => Promise<{ success: boolean; message: string; target?: string }>;
      searchWeb: (query: string) => Promise<{ success: boolean; message: string; target?: string }>;
      openPath: (targetPath: string) => Promise<{ success: boolean; message: string; target?: string }>;
      createFolder: (folderPath: string) => Promise<{ success: boolean; message: string; target?: string }>;
      createFile: (filePath: string, content?: string) => Promise<{ success: boolean; message: string; target?: string }>;
      moveFile: (srcPath: string, destPath: string) => Promise<{ success: boolean; message: string; target?: string }>;
      copyFile: (srcPath: string, destPath: string) => Promise<{ success: boolean; message: string; target?: string }>;
      renameFile: (oldPath: string, newPath: string) => Promise<{ success: boolean; message: string; target?: string }>;
      deleteFile: (targetPath: string, confirmed?: boolean) => Promise<{ success: boolean; message: string; target?: string }>;
      listFiles: (dirPath?: string) => Promise<{
        success: boolean;
        message: string;
        items?: Array<{
          name: string;
          path: string;
          isDirectory: boolean;
          size: number;
          updatedAt: string;
        }>;
        target?: string;
      }>;
    };
  }
}
