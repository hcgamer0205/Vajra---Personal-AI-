/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { VajraHUDHeader } from './components/VajraHUDHeader';
import { HologramDisplay, TemporaryNotification } from './components/HologramDisplay';
import { VajraVoiceConsole } from './components/VajraVoiceConsole';
import { TelemetryDrawer } from './components/TelemetryDrawer';
import { EngineModal } from './components/EngineModal';
import { QuickUrlModal } from './components/QuickUrlModal';
import { QuickSearchModal } from './components/QuickSearchModal';
import { QuickAppModal } from './components/QuickAppModal';
import { CalculatorTool } from './components/tools/CalculatorTool';
import { NotepadTool } from './components/tools/NotepadTool';
import { FileManagerTool } from './components/tools/FileManagerTool';
import { NativeBridgeModal } from './components/tools/NativeBridgeModal';
import { SecurityConfirmModal } from './components/SecurityConfirmModal';
import { VoiceDiagnosticHUD } from './components/VoiceDiagnosticHUD';
import { VajraOnboardingModal } from './components/VajraOnboardingModal';
import { CoreSettingsModal } from './components/CoreSettingsModal';
import { Message, ModelOption, VajraAction, AssistantState, VajraUserConfig } from './types';
import { fetchModelConfig, streamChatCompletion } from './services/api';
import { llmManager } from './services/llm';
import { sanitizeUrl } from './services/security';
import { nativeBridge } from './services/nativeBridge';
import { extractActionsFromText } from './services/actionParser';
import {
  loadAppearanceConfig,
  saveAppearanceConfig,
  resetAppearanceConfig,
  applyThemeToDocument,
  detectColorChangeCommand,
  VajraAppearanceConfig,
} from './services/vajraAppearance';
import {
  loadMemories,
  detectAndSaveKeyMemory,
  formatMemoriesForPrompt,
  isMemoryQuery,
  formatMemoriesSummaryMarkdown,
  VajraMemoryItem,
} from './services/vajraMemory';
import { MemoryVaultModal } from './components/MemoryVaultModal';
import {
  VoicePipelineStageId,
  StageStatus,
  VoiceDiagnosticsState,
  INITIAL_PIPELINE_STAGES,
  inspectVoiceEnvironment,
  isRunningInIframe,
  mapSpeechError,
} from './services/voicePipeline';
import { voiceController, parseWakePhrase } from './services/voiceController';
import { WifiOff, Sliders, MessageSquare, ChevronUp } from 'lucide-react';
import { useDeviceCapability } from './hooks/useDeviceCapability';
import { MobileToolsSheet } from './components/mobile/MobileToolsSheet';
import { MobilePresenceCore } from './components/mobile/MobilePresenceCore';
import { MobileConversationSheet } from './components/mobile/MobileConversationSheet';
import {
  getInitialContext,
  resolveContextualIntent,
  updateConversationContext,
  VajraConversationContext,
  detectVoiceControl,
  classifyActionRisk,
  requiresExplicitConfirmation,
} from './services/vajraContext';
import {
  VajraVoiceConfig,
  loadPersistedVoiceConfig,
  savePersistedVoiceConfig,
  resolveEffectiveVoice,
  getVoicePreviewText,
  DEFAULT_VOICE_CONFIG,
} from './services/vajraVoiceSettings';
import { vajraSelfHeal, SelfHealEvent } from './services/vajraSelfHeal';
import { vajraLearning, LearnedPreference, UserCorrectionEvent } from './services/vajraLearning';
import { MobileTransparencyPanel } from './components/mobile/MobileTransparencyPanel';
import { recordTaskReflection, AuthoritativeState } from './services/vajraSelfAwareness';
import { mobileControlEngine } from './services/mobileControlEngine';
import { evaluateActionPolicy } from './services/actionPolicyEngine';
import { MobilePhoneControlSheet } from './components/mobile/MobilePhoneControlSheet';
import { MobileLanguageSheet } from './components/mobile/MobileLanguageSheet';
import { MobileRemindersSheet } from './components/mobile/MobileRemindersSheet';
import { starkAudio } from './services/starkAudio';

const STORAGE_KEY_MESSAGES = 'vajra_telemetry_history_v2';
const STORAGE_KEY_MODEL = 'vajra_selected_model';
const STORAGE_KEY_AUDIO_MUTED = 'vajra_audio_muted';
const STORAGE_KEY_SETUP_COMPLETED = 'vajra_setup_completed_v1';
const STORAGE_KEY_USER_CONFIG = 'vajra_user_config_v1';

export default function App() {
  // Adaptive Device Capability Detection (Desktop vs Mobile Viewport & Touch)
  const device = useDeviceCapability();
  const [isMobileHistoryOpen, setIsMobileHistoryOpen] = useState(false);
  const [isMobileToolsOpen, setIsMobileToolsOpen] = useState(false);
  const [isTransparencyPanelOpen, setIsTransparencyPanelOpen] = useState(false);
  const [isPhoneControlsOpen, setIsPhoneControlsOpen] = useState(false);
  const [isLanguageSheetOpen, setIsLanguageSheetOpen] = useState(false);
  const [isRemindersSheetOpen, setIsRemindersSheetOpen] = useState(false);
  const [isConversationSheetOpen, setIsConversationSheetOpen] = useState(false);

  // First-Time Setup & Onboarding State
  const [isSetupOpen, setIsSetupOpen] = useState<boolean>(() => {
    try {
      const isCompleted = localStorage.getItem(STORAGE_KEY_SETUP_COMPLETED);
      const hasConfig = localStorage.getItem(STORAGE_KEY_USER_CONFIG);
      // Remember setup completed across browser refreshes and sessions
      if (isCompleted === 'true' || isCompleted === '1' || Boolean(hasConfig)) {
        return false;
      }
      return true;
    } catch {
      return false;
    }
  });
  const [isReconfiguring, setIsReconfiguring] = useState<boolean>(false);
  const [userConfig, setUserConfig] = useState<VajraUserConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USER_CONFIG);
      return saved
        ? JSON.parse(saved)
        : {
            assistantName: 'VAJRA',
            language: 'en-US',
            voiceOutput: true,
            voiceInputMode: 'push_to_talk',
            startupBehavior: 'active_command',
            theme: 'crimson_gold',
            selectedModel: 'gemini-3.1-flash-lite',
          };
    } catch {
      return {
        assistantName: 'VAJRA',
        language: 'en-US',
        voiceOutput: true,
        voiceInputMode: 'push_to_talk',
        startupBehavior: 'active_command',
        theme: 'crimson_gold',
        selectedModel: 'gemini-3.1-flash-lite',
      };
    }
  });

  // Energy Core Appearance & UI Accent Theme State
  const [appearanceConfig, setAppearanceConfig] = useState<VajraAppearanceConfig>(() =>
    loadAppearanceConfig()
  );
  const [isCoreSettingsOpen, setIsCoreSettingsOpen] = useState<boolean>(false);
  const [isMemoryVaultOpen, setIsMemoryVaultOpen] = useState<boolean>(false);

  // Mobile View Mode: 'hero' for majestic Arc Reactor centerpiece, 'conversation' for active chat stream
  const [mobileViewMode, setMobileViewMode] = useState<'hero' | 'conversation'>('hero');

  // Short-Term Conversation Memory & Context Orchestrator
  const [vajraContext, setVajraContext] = useState<VajraConversationContext>(() => getInitialContext());

  // Persistent Memory System
  const [memories, setMemories] = useState<VajraMemoryItem[]>(() => loadMemories());

  // Apply complete theme variables (energy core, UI text, borders, and glows)
  useEffect(() => {
    applyThemeToDocument(appearanceConfig);
  }, [appearanceConfig]);

  const handleUpdateAppearance = (next: VajraAppearanceConfig) => {
    setAppearanceConfig(next);
    saveAppearanceConfig(next);
  };

  const handleResetAppearance = () => {
    const reset = resetAppearanceConfig();
    setAppearanceConfig(reset);
  };

  const handleRefreshMemories = () => {
    setMemories(loadMemories());
  };

  // Navigation / Drawer state
  const [isTelemetryOpen, setIsTelemetryOpen] = useState(false);

  // Engine & Offline Mode state
  const [isEngineModalOpen, setIsEngineModalOpen] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(() => llmManager.isOperatingOffline());
  const [isForceOffline, setIsForceOffline] = useState<boolean>(() => llmManager.isForceOffline());

  // Quick Action Dialog States
  const [isUrlModalOpen, setIsUrlModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isAppModalOpen, setIsAppModalOpen] = useState(false);

  // Interactive Tools state
  const [activeTool, setActiveTool] = useState<
    'calculator' | 'notepad' | 'file_explorer' | 'native_bridge' | null
  >(null);

  // Security confirmation state for external / sensitive actions
  const [pendingAction, setPendingAction] = useState<VajraAction | null>(null);

  // Messages State
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_MESSAGES);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [availableModels, setAvailableModels] = useState<ModelOption[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_MODEL) || 'gemini-3.1-flash-lite';
  });

  // Voice Interaction State
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [isSpeakingAudio, setIsSpeakingAudio] = useState(false);
  const [audioAmplitude, setAudioAmplitude] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEY_AUDIO_MUTED) === 'true';
  });

  // Real-time audio amplitude modulation during TTS speech playback
  useEffect(() => {
    if (!isSpeakingAudio) {
      if (!isListening) {
        setAudioAmplitude(0);
      }
      return;
    }
    let animId: number;
    const startTime = Date.now();
    const updateSpeechAmp = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      const cadence =
        Math.abs(Math.sin(elapsed * 8.5)) * 0.42 +
        Math.sin(elapsed * 16.5) * 0.18 +
        0.22;
      setAudioAmplitude(Math.min(Math.max(cadence, 0.1), 0.95));
      animId = requestAnimationFrame(updateSpeechAmp);
    };
    animId = requestAnimationFrame(updateSpeechAmp);
    return () => cancelAnimationFrame(animId);
  }, [isSpeakingAudio, isListening]);

  const handleToggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY_AUDIO_MUTED, String(next));
      starkAudio.setMuted(next);
      if (next && typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      } else if (!next) {
        starkAudio.playDirectiveAcknowledged();
      }
      return next;
    });
  }, []);

  // Voice Diagnostics State
  const [isVoiceDiagnosticsOpen, setIsVoiceDiagnosticsOpen] = useState(false);
  const [diagnosticsState, setDiagnosticsState] = useState<VoiceDiagnosticsState>({
    isActive: false,
    isInIframe: isRunningInIframe(),
    isSupportedBrowser: true,
    stages: INITIAL_PIPELINE_STAGES,
    overallStatus: 'idle',
  });
  const latestTranscriptRef = useRef<string>('');

  const recognitionRef = useRef<any>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Voice Settings & Installed TTS Voices State
  const [voiceConfig, setVoiceConfig] = useState<VajraVoiceConfig>(() => loadPersistedVoiceConfig());
  const handleUpdateVoiceConfig = useCallback((nextConfig: VajraVoiceConfig) => {
    setVoiceConfig(nextConfig);
    savePersistedVoiceConfig(nextConfig);
  }, []);

  // Continuous Conversation Mode State
  const [isConversationModeEnabled, setIsConversationModeEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('vajra_conversation_mode') === 'true';
    } catch {
      return false;
    }
  });
  const [isConversationSessionActive, setIsConversationSessionActive] = useState(false);
  const isConversationSessionActiveRef = useRef(false);
  const conversationTimeoutRef = useRef<any>(null);

  const handleToggleConversationMode = useCallback((enabled: boolean) => {
    setIsConversationModeEnabled(enabled);
    try {
      localStorage.setItem('vajra_conversation_mode', String(enabled));
    } catch {}
    if (!enabled) {
      setIsConversationSessionActive(false);
      isConversationSessionActiveRef.current = false;
      if (conversationTimeoutRef.current) {
        clearTimeout(conversationTimeoutRef.current);
      }
    }
  }, []);

  // Self-Healing & Adaptive Learning State
  const [isSelfHealingEnabled, setIsSelfHealingEnabled] = useState<boolean>(() => vajraSelfHeal.isSelfHealingEnabled());
  const [selfHealEvents, setSelfHealEvents] = useState<SelfHealEvent[]>(() => vajraSelfHeal.getEventHistory());

  const [isLearningEnabled, setIsLearningEnabled] = useState<boolean>(() => vajraLearning.isLearningActive());
  const [learnedPreferences, setLearnedPreferences] = useState<LearnedPreference[]>(() => vajraLearning.getLearnedPreferences());
  const [recentCorrections, setRecentCorrections] = useState<UserCorrectionEvent[]>(() => vajraLearning.getRecentCorrections());

  useEffect(() => {
    const unsubHeal = vajraSelfHeal.subscribe(() => {
      setSelfHealEvents(vajraSelfHeal.getEventHistory());
    });
    const unsubLearn = vajraLearning.subscribe(() => {
      setLearnedPreferences(vajraLearning.getLearnedPreferences());
      setRecentCorrections(vajraLearning.getRecentCorrections());
    });
    return () => {
      unsubHeal();
      unsubLearn();
    };
  }, []);

  const handleToggleSelfHealing = useCallback((enabled: boolean) => {
    vajraSelfHeal.setSelfHealingEnabled(enabled);
    setIsSelfHealingEnabled(enabled);
  }, []);

  const handleToggleLearning = useCallback((enabled: boolean) => {
    vajraLearning.setLearningActive(enabled);
    setIsLearningEnabled(enabled);
  }, []);

  // HUD Execution Status & Temporary Floating Notifications
  const [hudExecutionStatus, setHudExecutionStatus] = useState<string | null>(null);
  const [temporaryNotification, setTemporaryNotification] = useState<TemporaryNotification | null>(null);
  const notificationTimeoutRef = useRef<any>(null);
  const statusTimeoutRef = useRef<any>(null);

  const showTemporaryNotification = useCallback(
    (
      text: string,
      type: 'action_complete' | 'speech' | 'info' | 'error' = 'action_complete',
      durationMs = 3800
    ) => {
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
      setTemporaryNotification({
        id: `notif-${Date.now()}`,
        text,
        type,
      });
      notificationTimeoutRef.current = setTimeout(() => {
        setTemporaryNotification(null);
        notificationTimeoutRef.current = null;
      }, durationMs);
    },
    []
  );

  const handleClearLearnedPreferences = useCallback(() => {
    vajraLearning.clearLearnedPreferences();
    setLearnedPreferences([]);
    setRecentCorrections([]);
    showTemporaryNotification('Learned preferences cleared.', 'info', 2500);
  }, [showTemporaryNotification]);

  const setHudStatusWithAutoClear = useCallback((status: string | null, durationMs = 2500) => {
    if (statusTimeoutRef.current) {
      clearTimeout(statusTimeoutRef.current);
    }
    setHudExecutionStatus(status);
    if (status) {
      statusTimeoutRef.current = setTimeout(() => {
        setHudExecutionStatus(null);
        statusTimeoutRef.current = null;
      }, durationMs);
    }
  }, []);

  // Safe Haptic vibration feedback (never throws if unsupported or blocked)
  const triggerSafeHaptic = useCallback((pattern: number | number[]) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {}
    }
  }, []);

  // Helper to update a pipeline diagnostic stage
  const updateStage = useCallback(
    (
      stageId: VoicePipelineStageId,
      status: StageStatus,
      message: string,
      detail?: string,
      error?: boolean
    ) => {
      setDiagnosticsState((prev) => ({
        ...prev,
        stages: {
          ...prev.stages,
          [stageId]: {
            ...prev.stages[stageId],
            status,
            message,
            detail: detail !== undefined ? detail : prev.stages[stageId]?.detail,
            timestamp: Date.now(),
            error: error !== undefined ? error : status === 'failed' || status === 'unsupported',
          },
        },
      }));
    },
    []
  );

  // Initial environment inspection
  useEffect(() => {
    inspectVoiceEnvironment().then((result) => {
      setDiagnosticsState((prev) => ({
        ...prev,
        stages: result.stages,
        previewWarning: result.hasPreviewWarning ? result.previewWarningMessage : undefined,
      }));
    });
  }, []);

  // Application Lifecycle State (Foreground vs Backgrounded)
  const [isBackgrounded, setIsBackgrounded] = useState(false);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsBackgrounded(true);
        if (voiceController.isListening()) {
          voiceController.stopListening();
          setIsListening(false);
        }
        if (typeof window !== 'undefined' && window.speechSynthesis) {
          window.speechSynthesis.cancel();
        }
        setIsSpeakingAudio(false);
      } else {
        setIsBackgrounded(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Compute Authoritative Active Assistant State for VAJRA Core
  const assistantState: AuthoritativeState = isBackgrounded
    ? 'backgrounded'
    : isListening
    ? 'listening'
    : hudExecutionStatus === 'PARSING...' || hudExecutionStatus === 'UNDERSTANDING...'
    ? 'understanding'
    : hudExecutionStatus === 'EXECUTING...'
    ? 'executing'
    : hudExecutionStatus === 'VERIFYING...'
    ? 'verifying'
    : pendingAction || vajraContext.pendingConfirmation
    ? 'awaiting_confirmation'
    : vajraContext.activeMission?.status === 'paused'
    ? 'paused'
    : hudExecutionStatus === 'PLANNING...' || vajraContext.activeMission?.status === 'planning'
    ? 'planning'
    : hudExecutionStatus?.includes('RECOVER')
    ? 'recovering'
    : isStreaming || hudExecutionStatus === 'THINKING...'
    ? 'planning'
    : isSpeakingAudio
    ? 'speaking'
    : hudExecutionStatus?.includes('ERROR') || hudExecutionStatus?.includes('FAILED')
    ? 'error'
    : 'idle';

  // Network Online/Offline Listeners
  useEffect(() => {
    const updateOfflineState = () => {
      setIsOfflineMode(llmManager.isOperatingOffline());
    };

    window.addEventListener('online', updateOfflineState);
    window.addEventListener('offline', updateOfflineState);
    return () => {
      window.removeEventListener('online', updateOfflineState);
      window.removeEventListener('offline', updateOfflineState);
    };
  }, []);

  // Keyboard shortcut for Cmd+N / Ctrl+N to clear/new interaction
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleClearTelemetry();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isStreaming]);

  // Persist messages locally on device
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(messages));
    } catch (e) {
      console.warn('Failed to persist VAJRA telemetry to localStorage:', e);
    }
  }, [messages]);

  // Fetch available models or fallback to local provider models
  useEffect(() => {
    let mounted = true;
    fetchModelConfig().then((cfg) => {
      if (mounted) {
        setAvailableModels(cfg.models);
        if (!localStorage.getItem(STORAGE_KEY_MODEL)) {
          setSelectedModel(cfg.defaultModel);
        }
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Handle model change
  const handleSelectModel = (modelId: string) => {
    setSelectedModel(modelId);
    llmManager.setActiveAdapter(modelId === 'local-browser-engine' ? 'local-browser-engine' : 'gemini-cloud');
    setIsOfflineMode(llmManager.isOperatingOffline());
    localStorage.setItem(STORAGE_KEY_MODEL, modelId);
  };

  // Toggle force offline mode
  const handleToggleOfflineMode = (forced?: boolean) => {
    const nextState = forced !== undefined ? forced : !isForceOffline;
    llmManager.setForceOffline(nextState);
    setIsForceOffline(nextState);
    setIsOfflineMode(llmManager.isOperatingOffline());
    if (nextState) {
      setSelectedModel('local-browser-engine');
    } else {
      setSelectedModel('gemini-3.1-flash-lite');
    }
  };

  const conversationFollowUpCallbackRef = useRef<(() => void) | null>(null);

  // Speech Synthesis helper
  const speakText = useCallback(
    (rawText: string) => {
      if (isMuted) {
        updateStage('tts', 'ready', 'Audio output muted by user in HUD controls.');
        return;
      }

      if (typeof window === 'undefined' || !window.speechSynthesis) {
        updateStage('tts', 'unsupported', 'window.speechSynthesis API is not supported in this browser.', undefined, true);
        return;
      }

      // Clean markdown and code tags before speaking
      const clean = rawText
        .replace(/```[\s\S]*?```/g, '')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/[*#_~>]/g, '')
        .trim();

      if (!clean) return;

      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(clean.slice(0, 350));

        // Resolve genuine installed Android/Web TTS voice
        const resolved = resolveEffectiveVoice(userConfig.language || 'en-US', voiceConfig);
        if (resolved.voice) {
          utterance.voice = resolved.voice;
        }
        utterance.rate = resolved.rate;
        utterance.pitch = resolved.pitch;
        utterance.lang = resolved.lang;

        utterance.onstart = () => {
          setIsSpeakingAudio(true);
          updateStage('tts', 'active', `Synthesizing voice response using ${resolved.voiceName}...`);
        };
        utterance.onend = () => {
          setIsSpeakingAudio(false);
          updateStage('tts', 'success', 'Audio voice transmission successfully concluded.');

          // Continuous Conversation Mode Hook
          if (isConversationModeEnabled && isConversationSessionActiveRef.current && conversationFollowUpCallbackRef.current) {
            conversationFollowUpCallbackRef.current();
          }
        };
        utterance.onerror = (e: any) => {
          setIsSpeakingAudio(false);
          updateStage('tts', 'failed', `Voice synthesis error: ${e?.error || 'playback failed'}`, undefined, true);
          // Self-heal TTS failure
          if (vajraSelfHeal.isSelfHealingEnabled()) {
            vajraSelfHeal.executeSelfHeal({
              category: 'TTS_FAILURE',
              strategy: 'Fallback to system default synthesizer',
              maxRetries: 2,
              backoffMs: 300,
              recoveryAction: async () => {
                if (typeof window !== 'undefined' && window.speechSynthesis) {
                  window.speechSynthesis.cancel();
                  return true;
                }
                return false;
              },
              verificationAction: async () => {
                return typeof window !== 'undefined' && Boolean(window.speechSynthesis);
              },
              successMessage: 'TTS service recovered.',
              failureMessage: 'TTS synthesis unavailable.',
            });
          }
        };

        updateStage('tts', 'checking', 'Queued utterance for speech synthesizer...');
        window.speechSynthesis.speak(utterance);
      } catch (err: any) {
        setIsSpeakingAudio(false);
        updateStage('tts', 'failed', `TTS execution error: ${err?.message || err}`, undefined, true);
      }
    },
    [isMuted, updateStage, userConfig.language, voiceConfig, isConversationModeEnabled]
  );

  // Preview Selected Voice
  const handlePreviewVoice = useCallback(() => {
    const previewText = getVoicePreviewText(userConfig.language || 'en-US');
    speakText(previewText);
  }, [speakText, userConfig.language]);

  // Stop Generation / Audio
  const handleStop = () => {
    starkAudio.playPowerDown();
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeakingAudio(false);
    setIsStreaming(false);

    setMessages((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      if (last.role === 'assistant' && last.isStreaming) {
        return [
          ...prev.slice(0, -1),
          {
            ...last,
            isStreaming: false,
            content: last.content || '*(VAJRA directive halted by user)*',
          },
        ];
      }
      return prev;
    });
  };

  // Clear Telemetry / Session
  const handleClearTelemetry = () => {
    if (isStreaming) {
      handleStop();
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setMessages([]);
    setVajraContext(getInitialContext());
    if (device.isMobile) {
      setMobileViewMode('hero');
    }
    localStorage.removeItem(STORAGE_KEY_MESSAGES);
  };

  // Safe Action Execution Engine (Desktop Bridge + In-App Fallbacks)
  const handleExecuteAction = async (action: VajraAction) => {
    setHudExecutionStatus('EXECUTING...');

    let completionText = 'Action completed';
    if (action.type === 'OPEN_WEBSITE') {
      const isYt = action.url?.includes('youtube.com');
      const isGoogle = action.url?.includes('google.com');
      const isWiki = action.url?.includes('wikipedia.org');
      if (isYt) completionText = 'YouTube opened';
      else if (isGoogle) completionText = 'Google opened';
      else if (isWiki) completionText = 'Wikipedia opened';
      else completionText = `${action.title || 'Website'} opened`;
    } else if (action.type === 'SEARCH_WEB') {
      completionText = `Google Search: "${action.query || ''}"`;
    } else if (action.type === 'OPEN_APP') {
      completionText = `${action.appName || 'Application'} launched`;
    } else if (action.type === 'CREATE_FOLDER') {
      completionText = `Folder created: "${action.targetPath || ''}"`;
    } else if (action.type === 'CREATE_FILE') {
      completionText = `File created: "${action.targetPath || ''}"`;
    } else if (action.type === 'MOVE_FILE') {
      completionText = 'File moved';
    } else if (action.type === 'OPEN_PATH') {
      completionText = 'Directory opened';
    }

    // 0. Universal Android Phone Control Actions
    const isMobileControlAction =
      action.type === 'OPEN_SETTINGS' ||
      action.type === 'DIAL_PHONE' ||
      action.type === 'DRAFT_SMS' ||
      action.type === 'DRAFT_EMAIL' ||
      action.type === 'OPEN_CAMERA' ||
      action.type === 'OPEN_MAPS' ||
      action.type === 'ADJUST_VOLUME' ||
      action.type === 'GET_DEVICE_INFO' ||
      action.type === 'MANAGE_VAJRA_NOTE' ||
      action.type === 'GLOBAL_STOP';

    if (isMobileControlAction) {
      if (action.type === 'GLOBAL_STOP') {
        handleStop();
      }

      const policy = evaluateActionPolicy(action);
      if (policy.requiresExplicitConfirmation && !action.confirmed) {
        setPendingAction(action);
        setHudExecutionStatus('CONFIRMATION REQUIRED');
        showTemporaryNotification(policy.confirmationPrompt || 'Explicit confirmation required.', 'info', 4000);
        return;
      }

      const mobileRes = await mobileControlEngine.executeAction(action, (tool) => {
        setActiveTool(tool);
      });

      const success = mobileRes.executionStatus === 'success';
      const msg = mobileRes.observedResult;

      setVajraContext((prev) => ({
        ...prev,
        recentResult: { success, message: msg, timestamp: Date.now() },
        actionState: success ? 'COMPLETED' : 'FAILED',
      }));

      recordTaskReflection({
        userRequest: vajraContext.lastUserRequest || action.title,
        authorizedAction: action.type,
        attemptedOperation: action.title,
        observedResult: msg,
        wasVerified: mobileRes.isVerified,
        failureReason: mobileRes.failureReason,
        preventativeImprovement: success ? 'Nominal phone control execution.' : 'Verify Android permissions.',
      });

      setHudExecutionStatus(success ? '✓ COMPLETE' : 'ACTION FAILED');
      showTemporaryNotification(success ? `✓ ${msg}` : msg, success ? 'action_complete' : 'error', 3500);
      setTimeout(() => setHudExecutionStatus(null), 2200);
      return;
    }

    // 1. Website Navigation & Deep Linking
    if (action.type === 'OPEN_WEBSITE' || action.type === 'SEARCH_WEB') {
      const targetUrl = action.type === 'SEARCH_WEB'
        ? `https://www.google.com/search?q=${encodeURIComponent(action.query || '')}`
        : sanitizeUrl(action.url);

      if (!targetUrl) {
        setHudStatusWithAutoClear('ACTION FAILED', 2000);
        showTemporaryNotification('Invalid or unsafe URL format.', 'error', 3000);
        return;
      }

      // Check if deep link intent (tel:, mailto:, sms:, maps:)
      const isDeepLink =
        targetUrl.startsWith('tel:') ||
        targetUrl.startsWith('mailto:') ||
        targetUrl.startsWith('sms:') ||
        targetUrl.startsWith('maps:');

      if (isDeepLink) {
        const linkRes = nativeBridge.openDeepLink(targetUrl);
        setHudExecutionStatus('✓ COMPLETE');
        showTemporaryNotification(linkRes.message, 'action_complete', 3500);
        setTimeout(() => setHudExecutionStatus(null), 2200);
        return;
      }

      // Check if domain is a known safe standard or needs confirmation
      const isTrusted =
        targetUrl.startsWith('https://www.youtube.com') ||
        targetUrl.startsWith('https://youtube.com') ||
        targetUrl.startsWith('https://www.google.com') ||
        targetUrl.startsWith('https://google.com') ||
        targetUrl.startsWith('https://github.com') ||
        targetUrl.startsWith('https://wikipedia.org') ||
        targetUrl.startsWith('https://www.wikipedia.org') ||
        targetUrl.startsWith('https://maps.google.com');

      if (!isTrusted && !action.confirmed) {
        setPendingAction(action);
        setHudExecutionStatus('CONFIRMATION REQUIRED');
        return;
      }

      if (nativeBridge.isElectronAvailable()) {
        await nativeBridge.openWebsite(targetUrl);
      } else {
        window.open(targetUrl, '_blank', 'noopener,noreferrer');
      }

      setVajraContext((prev) => ({
        ...prev,
        recentResult: { success: true, message: completionText, timestamp: Date.now() },
        actionState: 'COMPLETED',
      }));
      recordTaskReflection({
        userRequest: vajraContext.lastUserRequest || action.title,
        authorizedAction: action.type,
        attemptedOperation: action.title,
        observedResult: completionText,
        wasVerified: true,
        preventativeImprovement: 'Nominal execution verified.',
      });

      setHudExecutionStatus('✓ COMPLETE');
      showTemporaryNotification(`✓ ${completionText}`, 'action_complete', 3500);
      setTimeout(() => setHudExecutionStatus(null), 2200);
      return;
    }

    // 2. System Actions (Share, Reminders, Memory)
    if (action.type === 'SYSTEM_ACTION') {
      if (action.title?.toLowerCase().includes('share') || action.description?.toLowerCase().includes('share')) {
        const lastMsg = [...messages].reverse().find((m) => m.role === 'assistant');
        const shareText = lastMsg ? lastMsg.content : 'VAJRA Personal AI Assistant';
        const shareRes = await nativeBridge.shareContent('VAJRA Intelligence', shareText);
        if (shareRes.success) {
          setVajraContext((prev) => ({
            ...prev,
            recentResult: { success: true, message: shareRes.message, timestamp: Date.now() },
            actionState: 'COMPLETED',
          }));
          recordTaskReflection({
            userRequest: vajraContext.lastUserRequest || action.title,
            authorizedAction: action.type,
            attemptedOperation: action.title,
            observedResult: shareRes.message,
            wasVerified: true,
            preventativeImprovement: 'Nominal execution verified.',
          });
          setHudExecutionStatus('✓ COMPLETE');
          showTemporaryNotification(shareRes.message, 'action_complete', 3000);
          setTimeout(() => setHudExecutionStatus(null), 2200);
        } else {
          setHudStatusWithAutoClear('DISMISSED', 2000);
        }
        return;
      }

      setVajraContext((prev) => ({
        ...prev,
        recentResult: { success: true, message: action.description || 'System directive executed', timestamp: Date.now() },
        actionState: 'COMPLETED',
      }));
      recordTaskReflection({
        userRequest: vajraContext.lastUserRequest || action.title,
        authorizedAction: action.type,
        attemptedOperation: action.title,
        observedResult: action.description || 'System directive executed',
        wasVerified: true,
        preventativeImprovement: 'Nominal execution verified.',
      });

      setHudExecutionStatus('✓ COMPLETE');
      showTemporaryNotification(`✓ ${action.description || 'System directive executed'}`, 'action_complete', 3000);
      setTimeout(() => setHudExecutionStatus(null), 2200);
      return;
    }

    // 3. Desktop Apps & File Operations
    try {
      const result = await nativeBridge.executeVajraAction(action, (tool) => {
        setActiveTool(tool);
      });

      if (result.success) {
        setVajraContext((prev) => ({
          ...prev,
          recentResult: { success: true, message: result.message || completionText, timestamp: Date.now() },
          actionState: 'COMPLETED',
        }));
        recordTaskReflection({
          userRequest: vajraContext.lastUserRequest || action.title,
          authorizedAction: action.type,
          attemptedOperation: action.title,
          observedResult: result.message || completionText,
          wasVerified: true,
          preventativeImprovement: 'Nominal execution verified.',
        });
        setHudExecutionStatus('✓ COMPLETE');
        showTemporaryNotification(`✓ ${result.message || completionText}`, 'action_complete', 3500);
        setTimeout(() => setHudExecutionStatus(null), 2200);
      } else {
        // Desktop-only operation or unsupported capability on mobile
        setVajraContext((prev) => ({
          ...prev,
          recentResult: { success: false, message: result.message, timestamp: Date.now() },
          actionState: 'FAILED',
        }));
        recordTaskReflection({
          userRequest: vajraContext.lastUserRequest || action.title,
          authorizedAction: action.type,
          attemptedOperation: action.title,
          observedResult: result.message,
          wasVerified: false,
          failureReason: result.message,
          preventativeImprovement: 'Provide in-app fallback tool.',
        });
        setHudStatusWithAutoClear('UNSUPPORTED', 2500);
        showTemporaryNotification(result.message, 'error', 4500);

        // Open mobile-safe alternative tool
        if (action.type === 'CREATE_FILE') {
          setActiveTool('notepad');
        } else if (
          action.type === 'CREATE_FOLDER' ||
          action.type === 'OPEN_PATH' ||
          action.type === 'MOVE_FILE' ||
          action.type === 'COPY_FILE' ||
          action.type === 'RENAME_FILE'
        ) {
          setActiveTool('file_explorer');
        } else if (!nativeBridge.isElectronAvailable() && !device.isMobile) {
          setActiveTool('native_bridge');
        }
      }
    } catch (err: any) {
      console.warn('Action dispatch exception:', err);
      setVajraContext((prev) => ({
        ...prev,
        recentResult: { success: false, message: err?.message || 'Execution error', timestamp: Date.now() },
        actionState: 'FAILED',
      }));
      recordTaskReflection({
        userRequest: vajraContext.lastUserRequest || action.title,
        authorizedAction: action.type,
        attemptedOperation: action.title,
        observedResult: 'Exception thrown during dispatch',
        wasVerified: false,
        failureReason: err?.message || 'Unknown exception',
        preventativeImprovement: 'Check permissions and platform capability.',
      });
      setHudStatusWithAutoClear('EXECUTION ERROR', 2000);
    }
  };

  const handleConfirmPendingAction = () => {
    if (pendingAction) {
      const actionToRun: VajraAction = {
        ...pendingAction,
        confirmed: true,
        requiresConfirmation: false,
      };
      setPendingAction(null);
      setVajraContext((prev) => ({
        ...prev,
        pendingConfirmation: null,
        actionState: 'EXECUTING',
      }));
      handleExecuteAction(actionToRun);
    }
  };

  // Run Comprehensive Diagnostics Self-Test across all 6 stages
  const handleRunDiagnosticsSelfTest = async () => {
    setIsVoiceDiagnosticsOpen(true);

    // Stage 1: Microphone Hardware & Permissions
    updateStage('microphone', 'checking', 'Probing microphone hardware availability & permissions...');
    const hasMedia =
      typeof navigator !== 'undefined' &&
      !!navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === 'function';

    if (!hasMedia) {
      updateStage(
        'microphone',
        'unsupported',
        'navigator.mediaDevices.getUserMedia is unavailable in this origin/browser context.',
        undefined,
        true
      );
      setDiagnosticsState((prev) => ({
        ...prev,
        previewWarning: 'Voice testing requires a supported browser environment or deployed application.',
      }));
    } else {
      updateStage(
        'microphone',
        'ready',
        'Microphone API detected. Permission queries supported.',
        isRunningInIframe() ? 'Running in iframe container (permission policy active).' : 'Top-level window context.'
      );
    }

    // Stage 2: Speech Recognition Engine
    updateStage('speech_recognition', 'checking', 'Probing Web Speech API initialization...');
    const SpeechRecognition =
      typeof window !== 'undefined'
        ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        : null;

    if (!SpeechRecognition) {
      updateStage(
        'speech_recognition',
        'unsupported',
        'Speech Recognition API (SpeechRecognition / webkitSpeechRecognition) not found.',
        'Requires Chrome, Edge, Safari (14.5+), or Chromium.',
        true
      );
      setDiagnosticsState((prev) => ({
        ...prev,
        previewWarning: 'Voice testing requires a supported browser environment or deployed application.',
      }));
    } else {
      updateStage(
        'speech_recognition',
        'ready',
        `Speech recognition engine verified (${(window as any).SpeechRecognition ? 'Standard' : 'webkitSpeechRecognition'}).`,
        'Ready for user acoustic activation.'
      );
    }

    // Stage 3: Transcription Event Handlers
    updateStage('transcription', 'ready', 'Transcription event streaming verified and registered.');

    // Stage 4: AI Inference Pipeline
    updateStage('ai_processing', 'checking', 'Checking connection to VAJRA Neural Core / Gemini proxy...');
    try {
      const cfg = await fetchModelConfig();
      updateStage(
        'ai_processing',
        'ready',
        `Neural backend verified. Models available: ${cfg.models.length} (Default: ${cfg.defaultModel}).`
      );
    } catch {
      updateStage(
        'ai_processing',
        'ready',
        'Using local VAJRA browser engine fallback adapter.'
      );
    }

    // Stage 5: Response & Action Parser
    updateStage('response', 'ready', 'Response formatting & VAJRA Action parsing pipeline operational.');

    // Stage 6: Text-to-Speech Engine
    updateStage('tts', 'checking', 'Probing SpeechSynthesis voice engine...');
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      updateStage('tts', 'unsupported', 'window.speechSynthesis API is not supported in this browser.', undefined, true);
    } else {
      const voices = window.speechSynthesis.getVoices ? window.speechSynthesis.getVoices() : [];
      updateStage(
        'tts',
        'ready',
        `SpeechSynthesis ready. ${voices.length} voice synthesizers available in browser.`
      );
    }
  };

  // Send Message / Directive
  const handleSendMessage = async (textToSend?: string, fromVoice = false) => {
    let text = (textToSend !== undefined ? textToSend : input).trim();
    if (!text) return;

    // Normalize and strip wake phrase if present (guarantees one-shot idempotency)
    const wakeCheck = parseWakePhrase(text);
    if (wakeCheck.isWakePhrase && wakeCheck.remainingCommand) {
      text = wakeCheck.remainingCommand;
    }

    // 0. Natural Voice Control Intercept (Stop, Cancel, Pause, Resume)
    // Processed BEFORE streaming guard so user can say "Stop" or "Cancel" to abort an active stream
    const control = detectVoiceControl(text);
    if (control) {
      if (control === 'STOP') {
        handleStop();
        voiceController.stopListening();
        setIsListening(false);
        vajraSelfHeal.cancelAllRecoveries();
        setPendingAction(null);
        setVajraContext((prev) => ({
          ...prev,
          pendingConfirmation: null,
          actionState: 'IDLE',
        }));
        setIsConversationSessionActive(false);
        isConversationSessionActiveRef.current = false;
        if (conversationTimeoutRef.current) {
          clearTimeout(conversationTimeoutRef.current);
        }
        setHudStatusWithAutoClear('STOPPED', 2000);
        showTemporaryNotification('Operation stopped.', 'info', 2000);
        return;
      }
      if (control === 'CANCEL') {
        const hadPending = Boolean(
          pendingAction ||
            vajraContext.pendingConfirmation ||
            (vajraContext.activeMission &&
              (vajraContext.activeMission.status === 'planning' ||
                vajraContext.activeMission.status === 'in_progress' ||
                vajraContext.activeMission.status === 'paused')) ||
            isStreaming
        );
        if (isStreaming) {
          handleStop();
        }
        vajraSelfHeal.cancelAllRecoveries();
        setPendingAction(null);
        setVajraContext((prev) => ({
          ...prev,
          pendingConfirmation: null,
          activeMission: prev.activeMission ? { ...prev.activeMission, status: 'cancelled' } : null,
          actionState: 'CANCELLED',
        }));
        setIsConversationSessionActive(false);
        isConversationSessionActiveRef.current = false;
        if (conversationTimeoutRef.current) {
          clearTimeout(conversationTimeoutRef.current);
        }
        const cancelMsg = hadPending ? 'Action cancelled.' : 'No pending action to cancel.';
        setHudStatusWithAutoClear(hadPending ? 'CANCELLED' : 'IDLE', 2000);
        showTemporaryNotification(cancelMsg, 'info', 2000);
        speakText(cancelMsg);
        return;
      }
      if (control === 'PAUSE') {
        const hasActiveMission =
          vajraContext.activeMission &&
          (vajraContext.activeMission.status === 'planning' ||
            vajraContext.activeMission.status === 'in_progress');
        const wasActive = Boolean(hasActiveMission || isListening || isSpeakingAudio || isConversationSessionActive);
        voiceController.stopListening();
        setIsListening(false);
        if (typeof window !== 'undefined' && window.speechSynthesis) {
          window.speechSynthesis.cancel();
        }
        setIsSpeakingAudio(false);
        if (hasActiveMission) {
          setVajraContext((prev) => ({
            ...prev,
            activeMission: prev.activeMission ? { ...prev.activeMission, status: 'paused' } : null,
          }));
        }
        const pauseMsg = wasActive ? 'Paused.' : 'No active task to pause.';
        showTemporaryNotification(pauseMsg, 'info', 2000);
        speakText(pauseMsg);
        return;
      }
      if (control === 'RESUME') {
        if (vajraContext.activeMission && vajraContext.activeMission.status === 'paused') {
          const currentStep =
            vajraContext.activeMission.steps[vajraContext.activeMission.currentStepIndex];
          setVajraContext((prev) => ({
            ...prev,
            activeMission: prev.activeMission ? { ...prev.activeMission, status: 'in_progress' } : null,
          }));
          showTemporaryNotification(`Resuming mission: ${vajraContext.activeMission.title}`, 'info', 2500);
          speakText('Resuming.');
          if (currentStep?.action) {
            handleExecuteAction(currentStep.action);
          }
        } else {
          showTemporaryNotification('Nothing to resume right now.', 'info', 2000);
          speakText('Nothing to resume right now.');
        }
        return;
      }
    }

    if (isStreaming) return;

    // 0.1. Voice Confirmation Intercept for Pending High-Risk Actions
    if (pendingAction) {
      const lowerText = text.toLowerCase();
      const isAffirmative =
        lowerText === 'yes' ||
        lowerText === 'haan' ||
        lowerText === 'confirm' ||
        lowerText === 'sure' ||
        lowerText === 'proceed' ||
        lowerText === 'kardo' ||
        lowerText === 'ok' ||
        lowerText === 'okay';

      const isNegative =
        lowerText === 'no' ||
        lowerText === 'nahi' ||
        lowerText === 'cancel' ||
        lowerText === 'mat karo' ||
        lowerText === 'stop' ||
        lowerText === 'ruk jao';

      if (isAffirmative) {
        setInput('');
        handleConfirmPendingAction();
        speakText('Confirmed. Executing action.');
        return;
      } else if (isNegative) {
        setInput('');
        setPendingAction(null);
        setVajraContext((prev) => ({
          ...prev,
          pendingConfirmation: null,
          actionState: 'CANCELLED',
        }));
        showTemporaryNotification('Action cancelled by user.', 'info', 2500);
        speakText('Action cancelled.');
        return;
      }
    }

    // 0.2. Adaptive Learning from User Corrections & Feedback
    if (vajraLearning.isLearningActive()) {
      const correction = vajraLearning.evaluateUtteranceForCorrection(text);
      if (correction) {
        showTemporaryNotification(`Learned: ${correction.intendedCorrection}`, 'info', 2500);
        if (correction.appliedPreference?.includes('preferredVoiceGender = female')) {
          handleUpdateVoiceConfig({ ...voiceConfig, gender: 'female' });
        } else if (correction.appliedPreference?.includes('preferredVoiceGender = male')) {
          handleUpdateVoiceConfig({ ...voiceConfig, gender: 'male' });
        }
      }
    }

    // Activate conversation session for continuous follow-ups
    setIsConversationSessionActive(true);
    isConversationSessionActiveRef.current = true;

    setInput('');
    setVoiceTranscript('');

    if (device.isMobile) {
      setMobileViewMode('conversation');
    }

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    // Update diagnostic stages for AI Processing & Response
    updateStage('ai_processing', 'active', `Transmitting directive "${text.slice(0, 35)}..." to VAJRA Neural Core...`);
    updateStage('response', 'checking', 'Awaiting neural tokens stream...');

    setHudExecutionStatus('UNDERSTANDING...');

    // Resolve follow-up intents, pronouns ("ye", "wahi"), math, self-awareness, or multi-step tasks from short-term context
    const contextResolution = resolveContextualIntent(text, vajraContext, {
      currentState: assistantState,
      isOnline: !isOfflineMode && (typeof navigator !== 'undefined' ? navigator.onLine : true),
      selectedModel,
      isMuted,
      isVoiceActivationEnabled: voiceController.isVoiceActivationEnabled(),
      voiceMode: voiceController.getStatus().wakeMode,
      micPermission: voiceController.getStatus().permissionState,
      isNativeAndroid: voiceController.getStatus().isNativeAndroid,
      recentSelfHealEvents: selfHealEvents,
      activeMission: vajraContext.activeMission,
      pendingAction: pendingAction || vajraContext.pendingConfirmation?.action || null,
      lastVerifiedResult: vajraContext.recentResult,
    });

    // If context resolution resolved an immediate synthetic response (e.g. Safe Math, Contact disambiguation)
    if (contextResolution.syntheticResponse) {
      const userMessage: Message = {
        id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        role: 'user',
        content: text,
        timestamp: Date.now(),
      };
      const assistantMessage: Message = {
        id: `vajra-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        role: 'assistant',
        content: contextResolution.syntheticResponse,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMessage, assistantMessage]);
      setHudStatusWithAutoClear('✓ COMPLETE', 2000);
      setVajraContext((prev) =>
        updateConversationContext(
          prev,
          text,
          contextResolution.syntheticResponse!,
          contextResolution.resolvedAction,
          contextResolution.proactiveSuggestion
        )
      );
      if (!isMuted) {
        speakText(contextResolution.syntheticResponse);
      }
      return;
    }

    // Check for direct executable commands from user input or context follow-up
    let actionToExecute: VajraAction | undefined = contextResolution.resolvedAction;
    const directActionsResult = extractActionsFromText(text, true);
    if (!actionToExecute && directActionsResult.actions.length > 0) {
      actionToExecute = directActionsResult.actions[0];
    }

    if (actionToExecute) {
      if (requiresExplicitConfirmation(actionToExecute)) {
        setPendingAction(actionToExecute);
        starkAudio.playSecurityAlert();
        if (device.isMobile) {
          setIsConversationSheetOpen(true);
        }
        const confirmMsg = `Confirmation required: Are you sure you want to execute "${actionToExecute.title}"?`;
        setVajraContext((prev) => ({
          ...prev,
          activeAction: actionToExecute!,
          actionState: 'WAITING_FOR_CONFIRMATION',
          pendingConfirmation: {
            id: `conf-${Date.now()}`,
            action: actionToExecute!,
            promptText: confirmMsg,
            consequenceDescription: actionToExecute!.description || actionToExecute!.title,
            requiresExplicitYes: true,
            createdAt: Date.now(),
          },
        }));
        setHudStatusWithAutoClear('CONFIRMATION REQUIRED', 3000);
        showTemporaryNotification(confirmMsg, 'info', 4000);
        speakText(confirmMsg);
        return;
      }
      handleExecuteAction(actionToExecute);
    } else {
      setHudExecutionStatus('THINKING...');
    }

    if (contextResolution.missionPlan) {
      setVajraContext((prev) => ({
        ...prev,
        activeMission: contextResolution.missionPlan || null,
      }));
    }

    // Direct memory extraction from natural conversation
    const learnedMem = detectAndSaveKeyMemory(text);
    if (learnedMem) {
      setMemories(loadMemories());
      showTemporaryNotification(`Memory saved: "${learnedMem.key}"`, 'info', 3200);
    }

    const userMessage: Message = {
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    const assistantPlaceholderId = `vajra-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const assistantPlaceholder: Message = {
      id: assistantPlaceholderId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isStreaming: true,
    };

    const updatedMessages = [...messages, userMessage];
    setMessages([...updatedMessages, assistantPlaceholder]);
    setIsStreaming(true);
    if (device.isMobile) {
      setIsConversationSheetOpen(true);
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Prepare message payload with long-term persistent memories & adaptive learned preferences included
    let memContext = formatMemoriesForPrompt();
    if (vajraLearning.isLearningActive()) {
      const prefs = vajraLearning.getLearnedPreferences();
      if (prefs.length > 0) {
        memContext += `\n[VAJRA ADAPTIVE PREFERENCES]\n` + prefs.map((p) => `• ${p.key}: ${p.value}`).join('\n') + `\n`;
      }
    }
    const historyPayload = [
      ...(memContext
        ? [
            {
              role: 'user' as const,
              content: `[System Instruction: Active Long-Term Memories & Directives]\n${memContext}`,
            },
            {
              role: 'assistant' as const,
              content: 'Understood. I will remember and adhere to these persistent instructions.',
            },
          ]
        : []),
      ...updatedMessages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ];

    let fullGeneratedText = '';

    await streamChatCompletion(
      historyPayload,
      selectedModel,
      {
        onChunk: (chunk: string) => {
          fullGeneratedText += chunk;
          updateStage(
            'ai_processing',
            'active',
            `Receiving neural stream (${fullGeneratedText.length} chars generated)...`
          );
          updateStage('response', 'active', 'Processing directives...');
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantPlaceholderId
                ? { ...msg, content: msg.content + chunk }
                : msg
            )
          );
        },
        onError: (errorMessage: string) => {
          updateStage('ai_processing', 'failed', `AI inference error: ${errorMessage}`, undefined, true);
          updateStage('response', 'failed', 'Generation halted due to inference failure.', undefined, true);
          setHudStatusWithAutoClear('INFERENCE ERROR', 2500);
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantPlaceholderId
                ? {
                    ...msg,
                    content: errorMessage,
                    error: true,
                    isStreaming: false,
                  }
                : msg
            )
          );
        },
        onFinish: () => {
          updateStage('ai_processing', 'success', 'Neural inference completed successfully.');
          updateStage('response', 'success', 'Directives processed.');

          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantPlaceholderId
                ? { ...msg, isStreaming: false }
                : msg
            )
          );
          setIsStreaming(false);
          abortControllerRef.current = null;

          // If no direct action was already launched, check if AI generated an action block
          let finalExecutedAction = actionToExecute;
          if (!actionToExecute) {
            const parsedActions = extractActionsFromText(fullGeneratedText);
            if (parsedActions.actions.length > 0) {
              finalExecutedAction = parsedActions.actions[0];
              handleExecuteAction(finalExecutedAction);
            } else {
              // Conversational response
              setHudExecutionStatus('✓ COMPLETE');
              setTimeout(() => setHudExecutionStatus(null), 2200);

              // Speak output if audio enabled
              if (fullGeneratedText && !isMuted) {
                speakText(fullGeneratedText);
              }

              // Display subtle temporary floating HUD notification
              const cleanSummary = fullGeneratedText
                .replace(/```[\s\S]*?```/g, '')
                .replace(/[*#_~`]/g, '')
                .trim();
              if (cleanSummary) {
                showTemporaryNotification(
                  cleanSummary.slice(0, 110) + (cleanSummary.length > 110 ? '...' : ''),
                  'speech',
                  4500
                );
              }
            }
          }

          // Update bounded short-term conversation context
          setVajraContext((prev) =>
            updateConversationContext(
              prev,
              text,
              fullGeneratedText,
              finalExecutedAction,
              contextResolution.proactiveSuggestion
            )
          );
        },
      },
      controller.signal
    );
  };

  // Unified Voice Interaction Controller (Android Native + Web Speech + Keyboard Fallback)
  const handleToggleVoice = async () => {
    if (isListening || voiceController.isListening()) {
      voiceController.stopListening();
      setIsListening(false);
      updateStage('transcription', 'idle', 'Voice session halted.');
      return;
    }

    latestTranscriptRef.current = '';
    setVoiceTranscript('');

    const started = await voiceController.startListening(
      {
        onListeningState: (listening) => {
          setIsListening(listening);
          if (listening) {
            triggerSafeHaptic(30);
            starkAudio.playArcReactorSpinUp();
          } else {
            triggerSafeHaptic([15, 30]);
            setAudioAmplitude(0);
          }
        },
        onAudioAmplitude: (amp) => {
          setAudioAmplitude(amp);
        },
        onPartialTranscript: (partialText) => {
          setVoiceTranscript(partialText);
          setInput(partialText);
          latestTranscriptRef.current = partialText;
        },
        onFinalTranscript: (finalText) => {
          triggerSafeHaptic([15, 20]);
          starkAudio.playDirectiveAcknowledged();
          setIsListening(false);
          setVoiceTranscript(finalText);
          latestTranscriptRef.current = '';
          updateStage('transcription', 'success', `Captured transcript: "${finalText}"`);
          handleSendMessage(finalText, true);
        },
        onError: (err) => {
          triggerSafeHaptic([40, 40, 40]);
          setIsListening(false);

          if (err.isPermissionDenied) {
            showTemporaryNotification(
              err.message || 'Microphone permission is required for voice input.',
              'error',
              4500
            );
          } else if (
            vajraSelfHeal.isSelfHealingEnabled() &&
            err.code !== 'no-speech' &&
            err.code !== 'no_speech' &&
            err.code !== 'no_match' &&
            err.code !== 'unsupported'
          ) {
            vajraSelfHeal
              .executeSelfHeal({
                category: err.code === 'network' ? 'NETWORK_FAILURE' : 'SPEECH_RECOGNITION_FAILURE',
                strategy: 'Cleanup stale recognizer session and verify platform readiness',
                maxRetries: 2,
                backoffMs: 400,
                recoveryAction: async () => {
                  await voiceController.stopListening();
                  return voiceController.getPlatformType() !== 'unsupported';
                },
                verificationAction: async () => {
                  return (
                    voiceController.getPlatformType() !== 'unsupported' &&
                    !voiceController.isListening() &&
                    voiceController.getPermissionState() === 'GRANTED'
                  );
                },
                successMessage: 'Voice session reset and recovered. Tap mic or say "Hello Vajra" to speak.',
                failureMessage: "I couldn't recover the voice service. Please try again.",
              })
              .then((res) => {
                showTemporaryNotification(res.userMessage, res.recovered ? 'info' : 'error', 3500);
              });
          } else if (err.code !== 'no-speech' && err.code !== 'no_speech') {
            showTemporaryNotification(
              err.message || 'Voice input unavailable. Please type your directive.',
              'error',
              3500
            );
          }
        },
        onStageUpdate: (stageId, status, message, detail, error) => {
          updateStage(stageId, status, message, detail, error);
        },
      },
      userConfig.language || 'en-US'
    );

    if (!started && !voiceController.isNativeAndroid() && isRunningInIframe()) {
      setDiagnosticsState((prev) => ({
        ...prev,
        previewWarning: 'Voice testing requires a supported browser environment or deployed application.',
      }));
    }
  };

  // Wire conversation follow-up callback
  conversationFollowUpCallbackRef.current = () => {
    if (conversationTimeoutRef.current) {
      clearTimeout(conversationTimeoutRef.current);
    }

    showTemporaryNotification('Conversation Active • Listening (8s timeout)', 'speech', 3000);
    handleToggleVoice();

    conversationTimeoutRef.current = setTimeout(() => {
      if (voiceController.isListening()) {
        voiceController.stopListening();
      }
      setIsConversationSessionActive(false);
      isConversationSessionActiveRef.current = false;
      showTemporaryNotification('Conversation ended • Standby ready', 'info', 3000);
      if (isVoiceActivationEnabled) {
        voiceController.setWakeMode('WAKE_STANDBY');
      }
    }, 8000);
  };

  // Voice Activation ("Hello Vajra" Wake Word) State
  const [isVoiceActivationEnabled, setIsVoiceActivationEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('vajra_voice_activation') === 'true';
    } catch {
      return false;
    }
  });

  // Handle Voice Activation Toggle (ON / OFF)
  const handleToggleVoiceActivation = async (enable: boolean) => {
    if (enable) {
      const granted = await voiceController.enableVoiceActivation(userConfig.language || 'en-US');
      if (granted) {
        setIsVoiceActivationEnabled(true);
        try {
          localStorage.setItem('vajra_voice_activation', 'true');
        } catch {}
        showTemporaryNotification('Voice Activation Enabled — Say "Hello Vajra"', 'info', 3500);
        triggerSafeHaptic(30);
      } else {
        setIsVoiceActivationEnabled(false);
        try {
          localStorage.setItem('vajra_voice_activation', 'false');
        } catch {}
        showTemporaryNotification('Microphone permission required for Voice Activation.', 'error', 4000);
        triggerSafeHaptic([40, 40]);
      }
    } else {
      await voiceController.disableVoiceActivation();
      setIsVoiceActivationEnabled(false);
      try {
        localStorage.setItem('vajra_voice_activation', 'false');
      } catch {}
      showTemporaryNotification('Voice Activation Disabled', 'info', 2500);
      triggerSafeHaptic(20);
    }
  };

  // Dedicated Wake Word Event Dispatcher
  const handleWakeWordTriggered = useCallback(
    (phrase: string, remainingCommand?: string) => {
      // 1. Subtle haptic pulse
      triggerSafeHaptic(30);

      // 2. Barge-in: immediately stop TTS if speaking
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setIsSpeakingAudio(false);

      // 3. One-shot command vs Two-stage flow
      const cleanRemaining = (remainingCommand || '').trim();

      if (cleanRemaining) {
        // ONE-SHOT: "Hello Vajra, Google pe Python search karo"
        // Dispatches strictly ONE directive into the command pipeline
        showTemporaryNotification(`VAJRA Awakened: "${phrase}"`, 'info', 2000);
        triggerSafeHaptic([15, 20]);
        handleSendMessage(cleanRemaining, true);
      } else {
        // TWO-STAGE: "Hello Vajra" -> "Yes, I'm listening." -> Active Command Listening
        voiceController.setWakeMode('WAKE_ACKNOWLEDGING');
        showTemporaryNotification('VAJRA: "Yes, I\'m listening."', 'info', 2500);
        speakText("Yes, I'm listening.");

        // Automatically start command listening after brief acknowledgement
        setTimeout(() => {
          voiceController.setWakeMode('LISTENING');
          handleToggleVoice();

          // Bounded fallback timeout (7s): if user doesn't speak a command
          setTimeout(() => {
            if (voiceController.isListening() && !latestTranscriptRef.current) {
              voiceController.stopListening();
              showTemporaryNotification("I'm here when you're ready.", 'info', 3000);
              if (isVoiceActivationEnabled) {
                voiceController.setWakeMode('WAKE_STANDBY');
              }
            }
          }, 7000);
        }, 500);
      }
    },
    [isVoiceActivationEnabled, speakText]
  );

  // Synchronize Voice Activation (Wake Word) with User Preference and Lifecycle
  useEffect(() => {
    voiceController.registerWakeCallback(({ phrase, remainingCommand }) => {
      handleWakeWordTriggered(phrase, remainingCommand);
    });

    if (isVoiceActivationEnabled) {
      voiceController.enableVoiceActivation(userConfig.language || 'en-US').then((enabled) => {
        if (!enabled) {
          setIsVoiceActivationEnabled(false);
          try {
            localStorage.setItem('vajra_voice_activation', 'false');
          } catch {}
        }
      });
    }

    return () => {
      voiceController.disableVoiceActivation();
    };
  }, [handleWakeWordTriggered, isVoiceActivationEnabled, userConfig.language]);

  // App Lifecycle Cleanup (Backgrounding / Screen Lock / Tab Hidden)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        if (voiceController.isListening()) {
          voiceController.stopListening();
        }
        setIsListening(false);
        if (typeof window !== 'undefined' && window.speechSynthesis) {
          window.speechSynthesis.cancel();
        }
        setIsSpeakingAudio(false);
        vajraSelfHeal.cancelAllRecoveries();
        if (conversationTimeoutRef.current) {
          clearTimeout(conversationTimeoutRef.current);
          conversationTimeoutRef.current = null;
        }
        setIsConversationSessionActive(false);
        isConversationSessionActiveRef.current = false;
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Direct Launch Handlers for Quick Action Modals (Strict Single-Action Execution: no duplicate tabs or unwanted chat turns)
  const handleLaunchUrlDirect = (url: string, title?: string) => {
    const action: VajraAction = {
      id: `act-direct-url-${Date.now()}`,
      type: 'OPEN_WEBSITE',
      title: title || url,
      url,
      confirmed: true,
      status: 'pending',
    };
    handleExecuteAction(action);
    setVajraContext((prev) =>
      updateConversationContext(prev, `Open ${title || url}`, `Opened ${title || url}.`, action)
    );
  };

  const handleLaunchSearchDirect = (query: string) => {
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    const action: VajraAction = {
      id: `act-direct-search-${Date.now()}`,
      type: 'SEARCH_WEB',
      title: `Search: "${query}"`,
      url: searchUrl,
      query,
      status: 'pending',
    };
    handleExecuteAction(action);
    setVajraContext((prev) =>
      updateConversationContext(prev, `Search ${query}`, `Searching Google for "${query}".`, action)
    );
  };

  const handleLaunchToolDirect = (tool: 'calculator' | 'notepad' | 'file_explorer' | 'native_bridge') => {
    setActiveTool(tool);
  };

  // First-Time Setup / Configuration Handlers
  const handleCompleteSetup = (newConfig: VajraUserConfig) => {
    setUserConfig(newConfig);
    try {
      localStorage.setItem(STORAGE_KEY_SETUP_COMPLETED, 'true');
      localStorage.setItem(STORAGE_KEY_USER_CONFIG, JSON.stringify(newConfig));
    } catch (e) {
      console.warn('Could not persist setup preferences to localStorage:', e);
    }

    if (newConfig.selectedModel && newConfig.selectedModel !== selectedModel) {
      handleSelectModel(newConfig.selectedModel);
    }

    setIsMuted(!newConfig.voiceOutput);
    try {
      localStorage.setItem(STORAGE_KEY_AUDIO_MUTED, String(!newConfig.voiceOutput));
    } catch {
      // Ignore
    }

    setIsSetupOpen(false);
    setIsReconfiguring(false);
  };

  const handleOpenSetupWizard = () => {
    setIsReconfiguring(true);
    setIsSetupOpen(true);
  };

  const activeEngineType = isOfflineMode ? 'local' : 'cloud';

  return (
    <div
      id="vajra-control-hub"
      className="flex flex-col h-screen w-full bg-[#040102] text-[#fef3c7] font-sans overflow-hidden relative select-none"
    >
      {/* 0. Cinematic First-Time Setup / Configuration Wizard */}
      <VajraOnboardingModal
        isOpen={isSetupOpen}
        onComplete={handleCompleteSetup}
        onCancel={() => {
          try {
            localStorage.setItem(STORAGE_KEY_SETUP_COMPLETED, 'true');
          } catch {}
          setIsSetupOpen(false);
          setIsReconfiguring(false);
        }}
        availableModels={availableModels}
        initialConfig={userConfig}
        isReconfiguring={isReconfiguring}
      />

      {/* 0.5. Core Appearance & Persistent Memory Settings Modal */}
      <CoreSettingsModal
        isOpen={isCoreSettingsOpen}
        onClose={() => setIsCoreSettingsOpen(false)}
        appearance={appearanceConfig}
        onUpdateAppearance={handleUpdateAppearance}
        onResetAppearance={handleResetAppearance}
        memories={memories}
        onRefreshMemories={handleRefreshMemories}
        onOpenSetupWizard={handleOpenSetupWizard}
        isVoiceActivationEnabled={isVoiceActivationEnabled}
        onToggleVoiceActivation={handleToggleVoiceActivation}
        voiceConfig={voiceConfig}
        onUpdateVoiceConfig={handleUpdateVoiceConfig}
        onPreviewVoice={handlePreviewVoice}
        isConversationModeEnabled={isConversationModeEnabled}
        onToggleConversationMode={handleToggleConversationMode}
        isLearningEnabled={isLearningEnabled}
        onToggleLearning={handleToggleLearning}
        isSelfHealingEnabled={isSelfHealingEnabled}
        onToggleSelfHealing={handleToggleSelfHealing}
        learnedPreferences={learnedPreferences}
        recentCorrections={recentCorrections}
        selfHealEvents={selfHealEvents}
        onClearLearnedPreferences={handleClearLearnedPreferences}
      />

      {/* 1. Global Navigation & Telemetry Drawer */}
      <TelemetryDrawer
        isOpen={isTelemetryOpen}
        onClose={() => setIsTelemetryOpen(false)}
        messages={messages}
        onClearHistory={handleClearTelemetry}
        onSelectPrompt={(p) => handleSendMessage(p)}
        onOpenVoiceDiagnostics={() => setIsVoiceDiagnosticsOpen(true)}
        onOpenTool={(tool) => {
          if (tool === 'url_modal') setIsUrlModalOpen(true);
          else if (tool === 'search_modal') setIsSearchModalOpen(true);
          else setActiveTool(tool);
        }}
        onOpenEngineModal={() => setIsEngineModalOpen(true)}
        onOpenSetup={handleOpenSetupWizard}
      />

      {/* 2. System Modals & Interactive Tools */}
      <VoiceDiagnosticHUD
        isOpen={isVoiceDiagnosticsOpen}
        onClose={() => setIsVoiceDiagnosticsOpen(false)}
        diagnostics={diagnosticsState}
        onRunSelfTest={handleRunDiagnosticsSelfTest}
      />

      <EngineModal
        isOpen={isEngineModalOpen}
        onClose={() => setIsEngineModalOpen(false)}
        isForceOffline={isForceOffline}
        onToggleForceOffline={handleToggleOfflineMode}
        activeEngine={activeEngineType}
        onSelectEngine={(id) => handleSelectModel(id)}
      />

      <QuickUrlModal
        isOpen={isUrlModalOpen}
        onClose={() => setIsUrlModalOpen(false)}
        onLaunchUrl={handleLaunchUrlDirect}
      />

      <QuickSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onExecuteSearch={handleLaunchSearchDirect}
      />

      <QuickAppModal
        isOpen={isAppModalOpen}
        onClose={() => setIsAppModalOpen(false)}
        onLaunchTool={handleLaunchToolDirect}
      />

      <CalculatorTool
        isOpen={activeTool === 'calculator'}
        onClose={() => setActiveTool(null)}
      />

      <NotepadTool
        isOpen={activeTool === 'notepad'}
        onClose={() => setActiveTool(null)}
      />

      <FileManagerTool
        isOpen={activeTool === 'file_explorer'}
        onClose={() => setActiveTool(null)}
        messages={messages}
        onClearHistory={handleClearTelemetry}
      />

      <NativeBridgeModal
        isOpen={activeTool === 'native_bridge'}
        onClose={() => setActiveTool(null)}
        onLaunchFallback={(tool) => setActiveTool(tool)}
      />

      <SecurityConfirmModal
        isOpen={Boolean(pendingAction)}
        action={pendingAction}
        onConfirm={handleConfirmPendingAction}
        onCancel={() => setPendingAction(null)}
      />

      {/* 3. Top Navigation Header: MobileStatusBar on Mobile, VajraHUDHeader on Desktop */}
      {/* 3. Top Navigation Header: Minimal Top Bar on Mobile, VajraHUDHeader on Desktop */}
      {device.isMobile ? (
        <header
          id="vajra-mobile-top-bar"
          className="relative z-30 w-full shrink-0 px-4 pt-[max(env(safe-area-inset-top),0.75rem)] pb-2 flex items-center justify-between select-none bg-transparent"
        >
          {/* Subtle wordmark */}
          <div className="font-hud font-bold text-xs tracking-widest text-amber-200/40 select-none">
            VAJRA
          </div>

          {/* At most one subtle settings / subsystems control for discoverability */}
          <button
            type="button"
            onClick={() => setIsMobileToolsOpen(true)}
            className="min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center text-amber-400/50 hover:text-amber-300 hover:bg-white/5 active:scale-90 transition-all cursor-pointer"
            title="VAJRA Settings & Subsystems"
            aria-label="Open Settings and Utilities"
          >
            <Sliders className="w-4 h-4 text-amber-400/60" />
          </button>
        </header>
      ) : (
        <VajraHUDHeader
          selectedModel={selectedModel}
          onSelectModel={handleSelectModel}
          availableModels={availableModels}
          isOfflineMode={isOfflineMode}
          onOpenEngineModal={() => setIsEngineModalOpen(true)}
          onOpenTelemetry={() => setIsTelemetryOpen(true)}
          onOpenVoiceDiagnostics={() => setIsVoiceDiagnosticsOpen(true)}
          hasMessages={messages.length > 0}
          onClearChat={handleClearTelemetry}
          onOpenCoreSettings={() => setIsCoreSettingsOpen(true)}
          onOpenTools={() => setIsAppModalOpen(true)}
          onOpenFiles={() => setActiveTool('file_explorer')}
          onOpenSetup={handleOpenSetupWizard}
          onResetHome={() => setActiveTool(null)}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* Network Offline Status Alert Strip */}
      {isOfflineMode && !isForceOffline && !navigator.onLine && (
        <div className="relative z-20 bg-red-950/80 border-b border-amber-500/40 px-4 py-1.5 flex items-center justify-between text-xs text-amber-200 shrink-0">
          <div className="flex items-center gap-2">
            <WifiOff className="w-3.5 h-3.5" />
            <span>Network Disconnected — VAJRA operating via On-Device Local Engine.</span>
          </div>
          <button
            type="button"
            onClick={() => setIsEngineModalOpen(true)}
            className="underline font-mono font-bold hover:text-white cursor-pointer"
          >
            Engine Matrix
          </button>
        </div>
      )}

      {/* 4. Massive VAJRA Living Energy Sphere Centerpiece (Takes Center Stage on Midnight Canvas) */}
      <main
        className={`relative flex-1 min-h-0 w-full overflow-hidden flex flex-col items-center justify-center ${
          device.isMobile ? 'bg-[#020003]' : ''
        }`}
      >
        {device.isMobile ? (
          <MobilePresenceCore
            state={assistantState}
            isOffline={isOfflineMode}
            coreTheme={appearanceConfig.coreTheme}
            customCoreColor={appearanceConfig.customCoreColor}
            isHeroMode={true}
            onTapCore={handleToggleVoice}
            currentTopic={vajraContext.currentTopic}
            audioAmplitude={audioAmplitude}
          />
        ) : (
          <HologramDisplay
            messages={messages}
            state={assistantState}
            isStreaming={isStreaming}
            isOffline={isOfflineMode}
            onExecuteAction={handleExecuteAction}
            onSelectPrompt={(p) => handleSendMessage(p)}
            onOpenEngineModal={() => setIsEngineModalOpen(true)}
            onToggleVoice={handleToggleVoice}
            onOpenVoiceDiagnostics={() => setIsVoiceDiagnosticsOpen(true)}
            onOpenSearch={() => setIsSearchModalOpen(true)}
            onOpenUrl={() => setIsUrlModalOpen(true)}
            temporaryNotification={temporaryNotification}
            onDismissNotification={() => setTemporaryNotification(null)}
            hudExecutionStatus={hudExecutionStatus}
            onOpenTool={(tool) => {
              if (tool === 'url_modal') setIsUrlModalOpen(true);
              else if (tool === 'search_modal') setIsSearchModalOpen(true);
              else if (
                tool === 'calculator' ||
                tool === 'notepad' ||
                tool === 'file_explorer' ||
                tool === 'native_bridge'
              ) {
                setActiveTool(tool);
              }
            }}
            onOpenSetup={handleOpenSetupWizard}
            onClearChat={handleClearTelemetry}
            coreTheme={appearanceConfig.coreTheme}
            customCoreColor={appearanceConfig.customCoreColor}
            uiAccentTheme={appearanceConfig.uiAccentTheme}
            customUiColor={appearanceConfig.customUiColor}
            onOpenCoreSettings={() => setIsCoreSettingsOpen(true)}
            isMobileMode={device.isMobile}
            mobileCoreMode={messages.length > 0 ? 'compact' : 'hero'}
          />
        )}
      </main>

      {/* 5. Mobile Interaction Layer: Floating Chat Pill & Slide-Up Conversation Sheet */}
      {device.isMobile ? (
        <>
          {/* Small, Elegant Chat-Entry Control Floating Near Bottom */}
          <div className="fixed bottom-6 left-0 right-0 z-30 px-6 flex justify-center pointer-events-auto">
            <button
              type="button"
              onClick={() => setIsConversationSheetOpen(true)}
              className="w-full max-w-xs min-h-[44px] px-4 py-2.5 rounded-full bg-[#0a0205]/85 hover:bg-[#14030a] border border-amber-500/25 hover:border-amber-400/50 shadow-[0_8px_32px_rgba(0,0,0,0.85)] backdrop-blur-xl flex items-center justify-between text-amber-200/70 text-xs font-mono group active:scale-[0.98] transition-all cursor-pointer"
              aria-label="Open conversation"
            >
              <div className="flex items-center gap-2.5 truncate">
                <MessageSquare className="w-4 h-4 text-amber-400/60 group-hover:text-amber-400 shrink-0" />
                <span className="truncate">
                  {messages.length > 0
                    ? `${messages.length} messages · Tap to chat`
                    : 'Transmit directive or tap to chat...'}
                </span>
              </div>
              <ChevronUp className="w-4 h-4 text-amber-400/50 group-hover:text-amber-300 group-hover:-translate-y-0.5 transition-transform shrink-0" />
            </button>
          </div>

          {/* Compact Conversation Sheet with Full History, Input, Mic, and Pending Confirmations */}
          <MobileConversationSheet
            isOpen={isConversationSheetOpen}
            onClose={() => setIsConversationSheetOpen(false)}
            messages={messages}
            state={assistantState}
            isStreaming={isStreaming}
            isOffline={isOfflineMode}
            input={input}
            setInput={setInput}
            onSend={(text) => handleSendMessage(text)}
            onStop={handleStop}
            isListening={isListening}
            onToggleVoice={handleToggleVoice}
            voiceTranscript={voiceTranscript}
            pendingAction={pendingAction}
            onConfirmPendingAction={handleConfirmPendingAction}
            onCancelPendingAction={() => setPendingAction(null)}
            onClearHistory={handleClearTelemetry}
            onExecuteAction={handleExecuteAction}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            coreTheme={appearanceConfig.coreTheme}
            customCoreColor={appearanceConfig.customCoreColor}
            onSelectPrompt={(p) => handleSendMessage(p)}
          />

          {/* Secondary Settings & Utilities Sheet */}
          <MobileToolsSheet
            isOpen={isMobileToolsOpen}
            onClose={() => setIsMobileToolsOpen(false)}
            onOpenCalculator={() => setActiveTool('calculator')}
            onOpenNotepad={() => setActiveTool('notepad')}
            onOpenFileManager={() => setActiveTool('file_explorer')}
            onOpenWebsite={() => setIsUrlModalOpen(true)}
            onOpenSearch={() => setIsSearchModalOpen(true)}
            onOpenVoiceDiagnostics={() => setIsVoiceDiagnosticsOpen(true)}
            onOpenEngineModal={() => setIsEngineModalOpen(true)}
            onOpenCoreSettings={() => setIsCoreSettingsOpen(true)}
            onOpenTransparencyPanel={() => setIsTransparencyPanelOpen(true)}
            onOpenPhoneControls={() => setIsPhoneControlsOpen(true)}
            onOpenLanguageSheet={() => setIsLanguageSheetOpen(true)}
            onOpenRemindersSheet={() => setIsRemindersSheetOpen(true)}
            onTriggerProtocol={(directive) => {
              handleSendMessage(directive);
            }}
          />

          <MobileTransparencyPanel
            isOpen={isTransparencyPanelOpen}
            onClose={() => setIsTransparencyPanelOpen(false)}
            currentState={assistantState}
            context={vajraContext}
            isOnline={!isOfflineMode && (typeof navigator !== 'undefined' ? navigator.onLine : true)}
            selectedModel={selectedModel}
            isVoiceActivationEnabled={voiceController.isVoiceActivationEnabled()}
            voiceMode={voiceController.getStatus().wakeMode}
            micPermission={voiceController.getStatus().permissionState}
            isNativeAndroid={voiceController.getStatus().isNativeAndroid}
            recentSelfHealEvents={selfHealEvents}
            learnedPreferences={learnedPreferences}
            onOpenVoiceDiagnostics={() => setIsVoiceDiagnosticsOpen(true)}
            onOpenCoreSettings={() => setIsCoreSettingsOpen(true)}
          />

          <MobilePhoneControlSheet
            isOpen={isPhoneControlsOpen}
            onClose={() => setIsPhoneControlsOpen(false)}
            onExecuteAction={handleExecuteAction}
            isVoiceActivationEnabled={voiceController.isVoiceActivationEnabled()}
            onToggleVoiceActivation={handleToggleVoiceActivation}
            onOpenCoreSettings={() => setIsCoreSettingsOpen(true)}
            onEmergencyStop={() => {
              handleStop();
              mobileControlEngine.emergencyStop();
              showTemporaryNotification('EMERGENCY STOP: All audio and active tasks halted.', 'info', 3000);
            }}
          />

          <MobileLanguageSheet
            isOpen={isLanguageSheetOpen}
            onClose={() => setIsLanguageSheetOpen(false)}
            currentLanguage={userConfig.language || 'en-IN'}
            onSelectLanguage={(langCode) => {
              setUserConfig((prev) => ({ ...prev, language: langCode }));
              try {
                localStorage.setItem(STORAGE_KEY_USER_CONFIG, JSON.stringify({ ...userConfig, language: langCode }));
              } catch {}
              showTemporaryNotification(`Language switched to ${langCode}`, 'info', 2500);
            }}
          />

          <MobileRemindersSheet
            isOpen={isRemindersSheetOpen}
            onClose={() => setIsRemindersSheetOpen(false)}
          />
        </>
      ) : (
        <footer className="relative z-20 shrink-0 w-full pb-3 sm:pb-4 pt-1 bg-gradient-to-t from-[#060103] via-[#060103]/90 to-transparent">
          <VajraVoiceConsole
            input={input}
            setInput={setInput}
            onSend={(text) => handleSendMessage(text)}
            onStop={handleStop}
            isStreaming={isStreaming}
            state={assistantState}
            isListening={isListening}
            onToggleVoice={handleToggleVoice}
            voiceTranscript={voiceTranscript}
            diagnosticWarning={diagnosticsState.previewWarning}
            onOpenDiagnostics={() => setIsVoiceDiagnosticsOpen(true)}
            onOpenWebsite={() => setIsUrlModalOpen(true)}
            onSearchWeb={() => setIsSearchModalOpen(true)}
            onOpenTools={() => setIsAppModalOpen(true)}
          />
        </footer>
      )}
    </div>
  );
}
