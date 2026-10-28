import React, { useState } from 'react';
import {
  X,
  Database,
  Atom,
  Zap,
  Calculator,
  Search,
  ChevronRight,
} from 'lucide-react';
import { starkAudio } from '../../services/starkAudio';

interface StarkDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDataPrompt: (prompt: string) => void;
}

export const PHYSICS_CONSTANTS = [
  { name: 'Speed of Light in Vacuum (c)', value: '299,792,458 m/s', symbol: 'c' },
  { name: 'Planck Constant (h)', value: '6.626 070 15 × 10⁻³⁴ J·s', symbol: 'h' },
  { name: 'Gravitational Constant (G)', value: '6.674 30 × 10⁻¹¹ m³/(kg·s²)', symbol: 'G' },
  { name: 'Elementary Charge (e)', value: '1.602 176 634 × 10⁻¹⁹ C', symbol: 'e' },
  { name: 'Electron Mass (mₑ)', value: '9.109 383 7015 × 10⁻³¹ kg', symbol: 'mₑ' },
  { name: 'Avogadro Constant (Nₐ)', value: '6.022 140 76 × 10²³ mol⁻¹', symbol: 'Nₐ' },
];

export const PERIODIC_ELEMENTS = [
  { atomicNumber: 1, symbol: 'H', name: 'Hydrogen', atomicWeight: '1.008', group: 'Nonmetal' },
  { atomicNumber: 2, symbol: 'He', name: 'Helium', atomicWeight: '4.0026', group: 'Noble Gas' },
  { atomicNumber: 6, symbol: 'C', name: 'Carbon', atomicWeight: '12.011', group: 'Nonmetal' },
  { atomicNumber: 8, symbol: 'O', name: 'Oxygen', atomicWeight: '15.999', group: 'Nonmetal' },
  { atomicNumber: 13, symbol: 'Al', name: 'Aluminium', atomicWeight: '26.982', group: 'Post-transition' },
  { atomicNumber: 26, symbol: 'Fe', name: 'Iron', atomicWeight: '55.845', group: 'Transition Metal' },
  { atomicNumber: 29, symbol: 'Cu', name: 'Copper', atomicWeight: '63.546', group: 'Transition Metal' },
  { atomicNumber: 79, symbol: 'Au', name: 'Gold', atomicWeight: '196.97', group: 'Transition Metal' },
  { atomicNumber: 82, symbol: 'Pb', name: 'Lead', atomicWeight: '207.2', group: 'Post-transition' },
  { atomicNumber: 92, symbol: 'U', name: 'Uranium', atomicWeight: '238.03', group: 'Actinide' },
];

export const StarkDatabaseModal: React.FC<StarkDatabaseModalProps> = ({
  isOpen,
  onClose,
  onSelectDataPrompt,
}) => {
  const [tab, setTab] = useState<'constants' | 'elements' | 'formulas'>('constants');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filteredElements = PERIODIC_ELEMENTS.filter(
    (e) =>
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Stark Scientific Database Terminal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xl select-none"
    >
      <div className="relative w-full max-w-2xl bg-[#080205] border border-amber-500/40 rounded-2xl shadow-[0_0_50px_rgba(245,158,11,0.2)] overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#0d0307] border-b border-amber-500/30">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-hud font-bold text-xs tracking-widest text-amber-100 uppercase">
                STARK TECHNICAL DATABASE // MARK-VII
              </h3>
              <p className="text-[10px] font-mono text-amber-400/60">
                FUNDAMENTAL CONSTANTS, ATOMIC STRUCTURES & FORMULAS
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

        {/* Tab Bar */}
        <div className="flex items-center gap-1 px-4 pt-3 bg-[#0a0205] border-b border-amber-950/60">
          <button
            type="button"
            onClick={() => {
              setTab('constants');
              starkAudio.playHudChirp();
            }}
            className={`px-3 py-1.5 rounded-t-lg text-xs font-mono transition-all cursor-pointer flex items-center gap-1.5 ${
              tab === 'constants'
                ? 'bg-amber-500/20 border-t border-x border-amber-400 text-amber-100 font-bold'
                : 'text-amber-400/60 hover:text-amber-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Constants</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTab('elements');
              starkAudio.playHudChirp();
            }}
            className={`px-3 py-1.5 rounded-t-lg text-xs font-mono transition-all cursor-pointer flex items-center gap-1.5 ${
              tab === 'elements'
                ? 'bg-amber-500/20 border-t border-x border-amber-400 text-amber-100 font-bold'
                : 'text-amber-400/60 hover:text-amber-200'
            }`}
          >
            <Atom className="w-3.5 h-3.5" />
            <span>Elements</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTab('formulas');
              starkAudio.playHudChirp();
            }}
            className={`px-3 py-1.5 rounded-t-lg text-xs font-mono transition-all cursor-pointer flex items-center gap-1.5 ${
              tab === 'formulas'
                ? 'bg-amber-500/20 border-t border-x border-amber-400 text-amber-100 font-bold'
                : 'text-amber-400/60 hover:text-amber-200'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Formulas</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-4 overflow-y-auto min-h-[280px]">
          {tab === 'constants' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {PHYSICS_CONSTANTS.map((c) => (
                <div
                  key={c.symbol}
                  onClick={() => {
                    onSelectDataPrompt(`Explain the physics constant ${c.name} (${c.symbol} = ${c.value}) and its significance.`);
                    onClose();
                  }}
                  className="p-3 rounded-xl bg-[#120308] border border-amber-500/25 hover:border-amber-400 transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-amber-200">{c.name}</span>
                    <span className="text-xs font-mono text-cyan-300 font-bold">{c.symbol}</span>
                  </div>
                  <p className="mt-1 font-mono text-[11px] text-amber-300/80">{c.value}</p>
                  <span className="mt-2 text-[9px] font-mono text-amber-500/50 group-hover:text-amber-300 flex items-center gap-1">
                    Query JARVIS analysis <ChevronRight className="w-2.5 h-2.5" />
                  </span>
                </div>
              ))}
            </div>
          )}

          {tab === 'elements' && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 bg-[#120308] border border-amber-500/30 rounded-xl px-3 py-1.5">
                <Search className="w-4 h-4 text-amber-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search elements by name or symbol..."
                  className="w-full bg-transparent text-xs text-white font-mono outline-none"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {filteredElements.map((el) => (
                  <div
                    key={el.atomicNumber}
                    onClick={() => {
                      onSelectDataPrompt(`Analyze element ${el.name} (${el.symbol}, Atomic #${el.atomicNumber}). Provide electron configuration and properties.`);
                      onClose();
                    }}
                    className="p-2.5 rounded-xl bg-[#120308] border border-amber-500/25 hover:border-amber-400 transition-all cursor-pointer group flex items-center justify-between"
                  >
                    <div>
                      <span className="text-[10px] font-mono text-amber-500/60">#{el.atomicNumber}</span>
                      <h4 className="font-mono font-bold text-sm text-amber-100">{el.symbol}</h4>
                      <p className="text-[11px] font-mono text-amber-200/80">{el.name}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] font-mono text-cyan-300">{el.group}</span>
                      <p className="text-[10px] font-mono text-amber-400/70">{el.atomicWeight}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'formulas' && (
            <div className="flex flex-col gap-2">
              {[
                { title: 'Einstein Mass-Energy Equivalence', formula: 'E = m c²', desc: 'Energy equals mass times speed of light squared' },
                { title: 'Arc Reactor Energy Output', formula: 'P = I × V = 3.0 GJ/s', desc: 'Stark Palladium/Badassium Core power output' },
                { title: 'Quantum Kinetic Energy', formula: 'E_k = ½ m v²', desc: 'Translational kinetic energy' },
                { title: 'Schrödinger Wave Equation', formula: 'iħ ∂/∂t Ψ = Ĥ Ψ', desc: 'Quantum state wave function evolution' },
              ].map((f) => (
                <div
                  key={f.title}
                  onClick={() => {
                    onSelectDataPrompt(`Break down the formula ${f.title} (${f.formula}) and calculate step-by-step applications.`);
                    onClose();
                  }}
                  className="p-3 rounded-xl bg-[#120308] border border-amber-500/25 hover:border-amber-400 transition-all cursor-pointer group flex items-center justify-between"
                >
                  <div>
                    <h4 className="font-mono font-bold text-xs text-amber-200">{f.title}</h4>
                    <p className="text-[10px] font-mono text-amber-400/60">{f.desc}</p>
                  </div>
                  <span className="font-mono font-bold text-xs text-cyan-300 bg-black/60 px-2.5 py-1 rounded-lg border border-cyan-500/30">
                    {f.formula}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
