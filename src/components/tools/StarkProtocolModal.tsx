import React from 'react';
import {
  X,
  Zap,
  ShieldAlert,
  Trash2,
  Radio,
  EyeOff,
  Sparkles,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import {
  starkProtocols,
  STARK_PROTOCOLS,
  StarkProtocolId,
  StarkProtocolInfo,
} from '../../services/starkProtocols';
import { starkAudio } from '../../services/starkAudio';

interface StarkProtocolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExecuteProtocol: (protocol: StarkProtocolInfo) => void;
}

export const StarkProtocolModal: React.FC<StarkProtocolModalProps> = ({
  isOpen,
  onClose,
  onExecuteProtocol,
}) => {
  const [activeInfo, setActiveInfo] = React.useState<StarkProtocolInfo>(() =>
    starkProtocols.getActiveProtocol()
  );

  React.useEffect(() => {
    return starkProtocols.subscribe((info) => {
      setActiveInfo(info);
    });
  }, []);

  if (!isOpen) return null;

  const handleSelect = (id: StarkProtocolId) => {
    const info = starkProtocols.triggerProtocol(id);
    onExecuteProtocol(info);
  };

  const getProtocolIcon = (id: StarkProtocolId) => {
    switch (id) {
      case 'HOUSE_PARTY':
        return Zap;
      case 'VERONICA':
        return ShieldAlert;
      case 'CLEAN_SLATE':
        return Trash2;
      case 'SENTRY':
        return Radio;
      case 'STEALTH':
        return EyeOff;
      default:
        return Sparkles;
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Stark Protocol Execution Matrix"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xl select-none"
    >
      <div className="relative w-full max-w-xl bg-[#080205] border border-amber-500/40 rounded-2xl shadow-[0_0_50px_rgba(245,158,11,0.25)] overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#0d0307] border-b border-amber-500/30">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400 animate-pulse" />
            <div>
              <h3 className="font-hud font-bold text-xs tracking-widest text-amber-100 uppercase">
                STARK INDUSTRIES // PROTOCOL MATRIX
              </h3>
              <p className="text-[10px] font-mono text-amber-400/60">
                TACTICAL OVERRIDE DIRECTIVES & DEFENSE CONTROLS
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

        {/* Active Protocol Status Banner */}
        <div className="p-3 bg-[#100308] border-b border-amber-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-amber-500/60 uppercase">ACTIVE STATE:</span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider border ${activeInfo.badgeColor}`}
            >
              {activeInfo.name}
            </span>
          </div>
          <span className="text-[10px] font-mono text-amber-400/50">{activeInfo.codename}</span>
        </div>

        {/* Protocol List */}
        <div className="flex-1 p-4 overflow-y-auto space-y-2.5">
          {(
            [
              'HOUSE_PARTY',
              'VERONICA',
              'CLEAN_SLATE',
              'SENTRY',
              'STEALTH',
              'NONE',
            ] as StarkProtocolId[]
          ).map((id) => {
            const proto = STARK_PROTOCOLS[id];
            const Icon = getProtocolIcon(id);
            const isCurrent = activeInfo.id === id;

            return (
              <div
                key={id}
                onClick={() => handleSelect(id)}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${
                  isCurrent
                    ? 'bg-amber-500/15 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                    : 'bg-[#120308] border-amber-500/20 hover:border-amber-400 hover:bg-[#1a040b]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center border ${
                      isCurrent
                        ? 'bg-amber-500/30 border-amber-400 text-amber-200'
                        : 'bg-black/60 border-amber-500/30 text-amber-400/70 group-hover:text-amber-200'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-mono font-bold text-xs text-amber-100">{proto.name}</h4>
                      <span className="text-[9px] font-mono text-amber-500/60">{proto.codename}</span>
                    </div>
                    <p className="text-[10px] font-mono text-amber-300/70 mt-0.5">
                      {proto.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isCurrent && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                  <ChevronRight className="w-4 h-4 text-amber-500/40 group-hover:text-amber-300 transition-colors" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
