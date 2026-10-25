import type { LLMAdapter, LLMProviderInfo, ModelMode, ChatMessagePayload, GenerationOptions, StreamCallbacks } from './types';
import { GeminiCloudAdapter } from './GeminiCloudAdapter';
import { LocalBrowserAdapter } from './LocalBrowserAdapter';

export class LLMManager {
  private adapters: Map<string, LLMAdapter> = new Map();
  private activeAdapterId: string = 'gemini-cloud';
  private forceOffline: boolean = false;

  constructor() {
    // Register Cloud and Local adapters
    const cloudAdapter = new GeminiCloudAdapter();
    const localAdapter = new LocalBrowserAdapter();

    this.adapters.set(cloudAdapter.id, cloudAdapter);
    this.adapters.set(localAdapter.id, localAdapter);

    // Initial state based on stored preferences or network status
    const savedEngine = typeof localStorage !== 'undefined' ? localStorage.getItem('nova_engine_mode') : null;
    const savedForceOffline = typeof localStorage !== 'undefined' ? localStorage.getItem('nova_force_offline') === 'true' : false;

    this.forceOffline = savedForceOffline;

    if (this.forceOffline || !navigator.onLine) {
      this.activeAdapterId = 'local-browser-engine';
    } else if (savedEngine && this.adapters.has(savedEngine)) {
      this.activeAdapterId = savedEngine;
    }
  }

  public getProviders(): LLMProviderInfo[] {
    return [
      {
        id: 'gemini-cloud',
        name: 'Gemini Cloud Engine',
        type: 'cloud',
        isOfflineCapable: false,
        description: 'Server-side Gemini 3.7 Flash model via secure backend proxy.',
        status: navigator.onLine ? 'ready' : 'available',
        badge: 'Cloud Powered',
      },
      {
        id: 'local-browser-engine',
        name: 'Local Offline Engine',
        type: 'local',
        isOfflineCapable: true,
        description: 'Runs 100% on-device inside your browser without any network connection.',
        status: 'ready',
        badge: '100% Offline',
      },
    ];
  }

  public getActiveAdapter(): LLMAdapter {
    if (this.forceOffline || !navigator.onLine) {
      return this.adapters.get('local-browser-engine') || new LocalBrowserAdapter();
    }
    return this.adapters.get(this.activeAdapterId) || this.adapters.get('gemini-cloud')!;
  }

  public setActiveAdapter(id: string): void {
    if (this.adapters.has(id)) {
      this.activeAdapterId = id;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('nova_engine_mode', id);
      }
    }
  }

  public setForceOffline(force: boolean): void {
    this.forceOffline = force;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('nova_force_offline', String(force));
    }
    if (force) {
      this.activeAdapterId = 'local-browser-engine';
    }
  }

  public isForceOffline(): boolean {
    return this.forceOffline;
  }

  public isOperatingOffline(): boolean {
    return this.forceOffline || !navigator.onLine || this.getActiveAdapter().type === 'local';
  }

  public async streamChat(
    messages: ChatMessagePayload[],
    options: GenerationOptions,
    callbacks: StreamCallbacks
  ): Promise<void> {
    const isLocal =
      options.modelId === 'local-browser-engine' ||
      this.forceOffline ||
      (typeof navigator !== 'undefined' && !navigator.onLine);

    const adapter = isLocal
      ? (this.adapters.get('local-browser-engine') || new LocalBrowserAdapter())
      : (this.adapters.get('gemini-cloud') || new GeminiCloudAdapter());

    return adapter.streamResponse(messages, options, callbacks);
  }
}

// Global Singleton for easy app-wide access
export const llmManager = new LLMManager();
export type * from './types';
export * from './GeminiCloudAdapter';
export * from './LocalBrowserAdapter';
