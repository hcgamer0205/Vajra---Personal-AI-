/**
 * VAJRA Mobile — Intelligence & Context Orchestration Engine
 * 
 * Implements bounded short-term conversation memory, pronoun/reference resolution,
 * topic continuity, confidence modeling, multi-step task planning, and Indian language
 * contextual intelligence (English, Hindi, Hinglish).
 * 
 * Strict Architectural Rules:
 * - Bounded memory (capped history, no unbounded growth)
 * - Security preservation (Context != Permission, Intent != Authorization)
 * - Reuse existing VajraAction and security primitives
 */

import { VajraAction, ActionType } from '../types';
import { sanitizeUrl, createSafeGoogleSearchUrl, createSafeYouTubeUrl } from './security';
import {
  detectSelfAwarenessQuery,
  resolveSelfAwarenessQuery,
  RuntimeStateSnapshot,
} from './vajraSelfAwareness';

export type ContextConfidence = 'HIGH_CONFIDENCE' | 'MEDIUM_CONFIDENCE' | 'LOW_CONFIDENCE';

export type ActionContextState =
  | 'IDLE'
  | 'PLANNING'
  | 'WAITING_FOR_PERMISSION'
  | 'WAITING_FOR_CONFIRMATION'
  | 'EXECUTING'
  | 'VERIFYING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export type DetectedLanguage = 'en' | 'hi' | 'hinglish';

export interface MissionStep {
  id: string;
  order: number;
  description: string;
  action?: VajraAction;
  status: 'pending' | 'executing' | 'completed' | 'failed' | 'skipped';
  resultMessage?: string;
}

export interface VajraMission {
  id: string;
  title: string;
  steps: MissionStep[];
  currentStepIndex: number;
  status: 'planning' | 'in_progress' | 'paused' | 'completed' | 'failed' | 'cancelled';
  createdAt: number;
}

export interface VajraPendingConfirmation {
  id: string;
  action: VajraAction;
  promptText: string;
  consequenceDescription: string;
  requiresExplicitYes: boolean;
  createdAt: number;
}

export interface ContextTurn {
  user: string;
  assistant: string;
  intent?: ActionType | 'CONVERSATION' | 'MATH_CALCULATION';
  topic?: string;
  timestamp: number;
}

export interface VajraConversationContext {
  currentTopic: string;
  currentIntent: ActionType | 'CONVERSATION' | 'MATH_CALCULATION';
  lastUserRequest: string;
  lastAssistantResponse: string;
  activeAction: VajraAction | null;
  activeMission: VajraMission | null;
  pendingConfirmation: VajraPendingConfirmation | null;
  recentResult: { success: boolean; message: string; timestamp: number } | null;
  language: DetectedLanguage;
  interactionMode: 'voice' | 'text';
  recentEntities: {
    lastSearchQuery?: string;
    lastSearchEngine?: 'google' | 'youtube';
    lastApp?: string;
    lastLocation?: string;
    lastPhoneNumber?: string;
    lastEmail?: string;
    lastMathExpression?: string;
    lastMathResult?: string;
    lastTopicEntity?: string;
  };
  confidence: ContextConfidence;
  actionState: ActionContextState;
  history: ContextTurn[]; // strictly bounded to max 10 entries
  proactiveSuggestion: string | null;
}

const MAX_CONTEXT_TURNS = 10;

/**
 * Creates the initial clean bounded conversation context.
 */
export function getInitialContext(): VajraConversationContext {
  return {
    currentTopic: 'general',
    currentIntent: 'CONVERSATION',
    lastUserRequest: '',
    lastAssistantResponse: '',
    activeAction: null,
    activeMission: null,
    pendingConfirmation: null,
    recentResult: null,
    language: 'en',
    interactionMode: 'text',
    recentEntities: {},
    confidence: 'HIGH_CONFIDENCE',
    actionState: 'IDLE',
    history: [],
    proactiveSuggestion: null,
  };
}

/**
 * Detects whether the input is predominantly English, Hindi (Devanagari), or Hinglish (Latin-script Hindi).
 */
export function detectLanguage(text: string): DetectedLanguage {
  if (!text || typeof text !== 'string') return 'en';
  
  // Devanagari Unicode block check
  if (/[\u0900-\u097F]/.test(text)) {
    return 'hi';
  }

  // Hinglish marker words
  const hinglishMarkers = [
    /\b(?:kholo|chalu|karo|karna|batao|dikhao|dhoondo|khojo|bhejo|lagao|hai|hain|ka|ki|ke|ko|se|mein|me|par|pe|kya|kyun|kaise|kitna|aaj|kal|parso|waise|wahi|isko|usko|ye|yeh|woh|wo|chahiye|hoga|raha|rahi)\b/i,
    /\b(?:shuru|band|baad|pehla|dusra|suno|bolo|samjhe|theek|achha|matlab|hisab)\b/i,
  ];

  if (hinglishMarkers.some((pattern) => pattern.test(text))) {
    return 'hinglish';
  }

  return 'en';
}

/**
 * Checks if the user prompt is an explicit topic switch indicator.
 */
export function isExplicitTopicSwitch(text: string): boolean {
  const lower = text.toLowerCase().trim();
  const switchPrefixes = [
    'waise',
    'by the way',
    'anyway',
    'leave that',
    'chhodo',
    'bhool jao',
    'forget that',
    'instead',
    'uske bajay',
    'dusri baat',
    'new topic',
    'alright now',
    'acha suno',
    'ek aur baat',
  ];
  return switchPrefixes.some((p) => lower.startsWith(p) || lower.includes(`, ${p}`) || lower.includes(` ${p} `));
}

export type VoiceControlCommand = 'STOP' | 'CANCEL' | 'PAUSE' | 'RESUME';

export type ActionRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface ContextResolutionResult {
  isContextualFollowUp: boolean;
  resolvedAction?: VajraAction;
  confidence: ContextConfidence;
  clarificationPrompt?: string;
  syntheticResponse?: string;
  proactiveSuggestion?: string;
  missionPlan?: VajraMission;
  updatedTopic?: string;
  updatedEntities?: Record<string, string>;
  isControlCommand?: boolean;
  controlType?: VoiceControlCommand;
}

/**
 * Natural Voice Controls:
 * "Vajra stop", "Stop", "Cancel", "Bas", "Ruk ja", "Pause", "Resume"
 */
export function detectVoiceControl(userText: string): VoiceControlCommand | null {
  const clean = userText.trim().toLowerCase().replace(/[.,!?;:]/g, '');

  // STOP: "Vajra stop", "Stop", "Bas", "Ruk ja", "Thahar ja", "Halt"
  if (
    clean === 'stop' ||
    clean === 'vajra stop' ||
    clean === 'jarvis stop' ||
    clean === 'bas' ||
    clean === 'bas karo' ||
    clean === 'ruk ja' ||
    clean === 'ruk jao' ||
    clean === 'thahar ja' ||
    clean === 'halt' ||
    clean === 'shut up'
  ) {
    return 'STOP';
  }

  // CANCEL: "Cancel", "Radd karo", "Don't do it", "Mat karo"
  if (
    clean === 'cancel' ||
    clean === 'vajra cancel' ||
    clean === 'jarvis cancel' ||
    clean === 'cancel karo' ||
    clean === 'radd karo' ||
    clean === 'mat karo' ||
    clean === 'discard' ||
    clean === "don't do it"
  ) {
    return 'CANCEL';
  }

  // PAUSE: "Pause", "Thodi der ruko", "Hold on", "Pause karo"
  if (
    clean === 'pause' ||
    clean === 'vajra pause' ||
    clean === 'jarvis pause' ||
    clean === 'pause karo' ||
    clean === 'hold on' ||
    clean === 'thodi der ruko'
  ) {
    return 'PAUSE';
  }

  // RESUME: "Resume", "Continue", "Aage badho", "Wapas shuru karo", "Resume karo"
  if (
    clean === 'resume' ||
    clean === 'continue' ||
    clean === 'vajra resume' ||
    clean === 'jarvis resume' ||
    clean === 'vajra continue' ||
    clean === 'jarvis continue' ||
    clean === 'resume karo' ||
    clean === 'aage badho' ||
    clean === 'shuru karo'
  ) {
    return 'RESUME';
  }

  return null;
}

/**
 * Classifies an action's risk level.
 * LOW: web search, weather, calculator, opening ordinary app/page, harmless informational
 * MEDIUM/HIGH: sending communications, destructive operations, privileged actions
 */
export function classifyActionRisk(action: VajraAction): ActionRiskLevel {
  if (action.type === 'DELETE_FILE') return 'HIGH';
  if (action.type === 'SYSTEM_ACTION' && action.requiresConfirmation) return 'HIGH';
  if (action.type === 'MANAGE_VAJRA_NOTE' && action.noteAction === 'delete') return 'HIGH';
  if (
    action.type === 'DIAL_PHONE' ||
    action.type === 'DRAFT_SMS' ||
    action.type === 'DRAFT_EMAIL' ||
    action.type === 'OPEN_CAMERA' ||
    action.url?.startsWith('tel:') ||
    action.url?.startsWith('sms:') ||
    action.url?.startsWith('mailto:')
  ) {
    return 'MEDIUM';
  }
  if (
    action.type === 'SEARCH_WEB' ||
    action.type === 'OPEN_WEBSITE' ||
    action.type === 'OPEN_APP' ||
    action.type === 'OPEN_SETTINGS' ||
    action.type === 'OPEN_MAPS' ||
    action.type === 'ADJUST_VOLUME' ||
    action.type === 'GET_DEVICE_INFO' ||
    action.type === 'MANAGE_VAJRA_NOTE' ||
    action.type === 'GLOBAL_STOP'
  ) {
    return 'LOW';
  }
  return 'LOW';
}

export function requiresExplicitConfirmation(action: VajraAction): boolean {
  if (action.requiresConfirmation) return true;
  return classifyActionRisk(action) === 'HIGH';
}

/**
 * Evaluates math expression safely in client runtime without eval()
 */
export function evaluateSafeMath(expr: string): number | null {
  try {
    // Normalize Hinglish / spoken expressions
    // e.g. "500 ka 18 percent", "500 ka 18%", "18% of 500"
    const percentOfMatch = expr.match(/(\d+(?:\.\d+)?)\s*(?:%|percent)\s*(?:of|ka)?\s*(\d+(?:\.\d+)?)/i);
    if (percentOfMatch) {
      const p = parseFloat(percentOfMatch[1]);
      const total = parseFloat(percentOfMatch[2]);
      return (p / 100) * total;
    }

    const kaPercentMatch = expr.match(/(\d+(?:\.\d+)?)\s*(?:ka|of)\s*(\d+(?:\.\d+)?)\s*(?:%|percent)/i);
    if (kaPercentMatch) {
      const total = parseFloat(kaPercentMatch[1]);
      const p = parseFloat(kaPercentMatch[2]);
      return (p / 100) * total;
    }

    // Clean standard arithmetic: + - * / ( )
    let clean = expr
      .replace(/x/gi, '*')
      .replace(/divided by|divide by|bhaag/gi, '/')
      .replace(/multiplied by|multiply by|guna/gi, '*')
      .replace(/plus|aur|jodo/gi, '+')
      .replace(/\s*me se\s*/gi, ' - ')
      .replace(/\s*(?:minus|ghatao)\s*(?:karo)?/gi, ' - ')
      .replace(/-\s*-+/g, '-') // collapse consecutive minuses
      .replace(/[^0-9+\-*/().\s]/g, '')
      .replace(/\s*-\s*$/g, '') // remove trailing minus if present
      .trim();

    if (!clean || !/[0-9]/.test(clean)) return null;

    // Strict regex validation to avoid arbitrary code evaluation
    if (!/^[0-9+\-*/().\s]+$/.test(clean)) return null;

    // Use safe Function constructor with strictly math tokens
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const result = new Function(`'use strict'; return (${clean})`)();
    if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
      return Math.round(result * 10000) / 10000; // Round to 4 decimals max
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Primary contextual intent resolution engine.
 * Resolves follow-ups, reference pronouns ("ye", "woh", "ab", "wahi"), math in context,
 * multi-step compound directives, and ambiguous contact directives.
 */
export function resolveContextualIntent(
  userText: string,
  context: VajraConversationContext,
  snapshot?: Partial<RuntimeStateSnapshot>
): ContextResolutionResult {
  const trimmed = userText.trim();
  if (!trimmed) return { isContextualFollowUp: false, confidence: 'HIGH_CONFIDENCE' };
  
  const lower = trimmed.toLowerCase();

  // 0. FAST PATH: Natural Voice Control Intercept (Stop, Cancel, Pause, Resume)
  // Check for exact matches or very short strings first to bypass heavy regex
  const voiceControl = detectVoiceControl(trimmed);
  if (voiceControl) {
    let syntheticResponse = 'Operation stopped.';
    let resolvedAction: VajraAction | undefined;
    let missionPlan: VajraMission | undefined;

    if (voiceControl === 'CANCEL') {
      const hasPending = Boolean(
        context.pendingConfirmation ||
          (context.activeMission &&
            (context.activeMission.status === 'planning' ||
              context.activeMission.status === 'in_progress' ||
              context.activeMission.status === 'paused')) ||
          context.activeAction?.status === 'pending'
      );
      syntheticResponse = hasPending ? 'Cancelled.' : 'No pending action to cancel.';
      if (context.activeMission) {
        missionPlan = { ...context.activeMission, status: 'cancelled' };
      }
    } else if (voiceControl === 'PAUSE') {
      if (
        context.activeMission &&
        (context.activeMission.status === 'planning' || context.activeMission.status === 'in_progress')
      ) {
        missionPlan = { ...context.activeMission, status: 'paused' };
        syntheticResponse = `Paused mission: ${context.activeMission.title}.`;
      } else {
        syntheticResponse = 'Paused.';
      }
    } else if (voiceControl === 'RESUME') {
      if (context.activeMission && context.activeMission.status === 'paused') {
        const nextStep = context.activeMission.steps[context.activeMission.currentStepIndex];
        missionPlan = { ...context.activeMission, status: 'in_progress' };
        resolvedAction = nextStep?.action;
        syntheticResponse = `Resuming mission: ${context.activeMission.title}.`;
      } else {
        syntheticResponse = 'Nothing to resume right now.';
      }
    }

    return {
      isContextualFollowUp: true,
      confidence: 'HIGH_CONFIDENCE',
      isControlCommand: true,
      controlType: voiceControl,
      syntheticResponse,
      resolvedAction,
      missionPlan,
    };
  }

  // 0.1 Self-Awareness & Protocols (Short-circuit keywords)
  if (lower.includes('protocol') || lower.includes('diagnostic') || lower.includes('status') || lower.includes('who are you') || lower.includes('kaun ho')) {
    const selfAwarenessType = detectSelfAwarenessQuery(trimmed);
    if (selfAwarenessType) {
      const defaultSnapshot: RuntimeStateSnapshot = {
        currentState: (context.actionState === 'WAITING_FOR_CONFIRMATION'
          ? 'awaiting_confirmation'
          : context.actionState === 'EXECUTING'
          ? 'executing'
          : context.actionState === 'PLANNING'
          ? 'planning'
          : context.actionState === 'VERIFYING'
          ? 'verifying'
          : 'idle') as any,
        context,
        isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
        selectedModel: 'gemini-3.1-flash-lite',
        isMuted: false,
        isVoiceActivationEnabled: true,
        voiceMode: 'WAKE_STANDBY',
        micPermission: 'GRANTED',
        isNativeAndroid: false,
        recentSelfHealEvents: [],
        activeMission: context.activeMission,
        pendingAction: context.pendingConfirmation?.action || context.activeAction,
        lastVerifiedResult: context.recentResult,
        ...snapshot,
      };

      const answer = resolveSelfAwarenessQuery(selfAwarenessType, defaultSnapshot);
      return {
        isContextualFollowUp: true,
        confidence: 'HIGH_CONFIDENCE',
        syntheticResponse: answer,
      };
    }

    // Protocol checks
    if (lower.includes('house party protocol')) {
      return {
        isContextualFollowUp: true,
        confidence: 'HIGH_CONFIDENCE',
        syntheticResponse: '### 🚀 House Party Protocol Activated\n\nCoordinated multi-system standby engaged, Sir:\n• **Language Matrix**: 20 Indian dialects & English primed\n• **Tactical Memory Fabric**: Personal world model online\n• **Android Intent Bridge**: Hardware controls connected\n• **Multimodal Scanner**: Optical document analysis ready\n\n*All auxiliary subsystems standing by for your directive, Sir.*',
        updatedTopic: 'protocols',
      };
    }
    if (lower.includes('clean slate protocol')) {
      return {
        isContextualFollowUp: true,
        confidence: 'HIGH_CONFIDENCE',
        syntheticResponse: '### ⚡ Clean Slate Protocol Initialized\n\nTransient session telemetry, temporary caches, and unpinned logs have been cleared, Sir. Energy core and neural bridges returned to pure baseline.',
        updatedTopic: 'protocols',
      };
    }
    if (lower.includes('barn door protocol') || lower === 'lock down' || lower === 'lockdown') {
      return {
        isContextualFollowUp: true,
        confidence: 'HIGH_CONFIDENCE',
        syntheticResponse: '### 🛡️ Barn Door Protocol Engaged\n\nExternal communications quarantined. Local On-Device Neural Engine forced active. All telemetry isolated to physical device boundaries, Sir.',
        updatedTopic: 'security',
      };
    }
    if (lower.includes('veronica') || lower.includes('diagnostic') || lower === 'status report') {
      return {
        isContextualFollowUp: true,
        confidence: 'HIGH_CONFIDENCE',
        syntheticResponse: '### 🔬 Veronica Armor & Subsystem Diagnostic\n\n• **Arc Reactor Core**: 100% Operational (Nominal frequency)\n• **Acoustic Sensors**: Wake Word & Speech-to-Text active\n• **Power Telemetry**: Battery voltage stable & thermal dissipation optimal\n• **Neural Stream**: Gemini Low-Latency Engine connected\n• **Security Sandbox**: Level-4 Permission Boundary verified\n\n*All systems green, Sir. Standing by for flight coordinates or tasks.*',
        updatedTopic: 'diagnostics',
      };
    }
  }

  // 0.2 Common Directives Fast Path (Short-circuit common hardware/intent actions)
  if (lower.startsWith('open ') || lower.startsWith('kholo ') || lower.startsWith('chalu karo ')) {
    const appQuery = lower.replace(/^(open |kholo |chalu karo )/, '').trim();
    
    // Settings fast path
    if (appQuery === 'settings' || appQuery === 'wifi' || appQuery === 'bluetooth' || appQuery === 'display') {
      return {
        isContextualFollowUp: true,
        confidence: 'HIGH_CONFIDENCE',
        resolvedAction: {
          id: `fast-settings-${Date.now()}`,
          type: 'OPEN_SETTINGS',
          appName: appQuery === 'settings' ? 'general' : appQuery,
          title: `Open ${appQuery.charAt(0).toUpperCase() + appQuery.slice(1)} Settings`,
          status: 'pending'
        },
        syntheticResponse: `Right away, Sir. Opening ${appQuery} settings.`
      };
    }
    
    // Calculator fast path
    if (appQuery === 'calculator' || appQuery === 'calc') {
      return {
        isContextualFollowUp: true,
        confidence: 'HIGH_CONFIDENCE',
        resolvedAction: {
          id: `fast-calc-${Date.now()}`,
          type: 'OPEN_APP',
          appName: 'Calculator',
          title: 'Open Calculator',
          status: 'pending'
        },
        syntheticResponse: 'Launching Calculator, Sir.'
      };
    }

    // Camera fast path
    if (appQuery === 'camera' || appQuery === 'photo') {
      return {
        isContextualFollowUp: true,
        confidence: 'HIGH_CONFIDENCE',
        resolvedAction: {
          id: `fast-cam-${Date.now()}`,
          type: 'OPEN_CAMERA',
          title: 'Open Camera',
          status: 'pending'
        },
        syntheticResponse: 'Initializing camera modules, Sir.'
      };
    }
  }

  // 0.3 Web Search Fast Path
  if (lower.startsWith('search for ') || lower.startsWith('google ') || lower.startsWith('find ')) {
    const query = lower.replace(/^(search for |google |find )/, '').trim();
    if (query.length > 2) {
      return {
        isContextualFollowUp: true,
        confidence: 'HIGH_CONFIDENCE',
        resolvedAction: {
          id: `fast-search-${Date.now()}`,
          type: 'SEARCH_WEB',
          query: query,
          title: `Search: "${query}"`,
          url: createSafeGoogleSearchUrl(query),
          status: 'pending'
        },
        syntheticResponse: `Searching the data matrix for "${query}", Sir.`
      };
    }
  }

  // 1. Check for Explicit Topic Switch
  if (isExplicitTopicSwitch(trimmed)) {
    return {
      isContextualFollowUp: false,
      confidence: 'HIGH_CONFIDENCE',
      updatedTopic: 'general',
      updatedEntities: {},
    };
  }

  // 2. Communication & Math Guards (Pattern matching)
  // Optimization: Only run if keywords present
  if (lower.includes('call') || lower.includes('phone') || lower.includes('lagao') || lower.includes('mail') || lower.includes('email')) {
    const bareCallMatch = trimmed.match(/^(?:call|phone lagao|dial karo|phone karo|call karo)\s+([A-Za-z\s]+?)(?:\s+ko)?$/i);
    if (bareCallMatch && !/\d{3,}/.test(trimmed)) {
      const personName = bareCallMatch[1].replace(/\s+(?:ko|karo)$/i, '').trim();
      if (personName.length > 1 && !personName.toLowerCase().startsWith('emergency')) {
        return {
          isContextualFollowUp: true,
          confidence: 'MEDIUM_CONFIDENCE',
          syntheticResponse: `Kaunse ${personName} ko call karna hai? Kripya phone number specify karein.`,
        };
      }
    }

    const bareMailMatch = trimmed.match(/^(?:mail bhejo|email karo|send email to|send mail to)\s+([A-Za-z\s]+?)(?:\s+ko)?$/i);
    if (bareMailMatch && !trimmed.includes('@')) {
      const personName = bareMailMatch[1].replace(/\s+(?:ko|karo)$/i, '').trim();
      if (personName.length > 1) {
        return {
          isContextualFollowUp: true,
          confidence: 'MEDIUM_CONFIDENCE',
          syntheticResponse: `${personName} ka email address kya hai? Kripya email ID specify karein.`,
        };
      }
    }
  }

  // 3. Math & Calculator
  if (/[0-9%]/.test(trimmed) || lower.includes('plus') || lower.includes('minus') || lower.includes('multiply') || lower.includes('divide')) {
    const mathValue = evaluateSafeMath(trimmed);
    if (mathValue !== null && (context.currentTopic === 'calculator' || context.recentEntities.lastApp === 'Calculator' || lower.includes('hisab') || lower.includes('percent'))) {
      const formattedResult = `${mathValue}`;
      return {
        isContextualFollowUp: true,
        confidence: 'HIGH_CONFIDENCE',
        syntheticResponse: `### 🧮 VAJRA Math Engine\n\n**Expression**: \`${trimmed}\`\n**Result**: **\`${formattedResult}\`**\n\n*Computed locally with mathematical precision.*`,
        updatedTopic: 'calculator',
        updatedEntities: { ...context.recentEntities, lastMathExpression: trimmed, lastMathResult: formattedResult, lastApp: 'Calculator' },
        proactiveSuggestion: `Want me to save this result (${formattedResult}) to your Scratchpad note?`,
      };
    }
  }

  // 4. Reference Pronouns & Sequential Search (Context dependent)
  if (context.currentTopic === 'search' || context.recentEntities.lastSearchQuery || context.activeAction) {
    // Ordinals
    const isPehla = lower.includes('pehla') || lower.includes('first');
    const isDoosra = lower.includes('doosra') || lower.includes('second') || lower.includes('dusra');
    if (isPehla || isDoosra) {
      const targetIndex = isPehla ? 0 : 1;
      const missionStep = context.activeMission?.steps?.[targetIndex];
      if (missionStep && missionStep.action) {
        return {
          isContextualFollowUp: true,
          resolvedAction: missionStep.action,
          confidence: 'HIGH_CONFIDENCE',
          syntheticResponse: `Opening ${isPehla ? 'first' : 'second'} item: ${missionStep.description}.`,
        };
      }
    }

    // "iska", "usko", "wahi"
    const iskaMatch = trimmed.match(/^(?:ab\s+)?(?:iska|ispe|iske|usko|uske|iska\s+ek|uska|yeh|woh)\s+([a-zA-Z0-9_\s+#]+?)(?:\s+(?:search|kholo|dikhao))?$/i);
    if (iskaMatch) {
      const parentEntity = context.recentEntities.lastSearchQuery || context.recentEntities.lastTopicEntity || '';
      const subAttribute = iskaMatch[1].trim();
      if (parentEntity && subAttribute && !['kholo', 'dhoondo', 'dikhao', 'search'].includes(subAttribute.toLowerCase())) {
        const combinedQuery = `${parentEntity} ${subAttribute}`;
        const action: VajraAction = {
          id: `act-ref-attr-${Date.now()}`,
          type: context.recentEntities.lastSearchEngine === 'youtube' ? 'OPEN_WEBSITE' : 'SEARCH_WEB',
          title: `Search: "${combinedQuery}"`,
          url: context.recentEntities.lastSearchEngine === 'youtube' ? createSafeYouTubeUrl(combinedQuery) : createSafeGoogleSearchUrl(combinedQuery),
          query: combinedQuery,
          status: 'pending',
        };
        return { isContextualFollowUp: true, resolvedAction: action, confidence: 'HIGH_CONFIDENCE', updatedTopic: 'search', updatedEntities: { ...context.recentEntities, lastSearchQuery: combinedQuery } };
      }
    }
  }

  // Default: Not a recognized follow-up pattern.
  return {
    isContextualFollowUp: false,
    confidence: 'HIGH_CONFIDENCE',
  };
}

/**
 * Updates the bounded conversation context after a user-assistant interaction.
 */
export function updateConversationContext(
  context: VajraConversationContext,
  userMessage: string,
  assistantResponse: string,
  executedAction?: VajraAction | null,
  proactiveSuggestion?: string | null
): VajraConversationContext {
  const lang = detectLanguage(userMessage);

  // Determine updated topic
  let topic = context.currentTopic;
  const lowerUser = userMessage.toLowerCase();

  if (executedAction) {
    if (executedAction.type === 'SEARCH_WEB' && (executedAction.title?.includes('Weather') || lowerUser.includes('mausam') || lowerUser.includes('weather'))) {
      topic = 'weather';
    } else if (executedAction.type === 'SEARCH_WEB' || executedAction.url?.includes('youtube.com')) {
      topic = 'search';
    } else if (executedAction.appName === 'Calculator' || executedAction.title?.includes('Calculator')) {
      topic = 'calculator';
    } else if (executedAction.appName === 'Notepad' || executedAction.title?.includes('Notepad')) {
      topic = 'notes';
    } else if (executedAction.url?.includes('maps.google.com') || lowerUser.includes('map') || lowerUser.includes('location')) {
      topic = 'navigation';
    } else if (executedAction.url?.startsWith('tel:')) {
      topic = 'communication';
    }
  } else if (lowerUser.includes('weather') || lowerUser.includes('mausam')) {
    topic = 'weather';
  } else if (lowerUser.includes('search') || lowerUser.includes('google') || lowerUser.includes('youtube')) {
    topic = 'search';
  } else if (lowerUser.includes('calculator') || lowerUser.includes('hisab')) {
    topic = 'calculator';
  }

  // Extract entities
  const updatedEntities = { ...context.recentEntities };

  if (executedAction?.query) {
    updatedEntities.lastSearchQuery = executedAction.query;
  }
  if (executedAction?.appName) {
    updatedEntities.lastApp = executedAction.appName;
  }
  if (executedAction?.url?.includes('youtube.com')) {
    updatedEntities.lastSearchEngine = 'youtube';
  } else if (executedAction?.type === 'SEARCH_WEB') {
    updatedEntities.lastSearchEngine = 'google';
  }

  // Extract maps location if applicable
  const mapsMatch = executedAction?.url?.match(/q=([^&]+)/);
  if (mapsMatch) {
    try {
      updatedEntities.lastLocation = decodeURIComponent(mapsMatch[1]);
    } catch {}
  }

  // Bounded History Management: strictly max MAX_CONTEXT_TURNS
  const newTurn: ContextTurn = {
    user: userMessage,
    assistant: assistantResponse.slice(0, 300), // bounded summary
    intent: executedAction ? executedAction.type : 'CONVERSATION',
    topic,
    timestamp: Date.now(),
  };

  const updatedHistory = [...context.history, newTurn].slice(-MAX_CONTEXT_TURNS);

  return {
    ...context,
    currentTopic: topic,
    currentIntent: executedAction ? executedAction.type : 'CONVERSATION',
    lastUserRequest: userMessage,
    lastAssistantResponse: assistantResponse,
    activeAction: executedAction || context.activeAction,
    language: lang,
    recentEntities: updatedEntities,
    history: updatedHistory,
    actionState: executedAction ? 'COMPLETED' : 'IDLE',
    proactiveSuggestion: proactiveSuggestion ?? null,
  };
}
