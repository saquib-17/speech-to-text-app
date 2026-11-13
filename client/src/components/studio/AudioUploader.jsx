import { useState, useRef } from "react";
import { UploadCloud, FileAudio, X, Sparkles } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import Button from "../common/Button";
import Input from "../common/Input";
import Badge from "../common/Badge";

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB
const ALLOWED_EXTENSIONS = [".mp3", ".wav", ".webm", ".m4a", ".aac", ".ogg", ".mp4"];

export const AudioUploader = ({ onTranscribe, isTranscribing = false }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [title, setTitle] = useState("");
  const [language, setLanguage] = useState("auto");
  const [validationError, setValidationError] = useState(null);
  const { requireAuth } = useAuth();

  const fileInputRef = useRef(null);

  const handleBrowseClick = () => {
    requireAuth(
      () => {
        fileInputRef.current?.click();
      },
      {
        title: "Sign In to Upload Audio",
        subtitle: "Select and transcribe audio files locally with Faster-Whisper",
      }
    );
  };

  const handleFile = (file) => {
    setValidationError(null);
    if (!file) return;

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      setValidationError("File exceeds the 25 MB limit. Please select a smaller audio recording.");
      return;
    }

    if (file.size === 0) {
      setValidationError("Selected file is empty (0 bytes).");
      return;
    }

    // Check extension
    const ext = "." + file.name.split(".").pop().toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setValidationError(
        `Unsupported audio format (${ext}). Supported formats: ${ALLOWED_EXTENSIONS.join(", ")}`
      );
      return;
    }

    // Clean previous preview
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));

    // Auto-populate default title from filename without extension
    const baseName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
    setTitle(baseName);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleClear = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setTitle("");
    setValidationError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleTranscribeClick = () => {
    if (!selectedFile) return;
    requireAuth(
      () => {
        onTranscribe({
          file: selectedFile,
          filename: selectedFile.name,
          title: title.trim() || selectedFile.name,
          language,
          source: "upload",
        });
      },
      {
        title: "Sign In to Transcribe Audio",
        subtitle: "Process audio files locally with Faster-Whisper",
      }
    );
  };

  return (
    <div className="space-y-4">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*,.mp3,.wav,.webm,.m4a,.aac,.ogg,.mp4"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
          }
        }}
      />

      {/* Drop Zone */}
      {!selectedFile ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleBrowseClick}
          className={`flex flex-col items-center justify-center p-5 sm:p-7 rounded-xl border-2 border-dashed transition-all cursor-pointer shadow-2xs ${
            isDragging
              ? "border-[#F07800] bg-[#FFF1E2]/50 scale-[1.005]"
              : "border-[#EBE8F0] hover:border-[#F07800] bg-white"
          }`}
        >
          <div className="w-[38px] h-[38px] rounded-xl bg-[#FFF1E2] border border-[#F07800]/20 flex items-center justify-center text-[#F07800] mb-2.5 shadow-2xs">
            <UploadCloud className="w-[18px] h-[18px]" />
          </div>

          <h3 className="text-xs sm:text-[14px] font-semibold text-[#191B2B] text-center">
            Drop your audio file here or <span className="text-[#F07800] underline underline-offset-2">browse</span>
          </h3>
          <p className="text-[12px] text-[#686B7A] mt-0.5 text-center">
            Supports MP3, WAV, WebM, M4A, AAC, OGG up to 25 MB
          </p>

          <div className="flex flex-wrap items-center justify-center gap-1 mt-3">
            {["MP3", "WAV", "WEBM", "M4A", "AAC", "OGG"].map((fmt) => (
              <Badge key={fmt} variant="neutral" size="sm" className="font-mono text-[9.5px]">
                {fmt}
              </Badge>
            ))}
          </div>
        </div>
      ) : (
        /* Selected File Card */
        <div className="p-4 rounded-xl bg-white border border-[#EBE8F0] space-y-3.5 shadow-2xs">
          <div className="flex items-start justify-between pb-2.5 border-b border-[#EBE8F0]">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-[38px] h-[38px] rounded-xl bg-[#FFF1E2] border border-[#F07800]/20 flex items-center justify-center text-[#F07800] shrink-0">
                <FileAudio className="w-[18px] h-[18px]" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs sm:text-[14px] font-semibold text-[#191B2B] truncate">{selectedFile.name}</h4>
                <p className="text-[11px] text-[#686B7A] font-mono">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • {selectedFile.type || "audio"}
                </p>
              </div>
            </div>

            <button
              onClick={handleClear}
              disabled={isTranscribing}
              className="p-1 text-[#686B7A] hover:text-[#DC4545] hover:bg-[#FDECEC] rounded-lg transition-colors cursor-pointer"
              aria-label="Remove selected file"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Audio preview player */}
          {previewUrl && (
            <div className="p-2.5 rounded-xl bg-[#FAF9FC] border border-[#EBE8F0] flex items-center justify-between">
              <span className="text-[11px] font-mono text-[#191B2B] pl-1 font-medium">Playback Preview:</span>
              <audio src={previewUrl} controls className="h-7 max-w-xs" />
            </div>
          )}

          {/* Title and Language Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <Input
                label="Transcript Title"
                placeholder="Give this recording a name"
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

          {/* Transcribe action */}
          <div className="pt-1 flex justify-end">
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

      {/* Validation Error */}
      {validationError && (
        <div className="p-2.5 rounded-xl bg-[#FDECEC] border border-[#F8BDBD] text-[#DC4545] text-xs flex items-center gap-2">
          <X className="w-4 h-4 shrink-0 text-[#DC4545]" />
          <span>{validationError}</span>
        </div>
      )}
    </div>
  );
};

export default AudioUploader;
