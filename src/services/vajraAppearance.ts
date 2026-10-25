export type CoreThemeId =
  | 'crimson_gold'
  | 'arc_reactor'
  | 'emerald_pulse'
  | 'solar_flare'
  | 'violet_void'
  | 'cyberpunk_neon'
  | 'phantom_silver'
  | 'custom';

export type UiAccentId =
  | 'amber_gold'
  | 'cyan_arc'
  | 'crimson_red'
  | 'emerald_green'
  | 'amethyst_purple'
  | 'rose_pink'
  | 'titanium_silver'
  | 'custom';

export interface VajraAppearanceConfig {
  coreTheme: CoreThemeId;
  customCoreColor: string;
  uiAccentTheme: UiAccentId;
  customUiColor: string;
}

export interface CoreThemeDefinition {
  id: CoreThemeId;
  name: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  accentSpark: string;
  containmentColor: string;
  glowGradient: string;
  previewColors: string[];
}

export interface UiAccentDefinition {
  id: UiAccentId;
  name: string;
  primaryHex: string;
  borderClass: string;
  textClass: string;
  glowShadow: string;
}

export const CORE_THEMES: Record<Exclude<CoreThemeId, 'custom'>, CoreThemeDefinition> = {
  crimson_gold: {
    id: 'crimson_gold',
    name: 'Crimson & Gold',
    description: 'Signature Iron Man / VAJRA Prime aesthetic with metallic gold nucleus & scarlet aura.',
    primaryColor: '#f59e0b',
    secondaryColor: '#dc2626',
    accentSpark: '#22d3ee',
    containmentColor: 'rgba(220, 38, 38, 0.45)',
    glowGradient: 'from-red-800/45 via-rose-950/35 to-amber-600/25',
    previewColors: ['#dc2626', '#f59e0b', '#22d3ee'],
  },
  arc_reactor: {
    id: 'arc_reactor',
    name: 'Arc Reactor Blue',
    description: 'Electric Stark cyan nucleus with deep cerulean and ice blue plasma arcs.',
    primaryColor: '#06b6d4',
    secondaryColor: '#2563eb',
    accentSpark: '#67e8f9',
    containmentColor: 'rgba(37, 99, 235, 0.45)',
    glowGradient: 'from-cyan-900/50 via-blue-950/40 to-cyan-500/25',
    previewColors: ['#0284c7', '#06b6d4', '#67e8f9'],
  },
  emerald_pulse: {
    id: 'emerald_pulse',
    name: 'Emerald Matrix',
    description: 'Cybernetic quantum matrix with jade core, mint flares, and emerald resonance.',
    primaryColor: '#10b981',
    secondaryColor: '#047857',
    accentSpark: '#6ee7b7',
    containmentColor: 'rgba(4, 120, 87, 0.45)',
    glowGradient: 'from-emerald-900/50 via-green-950/40 to-emerald-500/25',
    previewColors: ['#047857', '#10b981', '#6ee7b7'],
  },
  solar_flare: {
    id: 'solar_flare',
    name: 'Solar Flare',
    description: 'Incandescent stellar prominence with blazing sunburst orange and solar amber.',
    primaryColor: '#f97316',
    secondaryColor: '#eab308',
    accentSpark: '#fef08a',
    containmentColor: 'rgba(234, 88, 12, 0.45)',
    glowGradient: 'from-amber-900/50 via-orange-950/40 to-yellow-500/25',
    previewColors: ['#ea580c', '#f97316', '#eab308'],
  },
  violet_void: {
    id: 'violet_void',
    name: 'Violet Void',
    description: 'Deep cosmic amethyst nucleus with ethereal ultraviolet and magenta plasma.',
    primaryColor: '#a855f7',
    secondaryColor: '#701a75',
    accentSpark: '#e879f9',
    containmentColor: 'rgba(112, 26, 117, 0.45)',
    glowGradient: 'from-purple-900/50 via-fuchsia-950/40 to-violet-500/25',
    previewColors: ['#701a75', '#a855f7', '#e879f9'],
  },
  cyberpunk_neon: {
    id: 'cyberpunk_neon',
    name: 'Cyberpunk Neon',
    description: 'High-contrast synthwave with hot magenta core and electric cyan containment rings.',
    primaryColor: '#ec4899',
    secondaryColor: '#06b6d4',
    accentSpark: '#f472b6',
    containmentColor: 'rgba(236, 72, 153, 0.45)',
    glowGradient: 'from-pink-900/50 via-cyan-950/40 to-pink-500/25',
    previewColors: ['#db2777', '#ec4899', '#06b6d4'],
  },
  phantom_silver: {
    id: 'phantom_silver',
    name: 'Phantom Silver',
    description: 'Precision titanium & glacier platinum with crisp diamond white and slate aura.',
    primaryColor: '#e2e8f0',
    secondaryColor: '#64748b',
    accentSpark: '#38bdf8',
    containmentColor: 'rgba(100, 116, 139, 0.45)',
    glowGradient: 'from-slate-800/40 via-zinc-900/40 to-cyan-500/15',
    previewColors: ['#64748b', '#cbd5e1', '#38bdf8'],
  },
};

export const UI_ACCENTS: Record<Exclude<UiAccentId, 'custom'>, UiAccentDefinition> = {
  amber_gold: {
    id: 'amber_gold',
    name: 'Amber Gold (Default)',
    primaryHex: '#f59e0b',
    borderClass: 'border-amber-500/40',
    textClass: 'text-amber-300',
    glowShadow: 'rgba(245, 158, 11, 0.4)',
  },
  cyan_arc: {
    id: 'cyan_arc',
    name: 'Arc Cyan',
    primaryHex: '#06b6d4',
    borderClass: 'border-cyan-500/40',
    textClass: 'text-cyan-300',
    glowShadow: 'rgba(6, 182, 212, 0.4)',
  },
  crimson_red: {
    id: 'crimson_red',
    name: 'Crimson Scarlet',
    primaryHex: '#ef4444',
    borderClass: 'border-red-500/40',
    textClass: 'text-red-300',
    glowShadow: 'rgba(239, 68, 68, 0.4)',
  },
  emerald_green: {
    id: 'emerald_green',
    name: 'Emerald Matrix',
    primaryHex: '#10b981',
    borderClass: 'border-emerald-500/40',
    textClass: 'text-emerald-300',
    glowShadow: 'rgba(16, 185, 129, 0.4)',
  },
  amethyst_purple: {
    id: 'amethyst_purple',
    name: 'Amethyst Purple',
    primaryHex: '#a855f7',
    borderClass: 'border-purple-500/40',
    textClass: 'text-purple-300',
    glowShadow: 'rgba(168, 85, 247, 0.4)',
  },
  rose_pink: {
    id: 'rose_pink',
    name: 'Neon Rose',
    primaryHex: '#ec4899',
    borderClass: 'border-pink-500/40',
    textClass: 'text-pink-300',
    glowShadow: 'rgba(236, 72, 153, 0.4)',
  },
  titanium_silver: {
    id: 'titanium_silver',
    name: 'Titanium Silver',
    primaryHex: '#94a3b8',
    borderClass: 'border-slate-400/40',
    textClass: 'text-slate-200',
    glowShadow: 'rgba(148, 163, 184, 0.4)',
  },
};

export const DEFAULT_APPEARANCE_CONFIG: VajraAppearanceConfig = {
  coreTheme: 'crimson_gold',
  customCoreColor: '#f59e0b',
  uiAccentTheme: 'amber_gold',
  customUiColor: '#f59e0b',
};

const STORAGE_KEY_APPEARANCE = 'vajra_appearance_v1';

export function loadAppearanceConfig(): VajraAppearanceConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_APPEARANCE);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        coreTheme: parsed.coreTheme || DEFAULT_APPEARANCE_CONFIG.coreTheme,
        customCoreColor: parsed.customCoreColor || DEFAULT_APPEARANCE_CONFIG.customCoreColor,
        uiAccentTheme: parsed.uiAccentTheme || DEFAULT_APPEARANCE_CONFIG.uiAccentTheme,
        customUiColor: parsed.customUiColor || DEFAULT_APPEARANCE_CONFIG.customUiColor,
      };
    }
  } catch (err) {
    console.warn('VAJRA: Could not load appearance settings from localStorage:', err);
  }
  return { ...DEFAULT_APPEARANCE_CONFIG };
}

export function resetAppearanceConfig(): VajraAppearanceConfig {
  try {
    localStorage.removeItem(STORAGE_KEY_APPEARANCE);
  } catch (err) {
    console.warn('VAJRA: Could not reset appearance settings in localStorage:', err);
  }
  const resetConfig = { ...DEFAULT_APPEARANCE_CONFIG };
  applyThemeToDocument(resetConfig);
  return resetConfig;
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const sanitized = hex.replace('#', '').trim();
  if (sanitized.length === 3) {
    const r = parseInt(sanitized[0] + sanitized[0], 16);
    const g = parseInt(sanitized[1] + sanitized[1], 16);
    const b = parseInt(sanitized[2] + sanitized[2], 16);
    return isNaN(r) || isNaN(g) || isNaN(b) ? null : { r, g, b };
  }
  if (sanitized.length === 6) {
    const r = parseInt(sanitized.slice(0, 2), 16);
    const g = parseInt(sanitized.slice(2, 4), 16);
    const b = parseInt(sanitized.slice(4, 6), 16);
    return isNaN(r) || isNaN(g) || isNaN(b) ? null : { r, g, b };
  }
  return null;
}

export function getMatchingUiAccentForCoreTheme(coreTheme: CoreThemeId): UiAccentId {
  switch (coreTheme) {
    case 'crimson_gold':
      return 'amber_gold';
    case 'arc_reactor':
      return 'cyan_arc';
    case 'emerald_pulse':
      return 'emerald_green';
    case 'solar_flare':
      return 'amber_gold';
    case 'violet_void':
      return 'amethyst_purple';
    case 'cyberpunk_neon':
      return 'rose_pink';
    case 'phantom_silver':
      return 'titanium_silver';
    case 'custom':
      return 'custom';
    default:
      return 'amber_gold';
  }
}

export function applyUiAccentVariables(accent: UiAccentId, customColor?: string): void {
  // Legacy compatibility: redirect to document theme application
  const config = loadAppearanceConfig();
  applyThemeToDocument({
    ...config,
    uiAccentTheme: accent,
    customUiColor: customColor || config.customUiColor,
  });
}

/**
 * Applies the entire primary, secondary, text, border, and glow CSS variables to document.documentElement.
 * Also toggles [data-vajra-theme-active="true"] and [data-vajra-theme=id] so all UI texts and borders shift instantly.
 */
export function applyThemeToDocument(config: VajraAppearanceConfig): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const body = document.body;

  let primaryHex = '#f59e0b';
  let secondaryHex = '#dc2626';

  if (config.coreTheme === 'custom' && config.customCoreColor) {
    primaryHex = config.customCoreColor;
    secondaryHex = config.customUiColor || config.customCoreColor;
  } else if (config.coreTheme !== 'custom' && CORE_THEMES[config.coreTheme]) {
    primaryHex = CORE_THEMES[config.coreTheme].primaryColor;
    secondaryHex = CORE_THEMES[config.coreTheme].secondaryColor;
  }

  // If user selected a distinct UI Accent in custom mode, use that for UI accents
  if (config.uiAccentTheme === 'custom' && config.customUiColor) {
    primaryHex = config.customUiColor;
  } else if (config.uiAccentTheme !== 'custom' && UI_ACCENTS[config.uiAccentTheme]) {
    // When a preset UI accent is explicitly selected, harmonize text/border with it
    primaryHex = UI_ACCENTS[config.uiAccentTheme].primaryHex;
  }

  const rgb = hexToRgb(primaryHex) || { r: 245, g: 158, b: 11 };
  const secRgb = hexToRgb(secondaryHex) || { r: 220, g: 38, b: 38 };

  // Calculate high-contrast harmonious text tones
  const isLightColor = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000 > 170;
  const textLight = isLightColor ? '#ffffff' : `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.95)`;
  const textPrimary = primaryHex;
  const textMuted = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.72)`;
  const borderPrimary = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.38)`;
  const borderStrong = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.8)`;
  const bgSurface = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.12)`;
  const bgSurfaceSubtle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.06)`;
  const glow = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.45)`;

  root.style.setProperty('--vajra-primary', primaryHex);
  root.style.setProperty('--vajra-primary-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
  root.style.setProperty('--vajra-secondary', secondaryHex);
  root.style.setProperty('--vajra-secondary-rgb', `${secRgb.r}, ${secRgb.g}, ${secRgb.b}`);
  root.style.setProperty('--vajra-accent', primaryHex);
  root.style.setProperty('--vajra-accent-glow', glow);
  root.style.setProperty('--vajra-text-light', textLight);
  root.style.setProperty('--vajra-text-primary', textPrimary);
  root.style.setProperty('--vajra-text-muted', textMuted);
  root.style.setProperty('--vajra-border', borderPrimary);
  root.style.setProperty('--vajra-border-strong', borderStrong);
  root.style.setProperty('--vajra-bg-surface', bgSurface);
  root.style.setProperty('--vajra-bg-surface-subtle', bgSurfaceSubtle);
  root.style.setProperty('--vajra-glow', glow);

  root.setAttribute('data-vajra-theme-active', 'true');
  root.setAttribute('data-vajra-theme', config.coreTheme);
  if (body) {
    body.setAttribute('data-vajra-theme-active', 'true');
    body.setAttribute('data-vajra-theme', config.coreTheme);
  }
}

export function saveAppearanceConfig(config: VajraAppearanceConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY_APPEARANCE, JSON.stringify(config));
    applyThemeToDocument(config);
  } catch (err) {
    console.warn('VAJRA: Could not save appearance settings to localStorage:', err);
  }
}

/**
 * Detects natural language color/theme change commands like:
 * "change color to blue", "switch theme to green", "make it purple", "change color to #00ffcc"
 */
export function detectColorChangeCommand(
  text: string,
  current: VajraAppearanceConfig
): { newConfig: VajraAppearanceConfig; themeName: string } | null {
  if (!text || typeof text !== 'string') return null;
  const q = text.toLowerCase().trim();

  // Guard against non-appearance commands
  const isColorMentioned =
    q.includes('color') ||
    q.includes('colour') ||
    q.includes('theme') ||
    q.includes('appearance') ||
    q.includes('accent') ||
    q.startsWith('make it ') ||
    q.startsWith('turn it ') ||
    q.startsWith('set to ') ||
    q.startsWith('switch to ') ||
    q.startsWith('change to ');

  if (!isColorMentioned) {
    return null;
  }

  // Hex color detection: e.g. "change color to #00ffff"
  const hexMatch = q.match(/#([0-9a-f]{3}|[0-9a-f]{6})\b/i);
  if (hexMatch) {
    const hex = hexMatch[0];
    return {
      newConfig: {
        ...current,
        coreTheme: 'custom',
        customCoreColor: hex,
        uiAccentTheme: 'custom',
        customUiColor: hex,
      },
      themeName: `Custom (${hex})`,
    };
  }

  // Preset themes by color name
  if (q.includes('blue') || q.includes('cyan') || q.includes('arc reactor')) {
    return {
      newConfig: {
        ...current,
        coreTheme: 'arc_reactor',
        uiAccentTheme: 'cyan_arc',
      },
      themeName: 'Arc Reactor Blue',
    };
  }

  if (q.includes('green') || q.includes('emerald') || q.includes('matrix')) {
    return {
      newConfig: {
        ...current,
        coreTheme: 'emerald_pulse',
        uiAccentTheme: 'emerald_green',
      },
      themeName: 'Emerald Matrix',
    };
  }

  if (q.includes('purple') || q.includes('violet') || q.includes('amethyst')) {
    return {
      newConfig: {
        ...current,
        coreTheme: 'violet_void',
        uiAccentTheme: 'amethyst_purple',
      },
      themeName: 'Violet Void',
    };
  }

  if (q.includes('orange') || q.includes('solar') || q.includes('sunburst')) {
    return {
      newConfig: {
        ...current,
        coreTheme: 'solar_flare',
        uiAccentTheme: 'amber_gold',
      },
      themeName: 'Solar Flare Orange',
    };
  }

  if (q.includes('pink') || q.includes('cyberpunk') || q.includes('rose') || q.includes('magenta')) {
    return {
      newConfig: {
        ...current,
        coreTheme: 'cyberpunk_neon',
        uiAccentTheme: 'rose_pink',
      },
      themeName: 'Cyberpunk Neon',
    };
  }

  if (q.includes('red') || q.includes('crimson') || q.includes('scarlet')) {
    return {
      newConfig: {
        ...current,
        coreTheme: 'crimson_gold',
        uiAccentTheme: 'crimson_red',
      },
      themeName: 'Crimson Scarlet',
    };
  }

  if (q.includes('silver') || q.includes('white') || q.includes('platinum') || q.includes('titanium')) {
    return {
      newConfig: {
        ...current,
        coreTheme: 'phantom_silver',
        uiAccentTheme: 'titanium_silver',
      },
      themeName: 'Phantom Silver',
    };
  }

  if (q.includes('gold') || q.includes('yellow') || q.includes('iron man') || q.includes('default')) {
    return {
      newConfig: {
        ...current,
        coreTheme: 'crimson_gold',
        uiAccentTheme: 'amber_gold',
      },
      themeName: 'Crimson & Gold (Default)',
    };
  }

  return null;
}
