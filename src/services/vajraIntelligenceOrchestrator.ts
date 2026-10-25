/**
 * VAJRA Mobile — Central Intelligence & Orchestration Engine
 * 
 * Implements the core operating cycle:
 * UNDERSTAND → REMEMBER → REASON → PLAN → AUTHORIZE → ACT → OBSERVE → VERIFY → RESPOND → LEARN
 * 
 * Architectural Highlights:
 * 1. Fast Path vs Deep Path:
 *    - Simple conversational questions and arithmetic bypass heavy planning pipelines.
 *    - Compound or multi-action goals trigger bounded task planning.
 * 2. Multi-turn Entity & Context Resolution:
 *    - Seamlessly resolves references (e.g. "Find three options" → "Compare their prices" → "Tell me more about the second one").
 * 3. Memory & World Model Integration:
 *    - Contextually queries `personalWorldModel` without over-personalizing every response.
 * 4. Policy & Security Enforced:
 *    - Enforces `actionPolicyEngine` risk levels, action ID confirmations, and credential redactions.
 */

import { VajraAction } from '../types';
import { personalWorldModel, LongTermMemory } from './personalWorldModel';
import { actionPolicyEngine, evaluateActionPolicy, redactSensitiveData } from './actionPolicyEngine';
import { mobileControlEngine, MobileActionResult } from './mobileControlEngine';
import { mobileTaskPlanner, MobilePlan } from './mobileTaskPlanner';
import { resolveContextualIntent, VajraConversationContext, getInitialContext } from './vajraContext';
import { extractActionsFromText } from './actionParser';
import { formatIndianCurrency, formatIndianDate } from './indianLanguageRegistry';
import { proactiveEngine } from './proactiveEngine';

export type OrchestratorRoute =
  | 'DIRECT_CONVERSATION'
  | 'KNOWLEDGE_RETRIEVAL'
  | 'WEB_SEARCH'
  | 'MEMORY_RETRIEVAL'
  | 'NATIVE_ANDROID_ACTION'
  | 'MULTI_STEP_MISSION'
  | 'CLARIFICATION_REQUIRED'
  | 'AWAITING_CONFIRMATION'
  | 'UNSUPPORTED_OR_SAFE_REFUSAL';

export interface OrchestratorResult {
  route: OrchestratorRoute;
  spokenResponse: string;
  displayResponse: string;
  actions: VajraAction[];
  plan?: MobilePlan;
  relevantMemories?: LongTermMemory[];
  executionResults?: MobileActionResult[];
  isVerified: boolean;
  proactiveSuggestion?: string;
}

class VajraIntelligenceOrchestrator {
  private activeContext: VajraConversationContext = getInitialContext();

  public getContext(): VajraConversationContext {
    return this.activeContext;
  }

  public setContext(ctx: VajraConversationContext): void {
    this.activeContext = ctx;
  }

  /**
   * Main Orchestrator entry point executing the 10-step cycle:
   * UNDERSTAND → REMEMBER → REASON → PLAN → AUTHORIZE → ACT → OBSERVE → VERIFY → RESPOND → LEARN
   */
  public async processDirective(
    userText: string,
    options: { interactionMode?: 'voice' | 'text'; isVoiceCall?: boolean } = {}
  ): Promise<OrchestratorResult> {
    const rawInput = userText.trim();
    if (!rawInput) {
      return {
        route: 'DIRECT_CONVERSATION',
        spokenResponse: 'I am standing by for your directive.',
        displayResponse: 'I am standing by for your directive.',
        actions: [],
        isVerified: true,
      };
    }

    // 1. UNDERSTAND: Context & Intent Parsing
    const parsedContext = resolveContextualIntent(rawInput, this.activeContext);
    if (parsedContext.updatedTopic) {
      this.activeContext = {
        ...this.activeContext,
        currentTopic: parsedContext.updatedTopic,
        recentEntities: { ...this.activeContext.recentEntities, ...(parsedContext.updatedEntities || {}) },
      };
    }

    // 2. REMEMBER: Retrieve relevant memories & preferences
    const relevantMemories = personalWorldModel.retrieveRelevantMemories(rawInput, 3);
    const prefs = personalWorldModel.getPreferences();

    // Fast-path: Contextual synthetic response (Stop, Cancel, Resume, Self-Awareness)
    if (parsedContext.syntheticResponse) {
      return {
        route: 'DIRECT_CONVERSATION',
        spokenResponse: parsedContext.syntheticResponse,
        displayResponse: parsedContext.syntheticResponse,
        actions: parsedContext.resolvedAction ? [parsedContext.resolvedAction] : [],
        relevantMemories,
        isVerified: true,
      };
    }

    // 3. REASON: Extract actions and determine route
    const { actions } = extractActionsFromText(rawInput, true);

    // Route: No structured actions -> Direct conversation or knowledge response
    if (actions.length === 0) {
      // Memory queries
      const lower = rawInput.toLowerCase();
      if (lower.includes('remember') || lower.includes('yaad hai') || lower.includes('meri memory')) {
        const memoryText = relevantMemories.length > 0
          ? `Relevant memories from your vault:\n` + relevantMemories.map((m) => `• ${m.key}: ${m.value}`).join('\n')
          : `I have no specific memories stored regarding "${rawInput}".`;

        return {
          route: 'MEMORY_RETRIEVAL',
          spokenResponse: relevantMemories.length > 0 ? `I retrieved ${relevantMemories.length} relevant memories.` : `No memories found for that query.`,
          displayResponse: memoryText,
          actions: [],
          relevantMemories,
          isVerified: true,
        };
      }

      return {
        route: 'DIRECT_CONVERSATION',
        spokenResponse: '', // Handled by LLM stream in chat view
        displayResponse: '',
        actions: [],
        relevantMemories,
        isVerified: true,
      };
    }

    // Route: Multi-Step Task detected (> 1 actions)
    if (actions.length > 1) {
      // 4. PLAN: Create multi-step plan
      const plan = mobileTaskPlanner.createPlan(rawInput, actions);

      // 5. AUTHORIZE & 6. ACT: Execute plan with verification
      const executedPlan = await mobileTaskPlanner.executePlan();

      const successCount = executedPlan.steps.filter((s) => s.status === 'completed').length;
      const displayMsg = `Planned ${executedPlan.steps.length} steps: ${successCount} verified completed.`;

      return {
        route: 'MULTI_STEP_MISSION',
        spokenResponse: displayMsg,
        displayResponse: displayMsg,
        actions,
        plan: executedPlan,
        isVerified: executedPlan.state === 'COMPLETED',
      };
    }

    // Route: Single Action
    const singleAction = actions[0];

    // 5. AUTHORIZE: Evaluate policy and risk
    const policy = evaluateActionPolicy(singleAction);
    if (policy.requiresExplicitConfirmation && !singleAction.confirmed) {
      return {
        route: 'AWAITING_CONFIRMATION',
        spokenResponse: policy.confirmationPrompt || 'This action requires confirmation.',
        displayResponse: policy.confirmationPrompt || 'This action requires confirmation.',
        actions: [policy.redactedAction],
        isVerified: false,
      };
    }

    // 6. ACT, 7. OBSERVE & 8. VERIFY
    const actionResult = await mobileControlEngine.executeAction(singleAction);

    // 9. RESPOND & 10. LEARN
    const spoken = actionResult.observedResult;
    const isSuccess = actionResult.executionStatus === 'success';

    return {
      route: 'NATIVE_ANDROID_ACTION',
      spokenResponse: spoken,
      displayResponse: spoken,
      actions: [singleAction],
      executionResults: [actionResult],
      isVerified: actionResult.isVerified,
    };
  }
}

export const vajraIntelligenceOrchestrator = new VajraIntelligenceOrchestrator();
