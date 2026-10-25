import React from 'react';
import { Sparkles, ArrowRight, CornerDownRight } from 'lucide-react';

interface MobileContextPillsProps {
  primarySuggestion?: string | null;
  secondarySuggestions?: string[];
  onSelect: (suggestion: string) => void;
  className?: string;
  label?: string;
}

export const MobileContextPills: React.FC<MobileContextPillsProps> = ({
  primarySuggestion,
  secondarySuggestions = [],
  onSelect,
  className = '',
  label,
}) => {
  // Deduplicate and filter suggestions
  const allSuggestions = [
    ...(primarySuggestion ? [primarySuggestion] : []),
    ...secondarySuggestions,
  ].filter((item, index, self) => item && self.indexOf(item) === index);

  if (allSuggestions.length === 0) return null;

  const triggerHaptic = (ms = 20) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(ms);
      } catch {}
    }
  };

  return (
    <div
      id="vajra-mobile-context-pills"
      className={`w-full py-1 select-none pointer-events-auto ${className}`}
    >
      {label && (
        <div className="px-1 pb-1 flex items-center gap-1 text-[9px] font-mono uppercase tracking-widest text-amber-500/60">
          <CornerDownRight className="w-2.5 h-2.5 text-amber-400/80" />
          <span>{label}</span>
        </div>
      )}

      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 px-0.5">
        {allSuggestions.map((suggestion, idx) => {
          const isPrimary = idx === 0 && Boolean(primarySuggestion);
          return (
            <button
              key={`${idx}-${suggestion}`}
              type="button"
              onClick={() => {
                triggerHaptic(25);
                onSelect(suggestion);
              }}
              className={`min-h-[44px] px-3.5 py-2 rounded-full border flex items-center gap-2 text-xs font-mono font-medium tracking-wide whitespace-nowrap active:scale-95 transition-all cursor-pointer shadow-md ${
                isPrimary
                  ? 'bg-gradient-to-r from-[#20050d] via-[#2a0812] to-[#1a040b] border-amber-400/60 text-amber-200 hover:border-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                  : 'bg-[#100207]/90 border-amber-500/30 text-amber-300/80 hover:text-amber-100 hover:border-amber-400/60'
              }`}
              title={`Directive: "${suggestion}"`}
              aria-label={`Contextual prompt: ${suggestion}`}
            >
              <Sparkles
                className={`w-3.5 h-3.5 shrink-0 ${
                  isPrimary ? 'text-amber-400 animate-pulse' : 'text-amber-500/70'
                }`}
              />
              <span className="text-left">{suggestion}</span>
              <ArrowRight className="w-3 h-3 text-amber-500/40 shrink-0 ml-0.5" />
            </button>
          );
        })}
      </div>
    </div>
  );
};
