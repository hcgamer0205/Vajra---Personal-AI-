import React from 'react';
import { Sparkles, Globe, Search, Calculator, FileText, Code2, Compass, Cpu, WifiOff, HardDrive } from 'lucide-react';
import { JarvisSphere } from './JarvisSphere';

interface EmptyStateProps {
  onSelectPrompt: (prompt: string) => void;
  isOffline?: boolean;
  onOpenEngineModal?: () => void;
}

const SUGGESTIONS = [
  {
    icon: Globe,
    title: 'Website Navigation',
    prompt: 'Open YouTube and search for quantum computing explained.',
  },
  {
    icon: Search,
    title: 'Google Web Search',
    prompt: 'Search for latest space exploration breakthroughs on Google.',
  },
  {
    icon: Calculator,
    title: 'In-App System Tools',
    prompt: 'Open the Calculator to compute complex financial formulas.',
  },
  {
    icon: Code2,
    title: 'Code & Architecture',
    prompt: 'How should I structure the API layer for a modern microservice with an adapter pattern?',
  },
];

export const EmptyState: React.FC<EmptyStateProps> = ({
  onSelectPrompt,
  isOffline = false,
  onOpenEngineModal,
}) => {
  return (
    <div
      id="chat-empty-state"
      className="flex flex-col items-center justify-center my-auto py-6 sm:py-10 px-4 text-center max-w-2xl mx-auto animate-in fade-in duration-300"
    >
      {/* Futuristic JARVIS-Style Animated Sphere Core */}
      <div className="relative mb-6">
        <JarvisSphere size="lg" isOffline={isOffline} interactive={true} />
      </div>

      {/* System Status HUD Pill */}
      <div className="flex items-center gap-2 mb-3">
        <button
          type="button"
          onClick={onOpenEngineModal}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#141414] border border-[#1F2937] text-[11px] font-mono text-[#9CA3AF] hover:text-white hover:border-violet-500/50 transition-all cursor-pointer shadow-sm"
        >
          <span className={`w-2 h-2 rounded-full ${isOffline ? 'bg-violet-400' : 'bg-emerald-400 animate-pulse'}`} />
          <span>{isOffline ? 'CORE: OFFLINE ENGINE (ON-DEVICE)' : 'CORE: GEMINI 3.7 CLOUD ACTIVE'}</span>
        </button>
      </div>

      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
        How can Nova assist you?
      </h2>
      <p className="text-sm sm:text-base text-[#9CA3AF] mt-2 max-w-md leading-relaxed">
        {isOffline
          ? 'Operating 100% on-device. Conversation history and inference run locally in your browser.'
          : 'Ask complex questions, brainstorm architectures, analyze code, or draft documents with high-precision intelligence.'}
      </p>

      {/* Suggested Starter Prompts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full mt-7 text-left">
        {SUGGESTIONS.map((item, index) => {
          const Icon = item.icon;
          return (
            <button
              key={index}
              id={`suggestion-prompt-${index}`}
              type="button"
              onClick={() => onSelectPrompt(item.prompt)}
              className="group p-4 rounded-2xl border border-[#1F2937] bg-[#141414] hover:bg-[#1A1A1A] hover:border-violet-500/50 hover:shadow-xl hover:shadow-violet-950/20 transition-all text-left flex flex-col justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2.5 mb-2">
                <div className="p-1.5 rounded-lg bg-violet-950/60 text-violet-400 border border-violet-800/40 group-hover:scale-105 group-hover:bg-violet-900/80 transition-all">
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-white">
                  {item.title}
                </span>
              </div>
              <p className="text-xs text-[#9CA3AF] group-hover:text-[#D1D5DB] line-clamp-2 leading-relaxed transition-colors">
                "{item.prompt}"
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
