import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Mic, UploadCloud, Cpu, Radio } from "lucide-react";
import AudioRecorder from "../components/studio/AudioRecorder";
import AudioUploader from "../components/studio/AudioUploader";
import ProcessingOverlay from "../components/studio/ProcessingOverlay";
import Badge from "../components/common/Badge";
import api from "../api/client";
import { useToast } from "../context/ToastContext";

export const AudioStudio = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();

  const initialMode = searchParams.get("mode") === "upload" ? "upload" : "record";
  const [activeMode, setActiveMode] = useState(initialMode); // record | upload

  const [processingStatus, setProcessingStatus] = useState(null); // null | uploading | transcribing | completed | failed
  const [uploadProgress, setUploadProgress] = useState(0);
  const [completedTranscript, setCompletedTranscript] = useState(null);
  const [transcriptionError, setTranscriptionError] = useState(null);

  useEffect(() => {
    const mode = searchParams.get("mode");
    if (mode === "upload" || mode === "record") {
      setActiveMode(mode);
    }
  }, [searchParams]);

  const switchMode = (mode) => {
    setActiveMode(mode);
    setSearchParams({ mode });
  };

  // Execute full-pipeline transcription
  const handleTranscribe = async ({ file, filename, title, language, source }) => {
    setTranscriptionError(null);
    setUploadProgress(0);
    setProcessingStatus("uploading");

    const formData = new FormData();
    formData.append("audio", file, filename);
    if (title) formData.append("title", title);
    if (language && language !== "auto") formData.append("language", language);
    if (source) formData.append("source", source);

    try {
      // Stream audio with progress monitoring
      const res = await api.audio.transcribe(formData, (progressEvent) => {
        if (progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percent);
          if (percent >= 100) {
            // Transition to local inference state
            setProcessingStatus("transcribing");
          }
        }
      });

      if (res.success && res.data) {
        setCompletedTranscript(res.data);
        setProcessingStatus("completed");
        toast.success("Transcription complete!");
      } else {
        throw new Error(res.message || "Transcription failed.");
      }
    } catch (err) {
      console.error("Transcription pipeline error:", err);
      const msg =
        err.message ||
        "Speech recognition failed. Please ensure the local Faster-Whisper sidecar is running on 127.0.0.1:5001.";
      setTranscriptionError(msg);
      setProcessingStatus("failed");
      toast.error(msg);
    }
  };

  const handleRetry = () => {
    setProcessingStatus(null);
    setTranscriptionError(null);
  };

  const handleViewTranscript = () => {
    if (completedTranscript?._id) {
      navigate(`/editor/${completedTranscript._id}`);
    }
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Studio Header Banner */}
      <div className="p-3.5 sm:p-4 rounded-xl bg-pure-white border border-warm-grey shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Radio className="w-4 h-4 text-amber-brand" />
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-charcoal">Audio Studio</h2>
            <Badge variant="completed" size="sm">
              Offline INT8
            </Badge>
          </div>
          <p className="text-xs text-stone-grey">
            High-fidelity speech capture with real-time waveform analysis and offline Whisper processing.
          </p>
        </div>

        {/* Studio Specs Indicator */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-warm-ivory border border-warm-grey text-xs text-stone-grey shrink-0 self-start sm:self-center font-medium">
          <Cpu className="w-3.5 h-3.5 text-amber-brand" />
          <span>Faster-Whisper • 16 kHz</span>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex p-1 rounded-lg bg-pure-white border border-warm-grey max-w-sm mx-auto shadow-2xs">
        <button
          onClick={() => switchMode("record")}
          className={`flex-1 py-1.5 px-3 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeMode === "record"
              ? "bg-amber-brand text-pure-white shadow-2xs"
              : "text-stone-grey hover:text-charcoal"
          }`}
        >
          <Mic className="w-3.5 h-3.5" />
          <span>Record Audio</span>
        </button>

        <button
          onClick={() => switchMode("upload")}
          className={`flex-1 py-1.5 px-3 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeMode === "upload"
              ? "bg-amber-brand text-pure-white shadow-2xs"
              : "text-stone-grey hover:text-charcoal"
          }`}
        >
          <UploadCloud className="w-3.5 h-3.5" />
          <span>Upload Audio</span>
        </button>
      </div>

      {/* Main Studio Viewport */}
      {activeMode === "record" ? (
        <AudioRecorder
          onTranscribe={handleTranscribe}
          isTranscribing={Boolean(processingStatus)}
        />
      ) : (
        <AudioUploader
          onTranscribe={handleTranscribe}
          isTranscribing={Boolean(processingStatus)}
        />
      )}

      {/* Processing State Modal / Overlay */}
      <ProcessingOverlay
        status={processingStatus}
        uploadProgress={uploadProgress}
        error={transcriptionError}
        onRetry={handleRetry}
        onViewTranscript={handleViewTranscript}
      />
    </div>
  );
};

export default AudioStudio;
