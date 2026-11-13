import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  FileText,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  AudioWaveform,
} from "lucide-react";
import Button from "../common/Button";

export const ProcessingOverlay = ({
  status, // "uploading" | "transcribing" | "completed" | "failed"
  uploadProgress = 0,
  error = null,
  onRetry,
  onViewTranscript,
}) => {
  // Meaningful progression stage
  const [currentStage, setCurrentStage] = useState(0);

  useEffect(() => {
    if (status === "uploading") {
      setCurrentStage(0);
    } else if (status === "transcribing") {
      setCurrentStage(1);
      const timer = setTimeout(() => {
        setCurrentStage(2);
      }, 4500);
      return () => clearTimeout(timer);
    } else if (status === "completed") {
      setCurrentStage(3);
    }
  }, [status]);

  if (!status) return null;

  const stages = [
    { id: 0, label: "Uploading audio" },
    { id: 1, label: "Processing speech" },
    { id: 2, label: "Finalizing transcript" },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-[#172341]/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
      >
        <motion.div
          initial={{ scale: 0.96, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.96, opacity: 0, y: 10 }}
          transition={{ type: "spring", damping: 25, stiffness: 350 }}
          className="w-full max-w-md bg-white border border-[#EBE8F0] rounded-[18px] p-6 sm:p-8 shadow-xl text-center overflow-hidden"
        >
          {/* Active Processing Views: uploading or transcribing */}
          {(status === "uploading" || status === "transcribing") && (
            <div className="space-y-5">
              {/* Animated Dual-Badge Illustration */}
              <div className="relative flex items-center justify-center gap-4 sm:gap-6 my-2">
                {/* Audio Badge */}
                <motion.div
                  animate={{ y: [0, -3, 0] }}
                  transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
                  className="relative w-14 h-14 rounded-2xl bg-[#F0EBF8] border border-[#7138B8]/30 flex flex-col items-center justify-center text-[#7138B8] shadow-xs"
                >
                  <div className="w-6 h-6 rounded-lg bg-white/90 flex items-center justify-center text-[#7138B8] shadow-2xs">
                    <Mic className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[10px] font-bold font-mono tracking-tight uppercase mt-1">
                    AUDIO
                  </span>
                  <motion.span
                    className="absolute -inset-1 rounded-2xl border border-[#7138B8]/30 pointer-events-none"
                    animate={{ opacity: [0.3, 0.8, 0.3], scale: [1, 1.05, 1] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                  />
                </motion.div>

                {/* Animated Arrow Connector */}
                <div className="relative flex items-center justify-center w-16">
                  <div className="w-full border-b-2 border-dashed border-[#EBE8F0]" />
                  <motion.div
                    className="absolute w-7 h-7 rounded-full bg-gradient-to-r from-[#7138B8] to-[#F07800] text-white flex items-center justify-center shadow-xs"
                    animate={{ x: [-16, 16, -16] }}
                    transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                  >
                    <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                  </motion.div>
                </div>

                {/* Transcript Badge */}
                <motion.div
                  animate={{ y: [0, 3, 0] }}
                  transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut", delay: 0.2 }}
                  className="relative w-14 h-14 rounded-2xl bg-[#FFF1E2] border border-[#F07800]/30 flex flex-col items-center justify-center text-[#F07800] shadow-xs"
                >
                  <div className="w-6 h-6 rounded-lg bg-white/90 flex items-center justify-center text-[#F07800] shadow-2xs">
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[10px] font-bold font-mono tracking-tight uppercase mt-1">
                    TEXT
                  </span>
                  <motion.span
                    className="absolute -inset-1 rounded-2xl border border-[#F07800]/30 pointer-events-none"
                    animate={{ opacity: [0.3, 0.8, 0.3], scale: [1, 1.05, 1] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut", delay: 0.3 }}
                  />
                </motion.div>
              </div>

              {/* Headings */}
              <div>
                <h3 className="text-base sm:text-[18px] font-semibold text-[#191B2B] tracking-tight">
                  {status === "uploading"
                    ? "Streaming audio to workspace"
                    : "Transcribing your audio"}
                </h3>
                <p className="text-xs text-[#686B7A] mt-1 max-w-xs mx-auto leading-relaxed">
                  {status === "uploading"
                    ? `Preparing and buffering speech input (${uploadProgress}%)...`
                    : "Converting your speech into text while preserving acoustic clarity and timestamps..."}
                </p>
              </div>

              {/* Progress Indicator */}
              <div className="space-y-4 max-w-xs mx-auto pt-1">
                {status === "uploading" ? (
                  /* Real Upload Progress Bar */
                  <div className="w-full h-1.5 bg-[#EBE8F0] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#7138B8] to-[#F07800] transition-all duration-300 rounded-full"
                      style={{ width: `${Math.max(8, uploadProgress)}%` }}
                    />
                  </div>
                ) : (
                  /* Smooth Indeterminate Progress Bar */
                  <div className="w-full h-1.5 bg-[#EBE8F0] rounded-full overflow-hidden relative">
                    <motion.div
                      className="absolute top-0 bottom-0 bg-gradient-to-r from-[#7138B8] via-[#F07800] to-[#7138B8] rounded-full w-2/5"
                      animate={{ x: ["-100%", "300%"] }}
                      transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
                    />
                  </div>
                )}

                {/* 3 Meaningful Processing Stages */}
                <div className="grid grid-cols-3 gap-2 text-center pt-1">
                  {stages.map((stage) => {
                    const isPast = currentStage > stage.id;
                    const isCurrent = currentStage === stage.id;
                    return (
                      <div key={stage.id} className="flex flex-col items-center">
                        <div className="flex items-center justify-center mb-1">
                          {isPast ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#269B62]" />
                          ) : isCurrent ? (
                            <span className="relative flex h-2.5 w-2.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#7138B8] opacity-75" />
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#7138B8]" />
                            </span>
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-[#D7D9E0]" />
                          )}
                        </div>
                        <span
                          className={`text-[11px] leading-tight transition-colors ${
                            isCurrent
                              ? "text-[#191B2B] font-semibold"
                              : isPast
                              ? "text-[#269B62] font-medium"
                              : "text-[#9598A8]"
                          }`}
                        >
                          {stage.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Completed State */}
          {status === "completed" && (
            <div className="space-y-4 py-2">
              <div className="w-14 h-14 rounded-2xl bg-[#E8F7EF] border border-[#269B62]/20 flex items-center justify-center text-[#269B62] mx-auto shadow-2xs">
                <CheckCircle2 className="w-7 h-7" />
              </div>

              <div>
                <h3 className="text-base sm:text-[18px] font-semibold text-[#191B2B]">
                  Transcription Complete!
                </h3>
                <p className="text-xs text-[#686B7A] mt-1 max-w-xs mx-auto leading-relaxed">
                  Speech transcribed with word-level timestamps and safely persisted to your library.
                </p>
              </div>

              <div className="pt-2">
                <Button
                  variant="primary"
                  onClick={onViewTranscript}
                  icon={ArrowRight}
                  className="w-full justify-center font-semibold shadow-xs"
                >
                  Open in Transcript Editor
                </Button>
              </div>
            </div>
          )}

          {/* Failed State */}
          {status === "failed" && (
            <div className="space-y-4 py-2">
              <div className="w-14 h-14 rounded-2xl bg-[#FDECEC] border border-[#DC4545]/30 flex items-center justify-center text-[#DC4545] mx-auto shadow-2xs">
                <AlertTriangle className="w-7 h-7" />
              </div>

              <div>
                <h3 className="text-base sm:text-[18px] font-semibold text-[#191B2B]">
                  Processing Interrupted
                </h3>
                <p className="text-xs text-[#DC4545] mt-1 max-w-xs mx-auto leading-relaxed">
                  {error || "An unexpected error occurred during audio processing. Please try again."}
                </p>
              </div>

              <div className="pt-2 flex justify-center gap-2.5">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={RotateCcw}
                  onClick={onRetry}
                >
                  Try Again
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ProcessingOverlay;
