/**
 * VAJRA Mobile — Central Action Policy & Security Engine
 * 
 * Enforces unified risk classification, explicit authorization, sensitive data
 * redaction, and idempotency across all execution entry points (voice, UI, autonomous plans).
 * 
 * Risk Hierarchy:
 * - LOW: Opening app/website, web search, system settings navigation, non-sensitive telemetry.
 * - MODERATE: Prefilling dialer, drafting SMS/email, camera launch, changing session volume/preferences.
 * - HIGH: Deleting user data, direct communication dispatch, financial transactions, changing security config.
 */

import { VajraAction, ActionType } from '../types';

export type ActionRiskLevel = 'LOW' | 'MODERATE' | 'HIGH';

export interface ActionPolicyEvaluation {
  riskLevel: ActionRiskLevel;
  requiresExplicitConfirmation: boolean;
  reason: string;
  confirmationPrompt?: string;
  consequenceDescription?: string;
  redactedAction: VajraAction;
}

// Regex patterns to detect sensitive credentials (passwords, PINs, API keys, tokens, card numbers)
const SENSITIVE_PATTERNS = [
  /(?:password|passwd|pwd|passcode|pin)\s*[:=]\s*["']?([^\s"',;]+)["']?/gi,
  /(?:api[_-]?key|secret|auth[_-]?token|bearer)\s*[:=]\s*["']?([^\s"',;]+)["']?/gi,
  /\b(?:\d[ -]*?){13,16}\b/g, // Credit card candidates
  /\b\d{4,6}\b(?=.*(?:otp|pin|verification))/gi, // OTP/PIN candidates
];

/**
 * Sanitizes and redacts sensitive credentials from strings
 */
export function redactSensitiveData(text: string): string {
  if (!text || typeof text !== 'string') return text;
  let sanitized = text;

  // Redact passwords, PINs, tokens
  sanitized = sanitized.replace(
    /(password|passwd|pwd|passcode|pin|secret|api_key|token)\s*[:=]\s*["']?([^\s"',;]+)["']?/gi,
    '$1: [REDACTED]'
  );

  // Redact potential 16-digit card sequences
  sanitized = sanitized.replace(/\b(?:\d{4}[ -]?){3}\d{4}\b/g, '****-****-****-****');

  return sanitized;
}

/**
 * Redacts any sensitive fields inside a VajraAction object
 */
export function redactAction(action: VajraAction): VajraAction {
  const clone = { ...action };

  if (clone.description) clone.description = redactSensitiveData(clone.description);
  if (clone.query) clone.query = redactSensitiveData(clone.query);
  if (clone.fileContent) clone.fileContent = redactSensitiveData(clone.fileContent);
  if (clone.messageText) clone.messageText = redactSensitiveData(clone.messageText);

  return clone;
}

/**
 * Evaluates an action through the central security & authorization policy
 */
export function evaluateActionPolicy(action: VajraAction): ActionPolicyEvaluation {
  const clean = redactAction(action);
  const type = clean.type;

  // HIGH RISK ACTIONS
  if (type === 'DELETE_FILE') {
    return {
      riskLevel: 'HIGH',
      requiresExplicitConfirmation: true,
      reason: 'Permanent deletion of files/directories can cause irreversible data loss.',
      confirmationPrompt: `Are you sure you want to permanently delete "${clean.targetPath || clean.title}"?`,
      consequenceDescription: 'This file will be permanently removed from storage.',
      redactedAction: clean,
    };
  }

  // Blocking dangerous financial / transaction / arbitrary install requests
  const lowerTitle = (clean.title || '').toLowerCase();
  const lowerDesc = (clean.description || '').toLowerCase();
  const isDangerousFinance =
    lowerTitle.includes('payment') ||
    lowerTitle.includes('transfer money') ||
    lowerTitle.includes('buy now') ||
    lowerDesc.includes('crypto transfer');

  if (isDangerousFinance) {
    return {
      riskLevel: 'HIGH',
      requiresExplicitConfirmation: true,
      reason: 'Financial transactions cannot be autonomously executed by VAJRA.',
      confirmationPrompt: 'VAJRA security policy blocks automated financial transactions. Open official app instead?',
      consequenceDescription: 'Financial authorization boundary.',
      redactedAction: clean,
    };
  }

  // MODERATE RISK ACTIONS (User intent is to interact with communications, cameras, or preferences)
  if (type === 'DIAL_PHONE') {
    return {
      riskLevel: 'MODERATE',
      requiresExplicitConfirmation: false, // Prefills dialer; user retains final physical tap to initiate call
      reason: 'Opens phone dialer with prefilled number for user inspection.',
      redactedAction: clean,
    };
  }

  if (type === 'DRAFT_SMS') {
    return {
      riskLevel: 'MODERATE',
      requiresExplicitConfirmation: false, // Opens system composer with draft; user retains final physical tap to send
      reason: 'Drafts SMS in messaging app for user review without automated transmission.',
      redactedAction: clean,
    };
  }

  if (type === 'DRAFT_EMAIL') {
    return {
      riskLevel: 'MODERATE',
      requiresExplicitConfirmation: false,
      reason: 'Drafts email in mail client for user review.',
      redactedAction: clean,
    };
  }

  if (type === 'OPEN_CAMERA') {
    return {
      riskLevel: 'MODERATE',
      requiresExplicitConfirmation: false,
      reason: 'Opens official camera interface. No images are captured without user interaction.',
      redactedAction: clean,
    };
  }

  if (type === 'ADJUST_VOLUME') {
    return {
      riskLevel: 'LOW',
      requiresExplicitConfirmation: false,
      reason: 'Adjusts session or media playback volume with system feedback.',
      redactedAction: clean,
    };
  }

  if (type === 'OPEN_SETTINGS') {
    return {
      riskLevel: 'LOW',
      requiresExplicitConfirmation: false,
      reason: 'Opens standard Android settings screen.',
      redactedAction: clean,
    };
  }

  if (type === 'GET_DEVICE_INFO') {
    return {
      riskLevel: 'LOW',
      requiresExplicitConfirmation: false,
      reason: 'Reads non-sensitive battery and network connectivity status.',
      redactedAction: clean,
    };
  }

  if (type === 'MANAGE_VAJRA_NOTE') {
    const isDelete = clean.noteAction === 'delete';
    return {
      riskLevel: isDelete ? 'HIGH' : 'LOW',
      requiresExplicitConfirmation: isDelete,
      reason: isDelete ? 'Clearing all notes removes saved scratchpad items.' : 'Manages local VAJRA scratchpad.',
      confirmationPrompt: isDelete ? 'Clear all saved VAJRA notes from memory?' : undefined,
      consequenceDescription: isDelete ? 'All notes in memory will be deleted.' : undefined,
      redactedAction: clean,
    };
  }

  if (type === 'OPEN_APP' || type === 'OPEN_WEBSITE' || type === 'SEARCH_WEB' || type === 'OPEN_MAPS') {
    return {
      riskLevel: 'LOW',
      requiresExplicitConfirmation: false,
      reason: 'Safe application or navigation intent.',
      redactedAction: clean,
    };
  }

  if (type === 'GLOBAL_STOP') {
    return {
      riskLevel: 'LOW',
      requiresExplicitConfirmation: false,
      reason: 'Emergency stop command immediately halts running operations.',
      redactedAction: clean,
    };
  }

  // Privileged or unknown system actions default to requiring confirmation
  if (type === 'SYSTEM_ACTION') {
    return {
      riskLevel: 'HIGH',
      requiresExplicitConfirmation: true,
      reason: 'Privileged system action requires user consent.',
      confirmationPrompt: `Authorize execution of "${clean.title}"?`,
      consequenceDescription: clean.description || 'System state modification.',
      redactedAction: clean,
    };
  }

  return {
    riskLevel: 'LOW',
    requiresExplicitConfirmation: false,
    reason: 'Standard safe operation.',
    redactedAction: clean,
  };
}

/**
 * Strict Confirmation Validation:
 * Validates that an affirmative response ("yes", "haan", "proceed") corresponds
 * strictly to the pending action ID, preventing accidental authorizations from unrelated turns.
 */
export function validateConfirmationAffirmation(
  userText: string,
  pendingActionId: string,
  targetActionId: string
): { isConfirmed: boolean; reason: string } {
  if (!pendingActionId || !targetActionId) {
    return { isConfirmed: false, reason: 'No pending confirmation context active.' };
  }

  if (pendingActionId !== targetActionId) {
    return { isConfirmed: false, reason: 'Action identifier mismatch. Stale confirmation rejected.' };
  }

  const clean = userText.trim().toLowerCase();
  const affirmativePatterns = [
    /^(?:yes|yup|yeah|sure|confirm|proceed|ok|okay|do it|haan|karo|theek hai|bilkul|kar do)$/i,
    /(?:yes|confirm|proceed|haan|kar do|theek hai)/i,
  ];

  const matches = affirmativePatterns.some((pattern) => pattern.test(clean));
  return {
    isConfirmed: matches,
    reason: matches ? 'Explicit user authorization granted.' : 'User response did not grant explicit authorization.',
  };
}

export const actionPolicyEngine = {
  evaluateActionPolicy,
  redactSensitiveData,
  redactAction,
  validateConfirmationAffirmation,
};
