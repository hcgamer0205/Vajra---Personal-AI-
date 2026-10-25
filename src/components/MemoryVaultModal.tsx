import React, { useState } from 'react';
import {
  Brain,
  X,
  Plus,
  Trash2,
  Pin,
  PinOff,
  Search,
  Check,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Info,
  Edit2,
  Save,
} from 'lucide-react';
import {
  VajraMemoryItem,
  MemoryCategory,
  addMemory,
  updateMemory,
  deleteMemory,
  togglePinMemory,
  clearAllMemories,
} from '../services/vajraMemory';

interface MemoryVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  memories: VajraMemoryItem[];
  onRefreshMemories: () => void;
}

export const MemoryVaultModal: React.FC<MemoryVaultModalProps> = ({
  isOpen,
  onClose,
  memories,
  onRefreshMemories,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  // New Memory Form State
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newCategory, setNewCategory] = useState<MemoryCategory>('directive');
  const [newPinned, setNewPinned] = useState(false);

  // Inline Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editKey, setEditKey] = useState('');
  const [editValue, setEditValue] = useState('');
  const [editCategory, setEditCategory] = useState<MemoryCategory>('directive');

  if (!isOpen) return null;

  const handleCreateMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim() || !newValue.trim()) return;

    addMemory({
      key: newKey.trim(),
      value: newValue.trim(),
      category: newCategory,
      pinned: newPinned,
    });

    setNewKey('');
    setNewValue('');
    setNewPinned(false);
    setShowAddForm(false);
    onRefreshMemories();
  };

  const handleStartEdit = (item: VajraMemoryItem) => {
    setEditingId(item.id);
    setEditKey(item.key);
    setEditValue(item.value);
    setEditCategory(item.category);
  };

  const handleSaveEdit = (id: string) => {
    if (!editKey.trim() || !editValue.trim()) return;
    updateMemory(id, {
      key: editKey.trim(),
      value: editValue.trim(),
      category: editCategory,
    });
    setEditingId(null);
    onRefreshMemories();
  };

  const handleTogglePin = (id: string) => {
    togglePinMemory(id);
    onRefreshMemories();
  };

  const handleDelete = (id: string) => {
    deleteMemory(id);
    onRefreshMemories();
  };

  const handleClearAll = () => {
    clearAllMemories();
    setConfirmClearAll(false);
    onRefreshMemories();
  };

  // Filtered memory list
  const filtered = memories.filter((m) => {
    const matchesCategory = selectedCategory === 'all' || m.category === selectedCategory;
    const matchesQuery =
      searchQuery === '' ||
      m.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.value.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  const pinnedCount = memories.filter((m) => m.pinned).length;

  const getCategoryColor = (cat: MemoryCategory) => {
    switch (cat) {
      case 'directive':
        return 'text-red-400 border-red-500/30 bg-red-950/40';
      case 'fact':
        return 'text-cyan-400 border-cyan-500/30 bg-cyan-950/40';
      case 'preference':
        return 'text-amber-300 border-amber-500/30 bg-amber-950/40';
      case 'context':
        return 'text-emerald-400 border-emerald-500/30 bg-emerald-950/40';
      default:
        return 'text-slate-300 border-slate-500/30 bg-slate-900/40';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-150 select-none">
      <div
        id="vajra-memory-vault-modal"
        className="relative w-full max-w-2xl max-h-[92vh] flex flex-col bg-[#080103] border border-amber-500/50 rounded-2xl shadow-[0_0_50px_rgba(245,158,11,0.25)] overflow-hidden text-[#fef3c7]"
      >
        {/* Modal Top Header */}
        <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-amber-900/60 bg-[#120207]/90">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-sm">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold font-hud tracking-widest text-amber-200 uppercase">
                  VAJRA NEURAL MEMORY VAULT
                </h3>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  ACTIVE
                </span>
              </div>
              <p className="text-[10px] font-mono text-amber-400/70">
                Persistent Long-Term Memory &amp; AI Prompt Directive Context
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-amber-400/70 hover:text-white hover:bg-amber-950/50 transition-colors cursor-pointer"
            aria-label="Close Memory Vault"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Telemetry & Stats Bar */}
        <div className="shrink-0 px-5 py-2.5 bg-[#0e0206] border-b border-amber-950/80 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          <div className="flex items-center gap-3 text-amber-300">
            <span>
              Total Records: <strong className="text-white">{memories.length}</strong>
            </span>
            <span className="text-amber-500/40">|</span>
            <span>
              Pinned: <strong className="text-white">{pinnedCount}</strong>
            </span>
            <span className="hidden sm:inline text-amber-500/40">|</span>
            <span className="hidden sm:flex items-center gap-1 text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Prompt Injected</span>
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-2.5 py-1 rounded-md bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 hover:border-amber-400 text-amber-200 hover:text-white text-xs font-hud font-bold tracking-wider flex items-center gap-1 transition-all cursor-pointer shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{showAddForm ? 'CANCEL' : 'ADD MEMORY'}</span>
          </button>
        </div>

        {/* Collapsible Add Memory Form */}
        {showAddForm && (
          <form
            onSubmit={handleCreateMemory}
            className="shrink-0 p-4 bg-[#140207] border-b border-amber-500/40 space-y-3 animate-in slide-in-from-top-2 duration-150"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-hud font-bold text-amber-200 tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                CREATE PERSISTENT MEMORY RECORD
              </span>
              <span className="text-[10px] font-mono text-amber-400/60">
                Safe &amp; Encrypted in Local Storage
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10px] font-mono text-amber-400/80 mb-1">
                  Key / Subject Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Preferred Language, Current Project, Boss Name"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-[#0b0104] border border-amber-500/30 rounded-lg text-white placeholder-amber-500/30 focus:outline-none focus:border-amber-400"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-amber-400/80 mb-1">
                  Category
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as MemoryCategory)}
                  className="w-full px-3 py-1.5 text-xs bg-[#0b0104] border border-amber-500/30 rounded-lg text-amber-200 focus:outline-none focus:border-amber-400"
                >
                  <option value="directive">Directive (Rule / System Behavior)</option>
                  <option value="fact">Fact (User Identity / Profile)</option>
                  <option value="preference">Preference (Tone / Likes / Formatting)</option>
                  <option value="context">Context (Active Workspace / Projects)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono text-amber-400/80 mb-1">
                Value / Details (What VAJRA should remember)
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Always address me as Sir and provide answers in bullet points."
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-[#0b0104] border border-amber-500/30 rounded-lg text-white placeholder-amber-500/30 focus:outline-none focus:border-amber-400 resize-none"
                required
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-mono text-amber-300 select-none">
                <input
                  type="checkbox"
                  checked={newPinned}
                  onChange={(e) => setNewPinned(e.target.checked)}
                  className="rounded border-amber-500/40 text-amber-500 focus:ring-amber-500 bg-[#0b0104]"
                />
                <span>Pin to top priority (Always active in neural core)</span>
              </label>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1 rounded-md text-xs font-mono text-amber-400/70 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-md bg-amber-500 hover:bg-amber-400 text-black font-hud font-bold text-xs tracking-wider transition-all cursor-pointer shadow-sm"
                >
                  SAVE RECORD
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Search & Filter Bar */}
        <div className="shrink-0 p-3 bg-[#0a0103] border-b border-amber-950/60 flex flex-col sm:flex-row items-center gap-2.5">
          <div className="relative w-full sm:flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-amber-400/50" />
            <input
              type="text"
              placeholder="Search persistent memories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#110105] border border-amber-500/25 rounded-lg text-white placeholder-amber-500/30 focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="w-full sm:w-auto flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            {(['all', 'directive', 'fact', 'preference', 'context'] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-2 py-1 rounded-md text-[10px] font-mono uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-amber-500/30 text-white border border-amber-400 font-bold'
                    : 'bg-[#120206] text-amber-400/60 hover:text-amber-200 border border-amber-950/80'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Memories Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 min-h-0 space-y-3">
          {filtered.length === 0 ? (
            <div className="p-8 text-center rounded-xl bg-[#0f0206] border border-amber-950/70 space-y-2">
              <Brain className="w-8 h-8 text-amber-500/40 mx-auto" />
              <p className="text-xs font-hud tracking-wider text-amber-300">
                NO MEMORIES MATCHED YOUR CRITERIA
              </p>
              <p className="text-[11px] font-mono text-amber-500/60 max-w-sm mx-auto">
                Add a memory manually above or instruct VAJRA verbally by saying{' '}
                <span className="text-amber-300 font-semibold">"Remember that [detail]"</span>.
              </p>
            </div>
          ) : (
            filtered.map((item) => {
              const isEditing = editingId === item.id;

              return (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    item.pinned
                      ? 'bg-[#150208] border-amber-500/40 shadow-sm shadow-amber-950/40'
                      : 'bg-[#0f0206] border-amber-950/70 hover:border-amber-500/30'
                  }`}
                >
                  {isEditing ? (
                    <div className="space-y-2.5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={editKey}
                          onChange={(e) => setEditKey(e.target.value)}
                          className="px-2.5 py-1 text-xs bg-[#0b0104] border border-amber-500/40 rounded text-white focus:outline-none"
                        />
                        <select
                          value={editCategory}
                          onChange={(e) => setEditCategory(e.target.value as MemoryCategory)}
                          className="px-2.5 py-1 text-xs bg-[#0b0104] border border-amber-500/40 rounded text-amber-200 focus:outline-none"
                        >
                          <option value="directive">Directive</option>
                          <option value="fact">Fact</option>
                          <option value="preference">Preference</option>
                          <option value="context">Context</option>
                        </select>
                      </div>
                      <textarea
                        rows={2}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-full px-2.5 py-1 text-xs bg-[#0b0104] border border-amber-500/40 rounded text-white focus:outline-none resize-none"
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="px-2 py-1 text-[10px] font-mono text-amber-400/70 hover:text-white"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(item.id)}
                          className="px-3 py-1 rounded bg-amber-500 hover:bg-amber-400 text-black font-hud font-bold text-[10px] flex items-center gap-1"
                        >
                          <Save className="w-3 h-3" />
                          <span>SAVE CHANGES</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase border ${getCategoryColor(
                              item.category
                            )}`}
                          >
                            {item.category}
                          </span>
                          <span className="text-xs font-hud font-bold tracking-wide text-amber-200">
                            {item.key}
                          </span>
                          {item.pinned && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                              <Pin className="w-2.5 h-2.5" />
                              <span>PINNED</span>
                            </span>
                          )}
                        </div>

                        {/* Card Controls */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleTogglePin(item.id)}
                            className={`p-1 rounded hover:bg-amber-950/60 transition-colors ${
                              item.pinned ? 'text-amber-300' : 'text-amber-500/40 hover:text-amber-300'
                            }`}
                            title={item.pinned ? 'Unpin memory' : 'Pin to core prompt'}
                          >
                            {item.pinned ? (
                              <Pin className="w-3 h-3 fill-current" />
                            ) : (
                              <PinOff className="w-3 h-3" />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleStartEdit(item)}
                            className="p-1 rounded text-amber-500/40 hover:text-amber-300 hover:bg-amber-950/60 transition-colors"
                            title="Edit memory entry"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(item.id)}
                            className="p-1 rounded text-red-500/40 hover:text-red-300 hover:bg-red-950/40 transition-colors"
                            title="Delete memory"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <p className="text-xs font-mono text-amber-100/90 leading-relaxed pl-1">
                        {item.value}
                      </p>

                      <div className="mt-2 pt-1 border-t border-amber-950/40 flex items-center justify-between text-[9px] font-mono text-amber-500/50">
                        <span>Logged: {new Date(item.timestamp).toLocaleString()}</span>
                        <span>Neural Context: Injected</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Modal Bottom Footer */}
        <div className="shrink-0 px-5 py-3 border-t border-amber-900/60 bg-[#0e0206] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-amber-400/70">
            <Info className="w-3.5 h-3.5 text-amber-400" />
            <span>
              Voice Tip: Say{' '}
              <strong className="text-amber-200">"Remember [fact]"</strong> or{' '}
              <strong className="text-amber-200">"What do you remember?"</strong>
            </span>
          </div>

          <div className="flex items-center gap-3">
            {confirmClearAll ? (
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-red-400">Clear all records?</span>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="px-2 py-1 rounded bg-red-600 hover:bg-red-500 text-white font-mono text-[10px] font-bold"
                >
                  Confirm
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClearAll(false)}
                  className="px-2 py-1 text-[10px] font-mono text-amber-400/60 hover:text-white"
                >
                  Cancel
                </button>
              </div>
            ) : (
              memories.length > 0 && (
                <button
                  type="button"
                  onClick={() => setConfirmClearAll(true)}
                  className="text-[10px] font-mono text-red-400/60 hover:text-red-300 transition-colors"
                >
                  Clear All Memories
                </button>
              )
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-[#1a0208] hover:bg-[#2b040e] border border-amber-500/30 text-amber-200 hover:text-white text-xs font-hud font-bold tracking-wider transition-colors cursor-pointer"
            >
              CLOSE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
