/**
 * VAJRA Mobile — Self-Healing Engine (VajraSelfHealController)
 * 
 * Implements bounded, observable, automated self-recovery for runtime anomalies:
 * DETECT -> DIAGNOSE -> SAFE RECOVERY -> VERIFY -> REPORT
 * 
 * Strict Architectural Rules:
 * - Bounded retries (1-3 max depending on category).
 * - No infinite loops or endless polling.
 * - Never fake successful recovery.
 * - Never bypass permissions or security policy.
 * - Do not restart the entire application unnecessarily.
 * - Record events in a bounded history (max 20) with clean user-facing summaries.
 */

export type SelfHealCategory =
  | 'VOICE_SERVICE_FAILURE'
  | 'TTS_FAILURE'
  | 'SPEECH_RECOGNITION_FAILURE'
  | 'PERMISSION_FAILURE'
  | 'NETWORK_FAILURE'
  | 'API_FAILURE'
  | 'SKILL_FAILURE'
  | 'ACTION_FAILURE'
  | 'STALE_SESSION'
  | 'INVALID_STATE'
  | 'UI_RECOVERY_REQUIRED';

export interface SelfHealEvent {
  id: string;
  category: SelfHealCategory;
  timestamp: number;
  attemptNumber: number;
  success: boolean;
  strategyUsed: string;
  userMessage: string;
  backoffAppliedMs?: number;
  errorDetail?: string;
}

export interface SelfHealPlan {
  category: SelfHealCategory;
  strategy: string;
  maxRetries: number;
  backoffMs: number;
  recoveryAction: () => Promise<boolean>;
  verificationAction: () => Promise<boolean>;
  successMessage: string;
  failureMessage: string;
}

export const MAX_RECOVERY_HISTORY = 20;
export const STORAGE_KEY_SELF_HEAL_ENABLED = 'vajra_self_heal_enabled';

// Bounded retry limits per category
export const CATEGORY_RETRY_LIMITS: Record<SelfHealCategory, number> = {
  VOICE_SERVICE_FAILURE: 2,
  TTS_FAILURE: 2,
  SPEECH_RECOGNITION_FAILURE: 2,
  PERMISSION_FAILURE: 1, // Strictly 1: never continuously badger for permissions
  NETWORK_FAILURE: 3,
  API_FAILURE: 2,
  SKILL_FAILURE: 2,
  ACTION_FAILURE: 1,
  STALE_SESSION: 2,
  INVALID_STATE: 2,
  UI_RECOVERY_REQUIRED: 2,
};

let inMemorySelfHealEnabled: boolean | null = null;

export class VajraSelfHealController {
  private isEnabled: boolean = true;
  private retryCounts: Map<SelfHealCategory, number> = new Map();
  private eventHistory: SelfHealEvent[] = [];
  private activeRecoveries: Set<SelfHealCategory> = new Set();
  private recoveryEpoch: number = 0;
  private listeners: Array<(event: SelfHealEvent) => void> = [];

  constructor() {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY_SELF_HEAL_ENABLED);
        this.isEnabled = stored !== null ? stored === 'true' : true;
      } catch {
        this.isEnabled = true;
      }
    } else if (inMemorySelfHealEnabled !== null) {
      this.isEnabled = inMemorySelfHealEnabled;
    }
  }

  public isSelfHealingEnabled(): boolean {
    return this.isEnabled;
  }

  public setSelfHealingEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    inMemorySelfHealEnabled = enabled;
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY_SELF_HEAL_ENABLED, String(enabled));
      } catch {}
    }
  }

  public getEventHistory(): SelfHealEvent[] {
    return [...this.eventHistory];
  }

  public clearHistory(): void {
    this.eventHistory = [];
    this.retryCounts.clear();
    this.activeRecoveries.clear();
  }

  /**
   * Immediately aborts any in-flight recovery retries (e.g. on user STOP/CANCEL or app background lifecycle cleanup).
   */
  public cancelAllRecoveries(): void {
    this.recoveryEpoch++;
    this.activeRecoveries.clear();
  }

  public subscribe(listener: (event: SelfHealEvent) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(event: SelfHealEvent): void {
    this.eventHistory.unshift(event);
    if (this.eventHistory.length > MAX_RECOVERY_HISTORY) {
      this.eventHistory = this.eventHistory.slice(0, MAX_RECOVERY_HISTORY);
    }
    this.listeners.forEach((l) => {
      try {
        l(event);
      } catch (err) {
        console.warn('[VajraSelfHeal] Listener exception:', err);
      }
    });
  }

  /**
   * Reset retry count for a category upon normal successful operation.
   */
  public resetRetryCount(category: SelfHealCategory): void {
    this.retryCounts.delete(category);
  }

  /**
   * Computes bounded exponential backoff: baseMs * 2^(attempt - 1)
   */
  public computeExponentialBackoff(baseMs: number, attemptNumber: number): number {
    if (baseMs <= 0) return 0;
    const exponent = Math.max(0, Math.min(attemptNumber - 1, 4));
    return baseMs * Math.pow(2, exponent);
  }

  /**
   * Primary Self-Healing Workflow:
   * 1. DETECT failure and check eligibility
   * 2. DIAGNOSE root category & bounded retry allowance
   * 3. SAFE RECOVERY with exponential backoff delay
   * 4. VERIFY outcome
   * 5. REPORT honest summary to user
   */
  public async executeSelfHeal(plan: SelfHealPlan): Promise<{
    recovered: boolean;
    userMessage: string;
    event: SelfHealEvent;
  }> {
    const { category } = plan;

    if (!this.isEnabled) {
      const skippedEvent: SelfHealEvent = {
        id: `heal-disabled-${Date.now()}`,
        category,
        timestamp: Date.now(),
        attemptNumber: 0,
        success: false,
        strategyUsed: 'SKIPPED_SELF_HEAL_DISABLED',
        userMessage: plan.failureMessage,
      };
      this.notify(skippedEvent);
      return { recovered: false, userMessage: plan.failureMessage, event: skippedEvent };
    }

    if (this.activeRecoveries.has(category)) {
      // Re-entry guard: already recovering this category
      const blockedEvent: SelfHealEvent = {
        id: `heal-active-${Date.now()}`,
        category,
        timestamp: Date.now(),
        attemptNumber: this.retryCounts.get(category) || 1,
        success: false,
        strategyUsed: 'BLOCKED_CONCURRENT_RECOVERY',
        userMessage: 'Recovery already in progress. Please wait.',
      };
      return { recovered: false, userMessage: blockedEvent.userMessage, event: blockedEvent };
    }

    const currentAttempts = (this.retryCounts.get(category) || 0) + 1;
    const maxRetries = plan.maxRetries || CATEGORY_RETRY_LIMITS[category] || 2;

    // Check bounded retry ceiling
    if (currentAttempts > maxRetries) {
      const exhaustedEvent: SelfHealEvent = {
        id: `heal-exhausted-${Date.now()}`,
        category,
        timestamp: Date.now(),
        attemptNumber: currentAttempts,
        success: false,
        strategyUsed: 'RETRY_LIMIT_EXCEEDED',
        userMessage: `${plan.failureMessage} (Recovery limit reached. Please check settings or retry manually.)`,
      };
      this.notify(exhaustedEvent);
      return { recovered: false, userMessage: exhaustedEvent.userMessage, event: exhaustedEvent };
    }

    this.retryCounts.set(category, currentAttempts);
    this.activeRecoveries.add(category);
    const startEpoch = this.recoveryEpoch;
    const effectiveBackoffMs = this.computeExponentialBackoff(plan.backoffMs, currentAttempts);

    try {
      // Step 3: Exponential backoff delay before recovery
      if (effectiveBackoffMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, effectiveBackoffMs));
      }

      // Check if cancelled during backoff
      if (this.recoveryEpoch !== startEpoch) {
        const abortedEvent: SelfHealEvent = {
          id: `heal-aborted-${Date.now()}`,
          category,
          timestamp: Date.now(),
          attemptNumber: currentAttempts,
          success: false,
          strategyUsed: 'ABORTED_BY_LIFECYCLE_OR_USER',
          userMessage: 'Recovery cancelled.',
          backoffAppliedMs: effectiveBackoffMs,
        };
        this.notify(abortedEvent);
        return { recovered: false, userMessage: abortedEvent.userMessage, event: abortedEvent };
      }

      // Execute safe recovery strategy
      const actionSuccess = await plan.recoveryAction();

      if (this.recoveryEpoch !== startEpoch) {
        const abortedEvent: SelfHealEvent = {
          id: `heal-aborted-${Date.now()}`,
          category,
          timestamp: Date.now(),
          attemptNumber: currentAttempts,
          success: false,
          strategyUsed: 'ABORTED_BY_LIFECYCLE_OR_USER',
          userMessage: 'Recovery cancelled.',
          backoffAppliedMs: effectiveBackoffMs,
        };
        this.notify(abortedEvent);
        return { recovered: false, userMessage: abortedEvent.userMessage, event: abortedEvent };
      }

      if (!actionSuccess) {
        throw new Error('Recovery action returned false');
      }

      // Step 4: Strict verification
      const verified = await plan.verificationAction();

      if (verified && this.recoveryEpoch === startEpoch) {
        // Recovery succeeded and verified!
        this.resetRetryCount(category);
        const successEvent: SelfHealEvent = {
          id: `heal-ok-${Date.now()}`,
          category,
          timestamp: Date.now(),
          attemptNumber: currentAttempts,
          success: true,
          strategyUsed: plan.strategy,
          userMessage: plan.successMessage,
          backoffAppliedMs: effectiveBackoffMs,
        };
        this.notify(successEvent);
        return { recovered: true, userMessage: plan.successMessage, event: successEvent };
      } else {
        throw new Error('Verification check failed after recovery action');
      }
    } catch (err: any) {
      const failEvent: SelfHealEvent = {
        id: `heal-fail-${Date.now()}`,
        category,
        timestamp: Date.now(),
        attemptNumber: currentAttempts,
        success: false,
        strategyUsed: plan.strategy,
        userMessage: plan.failureMessage,
        backoffAppliedMs: effectiveBackoffMs,
        errorDetail: err?.message || String(err),
      };
      this.notify(failEvent);
      return { recovered: false, userMessage: plan.failureMessage, event: failEvent };
    } finally {
      this.activeRecoveries.delete(category);
    }
  }
}

// Global Singleton Instance
export const vajraSelfHeal = new VajraSelfHealController();
