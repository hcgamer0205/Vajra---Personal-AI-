import React, { useState } from 'react';
import {
  ShieldCheck,
  Activity,
  Cpu,
  Brain,
  Wifi,
  WifiOff,
  Mic,
  Clock,
  CheckCircle2,
  AlertTriangle,
  History,
  Info,
  Smartphone,
  ExternalLink,
} from 'lucide-react';
import { MobileBottomSheet } from './MobileBottomSheet';
import { AuthoritativeState, getTaskReflections, inspectSystemHealth } from '../../services/vajraSelfAwareness';
import { VajraConversationContext } from '../../services/vajraContext';
import { MicrophonePermissionState, VoiceActivationMode } from '../../services/voiceController';
import { SelfHealEvent } from '../../services/vajraSelfHeal';
import { LearnedPreference } from '../../services/vajraLearning';

interface MobileTransparencyPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentState: AuthoritativeState;
  context: VajraConversationContext;
  isOnline: boolean;
  selectedModel: string;
  isVoiceActivationEnabled: boolean;
  voiceMode: VoiceActivationMode;
  micPermission: MicrophonePermissionState;
  isNativeAndroid: boolean;
  recentSelfHealEvents: SelfHealEvent[];
  learnedPreferences: LearnedPreference[];
  onOpenVoiceDiagnostics?: () => void;
  onOpenCoreSettings?: () => void;
}

export const MobileTransparencyPanel: React.FC<MobileTransparencyPanelProps> = ({
  isOpen,
  onClose,
  currentState,
  context,
  isOnline,
  selectedModel,
  isVoiceActivationEnabled,
  voiceMode,
  micPermission,
  isNativeAndroid,
  recentSelfHealEvents,
  learnedPreferences,
  onOpenVoiceDiagnostics,
  onOpenCoreSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'status' | 'reflections' | 'boundaries'>('status');
  const reflections = getTaskReflections();

  const healthReport = inspectSystemHealth(context, {
    isListening: currentState === 'listening',
    voiceMode,
    micPermission,
    pendingAction: context.pendingConfirmation?.action || null,
    activeMission: context.activeMission,
    recentErrorsCount: recentSelfHealEvents.filter((e) => !e.success).length,
  });

  const stateColors: Record<AuthoritativeState, { bg: string; text: string; border: string; label: string }> = {
    idle: { bg: 'bg-emerald-950/40', text: 'text-emerald-300', border: 'border-emerald-500/40', label: 'IDLE (Standby)' },
    listening: { bg: 'bg-cyan-950/50', text: 'text-cyan-300', border: 'border-cyan-500/50', label: 'LISTENING (Acoustic Sensor)' },
    understanding: { bg: 'bg-amber-950/40', text: 'text-amber-300', border: 'border-amber-500/40', label: 'UNDERSTANDING (Parsing Directive)' },
    planning: { bg: 'bg-yellow-950/40', text: 'text-yellow-300', border: 'border-yellow-500/40', label: 'PLANNING (Task Structure)' },
    awaiting_confirmation: { bg: 'bg-purple-950/50', text: 'text-purple-300', border: 'border-purple-500/50', label: 'AWAITING CONFIRMATION' },
    executing: { bg: 'bg-red-950/50', text: 'text-red-300', border: 'border-red-500/50', label: 'EXECUTING (Dispatched Action)' },
    verifying: { bg: 'bg-blue-950/50', text: 'text-blue-300', border: 'border-blue-500/50', label: 'VERIFYING (Sanity Check)' },
    speaking: { bg: 'bg-amber-950/50', text: 'text-amber-200', border: 'border-amber-400/50', label: 'SPEAKING (Voice Synthesizer)' },
    paused: { bg: 'bg-stone-900', text: 'text-stone-300', border: 'border-stone-700', label: 'PAUSED' },
    recovering: { bg: 'bg-orange-950/50', text: 'text-orange-300', border: 'border-orange-500/50', label: 'RECOVERING (Self-Healing Active)' },
    error: { bg: 'bg-red-950/70', text: 'text-red-400', border: 'border-red-600/70', label: 'ERROR DETECTED' },
    backgrounded: { bg: 'bg-stone-950', text: 'text-stone-400', border: 'border-stone-800', label: 'BACKGROUNDED' },
  };

  const currentTheme = stateColors[currentState] || stateColors.idle;

  return (
    <MobileBottomSheet
      isOpen={isOpen}
      onClose={onClose}
      height="tall"
      title="VAJRA INTROSPECTION & TRANSPARENCY"
      subtitle="Observable runtime state & verifiable capabilities"
    >
      <div className="space-y-4 pb-8">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#120206] border border-amber-500/20">
          <button
            type="button"
            onClick={() => setActiveTab('status')}
            className={`flex-1 py-1.5 text-xs font-hud tracking-wider rounded-lg transition-all cursor-pointer ${
              activeTab === 'status'
                ? 'bg-amber-500/20 text-amber-200 font-bold border border-amber-500/40 shadow-sm'
                : 'text-amber-400/60 hover:text-amber-200'
            }`}
          >
            LIVE STATE
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('reflections')}
            className={`flex-1 py-1.5 text-xs font-hud tracking-wider rounded-lg transition-all cursor-pointer ${
              activeTab === 'reflections'
                ? 'bg-amber-500/20 text-amber-200 font-bold border border-amber-500/40 shadow-sm'
                : 'text-amber-400/60 hover:text-amber-200'
            }`}
          >
            REFLECTIONS ({reflections.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('boundaries')}
            className={`flex-1 py-1.5 text-xs font-hud tracking-wider rounded-lg transition-all cursor-pointer ${
              activeTab === 'boundaries'
                ? 'bg-amber-500/20 text-amber-200 font-bold border border-amber-500/40 shadow-sm'
                : 'text-amber-400/60 hover:text-amber-200'
            }`}
          >
            BOUNDARIES
          </button>
        </div>

        {activeTab === 'status' ? (
          /* TAB 1: LIVE STATE HUD */
          <div className="space-y-3">
            {/* Master State Banner */}
            <div className={`p-3.5 rounded-xl border ${currentTheme.bg} ${currentTheme.border} flex items-center justify-between gap-3 shadow-md`}>
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-amber-400/80 font-bold">
                  Authoritative Operating State
                </div>
                <div className={`text-sm font-hud font-bold tracking-wider ${currentTheme.text} mt-0.5`}>
                  {currentTheme.label}
                </div>
              </div>
              <span className="w-3 h-3 rounded-full bg-amber-400 animate-pulse shrink-0" />
            </div>

            {/* Matrix Metrics Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              {/* Voice Activation */}
              <div className="p-3 rounded-xl bg-[#140206] border border-amber-500/20 space-y-1">
                <div className="flex items-center gap-1.5 text-[10px] text-amber-400/70 font-bold">
                  <Mic className="w-3 h-3 text-amber-400" />
                  <span>VOICE WAKE</span>
                </div>
                <div className="font-bold text-amber-200">
                  {isVoiceActivationEnabled ? 'ENABLED' : 'OFF'}
                </div>
                <div className="text-[10px] text-amber-400/60">
                  Permission: {micPermission}
                </div>
              </div>

              {/* Engine & Connectivity */}
              <div className="p-3 rounded-xl bg-[#140206] border border-amber-500/20 space-y-1">
                <div className="flex items-center gap-1.5 text-[10px] text-amber-400/70 font-bold">
                  {isOnline ? <Wifi className="w-3 h-3 text-cyan-400" /> : <WifiOff className="w-3 h-3 text-red-400" />}
                  <span>NEURAL CORE</span>
                </div>
                <div className="font-bold text-amber-200 truncate">
                  {isOnline ? selectedModel : 'Local Heuristics'}
                </div>
                <div className="text-[10px] text-amber-400/60">
                  {isOnline ? 'Cloud Proxy Connected' : 'Offline Engine'}
                </div>
              </div>

              {/* Active Mission */}
              <div className="p-3 rounded-xl bg-[#140206] border border-amber-500/20 space-y-1">
                <div className="flex items-center gap-1.5 text-[10px] text-amber-400/70 font-bold">
                  <Activity className="w-3 h-3 text-amber-400" />
                  <span>ACTIVE MISSION</span>
                </div>
                <div className="font-bold text-amber-200 truncate">
                  {context.activeMission ? context.activeMission.title : 'Standby (None)'}
                </div>
                <div className="text-[10px] text-amber-400/60">
                  {context.activeMission
                    ? `Step ${context.activeMission.currentStepIndex + 1}/${context.activeMission.steps.length}`
                    : 'No sequential task'}
                </div>
              </div>

              {/* Adaptive Learning */}
              <div className="p-3 rounded-xl bg-[#140206] border border-amber-500/20 space-y-1">
                <div className="flex items-center gap-1.5 text-[10px] text-amber-400/70 font-bold">
                  <Brain className="w-3 h-3 text-amber-400" />
                  <span>ADAPTIVE LEARNING</span>
                </div>
                <div className="font-bold text-amber-200">
                  {learnedPreferences.length > 0 ? `${learnedPreferences.length} ACTIVE` : 'READY'}
                </div>
                <div className="text-[10px] text-amber-400/60">
                  Sensitive data shield: ACTIVE
                </div>
              </div>
            </div>

            {/* Last Verified Result Panel */}
            <div className="p-3.5 rounded-xl bg-[#100206] border border-amber-500/30 space-y-1.5 text-xs font-mono">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-amber-400/80 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Last Verified Result</span>
                </span>
                {context.recentResult && (
                  <span className="text-[10px] text-amber-400/60">
                    {new Date(context.recentResult.timestamp).toLocaleTimeString()}
                  </span>
                )}
              </div>
              <p className="text-amber-200/90 leading-relaxed text-[11px]">
                {context.recentResult?.message || 'Awaiting initial action execution.'}
              </p>
            </div>

            {/* Self-Monitoring Alert if issues found */}
            {healthReport.issues.length > 0 ? (
              <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-500/50 space-y-1 text-xs font-mono text-amber-300">
                <div className="flex items-center gap-2 font-bold text-amber-200">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>System Self-Monitoring Warning</span>
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-300/80">
                  {healthReport.issues.map((iss, i) => (
                    <li key={i}>{iss}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="p-2.5 rounded-xl bg-[#0a140a] border border-emerald-500/30 text-[10px] font-mono text-emerald-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Self-Monitoring: All operational metrics, permissions, and lifecycle states nominal.</span>
              </div>
            )}
          </div>
        ) : activeTab === 'reflections' ? (
          /* TAB 2: TASK REFLECTIONS & MISTAKE ANALYSIS */
          <div className="space-y-3">
            <div className="text-[11px] font-mono text-amber-400/70">
              Bounded factual post-task audits recording requested vs authorized vs observed results.
            </div>

            {reflections.length === 0 ? (
              <div className="p-6 rounded-xl bg-[#120206] border border-amber-500/20 text-center text-xs font-mono text-amber-400/60 space-y-1">
                <History className="w-6 h-6 text-amber-500/40 mx-auto mb-2" />
                <div>No task audits recorded in this session yet.</div>
                <div className="text-[10px] opacity-70">
                  Reflections record automatically upon action completion or failure.
                </div>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                {reflections.map((ref) => (
                  <div
                    key={ref.id}
                    className="p-3 rounded-xl bg-[#120206] border border-amber-500/30 space-y-1.5 text-xs font-mono"
                  >
                    <div className="flex items-center justify-between text-[10px] text-amber-400/70">
                      <span className="font-bold text-amber-300">
                        {new Date(ref.timestamp).toLocaleTimeString()}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded font-bold uppercase ${
                          ref.wasVerified
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                            : 'bg-red-950 text-red-300 border border-red-500/40'
                        }`}
                      >
                        {ref.wasVerified ? 'Verified' : 'Unverified / Failed'}
                      </span>
                    </div>

                    <div className="space-y-0.5">
                      <div className="text-amber-200 font-bold">Request: "{ref.userRequest}"</div>
                      <div className="text-[11px] text-amber-400/80">Authorized: {ref.authorizedAction}</div>
                      <div className="text-[11px] text-amber-300/90">Result: {ref.observedResult}</div>
                      {ref.failureReason && (
                        <div className="text-[11px] text-red-400">Fault: {ref.failureReason}</div>
                      )}
                      <div className="text-[10px] text-cyan-300/80 pt-1">
                        Mitigation: {ref.preventativeImprovement}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* TAB 3: CAPABILITY BOUNDARIES & HONESTY */
          <div className="space-y-3 text-xs font-mono text-amber-200/90">
            <div className="p-3.5 rounded-xl bg-[#120206] border border-amber-500/30 space-y-2">
              <div className="font-hud font-bold text-amber-300 tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>SCIENTIFIC &amp; SAFETY BOUNDARIES</span>
              </div>
              <p className="text-[11px] text-amber-300/80 leading-relaxed">
                VAJRA self-awareness is an observable engineering capability—not biological sentience, human consciousness, or autonomous agency.
              </p>
            </div>

            <div className="space-y-2">
              <div className="p-2.5 rounded-xl bg-[#100206] border border-amber-500/20 space-y-1">
                <div className="font-bold text-amber-300 text-[11px]">1. Non-Self-Modifying Boundary</div>
                <p className="text-[10px] text-amber-400/70">
                  Self-reflection cannot alter security policies, grant unauthorized permissions, or execute arbitrary shell scripts.
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-[#100206] border border-amber-500/20 space-y-1">
                <div className="font-bold text-amber-300 text-[11px]">2. Physical Device Microphone Honesty</div>
                <p className="text-[10px] text-amber-400/70">
                  Android SpeechRecognizer operates in foreground or session standby. Screen-off continuous wake requires physical device testing.
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-[#100206] border border-amber-500/20 space-y-1">
                <div className="font-bold text-amber-300 text-[11px]">3. Destructive Action Confirmation Guard</div>
                <p className="text-[10px] text-amber-400/70">
                  High-risk operations (such as file deletion or system calls) strictly require user confirmation before dispatch.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </MobileBottomSheet>
  );
};
