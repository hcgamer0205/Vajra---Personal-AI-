import React, { useState } from 'react';
import { X, Search, ExternalLink, ShieldCheck, Sparkles } from 'lucide-react';
import { createSafeGoogleSearchUrl } from '../services/security';

interface QuickSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExecuteSearch: (query: string) => void;
}

const SUGGESTED_QUERIES = [
  'Latest advancements in AI and robotics',
  'TypeScript design patterns tutorial',
  'Arc reactor energy physics',
  'ISRO space missions update',
  'WebAssembly performance benchmarks',
];

export const QuickSearchModal: React.FC<QuickSearchModalProps> = ({
  isOpen,
  onClose,
  onExecuteSearch,
}) => {
  const [query, setQuery] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    onExecuteSearch(query.trim());
    setQuery('');
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
              <Search className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-hud font-bold text-base text-amber-200 tracking-wider">
                STARK GOOGLE SEARCH HUD
              </h2>
              <p className="text-[10px] font-mono text-amber-400/80">
                Direct query dispatch • Verified search protocol
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-2">
          <label className="block text-[11px] font-mono text-amber-400/80">
            ENTER SEARCH QUERY:
          </label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-amber-500/60 absolute left-3 top-2.5" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. quantum neural networks or arc reactor physics"
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#18040a] border border-amber-500/40 text-xs text-amber-100 placeholder-amber-500/40 outline-none focus:border-amber-400 font-mono"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={!query.trim()}
              className="px-4 py-2 rounded-xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-black text-xs font-mono font-bold transition-all disabled:opacity-40 cursor-pointer flex items-center gap-1.5 shrink-0 shadow-md shadow-amber-500/30"
            >
              <span>Search</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>

        {/* Suggested Queries */}
        <div className="space-y-2 pt-2">
          <div className="text-[10px] font-mono uppercase text-amber-500/70 tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>DISCOVERY SUGGESTIONS:</span>
          </div>
          <div className="space-y-1.5">
            {SUGGESTED_QUERIES.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => {
                  onExecuteSearch(q);
                  onClose();
                }}
                className="w-full p-2 rounded-lg bg-[#18040a] hover:bg-[#280712] border border-amber-500/30 hover:border-amber-400 text-left text-xs font-mono text-[#fde68a] hover:text-yellow-200 transition-all flex items-center justify-between group"
              >
                <span className="truncate">{q}</span>
                <ExternalLink className="w-3 h-3 text-amber-500/60 group-hover:text-amber-300 shrink-0 ml-2" />
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-amber-900/40 flex items-center justify-between text-[10px] font-mono text-amber-500/60">
          <div className="flex items-center gap-1 text-amber-400/80">
            <ShieldCheck className="w-3 h-3" />
            <span>Opens Google in a dedicated secure tab</span>
          </div>
          <span>[ESC] to close</span>
        </div>
      </div>
    </div>
  );
};
