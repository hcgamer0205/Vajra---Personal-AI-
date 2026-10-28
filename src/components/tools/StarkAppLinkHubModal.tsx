import React, { useState } from 'react';
import {
  X,
  Globe,
  Plus,
  Trash2,
  ExternalLink,
  Smartphone,
  Youtube,
  Search,
  Camera,
  MapPin,
  Settings,
  Sparkles,
} from 'lucide-react';
import { nativeBridge } from '../../services/nativeBridge';
import { starkAudio } from '../../services/starkAudio';

export interface AppShortcut {
  id: string;
  name: string;
  category: 'system' | 'media' | 'social' | 'custom';
  urlOrPackage: string;
  iconName: string;
  isCustom?: boolean;
}

const DEFAULT_SHORTCUTS: AppShortcut[] = [
  { id: 'yt', name: 'YouTube', category: 'media', urlOrPackage: 'https://www.youtube.com', iconName: 'youtube' },
  { id: 'google', name: 'Google Search', category: 'system', urlOrPackage: 'https://www.google.com', iconName: 'search' },
  { id: 'maps', name: 'Google Maps', category: 'system', urlOrPackage: 'https://maps.google.com', iconName: 'maps' },
  { id: 'camera', name: 'System Camera', category: 'system', urlOrPackage: 'camera:', iconName: 'camera' },
  { id: 'settings', name: 'Android Settings', category: 'system', urlOrPackage: 'settings:', iconName: 'settings' },
  { id: 'wikipedia', name: 'Wikipedia', category: 'social', urlOrPackage: 'https://wikipedia.org', iconName: 'globe' },
];

interface StarkAppLinkHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchLink: (title: string, target: string) => void;
}

export const StarkAppLinkHubModal: React.FC<StarkAppLinkHubModalProps> = ({
  isOpen,
  onClose,
  onLaunchLink,
}) => {
  const [shortcuts, setShortcuts] = useState<AppShortcut[]>(() => {
    try {
      const saved = localStorage.getItem('vajra_app_shortcuts_v1');
      return saved ? JSON.parse(saved) : DEFAULT_SHORTCUTS;
    } catch {
      return DEFAULT_SHORTCUTS;
    }
  });

  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  if (!isOpen) return null;

  const handleAddShortcut = () => {
    if (!newName.trim() || !newUrl.trim()) return;
    const item: AppShortcut = {
      id: `shortcut-${Date.now()}`,
      name: newName.trim(),
      category: 'custom',
      urlOrPackage: newUrl.trim().startsWith('http') ? newUrl.trim() : `https://${newUrl.trim()}`,
      iconName: 'globe',
      isCustom: true,
    };
    const updated = [...shortcuts, item];
    setShortcuts(updated);
    try {
      localStorage.setItem('vajra_app_shortcuts_v1', JSON.stringify(updated));
    } catch {}
    setNewName('');
    setNewUrl('');
    setIsAdding(false);
    starkAudio.playDirectiveAcknowledged();
  };

  const handleDeleteShortcut = (id: string) => {
    const updated = shortcuts.filter((s) => s.id !== id);
    setShortcuts(updated);
    try {
      localStorage.setItem('vajra_app_shortcuts_v1', JSON.stringify(updated));
    } catch {}
    starkAudio.playHudChirp();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Stark App Link Hub"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xl select-none"
    >
      <div className="relative w-full max-w-xl bg-[#080205] border border-amber-500/40 rounded-2xl shadow-[0_0_50px_rgba(245,158,11,0.25)] overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#0d0307] border-b border-amber-500/30">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-hud font-bold text-xs tracking-widest text-amber-100 uppercase">
                STARK APP LINK HUB // UNIVERSAL LAUNCHER
              </h3>
              <p className="text-[10px] font-mono text-amber-400/60">
                EDITABLE APPS, WEBSITES & SUPPORTED DEEP LINKS
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-black/50 border border-amber-500/30 text-amber-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Shortcuts Grid */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {shortcuts.map((sc) => (
              <div
                key={sc.id}
                className="relative p-3 rounded-xl bg-[#120308] border border-amber-500/25 hover:border-amber-400 transition-all group flex flex-col justify-between"
              >
                <div
                  onClick={() => {
                    onLaunchLink(sc.name, sc.urlOrPackage);
                    onClose();
                  }}
                  className="cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="w-8 h-8 rounded-lg bg-black/60 border border-amber-500/30 flex items-center justify-center text-amber-300">
                      {sc.iconName === 'youtube' ? (
                        <Youtube className="w-4 h-4 text-red-500" />
                      ) : sc.iconName === 'search' ? (
                        <Search className="w-4 h-4 text-amber-400" />
                      ) : sc.iconName === 'maps' ? (
                        <MapPin className="w-4 h-4 text-cyan-400" />
                      ) : sc.iconName === 'camera' ? (
                        <Camera className="w-4 h-4 text-emerald-400" />
                      ) : sc.iconName === 'settings' ? (
                        <Settings className="w-4 h-4 text-purple-400" />
                      ) : (
                        <Globe className="w-4 h-4 text-amber-400" />
                      )}
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-amber-500/40 group-hover:text-amber-300 transition-colors" />
                  </div>
                  <h4 className="font-mono font-bold text-xs text-amber-100 truncate">{sc.name}</h4>
                  <p className="text-[9px] font-mono text-amber-400/60 truncate">{sc.urlOrPackage}</p>
                </div>

                {sc.isCustom && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteShortcut(sc.id);
                    }}
                    className="absolute top-2 right-2 p-1 text-red-400/60 hover:text-red-300 transition-colors cursor-pointer"
                    title="Remove custom shortcut"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Add Custom Shortcut Bar */}
          {isAdding ? (
            <div className="p-3 rounded-xl bg-[#120308] border border-amber-400 flex flex-col gap-2 animate-in fade-in">
              <h4 className="text-xs font-mono font-bold text-amber-200">ADD CUSTOM APP / LINK SHORTCUT</h4>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Shortcut Name (e.g. My Portal)"
                className="w-full bg-black/60 border border-amber-500/30 rounded-lg px-3 py-1.5 text-xs text-white font-mono outline-none"
              />
              <input
                type="text"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="URL or Intent (e.g. https://example.com)"
                className="w-full bg-black/60 border border-amber-500/30 rounded-lg px-3 py-1.5 text-xs text-white font-mono outline-none"
              />
              <div className="flex items-center justify-end gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1 rounded-lg text-xs font-mono text-amber-400/70 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddShortcut}
                  className="px-3 py-1 rounded-lg bg-amber-500 text-black font-mono font-bold text-xs hover:bg-amber-400"
                >
                  Save Shortcut
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              className="w-full py-2.5 rounded-xl border border-dashed border-amber-500/40 hover:border-amber-400 bg-[#0d0307] text-amber-300/80 hover:text-white font-mono text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>Add Custom App or Web Shortcut</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
