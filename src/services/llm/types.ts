export type ModelMode = 'cloud' | 'local';

export interface StreamCallbacks {
  onChunk: (chunk: string) => void;
  onError: (error: string) => void;
  onFinish: () => void;
}

export interface ChatMessagePayload {
  role: 'user' | 'assistant';
  content: string;
}

export interface GenerationOptions {
  modelId?: string;
  temperature?: number;
  systemInstruction?: string;
  signal?: AbortSignal;
}

export interface LLMProviderInfo {
  id: string;
  name: string;
  type: ModelMode;
  isOfflineCapable: boolean;
  description: string;
  status: 'ready' | 'loading' | 'available' | 'needs_model_weights';
  badge?: string;
}

export interface LLMAdapter {
  readonly id: string;
  readonly name: string;
  readonly type: ModelMode;
  readonly isOfflineCapable: boolean;
  
  getStatus(): Promise<'ready' | 'available' | 'loading' | 'needs_model_weights'>;
  streamResponse(
    messages: ChatMessagePayload[],
    options: GenerationOptions,
    callbacks: StreamCallbacks
  ): Promise<void>;
}
