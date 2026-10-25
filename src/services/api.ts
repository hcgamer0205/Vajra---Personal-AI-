import { Message, ModelOption } from '../types';
import { llmManager, ChatMessagePayload } from './llm';
import type { StreamCallbacks } from './llm';

export type { StreamCallbacks } from './llm';

export async function fetchModelConfig(): Promise<{
  models: ModelOption[];
  defaultModel: string;
  systemInstruction: string;
}> {
  try {
    const res = await fetch('/api/models');
    if (!res.ok) {
      throw new Error(`Failed to fetch model configuration: ${res.statusText}`);
    }
    return await res.json();
  } catch (err) {
    console.warn('Backend /api/models unavailable (offline mode supported):', err);
    return {
      models: [
        {
          id: 'gemini-3.1-flash-lite',
          name: 'VAJRA Stream Engine (Gemini 3.1 Flash Lite)',
          description: 'Ultra-low latency conversational stream.',
          isDefault: true,
        },
        {
          id: 'gemini-3.7-flash',
          name: 'VAJRA Neural Core (Gemini 3.7 Flash)',
          description: 'Flagship quantum response model.',
          isDefault: false,
        },
        {
          id: 'local-browser-engine',
          name: 'VAJRA Local Browser Engine',
          description: 'Runs on-device without cloud API.',
          isDefault: false,
        },
      ],
      defaultModel: 'gemini-3.1-flash-lite',
      systemInstruction: 'You are VAJRA, a state-of-the-art personal AI control system.',
    };
  }
}

export async function streamChatCompletion(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  model: string,
  callbacks: StreamCallbacks,
  signal?: AbortSignal
): Promise<void> {
  const payload: ChatMessagePayload[] = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  await llmManager.streamChat(
    payload,
    {
      modelId: model,
      signal,
    },
    callbacks
  );
}
