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
import { useAuth } from "../../context/AuthContext";
import Button from "../common/Button";
import Input from "../common/Input";

export const AudioRecorder = ({ onTranscribe, isTranscribing = false }) => {
  const [title, setTitle] = useState("");
  const [language, setLanguage] = useState("auto");
  const { requireAuth } = useAuth();

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

  const handleStartRecord = () => {
    requireAuth(
      () => {
        startRecording();
      },
      {
        title: "Sign In to Record Audio",
        subtitle: "Capture and transcribe live voice with local Faster-Whisper",
      }
    );
  };

  // Format MM:SS
  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleTranscribeClick = () => {
    if (!audioBlob) return;
    requireAuth(
      () => {
        onTranscribe({
          file: audioBlob,
          filename: `recording_${Date.now()}.webm`,
          title: title.trim() || `Voice Recording ${new Date().toLocaleDateString()}`,
          language,
          source: "recording",
        });
      },
      {
        title: "Sign In to Transcribe Audio",
        subtitle: "Process your voice recording with local Faster-Whisper",
      }
    );
  };

  const handleReset = () => {
    resetRecording();
    setTitle("");
  };

  return (
    <div className="space-y-4">
      {/* Microphone Capture & Status Chamber */}
      <div className="flex flex-col items-center justify-center py-5 sm:py-6 px-4 rounded-xl bg-white border border-[#EBE8F0] shadow-2xs relative overflow-hidden">
        {/* Subtle dot matrix background */}
        <div className="absolute inset-0 speech-grid-bg opacity-70 pointer-events-none" />

        {/* Live Timer Indicator */}
        <div className="relative z-10 flex flex-col items-center mb-3">
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FAF9FC] border border-[#EBE8F0] mb-1.5 shadow-2xs">
            <span
              className={`w-2 h-2 rounded-full ${isRecording
                ? "bg-[#DC4545] animate-ping"
                : isPaused
                  ? "bg-[#F07800]"
                  : "bg-[#7138B8]"
                }`}
            />
            <span className="text-[11px] text-[#191B2B] font-medium">
              {isRecording ? "Live Recording" : isPaused ? "Recording Paused" : isStopped ? "Audio Captured" : "Ready to Record"}
            </span>
          </div>

          <span className="text-2xl sm:text-3xl font-mono font-bold tracking-tight text-[#191B2B] select-none">
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
        <div className="relative z-10 flex items-center justify-center gap-2.5">
          {recordingState === "idle" && (
            <button
              onClick={handleStartRecord}
              disabled={isTranscribing}
              className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-[#F07800] hover:bg-[#D96B00] active:scale-95 text-white flex items-center justify-center shadow-md shadow-[#F07800]/25 transition-all border-2 border-white cursor-pointer"
              aria-label="Start recording"
            >
              <Mic className="w-6 h-6" />
            </button>
          )}

          {isRecording && (
            <>
              <button
                onClick={pauseRecording}
                className="w-10 h-10 rounded-full bg-[#FAF9FC] hover:bg-[#FFF1E2] text-[#F07800] border border-[#EBE8F0] flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                title="Pause recording"
                aria-label="Pause recording"
              >
                <Pause className="w-4 h-4" />
              </button>

              <button
                onClick={stopRecording}
                className="w-13 h-13 rounded-full bg-[#DC4545] hover:bg-[#C53535] text-white flex items-center justify-center shadow-md shadow-[#DC4545]/30 transition-all border border-red-500 cursor-pointer active:scale-95"
                title="Stop recording"
                aria-label="Stop recording"
              >
                <Square className="w-4.5 h-4.5 fill-current" />
              </button>
            </>
          )}

          {isPaused && (
            <>
              <button
                onClick={resumeRecording}
                className="w-10 h-10 rounded-full bg-[#FFF1E2] hover:bg-[#FFE6CC] text-[#F07800] border border-[#F07800]/30 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                title="Resume recording"
                aria-label="Resume recording"
              >
                <Play className="w-4 h-4 fill-current ml-0.5" />
              </button>

              <button
                onClick={stopRecording}
                className="w-13 h-13 rounded-full bg-[#DC4545] hover:bg-[#C53535] text-white flex items-center justify-center shadow-md shadow-[#DC4545]/30 transition-all border border-red-500 cursor-pointer active:scale-95"
                title="Stop recording"
                aria-label="Stop recording"
              >
                <Square className="w-4.5 h-4.5 fill-current" />
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
          <div className="mt-2.5 p-2 rounded-xl bg-[#FDECEC] border border-[#F8BDBD] text-[#DC4545] text-[11.5px] flex items-center gap-2 max-w-md">
            <AlertCircle className="w-4 h-4 shrink-0 text-[#DC4545]" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Captured Audio Preview & Transcription Trigger */}
      {isStopped && audioUrl && (
        <div className="p-4 rounded-xl bg-white border border-[#EBE8F0] space-y-3.5 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#EBE8F0]">
            <div className="flex items-center gap-2.5">
              <div className="w-[38px] h-[38px] rounded-lg bg-[#FFF1E2] border border-[#F07800]/20 flex items-center justify-center text-[#F07800] shrink-0">
                <FileAudio className="w-[18px] h-[18px]" />
              </div>
              <div>
                <h3 className="text-[14px] font-semibold text-[#191B2B]">Captured Audio Ready</h3>
                <p className="text-[12px] text-[#686B7A] font-mono">
                  Duration: {formatTime(durationSeconds)} • Size: {Math.round(audioBlob.size / 1024)} KB
                </p>
              </div>
            </div>

            <audio src={audioUrl} controls className="h-8 max-w-xs" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
              <label className="text-[12px] font-medium text-[#191B2B] block mb-1">
                Language Hint
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                disabled={isTranscribing}
                className="w-full h-[38px] bg-white border border-[#EBE8F0] hover:border-[#DDD8E6] focus:border-[#F07800] focus:ring-2 focus:ring-[#F07800]/20 rounded-xl py-1.5 px-3 text-xs sm:text-[13px] text-[#191B2B] focus:outline-none shadow-2xs"
              >
                <option value="auto">Auto-detect (Faster-Whisper)</option>
                <option value="en">English (en)</option>
                <option value="es">Spanish (es)</option>
                <option value="fr">French (fr)</option>
                <option value="de">German (de)</option>
                <option value="hi">Hindi (hi)</option>
              </select>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              variant="primary"
              icon={Sparkles}
              size="md"
              isLoading={isTranscribing}
              onClick={handleTranscribeClick}
              className="w-full sm:w-auto font-semibold shadow-xs"
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
