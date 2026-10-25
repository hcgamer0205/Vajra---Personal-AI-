import React from 'react';
import { VajraSphere } from './VajraSphere';
import { AssistantState } from '../types';

interface JarvisSphereProps {
  isStreaming?: boolean;
  isOffline?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'hero' | 'ambient';
  interactive?: boolean;
  className?: string;
  state?: AssistantState;
}

export const JarvisSphere: React.FC<JarvisSphereProps> = ({
  isStreaming,
  isOffline,
  size = 'md',
  interactive,
  className,
  state,
}) => {
  const derivedState: AssistantState = state || (isStreaming ? 'thinking' : 'idle');

  return (
    <VajraSphere
      state={derivedState}
      isOffline={isOffline}
      size={size}
      interactive={interactive}
      className={className}
    />
  );
};
