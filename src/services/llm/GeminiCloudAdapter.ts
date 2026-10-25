import { LLMAdapter, ChatMessagePayload, GenerationOptions, StreamCallbacks } from './types';

export class GeminiCloudAdapter implements LLMAdapter {
  readonly id = 'gemini-cloud';
  readonly name = 'Gemini Cloud Engine';
  readonly type = 'cloud' as const;
  readonly isOfflineCapable = false;

  async getStatus(): Promise<'ready' | 'available' | 'loading' | 'needs_model_weights'> {
    return navigator.onLine ? 'ready' : 'available';
  }

  async streamResponse(
    messages: ChatMessagePayload[],
    options: GenerationOptions,
    callbacks: StreamCallbacks
  ): Promise<void> {
    if (!navigator.onLine) {
      callbacks.onError('No internet connection. Please switch to Offline Local Engine or reconnect.');
      callbacks.onFinish();
      return;
    }

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages,
          model: options.modelId || 'gemini-3.1-flash-lite',
          systemInstruction: options.systemInstruction,
        }),
        signal: options.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.error || `Server responded with status ${response.status}`;
        callbacks.onError(errorMsg);
        callbacks.onFinish();
        return;
      }

      if (!response.body) {
        callbacks.onError('ReadableStream not supported in response body.');
        callbacks.onFinish();
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      const processLine = (line: string): boolean => {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) return false;

        const dataStr = trimmed.replace(/^data:\s*/, '');
        if (dataStr === '[DONE]') {
          callbacks.onFinish();
          return true; // Finished
        }

        try {
          const parsed = JSON.parse(dataStr);
          if (parsed.error) {
            let cleanErr = parsed.error;
            if (typeof cleanErr === 'string') {
              try {
                const inner = JSON.parse(cleanErr);
                if (inner.error?.message) cleanErr = inner.error.message;
              } catch {}
            }
            callbacks.onError(cleanErr);
            callbacks.onFinish();
            return true;
          }
          if (parsed.text) {
            callbacks.onChunk(parsed.text);
          }
        } catch {
          // non-JSON SSE chunk ignored
        }
        return false;
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split(/\r?\n\r?\n/);
        buffer = events.pop() || '';

        for (const event of events) {
          const lines = event.split(/\r?\n/);
          for (const line of lines) {
            const finished = processLine(line);
            if (finished) return;
          }
        }
      }

      if (buffer.trim()) {
        const lines = buffer.split(/\r?\n/);
        for (const line of lines) {
          const finished = processLine(line);
          if (finished) return;
        }
      }

      callbacks.onFinish();
    } catch (error: any) {
      if (error.name === 'AbortError') {
        callbacks.onFinish();
      } else {
        callbacks.onError(error.message || 'Failed to connect to Cloud Gemini Engine.');
        callbacks.onFinish();
      }
    }
  }
}
