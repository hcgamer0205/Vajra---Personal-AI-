/**
 * VAJRA Mobile — Proactive Assistance & Reminders Engine
 * 
 * Implements bounded, user-authorized proactive capabilities:
 * - Initiative Modes:
 *   1. Reactive: Respond only when explicitly asked.
 *   2. Assistive: Offer helpful suggestions and ask before taking action.
 *   3. Authorized Proactive: Execute predefined low-risk reminders and briefings within configured quiet hours.
 * 
 * Features:
 * - Scheduled reminders checking and triggering
 * - Daily Indian morning/evening briefing generator
 * - Quiet hours enforcement (IST-based)
 * - Follow-up suggestions for paused or in-progress projects
 * - Non-escalation guarantee: High-risk actions (SMS, calls, financial) are NEVER executed autonomously.
 */

import { personalWorldModel, ScheduledReminder } from './personalWorldModel';
import { formatIndianDate, formatIndianCurrency } from './indianLanguageRegistry';
import { mobileControlEngine } from './mobileControlEngine';

export interface ProactiveBriefing {
  id: string;
  greeting: string;
  dateStr: string;
  batteryStatus?: string;
  dueReminders: ScheduledReminder[];
  activeProjectsCount: number;
  suggestions: string[];
  generatedAt: number;
}

class ProactiveEngine {
  private checkIntervalHandle: any = null;
  private onReminderTriggeredCallback: ((reminder: ScheduledReminder) => void) | null = null;

  constructor() {
    this.startBackgroundChecker();
  }

  public setOnReminderTriggered(cb: (reminder: ScheduledReminder) => void): void {
    this.onReminderTriggeredCallback = cb;
  }

  /**
   * Evaluates if current time falls within user-configured Quiet Hours.
   */
  public isWithinQuietHours(): boolean {
    const prefs = personalWorldModel.getPreferences();
    if (!prefs.quietHours.enabled) return false;

    const now = new Date();
    const currentHour = now.getHours();

    const start = prefs.quietHours.startHour; // e.g. 22 (10 PM)
    const end = prefs.quietHours.endHour;     // e.g. 7 (7 AM)

    if (start > end) {
      // Crosses midnight (e.g. 22:00 to 07:00)
      return currentHour >= start || currentHour < end;
    } else {
      // Same day (e.g. 01:00 to 05:00)
      return currentHour >= start && currentHour < end;
    }
  }

  /**
   * Generates a comprehensive, Indian-context Daily Briefing.
   */
  public async generateDailyBriefing(): Promise<ProactiveBriefing> {
    const now = new Date();
    const hour = now.getHours();
    let greeting = 'Good morning';
    if (hour >= 12 && hour < 17) greeting = 'Good afternoon';
    else if (hour >= 17) greeting = 'Good evening';

    const dateStr = formatIndianDate(now, { includeTime: true, format: 'long_text' });
    const reminders = personalWorldModel.getReminders().filter((r) => !r.triggered);
    const projects = personalWorldModel.getActiveProjects().filter((p) => p.status === 'active');

    // Query device battery if available
    let batteryStatus: string | undefined;
    try {
      const caps = await mobileControlEngine.discoverCapabilities();
      if (caps.battery) {
        batteryStatus = `Battery at ${caps.battery.level}% (${caps.battery.isCharging ? 'Charging' : 'Discharging'})`;
      }
    } catch {}

    const suggestions: string[] = [];
    if (reminders.length > 0) {
      suggestions.push(`You have ${reminders.length} pending reminder${reminders.length > 1 ? 's' : ''} scheduled.`);
    }
    if (projects.length > 0) {
      suggestions.push(`Active project "${projects[0].name}" is ready for checkpoint review.`);
    } else {
      suggestions.push('All projects are up to date. Ready for new directives.');
    }

    return {
      id: `briefing-${Date.now()}`,
      greeting: `${greeting}, Commander. VAJRA Core is operational.`,
      dateStr,
      batteryStatus,
      dueReminders: reminders.slice(0, 5),
      activeProjectsCount: projects.length,
      suggestions,
      generatedAt: Date.now(),
    };
  }

  /**
   * Checks due reminders and triggers authorized notifications.
   */
  public checkDueReminders(): ScheduledReminder[] {
    const prefs = personalWorldModel.getPreferences();
    if (prefs.proactivityMode === 'reactive') {
      return []; // Reactive mode halts proactive reminders
    }

    if (this.isWithinQuietHours()) {
      return []; // Silence notifications during quiet hours
    }

    const now = Date.now();
    const all = personalWorldModel.getReminders();
    const due = all.filter((r) => !r.triggered && r.triggerTime <= now);

    for (const rem of due) {
      personalWorldModel.markReminderTriggered(rem.id);
      this.onReminderTriggeredCallback?.(rem);

      // Attempt native browser notification if granted
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification('VAJRA Reminder', {
            body: rem.title,
            icon: '/favicon.ico',
          });
        } catch {}
      }
    }

    return due;
  }

  private startBackgroundChecker(): void {
    if (typeof window === 'undefined') return;
    if (this.checkIntervalHandle) clearInterval(this.checkIntervalHandle);

    // Check reminders every 30 seconds
    this.checkIntervalHandle = setInterval(() => {
      this.checkDueReminders();
    }, 30000);
  }

  public stopBackgroundChecker(): void {
    if (this.checkIntervalHandle) {
      clearInterval(this.checkIntervalHandle);
      this.checkIntervalHandle = null;
    }
  }
}

export const proactiveEngine = new ProactiveEngine();
