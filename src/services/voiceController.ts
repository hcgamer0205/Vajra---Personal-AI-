/**
 * VAJRA Mobile & Web — Unified Voice Controller Architecture
 * 
 * Provides a single, clean logical voice abstraction across:
 * 1. Native Android Speech Recognition & Dedicated Wake Word Detection
 * 2. Standard Web & PWA (Web Speech API / SpeechRecognition)
 * 3. Safe Keyboard Fallback (When audio hardware or permissions are denied/unsupported)
 * 
 * Strict Guarantees:
 * - Single recognition session per user tap / wake event
 * - Dedicated Wake Word layer ("Hello Vajra", "Hey Vajra", "Hi Vajra")
 * - Strict duplicate event protection (no duplicate transcript insertion or double command triggers)
 * - Zero desktop/browser-troubleshooting prompts shown to mobile Android users
 * - Clean permission lifecycle (NOT_REQUESTED -> GRANTED / DENIED / BLOCKED / UNAVAILABLE)
 * - Automatic cleanup of resources, media streams, and native listeners
 */

import { registerPlugin, Capacitor, PluginListenerHandle } from '@capacitor/core';
import { VoicePipelineStageId, StageStatus, mapSpeechError } from './voicePipeline';

export type MicrophonePermissionState =
  | 'NOT_REQUESTED'
  | 'GRANTED'
  | 'DENIED'
  | 'BLOCKED'
  | 'UNAVAILABLE';

export type VoiceActivationMode =
  | 'WAKE_DISABLED'
  | 'WAKE_STANDBY'
  | 'WAKE_DETECTED'
  | 'WAKE_ACKNOWLEDGING'
  | 'LISTENING'
  | 'PROCESSING'
  | 'SPEAKING'
  | 'RETURNING_TO_STANDBY';

export interface WakeDetectionResult {
  isWakePhrase: boolean;
  matchedPhrase?: 'Hello Vajra' | 'Hey Vajra' | 'Hi Vajra';
  remainingCommand?: string;
}

/**
 * Robust, conservative wake phrase detector and command extractor
 */
export function parseWakePhrase(transcript: string): WakeDetectionResult {
  if (!transcript) return { isWakePhrase: false };
  const clean = transcript.trim();
  // Match "hello vajra", "hey vajra", "hi vajra", "hello jarvis", "hey jarvis", "jarvis" (case-insensitive)
  const match = clean.match(/^(?:hello|hey|hi|ok)?\s*(?:vajra|jarvis)\b[\s,.:;!-]*(.*)$/i);
  if (match) {
    const prefix = clean.slice(0, clean.length - (match[1]?.length || 0)).trim().replace(/[\s,.:;!-]+$/, '');
    let canonical: 'Hello Vajra' | 'Hey Vajra' | 'Hi Vajra' = 'Hello Vajra';
    if (/^hey/i.test(prefix)) canonical = 'Hey Vajra';
    else if (/^hi/i.test(prefix)) canonical = 'Hi Vajra';

    const remaining = (match[1] || '').trim();
    return {
      isWakePhrase: true,
      matchedPhrase: canonical,
      remainingCommand: remaining.length > 0 ? remaining : undefined,
    };
  }
  return { isWakePhrase: false };
}

export interface VoiceSessionCallbacks {
  onListeningState: (isListening: boolean) => void;
  onPartialTranscript: (text: string) => void;
  onFinalTranscript: (text: string) => void;
  onError: (error: { code: string; message: string; isPermissionDenied?: boolean }) => void;
  onStageUpdate?: (
    stageId: VoicePipelineStageId,
    status: StageStatus,
    message: string,
    detail?: string,
    error?: boolean
  ) => void;
  onAudioAmplitude?: (amplitude: number) => void;
}

export interface VoiceControllerStatus {
  isListening: boolean;
  platform: 'android_native' | 'web_speech' | 'unsupported';
  permissionState: MicrophonePermissionState;
  isNativeAndroid: boolean;
  wakeMode: VoiceActivationMode;
}

/**
 * Capacitor Plugin interface for Native Android SpeechRecognizer & Wake Word
 */
export interface VajraNativeSpeechPlugin {
  isAvailable(): Promise<{ available: boolean }>;
  checkPermission(): Promise<{ permissionState: MicrophonePermissionState }>;
  requestPermission(): Promise<{ permissionState: MicrophonePermissionState }>;
  startListening(options: { language?: string }): Promise<{ success: boolean; message?: string }>;
  stopListening(): Promise<{ success: boolean }>;
  isListening(): Promise<{ isListening: boolean }>;
  startWakeWord(options?: { language?: string }): Promise<{ success: boolean; message?: string }>;
  stopWakeWord(): Promise<{ success: boolean }>;
  isWakeWordActive(): Promise<{ active: boolean }>;
  cleanup(): Promise<{ success: boolean }>;
  addListener(
    eventName: 'listeningState',
    listenerFunc: (state: { isListening: boolean }) => void
  ): Promise<PluginListenerHandle>;
  addListener(
    eventName: 'partialResult',
    listenerFunc: (result: { text: string }) => void
  ): Promise<PluginListenerHandle>;
  addListener(
    eventName: 'finalResult',
    listenerFunc: (result: { text: string }) => void
  ): Promise<PluginListenerHandle>;
  addListener(
    eventName: 'wakeWordDetected',
    listenerFunc: (data: { phrase: string; remainingCommand?: string }) => void
  ): Promise<PluginListenerHandle>;
  addListener(
    eventName: 'error',
    listenerFunc: (error: { code: string; message: string; isPermissionDenied?: boolean }) => void
  ): Promise<PluginListenerHandle>;
  removeAllListeners(): Promise<void>;
}

export const VajraNativeSpeech = registerPlugin<VajraNativeSpeechPlugin>('VajraNativeSpeech', {
  web: () => ({
    isAvailable: async () => ({ available: false }),
    checkPermission: async () => ({ permissionState: 'UNAVAILABLE' as MicrophonePermissionState }),
    requestPermission: async () => ({ permissionState: 'UNAVAILABLE' as MicrophonePermissionState }),
    startListening: async () => ({ success: false, message: 'Native speech only available on Android' }),
    stopListening: async () => ({ success: true }),
    isListening: async () => ({ isListening: false }),
    startWakeWord: async () => ({ success: false, message: 'Wake word native only available on Android' }),
    stopWakeWord: async () => ({ success: true }),
    isWakeWordActive: async () => ({ active: false }),
    cleanup: async () => ({ success: true }),
    addListener: async () => ({ remove: async () => {} }),
    removeAllListeners: async () => {},
  }),
});

export class VoiceController {
  private activeSessionId = 0;
  private currentRecognition: any = null;
  private currentStream: MediaStream | null = null;
  private currentAudioContext: AudioContext | null = null;
  private currentAudioSource: MediaStreamAudioSourceNode | null = null;
  private currentAudioAnimId: number | null = null;
  private nativeListeners: PluginListenerHandle[] = [];
  private wakeListenerHandle: PluginListenerHandle | null = null;
  private callbacks: VoiceSessionCallbacks | null = null;
  private permissionState: MicrophonePermissionState = 'NOT_REQUESTED';
  private lastFinalTranscript = '';
  private lastProcessedTimestamp = 0;
  private isCurrentlyListening = false;
  private platformOverride: 'android_native' | 'web_speech' | null = null;

  // Wake-word layer
  private wakeActivationMode: VoiceActivationMode = 'WAKE_DISABLED';
  private onWakeCallback: ((data: { phrase: string; remainingCommand?: string }) => void) | null = null;
  private lastWakeTimestamp = 0;

  /**
   * Determine platform runtime (Android Native vs Browser/PWA)
   */
  public isNativeAndroid(): boolean {
    if (this.platformOverride === 'android_native') return true;
    if (this.platformOverride === 'web_speech') return false;
    if (typeof window === 'undefined') return false;
    return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
  }

  /**
   * Test-only platform override helper
   */
  public __setPlatformOverride(override: 'android_native' | 'web_speech' | null): void {
    this.platformOverride = override;
  }

  public getPlatformType(): 'android_native' | 'web_speech' | 'unsupported' {
    if (this.isNativeAndroid()) {
      return 'android_native';
    }
    if (this.platformOverride === 'web_speech') {
      return 'web_speech';
    }
    if (this.hasWebSpeechSupport()) {
      return 'web_speech';
    }
    return 'unsupported';
  }

  public hasWebSpeechSupport(): boolean {
    if (typeof window === 'undefined') return false;
    return Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  }

  public hasMediaDevicesSupport(): boolean {
    if (typeof navigator === 'undefined') return false;
    return Boolean(navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function');
  }

  public isListening(): boolean {
    return this.isCurrentlyListening;
  }

  public getPermissionState(): MicrophonePermissionState {
    return this.permissionState;
  }

  public getWakeMode(): VoiceActivationMode {
    return this.wakeActivationMode;
  }

  public setWakeMode(mode: VoiceActivationMode): void {
    this.wakeActivationMode = mode;
  }

  public isVoiceActivationEnabled(): boolean {
    return this.wakeActivationMode !== 'WAKE_DISABLED';
  }

  public registerWakeCallback(cb: (data: { phrase: string; remainingCommand?: string }) => void): void {
    this.onWakeCallback = cb;
  }

  /**
   * Explicitly request microphone permission on user tap or settings activation
   */
  public async requestPermission(): Promise<MicrophonePermissionState> {
    if (this.isNativeAndroid()) {
      try {
        const res = await VajraNativeSpeech.requestPermission();
        this.permissionState = res.permissionState;
        return this.permissionState;
      } catch {
        this.permissionState = 'DENIED';
        return 'DENIED';
      }
    }

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      this.permissionState = 'UNAVAILABLE';
      return 'UNAVAILABLE';
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Immediately close probing stream to avoid leaving microphone indicator active
      stream.getTracks().forEach((track) => track.stop());
      this.permissionState = 'GRANTED';
      return 'GRANTED';
    } catch (err: any) {
      const errName = err?.name || '';
      if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
        this.permissionState = 'DENIED';
      } else if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
        this.permissionState = 'UNAVAILABLE';
      } else {
        this.permissionState = 'BLOCKED';
      }
      return this.permissionState;
    }
  }

  /**
   * Enable Voice Activation (Wake Word Standby)
   */
  public async enableVoiceActivation(language = 'en-US'): Promise<boolean> {
    if (this.permissionState !== 'GRANTED') {
      const state = await this.requestPermission();
      if (state !== 'GRANTED') {
        this.wakeActivationMode = 'WAKE_DISABLED';
        return false;
      }
    }

    this.wakeActivationMode = 'WAKE_STANDBY';

    if (this.isNativeAndroid()) {
      try {
        if (!this.wakeListenerHandle) {
          this.wakeListenerHandle = await VajraNativeSpeech.addListener('wakeWordDetected', (data) => {
            this.handleWakeEvent(data.phrase, data.remainingCommand);
          });
        }
        await VajraNativeSpeech.startWakeWord({ language });
        return true;
      } catch {
        this.wakeActivationMode = 'WAKE_DISABLED';
        return false;
      }
    }

    return true;
  }

  /**
   * Disable Voice Activation
   */
  public async disableVoiceActivation(): Promise<void> {
    this.wakeActivationMode = 'WAKE_DISABLED';
    if (this.isNativeAndroid()) {
      try {
        await VajraNativeSpeech.stopWakeWord();
      } catch {}
      if (this.wakeListenerHandle) {
        try {
          this.wakeListenerHandle.remove();
        } catch {}
        this.wakeListenerHandle = null;
      }
    }
  }

  /**
   * Safe Wake Event Dispatcher with duplicate protection and mutual exclusion
   */
  public handleWakeEvent(phrase: string, remainingCommand?: string): boolean {
    if (this.wakeActivationMode === 'WAKE_DISABLED') {
      return false;
    }

    const now = Date.now();
    // 2000ms cooldown to protect against duplicate wake triggering
    if (now - this.lastWakeTimestamp < 2000) {
      return false;
    }
    this.lastWakeTimestamp = now;

    // Do not trigger wake if already actively listening to command or acknowledging
    if (this.wakeActivationMode === 'LISTENING' || this.wakeActivationMode === 'WAKE_ACKNOWLEDGING') {
      return false;
    }

    this.wakeActivationMode = 'WAKE_DETECTED';

    if (this.onWakeCallback) {
      this.onWakeCallback({ phrase, remainingCommand });
      return true;
    }
    return false;
  }

  /**
   * Safe Barge-In: interrupt speaking state on explicit wake
   */
  public handleBargeIn(): boolean {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    return this.handleWakeEvent('Hello Vajra');
  }

  /**
   * Start listening session with strict duplicate prevention and platform resolution
   */
  public async startListening(
    callbacks: VoiceSessionCallbacks,
    language = 'en-US'
  ): Promise<boolean> {
    // 1. Teardown any running session cleanly
    this.stopListening();

    const sessionId = ++this.activeSessionId;
    this.callbacks = callbacks;
    this.lastFinalTranscript = '';

    callbacks.onStageUpdate?.('microphone', 'checking', 'Checking microphone permission...');

    // 2. Check or request microphone permission
    if (this.permissionState !== 'GRANTED') {
      const state = await this.requestPermission();
      if (sessionId !== this.activeSessionId) return false;

      if (state !== 'GRANTED') {
        const errorMsg = this.isNativeAndroid()
          ? 'Microphone permission is required for voice input.'
          : 'Microphone access is disabled. You can type commands directly.';

        callbacks.onStageUpdate?.(
          'microphone',
          'failed',
          errorMsg,
          undefined,
          true
        );
        callbacks.onError({
          code: 'permission-denied',
          message: errorMsg,
          isPermissionDenied: true,
        });
        return false;
      }
    }

    callbacks.onStageUpdate?.('microphone', 'success', 'Microphone active.');

    // 3. Optional Real-time Audio Amplitude Sampling
    if (callbacks.onAudioAmplitude && typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          if (!this.isCurrentlyListening && sessionId !== this.activeSessionId) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }
          this.currentStream = stream;
          const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioCtx) {
            const ctx = new AudioCtx();
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 64;
            const source = ctx.createMediaStreamSource(stream);
            source.connect(analyser);
            this.currentAudioContext = ctx;
            this.currentAudioSource = source;
            const dataArray = new Uint8Array(analyser.frequencyBinCount);

            const checkVolume = () => {
              if (!this.isCurrentlyListening || sessionId !== this.activeSessionId) {
                try {
                  source.disconnect();
                  ctx.close();
                } catch {}
                this.currentAudioContext = null;
                this.currentAudioSource = null;
                this.currentAudioAnimId = null;
                return;
              }
              analyser.getByteFrequencyData(dataArray);
              let sum = 0;
              for (let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i];
              }
              const avg = sum / dataArray.length;
              callbacks.onAudioAmplitude?.(Math.min(avg / 110, 1.0));
              this.currentAudioAnimId = requestAnimationFrame(checkVolume);
            };
            this.currentAudioAnimId = requestAnimationFrame(checkVolume);
          }
        })
        .catch(() => {});
    }

    // 4. Provider Selection:
    // IF Capacitor Android native runtime -> Native Android SpeechRecognizer provider
    // ELSE IF normal browser/PWA -> Web Speech API provider
    if (this.isNativeAndroid()) {
      return this.startNativeAndroidListening(sessionId, callbacks, language);
    } else {
      return this.startWebSpeechListening(sessionId, callbacks, language);
    }
  }

  /**
   * Native Android Provider: uses android.speech.SpeechRecognizer via VajraNativeSpeechPlugin
   */
  private async startNativeAndroidListening(
    sessionId: number,
    callbacks: VoiceSessionCallbacks,
    language: string
  ): Promise<boolean> {
    try {
      callbacks.onStageUpdate?.(
        'speech_recognition',
        'checking',
        'Initializing native Android SpeechRecognizer...'
      );

      const avail = await VajraNativeSpeech.isAvailable();
      if (!avail.available) {
        const msg = 'Voice input is unavailable on this device.';
        callbacks.onStageUpdate?.('speech_recognition', 'unsupported', msg, undefined, true);
        callbacks.onError({
          code: 'unsupported',
          message: msg,
        });
        return false;
      }

      this.clearNativeListeners();

      const stateHandle = await VajraNativeSpeech.addListener('listeningState', (state) => {
        if (sessionId !== this.activeSessionId) return;
        this.isCurrentlyListening = state.isListening;
        callbacks.onListeningState(state.isListening);
        if (state.isListening) {
          this.wakeActivationMode = 'LISTENING';
          callbacks.onStageUpdate?.(
            'speech_recognition',
            'active',
            'Native Android speech recognizer active and listening...'
          );
          callbacks.onStageUpdate?.('transcription', 'active', 'Listening for speech input...');
        }
      });
      this.nativeListeners.push(stateHandle);

      const partialHandle = await VajraNativeSpeech.addListener('partialResult', (res) => {
        if (sessionId !== this.activeSessionId) return;
        const text = (res?.text || '').trim();
        if (text) {
          callbacks.onPartialTranscript(text);
        }
      });
      this.nativeListeners.push(partialHandle);

      const finalHandle = await VajraNativeSpeech.addListener('finalResult', (res) => {
        if (sessionId !== this.activeSessionId) return;
        const text = (res?.text || '').trim();
        if (text) {
          this.dispatchFinalTranscript(sessionId, text);
        }
      });
      this.nativeListeners.push(finalHandle);

      const errorHandle = await VajraNativeSpeech.addListener('error', (err) => {
        if (sessionId !== this.activeSessionId) return;
        this.isCurrentlyListening = false;
        callbacks.onListeningState(false);
        callbacks.onStageUpdate?.(
          'speech_recognition',
          'failed',
          `Native voice error: ${err.code}`,
          err.message,
          true
        );
        callbacks.onError({
          code: err.code || 'unknown',
          message: err.message || 'Voice input unavailable. Please type your directive.',
          isPermissionDenied: Boolean(err.isPermissionDenied),
        });
        this.stopListening();
      });
      this.nativeListeners.push(errorHandle);

      const startRes = await VajraNativeSpeech.startListening({ language });
      if (!startRes.success) {
        throw new Error(startRes.message || 'Native start failed');
      }

      this.isCurrentlyListening = true;
      this.wakeActivationMode = 'LISTENING';
      callbacks.onListeningState(true);
      return true;
    } catch (err: any) {
      callbacks.onStageUpdate?.(
        'speech_recognition',
        'failed',
        'Could not initialize native Android speech recognizer',
        err?.message || String(err),
        true
      );
      callbacks.onError({
        code: 'start_failed',
        message: 'Voice input is unavailable on this device.',
      });
      this.stopListening();
      return false;
    }
  }

  /**
   * Browser / PWA Provider: uses W3C SpeechRecognition
   */
  private startWebSpeechListening(
    sessionId: number,
    callbacks: VoiceSessionCallbacks,
    language: string
  ): boolean {
    const SpeechRecognition =
      typeof window !== 'undefined'
        ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        : null;

    if (!SpeechRecognition) {
      const msg = 'Speech recognition is not supported in this browser. Please use keyboard input.';
      callbacks.onStageUpdate?.('speech_recognition', 'unsupported', msg, undefined, true);
      callbacks.onError({
        code: 'unsupported',
        message: msg,
      });
      return false;
    }

    try {
      callbacks.onStageUpdate?.('speech_recognition', 'checking', 'Starting speech sensor...');

      const recognition = new SpeechRecognition();
      recognition.lang = language || 'en-US';
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        if (sessionId !== this.activeSessionId) return;
        this.isCurrentlyListening = true;
        this.wakeActivationMode = 'LISTENING';
        this.callbacks?.onListeningState(true);
        this.callbacks?.onStageUpdate?.(
          'speech_recognition',
          'active',
          'Listening for speech input...'
        );
        this.callbacks?.onStageUpdate?.('transcription', 'active', 'Analyzing speech stream...');
      };

      recognition.onaudiostart = () => {
        if (sessionId !== this.activeSessionId) return;
        this.callbacks?.onStageUpdate?.('microphone', 'success', 'Acoustic audio stream capturing.');
      };

      recognition.onspeechstart = () => {
        if (sessionId !== this.activeSessionId) return;
        this.callbacks?.onStageUpdate?.('transcription', 'active', 'Speech detected...');
      };

      recognition.onresult = (event: any) => {
        if (sessionId !== this.activeSessionId) return;

        let interimAccumulator = '';
        let finalAccumulator = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const chunk = event.results[i][0]?.transcript || '';
          if (event.results[i].isFinal) {
            finalAccumulator += chunk;
          } else {
            interimAccumulator += chunk;
          }
        }

        const interimText = interimAccumulator.trim();
        const finalText = finalAccumulator.trim();

        if (interimText && !finalText) {
          this.callbacks?.onPartialTranscript(interimText);
        }

        if (finalText) {
          this.dispatchFinalTranscript(sessionId, finalText);
        }
      };

      recognition.onerror = (e: any) => {
        if (sessionId !== this.activeSessionId) return;
        const errCode = e?.error || 'unknown';
        const { message } = mapSpeechError(errCode);

        this.callbacks?.onStageUpdate?.(
          'speech_recognition',
          'failed',
          `Voice sensor error: ${errCode}`,
          message,
          true
        );

        let userFriendlyMsg: string;
        if (errCode === 'not-allowed' || errCode === 'service-not-allowed') {
          userFriendlyMsg = 'Microphone permission is required for voice input.';
        } else if (errCode === 'network') {
          userFriendlyMsg = 'Speech network service unavailable. Check connection.';
        } else if (errCode === 'no-speech') {
          userFriendlyMsg = 'No speech detected.';
        } else {
          userFriendlyMsg = 'Voice input unavailable. Please type your directive.';
        }

        this.callbacks?.onError({
          code: errCode,
          message: userFriendlyMsg,
          isPermissionDenied: errCode === 'not-allowed' || errCode === 'service-not-allowed',
        });

        this.stopListening();
      };

      recognition.onend = () => {
        if (sessionId !== this.activeSessionId) return;
        this.stopListening();
      };

      this.currentRecognition = recognition;
      recognition.start();
      return true;
    } catch (err: any) {
      callbacks.onStageUpdate?.(
        'speech_recognition',
        'failed',
        'Failed to start voice recognizer',
        err?.message || String(err),
        true
      );
      callbacks.onError({
        code: 'start_failed',
        message: 'Could not initialize voice sensors. Please type your directive.',
      });
      this.stopListening();
      return false;
    }
  }

  /**
   * Guaranteed single dispatch for final transcripts with deduplication
   */
  private dispatchFinalTranscript(sessionId: number, transcript: string) {
    if (sessionId !== this.activeSessionId) return;
    const cleanText = transcript.trim();
    if (!cleanText) return;

    const now = Date.now();
    // Guard against duplicated rapid-fire events for identical transcript (< 1500ms)
    if (cleanText === this.lastFinalTranscript && now - this.lastProcessedTimestamp < 1500) {
      return;
    }

    this.lastFinalTranscript = cleanText;
    this.lastProcessedTimestamp = now;

    this.callbacks?.onStageUpdate?.(
      'transcription',
      'success',
      `Captured directive: "${cleanText}"`
    );
    this.callbacks?.onFinalTranscript(cleanText);

    // Stop listening session upon capturing full final directive
    this.stopListening();
  }

  private clearNativeListeners() {
    for (const h of this.nativeListeners) {
      try {
        h.remove();
      } catch {}
    }
    this.nativeListeners = [];
  }

  /**
   * Stop and cleanup the active session immediately
   */
  public stopListening(): void {
    this.activeSessionId++;
    this.isCurrentlyListening = false;

    // Return to standby if voice activation enabled
    if (this.wakeActivationMode !== 'WAKE_DISABLED') {
      this.wakeActivationMode = 'WAKE_STANDBY';
    }

    // 1. Native Android cleanup
    if (this.isNativeAndroid()) {
      try {
        VajraNativeSpeech.stopListening().catch(() => {});
      } catch {}
      this.clearNativeListeners();
    }

    // 2. Web Speech cleanup
    if (this.currentRecognition) {
      try {
        this.currentRecognition.onstart = null;
        this.currentRecognition.onaudiostart = null;
        this.currentRecognition.onspeechstart = null;
        this.currentRecognition.onresult = null;
        this.currentRecognition.onerror = null;
        this.currentRecognition.onend = null;
        this.currentRecognition.abort();
      } catch {}
      this.currentRecognition = null;
    }

    if (this.currentAudioAnimId) {
      cancelAnimationFrame(this.currentAudioAnimId);
      this.currentAudioAnimId = null;
    }

    if (this.currentAudioSource) {
      try {
        this.currentAudioSource.disconnect();
      } catch {}
      this.currentAudioSource = null;
    }

    if (this.currentAudioContext) {
      try {
        this.currentAudioContext.close().catch(() => {});
      } catch {}
      this.currentAudioContext = null;
    }

    if (this.currentStream) {
      try {
        this.currentStream.getTracks().forEach((t) => t.stop());
      } catch {}
      this.currentStream = null;
    }

    if (this.callbacks) {
      this.callbacks.onListeningState(false);
      this.callbacks = null;
    }
  }

  public getStatus(): VoiceControllerStatus {
    return {
      isListening: this.isCurrentlyListening,
      platform: this.getPlatformType(),
      permissionState: this.permissionState,
      isNativeAndroid: this.isNativeAndroid(),
      wakeMode: this.wakeActivationMode,
    };
  }
}

export const voiceController = new VoiceController();
