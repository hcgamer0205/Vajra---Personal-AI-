import React, { useState } from 'react';
import { X, Globe, ExternalLink, ShieldCheck, Youtube, Github, Search, Compass } from 'lucide-react';
import { sanitizeUrl } from '../services/security';

interface QuickUrlModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchUrl: (url: string, title?: string) => void;
}

const PRESET_DESTINATIONS = [
  { title: 'YouTube', url: 'https://www.youtube.com', category: 'Media', icon: 'youtube' },
  { title: 'Google Search', url: 'https://www.google.com', category: 'Search', icon: 'search' },
  { title: 'GitHub', url: 'https://github.com', category: 'Developer', icon: 'github' },
  { title: 'Wikipedia', url: 'https://www.wikipedia.org', category: 'Reference', icon: 'globe' },
  { title: 'Reddit', url: 'https://www.reddit.com', category: 'Community', icon: 'globe' },
  { title: 'MDN Web Docs', url: 'https://developer.mozilla.org', category: 'Developer', icon: 'globe' },
];

export const QuickUrlModal: React.FC<QuickUrlModalProps> = ({
  isOpen,
  onClose,
  onLaunchUrl,
}) => {
  const [customUrl, setCustomUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLaunch = (targetUrl: string, title?: string) => {
    let formatted = targetUrl.trim();
    if (!formatted) return;

    if (!formatted.startsWith('http://') && !formatted.startsWith('https://')) {
      formatted = `https://${formatted}`;
    }

    const safe = sanitizeUrl(formatted);
    if (!safe) {
      setError('Invalid or unsafe URL protocol. Only https:// and http:// are allowed.');
      return;
    }

    setError(null);
    onLaunchUrl(safe, title || 'External Website');
    setCustomUrl('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />

      {/* Modal in Iron Man Red & Gold */}
      <div className="relative z-10 w-full max-w-lg bg-[#0e0206] border border-amber-500/50 rounded-2xl shadow-2xl p-5 text-[#fef3c7] space-y-4 animate-in fade-in zoom-in-95 duration-150 shadow-red-950/60">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-amber-900/50 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-900/40 border border-amber-500/50 flex items-center justify-center text-amber-300">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-hud font-bold text-base text-amber-200 tracking-wider">
                STARK WEB NAVIGATOR
              </h2>
              <p className="text-[10px] font-mono text-amber-400/80">
                Safe protocol verified • Sandbox isolation
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-amber-300 hover:text-white bg-[#1a040b] hover:bg-[#280712] border border-amber-900/60 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLaunch(customUrl);
          }}
          className="space-y-2"
        >
          <label className="block text-[11px] font-mono text-amber-400/80">
            ENTER TARGET URL OR DOMAIN:
          </label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Compass className="w-4 h-4 text-amber-500/60 absolute left-3 top-2.5" />
              <input
                type="text"
                value={customUrl}
                onChange={(e) => {
                  setCustomUrl(e.target.value);
                  setError(null);
                }}
                placeholder="e.g. youtube.com or https://news.ycombinator.com"
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#18040a] border border-amber-500/40 text-xs text-amber-100 placeholder-amber-500/40 outline-none focus:border-amber-400 font-mono"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={!customUrl.trim()}
              className="px-4 py-2 rounded-xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-black text-xs font-mono font-bold transition-all disabled:opacity-40 cursor-pointer flex items-center gap-1.5 shrink-0 shadow-md shadow-amber-500/30"
            >
              <span>Launch</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
          {error && <p className="text-[11px] text-red-400 font-mono">{error}</p>}
        </form>

        {/* Quick Presets Grid */}
        <div className="space-y-2 pt-2">
          <div className="text-[10px] font-mono uppercase text-amber-500/70 tracking-wider">
            FREQUENT DESTINATIONS:
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {PRESET_DESTINATIONS.map((preset) => (
              <button
                key={preset.title}
                type="button"
                onClick={() => handleLaunch(preset.url, preset.title)}
                className="p-2.5 rounded-xl bg-[#18040a] hover:bg-[#280712] border border-amber-500/30 hover:border-amber-400 text-left transition-all cursor-pointer group shadow-sm"
              >
                <div className="flex items-center justify-between text-xs font-bold text-amber-200 group-hover:text-yellow-200 font-hud">
                  <span>{preset.title}</span>
                  <ExternalLink className="w-3 h-3 text-amber-500/60 group-hover:text-amber-300" />
                </div>
                <span className="text-[10px] font-mono text-amber-500/60 truncate block mt-0.5">
                  {preset.url.replace('https://www.', '').replace('https://', '')}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Security Footer */}
        <div className="pt-2 border-t border-amber-900/40 flex items-center justify-between text-[10px] font-mono text-amber-500/60">
          <div className="flex items-center gap-1 text-amber-400/80">
            <ShieldCheck className="w-3 h-3" />
            <span>Opens safely in a new browser tab</span>
          </div>
          <span>[ESC] to cancel</span>
        </div>
      </div>
    </div>
  );
};
