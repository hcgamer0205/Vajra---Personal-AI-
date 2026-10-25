import React, { useState } from 'react';
import { Languages, Volume2, Mic, Check, Search, Sparkles } from 'lucide-react';
import { MobileBottomSheet } from './MobileBottomSheet';
import {
  getAllIndianLanguages,
  IndianLanguageCapability,
} from '../../services/indianLanguageRegistry';
import { personalWorldModel } from '../../services/personalWorldModel';

interface MobileLanguageSheetProps {
  isOpen: boolean;
  onClose: () => void;
  currentLanguage: string;
  onSelectLanguage: (langCode: string) => void;
}

export const MobileLanguageSheet: React.FC<MobileLanguageSheetProps> = ({
  isOpen,
  onClose,
  currentLanguage,
  onSelectLanguage,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const allLanguages = getAllIndianLanguages();

  const filtered = allLanguages.filter((l) => {
    const q = searchQuery.toLowerCase();
    return (
      l.nativeName.toLowerCase().includes(q) ||
      l.englishName.toLowerCase().includes(q) ||
      l.code.toLowerCase().includes(q)
    );
  });

  const handleSelect = (code: string) => {
    onSelectLanguage(code);
    personalWorldModel.updatePreferences({
      preferredLanguage: code,
      spokenResponseLanguage: code,
    });
  };

  return (
    <MobileBottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Indian Multilingual Matrix"
      height="tall"
    >
      <div className="space-y-4 pb-6">
        {/* Intro Banner */}
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-red-500/10 to-orange-500/10 border border-amber-500/30 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-zinc-300 leading-relaxed">
            <span className="font-semibold text-amber-300">20 Indian Languages Supported</span>.
            Select your preferred conversational & spoken dialect. Voice synthesis and recognition adapt dynamically.
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search Hindi, Tamil, Bengali, Marathi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900/90 border border-zinc-700/60 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/60"
          />
        </div>

        {/* Language Grid */}
        <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
          {filtered.map((lang) => {
            const isSelected =
              currentLanguage.toLowerCase() === lang.code.toLowerCase() ||
              currentLanguage.toLowerCase().startsWith(lang.code.split('-')[0].toLowerCase());

            return (
              <button
                key={lang.code}
                onClick={() => handleSelect(lang.code)}
                className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                  isSelected
                    ? 'bg-amber-500/15 border-amber-500/60 text-white shadow-lg shadow-amber-500/10'
                    : 'bg-zinc-900/60 border-zinc-800 text-zinc-300 hover:bg-zinc-800/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm ${
                      isSelected
                        ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-black font-extrabold'
                        : 'bg-zinc-800 text-zinc-300'
                    }`}
                  >
                    {lang.nativeName.slice(0, 2)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-xs text-white">
                        {lang.nativeName}
                      </span>
                      <span className="text-[10px] text-zinc-400">
                        ({lang.englishName})
                      </span>
                    </div>
                    {/* Capability Badges */}
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 flex items-center gap-1">
                        <Languages className="w-2.5 h-2.5 text-amber-400" /> {lang.script}
                      </span>
                      {lang.speechRecognition && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 flex items-center gap-0.5 border border-emerald-500/30">
                          <Mic className="w-2.5 h-2.5" /> Mic
                        </span>
                      )}
                      {lang.spokenOutput && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-300 flex items-center gap-0.5 border border-blue-500/30">
                          <Volume2 className="w-2.5 h-2.5" /> TTS
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {isSelected && (
                  <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center text-black">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </MobileBottomSheet>
  );
};
