import React from 'react';
import {
  CheckCircle2,
  Circle,
  CircleDot,
  AlertTriangle,
  RotateCcw,
  XCircle,
  Activity,
  Terminal,
} from 'lucide-react';
import { VajraMission, MissionStep } from '../../services/vajraContext';

interface MobileMissionCardProps {
  mission: VajraMission;
  onRetryStep?: (stepIndex: number) => void;
  onCancelMission?: () => void;
  className?: string;
}

export const MobileMissionCard: React.FC<MobileMissionCardProps> = ({
  mission,
  onRetryStep,
  onCancelMission,
  className = '',
}) => {
  const getStepIcon = (step: MissionStep) => {
    if (step.status === 'completed') {
      return <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />;
    }
    if (step.status === 'executing') {
      return <CircleDot className="w-4 h-4 text-amber-400 animate-spin shrink-0" />;
    }
    if (step.status === 'failed') {
      return <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />;
    }
    return <Circle className="w-4 h-4 text-amber-500/40 shrink-0" />;
  };

  const getStatusBadge = () => {
    switch (mission.status) {
      case 'planning':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            Planning
          </span>
        );
      case 'in_progress':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-950/70 border border-amber-500/50 text-amber-300 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            Executing
          </span>
        );
      case 'completed':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            Verified
          </span>
        );
      case 'failed':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-red-950/80 border border-red-500/60 text-red-300 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-red-400" />
            Halted
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider bg-[#1a040b] border border-amber-900/60 text-amber-400/60">
            Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={`rounded-2xl bg-gradient-to-b from-[#140409]/95 to-[#080104]/95 border border-amber-500/35 p-3.5 shadow-[0_4px_24px_rgba(0,0,0,0.7),0_0_12px_rgba(220,38,38,0.15)] backdrop-blur-xl ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-amber-500/20">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-[#20050d] border border-amber-500/40 flex items-center justify-center shrink-0">
            <Activity className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="text-[9px] font-mono uppercase tracking-widest text-amber-500/70 leading-none mb-0.5">
              Autonomous Directive
            </div>
            <h4 className="font-hud font-bold text-xs text-amber-100 truncate tracking-wide">
              {mission.title}
            </h4>
          </div>
        </div>

        <div className="shrink-0">{getStatusBadge()}</div>
      </div>

      {/* Steps Progression Pipeline */}
      <div className="space-y-2 mb-2">
        {mission.steps.map((step, idx) => {
          const isCurrent = idx === mission.currentStepIndex && mission.status !== 'completed';
          const isDone = step.status === 'completed';
          return (
            <div
              key={step.id || idx}
              className={`flex items-start gap-2.5 p-2 rounded-xl border transition-all ${
                isCurrent
                  ? 'bg-[#20070f]/90 border-amber-400/60 shadow-[0_0_10px_rgba(245,158,11,0.15)]'
                  : isDone
                  ? 'bg-[#0e0206]/60 border-emerald-500/20 text-white/90'
                  : 'bg-[#0a0204]/40 border-amber-500/10 text-white/60'
              }`}
            >
              <div className="pt-0.5 shrink-0">{getStepIcon(step)}</div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span
                    className={`font-mono text-[11px] font-semibold tracking-wide truncate ${
                      isCurrent
                        ? 'text-amber-200'
                        : isDone
                        ? 'text-emerald-200 line-through decoration-emerald-500/40'
                        : 'text-amber-400/70'
                    }`}
                  >
                    {idx + 1}. {step.description}
                  </span>
                  {step.action?.type && (
                    <span className="text-[9px] font-mono text-amber-500/50 uppercase tracking-wider shrink-0 ml-1">
                      {step.action.type}
                    </span>
                  )}
                </div>
                {step.resultMessage && (
                  <p className="text-[10px] font-mono text-amber-300/80 mt-0.5 truncate">
                    {step.resultMessage}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Recovery / Control Action footer if failed */}
      {mission.status === 'failed' && (
        <div className="pt-2 mt-1 border-t border-red-500/30 flex items-center justify-between gap-2">
          <span className="text-[10px] font-mono text-red-300/80">
            Step encountered an anomaly.
          </span>
          <div className="flex items-center gap-1.5">
            {onRetryStep && (
              <button
                type="button"
                onClick={() => onRetryStep(mission.currentStepIndex)}
                className="px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-500/50 text-amber-200 text-[10px] font-mono font-bold flex items-center gap-1 active:scale-95 transition-all"
              >
                <RotateCcw className="w-3 h-3" />
                Retry
              </button>
            )}
            {onCancelMission && (
              <button
                type="button"
                onClick={onCancelMission}
                className="px-2.5 py-1 rounded-lg bg-red-950/40 border border-red-500/40 text-red-300 text-[10px] font-mono flex items-center gap-1 active:scale-95 transition-all"
              >
                <XCircle className="w-3 h-3" />
                Cancel
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
