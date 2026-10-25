import React, { useState } from 'react';
import {
  X,
  Palette,
  Brain,
  Sparkles,
  RotateCcw,
  Trash2,
  Plus,
  ShieldCheck,
  Check,
  Wrench,
  AlertTriangle,
  Sliders,
  Mic,
  Radio,
  Volume2,
  RefreshCw,
  Activity,
  HeartPulse,
  Smartphone,
  Download,
} from 'lucide-react';
import {
  CoreThemeId,
  UiAccentId,
  VajraAppearanceConfig,
  CORE_THEMES,
  UI_ACCENTS,
  getMatchingUiAccentForCoreTheme,
} from '../services/vajraAppearance';
import {
  VajraMemoryItem,
  MemoryCategory,
  deleteMemory,
  clearAllMemories,
  addMemory,
} from '../services/vajraMemory';
import {
  VajraVoiceConfig,
  VoiceGenderSelection,
  VoiceSpeedSelection,
  VoicePitchSelection,
  inspectAvailableVoices,
  resolveEffectiveVoice,
  DEFAULT_VOICE_CONFIG,
} from '../services/vajraVoiceSettings';
import { LearnedPreference, UserCorrectionEvent } from '../services/vajraLearning';
import { SelfHealEvent } from '../services/vajraSelfHeal';
import { VajraSphere } from './VajraSphere';

interface CoreSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  appearance: VajraAppearanceConfig;
  onUpdateAppearance: (next: VajraAppearanceConfig) => void;
  onResetAppearance: () => void;
  memories: VajraMemoryItem[];
  onRefreshMemories: () => void;
  onOpenSetupWizard?: () => void;
  initialTab?: 'appearance' | 'memory' | 'voice' | 'intelligence' | 'release';
  isVoiceActivationEnabled?: boolean;
  onToggleVoiceActivation?: (enabled: boolean) => void;
  voiceConfig?: VajraVoiceConfig;
  onUpdateVoiceConfig?: (config: VajraVoiceConfig) => void;
  onPreviewVoice?: () => void;
  isConversationModeEnabled?: boolean;
  onToggleConversationMode?: (enabled: boolean) => void;
  isLearningEnabled?: boolean;
  onToggleLearning?: (enabled: boolean) => void;
  isSelfHealingEnabled?: boolean;
  onToggleSelfHealing?: (enabled: boolean) => void;
  learnedPreferences?: LearnedPreference[];
  recentCorrections?: UserCorrectionEvent[];
  selfHealEvents?: SelfHealEvent[];
  onClearLearnedPreferences?: () => void;
}

export const CoreSettingsModal: React.FC<CoreSettingsModalProps> = ({
  isOpen,
  onClose,
  appearance,
  onUpdateAppearance,
  onResetAppearance,
  memories,
  onRefreshMemories,
  onOpenSetupWizard,
  initialTab = 'appearance',
  isVoiceActivationEnabled = false,
  onToggleVoiceActivation,
  voiceConfig = DEFAULT_VOICE_CONFIG,
  onUpdateVoiceConfig,
  onPreviewVoice,
  isConversationModeEnabled = false,
  onToggleConversationMode,
  isLearningEnabled = true,
  onToggleLearning,
  isSelfHealingEnabled = true,
  onToggleSelfHealing,
  learnedPreferences = [],
  recentCorrections = [],
  selfHealEvents = [],
  onClearLearnedPreferences,
}) => {
  const [activeTab, setActiveTab] = useState<'appearance' | 'memory' | 'voice' | 'intelligence' | 'release'>(initialTab);

  // Sync activeTab when initialTab changes or modal opens
  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Voice inspection report
  const [availableVoicesReport, setAvailableVoicesReport] = useState(() => inspectAvailableVoices());
  React.useEffect(() => {
    if (isOpen) {
      setAvailableVoicesReport(inspectAvailableVoices());
    }
  }, [isOpen]);

  // Memory management state
  const [memoryFilter, setMemoryFilter] = useState<string>('all');
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newCategory, setNewCategory] = useState<MemoryCategory>('preference');
  const [showAddForm, setShowAddForm] = useState(false);
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  if (!isOpen) return null;

  const handleSetCoreTheme = (theme: CoreThemeId) => {
    const matchingAccent = getMatchingUiAccentForCoreTheme(theme);
    onUpdateAppearance({
      ...appearance,
      coreTheme: theme,
      uiAccentTheme: matchingAccent,
    });
  };

  const handleSetUiAccent = (accent: UiAccentId) => {
    onUpdateAppearance({
      ...appearance,
      uiAccentTheme: accent,
    });
  };

  const handleCustomCoreColor = (color: string) => {
    onUpdateAppearance({
      ...appearance,
      coreTheme: 'custom',
      customCoreColor: color,
      uiAccentTheme: 'custom',
      customUiColor: color,
    });
  };

  const handleCustomUiColor = (color: string) => {
    onUpdateAppearance({
      ...appearance,
      uiAccentTheme: 'custom',
      customUiColor: color,
    });
  };

  const handleAddMemorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim() || !newValue.trim()) return;

    addMemory({
      category: newCategory,
      key: newKey.trim(),
      value: newValue.trim(),
      pinned: false,
    });

    setNewKey('');
    setNewValue('');
    setShowAddForm(false);
    onRefreshMemories();
  };

  const handleDeleteMemory = (id: string) => {
    deleteMemory(id);
    onRefreshMemories();
  };

  const handleClearAll = () => {
    clearAllMemories();
    setConfirmClearAll(false);
    onRefreshMemories();
  };

  const filteredMemories = memories.filter((m) =>
    memoryFilter === 'all' ? true : m.category === memoryFilter
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-150 select-none">
      <div
        id="vajra-core-settings-modal"
        className="relative w-full max-w-2xl max-h-[92vh] flex flex-col bg-[#0b0104] border border-amber-500/50 rounded-2xl shadow-[0_0_50px_rgba(220,38,38,0.3)] overflow-hidden text-[#fef3c7]"
      >
        {/* Modal Top Header */}
        <div className="shrink-0 flex items-center justify-between px-5 py-3.5 border-b border-amber-900/60 bg-[#120207]/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-sm">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold font-hud tracking-widest text-amber-200 uppercase">
                VAJRA CORE &amp; SYSTEM SETTINGS
              </h3>
              <p className="text-[10px] font-mono text-amber-400/60">
                Aesthetic Lighting, UI Accents &amp; Persistent Memory
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-amber-400/70 hover:text-white hover:bg-amber-950/50 transition-colors cursor-pointer"
            aria-label="Close Settings"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="shrink-0 flex items-center border-b border-amber-900/50 bg-[#070002] px-4 pt-2 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('appearance')}
            className={`px-4 py-2 border-b-2 font-hud text-xs tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'appearance'
                ? 'border-amber-400 text-amber-200 font-bold bg-amber-500/10 rounded-t-lg'
                : 'border-transparent text-amber-400/60 hover:text-amber-200'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>ENERGY CORE &amp; UI</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('memory')}
            className={`px-4 py-2 border-b-2 font-hud text-xs tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'memory'
                ? 'border-amber-400 text-amber-200 font-bold bg-amber-500/10 rounded-t-lg'
                : 'border-transparent text-amber-400/60 hover:text-amber-200'
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>MEMORY SYSTEM ({memories.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('voice')}
            className={`px-4 py-2 border-b-2 font-hud text-xs tracking-wider flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'voice'
                ? 'border-amber-400 text-amber-200 font-bold bg-amber-500/10 rounded-t-lg'
                : 'border-transparent text-amber-400/60 hover:text-amber-200'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>VOICE &amp; TTS {isVoiceActivationEnabled ? '• ON' : ''}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('intelligence')}
            className={`px-4 py-2 border-b-2 font-hud text-xs tracking-wider flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'intelligence'
                ? 'border-amber-400 text-amber-200 font-bold bg-amber-500/10 rounded-t-lg'
                : 'border-transparent text-amber-400/60 hover:text-amber-200'
            }`}
          >
            <HeartPulse className="w-3.5 h-3.5 text-amber-400" />
            <span>INTELLIGENCE &amp; HEALING</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('release')}
            className={`px-4 py-2 border-b-2 font-hud text-xs tracking-wider flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'release'
                ? 'border-amber-400 text-amber-200 font-bold bg-amber-500/10 rounded-t-lg'
                : 'border-transparent text-amber-400/60 hover:text-amber-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-amber-400" />
            <span>ANDROID RELEASE &amp; APK</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 min-h-0 space-y-5">
          {activeTab === 'appearance' ? (
            /* =============================================================== */
            /* TAB 1: APPEARANCE & CORE LIGHTING                               */
            /* =============================================================== */
            <div className="space-y-6">
              {/* Live Real-Time Core Preview Header */}
              <div className="p-4 rounded-xl bg-[#140206] border border-amber-500/30 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 shrink-0 flex items-center justify-center">
                    <VajraSphere
                      size="sm"
                      state="idle"
                      coreTheme={appearance.coreTheme}
                      customCoreColor={appearance.customCoreColor}
                      showRings={false}
                    />
                  </div>
                  <div>
                    <div className="text-xs font-hud font-bold text-amber-200 tracking-wider">
                      ACTIVE CORE PREVIEW
                    </div>
                    <div className="text-[11px] font-mono text-amber-400/80">
                      Core:{' '}
                      <span className="text-white font-bold">
                        {appearance.coreTheme === 'custom'
                          ? `Custom (${appearance.customCoreColor})`
                          : CORE_THEMES[appearance.coreTheme]?.name}
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-amber-400/80">
                      UI Accent:{' '}
                      <span className="text-white font-bold">
                        {appearance.uiAccentTheme === 'custom'
                          ? `Custom (${appearance.customUiColor})`
                          : UI_ACCENTS[appearance.uiAccentTheme]?.name}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onResetAppearance}
                  className="px-3 py-1.5 rounded-lg bg-[#1e040b] hover:bg-[#2c0813] border border-amber-500/40 text-amber-300 hover:text-white text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Restore default Crimson & Gold"
                >
                  <RotateCcw className="w-3 h-3 text-amber-400" />
                  <span>Reset to Default</span>
                </button>
              </div>

              {/* SECTION 1: Energy Core Theme (7 Themes + Custom) */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-hud font-bold text-amber-300 tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    ENERGY CORE COLOR THEMES
                  </span>
                  <span className="text-[10px] font-mono text-amber-400/60">
                    7 Presets + Custom
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(Object.keys(CORE_THEMES) as (keyof typeof CORE_THEMES)[]).map((themeKey) => {
                    const theme = CORE_THEMES[themeKey];
                    const isSelected = appearance.coreTheme === themeKey;
                    return (
                      <button
                        key={themeKey}
                        type="button"
                        onClick={() => handleSetCoreTheme(themeKey)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-400 ring-1 ring-amber-400/50 shadow-md'
                            : 'bg-[#120207] border-amber-900/40 hover:border-amber-500/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-bold text-amber-100 truncate">
                            {theme.name}
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                        </div>
                        {/* 3 Color swatch dots */}
                        <div className="flex items-center gap-1.5">
                          {theme.previewColors.map((c, i) => (
                            <span
                              key={i}
                              className="w-3.5 h-3.5 rounded-full border border-black/40 shadow-sm"
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>
                      </button>
                    );
                  })}

                  {/* Custom Core Color Option */}
                  <div
                    className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-1.5 ${
                      appearance.coreTheme === 'custom'
                        ? 'bg-amber-500/20 border-amber-400 ring-1 ring-amber-400/50 shadow-md'
                        : 'bg-[#120207] border-amber-900/40 hover:border-amber-500/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-amber-100">
                        Custom Color
                      </span>
                      {appearance.coreTheme === 'custom' && (
                        <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={appearance.customCoreColor}
                        onChange={(e) => handleCustomCoreColor(e.target.value)}
                        className="w-7 h-7 rounded border border-amber-500/40 bg-transparent cursor-pointer"
                        title="Pick custom core color"
                      />
                      <span className="text-[10px] font-mono text-amber-300">
                        {appearance.customCoreColor.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 2: UI Accent Theme (7 Accents + Custom) */}
              <div className="space-y-2.5 pt-2 border-t border-amber-900/50">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-hud font-bold text-amber-300 tracking-wider flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-amber-400" />
                    UI ACCENT THEMES
                  </span>
                  <span className="text-[10px] font-mono text-amber-400/60">
                    Borders &amp; Highlights
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(Object.keys(UI_ACCENTS) as (keyof typeof UI_ACCENTS)[]).map((accentKey) => {
                    const accent = UI_ACCENTS[accentKey];
                    const isSelected = appearance.uiAccentTheme === accentKey;
                    return (
                      <button
                        key={accentKey}
                        type="button"
                        onClick={() => handleSetUiAccent(accentKey)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-400 ring-1 ring-amber-400/50 shadow-md'
                            : 'bg-[#120207] border-amber-900/40 hover:border-amber-500/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-bold text-amber-100 truncate">
                            {accent.name}
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className="w-4 h-4 rounded-full border border-black/40 shadow-sm"
                            style={{ backgroundColor: accent.primaryHex }}
                          />
                          <span className="text-[10px] font-mono text-amber-400/70">
                            {accent.primaryHex}
                          </span>
                        </div>
                      </button>
                    );
                  })}

                  {/* Custom UI Color Option */}
                  <div
                    className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-1.5 ${
                      appearance.uiAccentTheme === 'custom'
                        ? 'bg-amber-500/20 border-amber-400 ring-1 ring-amber-400/50 shadow-md'
                        : 'bg-[#120207] border-amber-900/40 hover:border-amber-500/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-amber-100">
                        Custom Accent
                      </span>
                      {appearance.uiAccentTheme === 'custom' && (
                        <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={appearance.customUiColor}
                        onChange={(e) => handleCustomUiColor(e.target.value)}
                        className="w-7 h-7 rounded border border-amber-500/40 bg-transparent cursor-pointer"
                        title="Pick custom UI accent color"
                      />
                      <span className="text-[10px] font-mono text-amber-300">
                        {appearance.customUiColor.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Setup Wizard Access Option */}
              {onOpenSetupWizard && (
                <div className="pt-3 border-t border-amber-900/50 flex items-center justify-between bg-[#120308]/60 p-3 rounded-xl border border-amber-900/40">
                  <div>
                    <div className="text-xs font-hud font-bold text-amber-200">
                      SYSTEM ONBOARDING WIZARD
                    </div>
                    <div className="text-[10px] font-mono text-amber-400/60">
                      Re-run initial 7-step hardware &amp; voice setup anytime
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenSetupWizard();
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-[#1e040b] hover:bg-[#2c0813] border border-amber-500/40 text-amber-300 hover:text-white text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Wrench className="w-3.5 h-3.5 text-amber-400" />
                    <span>Run Setup Wizard</span>
                  </button>
                </div>
              )}
            </div>
          ) : activeTab === 'memory' ? (
            /* =============================================================== */
            /* TAB 2: PERSISTENT MEMORY SYSTEM                                 */
            /* =============================================================== */
            <div className="space-y-4">
              {/* Memory Summary & Actions Bar */}
              <div className="p-3.5 rounded-xl bg-[#140206] border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-hud font-bold text-amber-200 tracking-wider">
                      PERSISTENT MEMORY MATRIX
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-300 font-bold">
                      {memories.length} / 50 ITEMS
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-amber-400/70 mt-1">
                    Structured user directives &amp; context memories survive restarts.
                  </p>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-yellow-400 hover:to-amber-400 text-black font-bold font-mono text-xs transition-colors flex items-center gap-1 shadow-sm cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Memory</span>
                  </button>

                  {memories.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setConfirmClearAll(true)}
                      className="px-2.5 py-1.5 rounded-xl bg-red-950/50 hover:bg-red-900/60 border border-red-600/50 text-red-300 hover:text-white text-xs font-mono transition-colors flex items-center gap-1 cursor-pointer"
                      title="Clear All Memories"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Clear All</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Confirm Clear All Dialog */}
              {confirmClearAll && (
                <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/80 flex items-center justify-between gap-3 animate-in fade-in">
                  <div className="flex items-center gap-2 text-xs font-mono text-red-200">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>Are you sure you want to delete all stored user memories?</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleClearAll}
                      className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold transition-colors cursor-pointer"
                    >
                      Yes, Clear All
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmClearAll(false)}
                      className="px-2.5 py-1 rounded-lg bg-[#140206] text-amber-300 font-mono text-xs hover:bg-[#20050d] transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Add Memory Form */}
              {showAddForm && (
                <form
                  onSubmit={handleAddMemorySubmit}
                  className="p-3.5 rounded-xl bg-[#180309] border border-amber-500/40 space-y-3 animate-in fade-in"
                >
                  <div className="text-xs font-hud font-bold text-amber-200 tracking-wider">
                    NEW MEMORY DIRECTIVE
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-mono text-amber-400/80 mb-1">
                        CATEGORY
                      </label>
                      <select
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value as MemoryCategory)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-[#0e0104] border border-amber-500/30 text-amber-200 text-xs font-mono focus:outline-none focus:border-amber-400 cursor-pointer"
                      >
                        <option value="preference">Preference</option>
                        <option value="directive">Directive</option>
                        <option value="context">Context</option>
                        <option value="fact">Fact</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-mono text-amber-400/80 mb-1">
                        LABEL / KEY
                      </label>
                      <input
                        type="text"
                        value={newKey}
                        onChange={(e) => setNewKey(e.target.value)}
                        placeholder="e.g. Favorite Coding Language"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-[#0e0104] border border-amber-500/30 text-amber-200 text-xs font-mono focus:outline-none focus:border-amber-400"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-amber-400/80 mb-1">
                      VALUE / INSTRUCTION
                    </label>
                    <textarea
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                      placeholder="e.g. User prefers concise TypeScript answers with functional patterns."
                      rows={2}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[#0e0104] border border-amber-500/30 text-amber-200 text-xs font-mono focus:outline-none focus:border-amber-400 resize-none"
                      required
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="px-3 py-1 rounded-lg bg-[#0e0104] hover:bg-[#1a0208] text-amber-300 text-xs font-mono cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold font-mono text-xs transition-colors cursor-pointer"
                    >
                      Save Memory
                    </button>
                  </div>
                </form>
              )}

              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] font-mono">
                {['all', 'preference', 'directive', 'context', 'fact'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setMemoryFilter(cat)}
                    className={`px-2.5 py-1 rounded-lg border transition-all cursor-pointer capitalize ${
                      memoryFilter === cat
                        ? 'bg-amber-500/20 border-amber-400 text-amber-200 font-bold'
                        : 'bg-[#100206] border-amber-900/40 text-amber-400/60 hover:text-amber-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Memory Items List */}
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {filteredMemories.length === 0 ? (
                  <div className="p-6 text-center rounded-xl bg-[#100206] border border-amber-900/40 text-xs font-mono text-amber-400/60">
                    No memories found in this category.
                  </div>
                ) : (
                  filteredMemories.map((m) => (
                    <div
                      key={m.id}
                      className="p-3 rounded-xl bg-[#120207] border border-amber-500/20 hover:border-amber-500/40 flex items-start justify-between gap-3 transition-colors group"
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[9px] font-mono px-2 py-0.5 rounded uppercase font-bold tracking-wider bg-amber-950/80 border border-amber-600/40 text-amber-300">
                            {m.category}
                          </span>
                          <span className="text-xs font-mono font-bold text-amber-100">
                            {m.key}
                          </span>
                          <span className="text-[10px] font-mono text-amber-500/60 ml-auto">
                            {new Date(m.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs font-mono text-amber-200/90 leading-relaxed break-words">
                          {m.value}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteMemory(m.id)}
                        className="p-1.5 rounded-lg text-amber-500/40 hover:text-red-300 hover:bg-red-950/50 transition-colors shrink-0 cursor-pointer"
                        title="Delete this memory"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Memory Safety Notice */}
              <div className="p-2.5 rounded-xl bg-[#080103] border border-amber-900/40 text-[10px] font-mono text-amber-400/70 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Privacy Shield: All memories are stored exclusively in your local browser storage.
                  Passwords, API keys, and sensitive tokens are strictly rejected and never saved.
                </span>
              </div>
            </div>
          ) : activeTab === 'voice' ? (
            /* =============================================================== */
            /* TAB 3: VOICE & TTS SETTINGS                                     */
            /* =============================================================== */
            <div className="space-y-6">
              {/* Voice Activation Master Toggle Card */}
              <div className="p-4 rounded-xl bg-[#140206] border border-amber-500/40 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-hud text-sm font-bold text-amber-200">
                      VOICE ACTIVATION ("HELLO VAJRA")
                    </span>
                    <span
                      className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                        isVoiceActivationEnabled
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/60'
                          : 'bg-stone-900 text-stone-400 border border-stone-700'
                      }`}
                    >
                      {isVoiceActivationEnabled ? 'ENABLED' : 'DISABLED'}
                    </span>
                  </div>
                  <p className="text-xs font-mono text-amber-400/70 leading-relaxed">
                    Awaken VAJRA hands-free by saying "Hello Vajra". Defaults to OFF to conserve battery and protect privacy.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onToggleVoiceActivation?.(!isVoiceActivationEnabled)}
                  className={`px-4 py-2 rounded-xl font-hud text-xs tracking-wider font-bold transition-all shadow-md cursor-pointer shrink-0 ${
                    isVoiceActivationEnabled
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-black'
                      : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40'
                  }`}
                >
                  {isVoiceActivationEnabled ? 'TURN OFF' : 'TURN ON'}
                </button>
              </div>

              {/* VAJRA Voice Gender Selection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-hud font-bold text-amber-300 tracking-wider flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-amber-400" />
                    VAJRA VOICE SELECTION
                  </h4>
                  <span className="text-[10px] font-mono text-amber-500/70">
                    {availableVoicesReport.totalVoices} system TTS voices detected
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    {
                      id: 'female' as VoiceGenderSelection,
                      label: 'Female Voice',
                      available: availableVoicesReport.availableGenders.female,
                      desc: availableVoicesReport.femaleVoiceName || 'Default Female Synthesizer',
                    },
                    {
                      id: 'male' as VoiceGenderSelection,
                      label: 'Male Voice',
                      available: availableVoicesReport.availableGenders.male,
                      desc: availableVoicesReport.maleVoiceName || 'Default Male Synthesizer',
                    },
                    {
                      id: 'system' as VoiceGenderSelection,
                      label: 'System Default',
                      available: true,
                      desc: availableVoicesReport.defaultVoiceName || 'Android / OS Default',
                    },
                  ].map((item) => {
                    const isSelected = voiceConfig.gender === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => onUpdateVoiceConfig?.({ ...voiceConfig, gender: item.id })}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer space-y-1.5 ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-400 text-amber-100 shadow-md ring-1 ring-amber-400/40'
                            : 'bg-[#100206] border-amber-900/40 text-amber-400/70 hover:border-amber-500/40 hover:text-amber-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-hud font-bold text-xs">{item.label}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-amber-300" />}
                        </div>
                        <p className="text-[10px] font-mono truncate text-amber-400/60">
                          {item.desc}
                        </p>
                        {!item.available && (
                          <span className="inline-block text-[8px] font-mono px-1.5 py-0.5 rounded bg-amber-950/90 text-amber-400 border border-amber-700/40">
                            Fallback Active
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Voice Fallback Indicator Card if fallback active */}
                {(() => {
                  const resolved = resolveEffectiveVoice('en-US', voiceConfig);
                  if (resolved.isFallback) {
                    return (
                      <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-[11px] font-mono text-amber-300/80 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>
                          Notice: {resolved.fallbackReason || `Requested ${voiceConfig.gender} voice not natively installed; using ${resolved.voiceName}.`}
                        </span>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>

              {/* Voice Speed & Pitch Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Speed Selection */}
                <div className="space-y-2 p-3.5 rounded-xl bg-[#100206] border border-amber-500/20">
                  <label className="text-xs font-hud font-bold text-amber-300 tracking-wider block">
                    SPEECH SPEED
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['slow', 'normal', 'fast'] as VoiceSpeedSelection[]).map((spd) => (
                      <button
                        key={spd}
                        type="button"
                        onClick={() => onUpdateVoiceConfig?.({ ...voiceConfig, speed: spd })}
                        className={`py-1.5 rounded-lg font-mono text-xs capitalize cursor-pointer transition-all border ${
                          voiceConfig.speed === spd
                            ? 'bg-amber-500 text-black font-bold border-amber-400'
                            : 'bg-[#180309] text-amber-400/70 border-amber-900/40 hover:text-amber-200'
                        }`}
                      >
                        {spd}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Pitch Selection */}
                <div className="space-y-2 p-3.5 rounded-xl bg-[#100206] border border-amber-500/20">
                  <label className="text-xs font-hud font-bold text-amber-300 tracking-wider block">
                    SPEECH PITCH
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['low', 'natural', 'high'] as VoicePitchSelection[]).map((pch) => (
                      <button
                        key={pch}
                        type="button"
                        onClick={() => onUpdateVoiceConfig?.({ ...voiceConfig, pitch: pch })}
                        className={`py-1.5 rounded-lg font-mono text-xs capitalize cursor-pointer transition-all border ${
                          voiceConfig.pitch === pch
                            ? 'bg-amber-500 text-black font-bold border-amber-400'
                            : 'bg-[#180309] text-amber-400/70 border-amber-900/40 hover:text-amber-200'
                        }`}
                      >
                        {pch}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Voice Preview Button Card */}
              <div className="p-3.5 rounded-xl bg-[#140206] border border-amber-500/30 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <span className="font-hud font-bold text-xs text-amber-200">
                    PREVIEW SELECTED VOICE
                  </span>
                  <p className="text-[11px] font-mono text-amber-400/60">
                    "Hello, I’m Vajra. How can I help you today?"
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onPreviewVoice}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-yellow-400 hover:to-amber-400 text-black font-hud text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-2 shrink-0"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>PREVIEW</span>
                </button>
              </div>

              {/* Supported Wake Phrases */}
              <div className="space-y-2">
                <h4 className="text-xs font-hud font-bold text-amber-300 tracking-wider flex items-center gap-2">
                  <Radio className="w-4 h-4 text-amber-400" />
                  SUPPORTED WAKE PHRASES
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { phrase: 'Hello Vajra', role: 'Primary Wake Phrase', tag: 'RECOMMENDED' },
                    { phrase: 'Hey Vajra', role: 'Natural Variant', tag: 'SUPPORTED' },
                    { phrase: 'Hi Vajra', role: 'Natural Variant', tag: 'SUPPORTED' },
                  ].map((item) => (
                    <div
                      key={item.phrase}
                      className="p-3 rounded-xl bg-[#100206] border border-amber-500/20 space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-hud font-bold text-amber-100 text-xs">"{item.phrase}"</span>
                        <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-600/40">
                          {item.tag}
                        </span>
                      </div>
                      <p className="text-[10px] font-mono text-amber-400/60">{item.role}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Privacy Notice */}
              <div className="p-2.5 rounded-xl bg-[#080103] border border-amber-900/40 text-[10px] font-mono text-amber-400/70 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Privacy Guarantee: Microphone access is strictly opt-in. Audio is processed on-device. No audio is recorded or streamed when Voice Activation is OFF.
                </span>
              </div>
            </div>
          ) : activeTab === 'intelligence' ? (
            /* =============================================================== */
            /* TAB 4: INTELLIGENCE, SELF-HEALING & CONVERSATION                */
            /* =============================================================== */
            <div className="space-y-6">
              {/* Continuous Conversation Mode Toggle */}
              <div className="p-4 rounded-xl bg-[#140206] border border-amber-500/40 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-hud text-sm font-bold text-amber-200">
                      CONTINUOUS CONVERSATION MODE
                    </span>
                    <span
                      className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                        isConversationModeEnabled
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/60'
                          : 'bg-stone-900 text-stone-400 border border-stone-700'
                      }`}
                    >
                      {isConversationModeEnabled ? 'ACTIVE' : 'OFF'}
                    </span>
                  </div>
                  <p className="text-xs font-mono text-amber-400/70 leading-relaxed">
                    Automatically listens for conversational follow-ups after speaking responses without re-triggering wake phrases. Bounded by an 8-second inactivity timeout.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onToggleConversationMode?.(!isConversationModeEnabled)}
                  className={`px-4 py-2 rounded-xl font-hud text-xs tracking-wider font-bold transition-all shadow-md cursor-pointer shrink-0 ${
                    isConversationModeEnabled
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-black'
                      : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40'
                  }`}
                >
                  {isConversationModeEnabled ? 'DISABLE' : 'ENABLE'}
                </button>
              </div>

              {/* Master Toggles: Self-Healing & Adaptive Learning */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Self-Healing Card */}
                <div className="p-3.5 rounded-xl bg-[#100206] border border-amber-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-hud font-bold text-xs text-amber-200">
                      <HeartPulse className="w-3.5 h-3.5 text-red-400" />
                      <span>SELF-HEALING ENGINE</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onToggleSelfHealing?.(!isSelfHealingEnabled)}
                      className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold cursor-pointer ${
                        isSelfHealingEnabled
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/60'
                          : 'bg-stone-900 text-stone-400 border border-stone-700'
                      }`}
                    >
                      {isSelfHealingEnabled ? 'ON' : 'OFF'}
                    </button>
                  </div>
                  <p className="text-[11px] font-mono text-amber-400/60 leading-relaxed">
                    Automatically detects, isolates, and recovers speech recognizer, TTS, or network errors with bounded retry limits.
                  </p>
                </div>

                {/* Adaptive Learning Card */}
                <div className="p-3.5 rounded-xl bg-[#100206] border border-amber-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-hud font-bold text-xs text-amber-200">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>ADAPTIVE LEARNING</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onToggleLearning?.(!isLearningEnabled)}
                      className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold cursor-pointer ${
                        isLearningEnabled
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/60'
                          : 'bg-stone-900 text-stone-400 border border-stone-700'
                      }`}
                    >
                      {isLearningEnabled ? 'ON' : 'OFF'}
                    </button>
                  </div>
                  <p className="text-[11px] font-mono text-amber-400/60 leading-relaxed">
                    Learns verified interaction preferences & corrections with high confidence (&ge; 80%). Never stores credentials or raw audio.
                  </p>
                </div>
              </div>

              {/* Learned Preferences Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-hud font-bold text-amber-300 tracking-wider flex items-center gap-2">
                    <Brain className="w-3.5 h-3.5 text-amber-400" />
                    LEARNED PREFERENCES ({learnedPreferences.length})
                  </h4>
                  {learnedPreferences.length > 0 && (
                    <button
                      type="button"
                      onClick={onClearLearnedPreferences}
                      className="px-2 py-1 rounded bg-red-950/60 hover:bg-red-900 text-red-300 text-[10px] font-mono border border-red-800/40 cursor-pointer"
                    >
                      Clear Preferences
                    </button>
                  )}
                </div>

                {learnedPreferences.length === 0 ? (
                  <div className="p-4 rounded-xl bg-[#100206] border border-amber-900/40 text-center text-xs font-mono text-amber-400/60">
                    No preferences learned yet. Say corrections like "Short answer" or "Speak Hindi" to adapt VAJRA.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {learnedPreferences.map((lp) => (
                      <div
                        key={lp.key}
                        className="p-2.5 rounded-xl bg-[#100206] border border-amber-500/20 flex items-center justify-between text-xs font-mono"
                      >
                        <div className="space-y-0.5">
                          <span className="font-bold text-amber-200">{lp.key}:</span>{' '}
                          <span className="text-amber-300">{lp.value}</span>
                          <div className="text-[10px] text-amber-500/60">
                            Confidence: {Math.round(lp.confidence * 100)}% • Frequency: {lp.frequency}x
                          </div>
                        </div>
                        <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-700/40">
                          {lp.category}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Self-Heal Recovery History */}
              <div className="space-y-2">
                <h4 className="text-xs font-hud font-bold text-amber-300 tracking-wider flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  SELF-HEAL RECOVERY EVENTS ({selfHealEvents.length})
                </h4>

                {selfHealEvents.length === 0 ? (
                  <div className="p-3.5 rounded-xl bg-[#100206] border border-amber-900/40 text-center text-xs font-mono text-amber-400/60">
                    All core systems nominal. Zero anomalous recovery events recorded.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                    {selfHealEvents.map((ev) => (
                      <div
                        key={ev.id}
                        className={`p-2.5 rounded-xl border text-xs font-mono space-y-0.5 ${
                          ev.success
                            ? 'bg-[#0e160e] border-emerald-500/30 text-emerald-200'
                            : 'bg-[#180a0a] border-red-500/30 text-red-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold">{ev.category}</span>
                          <span className="text-[10px] opacity-70">
                            {new Date(ev.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-[11px] opacity-90">{ev.userMessage}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Safety & Anti-Slop Notice */}
              <div className="p-2.5 rounded-xl bg-[#080103] border border-amber-900/40 text-[10px] font-mono text-amber-400/70 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Safety Shield: Learning and Self-Healing operate within strict local sandbox boundaries. Sensitive credentials, passwords, and tokens are permanently rejected and never saved.
                </span>
              </div>
            </div>
          ) : (
            /* =============================================================== */
            /* TAB 5: ANDROID RELEASE & APK ARTIFACT                           */
            /* =============================================================== */
            <div className="space-y-5">
              {/* Release Card & Direct Download Header */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-[#1b030b] via-[#120206] to-[#0a0103] border border-amber-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg shadow-amber-950/20">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-hud font-bold text-amber-200 tracking-wider">
                      VAJRA MOBILE NATIVE ANDROID ARTIFACT
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-bold">
                      READY FOR INSTALL
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-amber-400/70">
                    Standard standalone debug APK compiled and synchronized with Capacitor native wrapper.
                  </p>
                </div>

                <a
                  href="/app-debug.apk"
                  download="vajra-mobile-debug.apk"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-black font-bold font-mono text-xs flex items-center gap-2 transition-all shadow-md shrink-0 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download APK (5.0 MB)</span>
                </a>
              </div>

              {/* Technical Specifications Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3 rounded-xl bg-[#120206] border border-amber-500/30 space-y-1.5">
                  <div className="text-[10px] text-amber-500/80 uppercase font-bold">Application Package</div>
                  <div className="text-amber-200 font-bold">com.vajra.mobile</div>
                  <div className="text-[11px] text-amber-400/70">Version 1.0 (versionCode 1)</div>
                </div>

                <div className="p-3 rounded-xl bg-[#120206] border border-amber-500/30 space-y-1.5">
                  <div className="text-[10px] text-amber-500/80 uppercase font-bold">Target & Min Android SDK</div>
                  <div className="text-amber-200 font-bold">Target: Android 16 (API 36)</div>
                  <div className="text-[11px] text-amber-400/70">Minimum: Android 7.0 (API 24)</div>
                </div>

                <div className="p-3 rounded-xl bg-[#120206] border border-amber-500/30 space-y-1.5">
                  <div className="text-[10px] text-amber-500/80 uppercase font-bold">Signature Verification</div>
                  <div className="text-emerald-300 font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>APK Signature Scheme v2 (Debug Key)</span>
                  </div>
                  <div className="text-[10px] text-amber-400/60">Verified with apksigner</div>
                </div>

                <div className="p-3 rounded-xl bg-[#120206] border border-amber-500/30 space-y-1.5">
                  <div className="text-[10px] text-amber-500/80 uppercase font-bold">Declared Permissions</div>
                  <div className="text-amber-200 font-bold">RECORD_AUDIO • INTERNET</div>
                  <div className="text-[10px] text-amber-400/60">MODIFY_AUDIO_SETTINGS</div>
                </div>
              </div>

              {/* Checksum & Path Panel */}
              <div className="p-3.5 rounded-xl bg-[#0e0206] border border-amber-900/50 space-y-2 text-xs font-mono">
                <div className="text-[10px] uppercase tracking-wider text-amber-500/80 font-bold">
                  Integrity SHA-256 Checksum
                </div>
                <div className="p-2 rounded bg-black/60 border border-amber-500/20 text-amber-300 text-[11px] break-all select-all">
                  560532ec6e64d62595f31c4d63f8f3fc5265043e4405927689a8e64f4811de23
                </div>
                <div className="text-[10px] text-amber-400/60 flex items-center justify-between">
                  <span>Artifact location: android/app/build/outputs/apk/debug/app-debug.apk</span>
                  <span>5,202,479 bytes</span>
                </div>
              </div>

              {/* Device Validation Status Matrix */}
              <div className="space-y-2">
                <h4 className="text-xs font-hud font-bold text-amber-300 tracking-wider">
                  VALIDATION &amp; TEST STATUS MATRIX
                </h4>
                <div className="space-y-1.5 text-xs font-mono">
                  <div className="p-2.5 rounded-lg bg-[#120308] border border-emerald-500/30 flex items-center justify-between">
                    <span className="text-amber-200">Automated Regression Test Suite (163 tests)</span>
                    <span className="text-emerald-400 font-bold text-[10px] px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40">
                      163 / 163 PASSED
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#120308] border border-emerald-500/30 flex items-center justify-between">
                    <span className="text-amber-200">Native Gradle Compilation &amp; v2 Signing</span>
                    <span className="text-emerald-400 font-bold text-[10px] px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40">
                      VERIFIED (BUILD SUCCESSFUL)
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#180808] border border-amber-600/30 flex items-center justify-between">
                    <span className="text-amber-200">Physical Android Phone Testing (Microphone / Acoustic Wake)</span>
                    <span className="text-amber-400 font-bold text-[10px] px-2 py-0.5 rounded bg-amber-950/80 border border-amber-500/40">
                      NOT VERIFIED (Requires Real Phone)
                    </span>
                  </div>
                </div>
              </div>

              {/* Step-by-Step Installation Guide */}
              <div className="p-3.5 rounded-xl bg-[#140206] border border-amber-500/30 space-y-2 text-xs font-mono text-amber-200/90">
                <div className="text-[10px] uppercase font-bold text-amber-400">
                  How to install on your Android phone:
                </div>
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-amber-300/80">
                  <li>Tap the <strong>Download APK</strong> button above to download <code className="text-amber-200">vajra-mobile-debug.apk</code> directly to your device.</li>
                  <li>Open the downloaded APK on your phone and allow <em>Install unknown apps</em> if prompted.</li>
                  <li>Launch <strong>VAJRA</strong>, grant the Microphone permission prompt, and say <em>"Hello Vajra"</em> to awaken the assistant.</li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Footer */}
        <div className="shrink-0 flex items-center justify-between px-5 py-3 border-t border-amber-900/60 bg-[#0e0104]">
          <span className="text-[10px] font-mono text-amber-500/70">
            VAJRA Neural Matrix v3.5 • All changes saved automatically
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-black font-bold font-mono text-xs transition-colors shadow-md cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
