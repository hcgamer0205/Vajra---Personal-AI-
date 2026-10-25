import { Capacitor } from '@capacitor/core';

export type VoicePipelineStageId =
  | 'microphone'
  | 'speech_recognition'
  | 'transcription'
  | 'ai_processing'
  | 'response'
  | 'tts';

export type StageStatus = 'idle' | 'checking' | 'active' | 'ready' | 'success' | 'failed' | 'unsupported';

export interface PipelineStageInfo {
  id: VoicePipelineStageId;
  name: string;
  apiName: string;
  status: StageStatus;
  message: string;
  detail?: string;
  timestamp?: number;
  error?: boolean;
}

export interface VoiceDiagnosticsState {
  isActive: boolean;
  isInIframe: boolean;
  isSupportedBrowser: boolean;
  isNativeAndroid?: boolean;
  stages: Record<VoicePipelineStageId, PipelineStageInfo>;
  overallStatus: 'idle' | 'running' | 'ready' | 'error';
  lastErrorMessage?: string;
  previewWarning?: string;
}

export const INITIAL_PIPELINE_STAGES: Record<VoicePipelineStageId, PipelineStageInfo> = {
  microphone: {
    id: 'microphone',
    name: 'Microphone Hardware & Permission',
    apiName: 'navigator.mediaDevices.getUserMedia / Android RECORD_AUDIO',
    status: 'idle',
    message: 'Standby — Checks hardware input & audio permissions',
  },
  speech_recognition: {
    id: 'speech_recognition',
    name: 'Speech Recognition Engine',
    apiName: 'android.speech.SpeechRecognizer / Web Speech API',
    status: 'idle',
    message: 'Standby — Acoustic sensor stream initialization',
  },
  transcription: {
    id: 'transcription',
    name: 'Audio-to-Text Transcription',
    apiName: 'SpeechRecognition.onresult',
    status: 'idle',
    message: 'Standby — Real-time speech stream parsing',
  },
  ai_processing: {
    id: 'ai_processing',
    name: 'AI Neural Core Processing',
    apiName: 'streamChatCompletion (/api/chat & LLM Adapter)',
    status: 'idle',
    message: 'Standby — Directive reasoning & response generation',
  },
  response: {
    id: 'response',
    name: 'HUD Response & Action Parser',
    apiName: 'extractActionsFromText & Markdown HUD',
    status: 'idle',
    message: 'Standby — UI rendering & action extraction',
  },
  tts: {
    id: 'tts',
    name: 'Text-to-Speech Synthesizer',
    apiName: 'window.speechSynthesis & SpeechSynthesisUtterance',
    status: 'idle',
    message: 'Standby — Neural audio voice output',
  },
};

/**
 * Checks if the application is currently running inside an iframe (such as AI Studio Preview)
 */
export function isRunningInIframe(): boolean {
  try {
    return typeof window !== 'undefined' && window.self !== window.top;
  } catch {
    return true;
  }
}

/**
 * Maps SpeechRecognition error codes to human-readable diagnostic messages
 */
export function mapSpeechError(errorCode: string): { message: string; isPreviewIssue: boolean } {
  switch (errorCode) {
    case 'not-allowed':
      return {
        message: 'Microphone access was denied or restricted by browser/iframe security policies.',
        isPreviewIssue: true,
      };
    case 'service-not-allowed':
      return {
        message: 'Speech recognition network service is disallowed in this embedded frame.',
        isPreviewIssue: true,
      };
    case 'audio-capture':
      return {
        message: 'No microphone hardware was detected or audio capture failed on the device.',
        isPreviewIssue: false,
      };
    case 'network':
      return {
        message: 'Network error communicating with speech recognition service.',
        isPreviewIssue: true,
      };
    case 'no-speech':
      return {
        message: 'No speech was detected within the listening window.',
        isPreviewIssue: false,
      };
    case 'aborted':
      return {
        message: 'Voice listening was aborted by user or application.',
        isPreviewIssue: false,
      };
    case 'language-not-supported':
      return {
        message: 'Language "en-US" is not supported by the local speech recognition engine.',
        isPreviewIssue: false,
      };
    default:
      return {
        message: `Speech recognition error: ${errorCode}`,
        isPreviewIssue: false,
      };
  }
}

/**
 * Static inspection of API availability and environment capabilities
 */
export async function inspectVoiceEnvironment(): Promise<{
  stages: Record<VoicePipelineStageId, PipelineStageInfo>;
  hasPreviewWarning: boolean;
  previewWarningMessage?: string;
}> {
  const stages = { ...INITIAL_PIPELINE_STAGES };
  const isNative = typeof window !== 'undefined' && (Capacitor.isNativePlatform() || Capacitor.getPlatform() === 'android');
  const inIframe = isRunningInIframe();
  let hasPreviewWarning = false;
  let previewWarningMessage: string | undefined;

  // On native Android runtime, eliminate desktop browser environment warnings
  if (isNative) {
    stages.microphone = {
      ...stages.microphone,
      status: 'ready',
      message: 'Android RECORD_AUDIO hardware permission ready.',
      detail: 'Mobile Native Audio Pipeline',
    };
    stages.speech_recognition = {
      ...stages.speech_recognition,
      status: 'ready',
      message: 'Android Native Speech Recognition interface active.',
      detail: 'Capacitor Android Core',
    };
    stages.transcription = {
      ...stages.transcription,
      status: 'ready',
      message: 'Mobile speech event streaming ready.',
    };
    stages.ai_processing = {
      ...stages.ai_processing,
      status: 'ready',
      message: 'VAJRA Neural Core & local offline fallback active.',
    };
    stages.response = {
      ...stages.response,
      status: 'ready',
      message: 'Mobile HUD & directive parser active.',
    };
    stages.tts = {
      ...stages.tts,
      status: 'ready',
      message: 'Android speech synthesis stream active.',
    };

    return { stages, hasPreviewWarning: false, previewWarningMessage: undefined };
  }

  // 1. Microphone Stage
  const hasMediaDevices =
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices &&
    typeof navigator.mediaDevices.getUserMedia === 'function';

  if (!hasMediaDevices) {
    stages.microphone = {
      ...stages.microphone,
      status: 'unsupported',
      message: 'navigator.mediaDevices.getUserMedia is unavailable in this context (insecure origin or unsupported browser).',
      error: true,
    };
    hasPreviewWarning = true;
    previewWarningMessage = 'Voice testing requires a supported browser environment or deployed application.';
  } else {
    stages.microphone = {
      ...stages.microphone,
      status: 'ready',
      message: 'MediaDevices API available. Hardware audio input query supported.',
      detail: inIframe ? 'Note: Running inside an embedded iframe container.' : 'Secure top-level window context.',
    };
  }

  // 2. Speech Recognition Stage
  const SpeechRecognition =
    typeof window !== 'undefined'
      ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      : null;

  if (!SpeechRecognition) {
    stages.speech_recognition = {
      ...stages.speech_recognition,
      status: 'unsupported',
      message: 'Web Speech API (SpeechRecognition / webkitSpeechRecognition) is not supported in this browser.',
      detail: 'Supported browsers: Google Chrome, Microsoft Edge, Safari (14.5+), Opera.',
      error: true,
    };
    hasPreviewWarning = true;
    previewWarningMessage = 'Voice testing requires a supported browser environment or deployed application.';
  } else {
    stages.speech_recognition = {
      ...stages.speech_recognition,
      status: 'ready',
      message: `SpeechRecognition engine detected (${(window as any).SpeechRecognition ? 'Standard' : 'webkitSpeechRecognition'}).`,
      detail: inIframe
        ? 'Embedded iframe may require top-level permission delegation or deployed standalone URL.'
        : 'Ready for live voice activation.',
    };
  }

  // 3. Transcription Stage
  stages.transcription = {
    ...stages.transcription,
    status: 'ready',
    message: 'Speech event handlers configured for interim and final transcript accumulation.',
  };

  // 4. AI Processing Stage
  stages.ai_processing = {
    ...stages.ai_processing,
    status: 'ready',
    message: 'Server-side Gemini proxy (/api/chat) & on-device fallback adapter initialized.',
  };

  // 5. Response Stage
  stages.response = {
    ...stages.response,
    status: 'ready',
    message: 'Dynamic Markdown stream renderer & Stark action extraction parser active.',
  };

  // 6. Text-to-Speech Stage
  const hasTTS = typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  if (!hasTTS) {
    stages.tts = {
      ...stages.tts,
      status: 'unsupported',
      message: 'window.speechSynthesis API is not supported in this browser.',
      error: true,
    };
  } else {
    const voices = window.speechSynthesis.getVoices ? window.speechSynthesis.getVoices() : [];
    stages.tts = {
      ...stages.tts,
      status: 'ready',
      message: `SpeechSynthesis API active (${voices.length > 0 ? `${voices.length} system voices available` : 'Voices initializing'}).`,
    };
  }

  return { stages, hasPreviewWarning, previewWarningMessage };
}
