import React, { useState, useEffect } from 'react';
import { X, FileText, Download, Copy, Check, Trash2 } from 'lucide-react';

interface NotepadToolProps {
  isOpen: boolean;
  onClose: () => void;
  initialText?: string;
}

const NOTEPAD_STORAGE_KEY = 'vajra_scratchpad_content';

export const NotepadTool: React.FC<NotepadToolProps> = ({ isOpen, onClose, initialText = '' }) => {
  const [content, setContent] = useState<string>(() => {
    return localStorage.getItem(NOTEPAD_STORAGE_KEY) || initialText;
  });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (initialText) {
      setContent(initialText);
    }
  }, [initialText]);

  useEffect(() => {
    localStorage.setItem(NOTEPAD_STORAGE_KEY, content);
  }, [content]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stark_note_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-[#0e0206] border border-amber-500/50 w-full max-w-lg rounded-2xl p-5 shadow-2xl relative text-[#fef3c7] flex flex-col h-[480px] shadow-red-950/60">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-amber-900/50 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-red-900/40 text-amber-400 border border-amber-500/40 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold font-hud tracking-wider text-amber-200">Stark Scratchpad</h3>
              <p className="text-[10px] font-mono text-amber-500/60">Persisted to device local storage</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-amber-300 hover:text-white hover:bg-[#20050d] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Text Area */}
        <div className="flex-1 bg-[#18040a] border border-amber-500/40 rounded-xl p-3 relative overflow-hidden flex flex-col">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Input system notes, algorithm drafts, or Stark directives here..."
            className="w-full h-full bg-transparent text-sm text-[#fef3c7] placeholder-amber-500/40 resize-none outline-none font-mono leading-relaxed"
          />
        </div>

        {/* Footer info & actions */}
        <div className="mt-3 pt-3 border-t border-amber-900/40 flex flex-wrap items-center justify-between gap-2 text-xs text-amber-500/70">
          <div className="flex items-center gap-3 text-[11px] font-mono">
            <span>{wordCount} words</span>
            <span>•</span>
            <span>{charCount} chars</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setContent('')}
              className="p-1.5 rounded-lg bg-[#18040a] hover:bg-red-950/70 hover:text-red-300 text-amber-300 border border-amber-900/40 transition-colors"
              title="Clear Note"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#18040a] hover:bg-[#280712] border border-amber-500/40 text-amber-300 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-amber-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-black font-bold font-mono transition-colors shadow-lg shadow-amber-500/30"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export .txt</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
