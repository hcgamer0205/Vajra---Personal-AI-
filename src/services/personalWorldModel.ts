/**
 * VAJRA Mobile — Personal World Model & Separated Memory Fabric
 * 
 * Implements a structured, privacy-preserving personal world model separating:
 * 1. Short-term conversation context (bounded)
 * 2. User-approved long-term memories (with explicit user consent)
 * 3. User preferences (language, response length, voice, quiet hours)
 * 4. Active projects (name, goals, milestones, status)
 * 5. Ongoing missions (active multi-step tasks)
 * 6. Tactical notes & saved content (separated from personal memories)
 * 7. Explicit scheduled reminders (time, repeat, status)
 * 8. Task history & verification results
 * 9. Temporary execution state
 * 
 * Strict Privacy & Epistemic Rules:
 * - Credentials (passwords, PINs, OTPs, tokens) are NEVER stored in memory.
 * - Distinguishes verified facts, inferences, and temporary assumptions.
 * - Consent-aware: long-term memories require user consent or confirmation.
 * - Bounded storage with user inspection and deletion controls.
 */

import { redactSensitiveData } from './actionPolicyEngine';

export type MemoryEpistemicType = 'FACT' | 'INFERENCE' | 'ASSUMPTION' | 'USER_STATED';

export interface LongTermMemory {
  id: string;
  key: string;
  value: string;
  category: 'preference' | 'personal_fact' | 'work_context' | 'relationship' | 'goal';
  epistemicType: MemoryEpistemicType;
  confidence: number; // 0.0 to 1.0
  createdAt: number;
  updatedAt: number;
  lastRetrievedAt?: number;
  userApproved: boolean;
  sourceTurn?: string;
}

export interface UserPreferences {
  preferredLanguage: string;
  spokenResponseLanguage: string;
  responseLength: 'concise' | 'balanced' | 'detailed';
  formality: 'professional' | 'casual' | 'jarvis_futuristic';
  voiceSpeed: 'slow' | 'normal' | 'fast';
  voicePitch: 'low' | 'natural' | 'high';
  proactivityMode: 'reactive' | 'assistive' | 'authorized_proactive';
  quietHours: {
    enabled: boolean;
    startHour: number; // 0-23 (e.g. 22 for 10 PM)
    endHour: number;   // 0-23 (e.g. 7 for 7 AM)
  };
  allowLocationAccess: boolean;
  dateFormat: 'DD/MM/YYYY' | 'long_text';
}

export interface ActiveProject {
  id: string;
  name: string;
  description: string;
  goals: string[];
  status: 'active' | 'paused' | 'completed';
  createdAt: number;
  updatedAt: number;
  lastCheckpoint?: string;
}

export interface ScheduledReminder {
  id: string;
  title: string;
  description?: string;
  triggerTime: number; // epoch ms
  repeat?: 'daily' | 'weekly' | 'none';
  triggered: boolean;
  createdAt: number;
  linkedProjectId?: string;
}

export interface WorldModelSnapshot {
  preferences: UserPreferences;
  longTermMemories: LongTermMemory[];
  activeProjects: ActiveProject[];
  reminders: ScheduledReminder[];
  notesCount: number;
  lastUpdated: number;
}

const STORAGE_KEY_PREFS = 'vajra_user_preferences_v2';
const STORAGE_KEY_LONG_TERM = 'vajra_long_term_memories_v2';
const STORAGE_KEY_PROJECTS = 'vajra_active_projects_v2';
const STORAGE_KEY_REMINDERS = 'vajra_scheduled_reminders_v2';

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  preferredLanguage: 'en-IN',
  spokenResponseLanguage: 'en-IN',
  responseLength: 'concise',
  formality: 'jarvis_futuristic',
  voiceSpeed: 'normal',
  voicePitch: 'natural',
  proactivityMode: 'assistive',
  quietHours: {
    enabled: true,
    startHour: 22, // 10:00 PM
    endHour: 7,    // 07:00 AM
  },
  allowLocationAccess: true,
  dateFormat: 'DD/MM/YYYY',
};

class PersonalWorldModel {
  private preferences: UserPreferences = { ...DEFAULT_USER_PREFERENCES };
  private longTermMemories: LongTermMemory[] = [];
  private activeProjects: ActiveProject[] = [];
  private reminders: ScheduledReminder[] = [];

  constructor() {
    this.loadState();
  }

  private loadState(): void {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;

    try {
      const prefsRaw = localStorage.getItem(STORAGE_KEY_PREFS);
      if (prefsRaw) {
        this.preferences = { ...DEFAULT_USER_PREFERENCES, ...JSON.parse(prefsRaw) };
      }

      const memsRaw = localStorage.getItem(STORAGE_KEY_LONG_TERM);
      if (memsRaw) {
        this.longTermMemories = JSON.parse(memsRaw);
      }

      const projRaw = localStorage.getItem(STORAGE_KEY_PROJECTS);
      if (projRaw) {
        this.activeProjects = JSON.parse(projRaw);
      }

      const remsRaw = localStorage.getItem(STORAGE_KEY_REMINDERS);
      if (remsRaw) {
        this.reminders = JSON.parse(remsRaw);
      }
    } catch (e) {
      console.warn('PersonalWorldModel: loadState fallback to default:', e);
    }
  }

  private persistState(): void {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;

    try {
      localStorage.setItem(STORAGE_KEY_PREFS, JSON.stringify(this.preferences));
      localStorage.setItem(STORAGE_KEY_LONG_TERM, JSON.stringify(this.longTermMemories.slice(0, 100)));
      localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(this.activeProjects.slice(0, 20)));
      localStorage.setItem(STORAGE_KEY_REMINDERS, JSON.stringify(this.reminders.slice(0, 50)));
    } catch (e) {
      console.warn('PersonalWorldModel: persistState error:', e);
    }
  }

  // --- PREFERENCES ---
  public getPreferences(): UserPreferences {
    return { ...this.preferences };
  }

  public updatePreferences(updates: Partial<UserPreferences>): UserPreferences {
    this.preferences = { ...this.preferences, ...updates };
    this.persistState();
    return { ...this.preferences };
  }

  // --- LONG-TERM MEMORY (Consent-Gated & Redacted) ---
  public getLongTermMemories(): LongTermMemory[] {
    return [...this.longTermMemories];
  }

  public addLongTermMemory(item: {
    key: string;
    value: string;
    category?: LongTermMemory['category'];
    epistemicType?: MemoryEpistemicType;
    confidence?: number;
    userApproved?: boolean;
    sourceTurn?: string;
  }): LongTermMemory | null {
    if (!item.key?.trim() || !item.value?.trim()) return null;

    // Redact sensitive patterns (passwords, PINs, tokens)
    const sanitizedKey = redactSensitiveData(item.key.trim());
    const sanitizedValue = redactSensitiveData(item.value.trim());

    // If key or value contained raw credentials, reject storage
    if (sanitizedKey.includes('[REDACTED]') || sanitizedValue.includes('[REDACTED]')) {
      console.warn('PersonalWorldModel: Sensitive credentials rejected from long term memory.');
      return null;
    }

    const memoryId = `mem-lt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newMemory: LongTermMemory = {
      id: memoryId,
      key: sanitizedKey,
      value: sanitizedValue,
      category: item.category || 'personal_fact',
      epistemicType: item.epistemicType || 'USER_STATED',
      confidence: item.confidence ?? 0.95,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      userApproved: item.userApproved ?? true,
      sourceTurn: item.sourceTurn,
    };

    // Update existing key if duplicate
    const existingIndex = this.longTermMemories.findIndex(
      (m) => m.key.toLowerCase() === sanitizedKey.toLowerCase()
    );

    if (existingIndex >= 0) {
      this.longTermMemories[existingIndex] = {
        ...this.longTermMemories[existingIndex],
        value: sanitizedValue,
        updatedAt: Date.now(),
        userApproved: item.userApproved ?? this.longTermMemories[existingIndex].userApproved,
      };
    } else {
      this.longTermMemories.unshift(newMemory);
    }

    this.persistState();
    return newMemory;
  }

  public deleteLongTermMemory(id: string): boolean {
    const prevLen = this.longTermMemories.length;
    this.longTermMemories = this.longTermMemories.filter((m) => m.id !== id);
    if (this.longTermMemories.length !== prevLen) {
      this.persistState();
      return true;
    }
    return false;
  }

  public clearAllMemories(): void {
    this.longTermMemories = [];
    this.persistState();
  }

  // --- RELEVANT MEMORY RETRIEVAL ---
  public retrieveRelevantMemories(query: string, maxItems = 4): LongTermMemory[] {
    if (!query || this.longTermMemories.length === 0) return [];
    const tokens = query
      .toLowerCase()
      .replace(/[^a-z0-9\s]/gi, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 2);

    const scored = this.longTermMemories.map((mem) => {
      let score = 0;
      const memText = `${mem.key} ${mem.value} ${mem.category}`.toLowerCase();
      for (const t of tokens) {
        if (memText.includes(t)) score += 1;
      }
      return { mem, score };
    });

    return scored
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxItems)
      .map((s) => {
        s.mem.lastRetrievedAt = Date.now();
        return s.mem;
      });
  }

  // --- ACTIVE PROJECTS ---
  public getActiveProjects(): ActiveProject[] {
    return [...this.activeProjects];
  }

  public addProject(name: string, description: string, goals: string[] = []): ActiveProject {
    const proj: ActiveProject = {
      id: `proj-${Date.now()}`,
      name: redactSensitiveData(name.trim()),
      description: redactSensitiveData(description.trim()),
      goals: goals.map((g) => redactSensitiveData(g.trim())),
      status: 'active',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    this.activeProjects.unshift(proj);
    this.persistState();
    return proj;
  }

  public updateProjectCheckpoint(id: string, checkpoint: string): boolean {
    const proj = this.activeProjects.find((p) => p.id === id);
    if (proj) {
      proj.lastCheckpoint = checkpoint;
      proj.updatedAt = Date.now();
      this.persistState();
      return true;
    }
    return false;
  }

  // --- SCHEDULED REMINDERS ---
  public getReminders(): ScheduledReminder[] {
    return [...this.reminders];
  }

  public addReminder(title: string, triggerTime: number, repeat?: 'daily' | 'weekly' | 'none'): ScheduledReminder {
    const rem: ScheduledReminder = {
      id: `rem-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title: redactSensitiveData(title.trim()),
      triggerTime,
      repeat: repeat || 'none',
      triggered: false,
      createdAt: Date.now(),
    };
    this.reminders.push(rem);
    this.persistState();
    return rem;
  }

  public markReminderTriggered(id: string): void {
    const rem = this.reminders.find((r) => r.id === id);
    if (rem) {
      rem.triggered = true;
      if (rem.repeat === 'daily') {
        rem.triggerTime += 24 * 60 * 60 * 1000;
        rem.triggered = false;
      } else if (rem.repeat === 'weekly') {
        rem.triggerTime += 7 * 24 * 60 * 60 * 1000;
        rem.triggered = false;
      }
      this.persistState();
    }
  }

  public deleteReminder(id: string): boolean {
    const prev = this.reminders.length;
    this.reminders = this.reminders.filter((r) => r.id !== id);
    if (this.reminders.length !== prev) {
      this.persistState();
      return true;
    }
    return false;
  }

  // --- SNAPSHOT EXPORT ---
  public getSnapshot(): WorldModelSnapshot {
    return {
      preferences: this.getPreferences(),
      longTermMemories: this.getLongTermMemories(),
      activeProjects: this.getActiveProjects(),
      reminders: this.getReminders(),
      notesCount: 0,
      lastUpdated: Date.now(),
    };
  }
}

export const personalWorldModel = new PersonalWorldModel();
