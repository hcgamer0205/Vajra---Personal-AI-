import React, { useState } from 'react';
import { X, Delete, Copy, Check, Calculator as CalcIcon } from 'lucide-react';

interface CalculatorToolProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CalculatorTool: React.FC<CalculatorToolProps> = ({ isOpen, onClose }) => {
  const [display, setDisplay] = useState('0');
  const [formula, setFormula] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleDigit = (digit: string) => {
    setDisplay((prev) => (prev === '0' ? digit : prev + digit));
  };

  const handleOperator = (op: string) => {
    setFormula(`${display} ${op} `);
    setDisplay('0');
  };

  const handleClear = () => {
    setDisplay('0');
    setFormula('');
  };

  const handleDelete = () => {
    setDisplay((prev) => (prev.length > 1 ? prev.slice(0, -1) : '0'));
  };

  const handleCalculate = () => {
    if (!formula) return;
    try {
      const sanitized = (formula + display)
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/[^0-9+\-*/.() ]/g, '');
      // Safe math evaluation
      // eslint-disable-next-line no-new-func
      const result = Function(`'use strict'; return (${sanitized})`)();
      setDisplay(String(Number(result.toFixed(8))));
      setFormula('');
    } catch {
      setDisplay('Error');
      setFormula('');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(display);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-[#0e0206] border border-amber-500/50 w-full max-w-xs rounded-2xl p-5 shadow-2xl relative text-[#fef3c7] shadow-red-950/60">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-amber-900/50 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-red-900/40 text-amber-400 border border-amber-500/40 flex items-center justify-center">
              <CalcIcon className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold font-hud tracking-wider text-amber-200">Stark Calculator</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-amber-300 hover:text-white hover:bg-[#20050d] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Display Screen */}
        <div className="bg-[#18040a] border border-amber-500/40 rounded-xl p-3.5 mb-4 text-right">
          <div className="text-xs text-amber-500/60 font-mono h-4 overflow-hidden">{formula}</div>
          <div className="text-2xl font-bold font-mono text-amber-300 tracking-wider truncate mt-1">
            {display}
          </div>
        </div>

        {/* Action Controls */}
        <div className="grid grid-cols-4 gap-2 text-sm font-medium font-mono">
          <button
            type="button"
            onClick={handleClear}
            className="col-span-2 py-2.5 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 hover:bg-red-900/60 transition-colors"
          >
            AC
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="py-2.5 rounded-xl bg-[#18040a] text-amber-300 hover:text-white flex items-center justify-center border border-amber-900/40 transition-colors"
          >
            <Delete className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleOperator('÷')}
            className="py-2.5 rounded-xl bg-amber-950/60 border border-amber-500/40 text-amber-300 hover:bg-amber-900/60 transition-colors font-bold"
          >
            ÷
          </button>

          {/* Row 1 */}
          {['7', '8', '9'].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => handleDigit(d)}
              className="py-2.5 rounded-xl bg-[#18040a] hover:bg-[#280712] border border-amber-500/30 text-amber-100 transition-colors"
            >
              {d}
            </button>
          ))}
          <button
            type="button"
            onClick={() => handleOperator('×')}
            className="py-2.5 rounded-xl bg-amber-950/60 border border-amber-500/40 text-amber-300 hover:bg-amber-900/60 transition-colors font-bold"
          >
            ×
          </button>

          {/* Row 2 */}
          {['4', '5', '6'].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => handleDigit(d)}
              className="py-2.5 rounded-xl bg-[#18040a] hover:bg-[#280712] border border-amber-500/30 text-amber-100 transition-colors"
            >
              {d}
            </button>
          ))}
          <button
            type="button"
            onClick={() => handleOperator('-')}
            className="py-2.5 rounded-xl bg-amber-950/60 border border-amber-500/40 text-amber-300 hover:bg-amber-900/60 transition-colors font-bold"
          >
            -
          </button>

          {/* Row 3 */}
          {['1', '2', '3'].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => handleDigit(d)}
              className="py-2.5 rounded-xl bg-[#18040a] hover:bg-[#280712] border border-amber-500/30 text-amber-100 transition-colors"
            >
              {d}
            </button>
          ))}
          <button
            type="button"
            onClick={() => handleOperator('+')}
            className="py-2.5 rounded-xl bg-amber-950/60 border border-amber-500/40 text-amber-300 hover:bg-amber-900/60 transition-colors font-bold"
          >
            +
          </button>

          {/* Row 4 */}
          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="col-span-2 py-2.5 rounded-xl bg-[#18040a] hover:bg-[#280712] border border-amber-500/30 text-amber-100 transition-colors"
          >
            0
          </button>
          <button
            type="button"
            onClick={() => handleDigit('.')}
            className="py-2.5 rounded-xl bg-[#18040a] hover:bg-[#280712] border border-amber-500/30 text-amber-100 transition-colors font-bold"
          >
            .
          </button>
          <button
            type="button"
            onClick={handleCalculate}
            className="py-2.5 rounded-xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-black font-bold transition-colors shadow-lg shadow-amber-500/30"
          >
            =
          </button>
        </div>

        {/* Copy Footer */}
        <div className="mt-3.5 pt-3 border-t border-amber-900/40 flex items-center justify-between text-xs text-amber-500/70">
          <span className="font-mono text-[11px]">Result ready</span>
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#18040a] hover:bg-[#280712] border border-amber-500/40 text-amber-300 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-amber-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
