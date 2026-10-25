import React, { useState, useEffect } from 'react';
import { Bell, Clock, Sun, Moon, Plus, Trash2, Shield, CheckCircle2, AlertCircle } from 'lucide-react';
import { MobileBottomSheet } from './MobileBottomSheet';
import { personalWorldModel, ScheduledReminder } from '../../services/personalWorldModel';
import { proactiveEngine, ProactiveBriefing } from '../../services/proactiveEngine';
import { formatIndianDate } from '../../services/indianLanguageRegistry';

interface MobileRemindersSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileRemindersSheet: React.FC<MobileRemindersSheetProps> = ({
  isOpen,
  onClose,
}) => {
  const [reminders, setReminders] = useState<ScheduledReminder[]>([]);
  const [briefing, setBriefing] = useState<ProactiveBriefing | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newMinutes, setNewMinutes] = useState('15');
  const [prefs, setPrefs] = useState(personalWorldModel.getPreferences());

  const refreshData = async () => {
    setReminders(personalWorldModel.getReminders());
    setPrefs(personalWorldModel.getPreferences());
    try {
      const b = await proactiveEngine.generateDailyBriefing();
      setBriefing(b);
    } catch {}
  };

  useEffect(() => {
    if (isOpen) {
      refreshData();
    }
  }, [isOpen]);

  const handleAddReminder = () => {
    if (!newTitle.trim()) return;
    const triggerTime = Date.now() + parseInt(newMinutes, 10) * 60 * 1000;
    personalWorldModel.addReminder(newTitle.trim(), triggerTime);
    setNewTitle('');
    refreshData();
  };

  const handleDeleteReminder = (id: string) => {
    personalWorldModel.deleteReminder(id);
    refreshData();
  };

  const handleUpdateProactivity = (mode: 'reactive' | 'assistive' | 'authorized_proactive') => {
    personalWorldModel.updatePreferences({ proactivityMode: mode });
    refreshData();
  };

  const handleToggleQuietHours = () => {
    personalWorldModel.updatePreferences({
      quietHours: {
        ...prefs.quietHours,
        enabled: !prefs.quietHours.enabled,
      },
    });
    refreshData();
  };

  return (
    <MobileBottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Proactive Intelligence & Reminders"
      height="tall"
    >
      <div className="space-y-4 pb-6">
        {/* Daily Briefing Card */}
        {briefing && (
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-500/15 to-orange-500/15 border border-amber-500/30">
            <div className="flex items-center gap-2 mb-1.5">
              <Sun className="w-4 h-4 text-amber-400" />
              <span className="font-semibold text-xs text-amber-300">{briefing.greeting}</span>
            </div>
            <div className="text-[11px] text-zinc-300 leading-relaxed mb-2">
              {briefing.dateStr}
              {briefing.batteryStatus && ` • ${briefing.batteryStatus}`}
            </div>
            {briefing.suggestions.length > 0 && (
              <div className="space-y-1">
                {briefing.suggestions.map((s, idx) => (
                  <div key={idx} className="text-[10px] text-zinc-400 flex items-start gap-1.5">
                    <span className="text-amber-400">•</span>
                    <span>{s}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Initiative Mode Selector */}
        <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-amber-400" /> Initiative Boundary
            </span>
            <span className="text-[10px] text-amber-400 uppercase font-mono font-medium">
              {prefs.proactivityMode.replace('_', ' ')}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 pt-1">
            <button
              onClick={() => handleUpdateProactivity('reactive')}
              className={`py-1.5 px-2 rounded-lg text-[10px] font-medium border text-center transition-all ${
                prefs.proactivityMode === 'reactive'
                  ? 'bg-amber-500/20 border-amber-500/60 text-white'
                  : 'bg-zinc-800/60 border-zinc-700/50 text-zinc-400'
              }`}
            >
              Reactive
            </button>
            <button
              onClick={() => handleUpdateProactivity('assistive')}
              className={`py-1.5 px-2 rounded-lg text-[10px] font-medium border text-center transition-all ${
                prefs.proactivityMode === 'assistive'
                  ? 'bg-amber-500/20 border-amber-500/60 text-white'
                  : 'bg-zinc-800/60 border-zinc-700/50 text-zinc-400'
              }`}
            >
              Assistive
            </button>
            <button
              onClick={() => handleUpdateProactivity('authorized_proactive')}
              className={`py-1.5 px-2 rounded-lg text-[10px] font-medium border text-center transition-all ${
                prefs.proactivityMode === 'authorized_proactive'
                  ? 'bg-amber-500/20 border-amber-500/60 text-white'
                  : 'bg-zinc-800/60 border-zinc-700/50 text-zinc-400'
              }`}
            >
              Proactive
            </button>
          </div>
        </div>

        {/* Quiet Hours Switch */}
        <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Moon className="w-4 h-4 text-cyan-400" />
            <div>
              <div className="text-xs font-medium text-white">Quiet Hours (IST)</div>
              <div className="text-[10px] text-zinc-400">
                10:00 PM – 07:00 AM IST (Silence audio notifications)
              </div>
            </div>
          </div>
          <button
            onClick={handleToggleQuietHours}
            className={`w-11 h-6 rounded-full transition-colors relative ${
              prefs.quietHours.enabled ? 'bg-cyan-500' : 'bg-zinc-700'
            }`}
          >
            <span
              className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${
                prefs.quietHours.enabled ? 'translate-x-5' : ''
              }`}
            />
          </button>
        </div>

        {/* Schedule New Reminder */}
        <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-2">
          <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
            <Bell className="w-3.5 h-3.5 text-amber-400" /> Add Reminder
          </span>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. Call client, take medicine, review draft"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/60"
            />
            <select
              value={newMinutes}
              onChange={(e) => setNewMinutes(e.target.value)}
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-2 text-xs text-zinc-300 focus:outline-none"
            >
              <option value="5">In 5m</option>
              <option value="15">In 15m</option>
              <option value="30">In 30m</option>
              <option value="60">In 1h</option>
              <option value="120">In 2h</option>
            </select>
            <button
              onClick={handleAddReminder}
              className="px-3 py-1.5 rounded-lg bg-amber-500 text-black font-semibold text-xs hover:bg-amber-400 transition-colors"
            >
              Add
            </button>
          </div>
        </div>

        {/* Active Reminders List */}
        <div className="space-y-2">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
            Active Reminders ({reminders.length})
          </span>
          {reminders.length === 0 ? (
            <div className="p-4 rounded-xl border border-dashed border-zinc-800 text-center text-xs text-zinc-500">
              No scheduled reminders currently queued.
            </div>
          ) : (
            reminders.map((rem) => {
              const dateFormatted = formatIndianDate(rem.triggerTime, { includeTime: true });
              return (
                <div
                  key={rem.id}
                  className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    {rem.triggered ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                    )}
                    <div>
                      <div className={`text-xs ${rem.triggered ? 'line-through text-zinc-500' : 'text-zinc-200'}`}>
                        {rem.title}
                      </div>
                      <div className="text-[10px] text-zinc-500">{dateFormatted}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteReminder(rem.id)}
                    className="p-1 text-zinc-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </MobileBottomSheet>
  );
};
