/**
 * VAJRA Mobile — Phone Control & Device Management Section
 * 
 * Provides direct user controls for:
 * 1. Android System Settings (Wi-Fi, Bluetooth, Display, Sound, Battery, Apps, Accessibility)
 * 2. Device Intents (Camera, Dialer, SMS Composer, Maps, Volume Adjustment)
 * 3. Sensor & Capability Telemetry (Battery %, Charging state, Network connectivity)
 * 4. Emergency Global STOP switch
 * 5. Voice Activation (Wake Word) Toggle
 * 6. Accessibility-Assisted Control Toggle & Status
 * 7. Transparent Execution Audit & Privacy Policy
 */

import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Wifi,
  Bluetooth,
  Sun,
  Volume2,
  VolumeX,
  Battery,
  BatteryCharging,
  Camera,
  Phone,
  MessageSquare,
  MapPin,
  Settings,
  OctagonAlert,
  Mic,
  Shield,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Activity,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { mobileControlEngine, MobileDeviceCapabilities, MobileActionResult } from '../../services/mobileControlEngine';
import { VajraAction } from '../../types';

interface MobilePhoneControlSectionProps {
  onExecuteAction: (action: VajraAction) => void;
  isVoiceActivationEnabled: boolean;
  onToggleVoiceActivation: (enable: boolean) => void;
  onOpenCoreSettings: () => void;
  onEmergencyStop: () => void;
}

export const MobilePhoneControlSection: React.FC<MobilePhoneControlSectionProps> = ({
  onExecuteAction,
  isVoiceActivationEnabled,
  onToggleVoiceActivation,
  onOpenCoreSettings,
  onEmergencyStop,
}) => {
  const [caps, setCaps] = useState<MobileDeviceCapabilities | null>(null);
  const [recentActions, setRecentActions] = useState<MobileActionResult[]>([]);
  const [phoneNumberInput, setPhoneNumberInput] = useState('');
  const [smsMessageInput, setSmsMessageInput] = useState('');
  const [mapsDestinationInput, setMapsDestinationInput] = useState('');
  const [isDialerModalOpen, setIsDialerModalOpen] = useState(false);
  const [isSmsModalOpen, setIsSmsModalOpen] = useState(false);
  const [isMapsModalOpen, setIsMapsModalOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'controls' | 'sensors' | 'history'>('controls');

  useEffect(() => {
    let mounted = true;
    const fetchCapabilities = async () => {
      const data = await mobileControlEngine.discoverCapabilities();
      if (mounted) {
        setCaps(data);
        setRecentActions(mobileControlEngine.getRecentActionResults());
      }
    };
    fetchCapabilities();
    const interval = setInterval(fetchCapabilities, 8000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleLaunchSettings = (screen: 'wifi' | 'bluetooth' | 'display' | 'sound' | 'battery' | 'apps' | 'accessibility' | 'main') => {
    onExecuteAction({
      id: `act-set-${Date.now()}`,
      type: 'OPEN_SETTINGS',
      title: `Open ${screen.toUpperCase()} Settings`,
      settingsScreen: screen,
      confirmed: true,
      status: 'pending',
    });
  };

  const handleVolume = (direction: 'up' | 'down' | 'mute') => {
    onExecuteAction({
      id: `act-vol-${Date.now()}`,
      type: 'ADJUST_VOLUME',
      title: `Volume: ${direction.toUpperCase()}`,
      volumeDirection: direction,
      confirmed: true,
      status: 'pending',
    });
  };

  const handleCamera = () => {
    onExecuteAction({
      id: `act-cam-${Date.now()}`,
      type: 'OPEN_CAMERA',
      title: 'Open Camera',
      confirmed: true,
      status: 'pending',
    });
  };

  const handleDialerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumberInput.trim()) return;
    onExecuteAction({
      id: `act-dial-${Date.now()}`,
      type: 'DIAL_PHONE',
      title: `Dial: ${phoneNumberInput}`,
      phoneNumber: phoneNumberInput.trim(),
      confirmed: true,
      status: 'pending',
    });
    setIsDialerModalOpen(false);
    setPhoneNumberInput('');
  };

  const handleSmsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumberInput.trim() && !smsMessageInput.trim()) return;
    onExecuteAction({
      id: `act-sms-${Date.now()}`,
      type: 'DRAFT_SMS',
      title: `Draft SMS: ${phoneNumberInput || 'Recipient'}`,
      phoneNumber: phoneNumberInput.trim(),
      messageText: smsMessageInput.trim(),
      confirmed: true,
      status: 'pending',
    });
    setIsSmsModalOpen(false);
    setPhoneNumberInput('');
    setSmsMessageInput('');
  };

  const handleMapsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mapsDestinationInput.trim()) return;
    onExecuteAction({
      id: `act-maps-${Date.now()}`,
      type: 'OPEN_MAPS',
      title: `Map: ${mapsDestinationInput}`,
      destination: mapsDestinationInput.trim(),
      confirmed: true,
      status: 'pending',
    });
    setIsMapsModalOpen(false);
    setMapsDestinationInput('');
  };

  const isNative = caps?.isNativeAndroid ?? false;

  return (
    <div className="flex flex-col h-full bg-[#0a0204] text-[#fef3c7] overflow-y-auto p-4 space-y-4">
      {/* 1. Header & Emergency Stop Bar */}
      <div className="flex items-center justify-between border-b border-amber-900/40 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
            <Smartphone className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-wider text-amber-200">ANDROID CONTROL</h2>
            <p className="text-[10px] text-amber-400/60 font-mono">
              {isNative ? 'NATIVE ANDROID CORE (API ' + (caps?.sdkInt || 36) + ')' : 'WEB INTENT ADAPTER (APK AVAILABLE)'}
            </p>
          </div>
        </div>

        <button
          onClick={onEmergencyStop}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950/80 hover:bg-red-900 border border-red-500/50 text-red-300 text-xs font-semibold tracking-wider shadow-lg shadow-red-950/40 active:scale-95 transition-all"
        >
          <OctagonAlert className="w-4 h-4 text-red-400 animate-pulse" />
          <span>STOP</span>
        </button>
      </div>

      {/* 2. Sub-Navigation Tabs */}
      <div className="flex gap-1 p-1 bg-[#120407] rounded-xl border border-amber-900/30 text-xs font-mono">
        <button
          onClick={() => setSelectedTab('controls')}
          className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
            selectedTab === 'controls'
              ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40'
              : 'text-amber-400/60 hover:text-amber-200'
          }`}
        >
          Controls
        </button>
        <button
          onClick={() => setSelectedTab('sensors')}
          className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
            selectedTab === 'sensors'
              ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40'
              : 'text-amber-400/60 hover:text-amber-200'
          }`}
        >
          Telemetry
        </button>
        <button
          onClick={() => setSelectedTab('history')}
          className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
            selectedTab === 'history'
              ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40'
              : 'text-amber-400/60 hover:text-amber-200'
          }`}
        >
          Audits ({recentActions.length})
        </button>
      </div>

      {/* 3. Tab: Controls */}
      {selectedTab === 'controls' && (
        <div className="space-y-4">
          {/* Quick Phone Functions Grid */}
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => handleLaunchSettings('wifi')}
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#140508] border border-amber-900/40 hover:border-amber-500/50 active:scale-95 transition-all group"
            >
              <Wifi className="w-5 h-5 text-amber-400 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] text-amber-200/80 font-medium">Wi-Fi</span>
            </button>

            <button
              onClick={() => handleLaunchSettings('bluetooth')}
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#140508] border border-amber-900/40 hover:border-amber-500/50 active:scale-95 transition-all group"
            >
              <Bluetooth className="w-5 h-5 text-amber-400 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] text-amber-200/80 font-medium">Bluetooth</span>
            </button>

            <button
              onClick={() => handleLaunchSettings('display')}
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#140508] border border-amber-900/40 hover:border-amber-500/50 active:scale-95 transition-all group"
            >
              <Sun className="w-5 h-5 text-amber-400 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] text-amber-200/80 font-medium">Display</span>
            </button>

            <button
              onClick={() => handleLaunchSettings('battery')}
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#140508] border border-amber-900/40 hover:border-amber-500/50 active:scale-95 transition-all group"
            >
              <Battery className="w-5 h-5 text-amber-400 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] text-amber-200/80 font-medium">Battery</span>
            </button>

            <button
              onClick={handleCamera}
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#140508] border border-amber-900/40 hover:border-amber-500/50 active:scale-95 transition-all group"
            >
              <Camera className="w-5 h-5 text-amber-400 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] text-amber-200/80 font-medium">Camera</span>
            </button>

            <button
              onClick={() => setIsDialerModalOpen(true)}
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#140508] border border-amber-900/40 hover:border-amber-500/50 active:scale-95 transition-all group"
            >
              <Phone className="w-5 h-5 text-amber-400 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] text-amber-200/80 font-medium">Dialer</span>
            </button>

            <button
              onClick={() => setIsSmsModalOpen(true)}
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#140508] border border-amber-900/40 hover:border-amber-500/50 active:scale-95 transition-all group"
            >
              <MessageSquare className="w-5 h-5 text-amber-400 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] text-amber-200/80 font-medium">SMS Draft</span>
            </button>

            <button
              onClick={() => setIsMapsModalOpen(true)}
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#140508] border border-amber-900/40 hover:border-amber-500/50 active:scale-95 transition-all group"
            >
              <MapPin className="w-5 h-5 text-amber-400 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] text-amber-200/80 font-medium">Maps</span>
            </button>
          </div>

          {/* Audio & Volume Quick Bar */}
          <div className="p-3 rounded-xl bg-[#140508] border border-amber-900/40 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-amber-300">
              <span className="flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-amber-400" />
                SYSTEM AUDIO CONTROL
              </span>
              <span className="text-[10px] text-amber-400/60">Android Stream</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleVolume('down')}
                className="py-2 rounded-lg bg-black/40 border border-amber-900/40 hover:border-amber-500/50 text-xs font-mono text-amber-200 active:scale-95 transition-all"
              >
                Volume -
              </button>
              <button
                onClick={() => handleVolume('mute')}
                className="py-2 rounded-lg bg-black/40 border border-amber-900/40 hover:border-amber-500/50 text-xs font-mono text-amber-200 active:scale-95 transition-all flex items-center justify-center gap-1"
              >
                <VolumeX className="w-3.5 h-3.5 text-amber-400" />
                Mute
              </button>
              <button
                onClick={() => handleVolume('up')}
                className="py-2 rounded-lg bg-black/40 border border-amber-900/40 hover:border-amber-500/50 text-xs font-mono text-amber-200 active:scale-95 transition-all"
              >
                Volume +
              </button>
            </div>
          </div>

          {/* Voice Wake Activation Toggle */}
          <div className="p-3 rounded-xl bg-[#140508] border border-amber-900/40 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
                <Mic className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <div className="text-xs font-semibold text-amber-200">VOICE WAKE ("Hello Vajra")</div>
                <div className="text-[10px] text-amber-400/60 font-mono">
                  {isVoiceActivationEnabled ? 'STANDBY ACTIVE (Continuous Wake)' : 'DISABLED (Tap to toggle)'}
                </div>
              </div>
            </div>

            <button
              onClick={() => onToggleVoiceActivation(!isVoiceActivationEnabled)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                isVoiceActivationEnabled
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30'
                  : 'bg-black/50 border border-amber-900/40 text-amber-400/70'
              }`}
            >
              {isVoiceActivationEnabled ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Safety & Intent Notice */}
          <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-800/30 text-[11px] text-amber-300/80 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-amber-200">
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              Safety & Security Boundary
            </div>
            <p className="text-[10px] leading-relaxed text-amber-400/70">
              VAJRA pre-fills phone numbers and message drafts via official Android Intents. You retain final physical authorization to tap "Call" or "Send". Camera opens the official app without secretly capturing images.
            </p>
          </div>
        </div>
      )}

      {/* 4. Tab: Sensors & Telemetry */}
      {selectedTab === 'sensors' && (
        <div className="space-y-3 font-mono text-xs">
          {/* Battery Status */}
          <div className="p-3 rounded-xl bg-[#140508] border border-amber-900/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {caps?.battery?.isCharging ? (
                <BatteryCharging className="w-5 h-5 text-green-400" />
              ) : (
                <Battery className="w-5 h-5 text-amber-400" />
              )}
              <div>
                <div className="text-amber-200 font-semibold">BATTERY STATUS</div>
                <div className="text-[10px] text-amber-400/60">
                  {caps?.battery ? (caps.battery.isCharging ? 'Charging' : 'Discharging') : 'Sensor available in APK'}
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold text-amber-300">
                {caps?.battery?.level !== undefined ? `${caps.battery.level}%` : 'N/A'}
              </span>
            </div>
          </div>

          {/* Network Telemetry */}
          <div className="p-3 rounded-xl bg-[#140508] border border-amber-900/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-amber-400" />
              <div>
                <div className="text-amber-200 font-semibold">CONNECTIVITY</div>
                <div className="text-[10px] text-amber-400/60">
                  Transport: {caps?.network?.type || 'Online'}
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                caps?.network?.connected !== false
                  ? 'bg-green-500/20 text-green-300 border border-green-500/40'
                  : 'bg-red-500/20 text-red-300 border border-red-500/40'
              }`}>
                {caps?.network?.connected !== false ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>
          </div>

          {/* Accessibility Status */}
          <div className="p-3 rounded-xl bg-[#140508] border border-amber-900/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-400" />
              <div>
                <div className="text-amber-200 font-semibold">ACCESSIBILITY ASSIST</div>
                <div className="text-[10px] text-amber-400/60">
                  {caps?.accessibility?.serviceConnected ? 'Service Connected' : 'Optional / Disabled'}
                </div>
              </div>
            </div>
            <button
              onClick={() => handleLaunchSettings('accessibility')}
              className="px-2 py-1 rounded bg-black/40 border border-amber-900/40 hover:border-amber-500/50 text-[10px] text-amber-300"
            >
              Configure
            </button>
          </div>

          {/* Core Configuration Access */}
          <div className="pt-2">
            <button
              onClick={onOpenCoreSettings}
              className="w-full py-2.5 rounded-xl bg-[#16050a] border border-amber-700/40 hover:border-amber-500 text-xs font-semibold text-amber-200 flex items-center justify-center gap-2 transition-all active:scale-98"
            >
              <Settings className="w-4 h-4 text-amber-400" />
              <span>Open VAJRA Core AI Configuration</span>
            </button>
          </div>
        </div>
      )}

      {/* 5. Tab: Audits / Recent Action History */}
      {selectedTab === 'history' && (
        <div className="space-y-2">
          {recentActions.length === 0 ? (
            <div className="p-6 rounded-xl bg-[#140508] border border-amber-900/30 text-center text-xs text-amber-400/60 font-mono">
              No phone actions executed in this session yet.
            </div>
          ) : (
            recentActions.map((res) => (
              <div
                key={res.actionId}
                className="p-3 rounded-xl bg-[#140508] border border-amber-900/40 space-y-1 font-mono text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-semibold text-amber-200">
                    {res.executionStatus === 'success' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    )}
                    <span className="truncate">{res.requestedAction}</span>
                  </div>
                  <span className="text-[10px] text-amber-400/60">
                    {new Date(res.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
                <div className="text-[10px] text-amber-300/80 pl-5">
                  Result: {res.observedResult}
                </div>
                <div className="flex items-center gap-2 text-[9px] text-amber-400/50 pl-5 pt-0.5">
                  <span className="uppercase">Mode: {res.capability}</span>
                  <span>•</span>
                  <span>Verified: {res.isVerified ? 'YES' : 'NO'}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal: Dialer Prefill */}
      {isDialerModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleDialerSubmit}
            className="w-full max-w-sm rounded-2xl bg-[#140508] border border-amber-500/40 p-4 space-y-3"
          >
            <div className="flex items-center justify-between border-b border-amber-900/40 pb-2">
              <span className="text-xs font-semibold text-amber-200 font-mono flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-amber-400" />
                OPEN SYSTEM DIALER
              </span>
              <button
                type="button"
                onClick={() => setIsDialerModalOpen(false)}
                className="text-amber-400/60 hover:text-amber-200 text-xs"
              >
                Cancel
              </button>
            </div>
            <input
              type="tel"
              placeholder="Enter phone number (e.g. +91 9876543210)..."
              value={phoneNumberInput}
              onChange={(e) => setPhoneNumberInput(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-black/50 border border-amber-900/50 text-xs text-amber-200 focus:outline-none focus:border-amber-500"
              autoFocus
            />
            <button
              type="submit"
              className="w-full py-2 rounded-xl bg-amber-500 text-black text-xs font-semibold hover:bg-amber-400 transition-all font-mono"
            >
              Open Dialer
            </button>
          </form>
        </div>
      )}

      {/* Modal: SMS Draft */}
      {isSmsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSmsSubmit}
            className="w-full max-w-sm rounded-2xl bg-[#140508] border border-amber-500/40 p-4 space-y-3"
          >
            <div className="flex items-center justify-between border-b border-amber-900/40 pb-2">
              <span className="text-xs font-semibold text-amber-200 font-mono flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-amber-400" />
                DRAFT SMS MESSAGE
              </span>
              <button
                type="button"
                onClick={() => setIsSmsModalOpen(false)}
                className="text-amber-400/60 hover:text-amber-200 text-xs"
              >
                Cancel
              </button>
            </div>
            <input
              type="tel"
              placeholder="Recipient phone number..."
              value={phoneNumberInput}
              onChange={(e) => setPhoneNumberInput(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-black/50 border border-amber-900/50 text-xs text-amber-200 focus:outline-none focus:border-amber-500"
            />
            <textarea
              placeholder="Enter message text to draft..."
              value={smsMessageInput}
              onChange={(e) => setSmsMessageInput(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-xl bg-black/50 border border-amber-900/50 text-xs text-amber-200 focus:outline-none focus:border-amber-500 resize-none"
            />
            <p className="text-[10px] text-amber-400/60">
              Note: This will open your device's messaging app with the text pre-filled. You must review and press Send yourself.
            </p>
            <button
              type="submit"
              className="w-full py-2 rounded-xl bg-amber-500 text-black text-xs font-semibold hover:bg-amber-400 transition-all font-mono"
            >
              Draft in SMS App
            </button>
          </form>
        </div>
      )}

      {/* Modal: Maps Search */}
      {isMapsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleMapsSubmit}
            className="w-full max-w-sm rounded-2xl bg-[#140508] border border-amber-500/40 p-4 space-y-3"
          >
            <div className="flex items-center justify-between border-b border-amber-900/40 pb-2">
              <span className="text-xs font-semibold text-amber-200 font-mono flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-amber-400" />
                OPEN MAPS NAVIGATION
              </span>
              <button
                type="button"
                onClick={() => setIsMapsModalOpen(false)}
                className="text-amber-400/60 hover:text-amber-200 text-xs"
              >
                Cancel
              </button>
            </div>
            <input
              type="text"
              placeholder="Enter destination, landmark or city..."
              value={mapsDestinationInput}
              onChange={(e) => setMapsDestinationInput(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-black/50 border border-amber-900/50 text-xs text-amber-200 focus:outline-none focus:border-amber-500"
              autoFocus
            />
            <button
              type="submit"
              className="w-full py-2 rounded-xl bg-amber-500 text-black text-xs font-semibold hover:bg-amber-400 transition-all font-mono"
            >
              Navigate in Maps
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
