import { useState } from "react";
import {
  Mic,
  Pause,
  Play,
  Square,
  RotateCcw,
  Sparkles,
  AlertCircle,
  FileAudio,
} from "lucide-react";
import WaveformCanvas from "./WaveformCanvas";
import useAudioRecorder from "../../hooks/useAudioRecorder";
import Button from "../common/Button";
import Input from "../common/Input";

export const AudioRecorder = ({ onTranscribe, isTranscribing = false }) => {
  const [title, setTitle] = useState("");
  const [language, setLanguage] = useState("auto");

  const {
    recordingState,
    isRecording,
    isPaused,
    isStopped,
    durationSeconds,
    audioBlob,
    audioUrl,
    error,
    analyser,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    resetRecording,
  } = useAudioRecorder();

  // Format MM:SS
  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleTranscribeClick = () => {
    if (!audioBlob) return;
    onTranscribe({
      file: audioBlob,
      filename: `recording_${Date.now()}.webm`,
      title: title.trim() || `Voice Recording ${new Date().toLocaleDateString()}`,
      language,
      source: "recording",
    });
  };

  const handleReset = () => {
    resetRecording();
    setTitle("");
  };

  return (
    <div className="space-y-4">
      {/* Microphone Capture & Status Chamber (Compact) */}
      <div className="flex flex-col items-center justify-center py-5 sm:py-6 px-4 rounded-xl bg-pure-white border border-warm-grey shadow-2xs relative overflow-hidden">
        {/* Subtle dot matrix background */}
        <div className="absolute inset-0 amber-grid-bg opacity-70 pointer-events-none" />

        {/* Live Timer Indicator */}
        <div className="relative z-10 flex flex-col items-center mb-4">
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-warm-ivory border border-warm-grey mb-2 shadow-2xs">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isRecording
                  ? "bg-amber-brand animate-ping"
                  : isPaused
                  ? "bg-amber-soft"
                  : "bg-amber-brand"
              }`}
            />
            <span className="text-xs text-charcoal font-medium">
              {isRecording ? "Live Recording" : isPaused ? "Recording Paused" : isStopped ? "Audio Captured" : "Ready to Record"}
            </span>
          </div>

          <span className="text-3xl sm:text-4xl font-mono font-bold tracking-tight text-charcoal select-none">
            {formatTime(durationSeconds)}
          </span>
        </div>

        {/* Real Web Audio API Waveform Canvas */}
        <div className="w-full max-w-lg z-10 mb-4 px-1">
          <WaveformCanvas
            analyser={analyser}
            isRecording={isRecording}
            isPaused={isPaused}
          />
        </div>

        {/* Controls Container */}
        <div className="relative z-10 flex items-center justify-center gap-3">
          {recordingState === "idle" && (
            <button
              onClick={startRecording}
              disabled={isTranscribing}
              className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-amber-brand hover:bg-amber-brand-hover active:scale-95 text-pure-white flex items-center justify-center shadow-md shadow-amber-brand/25 transition-all border-2 border-amber-brand cursor-pointer"
              aria-label="Start recording"
            >
              <Mic className="w-6 h-6" />
            </button>
          )}

          {isRecording && (
            <>
              <button
                onClick={pauseRecording}
                className="w-10 h-10 rounded-full bg-warm-ivory hover:bg-warm-ivory-dark text-amber-brand border border-warm-grey flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                title="Pause recording"
                aria-label="Pause recording"
              >
                <Pause className="w-4 h-4" />
              </button>

              <button
                onClick={stopRecording}
                className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-red-600 hover:bg-red-700 text-pure-white flex items-center justify-center shadow-md shadow-red-600/30 transition-all border border-red-500 cursor-pointer active:scale-95"
                title="Stop recording"
                aria-label="Stop recording"
              >
                <Square className="w-5 h-5 fill-current" />
              </button>
            </>
          )}

          {isPaused && (
            <>
              <button
                onClick={resumeRecording}
                className="w-10 h-10 rounded-full bg-amber-brand-light hover:bg-amber-brand/15 text-amber-brand border border-amber-brand/25 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                title="Resume recording"
                aria-label="Resume recording"
              >
                <Play className="w-4 h-4 fill-current ml-0.5" />
              </button>

              <button
                onClick={stopRecording}
                className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-red-600 hover:bg-red-700 text-pure-white flex items-center justify-center shadow-md shadow-red-600/30 transition-all border border-red-500 cursor-pointer active:scale-95"
                title="Stop recording"
                aria-label="Stop recording"
              >
                <Square className="w-5 h-5 fill-current" />
              </button>
            </>
          )}

          {isStopped && (
            <Button
              size="sm"
              variant="secondary"
              icon={RotateCcw}
              onClick={handleReset}
              disabled={isTranscribing}
            >
              Discard & Re-record
            </Button>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="mt-3 p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 max-w-md">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Captured Audio Preview & Transcription Trigger */}
      {isStopped && audioUrl && (
        <div className="p-3.5 sm:p-4 rounded-xl bg-pure-white border border-warm-grey space-y-3 shadow-2xs">
          <div className="flex items-center justify-between pb-2.5 border-b border-warm-grey/70">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-brand-light border border-amber-brand/20 flex items-center justify-center text-amber-brand">
                <FileAudio className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-semibold text-charcoal">Captured Audio Ready</h4>
                <p className="text-[10px] sm:text-[11px] text-stone-grey font-mono">
                  Duration: {formatTime(durationSeconds)} • Size: {Math.round(audioBlob.size / 1024)} KB
                </p>
              </div>
            </div>

            <audio src={audioUrl} controls className="h-8 max-w-xs" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="sm:col-span-2">
              <Input
                label="Transcript Title"
                placeholder="e.g. Design Strategy Sync"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isTranscribing}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-charcoal block mb-1">
                Language Hint
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                disabled={isTranscribing}
                className="w-full bg-pure-white border border-warm-grey rounded-lg py-1.5 sm:py-2 px-2.5 text-xs sm:text-sm text-charcoal focus:outline-none focus:border-amber-brand focus:ring-2 focus:ring-amber-brand/20 shadow-2xs"
              >
                <option value="auto">Auto-detect (Whisper)</option>
                <option value="en">English (en)</option>
                <option value="es">Spanish (es)</option>
                <option value="fr">French (fr)</option>
                <option value="de">German (de)</option>
                <option value="hi">Hindi (hi)</option>
              </select>
            </div>
          </div>

          <div className="pt-1 flex justify-end">
            <Button
              variant="primary"
              icon={Sparkles}
              size="md"
              isLoading={isTranscribing}
              onClick={handleTranscribeClick}
              className="w-full sm:w-auto"
            >
              Transcribe with Faster-Whisper
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AudioRecorder;
