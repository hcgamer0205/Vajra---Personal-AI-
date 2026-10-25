import React, { useState, useEffect } from 'react';
import {
  Mic,
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  Volume2,
  RefreshCw,
  Cpu,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  X,
  ExternalLink,
} from 'lucide-react';
import {
  VoicePipelineStageId,
  PipelineStageInfo,
  VoiceDiagnosticsState,
  isRunningInIframe,
  inspectVoiceEnvironment,
} from '../services/voicePipeline';

interface VoiceDiagnosticHUDProps {
  isOpen?: boolean;
  diagnostics?: VoiceDiagnosticsState;
  diagnosticsState?: VoiceDiagnosticsState;
  onClose?: () => void;
  onRunSelfTest?: () => void;
  isExpandedDefault?: boolean;
}

export const VoiceDiagnosticHUD: React.FC<VoiceDiagnosticHUDProps> = ({
  isOpen = true,
  diagnostics,
  diagnosticsState: propDiagnosticsState,
  onClose,
  onRunSelfTest,
  isExpandedDefault = false,
}) => {
  const currentDiagnostics = diagnostics || propDiagnosticsState;
  const [isExpanded, setIsExpanded] = useState(isExpandedDefault);
  const inIframe = isRunningInIframe();

  if (!isOpen || !currentDiagnostics) {
    return null;
  }

  const stagesList: VoicePipelineStageId[] = [
    'microphone',
    'speech_recognition',
    'transcription',
    'ai_processing',
    'response',
    'tts',
  ];

  const getStageIcon = (id: VoicePipelineStageId, status: string) => {
    switch (id) {
      case 'microphone':
        return <Mic className="w-3.5 h-3.5" />;
      case 'speech_recognition':
        return <Activity className="w-3.5 h-3.5" />;
      case 'transcription':
        return <Play className="w-3.5 h-3.5" />;
      case 'ai_processing':
        return <Cpu className="w-3.5 h-3.5" />;
      case 'response':
        return <ShieldCheck className="w-3.5 h-3.5" />;
      case 'tts':
        return <Volume2 className="w-3.5 h-3.5" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/50">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Success</span>
          </span>
        );
      case 'active':
      case 'checking':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-500/60 animate-pulse">
            <RefreshCw className="w-3 h-3 text-amber-400 animate-spin" />
            <span>{status === 'checking' ? 'Verifying' : 'Active'}</span>
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-950/90 text-red-300 border border-red-500/60">
            <XCircle className="w-3 h-3 text-red-400" />
            <span>Failed</span>
          </span>
        );
      case 'unsupported':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-950/90 text-amber-300 border border-amber-500/60">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            <span>Unsupported</span>
          </span>
        );
      case 'ready':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-950/60 text-amber-300 border border-amber-500/40">
            <CheckCircle2 className="w-3 h-3 text-amber-400" />
            <span>Ready</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#18040a] text-amber-500/70 border border-amber-900/40">
            <span>Standby</span>
          </span>
        );
    }
  };

  const hasFailedStage = Object.values(currentDiagnostics.stages).some(
    (s) => s.status === 'failed' || s.status === 'unsupported'
  );

  return (
    <div
      id="vajra-voice-pipeline-hud"
      className="w-full max-w-3xl mx-auto my-2 rounded-2xl bg-[#0e0206]/95 border border-amber-500/40 shadow-xl shadow-red-950/50 backdrop-blur-xl p-3 sm:p-4 text-[#fef3c7] animate-in fade-in duration-150"
    >
      {/* HUD Header Strip */}
      <div className="flex items-center justify-between gap-2 border-b border-amber-900/50 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-red-900/40 border border-amber-500/50 flex items-center justify-center text-amber-400">
            <Activity className="w-3.5 h-3.5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-hud font-bold text-xs sm:text-sm text-amber-200 tracking-wider">
                VAJRA VOICE PIPELINE DIAGNOSTIC HUD
              </span>
              {inIframe && (
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-red-950/80 text-amber-300 border border-amber-500/40">
                  Preview Frame Context
                </span>
              )}
            </div>
            <p className="text-[10px] font-mono text-amber-400/60 hidden sm:block">
              Microphone → Speech Recognition → Transcription → AI Processing → Response → Text-to-Speech
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {onRunSelfTest && (
            <button
              type="button"
              onClick={onRunSelfTest}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#18040a] hover:bg-[#280712] border border-amber-500/40 text-[10px] font-mono text-amber-300 transition-all cursor-pointer"
              title="Run API and Permission Diagnostic Check"
            >
              <RefreshCw className="w-3 h-3 text-amber-400" />
              <span className="hidden sm:inline">Inspect Pipeline</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded-lg text-amber-300 hover:text-white bg-[#18040a] hover:bg-[#280712] border border-amber-900/60 transition-all cursor-pointer"
            title={isExpanded ? 'Collapse Stage Details' : 'Expand Stage Details'}
          >
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-amber-300 hover:text-white bg-[#18040a] hover:bg-[#280712] border border-amber-900/60 transition-all cursor-pointer"
              title="Dismiss Diagnostic HUD"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Prominent Preview Environment Warning Notice */}
      {currentDiagnostics.previewWarning && (
        <div className="mt-2.5 p-2.5 rounded-xl bg-red-950/70 border border-amber-500/60 flex items-start gap-2.5 text-xs text-amber-200 shadow-md shadow-red-950/40">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 animate-bounce" />
          <div className="flex-1 space-y-1">
            <div className="font-hud font-bold text-xs text-yellow-300 tracking-wide">
              {currentDiagnostics.previewWarning}
            </div>
            <p className="text-[11px] font-mono text-amber-200/80 leading-relaxed">
              Browser iframe policies frequently isolate microphone audio input and speech recognition network sockets. For full live speech testing, open the application in a standalone browser tab or deployed URL.
            </p>
          </div>
        </div>
      )}

      {/* Pipeline Stage Pills Strip (Always visible) */}
      <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
        {stagesList.map((stageId, idx) => {
          const stage = currentDiagnostics.stages[stageId];
          const isFailed = stage.status === 'failed' || stage.status === 'unsupported';
          const isActive = stage.status === 'active' || stage.status === 'checking';

          return (
            <div
              key={stageId}
              onClick={() => setIsExpanded(true)}
              className={`p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                isFailed
                  ? 'bg-red-950/60 border-red-500/50 hover:border-red-400'
                  : isActive
                  ? 'bg-amber-950/50 border-amber-400 ring-1 ring-amber-400/50 shadow-md shadow-amber-950/40'
                  : 'bg-[#18040a] border-amber-500/20 hover:border-amber-500/50'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-amber-300">
                  <span className="text-amber-500/60 font-hud">0{idx + 1}</span>
                  {getStageIcon(stageId, stage.status)}
                </div>
                {getStatusBadge(stage.status)}
              </div>

              <div className="text-[10.5px] font-hud font-semibold text-amber-100/90 truncate">
                {stage.name.split(' ')[0]} {stage.name.split(' ')[1] || ''}
              </div>
            </div>
          );
        })}
      </div>

      {/* Expanded Stage-by-Stage Breakdown & API Verification Matrix */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-amber-900/40 space-y-2 max-h-64 overflow-y-auto pr-1">
          <div className="text-[10px] font-mono uppercase text-amber-400/70 font-bold tracking-wider px-1">
            Stage-by-Stage Verification & Diagnostic Telemetry
          </div>

          {stagesList.map((stageId, idx) => {
            const stage = currentDiagnostics.stages[stageId];
            return (
              <div
                key={stageId}
                className="p-2.5 rounded-xl bg-[#140308] border border-amber-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div className="space-y-0.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-hud font-bold text-amber-200">
                      Stage {idx + 1}: {stage.name}
                    </span>
                    <span className="text-[9.5px] font-mono px-1.5 py-0.2 rounded bg-[#0a0204] text-amber-400/80 border border-amber-900/60">
                      {stage.apiName}
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-amber-100/80 leading-relaxed">
                    {stage.message}
                  </p>
                  {stage.detail && (
                    <p className="text-[10px] font-mono text-amber-500/60">{stage.detail}</p>
                  )}
                </div>

                <div className="shrink-0 flex items-center gap-2 self-start sm:self-center">
                  {getStatusBadge(stage.status)}
                </div>
              </div>
            );
          })}

          <div className="p-2.5 rounded-xl bg-[#0a0204] border border-amber-900/40 text-[10.5px] font-mono text-amber-400/70 flex items-center justify-between">
            <span>Diagnostics Engine: VAJRA Diagnostic Protocol v2.5</span>
            <span>Real-time Hardware & API Interceptor Active</span>
          </div>
        </div>
      )}
    </div>
  );
};
