export type MemoryCategory = 'preference' | 'context' | 'directive' | 'fact';

export interface VajraMemoryItem {
  id: string;
  category: MemoryCategory;
  key: string;
  value: string;
  timestamp: number;
  pinned?: boolean;
}

const STORAGE_KEY_MEMORY = 'vajra_persistent_memory_v1';
const MAX_MEMORIES = 50;

// Sensitive terms guard: passwords, tokens, credentials must NEVER be stored
const SENSITIVE_PATTERNS = [
  /\bpassword\b/i,
  /\bapi[-_]?key\b/i,
  /\bsecret\b/i,
  /\bbearer\b/i,
  /\btoken\b/i,
  /\bcredentials?\b/i,
  /\bprivate[-_]?key\b/i,
  /\bauth\b/i,
  /\bssn\b/i,
  /\bcredit[-_]?card\b/i,
  /\bcvv\b/i,
  /\bpin[-_]?code\b/i,
];

export function isSensitiveMemoryContent(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  return SENSITIVE_PATTERNS.some((pattern) => pattern.test(text));
}

const DEFAULT_STARTER_MEMORIES: Omit<VajraMemoryItem, 'id' | 'timestamp'>[] = [
  {
    category: 'preference',
    key: 'Tone & Style',
    value: 'Futuristic JARVIS/VAJRA tone: concise, crisp, and scientifically grounded.',
    pinned: true,
  },
  {
    category: 'preference',
    key: 'Safety Directives',
    value: 'Confirm all critical system file deletions before execution.',
    pinned: true,
  },
  {
    category: 'context',
    key: 'Architecture Mode',
    value: 'Hybrid execution: On-device local browser core with Gemini cloud stream.',
    pinned: false,
  },
];

export function loadMemories(): VajraMemoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MEMORY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }

    // Seed initial starter memories if storage is completely empty
    const seeded: VajraMemoryItem[] = DEFAULT_STARTER_MEMORIES.map((item, index) => ({
      ...item,
      id: `mem-init-${Date.now()}-${index}`,
      timestamp: Date.now() - index * 1000,
    }));
    saveMemories(seeded);
    return seeded;
  } catch (err) {
    console.warn('VAJRA: Could not load persistent memory from localStorage:', err);
    return [];
  }
}

export function saveMemories(memories: VajraMemoryItem[]): void {
  try {
    // Keep bounded: never exceed MAX_MEMORIES
    let bounded = [...memories];
    if (bounded.length > MAX_MEMORIES) {
      // Sort so pinned are preserved, oldest unpinned pruned
      const pinned = bounded.filter((m) => m.pinned);
      const unpinned = bounded.filter((m) => !m.pinned).sort((a, b) => b.timestamp - a.timestamp);
      const allowedUnpinnedCount = Math.max(0, MAX_MEMORIES - pinned.length);
      bounded = [...pinned, ...unpinned.slice(0, allowedUnpinnedCount)];
    }
    localStorage.setItem(STORAGE_KEY_MEMORY, JSON.stringify(bounded));
  } catch (err) {
    console.warn('VAJRA: Could not persist memory to localStorage:', err);
  }
}

export function addMemory(
  item: Omit<VajraMemoryItem, 'id' | 'timestamp'>
): VajraMemoryItem | null {
  // Reject sensitive or empty content
  if (!item.key?.trim() || !item.value?.trim()) return null;
  if (isSensitiveMemoryContent(item.key) || isSensitiveMemoryContent(item.value)) {
    console.warn('VAJRA Memory Guard: Blocked attempt to store sensitive credentials.');
    return null;
  }

  try {
    const existing = loadMemories();
    // Check for duplicate key
    const normalizedKey = item.key.trim().toLowerCase();
    const existingIndex = existing.findIndex((m) => m.key.trim().toLowerCase() === normalizedKey);

    const newItem: VajraMemoryItem = {
      id: `mem-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      category: item.category,
      key: item.key.trim(),
      value: item.value.trim(),
      timestamp: Date.now(),
      pinned: item.pinned ?? false,
    };

    let updated: VajraMemoryItem[];
    if (existingIndex >= 0) {
      // Update existing item
      updated = [...existing];
      updated[existingIndex] = {
        ...updated[existingIndex],
        category: item.category,
        value: item.value.trim(),
        timestamp: Date.now(),
        pinned: item.pinned ?? updated[existingIndex].pinned,
      };
    } else {
      updated = [newItem, ...existing];
    }

    saveMemories(updated);
    return newItem;
  } catch (err) {
    console.warn('VAJRA: Error adding memory:', err);
    return null;
  }
}

export function updateMemory(
  id: string,
  updates: Partial<Omit<VajraMemoryItem, 'id'>>
): boolean {
  try {
    const existing = loadMemories();
    const index = existing.findIndex((m) => m.id === id);
    if (index === -1) return false;

    // Check sensitive content if key or value updated
    if (updates.key && isSensitiveMemoryContent(updates.key)) return false;
    if (updates.value && isSensitiveMemoryContent(updates.value)) return false;

    existing[index] = {
      ...existing[index],
      ...updates,
      timestamp: Date.now(),
    };
    saveMemories(existing);
    return true;
  } catch (err) {
    console.warn('VAJRA: Error updating memory:', err);
    return false;
  }
}

export function togglePinMemory(id: string): boolean {
  try {
    const existing = loadMemories();
    const target = existing.find((m) => m.id === id);
    if (!target) return false;
    target.pinned = !target.pinned;
    saveMemories(existing);
    return true;
  } catch (err) {
    console.warn('VAJRA: Error toggling pin memory:', err);
    return false;
  }
}

export function deleteMemory(id: string): void {
  try {
    const existing = loadMemories();
    const filtered = existing.filter((m) => m.id !== id);
    saveMemories(filtered);
  } catch (err) {
    console.warn('VAJRA: Error deleting memory:', err);
  }
}

export function clearAllMemories(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_MEMORY);
  } catch (err) {
    console.warn('VAJRA: Error clearing memories:', err);
  }
}

/**
 * Checks if user query is asking to see, recall, or check stored memories.
 */
export function isMemoryQuery(userText: string): boolean {
  if (!userText || typeof userText !== 'string') return false;
  const q = userText.toLowerCase().trim();
  return (
    q === 'memory' ||
    q === 'memories' ||
    q.includes('what do you remember') ||
    q.includes('what do you know about me') ||
    q.includes('show memories') ||
    q.includes('show my memories') ||
    q.includes('list memories') ||
    q.includes('list my memories') ||
    q.includes('open memory') ||
    q.includes('view memory') ||
    q.includes('check memory') ||
    q.includes('what is stored in memory') ||
    q.includes("what's in your memory") ||
    q.includes('what is in your memory') ||
    q.includes('tell me what you remember')
  );
}

/**
 * Generates an Iron Man HUD styled markdown summary of stored memories
 */
export function formatMemoriesSummaryMarkdown(memList?: VajraMemoryItem[]): string {
  const list = memList || loadMemories();
  if (list.length === 0) {
    return `### 🧠 VAJRA Memory Vault: [EMPTY]

No persistent user directives or facts are currently committed to storage.

You can record items at any time by speaking or typing:
- *"Remember that my name is Tony"*
- *"Remember to keep answers concise and technical"*
- *"Remember my project is Mark VII"*`;
  }

  const pinned = list.filter((m) => m.pinned);
  const unpinned = list.filter((m) => !m.pinned);

  const formatItem = (item: VajraMemoryItem) =>
    `• **${item.key}** (${item.category.toUpperCase()}): ${item.value} ${item.pinned ? '📌 *(Pinned)*' : ''}`;

  let out = `### 🧠 VAJRA Neural Memory Vault (${list.length} Records Active)\n\n`;
  out += `*All records below are automatically injected into the neural prompt on every query.*\n\n`;

  if (pinned.length > 0) {
    out += `#### 📌 Pinned High-Priority Directives:\n`;
    out += pinned.map(formatItem).join('\n') + '\n\n';
  }

  if (unpinned.length > 0) {
    out += `#### 📝 Standard Memory Entries:\n`;
    out += unpinned.map(formatItem).join('\n') + '\n\n';
  }

  out += `*To add or edit items, use the **Memory Vault [🧠]** in the top HUD or simply say "Remember [details]...".*`;
  return out;
}

/**
 * Automatically inspects user inputs for important directives/facts to remember.
 * Bounded & safe: will only store when the user clearly expresses a fact or preference.
 */
export function detectAndSaveKeyMemory(userText: string): VajraMemoryItem | null {
  if (!userText || typeof userText !== 'string') return null;
  const text = userText.trim();

  // Guard against sensitive credentials
  if (isSensitiveMemoryContent(text)) return null;

  // Don't save if it's just asking a question about memory
  if (isMemoryQuery(text)) return null;

  // Pattern A: "Remember my [X] is [Y]" or "Remember [X] is [Y]"
  const myIsMatch = text.match(/^(?:please\s+)?(?:remember|note|store)\s+(?:that\s+)?(?:my\s+)?([a-zA-Z0-9_\s]{2,25})\s+(?:is|are)\s+(.+)$/i);
  if (myIsMatch && myIsMatch[1] && myIsMatch[2]) {
    const rawKey = myIsMatch[1].trim();
    const val = myIsMatch[2].trim();
    if (val.length > 1 && val.length < 250) {
      const category: MemoryCategory =
        rawKey.toLowerCase().includes('name') || rawKey.toLowerCase().includes('identity') || rawKey.toLowerCase().includes('birthday')
          ? 'fact'
          : rawKey.toLowerCase().includes('favorite') || rawKey.toLowerCase().includes('preference')
          ? 'preference'
          : 'context';
      return addMemory({
        category,
        key: rawKey.charAt(0).toUpperCase() + rawKey.slice(1),
        value: val,
        pinned: category === 'fact',
      });
    }
  }

  // Pattern B: "Remember to [do X]"
  const rememberToMatch = text.match(/^(?:please\s+)?(?:remember|don't forget|keep in mind)\s+to\s+(.+)$/i);
  if (rememberToMatch && rememberToMatch[1]) {
    const val = rememberToMatch[1].trim();
    if (val.length > 3 && val.length < 250) {
      return addMemory({
        category: 'directive',
        key: `System Directive: ${val.slice(0, 30)}${val.length > 30 ? '...' : ''}`,
        value: `Always remember to ${val}`,
        pinned: true,
      });
    }
  }

  // Pattern C: "Remember that X", "Please remember X", "Keep in mind that X", "Don't forget that X", "Save to memory: X"
  const generalRememberMatch = text.match(
    /^(?:please\s+)?(?:remember|note|store|keep\s+in\s+mind|don't\s+forget|save\s+to\s+memory(?::)?)\s+(?:that\s+)?(.+)$/i
  );
  if (generalRememberMatch && generalRememberMatch[1]) {
    const content = generalRememberMatch[1].trim();
    if (content.length > 3 && content.length < 300) {
      return addMemory({
        category: 'directive',
        key: `User Directive (${new Date().toLocaleDateString()})`,
        value: content,
      });
    }
  }

  // Pattern D: "My name is X", "Call me X"
  const nameMatch = text.match(/^(?:my name is|call me)\s+([A-Z][a-zA-Z0-9_\s]{1,30})/i);
  if (nameMatch && nameMatch[1]) {
    const name = nameMatch[1].trim();
    if (name.length > 1 && !isSensitiveMemoryContent(name)) {
      return addMemory({
        category: 'fact',
        key: 'User Identity',
        value: `User preferred name: ${name}`,
        pinned: true,
      });
    }
  }

  // Pattern E: "My favorite X is Y"
  const favMatch = text.match(/^my\s+favorite\s+([a-zA-Z0-9_\s]{2,25})\s+is\s+(.+)$/i);
  if (favMatch && favMatch[1] && favMatch[2]) {
    const topic = favMatch[1].trim();
    const favVal = favMatch[2].trim();
    if (favVal.length > 1 && favVal.length < 150) {
      return addMemory({
        category: 'preference',
        key: `Favorite ${topic.charAt(0).toUpperCase() + topic.slice(1)}`,
        value: favVal,
      });
    }
  }

  // Pattern F: "I prefer X", "I like X"
  const prefMatch = text.match(/^i\s+(?:prefer|like|love)\s+(.+)$/i);
  if (prefMatch && prefMatch[1]) {
    const pref = prefMatch[1].trim();
    if (pref.length > 3 && pref.length < 150) {
      return addMemory({
        category: 'preference',
        key: 'User Preference',
        value: pref,
      });
    }
  }

  return null;
}

/**
 * Formats persistent memories into a clean, bounded markdown block to inject into LLM prompts.
 */
export function formatMemoriesForPrompt(): string {
  try {
    const memories = loadMemories();
    if (memories.length === 0) return '';

    // Take at most top 15 memories to avoid token bloat
    const sample = memories.slice(0, 15);
    const lines = sample.map((m) => `• [${m.category.toUpperCase()}] ${m.key}: ${m.value}`);
    return `\n[VAJRA PERSISTENT USER MEMORY]\n${lines.join('\n')}\n`;
  } catch {
    return '';
  }
}
