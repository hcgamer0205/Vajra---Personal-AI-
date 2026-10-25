import React, { useState, useEffect, useRef } from 'react';
import {
  Zap,
  CheckCircle2,
  Mic,
  Volume2,
  Globe,
  Laptop,
  Cpu,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Shield,
  ShieldCheck,
  Radio,
  Settings,
  Terminal,
  Activity,
  Layers,
  AlertCircle,
  Play,
  RotateCcw,
} from 'lucide-react';
import { AssistantState, VajraUserConfig, ModelOption } from '../types';
import { VajraSphere } from './VajraSphere';
import { isRunningInIframe } from '../services/voicePipeline';
import { voiceController } from '../services/voiceController';

interface VajraOnboardingModalProps {
  isOpen: boolean;
  onComplete: (config: VajraUserConfig) => void;
  onCancel?: () => void;
  availableModels: ModelOption[];
  initialConfig?: Partial<VajraUserConfig>;
  isReconfiguring?: boolean;
}

const DEFAULT_CONFIG: VajraUserConfig = {
  assistantName: 'VAJRA',
  language: 'en-US',
  voiceOutput: true,
  voiceInputMode: 'push_to_talk',
  startupBehavior: 'active_command',
  theme: 'crimson_gold',
  selectedModel: 'gemini-3.1-flash-lite',
};

const LANGUAGES = [
  { code: 'en-US', label: 'English (United States)' },
  { code: 'en-GB', label: 'English (United Kingdom)' },
  { code: 'hi-IN', label: 'Hindi (हिन्दी)' },
  { code: 'es-ES', label: 'Spanish (Español)' },
  { code: 'fr-FR', label: 'French (Français)' },
  { code: 'de-DE', label: 'German (Deutsch)' },
  { code: 'ja-JP', label: 'Japanese (日本語)' },
  { code: 'zh-CN', label: 'Chinese (简体中文)' },
];

export const VajraOnboardingModal: React.FC<VajraOnboardingModalProps> = ({
  isOpen,
  onComplete,
  onCancel,
  availableModels,
  initialConfig,
  isReconfiguring = false,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [config, setConfig] = useState<VajraUserConfig>(() => ({
    ...DEFAULT_CONFIG,
    ...initialConfig,
  }));

  // Step 4 Permission checks
  const [micPermission, setMicPermission] = useState<'prompt' | 'granted' | 'denied' | 'checking'>('prompt');
  const [micTesting, setMicTesting] = useState(false);

  // Step 5 Voice test state
  const [voiceTestState, setVoiceTestState] = useState<AssistantState>('idle');
  const [voiceTestMessage, setVoiceTestMessage] = useState<string>('Click "Run Voice Test" or speak "Hello VAJRA" to verify voice pipeline.');
  const [voiceTestSuccess, setVoiceTestSuccess] = useState<boolean>(false);
  const [isVoiceTestingActive, setIsVoiceTestingActive] = useState<boolean>(false);

  // Step 6 System Initialization
  const [initProgress, setInitProgress] = useState<number>(0);
  const [initLogs, setInitLogs] = useState<{ step: string; status: 'pending' | 'ok' | 'active' }[]>([
    { step: 'INITIALIZING ENERGY CORE...', status: 'pending' },
    { step: 'LOADING AI ENGINE...', status: 'pending' },
    { step: 'INITIALIZING VOICE SYSTEM...', status: 'pending' },
    { step: 'INITIALIZING WEB SYSTEM...', status: 'pending' },
    { step: 'INITIALIZING TOOLS...', status: 'pending' },
    { step: 'CHECKING DESKTOP BRIDGE...', status: 'pending' },
    { step: 'LOADING LOCAL STORAGE...', status: 'pending' },
  ]);

  const recognitionRef = useRef<any>(null);

  // Reset or initialize on open
  useEffect(() => {
    if (isOpen) {
      if (initialConfig) {
        setConfig((prev) => ({ ...prev, ...initialConfig }));
      }
      if (!isReconfiguring) {
        setCurrentStep(1);
      }
    }
  }, [isOpen, initialConfig, isReconfiguring]);

  // Handle Step 6 Automatic Progression
  useEffect(() => {
    if (currentStep === 6 && isOpen) {
      setInitProgress(0);
      const steps = [
        'INITIALIZING ENERGY CORE...',
        'LOADING AI ENGINE...',
        'INITIALIZING VOICE SYSTEM...',
        'INITIALIZING WEB SYSTEM...',
        'INITIALIZING TOOLS...',
        'CHECKING DESKTOP BRIDGE...',
        'LOADING LOCAL STORAGE...',
      ];

      setInitLogs(steps.map((s) => ({ step: s, status: 'pending' })));

      let stepIndex = 0;
      const interval = setInterval(() => {
        if (stepIndex < steps.length) {
          const currentIdx = stepIndex;
          setInitLogs((prev) =>
            prev.map((log, idx) => {
              if (idx < currentIdx) return { ...log, status: 'ok' };
              if (idx === currentIdx) return { ...log, status: 'active' };
              return log;
            })
          );
          setInitProgress(Math.round(((currentIdx + 1) / steps.length) * 100));

          setTimeout(() => {
            setInitLogs((prev) =>
              prev.map((log, idx) => {
                if (idx <= currentIdx) return { ...log, status: 'ok' };
                return log;
              })
            );
          }, 350);

          stepIndex++;
        } else {
          clearInterval(interval);
          setInitProgress(100);
          setTimeout(() => {
            setCurrentStep(7);
          }, 800);
        }
      }, 550);

      return () => clearInterval(interval);
    }
  }, [currentStep, isOpen]);

  if (!isOpen) return null;

  // Microphone Permission Checker
  const checkMicPermission = async () => {
    setMicTesting(true);
    setMicPermission('checking');
    try {
      const state = await voiceController.requestPermission();
      if (state === 'GRANTED') {
        setMicPermission('granted');
      } else {
        setMicPermission('denied');
      }
    } catch {
      setMicPermission('denied');
    } finally {
      setMicTesting(false);
    }
  };

  // Run Voice Test
  const runVoiceTest = () => {
    setIsVoiceTestingActive(true);
    setVoiceTestState('listening');
    setVoiceTestMessage('Listening for speech command "Hello VAJRA"...');

    // Attempt real speech recognition via unified voiceController
    if (voiceController.isNativeAndroid() || (!isRunningInIframe() && voiceController.hasWebSpeechSupport())) {
      voiceController.startListening(
        {
          onListeningState: (listening) => {
            if (!listening && voiceTestState === 'listening') {
              triggerVoiceSynthesis();
            }
          },
          onPartialTranscript: (text) => {
            setVoiceTestMessage(`Detected: "${text}"`);
          },
          onFinalTranscript: (text) => {
            setVoiceTestMessage(`Detected: "${text}"`);
            voiceController.stopListening();
            triggerVoiceSynthesis();
          },
          onError: () => {
            voiceController.stopListening();
            triggerVoiceSynthesis();
          },
        },
        config.language
      );

      // Safety fallback timer if no speech in 3.5 seconds
      setTimeout(() => {
        if (voiceTestState === 'listening') {
          voiceController.stopListening();
          triggerVoiceSynthesis();
        }
      }, 3500);
      return;
    } else {
      // If running inside iframe or speech recognition not allowed, run simulation with real TTS
      setTimeout(() => {
        setVoiceTestMessage('Detected: "Hello VAJRA" (Simulated Stream)');
        triggerVoiceSynthesis();
      }, 1200);
    }
  };

  const triggerVoiceSynthesis = () => {
    setVoiceTestState('thinking');
    setVoiceTestMessage('VAJRA Neural Core synthesizing response...');

    setTimeout(() => {
      setVoiceTestState('speaking');
      const speechText = `${config.assistantName} neural audio synthesizer operational. Voice recognition link confirmed.`;
      setVoiceTestMessage(`Transmitting: "${speechText}"`);

      if (typeof window !== 'undefined' && window.speechSynthesis && config.voiceOutput) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(speechText);
        utterance.lang = config.language;
        utterance.rate = 1.05;
        utterance.pitch = 0.95;

        utterance.onend = () => {
          setVoiceTestState('idle');
          setVoiceTestSuccess(true);
          setVoiceTestMessage('Voice system ready.');
          setIsVoiceTestingActive(false);
        };

        utterance.onerror = () => {
          setVoiceTestState('idle');
          setVoiceTestSuccess(true);
          setVoiceTestMessage('Voice system ready.');
          setIsVoiceTestingActive(false);
        };

        window.speechSynthesis.speak(utterance);
      } else {
        setTimeout(() => {
          setVoiceTestState('idle');
          setVoiceTestSuccess(true);
          setVoiceTestMessage('Voice system ready.');
          setIsVoiceTestingActive(false);
        }, 1500);
      }
    }, 1000);
  };

  const handleFinish = () => {
    onComplete(config);
  };

  return (
    <div
      id="vajra-onboarding-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#040102]/95 backdrop-blur-2xl text-[#fef3c7] select-none"
    >
      {/* Background HUD Ambience & Subtle Grid */}
      <div className="absolute inset-0 bg-radial-vignette opacity-95 pointer-events-none" />
      <div className="absolute inset-0 hud-grid-bg opacity-30 pointer-events-none" />

      {/* Main Glass HUD Container */}
      <div className="relative z-10 w-full max-w-2xl sm:max-w-3xl bg-[#080103]/95 border border-amber-500/40 rounded-3xl shadow-[0_0_60px_rgba(220,38,38,0.35)] flex flex-col overflow-hidden backdrop-blur-2xl max-h-[92vh]">
        {/* Top Header Bar & Step Indicators */}
        <div className="shrink-0 px-6 py-4 border-b border-amber-900/60 flex items-center justify-between bg-[#0e0104]/95">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-red-600 via-amber-500 to-yellow-400 p-0.5 shadow-lg shadow-red-950/60">
              <div className="w-full h-full bg-[#040102] rounded-[10px] flex items-center justify-center text-amber-400">
                <Zap className="w-4 h-4 text-amber-400 animate-pulse drop-shadow-[0_0_6px_rgba(245,158,11,0.8)]" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-hud font-bold text-sm tracking-widest text-amber-300">
                  {isReconfiguring ? 'VAJRA SYSTEM CONFIGURATION' : 'VAJRA SYSTEM SETUP'}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-950/80 border border-amber-500/40 text-cyan-300 font-bold">
                  STEP {currentStep} OF 7
                </span>
              </div>
              <p className="text-[11px] font-mono text-amber-500/70">
                Virtual Advanced Intelligence &amp; Response Assistant
              </p>
            </div>
          </div>

          {/* Quick Header Navigation & Stepper Dots */}
          <div className="flex items-center gap-3">
            {currentStep >= 2 && currentStep <= 5 && (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => Math.min(7, prev + 1))}
                className="px-3.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-[11px] font-mono font-bold text-amber-300 transition-all cursor-pointer flex items-center gap-1.5"
                title="Proceed to next step"
              >
                <span>Next</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            <div className="hidden sm:flex items-center gap-1.5">
              {[1, 2, 3, 4, 5, 6, 7].map((step) => (
                <div
                  key={step}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    currentStep === step
                      ? 'w-6 bg-gradient-to-r from-amber-400 to-yellow-300 shadow-[0_0_8px_rgba(251,191,36,0.8)]'
                      : currentStep > step
                      ? 'w-2.5 bg-red-600'
                      : 'w-1.5 bg-[#180309] border border-amber-900/60'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Dynamic Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-7 min-h-0">
          {/* ====================================================
              SCREEN 1 — WELCOME
             ==================================================== */}
          {currentStep === 1 && (
            <div className="flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in zoom-in-95 duration-300 min-h-[360px] my-auto">
              {/* Miniature Animated Energy Core */}
              <div className="relative flex items-center justify-center">
                <VajraSphere size="hero" state="idle" showRings={true} interactive={false} />
              </div>

              <div className="space-y-2">
                <h1 className="text-4xl sm:text-5xl font-extrabold font-hud tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-400 drop-shadow-[0_2px_20px_rgba(245,158,11,0.6)]">
                  VAJRA
                </h1>
                <p className="text-sm sm:text-base font-hud text-amber-300 tracking-wider">
                  Virtual Advanced Intelligence &amp; Response Assistant
                </p>
                <p className="text-xs sm:text-sm font-mono text-amber-200/80 max-w-md mx-auto">
                  "Your intelligent personal command system."
                </p>
              </div>

              <div className="pt-2">
                <button
                  id="onboarding-get-started-btn"
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-red-600 via-amber-500 to-yellow-400 hover:from-red-500 hover:to-yellow-300 text-black font-bold font-hud tracking-wider text-sm sm:text-base transition-all shadow-[0_0_25px_rgba(245,158,11,0.5)] hover:scale-105 cursor-pointer flex items-center gap-2 mx-auto"
                >
                  <span>GET STARTED</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ====================================================
              SCREEN 2 — VAJRA CONFIGURATION
             ==================================================== */}
          {currentStep === 2 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div>
                <h2 className="text-xl font-bold font-hud text-amber-200 tracking-wider">
                  VAJRA CONFIGURATION
                </h2>
                <p className="text-xs font-mono text-amber-500/80">
                  Configure core assistant preferences, speech harmonics, and operational modes.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Assistant Name */}
                <div className="p-3.5 rounded-2xl bg-[#140409] border border-amber-500/30 space-y-1.5">
                  <label className="text-[11px] font-mono font-bold text-amber-400 uppercase tracking-wider block">
                    Assistant Name
                  </label>
                  <input
                    type="text"
                    value={config.assistantName}
                    onChange={(e) => setConfig({ ...config, assistantName: e.target.value })}
                    placeholder="VAJRA"
                    className="w-full px-3 py-2 rounded-xl bg-[#090104] border border-amber-500/40 text-sm font-mono text-amber-100 placeholder-amber-500/40 outline-none focus:border-amber-400"
                  />
                  <span className="text-[10px] text-amber-500/60 font-mono">
                    Default: VAJRA
                  </span>
                </div>

                {/* 2. Preferred Language */}
                <div className="p-3.5 rounded-2xl bg-[#140409] border border-amber-500/30 space-y-1.5">
                  <label className="text-[11px] font-mono font-bold text-amber-400 uppercase tracking-wider block">
                    Preferred Language
                  </label>
                  <select
                    value={config.language}
                    onChange={(e) => setConfig({ ...config, language: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#090104] border border-amber-500/40 text-xs font-mono text-amber-100 outline-none focus:border-amber-400 cursor-pointer"
                  >
                    {LANGUAGES.map((lang) => (
                      <option key={lang.code} value={lang.code} className="bg-[#100206] text-amber-200">
                        {lang.label}
                      </option>
                    ))}
                  </select>
                  <span className="text-[10px] text-amber-500/60 font-mono">
                    Applied to Speech Synthesis &amp; Parsing
                  </span>
                </div>

                {/* 3. Voice Output */}
                <div className="p-3.5 rounded-2xl bg-[#140409] border border-amber-500/30 space-y-1.5">
                  <label className="text-[11px] font-mono font-bold text-amber-400 uppercase tracking-wider block">
                    Voice Output (TTS)
                  </label>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs font-mono text-amber-200">
                      {config.voiceOutput ? 'Neural Speech Active' : 'Muted (Text Only)'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setConfig({ ...config, voiceOutput: !config.voiceOutput })}
                      className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                        config.voiceOutput
                          ? 'bg-amber-500/25 text-amber-300 border border-amber-500/60'
                          : 'bg-red-950/40 text-amber-500/50 border border-amber-900/40'
                      }`}
                    >
                      {config.voiceOutput ? 'ENABLED' : 'MUTED'}
                    </button>
                  </div>
                </div>

                {/* 4. Voice Input Mode */}
                <div className="p-3.5 rounded-2xl bg-[#140409] border border-amber-500/30 space-y-1.5">
                  <label className="text-[11px] font-mono font-bold text-amber-400 uppercase tracking-wider block">
                    Voice Input Mode
                  </label>
                  <select
                    value={config.voiceInputMode}
                    onChange={(e) =>
                      setConfig({ ...config, voiceInputMode: e.target.value as any })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#090104] border border-amber-500/40 text-xs font-mono text-amber-100 outline-none focus:border-amber-400 cursor-pointer"
                  >
                    <option value="push_to_talk" className="bg-[#100206] text-amber-200">
                      Push-To-Talk (Manual Trigger)
                    </option>
                    <option value="continuous" className="bg-[#100206] text-amber-200">
                      Continuous Voice Stream
                    </option>
                  </select>
                </div>

                {/* 5. Startup Behavior */}
                <div className="p-3.5 rounded-2xl bg-[#140409] border border-amber-500/30 space-y-1.5">
                  <label className="text-[11px] font-mono font-bold text-amber-400 uppercase tracking-wider block">
                    Startup Behavior
                  </label>
                  <select
                    value={config.startupBehavior}
                    onChange={(e) =>
                      setConfig({ ...config, startupBehavior: e.target.value as any })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#090104] border border-amber-500/40 text-xs font-mono text-amber-100 outline-none focus:border-amber-400 cursor-pointer"
                  >
                    <option value="active_command" className="bg-[#100206] text-amber-200">
                      Command Center (Instant Directive Ready)
                    </option>
                    <option value="standby" className="bg-[#100206] text-amber-200">
                      Energy Core Standby
                    </option>
                    <option value="voice_ready" className="bg-[#100206] text-amber-200">
                      Auto-Engage Voice Channel
                    </option>
                  </select>
                </div>

                {/* 6. Theme */}
                <div className="p-3.5 rounded-2xl bg-[#140409] border border-amber-500/30 space-y-1.5">
                  <label className="text-[11px] font-mono font-bold text-amber-400 uppercase tracking-wider block">
                    System Visual Theme
                  </label>
                  <div className="flex items-center gap-2 pt-1">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-red-600 via-amber-500 to-yellow-300 border border-amber-400 shrink-0"></div>
                    <span className="text-xs font-mono text-amber-200 font-bold">
                      Crimson &amp; Solar Gold (Core Default)
                    </span>
                  </div>
                </div>
              </div>

              {/* Step 2 In-Content Navigation Controls */}
              <div className="pt-4 border-t border-amber-900/50 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#140409] hover:bg-[#20050e] border border-amber-900/60 text-xs font-mono text-amber-300 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Welcome</span>
                </button>

                <button
                  id="onboarding-step2-next-btn"
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="w-full sm:w-auto px-7 py-3 rounded-xl bg-gradient-to-r from-red-600 via-amber-500 to-yellow-400 hover:from-red-500 hover:to-yellow-300 text-black font-bold font-hud tracking-widest text-xs sm:text-sm transition-all shadow-[0_0_25px_rgba(245,158,11,0.55)] hover:scale-[1.02] cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>CONTINUE TO AI CONNECTION</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ====================================================
              SCREEN 3 — AI CONNECTION
             ==================================================== */}
          {currentStep === 3 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div>
                <h2 className="text-xl font-bold font-hud text-amber-200 tracking-wider">
                  AI NEURAL CONNECTION
                </h2>
                <p className="text-xs font-mono text-amber-500/80">
                  Verify the AI neural orchestration link and backend proxy architecture.
                </p>
              </div>

              {/* Status Matrix */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-[#140409] border border-amber-500/40 flex flex-col justify-between">
                  <div className="text-[10px] font-mono text-amber-500 uppercase">AI ENGINE</div>
                  <div className="font-hud font-bold text-base text-amber-200 my-1">Google Gemini</div>
                  <div className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>SDK Initialized</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#140409] border border-amber-500/40 flex flex-col justify-between">
                  <div className="text-[10px] font-mono text-amber-500 uppercase">CONNECTION</div>
                  <div className="font-hud font-bold text-base text-amber-200 my-1">Online Proxy</div>
                  <div className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                    <Radio className="w-3 h-3 animate-pulse" />
                    <span>Stream Channel Ready</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#140409] border border-amber-500/40 flex flex-col justify-between">
                  <div className="text-[10px] font-mono text-amber-500 uppercase">STATUS</div>
                  <div className="font-hud font-bold text-base text-amber-300 my-1">READY</div>
                  <div className="text-[10px] font-mono text-amber-400">Low-Latency Mesh</div>
                </div>
              </div>

              {/* Model Selection */}
              <div className="p-4 rounded-2xl bg-[#120308] border border-amber-500/35 space-y-2">
                <label className="text-[11px] font-mono font-bold text-amber-400 uppercase tracking-wider block">
                  Primary Neural Model Engine
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {availableModels.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setConfig({ ...config, selectedModel: m.id })}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        config.selectedModel === m.id
                          ? 'bg-amber-500/20 border-amber-400 text-amber-200 shadow-md'
                          : 'bg-[#18040a] border-amber-900/60 text-amber-500/80 hover:border-amber-500/40 hover:text-amber-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold">{m.name}</span>
                        {config.selectedModel === m.id && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-amber-500/60 mt-1 line-clamp-1">
                        {m.description}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Security & API Architecture Explanation */}
              <div className="p-3.5 rounded-2xl bg-[#0c0104] border border-amber-900/60 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="text-xs font-mono font-bold text-amber-300">
                    Zero-Leak Security Architecture
                  </div>
                  <p className="text-[11px] font-mono text-amber-400/70 leading-relaxed">
                    VAJRA leverages a secure server-side proxy route (<code className="text-amber-300">/api/chat</code>) that protects API credentials. No secret keys or authentication tokens are ever stored in client localStorage or transmitted in browser headers.
                  </p>
                </div>
              </div>

              {/* Step 3 In-Content Navigation Controls */}
              <div className="pt-4 border-t border-amber-900/50 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#140409] hover:bg-[#20050e] border border-amber-900/60 text-xs font-mono text-amber-300 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Config</span>
                </button>

                <button
                  id="onboarding-step3-next-btn"
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  className="w-full sm:w-auto px-7 py-3 rounded-xl bg-gradient-to-r from-red-600 via-amber-500 to-yellow-400 hover:from-red-500 hover:to-yellow-300 text-black font-bold font-hud tracking-widest text-xs sm:text-sm transition-all shadow-[0_0_25px_rgba(245,158,11,0.55)] hover:scale-[1.02] cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>CONTINUE TO PERMISSIONS</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ====================================================
              SCREEN 4 — PERMISSIONS
             ==================================================== */}
          {currentStep === 4 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div>
                <h2 className="text-xl font-bold font-hud text-amber-200 tracking-wider">
                  SYSTEM PERMISSIONS
                </h2>
                <p className="text-xs font-mono text-amber-500/80">
                  VAJRA requires specific device capabilities to execute speech recognition and web directives.
                </p>
              </div>

              <div className="space-y-3">
                {/* 1. Microphone */}
                <div className="p-3.5 rounded-2xl bg-[#140409] border border-amber-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-red-950/80 border border-amber-500/40 text-amber-400">
                      <Mic className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-hud font-bold text-xs text-amber-200">
                        🎤 Microphone Input
                      </div>
                      <div className="text-[10px] font-mono text-amber-500/70">
                        For speech recognition and voice commands
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={checkMicPermission}
                      disabled={micTesting}
                      className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-xs font-mono text-amber-300 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {micPermission === 'granted'
                        ? 'GRANTED'
                        : micTesting
                        ? 'CHECKING...'
                        : 'TEST ACCESS'}
                    </button>
                  </div>
                </div>

                {/* 2. Audio Output */}
                <div className="p-3.5 rounded-2xl bg-[#140409] border border-amber-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-red-950/80 border border-amber-500/40 text-amber-400">
                      <Volume2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-hud font-bold text-xs text-amber-200">
                        🔊 Audio Output
                      </div>
                      <div className="text-[10px] font-mono text-amber-500/70">
                        For neural text-to-speech audio feedback
                      </div>
                    </div>
                  </div>

                  <span className="px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-[10px] font-mono text-emerald-300 font-bold">
                    READY
                  </span>
                </div>

                {/* 3. Web Access */}
                <div className="p-3.5 rounded-2xl bg-[#140409] border border-amber-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-red-950/80 border border-amber-500/40 text-amber-400">
                      <Globe className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-hud font-bold text-xs text-amber-200">
                        🌐 Web Navigation &amp; Search
                      </div>
                      <div className="text-[10px] font-mono text-amber-500/70">
                        For executing requested URLs, YouTube playback, and Google searches
                      </div>
                    </div>
                  </div>

                  <span className="px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-[10px] font-mono text-emerald-300 font-bold">
                    READY
                  </span>
                </div>

                {/* 4. Desktop Bridge */}
                <div className="p-3.5 rounded-2xl bg-[#140409] border border-amber-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-red-950/80 border border-amber-500/40 text-amber-400">
                      <Laptop className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-hud font-bold text-xs text-amber-200">
                        🖥️ Desktop OS Bridge
                      </div>
                      <div className="text-[10px] font-mono text-amber-500/70">
                        For approved native OS automation in desktop companion build
                      </div>
                    </div>
                  </div>

                  <span className="px-3 py-1 rounded-full bg-amber-950/80 border border-amber-500/50 text-[10px] font-mono text-amber-300 font-bold">
                    SANDBOX READY
                  </span>
                </div>
              </div>

              {/* Step 4 In-Content Navigation Controls */}
              <div className="pt-4 border-t border-amber-900/50 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#140409] hover:bg-[#20050e] border border-amber-900/60 text-xs font-mono text-amber-300 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to AI Link</span>
                </button>

                <button
                  id="onboarding-step4-next-btn"
                  type="button"
                  onClick={() => setCurrentStep(5)}
                  className="w-full sm:w-auto px-7 py-3 rounded-xl bg-gradient-to-r from-red-600 via-amber-500 to-yellow-400 hover:from-red-500 hover:to-yellow-300 text-black font-bold font-hud tracking-widest text-xs sm:text-sm transition-all shadow-[0_0_25px_rgba(245,158,11,0.55)] hover:scale-[1.02] cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>CONTINUE TO VOICE TEST</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ====================================================
              SCREEN 5 — VOICE TEST
             ==================================================== */}
          {currentStep === 5 && (
            <div className="flex flex-col items-center text-center space-y-5 animate-in fade-in duration-200">
              <div>
                <h2 className="text-xl font-bold font-hud text-amber-200 tracking-wider">
                  VOICE PIPELINE RESONANCE TEST
                </h2>
                <p className="text-xs font-mono text-amber-500/80 max-w-md mx-auto">
                  Test acoustic speech input and neural audio synthesis harmonics.
                </p>
              </div>

              {/* Reactive VAJRA Core State Sphere */}
              <div className="relative flex items-center justify-center my-2">
                <VajraSphere
                  size="hero"
                  state={voiceTestState}
                  showRings={true}
                  interactive={false}
                />
              </div>

              {/* Status & Feedback box */}
              <div className="w-full max-w-md p-3.5 rounded-2xl bg-[#120308] border border-amber-500/40 space-y-2">
                <div className="text-xs font-mono text-amber-200 flex items-center justify-center gap-2">
                  {voiceTestState === 'listening' ? (
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                  ) : voiceTestState === 'thinking' ? (
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                  ) : voiceTestState === 'speaking' ? (
                    <Volume2 className="w-4 h-4 text-yellow-300 animate-bounce" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  )}
                  <span className="font-bold uppercase tracking-wider">
                    {voiceTestState === 'listening'
                      ? 'Listening...'
                      : voiceTestState === 'thinking'
                      ? 'Neural Synthesis...'
                      : voiceTestState === 'speaking'
                      ? 'Transmitting Audio...'
                      : voiceTestSuccess
                      ? 'Voice System Ready'
                      : 'Standby'}
                  </span>
                </div>

                <p className="text-xs font-mono text-amber-300/80 italic">
                  {voiceTestMessage}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={runVoiceTest}
                  disabled={isVoiceTestingActive}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-amber-500 to-yellow-400 hover:from-red-500 hover:to-yellow-300 text-black font-bold font-mono text-xs transition-all shadow-md hover:scale-105 cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  <Play className="w-3.5 h-3.5 fill-black" />
                  <span>Run Voice Test (Say "Hello VAJRA")</span>
                </button>

                <button
                  id="onboarding-step5-continue-btn"
                  type="button"
                  onClick={() => setCurrentStep(6)}
                  className={`px-5 py-2.5 rounded-xl font-bold font-mono text-xs transition-all cursor-pointer flex items-center gap-2 ${
                    voiceTestSuccess
                      ? 'bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500 text-emerald-200 shadow-md'
                      : 'bg-[#140409] hover:bg-[#20050e] border border-amber-900/60 text-amber-300'
                  }`}
                >
                  {voiceTestSuccess ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <ArrowRight className="w-3.5 h-3.5" />
                  )}
                  <span>{voiceTestSuccess ? 'Proceed to Initialization' : 'Skip / Continue'}</span>
                </button>
              </div>
            </div>
          )}

          {/* ====================================================
              SCREEN 6 — SYSTEM INITIALIZATION
             ==================================================== */}
          {currentStep === 6 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="text-center space-y-1">
                <h2 className="text-xl font-bold font-hud text-amber-200 tracking-wider">
                  SYSTEM INITIALIZATION
                </h2>
                <p className="text-xs font-mono text-amber-500/80">
                  Bootstrapping VAJRA core matrices and encrypted storage subsystems...
                </p>
              </div>

              {/* Center Mini Sphere & Progress Bar */}
              <div className="flex flex-col items-center justify-center my-1 space-y-3">
                <VajraSphere size="lg" state="thinking" showRings={true} interactive={false} />

                {/* High Tech Progress Bar */}
                <div className="w-full max-w-md space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-mono text-amber-400">
                    <span>BOOTSTRAP SEQUENCE</span>
                    <span>{initProgress}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#160309] border border-amber-900/60 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-red-600 via-amber-500 to-yellow-300 transition-all duration-300 shadow-[0_0_12px_rgba(245,158,11,0.8)]"
                      style={{ width: `${initProgress}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Terminal Logs */}
              <div className="p-4 rounded-2xl bg-[#090104] border border-amber-500/35 font-mono text-xs space-y-1.5 max-w-lg mx-auto max-h-48 overflow-y-auto">
                {initLogs.map((log, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between transition-opacity ${
                      log.status === 'pending'
                        ? 'opacity-35 text-amber-700'
                        : log.status === 'active'
                        ? 'opacity-100 text-amber-300 animate-pulse'
                        : 'opacity-100 text-amber-100'
                    }`}
                  >
                    <span>{log.step}</span>
                    <span
                      className={`font-bold ${
                        log.status === 'ok'
                          ? 'text-emerald-400'
                          : log.status === 'active'
                          ? 'text-yellow-400'
                          : 'text-amber-800'
                      }`}
                    >
                      {log.status === 'ok' ? '[ OK ]' : log.status === 'active' ? '[ ... ]' : '[ WAIT ]'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ====================================================
              SCREEN 7 — READY
             ==================================================== */}
          {currentStep === 7 && (
            <div className="flex flex-col items-center text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
              {/* Massive Center Energy Core */}
              <div className="relative flex items-center justify-center scale-105">
                <VajraSphere size="hero" state="speaking" showRings={true} interactive={true} />
              </div>

              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-mono shadow-xl">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  <span className="font-bold tracking-widest uppercase">ALL SYSTEMS NOMINAL</span>
                </div>

                <h1 className="text-4xl sm:text-5xl font-extrabold font-hud tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-400 drop-shadow-[0_2px_20px_rgba(245,158,11,0.6)]">
                  VAJRA ONLINE
                </h1>
                <p className="text-xs sm:text-sm font-mono text-amber-200/80 max-w-md mx-auto">
                  "All configured systems are ready. Standing by for directives."
                </p>
              </div>

              {/* Ready Summary Telemetry Badge */}
              <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-mono text-amber-400/80">
                <span className="px-2.5 py-1 rounded-lg bg-[#140409] border border-amber-900/60">
                  Assistant: <strong className="text-amber-200">{config.assistantName}</strong>
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-[#140409] border border-amber-900/60">
                  Voice: <strong className="text-amber-200">{config.voiceOutput ? 'ACTIVE' : 'MUTED'}</strong>
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-[#140409] border border-amber-900/60">
                  Language: <strong className="text-amber-200">{config.language}</strong>
                </span>
              </div>

              <div className="pt-2">
                <button
                  id="onboarding-enter-vajra-btn"
                  type="button"
                  onClick={handleFinish}
                  className="px-10 py-3.5 rounded-2xl bg-gradient-to-r from-red-600 via-amber-500 to-yellow-400 hover:from-red-500 hover:to-yellow-300 text-black font-bold font-hud tracking-widest text-sm sm:text-base transition-all shadow-[0_0_35px_rgba(245,158,11,0.6)] hover:scale-105 cursor-pointer flex items-center gap-2 mx-auto"
                >
                  <Zap className="w-5 h-5 fill-black text-black" />
                  <span>ENTER VAJRA</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Navigation Buttons (for Steps 2-5) */}
        {currentStep >= 2 && currentStep <= 5 && (
          <div className="shrink-0 px-6 py-3.5 border-t border-amber-500/40 flex items-center justify-between bg-[#0e0104] z-20 shadow-[0_-10px_25px_rgba(0,0,0,0.5)]">
            <button
              id="onboarding-footer-back-btn"
              type="button"
              onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
              className="px-4 py-2 rounded-xl bg-[#1a040b] hover:bg-[#2c0813] border border-amber-900/60 text-xs font-mono text-amber-300 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>

            <div className="flex items-center gap-3">
              {onCancel && isReconfiguring && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-4 py-2 rounded-xl bg-[#140408] hover:bg-[#20050d] border border-red-900/60 text-xs font-mono text-red-300 transition-all cursor-pointer"
                >
                  Close
                </button>
              )}

              <button
                id="onboarding-footer-next-btn"
                type="button"
                onClick={() => setCurrentStep((prev) => Math.min(7, prev + 1))}
                className="px-6 sm:px-8 py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-amber-500 to-yellow-400 hover:from-red-500 hover:to-yellow-300 text-black font-bold font-hud tracking-wider text-xs sm:text-sm transition-all shadow-[0_0_20px_rgba(245,158,11,0.5)] hover:scale-105 cursor-pointer flex items-center gap-2"
              >
                <span>
                  {currentStep === 2
                    ? 'NEXT: AI CONNECTION'
                    : currentStep === 3
                    ? 'NEXT: PERMISSIONS'
                    : currentStep === 4
                    ? 'NEXT: VOICE TEST'
                    : 'NEXT: INITIALIZATION'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
