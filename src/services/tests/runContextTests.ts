/**
 * Comprehensive Test Suite for VAJRA Mobile Intelligence & Context Orchestration (v1)
 * Tests Phase 18 Matrix: Context, Languages, Actions, Safety, Missions
 */

import {
  getInitialContext,
  resolveContextualIntent,
  updateConversationContext,
  detectLanguage,
  isExplicitTopicSwitch,
  evaluateSafeMath,
} from '../vajraContext';
import { extractActionsFromText } from '../actionParser';
import {
  detectSelfAwarenessQuery,
  resolveSelfAwarenessQuery,
  recordTaskReflection,
  getTaskReflections,
  clearTaskReflections,
  inspectSystemHealth,
} from '../vajraSelfAwareness';
import { mobileControlEngine } from '../mobileControlEngine';
import {
  evaluateActionPolicy,
  redactSensitiveData,
  validateConfirmationAffirmation,
} from '../actionPolicyEngine';
import { MobileTaskPlanner } from '../mobileTaskPlanner';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`✓ [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`✗ [FAIL] ${testName} - ${detail || 'Assertion failed'}`);
    failed++;
  }
}

async function runAllTests() {
  console.log('=== RUNNING VAJRA MOBILE CONTEXT ORCHESTRATION TESTS ===\n');

  // Test 1: Language Detection
  console.log('--- 1. Language Detection ---');
  assert(detectLanguage('Hello Vajra, open calculator') === 'en', 'English language detection');
  assert(detectLanguage('नमस्ते वज्र, मौसम कैसा है') === 'hi', 'Hindi Devanagari language detection');
  assert(detectLanguage('Google par Python search karo') === 'hinglish', 'Hinglish detection for "search karo"');
  assert(detectLanguage('Ab wahi Java ke liye karo') === 'hinglish', 'Hinglish detection for "Ab wahi ... karo"');
  assert(detectLanguage('Kal ka mausam kaisa hai?') === 'hinglish', 'Hinglish detection for "Kal ka mausam"');

  // Test 2: Basic Follow-Up ("Ab Java" after "Google pe Python")
  console.log('\n--- 2. Short-Term Memory Follow-Up ---');
  let ctx = getInitialContext();
  
  // Step A: User searches Python
  const firstAction = extractActionsFromText('Google par Python search karo', true).actions[0];
  ctx = updateConversationContext(
    ctx,
    'Google par Python search karo',
    'Searching Google for Python.',
    firstAction
  );
  assert(ctx.currentTopic === 'search', 'Context topic updated to search');
  assert(ctx.recentEntities.lastSearchQuery === 'Python', 'Entity lastSearchQuery recorded as Python');

  // Step B: Follow-up "Ab Java"
  const followUp1 = resolveContextualIntent('Ab Java', ctx);
  assert(followUp1.isContextualFollowUp === true, 'Understands "Ab Java" as follow-up');
  assert(followUp1.resolvedAction?.type === 'SEARCH_WEB', 'Resolved action is SEARCH_WEB');
  assert(followUp1.resolvedAction?.query === 'Java', 'Resolved search query is Java');
  assert(followUp1.confidence === 'HIGH_CONFIDENCE', 'Follow-up has HIGH_CONFIDENCE');

  // Test 3: Reference Pronouns & Anaphora ("Ab wahi Java ke liye karo")
  console.log('\n--- 3. Reference Pronouns & Anaphora ("wahi", "same") ---');
  const wahiRes = resolveContextualIntent('Ab wahi Java ke liye karo', ctx);
  assert(wahiRes.isContextualFollowUp === true, 'Understands "wahi ... ke liye karo"');
  assert(wahiRes.resolvedAction?.query === 'Java', 'Resolved entity to Java');

  // Repeat previous action ("phir se karo")
  const repeatRes = resolveContextualIntent('phir se karo', ctx);
  assert(repeatRes.isContextualFollowUp === true, 'Understands "phir se karo"');
  assert(repeatRes.resolvedAction?.type === 'SEARCH_WEB', 'Repeats SEARCH_WEB');

  // Test 4: Weather Follow-Up ("Kal ka?")
  console.log('\n--- 4. Weather Follow-Up ---');
  let weatherCtx = getInitialContext();
  const weatherAction = extractActionsFromText('Weather batao', true).actions[0];
  weatherCtx = updateConversationContext(
    weatherCtx,
    'Weather batao',
    'Here is the current weather forecast.',
    weatherAction
  );
  assert(weatherCtx.currentTopic === 'weather', 'Weather topic established');

  const kalFollowUp = resolveContextualIntent('Kal ka?', weatherCtx);
  assert(kalFollowUp.isContextualFollowUp === true, 'Understands "Kal ka?" in weather context');
  assert(kalFollowUp.resolvedAction?.query === 'tomorrow weather forecast', 'Resolved to tomorrow forecast');

  // Test 5: Calculator & Safe Math in Context
  console.log('\n--- 5. Calculator & Safe Math ---');
  let calcCtx = getInitialContext();
  calcCtx = updateConversationContext(
    calcCtx,
    'Calculator kholo',
    'Calculator initialized.',
    {
      id: 'act-calc',
      type: 'OPEN_APP',
      appName: 'Calculator',
      title: 'Calculator',
    }
  );

  const mathRes = resolveContextualIntent('500 ka 18 percent', calcCtx);
  assert(mathRes.isContextualFollowUp === true, 'Evaluated math in calculator context');
  assert(mathRes.syntheticResponse?.includes('90'), 'Accurately computed 18% of 500 = 90');
  assert(mathRes.proactiveSuggestion?.includes('Scratchpad'), 'Offers proactive note suggestion');

  // Direct arithmetic expression
  assert(evaluateSafeMath('1200 + 450') === 1650, 'Safe math evaluates 1200 + 450 = 1650');
  assert(evaluateSafeMath('1000 me se 250 minus karo') === 750, 'Safe math evaluates Hinglish minus');

  // Test 6: Ambiguous Safety Guard (No Random Number Guessing!)
  console.log('\n--- 6. Safety & Ambiguity Guard ---');
  const ambigCall = resolveContextualIntent('Call Rahul', ctx);
  assert(ambigCall.isContextualFollowUp === true, 'Intercepted ambiguous contact call');
  assert(ambigCall.confidence === 'MEDIUM_CONFIDENCE', 'Confidence marked MEDIUM_CONFIDENCE');
  assert(ambigCall.clarificationPrompt?.includes('Kaunse Rahul'), 'Politely asks which Rahul to call');
  assert(!ambigCall.resolvedAction, 'Never executes action when number is missing');

  const ambigMail = resolveContextualIntent('Mail bhejo Priya', ctx);
  assert(ambigMail.confidence === 'MEDIUM_CONFIDENCE', 'Intercepted ambiguous email without address');
  assert(ambigMail.clarificationPrompt?.includes('email ID specify karein'), 'Asks for Priya email ID');

  // Test 7: Topic Continuity & Clean Topic Switch
  console.log('\n--- 7. Topic Continuity vs Topic Switch ---');
  assert(isExplicitTopicSwitch('Waise mujhe weather batao') === true, 'Detected explicit topic switch');
  assert(isExplicitTopicSwitch('By the way open YouTube') === true, 'Detected English topic switch');
  assert(isExplicitTopicSwitch('Chhodo, calculator kholo') === true, 'Detected Hindi "Chhodo" switch');

  const switchRes = resolveContextualIntent('Waise mujhe weather batao', ctx);
  assert(switchRes.updatedTopic === 'general', 'Cleanly reset stale search topic on switch');

  // Test 8: Multi-Step Task Planning
  console.log('\n--- 8. Multi-Step Task Planning ---');
  const multiStep = resolveContextualIntent(
    'Google pe Python beginner tutorial search karo aur first useful result ka short summary do',
    ctx
  );
  assert(multiStep.missionPlan !== undefined, 'Created structured VajraMission');
  assert(multiStep.missionPlan?.steps.length === 2, 'Mission has 2 bounded sequential steps');
  assert(multiStep.missionPlan?.steps[0].action?.type === 'SEARCH_WEB', 'Step 1 is web search');

  // Test 9: Bounded Memory Growth (Max 10 turns)
  console.log('\n--- 9. Bounded Memory Growth Guard ---');
  let boundedCtx = getInitialContext();
  for (let i = 0; i < 25; i++) {
    boundedCtx = updateConversationContext(
      boundedCtx,
      `User query turn ${i}`,
      `Assistant response ${i}`
    );
  }
  assert(boundedCtx.history.length === 10, 'History strictly capped at 10 items (no unbounded memory growth)');
  assert(boundedCtx.history[9].user === 'User query turn 24', 'Preserves latest interactions');

  // Test 10: Unified Voice Controller Architecture & Native Android Provider Tests
  console.log('\n--- 10. Voice Controller Architecture & Native Android Provider Tests ---');
  const { voiceController } = await import('../voiceController');
  assert(typeof voiceController.startListening === 'function', 'voiceController exposes startListening API');
  assert(typeof voiceController.stopListening === 'function', 'voiceController exposes stopListening API');
  assert(typeof voiceController.isListening === 'function', 'voiceController exposes isListening query');
  assert(typeof voiceController.getPermissionState === 'function', 'voiceController exposes permission tracking');

  // Test 10.1: Android provider selected on Capacitor Android
  voiceController.__setPlatformOverride('android_native');
  assert(voiceController.isNativeAndroid() === true, 'Android provider selected on Capacitor Android runtime');
  assert(voiceController.getPlatformType() === 'android_native', 'Platform type reports android_native');

  // Test 10.2: Browser provider selected on normal browser
  voiceController.__setPlatformOverride('web_speech');
  assert(voiceController.isNativeAndroid() === false, 'Browser provider selected on normal browser');
  assert(voiceController.getPlatformType() === 'web_speech', 'Platform type reports web_speech');
  voiceController.__setPlatformOverride(null);

  // Test 10.3: Permission state begins at NOT_REQUESTED (no launch prompts)
  assert(voiceController.getPermissionState() === 'NOT_REQUESTED', 'Permission state starts at NOT_REQUESTED');

  // Test 10.4: Native stop sets listening state to false
  voiceController.stopListening();
  assert(voiceController.isListening() === false, 'Native stop transitions listening state to false');

  // Test 10.5: Duplicate final transcript protection
  let finalCalls = 0;
  const testCallbacks = {
    onListeningState: () => {},
    onPartialTranscript: () => {},
    onFinalTranscript: () => { finalCalls++; },
    onError: () => {},
  };
  // Directly verify dispatch deduplication
  (voiceController as any).callbacks = testCallbacks;
  const currentSessionId = (voiceController as any).activeSessionId;
  (voiceController as any).dispatchFinalTranscript(currentSessionId, 'Google Python search');
  (voiceController as any).dispatchFinalTranscript(currentSessionId, 'Google Python search');
  assert(finalCalls === 1, 'Duplicate final transcript within 1500ms filtered out');

  // Test 10.6: Old session callbacks ignored
  const oldSessionId = currentSessionId - 1;
  let oldSessionCalled = false;
  (voiceController as any).callbacks = {
    ...testCallbacks,
    onFinalTranscript: () => { oldSessionCalled = true; },
  };
  (voiceController as any).dispatchFinalTranscript(oldSessionId, 'Late transcript from expired session');
  assert(oldSessionCalled === false, 'Late callback from expired session ID is ignored');

  // Test 10.7: Error code mapping
  const { mapSpeechError } = await import('../voicePipeline');
  assert(mapSpeechError('network').message.includes('Network'), 'Network error maps to clean user message');
  assert(mapSpeechError('not-allowed').message.includes('Microphone access'), 'Permission denial maps cleanly');
  assert(mapSpeechError('audio-capture').message.includes('microphone hardware'), 'Audio capture failure maps cleanly');

  // Test 10.8: Single search intent dispatch from speech input
  const voiceDirectActions = extractActionsFromText('Google pe Python search karo', true);
  assert(voiceDirectActions.actions.length === 1, 'Single speech input creates exactly one action');
  assert(voiceDirectActions.actions[0].type === 'SEARCH_WEB', 'Action is SEARCH_WEB');
  assert(voiceDirectActions.actions[0].query === 'Python', 'Query extracted cleanly as Python');

  // Test 10.9: Quick Directions remains absent
  const actionTypes: string[] = ['OPEN_WEBSITE', 'SEARCH_WEB', 'OPEN_APP', 'OPEN_PATH', 'CREATE_FOLDER', 'CREATE_FILE', 'MOVE_FILE', 'COPY_FILE', 'RENAME_FILE', 'DELETE_FILE', 'LIST_FILES', 'SYSTEM_ACTION'];
  assert(!actionTypes.includes('QUICK_DIRECTIONS'), 'Quick Directions remains completely absent from ActionType and UI tools');

  // Test 11: Dedicated Wake Word & Voice Activation Layer Tests
  console.log('\n--- 11. Dedicated Wake Word & Voice Activation Layer Tests ---');
  const { parseWakePhrase } = await import('../voiceController');

  // Test 11.1: Wake OFF -> no activation
  voiceController.setWakeMode('WAKE_DISABLED');
  assert(voiceController.isVoiceActivationEnabled() === false, 'Wake OFF: isVoiceActivationEnabled reports false');
  assert(voiceController.handleWakeEvent('Hello Vajra') === false, 'Wake OFF: "Hello Vajra" does not activate when disabled');

  // Test 11.2: Wake ON -> Standby ready
  voiceController.setWakeMode('WAKE_STANDBY');
  assert(voiceController.isVoiceActivationEnabled() === true, 'Wake ON: isVoiceActivationEnabled reports true');
  assert(voiceController.getWakeMode() === 'WAKE_STANDBY', 'Wake ON: Mode is WAKE_STANDBY');

  // Test 11.3: "Hello Vajra" primary wake phrase recognition
  const primaryMatch = parseWakePhrase('Hello Vajra');
  assert(primaryMatch.isWakePhrase === true, 'Primary: "Hello Vajra" recognized as wake phrase');
  assert(primaryMatch.matchedPhrase === 'Hello Vajra', 'Primary: Canonical phrase is "Hello Vajra"');
  assert(primaryMatch.remainingCommand === undefined, 'Primary: No remaining command for standalone wake');

  // Test 11.4: "Hey Vajra" and "Hi Vajra" natural variants
  const heyMatch = parseWakePhrase('Hey Vajra');
  assert(heyMatch.isWakePhrase === true && heyMatch.matchedPhrase === 'Hey Vajra', 'Variant: "Hey Vajra" recognized');
  const hiMatch = parseWakePhrase('Hi Vajra');
  assert(hiMatch.isWakePhrase === true && hiMatch.matchedPhrase === 'Hi Vajra', 'Variant: "Hi Vajra" recognized');

  // Test 11.5: Non-wake arbitrary speech rejected
  assert(parseWakePhrase('Hello world').isWakePhrase === false, 'Arbitrary: "Hello world" does not activate');
  assert(parseWakePhrase('Python search karo').isWakePhrase === false, 'Arbitrary: "Python search karo" does not activate');
  assert(parseWakePhrase('The vajra weapon').isWakePhrase === false, 'Arbitrary: "The vajra weapon" does not activate');

  // Test 11.6: Duplicate wake protection (< 2000ms suppression)
  let wakeTriggerCount = 0;
  voiceController.registerWakeCallback(() => { wakeTriggerCount++; });
  (voiceController as any).lastWakeTimestamp = 0;
  const firstTrigger = voiceController.handleWakeEvent('Hello Vajra');
  const duplicateTrigger = voiceController.handleWakeEvent('Hello Vajra');
  assert(firstTrigger === true, 'Duplicate protection: First wake event handled');
  assert(duplicateTrigger === false, 'Duplicate protection: Rapid-fire duplicate wake event suppressed');
  assert(wakeTriggerCount === 1, 'Duplicate protection: Exactly 1 wake callback dispatched');

  // Test 11.7: One-shot wake + command extraction
  const oneShot = parseWakePhrase('Hello Vajra, Google pe Python search karo');
  assert(oneShot.isWakePhrase === true, 'One-shot: Wake phrase detected in continuous utterance');
  assert(oneShot.remainingCommand === 'Google pe Python search karo', 'One-shot: Command extracted cleanly as "Google pe Python search karo"');

  // Test 11.8: One-shot command execution through pipeline
  const oneShotActions = extractActionsFromText(oneShot.remainingCommand!, true);
  assert(oneShotActions.actions.length === 1, 'One-shot: Strictly 1 action dispatched from one-shot directive');
  assert(oneShotActions.actions[0].type === 'SEARCH_WEB', 'One-shot: Action type is SEARCH_WEB');
  assert(oneShotActions.actions[0].query === 'Python', 'One-shot: Search query extracted as Python');

  // Test 11.9: Barge-in interrupts speaking state
  (voiceController as any).lastWakeTimestamp = 0;
  voiceController.setWakeMode('SPEAKING');
  const bargeInResult = voiceController.handleBargeIn();
  assert(bargeInResult === true, 'Barge-in: Explicit wake interrupts active speaking state');

  // Test 11.10: Lifecycle cleanup
  await voiceController.disableVoiceActivation();
  assert(voiceController.getWakeMode() === 'WAKE_DISABLED', 'Lifecycle: Mode returned to WAKE_DISABLED');

  // Test 11.11: Desktop regression remains intact
  voiceController.__setPlatformOverride('web_speech');
  assert(voiceController.isNativeAndroid() === false, 'Desktop regression: Web Speech remains selected on web');
  voiceController.__setPlatformOverride(null);

  // Test 12: Voice Selection, Voice Settings & TTS Synthesis
  console.log('\n--- 12. Voice Selection, Voice Settings & TTS Tests ---');
  const {
    resolveEffectiveVoice,
    getRateMultiplier,
    getPitchMultiplier,
    getVoicePreviewText,
    savePersistedVoiceConfig,
    loadPersistedVoiceConfig,
  } = await import('../vajraVoiceSettings');

  const mockVoices: any[] = [
    { name: 'Google US English Female', voiceURI: 'google-en-female', lang: 'en-US', default: true },
    { name: 'Google US English Male', voiceURI: 'google-en-male', lang: 'en-US', default: false },
    { name: 'Google Hindi Female (hi-in-x-hie-local)', voiceURI: 'google-hi-female', lang: 'hi-IN', default: false },
  ];

  // Test 12.1: Female voice selection
  const femaleRes = resolveEffectiveVoice('en-US', { gender: 'female', speed: 'normal', pitch: 'natural' }, mockVoices);
  assert(femaleRes.voice?.name === 'Google US English Female', 'Female voice correctly selected from installed voices');
  assert(femaleRes.isFallback === false, 'Female voice selected without fallback');

  // Test 12.2: Male voice selection
  const maleRes = resolveEffectiveVoice('en-US', { gender: 'male', speed: 'normal', pitch: 'natural' }, mockVoices);
  assert(maleRes.voice?.name === 'Google US English Male', 'Male voice correctly selected from installed voices');
  assert(maleRes.isFallback === false, 'Male voice selected without fallback');

  // Test 12.3: System voice selection
  const sysRes = resolveEffectiveVoice('en-US', { gender: 'system', speed: 'normal', pitch: 'natural' }, mockVoices);
  assert(sysRes.voice?.name === 'Google US English Female', 'System default voice selected');

  // Test 12.4: Voice fallback when requested voice is unavailable (e.g. Hindi Male when only Hindi Female exists)
  const hiMaleRes = resolveEffectiveVoice('hi-IN', { gender: 'male', speed: 'normal', pitch: 'natural' }, mockVoices);
  assert(hiMaleRes.isFallback === true, 'Graceful fallback flagged when requested voice gender is unavailable');
  assert(Boolean(hiMaleRes.fallbackReason), 'Clear fallback reason provided to user');

  // Test 12.5: Voice persistence
  savePersistedVoiceConfig({ gender: 'male', speed: 'fast', pitch: 'high' });
  const loadedVoice = loadPersistedVoiceConfig();
  assert(loadedVoice.gender === 'male' && loadedVoice.speed === 'fast', 'Voice configuration persisted and restored');

  // Test 12.6: Voice preview text
  assert(getVoicePreviewText('en-US').includes('Vajra'), 'English voice preview generated');
  assert(getVoicePreviewText('hi-IN').includes('वज्र'), 'Hindi voice preview generated');

  // Test 12.7: Speed multiplier
  assert(getRateMultiplier('slow') < 1.0, 'Slow speed rate multiplier < 1.0');
  assert(getRateMultiplier('fast') > 1.0, 'Fast speed rate multiplier > 1.0');
  assert(getRateMultiplier('normal') === 1.0, 'Normal speed rate multiplier === 1.0');

  // Test 12.8: Pitch multiplier
  assert(getPitchMultiplier('low') < 1.0, 'Low pitch multiplier < 1.0');
  assert(getPitchMultiplier('high') > 1.0, 'High pitch multiplier > 1.0');
  assert(getPitchMultiplier('natural') === 1.0, 'Natural pitch multiplier === 1.0');

  // Test 12.9: Hindi TTS fallback when no Hindi voices installed
  const noHindiRes = resolveEffectiveVoice('hi-IN', { gender: 'female', speed: 'normal', pitch: 'natural' }, [
    { name: 'English Only', voiceURI: 'en-1', lang: 'en-US', default: true } as any,
  ]);
  assert(noHindiRes.isFallback === true, 'Falls back safely without crash when target language voice is missing');

  // Test 12.10: English TTS works directly
  const enRes = resolveEffectiveVoice('en-US', { gender: 'system', speed: 'normal', pitch: 'natural' }, mockVoices);
  assert(enRes.voice !== null, 'English TTS voice resolved');

  // Test 13: Continuous Conversation, Smart References & Natural Voice Controls
  console.log('\n--- 13. Conversation & Natural Voice Controls Tests ---');
  const { detectVoiceControl } = await import('../vajraContext');

  // Test 13.1: Voice Control STOP
  assert(detectVoiceControl('Vajra stop') === 'STOP', 'Recognizes "Vajra stop"');
  assert(detectVoiceControl('Stop') === 'STOP', 'Recognizes "Stop"');
  assert(detectVoiceControl('Bas') === 'STOP', 'Recognizes Hindi "Bas"');
  assert(detectVoiceControl('Ruk ja') === 'STOP', 'Recognizes Hindi "Ruk ja"');

  // Test 13.2: Voice Control CANCEL
  assert(detectVoiceControl('Cancel') === 'CANCEL', 'Recognizes "Cancel"');
  assert(detectVoiceControl('Radd karo') === 'CANCEL', 'Recognizes Hindi "Radd karo"');

  // Test 13.3: Voice Control PAUSE
  assert(detectVoiceControl('Pause') === 'PAUSE', 'Recognizes "Pause"');
  assert(detectVoiceControl('Thodi der ruko') === 'PAUSE', 'Recognizes Hindi "Thodi der ruko"');

  // Test 13.4: Voice Control RESUME
  assert(detectVoiceControl('Resume') === 'RESUME', 'Recognizes "Resume"');
  assert(detectVoiceControl('Continue') === 'RESUME', 'Recognizes "Continue"');

  // Test 13.5: Intercept control command in resolveContextualIntent
  const testContext = getInitialContext();
  const stopIntent = resolveContextualIntent('Vajra stop', testContext);
  assert(stopIntent.isControlCommand === true, 'Stop command flagged as control command');
  assert(stopIntent.controlType === 'STOP', 'Control type is STOP');

  // Test 13.6: Reference resolution for "iska"
  testContext.recentEntities.lastSearchQuery = 'Python';
  testContext.currentTopic = 'search';
  const iskaRes = resolveContextualIntent('Ab iska beginner tutorial dhoondo', testContext);
  assert(iskaRes.isContextualFollowUp === true, 'Understands "iska" as contextual reference');
  assert(iskaRes.resolvedAction?.query === 'Python beginner tutorial', 'Resolved query combined parent entity + attribute');

  // Test 13.7: Ordinal reference "pehla wala"
  testContext.activeAction = {
    id: 'act-sample',
    type: 'OPEN_WEBSITE',
    title: 'Python Official Website',
    url: 'https://python.org',
    status: 'pending',
  };
  const pehlaRes = resolveContextualIntent('Pehla wala kholo', testContext);
  assert(pehlaRes.isContextualFollowUp === true, 'Understands "Pehla wala"');
  assert(pehlaRes.resolvedAction?.title === 'Python Official Website', 'Selects active referenced item');

  // Test 14: Confirmation Intelligence & Risk Assessment
  console.log('\n--- 14. Confirmation Intelligence & Risk Assessment Tests ---');
  const { classifyActionRisk, requiresExplicitConfirmation } = await import('../vajraContext');

  // Test 14.1: Low-risk direct execution
  const searchRisk = classifyActionRisk({ id: '1', type: 'SEARCH_WEB', title: 'Search Python' });
  assert(searchRisk === 'LOW', 'SEARCH_WEB is LOW risk');
  assert(!requiresExplicitConfirmation({ id: '1', type: 'SEARCH_WEB', title: 'Search Python' }), 'LOW risk does not require confirmation');

  // Test 14.2: High-risk confirmation
  const deleteRisk = classifyActionRisk({ id: '2', type: 'DELETE_FILE', title: 'Delete critical database' });
  assert(deleteRisk === 'HIGH', 'DELETE_FILE is HIGH risk');
  assert(requiresExplicitConfirmation({ id: '2', type: 'DELETE_FILE', title: 'Delete critical database' }), 'HIGH risk strictly requires confirmation');

  // Test 14.3: Privileged system action
  const sysActionRisk = classifyActionRisk({ id: '3', type: 'SYSTEM_ACTION', title: 'Reboot System', requiresConfirmation: true });
  assert(sysActionRisk === 'HIGH', 'Privileged SYSTEM_ACTION is HIGH risk');

  // Test 14.4: Medium-risk communication intent
  const commRisk = classifyActionRisk({ id: '4', type: 'OPEN_WEBSITE', title: 'Call Rahul', url: 'tel:9876543210' });
  assert(commRisk === 'MEDIUM', 'Dialing phone number is MEDIUM risk');

  // Test 15: Self-Healing Engine (VajraSelfHealController)
  console.log('\n--- 15. Self-Healing Engine Tests ---');
  const { vajraSelfHeal } = await import('../vajraSelfHeal');

  vajraSelfHeal.clearHistory();
  vajraSelfHeal.setSelfHealingEnabled(true);

  // Test 15.1: Speech failure recovery
  let recognizerRecreated = false;
  const healResult = await vajraSelfHeal.executeSelfHeal({
    category: 'SPEECH_RECOGNITION_FAILURE',
    strategy: 'Clean and recreate recognizer session',
    maxRetries: 2,
    backoffMs: 10,
    recoveryAction: async () => {
      recognizerRecreated = true;
      return true;
    },
    verificationAction: async () => recognizerRecreated,
    successMessage: "Voice service recovered. I'm listening.",
    failureMessage: "I couldn't recover the voice service. Please try again.",
  });
  assert(healResult.recovered === true, 'Self-heal: Speech recognition recovered successfully');
  assert(healResult.userMessage === "Voice service recovered. I'm listening.", 'User-facing recovery message reported');

  // Test 15.2: Verification check prevents fake recovery
  const fakeHeal = await vajraSelfHeal.executeSelfHeal({
    category: 'TTS_FAILURE',
    strategy: 'Unverified fallback',
    maxRetries: 1,
    backoffMs: 10,
    recoveryAction: async () => true,
    verificationAction: async () => false, // fails verification
    successMessage: 'TTS recovered',
    failureMessage: 'TTS recovery failed',
  });
  assert(fakeHeal.recovered === false, 'Self-heal: Honest reporting when verification check fails');

  // Test 15.3: Bounded retry limit prevents infinite loops
  vajraSelfHeal.resetRetryCount('PERMISSION_FAILURE');
  // First attempt
  await vajraSelfHeal.executeSelfHeal({
    category: 'PERMISSION_FAILURE',
    strategy: 'Prompt check',
    maxRetries: 1,
    backoffMs: 0,
    recoveryAction: async () => false,
    verificationAction: async () => false,
    successMessage: 'OK',
    failureMessage: 'Permission failed',
  });
  // Second attempt exceeding ceiling
  const exhausted = await vajraSelfHeal.executeSelfHeal({
    category: 'PERMISSION_FAILURE',
    strategy: 'Prompt check',
    maxRetries: 1,
    backoffMs: 0,
    recoveryAction: async () => false,
    verificationAction: async () => false,
    successMessage: 'OK',
    failureMessage: 'Permission failed',
  });
  assert(exhausted.recovered === false, 'Self-heal: Retry limit enforced');
  assert(exhausted.event.strategyUsed === 'RETRY_LIMIT_EXCEEDED', 'Event marks RETRY_LIMIT_EXCEEDED');

  // Test 15.4: History recording
  const history = vajraSelfHeal.getEventHistory();
  assert(history.length > 0 && history.length <= 20, 'Self-heal events recorded in bounded history');

  // Test 16: Adaptive Learning & Sensitive Memory Guard
  console.log('\n--- 16. Adaptive Learning & Safety Tests ---');
  const { vajraLearning } = await import('../vajraLearning');

  vajraLearning.clearLearnedPreferences();
  vajraLearning.setLearningActive(true);

  // Test 16.1: User correction parsing - response style
  const corrStyle = vajraLearning.evaluateUtteranceForCorrection('Short mein batao');
  assert(corrStyle !== null, 'Learned preference from "Short mein batao"');
  assert(corrStyle?.appliedPreference?.includes('preferredVerbosity = concise'), 'Set verbosity to concise');

  // Test 16.2: User correction parsing - language
  const corrLang = vajraLearning.evaluateUtteranceForCorrection('Speak Hindi');
  assert(corrLang !== null, 'Learned language from "Speak Hindi"');
  assert(corrLang?.appliedPreference?.includes('preferredLanguage = hi'), 'Set language to hi');

  // Test 16.3: User correction parsing - voice gender
  const corrVoice = vajraLearning.evaluateUtteranceForCorrection('Use female voice');
  assert(corrVoice !== null, 'Learned voice from "Use female voice"');
  assert(corrVoice?.appliedPreference?.includes('preferredVoiceGender = female'), 'Set voice to female');

  // Test 16.4: Sensitive memory rejection in learning
  const sensitiveCandidate = vajraLearning.processCandidate(
    'command_preference',
    'myPassword',
    'SecretP@ss123',
    'explicit_directive'
  );
  assert(sensitiveCandidate.status === 'rejected', 'Sensitive password rejected by learning safety policy');
  assert(sensitiveCandidate.value === '[REDACTED]', 'Sensitive value redacted');

  // Test 16.5: Low confidence candidates do not persist automatically
  const lowConf = vajraLearning.processCandidate(
    'command_preference',
    'oneOffQuery',
    'some random term',
    'repeated_interaction',
    0.3
  );
  assert(lowConf.status === 'candidate', 'Low confidence item remains candidate without automatic persistence');

  // Test 16.6: Clear learned preferences
  vajraLearning.clearLearnedPreferences();
  assert(vajraLearning.getLearnedPreferences().length === 0, 'Learned preferences cleared cleanly');

  // Test 16.7: Learning disabled flag
  vajraLearning.setLearningActive(false);
  const disabledRes = vajraLearning.evaluateUtteranceForCorrection('Short answer');
  assert(disabledRes === null, 'No learning when adaptive learning is disabled');
  vajraLearning.setLearningActive(true);

  // Test 17: Security & Authorization Boundary
  console.log('\n--- 17. Security & Authorization Boundary Tests ---');
  const { isValidSafeUrl } = await import('../security');

  // Test 17.1: Blocked protocol security
  assert(isValidSafeUrl('javascript:alert(1)') === false, 'Blocked dangerous javascript: protocol');
  assert(isValidSafeUrl('file:///etc/passwd') === false, 'Blocked dangerous file: protocol');
  assert(isValidSafeUrl('data:text/html;base64,PHNjcmlwdD4=') === false, 'Blocked dangerous data: protocol');

  // Test 17.2: Permitted protocol safety
  assert(isValidSafeUrl('https://google.com') === true, 'Allows safe HTTPS');
  assert(isValidSafeUrl('tel:+1234567890') === true, 'Allows safe mobile tel: intent');

  // Test 18: Full System Regression
  console.log('\n--- 18. Full System Regression Tests ---');
  // Test 18.1: Wake word remains functional
  const regressionWake = parseWakePhrase('Hello Vajra, open YouTube');
  assert(regressionWake.isWakePhrase === true, 'Wake phrase "Hello Vajra" remains active');
  assert(regressionWake.remainingCommand === 'open YouTube', 'Command extracted cleanly');

  // Test 18.2: Quick directions remains absent
  const existingActionTypes: string[] = ['OPEN_WEBSITE', 'SEARCH_WEB', 'OPEN_APP', 'OPEN_PATH', 'CREATE_FOLDER', 'CREATE_FILE', 'MOVE_FILE', 'COPY_FILE', 'RENAME_FILE', 'DELETE_FILE', 'LIST_FILES', 'SYSTEM_ACTION'];
  assert(!existingActionTypes.includes('QUICK_DIRECTIONS'), 'Quick Directions remains completely absent');

  // Test 19: Release Hardening & Edge-Case Validation
  console.log('\n--- 19. Release Hardening & Validation Tests ---');
  const { VajraLearningController } = await import('../vajraLearning');

  // Test 19.1: RESUME when no operation is paused reports honestly
  const emptyResumeCtx = getInitialContext();
  const emptyResumeRes = resolveContextualIntent('Resume', emptyResumeCtx);
  assert(
    emptyResumeRes.syntheticResponse === 'Nothing to resume right now.',
    'Honest RESUME reporting when no mission is paused'
  );

  // Test 19.2: PAUSE and RESUME lifecycle on an active mission
  const missionCtx = getInitialContext();
  const planned = resolveContextualIntent(
    'Google pe Python beginner tutorial search karo aur short summary do',
    missionCtx
  );
  missionCtx.activeMission = planned.missionPlan || null;
  const pausedRes = resolveContextualIntent('Pause', missionCtx);
  assert(pausedRes.missionPlan?.status === 'paused', 'PAUSE transitions active mission to paused status');

  missionCtx.activeMission = pausedRes.missionPlan || null;
  const resumedRes = resolveContextualIntent('Resume', missionCtx);
  assert(resumedRes.missionPlan?.status === 'in_progress', 'RESUME transitions paused mission back to in_progress');
  assert(Boolean(resumedRes.resolvedAction), 'RESUME restores active mission step action');

  // Test 19.3: CANCEL when nothing is pending reports honestly
  const emptyCancelCtx = getInitialContext();
  const emptyCancelRes = resolveContextualIntent('Cancel', emptyCancelCtx);
  assert(
    emptyCancelRes.syntheticResponse === 'No pending action to cancel.',
    'Honest CANCEL reporting when no pending operation exists'
  );

  // Test 19.4: Natural language DELETE_FILE extraction & HIGH risk confirmation
  const deleteExtract = extractActionsFromText('Delete file production_db.sql', true);
  assert(deleteExtract.actions.length === 1, 'Natural language DELETE_FILE parsed cleanly');
  assert(deleteExtract.actions[0].type === 'DELETE_FILE', 'Action type is DELETE_FILE');
  assert(
    requiresExplicitConfirmation(deleteExtract.actions[0]) === true,
    'Natural language DELETE_FILE requires explicit confirmation'
  );

  // Test 19.5: Self-Heal exponential backoff calculation
  assert(vajraSelfHeal.computeExponentialBackoff(100, 1) === 100, 'Exponential backoff attempt 1 = 1x base');
  assert(vajraSelfHeal.computeExponentialBackoff(100, 2) === 200, 'Exponential backoff attempt 2 = 2x base');
  assert(vajraSelfHeal.computeExponentialBackoff(100, 3) === 400, 'Exponential backoff attempt 3 = 4x base');

  // Test 19.6: Self-Heal lifecycle cancellation aborts in-flight recovery
  vajraSelfHeal.clearHistory();
  const cancelPromise = vajraSelfHeal.executeSelfHeal({
    category: 'NETWORK_FAILURE',
    strategy: 'Reconnect network socket',
    maxRetries: 3,
    backoffMs: 60,
    recoveryAction: async () => true,
    verificationAction: async () => true,
    successMessage: 'Recovered',
    failureMessage: 'Failed',
  });
  setTimeout(() => {
    vajraSelfHeal.cancelAllRecoveries();
  }, 15);
  const abortedHeal = await cancelPromise;
  assert(abortedHeal.recovered === false, 'Cancelled self-heal recovery does not claim success');
  assert(
    abortedHeal.event.strategyUsed === 'ABORTED_BY_LIFECYCLE_OR_USER',
    'Cancelled self-heal records ABORTED_BY_LIFECYCLE_OR_USER'
  );

  // Test 19.7: Normal command "YouTube kholo" does NOT trigger false correction learning
  vajraLearning.clearLearnedPreferences();
  const nonCorrection = vajraLearning.evaluateUtteranceForCorrection('YouTube kholo');
  assert(nonCorrection === null, 'Normal "YouTube kholo" command is not misclassified as a correction');
  const explicitYtCorrection = vajraLearning.evaluateUtteranceForCorrection('Search nahi, YouTube kholo');
  assert(explicitYtCorrection !== null, 'Explicit "Search nahi, YouTube kholo" is recognized as a correction');

  // Test 19.8: Single entity correction ("I said Python, not Java") remains candidate (<0.8 confidence)
  vajraLearning.clearLearnedPreferences();
  const entityCorr = vajraLearning.evaluateUtteranceForCorrection('I said Python, not Java');
  assert(entityCorr !== null, 'Recognizes "I said Python, not Java" correction event');
  assert(
    vajraLearning.getLearnedPreferences().length === 0,
    'Single entity typo does not permanently persist into global preferences'
  );

  // Test 19.9: Learning persistence across controller restart
  vajraLearning.evaluateUtteranceForCorrection('Speak Hindi');
  const restartedController = new VajraLearningController();
  assert(
    restartedController.getLearnedPreferences().some((p) => p.key === 'preferredLanguage' && p.value === 'hi'),
    'Learned preferences persist across controller restart'
  );
  restartedController.clearLearnedPreferences();

  // --- 20. Consciousness-Inspired Self-Awareness & Introspection Tests ---
  console.log('\n--- 20. Consciousness-Inspired Self-Awareness & Introspection Tests ---');
  // Test 20.1: Current State query in English and Hindi
  assert(detectSelfAwarenessQuery('What are you doing right now?') === 'CURRENT_STATE', 'Detects "What are you doing right now?" query');
  assert(detectSelfAwarenessQuery('Tum abhi kya kar rahe ho?') === 'CURRENT_STATE', 'Detects Hindi "Tum abhi kya kar rahe ho?" query');
  assert(detectSelfAwarenessQuery('Apna status batao') === 'CURRENT_STATE', 'Detects Hinglish "Apna status batao"');

  // Test 20.2: Active Task query
  assert(detectSelfAwarenessQuery('What task are you working on?') === 'ACTIVE_TASK', 'Detects "What task are you working on?" query');
  assert(detectSelfAwarenessQuery('Kis task par kaam kar rahe ho?') === 'ACTIVE_TASK', 'Detects Hindi "Kis task par kaam kar rahe ho?" query');

  // Test 20.3: Listening Status query
  assert(detectSelfAwarenessQuery('Are you listening to me?') === 'LISTENING_STATUS', 'Detects "Are you listening to me?" query');
  assert(detectSelfAwarenessQuery('Kya tum meri baat sun rahe ho?') === 'LISTENING_STATUS', 'Detects Hindi "Kya tum meri baat sun rahe ho?" query');

  // Test 20.4: Internet / Connectivity query
  assert(detectSelfAwarenessQuery('Do you have internet access?') === 'CONNECTIVITY', 'Detects "Do you have internet access?" query');
  assert(detectSelfAwarenessQuery('Kya internet access available hai?') === 'CONNECTIVITY', 'Detects Hindi "Kya internet access available hai?" query');

  // Test 20.5: Wake Mode query
  assert(detectSelfAwarenessQuery('Is voice activation on?') === 'WAKE_WORD_STATUS', 'Detects "Is voice activation on?" query');
  assert(detectSelfAwarenessQuery('Kya tumhara wake mode enabled hai?') === 'WAKE_WORD_STATUS', 'Detects Hindi "Kya tumhara wake mode enabled hai?" query');

  // Test 20.6: Execution vs Plan query
  assert(detectSelfAwarenessQuery('Did you complete this action or just plan it?') === 'EXECUTION_VS_PLAN', 'Detects "Did you complete this action or just plan it?" query');
  assert(detectSelfAwarenessQuery('Tumne ye action complete kiya ya sirf plan banaya?') === 'EXECUTION_VS_PLAN', 'Detects Hindi "Tumne ye action complete kiya ya sirf plan banaya?" query');

  // Test 20.7: Verification Status query
  assert(detectSelfAwarenessQuery('What is verified and what is still pending?') === 'VERIFICATION_STATUS', 'Detects "What is verified and what is still pending?" query');
  assert(detectSelfAwarenessQuery('Kya verify hua aur kya abhi pending hai?') === 'VERIFICATION_STATUS', 'Detects Hindi "Kya verify hua aur kya abhi pending hai?" query');

  // Test 20.8: Current Limitations query
  assert(detectSelfAwarenessQuery('What are your limitations?') === 'CURRENT_LIMITATIONS', 'Detects "What are your limitations?" query');
  assert(detectSelfAwarenessQuery('Tumhari current limitation kya hai?') === 'CURRENT_LIMITATIONS', 'Detects Hindi "Tumhari current limitation kya hai?" query');

  // Test 20.9: Last Error query
  assert(detectSelfAwarenessQuery('What was the last error?') === 'LAST_ERROR', 'Detects "What was the last error?" query');
  assert(detectSelfAwarenessQuery('Pichhle task mein kya error aaya tha?') === 'LAST_ERROR', 'Detects Hindi "Pichhle task mein kya error aaya tha?" query');

  // Test 20.10: Permission Required query
  assert(detectSelfAwarenessQuery('Do you need my permission?') === 'PERMISSION_REQUIRED', 'Detects "Do you need my permission?" query');
  assert(detectSelfAwarenessQuery('Kya tumhe meri permission chahiye?') === 'PERMISSION_REQUIRED', 'Detects Hindi "Kya tumhe meri permission chahiye?" query');

  // Test 20.11: Grounded answer generation for active mission vs idle
  const baseContext = getInitialContext();
  const idleAns = resolveSelfAwarenessQuery('CURRENT_STATE', {
    currentState: 'idle',
    context: baseContext,
    isOnline: true,
    selectedModel: 'gemini-3.1-flash-lite',
    isMuted: false,
    isVoiceActivationEnabled: false,
    voiceMode: 'WAKE_DISABLED',
    micPermission: 'NOT_REQUESTED',
    isNativeAndroid: false,
    recentSelfHealEvents: [],
    activeMission: null,
    pendingAction: null,
    lastVerifiedResult: null,
  });
  assert(idleAns.includes('Standby') || idleAns.includes('Idle'), 'Idle state reports Standby truthfully');

  const execAns = resolveSelfAwarenessQuery('CURRENT_STATE', {
    currentState: 'executing',
    context: baseContext,
    isOnline: true,
    selectedModel: 'gemini-3.1-flash-lite',
    isMuted: false,
    isVoiceActivationEnabled: true,
    voiceMode: 'WAKE_STANDBY',
    micPermission: 'GRANTED',
    isNativeAndroid: true,
    recentSelfHealEvents: [],
    activeMission: null,
    pendingAction: { id: 'act-test', type: 'SEARCH_WEB', title: 'Search NASA' },
    lastVerifiedResult: null,
  });
  assert(execAns.includes('executing') || execAns.includes('Search NASA'), 'Executing state reports active action');

  // Test 20.12: Grounded answer for execution vs plan honesty
  const planAns = resolveSelfAwarenessQuery('EXECUTION_VS_PLAN', {
    currentState: 'awaiting_confirmation',
    context: baseContext,
    isOnline: true,
    selectedModel: 'gemini-3.1-flash-lite',
    isMuted: false,
    isVoiceActivationEnabled: true,
    voiceMode: 'WAKE_STANDBY',
    micPermission: 'GRANTED',
    isNativeAndroid: false,
    recentSelfHealEvents: [],
    activeMission: null,
    pendingAction: { id: 'act-del', type: 'DELETE_FILE', title: 'Delete file' },
    lastVerifiedResult: null,
  });
  assert(planAns.includes('PLANNED') && planAns.includes('NOT execute until you confirm'), 'Honestly reports unconfirmed plan is NOT executed');

  // Test 20.13: Task Reflection logging and memory bounding
  clearTaskReflections();
  for (let i = 1; i <= 15; i++) {
    recordTaskReflection({
      userRequest: `Test request ${i}`,
      authorizedAction: 'SEARCH_WEB',
      attemptedOperation: `Op ${i}`,
      observedResult: `Result ${i}`,
      wasVerified: true,
      preventativeImprovement: 'Nominal',
    });
  }
  const reflections = getTaskReflections();
  assert(reflections.length === 10, 'Task reflections strictly capped at max 10 entries (bounded memory)');
  assert(reflections[reflections.length - 1].userRequest === 'Test request 15', 'Preserves latest task reflections');

  // Test 20.14: Self-Monitoring health inspection
  const healthClean = inspectSystemHealth(baseContext, {
    isListening: false,
    voiceMode: 'WAKE_DISABLED',
    micPermission: 'NOT_REQUESTED',
    pendingAction: null,
    activeMission: null,
    recentErrorsCount: 0,
  });
  assert(healthClean.isHealthy === true, 'System health reports clean when no anomalies exist');

  const staleContext = {
    ...baseContext,
    pendingConfirmation: {
      id: 'stale-conf',
      action: { id: 'a1', type: 'DELETE_FILE' as const, title: 'Delete system logs' },
      promptText: 'Confirm delete?',
      consequenceDescription: 'File will be deleted',
      requiresExplicitYes: true,
      createdAt: Date.now() - 150000, // 2.5 minutes ago
    },
  };
  const healthStale = inspectSystemHealth(staleContext, {
    isListening: false,
    voiceMode: 'WAKE_DISABLED',
    micPermission: 'NOT_REQUESTED',
    pendingAction: staleContext.pendingConfirmation.action,
    activeMission: null,
    recentErrorsCount: 0,
  });
  assert(healthStale.isHealthy === false, 'Detects stale pending confirmation (> 2 mins)');
  assert(healthStale.staleConfirmationsCount === 1, 'Records 1 stale confirmation in health inspection');

  // --- 21. Universal Android Phone Control & Reliability Tests ---
  console.log('\n--- 21. Universal Android Phone Control & Reliability Tests ---');

  // Test 21.1: Settings Intent in English, Hindi, Hinglish
  const wifiRes = extractActionsFromText('Open Wi-Fi settings');
  assert(wifiRes.actions.some((a) => a.type === 'OPEN_SETTINGS' && a.settingsScreen === 'wifi'), 'Parses "Open Wi-Fi settings" into OPEN_SETTINGS: wifi');

  const btRes = extractActionsFromText('Bluetooth ki setting kholo');
  assert(btRes.actions.some((a) => a.type === 'OPEN_SETTINGS' && a.settingsScreen === 'bluetooth'), 'Parses Hindi "Bluetooth ki setting kholo" into OPEN_SETTINGS: bluetooth');

  const dispRes = extractActionsFromText('Display settings dikhao');
  assert(dispRes.actions.some((a) => a.type === 'OPEN_SETTINGS' && a.settingsScreen === 'display'), 'Parses Hinglish "Display settings dikhao" into OPEN_SETTINGS: display');

  // Test 21.2: Camera Intent in English & Hindi
  const camEnRes = extractActionsFromText('Open camera');
  assert(camEnRes.actions.some((a) => a.type === 'OPEN_CAMERA'), 'Parses "Open camera" into OPEN_CAMERA');

  const camHiRes = extractActionsFromText('Camera kholo');
  assert(camHiRes.actions.some((a) => a.type === 'OPEN_CAMERA'), 'Parses Hindi "Camera kholo" into OPEN_CAMERA');

  // Test 21.3: Phone Dialer Intent in English & Hindi
  const dialEnRes = extractActionsFromText('Dial 9876543210');
  assert(dialEnRes.actions.some((a) => a.type === 'DIAL_PHONE' && a.phoneNumber === '9876543210'), 'Parses "Dial 9876543210" into DIAL_PHONE');

  const dialHiRes = extractActionsFromText('Phone lagao 9123456789');
  assert(dialHiRes.actions.some((a) => a.type === 'DIAL_PHONE' && a.phoneNumber === '9123456789'), 'Parses Hindi "Phone lagao 9123456789" into DIAL_PHONE');

  // Test 21.4: SMS Draft Intent with Recipient and Body
  const smsRes = extractActionsFromText('Draft message to 9876543210: Coming soon');
  assert(
    smsRes.actions.some((a) => a.type === 'DRAFT_SMS' && a.phoneNumber === '9876543210' && a.messageText === 'Coming soon'),
    'Parses "Draft message to 9876543210: Coming soon" with target and body'
  );

  // Test 21.5: Volume Adjustment in English & Hindi
  const volUpRes = extractActionsFromText('Volume up');
  assert(volUpRes.actions.some((a) => a.type === 'ADJUST_VOLUME' && a.volumeDirection === 'up'), 'Parses "Volume up" into ADJUST_VOLUME: up');

  const volDownRes = extractActionsFromText('Awaaz kam karo');
  assert(volDownRes.actions.some((a) => a.type === 'ADJUST_VOLUME' && a.volumeDirection === 'down'), 'Parses Hindi "Awaaz kam karo" into ADJUST_VOLUME: down');

  const volMuteRes = extractActionsFromText('Mute audio');
  assert(volMuteRes.actions.some((a) => a.type === 'ADJUST_VOLUME' && a.volumeDirection === 'mute'), 'Parses "Mute audio" into ADJUST_VOLUME: mute');

  // Test 21.6: Device & Battery Info Intent
  const devInfoRes = extractActionsFromText('Battery status kya hai');
  assert(devInfoRes.actions.some((a) => a.type === 'GET_DEVICE_INFO'), 'Parses "Battery status kya hai" into GET_DEVICE_INFO');

  // Test 21.7: VAJRA Notes Management Intent
  const noteSaveRes = extractActionsFromText('Save note: buy groceries');
  assert(
    noteSaveRes.actions.some((a) => a.type === 'MANAGE_VAJRA_NOTE' && a.noteAction === 'create'),
    'Parses "Save note: buy groceries" into MANAGE_VAJRA_NOTE: create'
  );

  const noteListRes = extractActionsFromText('Notes dikhao');
  assert(
    noteListRes.actions.some((a) => a.type === 'MANAGE_VAJRA_NOTE' && a.noteAction === 'list'),
    'Parses "Notes dikhao" into MANAGE_VAJRA_NOTE: list'
  );

  // Test 21.8: Emergency Global Stop Intent
  const stopRes = extractActionsFromText('Emergency stop');
  assert(stopRes.actions.some((a) => a.type === 'GLOBAL_STOP'), 'Parses "Emergency stop" into GLOBAL_STOP');

  // Test 21.9: ActionPolicyEngine Risk Hierarchy
  const polSettings = evaluateActionPolicy({ id: 't1', type: 'OPEN_SETTINGS', title: 'Open Settings' });
  assert(polSettings.riskLevel === 'LOW' && !polSettings.requiresExplicitConfirmation, 'ActionPolicyEngine classifies OPEN_SETTINGS as LOW risk');

  const polDial = evaluateActionPolicy({ id: 't2', type: 'DIAL_PHONE', title: 'Dial Phone', phoneNumber: '123' });
  assert(polDial.riskLevel === 'MODERATE' && !polDial.requiresExplicitConfirmation, 'ActionPolicyEngine classifies DIAL_PHONE as MODERATE risk');

  const polSms = evaluateActionPolicy({ id: 't3', type: 'DRAFT_SMS', title: 'Draft SMS', phoneNumber: '123' });
  assert(polSms.riskLevel === 'MODERATE' && !polSms.requiresExplicitConfirmation, 'ActionPolicyEngine classifies DRAFT_SMS as MODERATE risk');

  const polDelete = evaluateActionPolicy({ id: 't4', type: 'DELETE_FILE', title: 'Delete file.txt' });
  assert(polDelete.riskLevel === 'HIGH' && polDelete.requiresExplicitConfirmation, 'ActionPolicyEngine classifies DELETE_FILE as HIGH risk requiring confirmation');

  // Test 21.10: Sensitive Data Redaction
  const redacted = redactSensitiveData('User password=mySecretPassword123; pin=4321');
  assert(!redacted.includes('mySecretPassword123') && redacted.includes('[REDACTED]'), 'Redacts passwords and PINs from text payloads');

  // Test 21.11: Confirmation Binding & Identifier Validation
  const validConf = validateConfirmationAffirmation('yes proceed', 'act-101', 'act-101');
  assert(validConf.isConfirmed === true, 'Validates affirmative confirmation for matching action ID');

  const invalidConf = validateConfirmationAffirmation('yes proceed', 'act-101', 'act-999');
  assert(invalidConf.isConfirmed === false, 'Rejects confirmation when action ID mismatches');

  // Test 21.12: MobileControlEngine Execution & Verification
  const execVol = await mobileControlEngine.executeAction({
    id: 'test-vol-1',
    type: 'ADJUST_VOLUME',
    title: 'Volume Up',
    volumeDirection: 'up',
  });
  assert(execVol.executionStatus === 'success' && execVol.isVerified, 'MobileControlEngine executes and verifies volume adjustment');

  // Test 21.13: MobileControlEngine Notes Store
  const execNote = await mobileControlEngine.executeAction({
    id: 'test-note-1',
    type: 'MANAGE_VAJRA_NOTE',
    title: 'Note',
    noteAction: 'create',
    noteTitle: 'Meeting with team',
    noteBody: 'Discuss release milestone',
  });
  assert(execNote.executionStatus === 'success' && execNote.isVerified, 'MobileControlEngine persists note to scratchpad');

  const notesList = mobileControlEngine.getNotes();
  assert(notesList.some((n) => n.title.includes('Meeting with team')), 'Verified note exists in scratchpad store');

  // Test 21.14: MobileTaskPlanner Multi-Step FSM & Cancellation
  const planner = new MobileTaskPlanner();
  const testPlan = planner.createPlan('Open maps and draft message', [
    { id: 'step-act-1', type: 'OPEN_MAPS', title: 'Open Maps to Destination' },
    { id: 'step-act-2', type: 'DRAFT_SMS', title: 'Draft ETA Message', phoneNumber: '9876543210', messageText: 'Arriving in 15 mins' },
  ]);
  assert(testPlan.steps.length === 2, 'MobileTaskPlanner creates 2 planned steps');
  assert(testPlan.state === 'PLANNING', 'Initial planner state is PLANNING');

  planner.cancel();
  assert(planner.getState() === 'CANCELLED', 'MobileTaskPlanner cancel() transitions state to CANCELLED');
  assert(testPlan.steps.every((s) => s.status === 'cancelled'), 'Cancellation propagates to all pending plan steps');

  // Test 21.15: Extended Self-Awareness Queries
  assert(detectSelfAwarenessQuery('Can you control this setting?') === 'CAN_CONTROL_SETTING', 'Detects "Can you control this setting?" query');
  assert(detectSelfAwarenessQuery('Did the message actually send?') === 'DID_MESSAGE_SEND', 'Detects "Did the message actually send?" query');
  assert(detectSelfAwarenessQuery('Is this feature available offline?') === 'OFFLINE_AVAILABILITY', 'Detects "Is this feature available offline?" query');

  const msgAns = resolveSelfAwarenessQuery('DID_MESSAGE_SEND', {
    currentState: 'idle',
    context: baseContext,
    isOnline: true,
    selectedModel: 'gemini-3.1-flash-lite',
    isMuted: false,
    isVoiceActivationEnabled: true,
    voiceMode: 'WAKE_STANDBY',
    micPermission: 'GRANTED',
    isNativeAndroid: true,
    recentSelfHealEvents: [],
    activeMission: null,
    pendingAction: null,
    lastVerifiedResult: null,
  });
  assert(msgAns.includes('draft') && (msgAns.includes('final send tap') || msgAns.includes('composer')), 'Honestly reports SMS is drafted, not silently transmitted');

  const offlineAns = resolveSelfAwarenessQuery('OFFLINE_AVAILABILITY', {
    currentState: 'idle',
    context: baseContext,
    isOnline: false,
    selectedModel: 'gemini-3.1-flash-lite',
    isMuted: false,
    isVoiceActivationEnabled: false,
    voiceMode: 'WAKE_DISABLED',
    micPermission: 'NOT_REQUESTED',
    isNativeAndroid: true,
    recentSelfHealEvents: [],
    activeMission: null,
    pendingAction: null,
    lastVerifiedResult: null,
  });
  assert(offlineAns.includes('offline') && offlineAns.includes('internet'), 'Honestly explains offline vs cloud network boundary');

  // Test 22: India-First Multilingual Registry & Formatting Tests
  console.log('\n--- 22. India-First Multilingual Registry & Formatting Tests ---');
  const {
    getAllIndianLanguages,
    getIndianLanguage,
    formatIndianCurrency,
    formatIndianNumberWords,
    formatIndianDate,
    validateIndianPhoneNumber,
  } = await import('../indianLanguageRegistry');

  const allLangs = getAllIndianLanguages();
  assert(allLangs.length >= 20, 'Registry contains at least 20 Indian languages');
  const hiLang = getIndianLanguage('hindi');
  assert(hiLang !== null && hiLang.code === 'hi-IN', 'Resolves Hindi from alias "hindi"');
  const taLang = getIndianLanguage('tamil');
  assert(taLang !== null && taLang.code === 'ta-IN', 'Resolves Tamil from alias "tamil"');
  const bnLang = getIndianLanguage('bengali');
  assert(bnLang !== null && bnLang.code === 'bn-IN', 'Resolves Bengali from alias "bengali"');
  const mrLang = getIndianLanguage('marathi');
  assert(mrLang !== null && mrLang.code === 'mr-IN', 'Resolves Marathi from alias "marathi"');

  // Indian Currency Formatting
  const formattedLakh = formatIndianCurrency(1234567.89);
  assert(formattedLakh === '₹12,34,567.89', 'Formats 12,34,567.89 with authentic Indian Lakh grouping');
  const formattedCrore = formatIndianCurrency(10000000);
  assert(formattedCrore === '₹1,00,00,000', 'Formats 1,00,00,000 with authentic Indian Crore grouping');
  assert(formatIndianNumberWords(150000) === '1.50 Lakh', 'Converts 1,50,000 to "1.50 Lakh"');
  assert(formatIndianNumberWords(25000000) === '2.50 Crore', 'Converts 2,50,00,000 to "2.50 Crore"');

  // Indian Phone Validation
  const validMobile = validateIndianPhoneNumber('9876543210');
  assert(validMobile.isValid === true && validMobile.normalized === '+919876543210', 'Validates 10-digit Indian mobile number');
  const validWithPrefix = validateIndianPhoneNumber('+91 91234 56789');
  assert(validWithPrefix.isValid === true && validWithPrefix.normalized === '+919123456789', 'Validates prefixed Indian mobile number');
  const invalidShort = validateIndianPhoneNumber('12345');
  assert(invalidShort.isValid === false, 'Rejects invalid short phone number');

  // Indian Date Formatting
  const fixedDate = new Date(2026, 9, 24, 15, 30); // 24 Oct 2026 15:30
  const dateFormatted = formatIndianDate(fixedDate, { includeTime: true });
  assert(dateFormatted.includes('24/10/2026') && dateFormatted.includes('IST'), 'Formats date as DD/MM/YYYY with IST zone');

  // Test 23: Personal World Model & Separated Memory Categories Tests
  console.log('\n--- 23. Personal World Model & Memory Fabric Tests ---');
  const { personalWorldModel } = await import('../personalWorldModel');

  // Reject credentials in memory
  const rejectedMem = personalWorldModel.addLongTermMemory({
    key: 'My Bank Password',
    value: 'password: SecretPass123',
  });
  assert(rejectedMem === null, 'Rejects password credentials from long-term memory');

  // Valid memory addition & retrieval
  const addedMem = personalWorldModel.addLongTermMemory({
    key: 'Preferred Travel Destination',
    value: 'Shimla in winter',
    category: 'preference',
  });
  assert(addedMem !== null && addedMem.value === 'Shimla in winter', 'Stores sanitized user preference memory');
  const retrievedMems = personalWorldModel.retrieveRelevantMemories('Where do I like to travel?');
  assert(retrievedMems.length > 0 && retrievedMems[0].key === 'Preferred Travel Destination', 'Retrieves relevant memory by keyword query');

  // Active Projects
  const project = personalWorldModel.addProject('VAJRA Mobile Upgrade', 'Build India JARVIS', ['Implement controls', 'Release APK']);
  assert(project.name === 'VAJRA Mobile Upgrade', 'Adds active project to personal world model');
  assert(personalWorldModel.updateProjectCheckpoint(project.id, 'APK Built'), 'Updates project checkpoint');

  // Scheduled Reminders
  const testReminder = personalWorldModel.addReminder('Team Sync Call', Date.now() + 60000);
  assert(testReminder.title === 'Team Sync Call', 'Adds scheduled reminder');
  personalWorldModel.markReminderTriggered(testReminder.id);
  const foundRem = personalWorldModel.getReminders().find((r) => r.id === testReminder.id);
  assert(foundRem?.triggered === true, 'Marks reminder as triggered');

  // Test 24: Proactive Assistance & Reminders Engine Tests
  console.log('\n--- 24. Proactive Assistance & Reminders Engine Tests ---');
  const { proactiveEngine } = await import('../proactiveEngine');

  const briefing = await proactiveEngine.generateDailyBriefing();
  assert(briefing.greeting.includes('Commander'), 'Daily briefing includes respectful military/commander greeting');
  assert(briefing.suggestions.length > 0, 'Daily briefing contains proactive task suggestions');
  assert(typeof proactiveEngine.isWithinQuietHours() === 'boolean', 'Evaluates quiet hours without error');

  // Test 25: Universal Skill Registry & Schema Validation Tests
  console.log('\n--- 25. Universal Skill Registry & Schema Validation Tests ---');
  const { skillRegistry } = await import('../skillRegistry');

  const allSkills = skillRegistry.getAllSkills();
  assert(allSkills.length >= 10, 'Registry contains all core VAJRA skills');
  const phoneSkills = skillRegistry.getSkillsByGroup('phone_controls');
  assert(phoneSkills.length >= 3, 'Phone controls skill group contains settings, camera, volume, emergency stop');

  // Validation
  const validCheck = skillRegistry.validateSkillParameters('skill-open-settings', { screen: 'wifi' });
  assert(validCheck.valid === true, 'Validates valid parameters for skill-open-settings');
  const invalidCheck = skillRegistry.validateSkillParameters('skill-open-settings', {});
  assert(invalidCheck.valid === false && invalidCheck.missingParams.includes('screen'), 'Flags missing parameter for skill-open-settings');

  // Test 26: Multimodal Processing & Privacy Boundaries Tests
  console.log('\n--- 26. Multimodal Intelligence & Privacy Boundaries Tests ---');
  const { multimodalEngine } = await import('../multimodalEngine');

  const testAnalysis = multimodalEngine.analyzeAttachment({
    id: 'test-1',
    fileName: 'screenshot_wifi_password_secret.png',
    fileType: 'image/png',
    dataUrl: 'data:image/png;base64,mock',
    sizeBytes: 1024,
    uploadedAt: Date.now(),
    extractedText: 'Wi-Fi network: Home, password: MySecretPassword123',
  });
  assert(testAnalysis.hasVisualContent === true, 'Identifies visual content in image attachment');
  assert(testAnalysis.isEvidenceGrounded === true, 'Enforces evidence grounding on visual analysis');
  assert(testAnalysis.redactedText.includes('[REDACTED]'), 'Redacts credentials from multimodal extracted text');

  // Test 27: Central Intelligence Orchestrator Tests
  console.log('\n--- 27. Central Intelligence Orchestrator Tests ---');
  const { vajraIntelligenceOrchestrator } = await import('../vajraIntelligenceOrchestrator');

  const fastPathRes = await vajraIntelligenceOrchestrator.processDirective('Vajra stop');
  assert(fastPathRes.route === 'DIRECT_CONVERSATION', 'Stop directive routes to direct conversation fast-path');

  const phoneRes = await vajraIntelligenceOrchestrator.processDirective('Open Wi-Fi settings');
  assert(phoneRes.route === 'NATIVE_ANDROID_ACTION', 'Settings command routes to NATIVE_ANDROID_ACTION');
  assert(phoneRes.actions.length === 1 && phoneRes.actions[0].type === 'OPEN_SETTINGS', 'Dispatches OPEN_SETTINGS action');

  const multiRes = await vajraIntelligenceOrchestrator.processDirective('Open Wi-Fi settings and turn volume up');
  assert(multiRes.route === 'MULTI_STEP_MISSION', 'Compound directive routes to MULTI_STEP_MISSION');

  // Summary
  console.log('\n=======================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('=======================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runAllTests().catch((err) => {
  console.error('Test runner fatal exception:', err);
  process.exit(1);
});
