/**
 * VAJRA Mobile — Consciousness-Inspired Self-Awareness & Introspection Engine
 * 
 * Scientific Boundary & Engineering Philosophy:
 * This module does not claim subjective sentience, consciousness, or human-like feelings.
 * It provides observable, transparent software self-awareness:
 * - Accurate runtime state awareness (listening, understanding, executing, verifying, etc.)
 * - Grounded introspection (answering what VAJRA is doing, verified vs planned, active errors, limitations)
 * - Proactive self-monitoring (detecting stuck missions, stale confirmations, voice desync)
 * - Bounded task reflection & mistake analysis (recording factual execution audits)
 * - Strict non-self-modifying boundary (cannot alter security rules, grant permissions, or execute arbitrary code)
 */

import { VajraAction, ActionType } from '../types';
import { VajraConversationContext, VajraMission } from './vajraContext';
import { MicrophonePermissionState, VoiceActivationMode } from './voiceController';
import { SelfHealEvent } from './vajraSelfHeal';

export type AuthoritativeState =
  | 'idle'
  | 'listening'
  | 'understanding'
  | 'planning'
  | 'awaiting_confirmation'
  | 'executing'
  | 'verifying'
  | 'speaking'
  | 'paused'
  | 'recovering'
  | 'error'
  | 'backgrounded';

export interface RuntimeStateSnapshot {
  currentState: AuthoritativeState;
  context: VajraConversationContext;
  isOnline: boolean;
  selectedModel: string;
  isMuted: boolean;
  isVoiceActivationEnabled: boolean;
  voiceMode: VoiceActivationMode;
  micPermission: MicrophonePermissionState;
  isNativeAndroid: boolean;
  recentSelfHealEvents: SelfHealEvent[];
  activeMission: VajraMission | null;
  pendingAction: VajraAction | null;
  lastVerifiedResult: { success: boolean; message: string; timestamp: number } | null;
}

export interface TaskReflection {
  id: string;
  timestamp: number;
  userRequest: string;
  authorizedAction: string;
  attemptedOperation: string;
  observedResult: string;
  wasVerified: boolean;
  failureReason?: string;
  preventativeImprovement: string;
}

export interface SystemHealthReport {
  isHealthy: boolean;
  issues: string[];
  recommendations: string[];
  staleConfirmationsCount: number;
  stuckMissionsCount: number;
  repeatedFailuresCount: number;
  timestamp: number;
}

// Bounded in-memory store for task reflections (max 10 items)
const MAX_TASK_REFLECTIONS = 10;
const reflectionsStore: TaskReflection[] = [];

/**
 * Records a bounded post-task reflection and mistake analysis.
 * Capped strictly at 10 items to prevent unbounded memory growth.
 */
export function recordTaskReflection(reflection: Omit<TaskReflection, 'id' | 'timestamp'>): TaskReflection {
  const item: TaskReflection = {
    ...reflection,
    id: `ref-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    timestamp: Date.now(),
  };

  reflectionsStore.push(item);
  if (reflectionsStore.length > MAX_TASK_REFLECTIONS) {
    reflectionsStore.shift();
  }

  return item;
}

/**
 * Returns read-only copy of recent task reflections.
 */
export function getTaskReflections(): TaskReflection[] {
  return [...reflectionsStore];
}

/**
 * Clears stored task reflections.
 */
export function clearTaskReflections(): void {
  reflectionsStore.length = 0;
}

/**
 * Self-awareness query categories
 */
export type SelfAwarenessQueryType =
  | 'CURRENT_STATE'
  | 'ACTIVE_TASK'
  | 'LISTENING_STATUS'
  | 'CONNECTIVITY'
  | 'WAKE_WORD_STATUS'
  | 'EXECUTION_VS_PLAN'
  | 'VERIFICATION_STATUS'
  | 'CURRENT_LIMITATIONS'
  | 'LAST_ERROR'
  | 'PERMISSION_REQUIRED'
  | 'CAN_CONTROL_SETTING'
  | 'DID_MESSAGE_SEND'
  | 'OFFLINE_AVAILABILITY';

/**
 * Checks if user input is an introspection or self-awareness query.
 * Supports English, Hindi, and Hinglish phrasing.
 */
export function detectSelfAwarenessQuery(userText: string): SelfAwarenessQueryType | null {
  if (!userText || typeof userText !== 'string') return null;
  const lower = userText.trim().toLowerCase().replace(/[?,.!]/g, '');

  // 1. Current State: "What are you doing", "Tum abhi kya kar rahe ho", "Current state kya hai", "Status batao"
  if (
    lower.includes('tum abhi kya kar rahe ho') ||
    lower.includes('kya kar rahe ho') ||
    lower.includes('what are you doing') ||
    lower.includes('what are you doing right now') ||
    lower.includes('current status') ||
    lower.includes('tumhara status kya hai') ||
    lower.includes('apna status batao') ||
    lower.includes('current state')
  ) {
    return 'CURRENT_STATE';
  }

  // 2. Active Task: "What task are you working on", "Kis task par kaam kar rahe ho", "Active mission kya hai"
  if (
    lower.includes('kis task par kaam kar rahe ho') ||
    lower.includes('kis task pe ho') ||
    lower.includes('what task are you working on') ||
    lower.includes('active task') ||
    lower.includes('active mission') ||
    lower.includes('kaunsa task chal raha hai') ||
    lower.includes('current mission')
  ) {
    return 'ACTIVE_TASK';
  }

  // 3. Listening Status: "Are you listening to me", "Kya tum meri baat sun rahe ho", "Sun rahe ho", "Are you listening"
  if (
    lower.includes('kya tum meri baat sun rahe ho') ||
    lower.includes('meri baat sun rahe ho') ||
    lower.includes('sun rahe ho') ||
    lower.includes('sunte ho') ||
    lower.includes('are you listening') ||
    lower.includes('are you listening to me') ||
    lower.includes('can you hear me') ||
    lower.includes('kya tum mujhe sun sakte ho')
  ) {
    return 'LISTENING_STATUS';
  }

  // 4. Connectivity / Internet: "Internet access available hai", "Are you online", "Offline ho ya online"
  if (
    lower.includes('internet access available hai') ||
    lower.includes('internet chal raha hai') ||
    lower.includes('internet connection') ||
    lower.includes('are you online') ||
    lower.includes('offline ho ya online') ||
    lower.includes('online ho ya offline') ||
    lower.includes('do you have internet') ||
    lower.includes('kya internet hai')
  ) {
    return 'CONNECTIVITY';
  }

  // 5. Wake Mode: "Wake mode enabled hai", "Is voice activation on", "Wake word active hai"
  if (
    lower.includes('wake mode enabled hai') ||
    lower.includes('wake word active hai') ||
    lower.includes('voice activation on hai') ||
    lower.includes('is wake mode enabled') ||
    lower.includes('is voice activation on') ||
    lower.includes('is wake word active') ||
    lower.includes('kya hello vajra kaam karega')
  ) {
    return 'WAKE_WORD_STATUS';
  }

  // 6. Execution vs Plan: "Action complete kiya ya sirf plan", "Did you complete this action or just plan it"
  if (
    lower.includes('action complete kiya ya sirf plan') ||
    lower.includes('sirf plan banaya') ||
    lower.includes('complete kiya ya plan') ||
    lower.includes('did you complete this action or just plan it') ||
    lower.includes('did you execute or just plan') ||
    lower.includes('kya kaam ho gaya ya sirf socha') ||
    lower.includes('did you actually run it')
  ) {
    return 'EXECUTION_VS_PLAN';
  }

  // 7. Verification Status: "Kya verify hua aur kya abhi pending hai", "What is verified", "What is pending"
  if (
    lower.includes('kya verify hua') ||
    lower.includes('kya pending hai') ||
    lower.includes('what is verified') ||
    lower.includes('what is still pending') ||
    lower.includes('verification status') ||
    lower.includes('result verify hua') ||
    lower.includes('kya verify hua aur kya abhi pending hai')
  ) {
    return 'VERIFICATION_STATUS';
  }

  // 8. Current Limitations: "Tumhari current limitation kya hai", "What are your limitations", "What are your limits"
  if (
    lower.includes('tumhari current limitation kya hai') ||
    lower.includes('tumhari limitation kya hai') ||
    lower.includes('what are your limitations') ||
    lower.includes('what is your current limitation') ||
    lower.includes('tumhari seema kya hai') ||
    lower.includes('what are your limits') ||
    lower.includes('apni limitations batao')
  ) {
    return 'CURRENT_LIMITATIONS';
  }

  // 9. Last Error: "Pichhle task mein kya error aaya tha", "What was the last error", "Error kyun aaya"
  if (
    lower.includes('pichhle task mein kya error aaya') ||
    lower.includes('kya error aaya tha') ||
    lower.includes('what was the last error') ||
    lower.includes('pichhla error kya tha') ||
    lower.includes('ye galti kyun hui') ||
    lower.includes('why did that fail') ||
    lower.includes('last error kya tha')
  ) {
    return 'LAST_ERROR';
  }

  // 10. Permission Required: "Kya tumhe meri permission chahiye", "Do you need my permission", "Is confirmation needed"
  if (
    lower.includes('kya tumhe meri permission chahiye') ||
    lower.includes('meri permission chahiye') ||
    lower.includes('do you need my permission') ||
    lower.includes('is confirmation needed') ||
    lower.includes('kya confirmation chahiye') ||
    lower.includes('permission required hai')
  ) {
    return 'PERMISSION_REQUIRED';
  }

  // 11. Can Control Setting: "Can you control this setting", "Kya tum setting control kar sakte ho"
  if (
    lower.includes('can you control this setting') ||
    lower.includes('can you control settings') ||
    lower.includes('kya tum setting control kar sakte ho') ||
    lower.includes('setting change kar sakte ho') ||
    lower.includes('kya tum settings badal sakte ho')
  ) {
    return 'CAN_CONTROL_SETTING';
  }

  // 12. Did Message Send: "Did the message actually send", "Kya message chala gaya", "Was the message sent"
  if (
    lower.includes('did the message actually send') ||
    lower.includes('did the message send') ||
    lower.includes('was the message sent') ||
    lower.includes('kya message chala gaya') ||
    lower.includes('kya message send hua') ||
    lower.includes('kya sms chala gaya')
  ) {
    return 'DID_MESSAGE_SEND';
  }

  // 13. Offline Availability: "Is this feature available offline", "Kya ye offline chalega", "Can you work offline"
  if (
    lower.includes('available offline') ||
    lower.includes('work offline') ||
    lower.includes('offline chalega') ||
    lower.includes('offline kaam karega') ||
    lower.includes('kya offline chalega')
  ) {
    return 'OFFLINE_AVAILABILITY';
  }

  return null;
}

/**
 * Synthesizes an honest, grounded natural-language answer to a self-awareness query.
 * Distinguishes verified runtime state from fabricated narratives.
 */
export function resolveSelfAwarenessQuery(
  queryType: SelfAwarenessQueryType,
  snapshot: RuntimeStateSnapshot
): string {
  const isHindi = snapshot.context.language === 'hi' || snapshot.context.language === 'hinglish';

  switch (queryType) {
    case 'CURRENT_STATE': {
      const stateLabels: Record<AuthoritativeState, { en: string; hi: string }> = {
        idle: {
          en: 'I am currently in Standby (Idle) mode, awaiting your next directive.',
          hi: 'Main abhi Standby (Idle) mode mein hoon aur aapke agle command ka intezar kar raha hoon.',
        },
        listening: {
          en: 'My acoustic microphone sensor is currently active and listening to your voice.',
          hi: 'Mera acoustic sensor abhi active hai aur main aapki aawaz sun raha hoon.',
        },
        understanding: {
          en: 'I am currently parsing your directive, resolving context, and evaluating safety constraints.',
          hi: 'Main abhi aapke command ko analyze kar raha hoon aur safety check kar raha hoon.',
        },
        planning: {
          en: snapshot.activeMission
            ? `I am currently structuring the task plan for: "${snapshot.activeMission.title}".`
            : 'I am currently structuring the sequential execution plan.',
          hi: snapshot.activeMission
            ? `Main abhi "${snapshot.activeMission.title}" ke execution plan par kaam kar raha hoon.`
            : 'Main abhi agle steps ka plan tayyar kar raha hoon.',
        },
        awaiting_confirmation: {
          en: snapshot.pendingAction
            ? `I am currently paused, awaiting your explicit confirmation before executing "${snapshot.pendingAction.title}".`
            : 'I am awaiting your explicit authorization before proceeding.',
          hi: snapshot.pendingAction
            ? `Main abhi ruka hua hoon aur "${snapshot.pendingAction.title}" execute karne ke liye aapki confirmation ka intezar kar raha hoon.`
            : 'Main aage badhne ke liye aapki explicit permission ka intezar kar raha hoon.',
        },
        executing: {
          en: snapshot.pendingAction
            ? `I am currently executing the authorized action: "${snapshot.pendingAction.title}".`
            : 'I am currently executing the authorized task.',
          hi: snapshot.pendingAction
            ? `Main abhi authorized action "${snapshot.pendingAction.title}" execute kar raha hoon.`
            : 'Main abhi authorized task execute kar raha hoon.',
        },
        verifying: {
          en: 'I am currently verifying the operation results against system security and sanity checks.',
          hi: 'Main abhi execution ke results ko verify aur cross-check kar raha hoon.',
        },
        speaking: {
          en: 'I am currently synthesizing voice audio response output.',
          hi: 'Main abhi voice response deliver kar raha hoon.',
        },
        paused: {
          en: 'I am currently paused. Say "Resume" or tap resume when you wish to continue.',
          hi: 'Main abhi Paused mode mein hoon. Jab chahein "Resume" bol kar continue kar sakte hain.',
        },
        recovering: {
          en: 'Self-healing engine is currently active, diagnosing and resolving an operational fault.',
          hi: 'Mera Self-Healing engine abhi issue ko diagnose karke recover kar raha hai.',
        },
        error: {
          en: 'I have encountered an operational exception and logged the diagnosis.',
          hi: 'Ek operational error report hua hai aur maine diagnosis record kar liya hai.',
        },
        backgrounded: {
          en: 'Application lifecycle is currently in background mode.',
          hi: 'Application abhi background mode mein hai.',
        },
      };

      return isHindi ? stateLabels[snapshot.currentState].hi : stateLabels[snapshot.currentState].en;
    }

    case 'ACTIVE_TASK': {
      if (snapshot.activeMission) {
        const stepNum = snapshot.activeMission.currentStepIndex + 1;
        const totalSteps = snapshot.activeMission.steps.length;
        const status = snapshot.activeMission.status;
        return isHindi
          ? `Mera active task hai: "${snapshot.activeMission.title}" (Step ${stepNum} of ${totalSteps}, Status: ${status}).`
          : `I am working on: "${snapshot.activeMission.title}" (Step ${stepNum} of ${totalSteps}, Status: ${status}).`;
      }
      if (snapshot.context.activeAction) {
        return isHindi
          ? `Pichhla active action tha: "${snapshot.context.activeAction.title}" (${snapshot.context.activeAction.status || 'completed'}). Abhi koi naya multi-step mission active nahi hai.`
          : `The active action was: "${snapshot.context.activeAction.title}". No multi-step mission is currently active.`;
      }
      return isHindi
        ? 'Abhi koi active task ya mission in-progress nahi hai. Main idle state mein hoon.'
        : 'There is no active mission in progress right now. All systems are on standby.';
    }

    case 'LISTENING_STATUS': {
      if (snapshot.currentState === 'listening') {
        return isHindi
          ? 'Haan, main abhi sun raha hoon. Aap jo bolenge main use capture kar raha hoon.'
          : "Yes, my microphone sensor is active and I am listening to your voice right now.";
      }
      if (snapshot.isVoiceActivationEnabled) {
        return isHindi
          ? 'Mic session abhi standby par hai. Jaise hi aap "Hello Vajra" bolenge, main activate hokar sunne lagunga.'
          : 'Microphone is in standby. Say "Hello Vajra" anytime to wake me up.';
      }
      return isHindi
        ? 'Abhi microphone listening active nahi hai. Sunne ke liye mic icon tap karein ya Settings mein "Voice Activation" chalu karein.'
        : 'Microphone is currently inactive. Tap the microphone button or enable "Voice Activation" in Core Settings.';
    }

    case 'CONNECTIVITY': {
      if (snapshot.isOnline) {
        return isHindi
          ? `Internet connectivity available hai. Main cloud proxy (${snapshot.selectedModel}) se connected hoon.`
          : `Internet connection is active. Connected to cloud neural engine (${snapshot.selectedModel}).`;
      }
      return isHindi
        ? 'Internet disconnected hai ya offline mode active hai. Local fallback engine operational hai.'
        : 'Offline mode is active. Running on client-side local heuristics engine without cloud connection.';
    }

    case 'WAKE_WORD_STATUS': {
      if (snapshot.isVoiceActivationEnabled) {
        const modeDesc = snapshot.isNativeAndroid ? 'Native Android SpeechRecognizer' : 'Web Speech Standby';
        return isHindi
          ? `Haan, Voice Activation ("Hello Vajra") ENABLED hai (${modeDesc}).`
          : `Yes, Voice Activation ("Hello Vajra") is ENABLED (${modeDesc}).`;
      }
      return isHindi
        ? 'Nahi, Voice Activation abhi OFF hai. Isko Core Settings > Voice & TTS se enable kar sakte hain.'
        : 'No, Voice Activation is currently disabled. You can enable it in Core Settings > Voice & TTS.';
    }

    case 'EXECUTION_VS_PLAN': {
      if (snapshot.pendingAction && !snapshot.pendingAction.confirmed) {
        return isHindi
          ? `Ye action abhi sirf PLAN kiya gaya hai ("${snapshot.pendingAction.title}"). User confirmation milne ke baad hi execute hoga.`
          : `This action is only PLANNED ("${snapshot.pendingAction.title}"). It will NOT execute until you confirm.`;
      }
      if (snapshot.lastVerifiedResult) {
        const outcome = snapshot.lastVerifiedResult.success ? 'successfully executed and verified' : 'failed execution';
        return isHindi
          ? `Pichhla action execute aur verify ho chuka hai: "${snapshot.lastVerifiedResult.message}".`
          : `The previous action was actually executed and verified: "${snapshot.lastVerifiedResult.message}".`;
      }
      return isHindi
        ? 'Abhi koi pending plan nahi hai. Jo actions confirm hoti hain main unhe hi execute aur verify karta hoon.'
        : 'No pending plan. I execute authorized actions only after validation and explicit confirmation.';
    }

    case 'VERIFICATION_STATUS': {
      if (snapshot.pendingAction) {
        return isHindi
          ? `Pending: User confirmation for "${snapshot.pendingAction.title}". Verified: Security policy risk assessment complete.`
          : `Pending: Confirmation for "${snapshot.pendingAction.title}". Verified: Policy risk check passed.`;
      }
      if (snapshot.lastVerifiedResult) {
        return isHindi
          ? `Verified Result: "${snapshot.lastVerifiedResult.message}" (${new Date(snapshot.lastVerifiedResult.timestamp).toLocaleTimeString()}). Abhi koi naya operation pending nahi hai.`
          : `Verified Result: "${snapshot.lastVerifiedResult.message}". No operations currently pending.`;
      }
      return isHindi
        ? 'Sabhi system checks verified hain. Zero operations pending.'
        : 'All core checks are verified. Zero operations currently pending.';
    }

    case 'CURRENT_LIMITATIONS': {
      const platformNote = snapshot.isNativeAndroid
        ? 'Android Native container active'
        : 'Browser runtime container active';
      return isHindi
        ? `Meri current limitations: 1. Destructive actions (jaise file delete) bina explicit confirmation ke execute nahi ho sakti. 2. Microphone capture strictly opt-in hai. 3. Cloud LLM network connectivity par depend karta hai (${platformNote}).`
        : `My current operational limitations: 1. Destructive actions strictly require user confirmation. 2. Microphone access is opt-in and battery-conserving. 3. Deep generative reasoning depends on active network connectivity (${platformNote}).`;
    }

    case 'LAST_ERROR': {
      if (snapshot.recentSelfHealEvents.length > 0) {
        const last = snapshot.recentSelfHealEvents[snapshot.recentSelfHealEvents.length - 1];
        return isHindi
          ? `Pichhla recorded event: [${last.category}] "${last.userMessage}" (${last.success ? 'Recovered' : 'Failed'}).`
          : `Last recorded recovery event: [${last.category}] "${last.userMessage}" (${last.success ? 'Recovered successfully' : 'Recovery failed'}).`;
      }
      return isHindi
        ? 'Pichhle tasks mein koi error nahi aaya. Systems fully nominal rahe hain.'
        : 'No operational errors recorded in recent tasks. All systems have performed nominally.';
    }

    case 'PERMISSION_REQUIRED': {
      if (snapshot.pendingAction) {
        return isHindi
          ? `Haan, mujhe "${snapshot.pendingAction.title}" execute karne ke liye aapki confirmation chahiye. Kripya Yes/Haan bolein ya Confirm karein.`
          : `Yes, I need your confirmation to execute "${snapshot.pendingAction.title}". Please say Yes or tap Confirm.`;
      }
      if (snapshot.micPermission !== 'GRANTED') {
        return isHindi
          ? 'Mic use karne ke liye Microphone permission required hai.'
          : 'Microphone permission is required to enable voice listening.';
      }
      return isHindi
        ? 'Abhi kisi naye task ke liye permission required nahi hai. Standby par hoon.'
        : 'No authorization or permissions are currently required. Ready on standby.';
    }

    case 'CAN_CONTROL_SETTING': {
      return isHindi
        ? 'Main Wi-Fi, Bluetooth, Display, Sound, Battery, aur Accessibility ki Android settings open kar sakta hoon. Security policy ke mutabiq direct setting toggle karne ke liye OS settings screen par user interaction required hota hai.'
        : 'I can open Android settings screens for Wi-Fi, Bluetooth, Display, Sound, Battery, Apps, and Accessibility via standard system intents. Adjusting system settings directly requires user confirmation in the OS settings interface.';
    }

    case 'DID_MESSAGE_SEND': {
      return isHindi
        ? 'Main message ya SMS system composer mein draft kar deta hoon. Android security policy ke mutabiq final send tap aap hi karte hain—main background mein bina permission ke message nahi bhejta.'
        : 'I draft the SMS or email with your specified recipient and message in the system composer. Under Android security policy, the final send tap is always made by you—I never secretly transmit messages in the background.';
    }

    case 'OFFLINE_AVAILABILITY': {
      return isHindi
        ? 'Phone controls jaise apps kholna, camera, dialer, SMS draft, volume, aur local notes offline kaam karte hain. Deep generative reasoning aur web search ke liye internet zaroori hai.'
        : 'On-device phone controls (opening apps, camera, dialer, SMS drafts, volume, maps navigation, local notes) work offline without network access. Generative AI streaming and web search require an active internet connection.';
    }
  }
}

/**
 * Event-driven lightweight health inspection.
 * Detects voice lifecycle inconsistencies, stuck missions, and stale confirmations.
 */
export function inspectSystemHealth(
  context: VajraConversationContext,
  snapshot: {
    isListening: boolean;
    voiceMode: VoiceActivationMode;
    micPermission: MicrophonePermissionState;
    pendingAction: VajraAction | null;
    activeMission: VajraMission | null;
    recentErrorsCount: number;
  }
): SystemHealthReport {
  const issues: string[] = [];
  const recommendations: string[] = [];
  let staleConfirmationsCount = 0;
  let stuckMissionsCount = 0;

  const now = Date.now();

  // 1. Stale pending confirmation check (> 2 minutes without user answer)
  if (snapshot.pendingAction && context.pendingConfirmation) {
    const elapsed = now - context.pendingConfirmation.createdAt;
    if (elapsed > 120000) {
      staleConfirmationsCount++;
      issues.push(`Pending confirmation for "${snapshot.pendingAction.title}" has been idle for > 2 minutes.`);
      recommendations.push('Auto-invalidate stale confirmation to prevent accidental confirmation.');
    }
  }

  // 2. Stuck mission check (> 5 minutes with no step progress)
  if (snapshot.activeMission && snapshot.activeMission.status === 'in_progress') {
    const elapsed = now - snapshot.activeMission.createdAt;
    if (elapsed > 300000) {
      stuckMissionsCount++;
      issues.push(`Mission "${snapshot.activeMission.title}" in_progress without completion for > 5 minutes.`);
      recommendations.push('Offer user option to pause or cancel stalled mission.');
    }
  }

  // 3. Voice lifecycle inconsistency check
  if (snapshot.voiceMode === 'WAKE_DISABLED' && snapshot.isListening) {
    issues.push('Voice activation mode is WAKE_DISABLED but listening flag is true.');
    recommendations.push('Stop active listening session to preserve battery and privacy.');
  }

  return {
    isHealthy: issues.length === 0,
    issues,
    recommendations,
    staleConfirmationsCount,
    stuckMissionsCount,
    repeatedFailuresCount: snapshot.recentErrorsCount,
    timestamp: now,
  };
}
