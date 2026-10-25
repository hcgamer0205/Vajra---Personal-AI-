import React from 'react';
import { MobileBottomSheet } from './MobileBottomSheet';
import { MobilePhoneControlSection } from './MobilePhoneControlSection';
import { VajraAction } from '../../types';

interface MobilePhoneControlSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onExecuteAction: (action: VajraAction) => void;
  isVoiceActivationEnabled: boolean;
  onToggleVoiceActivation: (enable: boolean) => void;
  onOpenCoreSettings: () => void;
  onEmergencyStop: () => void;
}

export const MobilePhoneControlSheet: React.FC<MobilePhoneControlSheetProps> = ({
  isOpen,
  onClose,
  onExecuteAction,
  isVoiceActivationEnabled,
  onToggleVoiceActivation,
  onOpenCoreSettings,
  onEmergencyStop,
}) => {
  return (
    <MobileBottomSheet
      isOpen={isOpen}
      onClose={onClose}
      height="full"
      title="UNIVERSAL PHONE CONTROL"
      subtitle="Android system intents, sensors & emergency stop"
    >
      <div className="h-[calc(100vh-140px)]">
        <MobilePhoneControlSection
          onExecuteAction={(action) => {
            onExecuteAction(action);
          }}
          isVoiceActivationEnabled={isVoiceActivationEnabled}
          onToggleVoiceActivation={onToggleVoiceActivation}
          onOpenCoreSettings={onOpenCoreSettings}
          onEmergencyStop={onEmergencyStop}
        />
      </div>
    </MobileBottomSheet>
  );
};
