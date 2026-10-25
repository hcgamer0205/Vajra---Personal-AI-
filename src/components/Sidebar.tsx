import React from 'react';
import { TelemetryDrawer } from './TelemetryDrawer';
import { Message } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  messages: Message[];
  onClearChat: () => void;
  onSelectPrompt?: (prompt: string) => void;
  onOpenVoiceDiagnostics?: () => void;
  onOpenTool?: (tool: 'calculator' | 'notepad' | 'file_explorer' | 'native_bridge' | 'url_modal' | 'search_modal') => void;
  onOpenEngineModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  messages,
  onClearChat,
  onSelectPrompt,
  onOpenVoiceDiagnostics,
  onOpenTool,
  onOpenEngineModal,
}) => {
  return (
    <TelemetryDrawer
      isOpen={isOpen}
      onClose={onClose}
      messages={messages}
      onClearHistory={onClearChat}
      onSelectPrompt={onSelectPrompt}
      onOpenVoiceDiagnostics={onOpenVoiceDiagnostics}
      onOpenTool={onOpenTool}
      onOpenEngineModal={onOpenEngineModal}
    />
  );
};
