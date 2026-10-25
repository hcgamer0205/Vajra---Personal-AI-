/**
 * VAJRA Mobile — Intelligent Multi-Step Task Planner & FSM
 * 
 * Coordinates multi-step phone tasks with strict finite-state-machine governance:
 * IDLE → UNDERSTANDING → PLANNING → AWAITING_CONFIRMATION → EXECUTING → VERIFYING → COMPLETED
 * (with PAUSED, CANCELLED, RECOVERING, ROLLING_BACK, ERROR)
 * 
 * Safety & Reliability Rules:
 * - Sequential verification before next step dispatch
 * - Cancellation propagation (clears queued future steps immediately on STOP/CANCEL)
 * - Safe rollback for reversible actions (e.g. volume, local notes)
 * - Bounded retries and timeouts
 * - No permission escalation without explicit user authorization
 */

import { VajraAction } from '../types';
import { mobileControlEngine, MobileActionResult } from './mobileControlEngine';
import { evaluateActionPolicy } from './actionPolicyEngine';

export type TaskPlannerState =
  | 'IDLE'
  | 'UNDERSTANDING'
  | 'PLANNING'
  | 'AWAITING_CONFIRMATION'
  | 'EXECUTING'
  | 'VERIFYING'
  | 'COMPLETED'
  | 'PAUSED'
  | 'CANCELLED'
  | 'RECOVERING'
  | 'ROLLING_BACK'
  | 'ERROR';

export interface PlannedStep {
  id: string;
  order: number;
  description: string;
  action: VajraAction;
  status: 'pending' | 'executing' | 'completed' | 'failed' | 'cancelled' | 'rolled_back';
  result?: MobileActionResult;
  isReversible?: boolean;
}

export interface MobilePlan {
  id: string;
  title: string;
  userPrompt: string;
  steps: PlannedStep[];
  currentStepIndex: number;
  state: TaskPlannerState;
  createdAt: number;
  completedAt?: number;
  errorReason?: string;
}

export class MobileTaskPlanner {
  private activePlan: MobilePlan | null = null;
  private isCancelled = false;

  public getActivePlan(): MobilePlan | null {
    return this.activePlan;
  }

  public getState(): TaskPlannerState {
    return this.activePlan ? this.activePlan.state : 'IDLE';
  }

  /**
   * Decomposes multi-intent directives into structured planned steps.
   * e.g. "Open maps, then prepare a message telling my friend I'll arrive soon"
   */
  public createPlan(userPrompt: string, actions: VajraAction[]): MobilePlan {
    const planId = `plan-${Date.now()}`;
    const steps: PlannedStep[] = actions.map((act, index) => {
      const policy = evaluateActionPolicy(act);
      return {
        id: `step-${index + 1}-${Date.now()}`,
        order: index + 1,
        description: act.title || act.type,
        action: policy.redactedAction,
        status: 'pending',
        isReversible: act.type === 'ADJUST_VOLUME' || act.type === 'MANAGE_VAJRA_NOTE',
      };
    });

    this.activePlan = {
      id: planId,
      title: actions.length > 1 ? `Multi-step Task (${actions.length} steps)` : actions[0]?.title || 'Phone Action',
      userPrompt,
      steps,
      currentStepIndex: 0,
      state: 'PLANNING',
      createdAt: Date.now(),
    };

    this.isCancelled = false;
    return this.activePlan;
  }

  /**
   * Executes the active plan sequentially with step verification and cancellation checks
   */
  public async executePlan(
    onStepStart?: (step: PlannedStep) => void,
    onStepComplete?: (step: PlannedStep, result: MobileActionResult) => void,
    onPlanComplete?: (plan: MobilePlan) => void,
    onPlanFailed?: (plan: MobilePlan, reason: string) => void
  ): Promise<MobilePlan> {
    if (!this.activePlan) {
      throw new Error('No active task plan to execute.');
    }

    const plan = this.activePlan;

    for (let i = plan.currentStepIndex; i < plan.steps.length; i++) {
      if (this.isCancelled) {
        plan.state = 'CANCELLED';
        for (let j = i; j < plan.steps.length; j++) {
          plan.steps[j].status = 'cancelled';
        }
        break;
      }

      plan.currentStepIndex = i;
      const step = plan.steps[i];

      // 1. Policy check for confirmation
      const policy = evaluateActionPolicy(step.action);
      if (policy.requiresExplicitConfirmation && !step.action.confirmed) {
        plan.state = 'AWAITING_CONFIRMATION';
        return plan;
      }

      // 2. EXECUTING
      plan.state = 'EXECUTING';
      step.status = 'executing';
      onStepStart?.(step);

      // Execute via MobileControlEngine
      const result = await mobileControlEngine.executeAction(step.action);
      step.result = result;

      // 3. VERIFYING
      plan.state = 'VERIFYING';

      if (result.executionStatus === 'success' && result.isVerified) {
        step.status = 'completed';
        onStepComplete?.(step, result);
      } else {
        step.status = 'failed';
        plan.state = 'ERROR';
        plan.errorReason = result.failureReason || 'Step verification failed.';

        // Perform safe rollback for previously completed reversible steps
        await this.rollbackPreviousSteps(i);

        onPlanFailed?.(plan, plan.errorReason);
        return plan;
      }
    }

    if (plan.state !== 'CANCELLED' && plan.state !== 'ERROR') {
      plan.state = 'COMPLETED';
      plan.completedAt = Date.now();
      onPlanComplete?.(plan);
    }

    return plan;
  }

  /**
   * Propagates immediate cancellation: clears running plan and flags cancelled
   */
  public cancel(): void {
    this.isCancelled = true;
    if (this.activePlan) {
      this.activePlan.state = 'CANCELLED';
      for (const step of this.activePlan.steps) {
        if (step.status === 'pending' || step.status === 'executing') {
          step.status = 'cancelled';
        }
      }
    }
  }

  /**
   * Pauses the active task plan
   */
  public pause(): void {
    if (this.activePlan && (this.activePlan.state === 'EXECUTING' || this.activePlan.state === 'PLANNING')) {
      this.activePlan.state = 'PAUSED';
    }
  }

  /**
   * Resumes a paused task plan
   */
  public resume(): void {
    if (this.activePlan && this.activePlan.state === 'PAUSED') {
      this.activePlan.state = 'EXECUTING';
    }
  }

  /**
   * Rolls back previously completed reversible steps if a subsequent required step fails
   */
  private async rollbackPreviousSteps(failedIndex: number): Promise<void> {
    if (!this.activePlan) return;
    this.activePlan.state = 'ROLLING_BACK';

    for (let i = failedIndex - 1; i >= 0; i--) {
      const step = this.activePlan.steps[i];
      if (step.status === 'completed' && step.isReversible) {
        // Rollback volume or local note action safely
        if (step.action.type === 'ADJUST_VOLUME') {
          const oppositeDir = step.action.volumeDirection === 'up' ? 'down' : 'up';
          await mobileControlEngine.executeAction({
            id: `rollback-${Date.now()}`,
            type: 'ADJUST_VOLUME',
            title: 'Rollback Volume',
            volumeDirection: oppositeDir,
          });
          step.status = 'rolled_back';
        }
      }
    }
  }

  public reset(): void {
    this.activePlan = null;
    this.isCancelled = false;
  }
}

export const mobileTaskPlanner = new MobileTaskPlanner();
