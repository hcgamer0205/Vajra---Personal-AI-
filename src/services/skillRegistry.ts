/**
 * VAJRA Mobile — Universal Skill & Capability Registry
 * 
 * Declarative catalog of all executable capabilities and skills supported by VAJRA:
 * - Skill groups: conversation, search, phone_controls, notes_memory, reminders,
 *   documents_images, calculations, communication_drafts, navigation, device_status, missions.
 * - Explicit schemas, risk levels, timeout bounds, and cancellation support.
 */

import { ActionRiskLevel } from './actionPolicyEngine';
import { VajraAction } from '../types';

export type SkillGroup =
  | 'conversation_knowledge'
  | 'search_information'
  | 'phone_controls'
  | 'notes_memory'
  | 'reminders'
  | 'documents_images'
  | 'calculations'
  | 'communication_drafts'
  | 'navigation'
  | 'device_status'
  | 'missions';

export interface SkillParameterSchema {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  required: boolean;
}

export interface SkillDefinition {
  id: string;
  name: string;
  group: SkillGroup;
  description: string;
  parameters: SkillParameterSchema[];
  requiredPermissions: string[];
  riskLevel: ActionRiskLevel;
  timeoutMs: number;
  cancellable: boolean;
  verificationMethod: 'native_intent' | 'state_diff' | 'user_feedback' | 'instant';
  targetActionType?: string;
}

export const REGISTERED_SKILLS: SkillDefinition[] = [
  {
    id: 'skill-open-settings',
    name: 'Open System Settings',
    group: 'phone_controls',
    description: 'Launches specific Android settings screen (Wi-Fi, Bluetooth, Display, Sound, Battery, Apps, Accessibility).',
    parameters: [
      { name: 'screen', type: 'string', description: 'Settings category: wifi, bluetooth, display, sound, battery, apps, accessibility', required: true },
    ],
    requiredPermissions: [],
    riskLevel: 'LOW',
    timeoutMs: 5000,
    cancellable: false,
    verificationMethod: 'native_intent',
    targetActionType: 'OPEN_SETTINGS',
  },
  {
    id: 'skill-open-camera',
    name: 'Open Camera',
    group: 'phone_controls',
    description: 'Opens native camera viewfinder for photography without covert capture.',
    parameters: [],
    requiredPermissions: ['android.permission.CAMERA'],
    riskLevel: 'MODERATE',
    timeoutMs: 5000,
    cancellable: false,
    verificationMethod: 'native_intent',
    targetActionType: 'OPEN_CAMERA',
  },
  {
    id: 'skill-dial-phone',
    name: 'Dial Phone Number',
    group: 'communication_drafts',
    description: 'Prefills telephone number into Android dialer for user inspection and tap.',
    parameters: [
      { name: 'phoneNumber', type: 'string', description: 'Target 10-digit telephone number or emergency number', required: true },
    ],
    requiredPermissions: [],
    riskLevel: 'MODERATE',
    timeoutMs: 5000,
    cancellable: false,
    verificationMethod: 'native_intent',
    targetActionType: 'DIAL_PHONE',
  },
  {
    id: 'skill-draft-sms',
    name: 'Draft SMS Message',
    group: 'communication_drafts',
    description: 'Opens SMS messenger with prefilled recipient and message draft for explicit user tap.',
    parameters: [
      { name: 'phoneNumber', type: 'string', description: 'Target phone number', required: true },
      { name: 'message', type: 'string', description: 'Message draft body', required: true },
    ],
    requiredPermissions: [],
    riskLevel: 'MODERATE',
    timeoutMs: 5000,
    cancellable: false,
    verificationMethod: 'native_intent',
    targetActionType: 'DRAFT_SMS',
  },
  {
    id: 'skill-draft-email',
    name: 'Draft Email',
    group: 'communication_drafts',
    description: 'Prepares email draft in mail application for review.',
    parameters: [
      { name: 'email', type: 'string', description: 'Recipient email address', required: true },
      { name: 'subject', type: 'string', description: 'Email subject line', required: true },
      { name: 'body', type: 'string', description: 'Email body text', required: true },
    ],
    requiredPermissions: [],
    riskLevel: 'MODERATE',
    timeoutMs: 5000,
    cancellable: false,
    verificationMethod: 'native_intent',
    targetActionType: 'DRAFT_EMAIL',
  },
  {
    id: 'skill-open-maps',
    name: 'Navigation & Maps',
    group: 'navigation',
    description: 'Opens Google Maps or Android geo intent with specified coordinates or destination.',
    parameters: [
      { name: 'destination', type: 'string', description: 'City, landmark, or destination address', required: true },
    ],
    requiredPermissions: [],
    riskLevel: 'LOW',
    timeoutMs: 5000,
    cancellable: false,
    verificationMethod: 'native_intent',
    targetActionType: 'OPEN_MAPS',
  },
  {
    id: 'skill-adjust-volume',
    name: 'Hardware Volume Control',
    group: 'phone_controls',
    description: 'Increases, decreases, or mutes device media stream audio volume with HUD feedback.',
    parameters: [
      { name: 'direction', type: 'string', description: 'Volume adjust: up, down, mute', required: true },
    ],
    requiredPermissions: [],
    riskLevel: 'LOW',
    timeoutMs: 3000,
    cancellable: false,
    verificationMethod: 'native_intent',
    targetActionType: 'ADJUST_VOLUME',
  },
  {
    id: 'skill-device-telemetry',
    name: 'Device Telemetry Status',
    group: 'device_status',
    description: 'Reads non-sensitive battery level, charging status, and network connection type.',
    parameters: [],
    requiredPermissions: ['android.permission.ACCESS_NETWORK_STATE'],
    riskLevel: 'LOW',
    timeoutMs: 3000,
    cancellable: false,
    verificationMethod: 'instant',
    targetActionType: 'GET_DEVICE_INFO',
  },
  {
    id: 'skill-manage-notes',
    name: 'Manage VAJRA Notes',
    group: 'notes_memory',
    description: 'Creates, reads, lists, or deletes local tactical scratchpad notes.',
    parameters: [
      { name: 'action', type: 'string', description: 'create, read, list, delete', required: true },
      { name: 'title', type: 'string', description: 'Note title', required: false },
      { name: 'body', type: 'string', description: 'Note content', required: false },
    ],
    requiredPermissions: [],
    riskLevel: 'LOW',
    timeoutMs: 2000,
    cancellable: false,
    verificationMethod: 'state_diff',
    targetActionType: 'MANAGE_VAJRA_NOTE',
  },
  {
    id: 'skill-emergency-stop',
    name: 'Global Emergency Stop',
    group: 'phone_controls',
    description: 'Instantly halts speech output, cancels active task planner executions, and disengages accessibility.',
    parameters: [],
    requiredPermissions: [],
    riskLevel: 'LOW',
    timeoutMs: 1000,
    cancellable: false,
    verificationMethod: 'instant',
    targetActionType: 'GLOBAL_STOP',
  },
  {
    id: 'skill-search-web',
    name: 'Google Web Search',
    group: 'search_information',
    description: 'Dispatches secure web search for query terms.',
    parameters: [
      { name: 'query', type: 'string', description: 'Search query', required: true },
    ],
    requiredPermissions: [],
    riskLevel: 'LOW',
    timeoutMs: 5000,
    cancellable: false,
    verificationMethod: 'native_intent',
    targetActionType: 'SEARCH_WEB',
  },
  {
    id: 'skill-manage-reminders',
    name: 'Scheduled Reminders',
    group: 'reminders',
    description: 'Schedules, inspects, and manages user reminders with optional repeat cycles.',
    parameters: [
      { name: 'title', type: 'string', description: 'Reminder subject', required: true },
      { name: 'triggerTime', type: 'number', description: 'Epoch millisecond timestamp', required: true },
    ],
    requiredPermissions: [],
    riskLevel: 'LOW',
    timeoutMs: 2000,
    cancellable: false,
    verificationMethod: 'state_diff',
  },
];

class SkillRegistry {
  public getAllSkills(): SkillDefinition[] {
    return [...REGISTERED_SKILLS];
  }

  public getSkillById(id: string): SkillDefinition | null {
    return REGISTERED_SKILLS.find((s) => s.id === id) || null;
  }

  public getSkillsByGroup(group: SkillGroup): SkillDefinition[] {
    return REGISTERED_SKILLS.filter((s) => s.group === group);
  }

  public validateSkillParameters(skillId: string, params: Record<string, any>): { valid: boolean; missingParams: string[] } {
    const skill = this.getSkillById(skillId);
    if (!skill) return { valid: false, missingParams: ['Skill not found'] };

    const missing: string[] = [];
    for (const p of skill.parameters) {
      if (p.required && (params[p.name] === undefined || params[p.name] === null || params[p.name] === '')) {
        missing.push(p.name);
      }
    }

    return {
      valid: missing.length === 0,
      missingParams: missing,
    };
  }
}

export const skillRegistry = new SkillRegistry();
