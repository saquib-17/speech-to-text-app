import { motion } from "framer-motion";
import { Loader2, Cpu, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";
import Button from "../common/Button";

export const ProcessingOverlay = ({
  status, // "uploading" | "transcribing" | "completed" | "failed"
  uploadProgress = 0,
  error = null,
  onRetry,
  onViewTranscript,
}) => {
  if (!status) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-charcoal/40 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        className="w-full max-w-md bg-pure-white border border-warm-grey rounded-xl p-6 sm:p-8 shadow-xl text-center"
      >
        {/* State Icon */}
        <div className="w-16 h-16 rounded-xl mx-auto flex items-center justify-center mb-5 relative">
          {status === "uploading" && (
            <div className="w-16 h-16 rounded-xl bg-amber-brand-light border border-amber-brand/20 flex items-center justify-center text-amber-brand shadow-2xs">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          )}

          {status === "transcribing" && (
            <div className="w-16 h-16 rounded-xl bg-amber-brand-light border border-amber-brand/20 flex items-center justify-center text-amber-brand shadow-2xs">
              <Cpu className="w-8 h-8 animate-pulse text-amber-brand" />
            </div>
          )}

          {status === "completed" && (
            <div className="w-16 h-16 rounded-xl bg-amber-brand-light border border-amber-brand/20 flex items-center justify-center text-amber-brand shadow-2xs">
              <CheckCircle2 className="w-8 h-8 text-amber-brand" />
            </div>
          )}

          {status === "failed" && (
            <div className="w-16 h-16 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shadow-2xs">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          )}
        </div>

        {/* State Title & Subtitle */}
        {status === "uploading" && (
          <>
            <h3 className="text-lg font-semibold text-charcoal">Streaming Audio to Engine</h3>
            <p className="text-xs text-stone-grey mt-1">
              Ingesting audio into memory buffer ({uploadProgress}%)...
            </p>
            {/* Progress bar */}
            <div className="w-full h-1.5 bg-warm-ivory rounded-full mt-4 overflow-hidden border border-warm-grey/50">
              <div
                className="h-full bg-amber-brand transition-all duration-300 rounded-full"
                style={{ width: `${Math.max(5, uploadProgress)}%` }}
              />
            </div>
          </>
        )}

        {status === "transcribing" && (
          <>
            <h3 className="text-lg font-semibold text-charcoal">Faster-Whisper Inference Active</h3>
            <p className="text-xs text-stone-grey mt-1">
              Running CTranslate2 INT8 model on local CPU with Silero VAD silence filtering...
            </p>

            <div className="mt-5 p-3.5 rounded-lg bg-warm-ivory border border-warm-grey text-left text-xs font-mono space-y-1.5">
              <div className="flex justify-between text-stone-grey">
                <span>Model Architecture:</span>
                <span className="text-charcoal font-medium">Whisper Base (74M)</span>
              </div>
              <div className="flex justify-between text-stone-grey">
                <span>Quantization:</span>
                <span className="text-charcoal font-medium">INT8 (AVX2 CPU)</span>
              </div>
              <div className="flex justify-between text-stone-grey">
                <span>Sidecar Node:</span>
                <span className="text-amber-brand font-semibold">127.0.0.1:5001</span>
              </div>
            </div>
          </>
        )}

        {status === "completed" && (
          <>
            <h3 className="text-lg font-semibold text-charcoal">Transcription Complete!</h3>
            <p className="text-xs text-stone-grey mt-1">
              Speech transcribed with word-level timestamps and persisted to MongoDB.
            </p>
            <div className="mt-6 flex justify-center">
              <Button
                variant="primary"
                onClick={onViewTranscript}
                icon={ArrowRight}
                className="w-full justify-center"
              >
                Open in Transcript Editor
              </Button>
            </div>
          </>
        )}

        {status === "failed" && (
          <>
            <h3 className="text-lg font-semibold text-charcoal">Inference Failed</h3>
            <p className="text-xs text-red-600 mt-1">
              {error || "The local transcription sidecar encountered an error."}
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Button variant="secondary" onClick={onRetry}>
                Try Again
              </Button>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
};

export default ProcessingOverlay;
