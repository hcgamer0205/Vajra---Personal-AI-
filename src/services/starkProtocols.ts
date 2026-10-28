/**
 * Stark Industries / J.A.R.V.I.S. Protocol Directives Engine
 * 
 * Manages tactical system protocols inspired by Tony Stark's AI operating system:
 * 1. House Party Protocol — Comprehensive multi-subsystem diagnostic sweep
 * 2. Veronica / Hulkbuster Protocol — Maximum defense authorization & active threat isolation
 * 3. Clean Slate Protocol — Emergency session buffer wipe & memory isolation
 * 4. Sentry Mode — Continuous acoustic radar sweep with proximity anomaly detection
 * 5. Barnell Stealth Mode — Dark OLED power conservation with whisper acoustic gain
 */

import { starkAudio } from './starkAudio';

export type StarkProtocolId =
  | 'NONE'
  | 'HOUSE_PARTY'
  | 'VERONICA'
  | 'CLEAN_SLATE'
  | 'SENTRY'
  | 'STEALTH';

export interface StarkProtocolInfo {
  id: StarkProtocolId;
  name: string;
  codename: string;
  description: string;
  badgeColor: string;
  hudGlowColor: string;
  activationPrompt: string;
  voicePhrase: string;
}

export const STARK_PROTOCOLS: Record<StarkProtocolId, StarkProtocolInfo> = {
  NONE: {
    id: 'NONE',
    name: 'Standard Standby',
    codename: 'MK-VII NOMINAL',
    description: 'Standard J.A.R.V.I.S. operational mode',
    badgeColor: 'text-amber-300 border-amber-500/40 bg-amber-950/60',
    hudGlowColor: 'from-amber-500/20 to-cyan-500/20',
    activationPrompt: 'Standby mode active.',
    voicePhrase: 'At your service, Sir.',
  },
  HOUSE_PARTY: {
    id: 'HOUSE_PARTY',
    name: 'House Party Protocol',
    codename: 'PROTOCOL 42',
    description: 'Rapid diagnostic sweep across all neural, voice, and phone control subsystems',
    badgeColor: 'text-yellow-300 border-yellow-400 bg-yellow-950/80',
    hudGlowColor: 'from-yellow-500/40 to-amber-500/30',
    activationPrompt: 'House Party Protocol initiated. Dispathing diagnostic probe across all suit subsystems...',
    voicePhrase: 'House Party Protocol engaged. All subsystems reporting nominal capacity, Sir.',
  },
  VERONICA: {
    id: 'VERONICA',
    name: 'Veronica Protocol',
    codename: 'HULKBUSTER SENTRY',
    description: 'Maximum security defense mode with high-risk confirmation locks',
    badgeColor: 'text-red-300 border-red-500 bg-red-950/90',
    hudGlowColor: 'from-red-600/50 to-amber-600/30',
    activationPrompt: 'Veronica defense orbital pod active. High-risk system actions require explicit clearance.',
    voicePhrase: 'Veronica online, Boss. Heavy defense perimeter established.',
  },
  CLEAN_SLATE: {
    id: 'CLEAN_SLATE',
    name: 'Clean Slate Protocol',
    codename: 'PURGE MK-III',
    description: 'Instant secure purge of active conversation buffers and scratchpad memory',
    badgeColor: 'text-cyan-300 border-cyan-400 bg-cyan-950/80',
    hudGlowColor: 'from-cyan-500/40 to-blue-600/30',
    activationPrompt: 'Clean Slate Protocol executed. Telemetry buffer and temporary scratchpad purged.',
    voicePhrase: 'Clean Slate Protocol executed. Telemetry wiped clean, Sir.',
  },
  SENTRY: {
    id: 'SENTRY',
    name: 'Sentry Radar Scan',
    codename: 'PERIMETER SENTRY',
    description: 'Continuous 360-degree acoustic radar scan with voice spike threshold detection',
    badgeColor: 'text-emerald-300 border-emerald-500 bg-emerald-950/80',
    hudGlowColor: 'from-emerald-500/40 to-cyan-500/30',
    activationPrompt: 'Sentry Mode active. Acoustic radar sweeping ambient perimeter...',
    voicePhrase: 'Sentry perimeter active. Acoustic sensors scanning, Boss.',
  },
  STEALTH: {
    id: 'STEALTH',
    name: 'Barnell Stealth Mode',
    codename: 'STEALTH MK-IV',
    description: 'Ultra-low OLED energy consumption with whisper acoustic amplification',
    badgeColor: 'text-stone-300 border-stone-500 bg-stone-950/90',
    hudGlowColor: 'from-stone-900 to-black',
    activationPrompt: 'Barnell Stealth Mode engaged. Luminance reduced to zero-emission OLED dark state.',
    voicePhrase: 'Stealth mode engaged. Whisper sensors active, Sir.',
  },
};

class StarkProtocolEngine {
  private activeProtocol: StarkProtocolId = 'NONE';
  private listeners: Array<(protocol: StarkProtocolInfo) => void> = [];

  public getActiveProtocol(): StarkProtocolInfo {
    return STARK_PROTOCOLS[this.activeProtocol];
  }

  public subscribe(listener: (protocol: StarkProtocolInfo) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  public triggerProtocol(protocolId: StarkProtocolId): StarkProtocolInfo {
    this.activeProtocol = protocolId;
    const info = STARK_PROTOCOLS[protocolId];

    if (protocolId === 'HOUSE_PARTY') {
      starkAudio.playProtocolEngaged();
    } else if (protocolId === 'VERONICA') {
      starkAudio.playSecurityAlert();
    } else if (protocolId === 'CLEAN_SLATE') {
      starkAudio.playPowerDown();
    } else if (protocolId === 'SENTRY') {
      starkAudio.playArcReactorSpinUp();
    } else if (protocolId === 'STEALTH') {
      starkAudio.playHudChirp();
    }

    this.listeners.forEach((l) => l(info));
    return info;
  }

  public detectProtocolCommand(text: string): StarkProtocolId | null {
    if (!text) return null;
    const lower = text.toLowerCase();

    if (
      lower.includes('house party') ||
      lower.includes('protocol 42') ||
      lower.includes('all suits') ||
      lower.includes('diagnostic sweep')
    ) {
      return 'HOUSE_PARTY';
    }
    if (
      lower.includes('veronica') ||
      lower.includes('hulkbuster') ||
      lower.includes('defense mode') ||
      lower.includes('lockdown')
    ) {
      return 'VERONICA';
    }
    if (
      lower.includes('clean slate') ||
      lower.includes('purge memory') ||
      lower.includes('wipe buffer') ||
      lower.includes('clear slate')
    ) {
      return 'CLEAN_SLATE';
    }
    if (
      lower.includes('sentry mode') ||
      lower.includes('sentry scan') ||
      lower.includes('radar scan') ||
      lower.includes('perimeter scan')
    ) {
      return 'SENTRY';
    }
    if (
      lower.includes('stealth mode') ||
      lower.includes('barnell') ||
      lower.includes('whisper mode') ||
      lower.includes('dark mode stealth')
    ) {
      return 'STEALTH';
    }

    return null;
  }
}

export const starkProtocols = new StarkProtocolEngine();
