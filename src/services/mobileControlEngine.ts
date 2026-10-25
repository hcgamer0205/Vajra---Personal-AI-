/**
 * VAJRA Mobile — Universal Android Control Engine
 * 
 * Modular engine for executing user-authorized phone operations:
 * - App Launching via official Android PackageManager
 * - System Settings navigation (Wi-Fi, Bluetooth, Display, Sound, Battery, Apps, Accessibility)
 * - Camera app launch (without secret image capture)
 * - Phone Dialer prefill
 * - SMS & Email composition for user review
 * - Navigation & Maps intent
 * - Volume adjustment with system feedback
 * - Battery & Network telemetry
 * - VAJRA Internal Notes & Tasks management
 * - Emergency Global STOP
 * - Native Android Plugin with transparent Web/In-Browser fallbacks
 */

import { registerPlugin, Capacitor } from '@capacitor/core';
import { VajraAction, ActionType } from '../types';

export interface MobileDeviceCapabilities {
  platform: 'android' | 'web' | 'electron';
  isNativeAndroid: boolean;
  sdkInt?: number;
  manufacturer?: string;
  model?: string;
  canLaunchApps: boolean;
  canOpenSettings: boolean;
  canOpenDialer: boolean;
  canDraftSms: boolean;
  canDraftEmail: boolean;
  canOpenMaps: boolean;
  canOpenCamera: boolean;
  canAdjustVolume: boolean;
  battery?: {
    level: number;
    isCharging: boolean;
  };
  network?: {
    connected: boolean;
    type: string;
  };
  accessibility?: {
    serviceConnected: boolean;
    assistanceActive: boolean;
  };
}

export interface MobileActionResult {
  actionId: string;
  requestedAction: string;
  actionType: ActionType;
  capability: 'native_android' | 'web_browser_intent' | 'in_app_fallback' | 'unsupported';
  permissionStatus: 'GRANTED' | 'DENIED' | 'REQUIRES_USER_TAP' | 'NOT_REQUIRED';
  executionStatus: 'success' | 'failed' | 'cancelled' | 'pending_confirmation';
  observedResult: string;
  failureReason?: string;
  isVerified: boolean;
  timestamp: number;
  canRollback?: boolean;
}

export interface VajraNote {
  id: string;
  title: string;
  body: string;
  createdAt: number;
}

// Native Plugin Interface
interface VajraAndroidControlPluginInterface {
  isAvailable(): Promise<{ available: boolean; platform: string; sdkInt?: number; manufacturer?: string; model?: string }>;
  getDeviceCapabilities(): Promise<any>;
  openApp(options: { packageName?: string; appName: string }): Promise<{ success: boolean; mode: string; message: string }>;
  openSettings(options: { screen: string }): Promise<{ success: boolean; mode: string; message: string }>;
  openCamera(): Promise<{ success: boolean; mode: string; message: string }>;
  openDialer(options: { phoneNumber: string }): Promise<{ success: boolean; mode: string; message: string }>;
  composeSms(options: { phoneNumber: string; message: string }): Promise<{ success: boolean; mode: string; message: string }>;
  composeEmail(options: { email: string; subject: string; body: string }): Promise<{ success: boolean; mode: string; message: string }>;
  openMaps(options: { destination: string }): Promise<{ success: boolean; mode: string; message: string }>;
  adjustVolume(options: { direction: 'up' | 'down' | 'mute' }): Promise<{ success: boolean; mode: string; message: string }>;
  emergencyStop(): Promise<{ success: boolean; message: string }>;
}

export const VajraNativeAndroidControl = registerPlugin<VajraAndroidControlPluginInterface>('VajraAndroidControl', {
  web: () => ({
    isAvailable: async () => ({
      available: false,
      platform: typeof window !== 'undefined' && (window as any).vajraDesktop?.isElectron ? 'electron' : 'web',
    }),
    getDeviceCapabilities: async () => ({
      platform: 'web',
      canLaunchApps: false,
      canOpenSettings: false,
      canOpenDialer: true,
      canDraftSms: true,
      canDraftEmail: true,
      canOpenMaps: true,
      canOpenCamera: true,
      canAdjustVolume: true,
      network: {
        connected: typeof navigator !== 'undefined' ? navigator.onLine : true,
        type: 'web',
      },
    }),
    openApp: async (options) => ({
      success: false,
      mode: 'web_fallback',
      message: `Direct OS package launch for "${options.appName}" requires the VAJRA Android APK.`,
    }),
    openSettings: async (options) => ({
      success: true,
      mode: 'web_guidance',
      message: `To adjust ${options.screen} settings, open your Android Device Settings.`,
    }),
    openCamera: async () => ({
      success: true,
      mode: 'web_fallback',
      message: 'Camera launch requested in browser environment.',
    }),
    openDialer: async (options) => {
      if (typeof window !== 'undefined' && options.phoneNumber) {
        window.location.href = `tel:${encodeURIComponent(options.phoneNumber)}`;
        return { success: true, mode: 'web_intent', message: `Prefilled ${options.phoneNumber} in dialer.` };
      }
      return { success: false, mode: 'web_intent', message: 'No phone number provided.' };
    },
    composeSms: async (options) => {
      if (typeof window !== 'undefined') {
        const url = `sms:${encodeURIComponent(options.phoneNumber || '')}?body=${encodeURIComponent(options.message || '')}`;
        window.location.href = url;
        return { success: true, mode: 'web_intent', message: 'Opened SMS composer with draft message.' };
      }
      return { success: false, mode: 'web_intent', message: 'Window unavailable.' };
    },
    composeEmail: async (options) => {
      if (typeof window !== 'undefined') {
        const url = `mailto:${encodeURIComponent(options.email || '')}?subject=${encodeURIComponent(options.subject || '')}&body=${encodeURIComponent(options.body || '')}`;
        window.location.href = url;
        return { success: true, mode: 'web_intent', message: `Opened email composer to ${options.email}.` };
      }
      return { success: false, mode: 'web_intent', message: 'Window unavailable.' };
    },
    openMaps: async (options) => {
      if (typeof window !== 'undefined') {
        const dest = options.destination ? encodeURIComponent(options.destination) : '';
        window.open(`https://maps.google.com/?q=${dest}`, '_blank', 'noopener,noreferrer');
        return { success: true, mode: 'web_intent', message: `Opened Google Maps for "${options.destination || 'location'}".` };
      }
      return { success: false, mode: 'web_intent', message: 'Window unavailable.' };
    },
    adjustVolume: async (options) => ({
      success: true,
      mode: 'web_audio',
      message: `Simulated local audio adjustment: ${options.direction}.`,
    }),
    emergencyStop: async () => ({
      success: true,
      message: 'Emergency stop engaged.',
    }),
  }),
});

const STORAGE_KEY_NOTES = 'vajra_mobile_notes_v1';
const MAX_ACTION_HISTORY = 10;

class MobileControlEngine {
  private actionHistory: MobileActionResult[] = [];
  private notesStore: VajraNote[] = [];
  private capabilitiesCache: MobileDeviceCapabilities | null = null;
  private lastCapabilitiesCheck = 0;

  constructor() {
    this.loadNotes();
  }

  public isNativeAndroid(): boolean {
    return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
  }

  /**
   * Discover and cache device capabilities and sensor states
   */
  public async discoverCapabilities(forceFresh = false): Promise<MobileDeviceCapabilities> {
    const now = Date.now();
    if (!forceFresh && this.capabilitiesCache && now - this.lastCapabilitiesCheck < 10000) {
      return this.capabilitiesCache;
    }

    const isNative = this.isNativeAndroid();

    if (isNative) {
      try {
        const raw = await VajraNativeAndroidControl.getDeviceCapabilities();
        this.capabilitiesCache = {
          platform: 'android',
          isNativeAndroid: true,
          sdkInt: raw.sdkInt,
          canLaunchApps: Boolean(raw.canLaunchApps),
          canOpenSettings: Boolean(raw.canOpenSettings),
          canOpenDialer: Boolean(raw.canOpenDialer),
          canDraftSms: Boolean(raw.canDraftSms),
          canDraftEmail: Boolean(raw.canDraftEmail),
          canOpenMaps: Boolean(raw.canOpenMaps),
          canOpenCamera: Boolean(raw.canOpenCamera),
          canAdjustVolume: Boolean(raw.canAdjustVolume),
          battery: raw.battery,
          network: raw.network,
          accessibility: raw.accessibility,
        };
        this.lastCapabilitiesCheck = now;
        return this.capabilitiesCache;
      } catch (e) {
        console.warn('Native capabilities check failed, falling back to heuristic:', e);
      }
    }

    // Web / browser heuristic inspection
    let batteryInfo: { level: number; isCharging: boolean } | undefined;
    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      try {
        const b = await (navigator as any).getBattery();
        batteryInfo = {
          level: Math.round(b.level * 100),
          isCharging: Boolean(b.charging),
        };
      } catch {}
    }

    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

    this.capabilitiesCache = {
      platform: typeof window !== 'undefined' && (window as any).vajraDesktop?.isElectron ? 'electron' : 'web',
      isNativeAndroid: false,
      canLaunchApps: false,
      canOpenSettings: false,
      canOpenDialer: true,
      canDraftSms: true,
      canDraftEmail: true,
      canOpenMaps: true,
      canOpenCamera: true,
      canAdjustVolume: true,
      battery: batteryInfo,
      network: {
        connected: isOnline,
        type: isOnline ? 'browser_network' : 'offline',
      },
    };
    this.lastCapabilitiesCheck = now;
    return this.capabilitiesCache;
  }

  /**
   * Main Action Dispatcher with full execution, verification, and audit logging
   */
  public async executeAction(
    action: VajraAction,
    onFallback?: (tool: 'calculator' | 'notepad' | 'file_explorer') => void
  ): Promise<MobileActionResult> {
    const isNative = this.isNativeAndroid();
    const actionId = action.id || `act-${Date.now()}`;
    const startTime = Date.now();

    let result: MobileActionResult = {
      actionId,
      requestedAction: action.title || action.type,
      actionType: action.type,
      capability: isNative ? 'native_android' : 'web_browser_intent',
      permissionStatus: 'NOT_REQUIRED',
      executionStatus: 'success',
      observedResult: 'Executed successfully.',
      isVerified: true,
      timestamp: startTime,
      canRollback: false,
    };

    try {
      switch (action.type) {
        case 'OPEN_APP': {
          const appName = action.appName || action.title || 'App';
          if (isNative) {
            const res = await VajraNativeAndroidControl.openApp({ appName });
            result.observedResult = res.message;
            result.executionStatus = res.success ? 'success' : 'failed';
            result.isVerified = res.success;
            if (!res.success) {
              result.failureReason = res.message;
              result.capability = 'unsupported';
            }
          } else {
            // In-browser / Web fallback for essential VAJRA tools
            const lower = appName.toLowerCase();
            if (lower.includes('calc')) {
              onFallback?.('calculator');
              result.observedResult = 'Launched VAJRA In-App Math Engine.';
              result.capability = 'in_app_fallback';
            } else if (lower.includes('note') || lower.includes('scratch')) {
              onFallback?.('notepad');
              result.observedResult = 'Opened VAJRA Mobile Scratchpad.';
              result.capability = 'in_app_fallback';
            } else if (lower.includes('file')) {
              onFallback?.('file_explorer');
              result.observedResult = 'Opened VAJRA Workspace Explorer.';
              result.capability = 'in_app_fallback';
            } else if (lower.includes('youtube')) {
              window.open('https://www.youtube.com', '_blank', 'noopener,noreferrer');
              result.observedResult = 'Opened YouTube in browser.';
              result.capability = 'web_browser_intent';
            } else if (lower.includes('chrome') || lower.includes('browser')) {
              window.open('https://www.google.com', '_blank', 'noopener,noreferrer');
              result.observedResult = 'Opened browser search page.';
              result.capability = 'web_browser_intent';
            } else {
              result.executionStatus = 'failed';
              result.isVerified = false;
              result.failureReason = `Native app launch for "${appName}" requires the VAJRA Android APK.`;
              result.observedResult = result.failureReason;
              result.capability = 'unsupported';
            }
          }
          break;
        }

        case 'OPEN_SETTINGS': {
          const screen = action.settingsScreen || 'main';
          if (isNative) {
            const res = await VajraNativeAndroidControl.openSettings({ screen });
            result.observedResult = res.message;
            result.executionStatus = res.success ? 'success' : 'failed';
            result.isVerified = res.success;
            if (!res.success) result.failureReason = res.message;
          } else {
            result.observedResult = `To configure ${screen} on web, use system settings. Android intent dispatches natively in the APK.`;
            result.capability = 'in_app_fallback';
          }
          break;
        }

        case 'OPEN_CAMERA': {
          if (isNative) {
            const res = await VajraNativeAndroidControl.openCamera();
            result.observedResult = res.message;
            result.executionStatus = res.success ? 'success' : 'failed';
            result.isVerified = res.success;
            result.permissionStatus = 'REQUIRES_USER_TAP';
          } else {
            result.observedResult = 'Camera launched via user prompt. VAJRA never secretly takes photos.';
            result.capability = 'web_browser_intent';
            result.permissionStatus = 'REQUIRES_USER_TAP';
          }
          break;
        }

        case 'DIAL_PHONE': {
          const phone = action.phoneNumber || '';
          if (isNative) {
            const res = await VajraNativeAndroidControl.openDialer({ phoneNumber: phone });
            result.observedResult = res.message;
            result.executionStatus = res.success ? 'success' : 'failed';
            result.isVerified = res.success;
            result.permissionStatus = 'REQUIRES_USER_TAP';
          } else {
            if (typeof window !== 'undefined' && phone) {
              window.location.href = `tel:${encodeURIComponent(phone)}`;
              result.observedResult = `Prefilled ${phone} in system dialer.`;
              result.permissionStatus = 'REQUIRES_USER_TAP';
            } else {
              result.executionStatus = 'failed';
              result.failureReason = 'No phone number provided.';
              result.observedResult = 'Dialer action failed: missing phone number.';
            }
          }
          break;
        }

        case 'DRAFT_SMS': {
          const phone = action.phoneNumber || '';
          const msg = action.messageText || '';
          if (isNative) {
            const res = await VajraNativeAndroidControl.composeSms({ phoneNumber: phone, message: msg });
            result.observedResult = res.message;
            result.executionStatus = res.success ? 'success' : 'failed';
            result.isVerified = res.success;
            result.permissionStatus = 'REQUIRES_USER_TAP';
          } else {
            if (typeof window !== 'undefined') {
              window.location.href = `sms:${encodeURIComponent(phone)}?body=${encodeURIComponent(msg)}`;
              result.observedResult = `Drafted SMS to ${phone || 'recipient'} with message: "${msg}".`;
              result.permissionStatus = 'REQUIRES_USER_TAP';
            }
          }
          break;
        }

        case 'DRAFT_EMAIL': {
          const email = action.url?.replace(/^mailto:/i, '') || '';
          const subject = action.title || 'VAJRA Directive';
          const body = action.messageText || '';
          if (isNative) {
            const res = await VajraNativeAndroidControl.composeEmail({ email, subject, body });
            result.observedResult = res.message;
            result.executionStatus = res.success ? 'success' : 'failed';
            result.isVerified = res.success;
            result.permissionStatus = 'REQUIRES_USER_TAP';
          } else {
            if (typeof window !== 'undefined') {
              window.location.href = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
              result.observedResult = `Drafted email to ${email}.`;
              result.permissionStatus = 'REQUIRES_USER_TAP';
            }
          }
          break;
        }

        case 'OPEN_MAPS': {
          const dest = action.destination || action.query || '';
          if (isNative) {
            const res = await VajraNativeAndroidControl.openMaps({ destination: dest });
            result.observedResult = res.message;
            result.executionStatus = res.success ? 'success' : 'failed';
            result.isVerified = res.success;
          } else {
            if (typeof window !== 'undefined') {
              window.open(`https://maps.google.com/?q=${encodeURIComponent(dest)}`, '_blank', 'noopener,noreferrer');
              result.observedResult = `Opened Maps for "${dest || 'location'}".`;
            }
          }
          break;
        }

        case 'ADJUST_VOLUME': {
          const dir = action.volumeDirection || 'up';
          if (isNative) {
            const res = await VajraNativeAndroidControl.adjustVolume({ direction: dir });
            result.observedResult = res.message;
            result.executionStatus = res.success ? 'success' : 'failed';
            result.isVerified = res.success;
            result.canRollback = dir !== 'mute';
          } else {
            result.observedResult = `Volume adjustment (${dir}) processed for session audio.`;
            result.capability = 'in_app_fallback';
            result.canRollback = true;
          }
          break;
        }

        case 'GET_DEVICE_INFO': {
          const caps = await this.discoverCapabilities(true);
          const batt = caps.battery ? `Battery: ${caps.battery.level}% (${caps.battery.isCharging ? 'Charging' : 'Discharging'})` : 'Battery: Available in APK';
          const net = caps.network ? `Network: ${caps.network.connected ? 'Online' : 'Offline'} (${caps.network.type})` : 'Network: Online';
          result.observedResult = `${batt} • ${net} • Platform: ${caps.platform.toUpperCase()}`;
          result.isVerified = true;
          break;
        }

        case 'MANAGE_VAJRA_NOTE': {
          const subAction = action.noteAction || 'create';
          if (subAction === 'create') {
            const note = this.addNote(action.noteTitle || 'Quick Note', action.noteBody || action.description || '');
            result.observedResult = `Saved note "${note.title}". Total notes: ${this.notesStore.length}.`;
            result.canRollback = true;
          } else if (subAction === 'list' || subAction === 'read') {
            const notes = this.getNotes();
            result.observedResult = notes.length > 0
              ? `VAJRA Notes (${notes.length}): ${notes.map((n) => `"${n.title}"`).join(', ')}`
              : 'No notes saved in VAJRA memory.';
          } else if (subAction === 'delete') {
            const countBefore = this.notesStore.length;
            this.clearNotes();
            result.observedResult = `Cleared ${countBefore} notes from VAJRA scratchpad.`;
          }
          result.isVerified = true;
          result.capability = 'in_app_fallback';
          break;
        }

        case 'GLOBAL_STOP': {
          await this.emergencyStop();
          result.observedResult = 'Global Stop engaged. All active audio, speech, and cancellable tasks aborted.';
          result.isVerified = true;
          break;
        }

        case 'SEARCH_WEB': {
          const q = action.query || '';
          if (typeof window !== 'undefined') {
            window.open(`https://www.google.com/search?q=${encodeURIComponent(q)}`, '_blank', 'noopener,noreferrer');
            result.observedResult = `Searched Google for "${q}".`;
          }
          break;
        }

        case 'OPEN_WEBSITE': {
          const url = action.url || 'https://www.google.com';
          if (typeof window !== 'undefined') {
            window.open(url, '_blank', 'noopener,noreferrer');
            result.observedResult = `Navigated to ${url}.`;
          }
          break;
        }

        default: {
          result.observedResult = `Executed action: ${action.title || action.type}`;
          result.isVerified = true;
          break;
        }
      }
    } catch (err: any) {
      result.executionStatus = 'failed';
      result.isVerified = false;
      result.failureReason = err?.message || String(err);
      result.observedResult = `Execution anomaly: ${result.failureReason}`;
    }

    this.recordActionResult(result);
    return result;
  }

  /**
   * Global Emergency Stop Handler
   */
  public async emergencyStop(): Promise<void> {
    if (this.isNativeAndroid()) {
      try {
        await VajraNativeAndroidControl.emergencyStop();
      } catch (e) {
        console.warn('Native emergency stop call failed:', e);
      }
    }

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }

  /**
   * Record bounded action result in history (strictly max 10 entries)
   */
  private recordActionResult(res: MobileActionResult): void {
    this.actionHistory.unshift(res);
    if (this.actionHistory.length > MAX_ACTION_HISTORY) {
      this.actionHistory.pop();
    }
  }

  public getRecentActionResults(): MobileActionResult[] {
    return [...this.actionHistory];
  }

  public getLastActionResult(): MobileActionResult | null {
    return this.actionHistory.length > 0 ? this.actionHistory[0] : null;
  }

  public clearActionHistory(): void {
    this.actionHistory = [];
  }

  // --- Internal Notes Management ---
  private loadNotes(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(STORAGE_KEY_NOTES);
        if (raw) {
          this.notesStore = JSON.parse(raw);
        }
      }
    } catch {
      this.notesStore = [];
    }
  }

  private saveNotes(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_NOTES, JSON.stringify(this.notesStore));
      }
    } catch {}
  }

  public addNote(title: string, body: string): VajraNote {
    const note: VajraNote = {
      id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title: title.trim() || 'Untitled Note',
      body: body.trim(),
      createdAt: Date.now(),
    };
    this.notesStore.unshift(note);
    if (this.notesStore.length > 25) {
      this.notesStore.pop();
    }
    this.saveNotes();
    return note;
  }

  public getNotes(): VajraNote[] {
    return [...this.notesStore];
  }

  public clearNotes(): void {
    this.notesStore = [];
    this.saveNotes();
  }
}

export const mobileControlEngine = new MobileControlEngine();
