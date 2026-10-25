/**
 * VAJRA Mobile — Voice Settings & TTS Synthesis Layer
 * 
 * Manages voice gender selection (Female / Male / System Default),
 * speech rate/speed, pitch, installed TTS voices inspection,
 * language-aware voice fallback (Hindi / English / Hinglish),
 * and audio preview.
 * 
 * Strict Rules:
 * - Never fake voice gender. Only select voices that actually exist.
 * - If requested voice is unavailable, gracefully fall back and indicate fallback.
 * - Persist configuration across app restarts.
 * - Reuse existing browser / Android WebView SpeechSynthesis engine.
 */

export type VoiceGenderSelection = 'female' | 'male' | 'system';
export type VoiceSpeedSelection = 'slow' | 'normal' | 'fast';
export type VoicePitchSelection = 'low' | 'natural' | 'high';

export interface VajraVoiceConfig {
  gender: VoiceGenderSelection;
  speed: VoiceSpeedSelection;
  pitch: VoicePitchSelection;
  selectedVoiceURI?: string;
}

export interface ResolvedVoiceResult {
  voice: SpeechSynthesisVoice | null;
  voiceName: string;
  isFallback: boolean;
  fallbackReason?: string;
  rate: number;
  pitch: number;
  lang: string;
}

export interface AvailableVoicesReport {
  totalVoices: number;
  availableGenders: {
    female: boolean;
    male: boolean;
    system: boolean;
  };
  hasHindiVoice: boolean;
  hasEnglishVoice: boolean;
  femaleVoiceName?: string;
  maleVoiceName?: string;
  defaultVoiceName?: string;
  voicesList: Array<{ name: string; lang: string; genderGuess?: VoiceGenderSelection }>;
}

export const STORAGE_KEY_VOICE_CONFIG = 'vajra_voice_settings';

export const DEFAULT_VOICE_CONFIG: VajraVoiceConfig = {
  gender: 'female',
  speed: 'normal',
  pitch: 'natural',
};

// Known gender indicator tokens in voice names / URIs
const FEMALE_INDICATORS = [
  'female', 'woman', 'girl', 'zira', 'samantha', 'victoria', 'karen',
  'moira', 'fiona', 'tessa', 'veena', 'anjali', 'lekha', 'google हिन्दी',
  'hi-in-x-hie-local', 'hi-in-x-hie-network', 'en-us-x-sfg-local',
  'en-us-x-sfg-network', 'cortana', 'eva', 'serena', 'lucia', 'maria',
];

const MALE_INDICATORS = [
  'male', 'man', 'boy', 'david', 'mark', 'george', 'alex', 'daniel',
  'oliver', 'rishi', 'hi-in-x-hid-local', 'hi-in-x-hid-network',
  'en-us-x-iom-local', 'en-us-x-iom-network', 'guy', 'ravi',
];

/**
 * Heuristically detects voice gender from voice name and attributes.
 */
export function detectVoiceGender(voice: SpeechSynthesisVoice): VoiceGenderSelection {
  const lower = (voice.name + ' ' + (voice.voiceURI || '')).toLowerCase();
  for (const token of FEMALE_INDICATORS) {
    if (lower.includes(token)) return 'female';
  }
  for (const token of MALE_INDICATORS) {
    if (lower.includes(token)) return 'male';
  }
  return 'system';
}

/**
 * Maps speed enum to SpeechSynthesisUtterance rate value (0.1 to 10).
 */
export function getRateMultiplier(speed: VoiceSpeedSelection): number {
  switch (speed) {
    case 'slow':
      return 0.85;
    case 'fast':
      return 1.2;
    case 'normal':
    default:
      return 1.0;
  }
}

/**
 * Maps pitch enum to SpeechSynthesisUtterance pitch value (0 to 2).
 */
export function getPitchMultiplier(pitch: VoicePitchSelection): number {
  switch (pitch) {
    case 'low':
      return 0.85;
    case 'high':
      return 1.15;
    case 'natural':
    default:
      return 1.0;
  }
}

let inMemoryVoiceConfig: VajraVoiceConfig | null = null;

/**
 * Load persisted voice configuration.
 */
export function loadPersistedVoiceConfig(): VajraVoiceConfig {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return inMemoryVoiceConfig ? { ...inMemoryVoiceConfig } : { ...DEFAULT_VOICE_CONFIG };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY_VOICE_CONFIG);
    if (!raw) return inMemoryVoiceConfig ? { ...inMemoryVoiceConfig } : { ...DEFAULT_VOICE_CONFIG };
    const parsed = JSON.parse(raw);
    return {
      gender: ['female', 'male', 'system'].includes(parsed.gender) ? parsed.gender : 'female',
      speed: ['slow', 'normal', 'fast'].includes(parsed.speed) ? parsed.speed : 'normal',
      pitch: ['low', 'natural', 'high'].includes(parsed.pitch) ? parsed.pitch : 'natural',
      selectedVoiceURI: parsed.selectedVoiceURI || undefined,
    };
  } catch {
    return inMemoryVoiceConfig ? { ...inMemoryVoiceConfig } : { ...DEFAULT_VOICE_CONFIG };
  }
}

/**
 * Save voice configuration to localStorage.
 */
export function savePersistedVoiceConfig(config: VajraVoiceConfig): void {
  inMemoryVoiceConfig = { ...config };
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_VOICE_CONFIG, JSON.stringify(config));
  } catch (err) {
    console.warn('[VajraVoiceSettings] Failed to persist voice config:', err);
  }
}

/**
 * Inspects all installed Android / Browser TTS voices.
 */
export function inspectAvailableVoices(): AvailableVoicesReport {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    return {
      totalVoices: 0,
      availableGenders: { female: false, male: false, system: false },
      hasHindiVoice: false,
      hasEnglishVoice: false,
      voicesList: [],
    };
  }

  const voices = window.speechSynthesis.getVoices ? window.speechSynthesis.getVoices() : [];
  let femaleVoice: SpeechSynthesisVoice | undefined;
  let maleVoice: SpeechSynthesisVoice | undefined;
  let defaultVoice: SpeechSynthesisVoice | undefined;
  let hasHindi = false;
  let hasEnglish = false;

  const voicesList = voices.map((v) => {
    const gender = detectVoiceGender(v);
    const langLower = v.lang.toLowerCase();
    if (langLower.startsWith('hi')) hasHindi = true;
    if (langLower.startsWith('en')) hasEnglish = true;
    if (v.default && !defaultVoice) defaultVoice = v;
    if (gender === 'female' && !femaleVoice) femaleVoice = v;
    if (gender === 'male' && !maleVoice) maleVoice = v;

    return {
      name: v.name,
      lang: v.lang,
      genderGuess: gender,
    };
  });

  return {
    totalVoices: voices.length,
    availableGenders: {
      female: Boolean(femaleVoice),
      male: Boolean(maleVoice),
      system: voices.length > 0,
    },
    hasHindiVoice: hasHindi,
    hasEnglishVoice: hasEnglish,
    femaleVoiceName: femaleVoice?.name,
    maleVoiceName: maleVoice?.name,
    defaultVoiceName: defaultVoice?.name || voices[0]?.name,
    voicesList,
  };
}

/**
 * Resolves the genuine available TTS voice matching user preference and language.
 * Never fakes availability: if requested gender is unavailable, falls back gracefully
 * and flags isFallback: true with explanation.
 */
export function resolveEffectiveVoice(
  targetLanguage = 'en-US',
  config: VajraVoiceConfig = DEFAULT_VOICE_CONFIG,
  voicesOverride?: SpeechSynthesisVoice[]
): ResolvedVoiceResult {
  const rate = getRateMultiplier(config.speed);
  const pitch = getPitchMultiplier(config.pitch);

  const voices =
    voicesOverride ||
    (typeof window !== 'undefined' && window.speechSynthesis && window.speechSynthesis.getVoices
      ? window.speechSynthesis.getVoices()
      : []);

  if (!voices || voices.length === 0) {
    return {
      voice: null,
      voiceName: 'System Synthesizer (Default)',
      isFallback: false,
      rate,
      pitch,
      lang: targetLanguage,
    };
  }

  const langCode = targetLanguage.split('-')[0].toLowerCase();

  // 1. Language matching voices
  const langVoices = voices.filter((v) => v.lang.toLowerCase().startsWith(langCode));
  const candidatePool = langVoices.length > 0 ? langVoices : voices;
  const isLanguageFallback = langVoices.length === 0 && targetLanguage.startsWith('hi');

  // 2. Specific URI requested
  if (config.selectedVoiceURI) {
    const exact = voices.find((v) => v.voiceURI === config.selectedVoiceURI);
    if (exact) {
      return {
        voice: exact,
        voiceName: exact.name,
        isFallback: false,
        rate,
        pitch,
        lang: exact.lang,
      };
    }
  }

  // 3. Gender matching
  if (config.gender === 'system') {
    const def = candidatePool.find((v) => v.default) || candidatePool[0];
    return {
      voice: def,
      voiceName: def.name,
      isFallback: isLanguageFallback,
      fallbackReason: isLanguageFallback ? 'Native Hindi voice not installed in system TTS engine. Using system default.' : undefined,
      rate,
      pitch,
      lang: def.lang,
    };
  }

  // Search for gender match in candidate pool
  const genderMatched = candidatePool.filter((v) => detectVoiceGender(v) === config.gender);
  if (genderMatched.length > 0) {
    const selected = genderMatched.find((v) => v.default) || genderMatched[0];
    return {
      voice: selected,
      voiceName: selected.name,
      isFallback: isLanguageFallback,
      fallbackReason: isLanguageFallback ? 'Hindi voice missing; using selected voice in available language.' : undefined,
      rate,
      pitch,
      lang: selected.lang,
    };
  }

  // Gender not found in language pool -> look across all installed voices
  const globalGenderMatch = voices.filter((v) => detectVoiceGender(v) === config.gender);
  if (globalGenderMatch.length > 0) {
    const fallback = globalGenderMatch[0];
    return {
      voice: fallback,
      voiceName: fallback.name,
      isFallback: true,
      fallbackReason: `${config.gender.toUpperCase()} voice not available for ${targetLanguage}. Using ${fallback.name}.`,
      rate,
      pitch,
      lang: fallback.lang,
    };
  }

  // No voice matching requested gender exists at all -> fallback to default voice
  const finalFallback = candidatePool.find((v) => v.default) || candidatePool[0] || voices[0];
  return {
    voice: finalFallback,
    voiceName: finalFallback.name,
    isFallback: true,
    fallbackReason: `No ${config.gender} voice installed on device. Falling back to ${finalFallback.name}.`,
    rate,
    pitch,
    lang: finalFallback.lang,
  };
}

/**
 * Generates the sample preview text based on language.
 */
export function getVoicePreviewText(language = 'en-US'): string {
  if (language.startsWith('hi')) {
    return 'नमस्ते, मैं वज्र हूँ। मैं आपकी क्या मदद कर सकता हूँ?';
  }
  return "Hello, I'm Vajra. How can I help you today?";
}
