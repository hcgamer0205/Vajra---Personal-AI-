/**
 * VAJRA Mobile — Self-Improvement & Adaptive Learning Engine (VajraLearningController)
 * 
 * Safely learns bounded user preferences and corrections over time without
 * violating security boundaries or persisting sensitive information.
 * 
 * Strict Architectural Rules:
 * - Pipeline: EVENT -> CANDIDATE -> VALIDATION -> POLICY CHECK -> APPROVAL -> UPDATE
 * - NEVER learn or store passwords, tokens, API keys, credentials, or raw audio.
 * - Single accidental statements never permanently alter behavior.
 * - Confidence threshold (>= 0.8) required for automatic persistence.
 * - Clear Learned Preferences removes learned items without wiping other app config.
 * - Transparent UI representation in Settings -> VAJRA Intelligence.
 */

import { isSensitiveMemoryContent } from './vajraMemory';

export type LearningCandidateStatus = 'candidate' | 'approved' | 'rejected';
export type LearningCandidateSource = 'user_correction' | 'repeated_interaction' | 'explicit_directive';

export interface LearnedPreference {
  key: string;
  value: string;
  category: 'language' | 'voice' | 'response_style' | 'command_preference' | 'workflow';
  confidence: number;
  frequency: number;
  lastUpdated: number;
  notes?: string;
}

export interface LearningCandidate {
  id: string;
  category: 'language' | 'voice' | 'response_style' | 'command_preference' | 'workflow';
  key: string;
  value: string;
  confidence: number; // 0.0 to 1.0
  source: LearningCandidateSource;
  timestamp: number;
  frequency: number;
  status: LearningCandidateStatus;
  rejectionReason?: string;
}

export interface UserCorrectionEvent {
  id: string;
  rawUtterance: string;
  detectedMistake?: string;
  intendedCorrection: string;
  timestamp: number;
  appliedPreference?: string;
}

export const STORAGE_KEY_LEARNING_ENABLED = 'vajra_learning_enabled';
export const STORAGE_KEY_LEARNED_PREFERENCES = 'vajra_learned_preferences';
export const STORAGE_KEY_CORRECTIONS_HISTORY = 'vajra_corrections_history';
export const MAX_CORRECTIONS_HISTORY = 20;
export const CONFIDENCE_THRESHOLD_PERSIST = 0.8;

// Additional sensitive patterns specifically for adaptive learning
const RESTRICTED_LEARNING_PATTERNS = [
  /password/i,
  /passwd/i,
  /\bpin\b/i,
  /\bcvv\b/i,
  /token/i,
  /auth/i,
  /secret/i,
  /api[-_]?key/i,
  /credential/i,
  /card\s+number/i,
  /bank\s+account/i,
  /\botp\b/i,
];

let inMemoryLearningEnabled: boolean | null = null;
let inMemoryLearnedPrefs: Record<string, LearnedPreference> = {};
let inMemoryCorrectionsHistory: UserCorrectionEvent[] = [];

export class VajraLearningController {
  private isEnabled: boolean = true;
  private learnedPreferences: Map<string, LearnedPreference> = new Map();
  private candidatePool: Map<string, LearningCandidate> = new Map();
  private correctionsHistory: UserCorrectionEvent[] = [];
  private listeners: Array<() => void> = [];

  constructor() {
    this.loadState();
  }

  private loadState(): void {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      if (inMemoryLearningEnabled !== null) {
        this.isEnabled = inMemoryLearningEnabled;
      }
      Object.entries(inMemoryLearnedPrefs).forEach(([k, v]) => this.learnedPreferences.set(k, { ...v }));
      this.correctionsHistory = [...inMemoryCorrectionsHistory];
      return;
    }
    try {
      const storedEnabled = localStorage.getItem(STORAGE_KEY_LEARNING_ENABLED);
      this.isEnabled = storedEnabled !== null ? storedEnabled === 'true' : true;

      const rawPrefs = localStorage.getItem(STORAGE_KEY_LEARNED_PREFERENCES);
      if (rawPrefs) {
        const parsed: Record<string, LearnedPreference> = JSON.parse(rawPrefs);
        Object.entries(parsed).forEach(([k, v]) => this.learnedPreferences.set(k, v));
      }

      const rawCorrections = localStorage.getItem(STORAGE_KEY_CORRECTIONS_HISTORY);
      if (rawCorrections) {
        this.correctionsHistory = JSON.parse(rawCorrections);
      }
    } catch (err) {
      console.warn('[VajraLearning] Error loading state:', err);
    }
  }

  private saveState(): void {
    inMemoryLearningEnabled = this.isEnabled;
    const prefsObj: Record<string, LearnedPreference> = {};
    this.learnedPreferences.forEach((v, k) => {
      prefsObj[k] = { ...v };
    });
    inMemoryLearnedPrefs = prefsObj;
    inMemoryCorrectionsHistory = this.correctionsHistory.slice(0, MAX_CORRECTIONS_HISTORY);

    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY_LEARNING_ENABLED, String(this.isEnabled));
      localStorage.setItem(STORAGE_KEY_LEARNED_PREFERENCES, JSON.stringify(prefsObj));
      localStorage.setItem(
        STORAGE_KEY_CORRECTIONS_HISTORY,
        JSON.stringify(this.correctionsHistory.slice(0, MAX_CORRECTIONS_HISTORY))
      );
    } catch (err) {
      console.warn('[VajraLearning] Error saving state:', err);
    }
  }

  private notify(): void {
    this.listeners.forEach((l) => {
      try {
        l();
      } catch {}
    });
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  public isLearningActive(): boolean {
    return this.isEnabled;
  }

  public setLearningActive(active: boolean): void {
    this.isEnabled = active;
    this.saveState();
    this.notify();
  }

  public getLearnedPreferences(): LearnedPreference[] {
    return Array.from(this.learnedPreferences.values());
  }

  public getRecentCorrections(): UserCorrectionEvent[] {
    return [...this.correctionsHistory];
  }

  public clearLearnedPreferences(): void {
    this.learnedPreferences.clear();
    this.candidatePool.clear();
    this.correctionsHistory = [];
    inMemoryLearnedPrefs = {};
    inMemoryCorrectionsHistory = [];
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEY_LEARNED_PREFERENCES);
        localStorage.removeItem(STORAGE_KEY_CORRECTIONS_HISTORY);
      } catch {}
    }
    this.notify();
  }

  /**
   * Sensitive Safety Check:
   * Rejects any text containing credentials, tokens, or private secrets.
   */
  public isSensitive(content: string): boolean {
    if (!content) return false;
    if (isSensitiveMemoryContent(content)) return true;
    return RESTRICTED_LEARNING_PATTERNS.some((p) => p.test(content));
  }

  /**
   * Process and register a potential candidate preference through the safety pipeline:
   * EVENT -> CANDIDATE -> VALIDATION -> POLICY CHECK -> APPROVAL -> PERSIST
   */
  public processCandidate(
    category: LearnedPreference['category'],
    key: string,
    value: string,
    source: LearningCandidateSource,
    initialConfidence = 0.5
  ): LearningCandidate {
    const candidateId = `cand-${category}-${key.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

    // Step 1: Sensitive policy check
    if (this.isSensitive(key) || this.isSensitive(value)) {
      const rejected: LearningCandidate = {
        id: candidateId,
        category,
        key,
        value: '[REDACTED]',
        confidence: 0,
        source,
        timestamp: Date.now(),
        frequency: 1,
        status: 'rejected',
        rejectionReason: 'Sensitive security information detected and rejected by policy.',
      };
      return rejected;
    }

    if (!this.isEnabled) {
      return {
        id: candidateId,
        category,
        key,
        value,
        confidence: 0,
        source,
        timestamp: Date.now(),
        frequency: 1,
        status: 'rejected',
        rejectionReason: 'Adaptive learning is disabled by user.',
      };
    }

    // Check existing candidate pool or existing preference
    const existing = this.candidatePool.get(candidateId);
    const newFrequency = (existing?.frequency || 0) + 1;

    // Confidence formula:
    // User corrections receive higher base confidence (0.85)
    // Repeated interactions increment confidence (+0.2 per occurrence)
    let calculatedConfidence = initialConfidence;
    if (source === 'user_correction') {
      calculatedConfidence = Math.max(calculatedConfidence, 0.85);
    } else if (newFrequency >= 3) {
      calculatedConfidence = Math.min(1.0, calculatedConfidence + 0.35);
    } else if (newFrequency >= 2) {
      calculatedConfidence = Math.min(1.0, calculatedConfidence + 0.2);
    }

    const candidate: LearningCandidate = {
      id: candidateId,
      category,
      key,
      value,
      confidence: calculatedConfidence,
      source,
      timestamp: Date.now(),
      frequency: newFrequency,
      status: calculatedConfidence >= CONFIDENCE_THRESHOLD_PERSIST ? 'approved' : 'candidate',
    };

    this.candidatePool.set(candidateId, candidate);

    // If confidence meets threshold, promote to persistent learned preferences
    if (candidate.status === 'approved') {
      this.learnedPreferences.set(key, {
        key,
        value,
        category,
        confidence: candidate.confidence,
        frequency: candidate.frequency,
        lastUpdated: Date.now(),
        notes: `Learned via ${source.replace(/_/g, ' ')}`,
      });
      this.saveState();
      this.notify();
    }

    return candidate;
  }

  /**
   * Evaluates user utterance for natural corrections:
   * e.g. "No, I meant YouTube", "Search nahi, YouTube kholo", "Short answer", "Speak Hindi"
   */
  public evaluateUtteranceForCorrection(userText: string): UserCorrectionEvent | null {
    if (!this.isEnabled || !userText) return null;
    const lower = userText.trim().toLowerCase();

    // 1. Voice style corrections: "Short mein batao", "Short answer", "Concise please"
    if (
      lower.includes('short mein batao') ||
      lower.includes('short answer') ||
      lower.includes('briefly') ||
      lower.includes('chota answer') ||
      lower.includes('concise answer') ||
      lower === 'short' ||
      lower === 'concise'
    ) {
      this.processCandidate('response_style', 'preferredVerbosity', 'concise', 'user_correction', 0.9);
      const correction: UserCorrectionEvent = {
        id: `corr-${Date.now()}`,
        rawUtterance: userText,
        intendedCorrection: 'Concise response style preference',
        timestamp: Date.now(),
        appliedPreference: 'preferredVerbosity = concise',
      };
      this.recordCorrection(correction);
      return correction;
    }

    // 2. Language corrections: "Speak Hindi", "Hindi mein bolo", "Speak English"
    if (lower.includes('speak hindi') || lower.includes('hindi mein bolo') || lower.includes('hindi me baat karo')) {
      this.processCandidate('language', 'preferredLanguage', 'hi', 'user_correction', 0.9);
      const correction: UserCorrectionEvent = {
        id: `corr-${Date.now()}`,
        rawUtterance: userText,
        intendedCorrection: 'Hindi language preference',
        timestamp: Date.now(),
        appliedPreference: 'preferredLanguage = hi',
      };
      this.recordCorrection(correction);
      return correction;
    }

    if (lower.includes('speak english') || lower.includes('english mein bolo')) {
      this.processCandidate('language', 'preferredLanguage', 'en-US', 'user_correction', 0.9);
      const correction: UserCorrectionEvent = {
        id: `corr-${Date.now()}`,
        rawUtterance: userText,
        intendedCorrection: 'English language preference',
        timestamp: Date.now(),
        appliedPreference: 'preferredLanguage = en-US',
      };
      this.recordCorrection(correction);
      return correction;
    }

    // 3. Voice gender corrections: "Use female voice", "Female voice karo", "Use male voice"
    if (lower.includes('female voice') || lower.includes('aurat ki awaz') || lower.includes('ladki ki awaz')) {
      this.processCandidate('voice', 'preferredVoiceGender', 'female', 'user_correction', 0.9);
      const correction: UserCorrectionEvent = {
        id: `corr-${Date.now()}`,
        rawUtterance: userText,
        intendedCorrection: 'Female voice preference',
        timestamp: Date.now(),
        appliedPreference: 'preferredVoiceGender = female',
      };
      this.recordCorrection(correction);
      return correction;
    }

    if (lower.includes('male voice') || lower.includes('aadmi ki awaz') || lower.includes('ladke ki awaz')) {
      this.processCandidate('voice', 'preferredVoiceGender', 'male', 'user_correction', 0.9);
      const correction: UserCorrectionEvent = {
        id: `corr-${Date.now()}`,
        rawUtterance: userText,
        intendedCorrection: 'Male voice preference',
        timestamp: Date.now(),
        appliedPreference: 'preferredVoiceGender = male',
      };
      this.recordCorrection(correction);
      return correction;
    }

    // 4. Action corrections: "Search nahi, YouTube kholo", "No, I meant YouTube"
    // Must contain explicit correction prefix so normal "YouTube kholo" commands are not misclassified
    const ytCorrectionMatch = lower.match(
      /(?:no[,.\s]+i\s+meant|search\s+nahi[,.\s]*|not\s+search[,.\s]*|nahi[,.\s]+)\s*youtube(?:\s+(?:kholo|chalao|open))?/i
    );
    if (ytCorrectionMatch) {
      this.processCandidate('command_preference', 'preferredMediaApp', 'YouTube', 'user_correction', 0.85);
      const correction: UserCorrectionEvent = {
        id: `corr-${Date.now()}`,
        rawUtterance: userText,
        detectedMistake: 'Generic web search',
        intendedCorrection: 'Target YouTube video player',
        timestamp: Date.now(),
        appliedPreference: 'preferredMediaApp = YouTube',
      };
      this.recordCorrection(correction);
      return correction;
    }

    // 5. Entity corrections: "I said Python, not Java", "Not Java, I meant Python"
    const iSaidMatch = userText.trim().match(/^(?:i\s+said|maine\s+kaha)\s+([a-zA-Z0-9_+#\s]+?)\s*,\s*not\s+([a-zA-Z0-9_+#\s]+)$/i);
    if (iSaidMatch) {
      const intended = iSaidMatch[1].trim();
      const mistaken = iSaidMatch[2].trim();
      if (!this.isSensitive(intended) && !this.isSensitive(mistaken)) {
        // Record as candidate (confidence 0.65 so a single accidental entity typo doesn't permanently alter global prefs)
        this.processCandidate('command_preference', `entityCorrection_${mistaken}`, intended, 'repeated_interaction', 0.65);
        const correction: UserCorrectionEvent = {
          id: `corr-${Date.now()}`,
          rawUtterance: userText,
          detectedMistake: mistaken,
          intendedCorrection: intended,
          timestamp: Date.now(),
        };
        this.recordCorrection(correction);
        return correction;
      }
    }

    return null;
  }

  private recordCorrection(event: UserCorrectionEvent): void {
    this.correctionsHistory.unshift(event);
    if (this.correctionsHistory.length > MAX_CORRECTIONS_HISTORY) {
      this.correctionsHistory = this.correctionsHistory.slice(0, MAX_CORRECTIONS_HISTORY);
    }
    this.saveState();
  }
}

// Global Singleton Instance
export const vajraLearning = new VajraLearningController();
