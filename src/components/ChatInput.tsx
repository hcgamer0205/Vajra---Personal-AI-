import React from 'react';
import { VajraVoiceConsole } from './VajraVoiceConsole';
import { AssistantState } from '../types';

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  onSend: () => void;
  onStop: () => void;
  isStreaming: boolean;
  disabled?: boolean;
  isOfflineMode?: boolean;
  state?: AssistantState;
  isListening?: boolean;
  onToggleVoice?: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  input,
  setInput,
  onSend,
  onStop,
  isStreaming,
  state = 'idle',
  isListening = false,
  onToggleVoice = () => {},
}) => {
  return (
    <VajraVoiceConsole
      input={input}
      setInput={setInput}
      onSend={onSend}
      onStop={onStop}
      isStreaming={isStreaming}
      state={state}
      isListening={isListening}
      onToggleVoice={onToggleVoice}
    />
  );
};
