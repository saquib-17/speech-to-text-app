import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Globe,
  Languages,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  FileText,
  Sparkles,
} from "lucide-react";
import Button from "../common/Button";

export const TranslationLoader = ({
  sourceLanguage = "auto",
  targetLanguage = "Kannada",
  detectedLanguage = "English",
  error = null,
  onRetry,
  onCancel,
}) => {
  // Display names
  const resolvedSource =
    sourceLanguage && sourceLanguage !== "auto"
      ? sourceLanguage
      : detectedLanguage || "Original Language";

  // Meaningful stage progression based on elapsed time without fake % numbers
  const [currentStage, setCurrentStage] = useState(0);

  useEffect(() => {
    if (error) return;

    setCurrentStage(0);
    // Stage 0: Preparing transcript (~800ms)
    const t1 = setTimeout(() => {
      setCurrentStage(1); // Stage 1: Translating content
    }, 900);

    // Stage 2: Finalizing translation (~6000ms+)
    const t2 = setTimeout(() => {
      setCurrentStage(2); // Stage 2: Finalizing translation
    }, 6500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [error]);

  const stages = [
    { id: 0, label: "Preparing transcript" },
    { id: 1, label: "Translating content" },
    { id: 2, label: "Finalizing translation" },
  ];

  return (
    <div className="w-full py-6 px-4 sm:px-8 text-center select-none">
      {/* 1. Animated Illustration Center */}
      <div className="relative flex items-center justify-center gap-4 sm:gap-6 mb-6">
        {/* Source Language Card */}
        <motion.div
          animate={error ? {} : { y: [0, -3, 0] }}
          transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}
          className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#F0EBF8] border border-[#7138B8]/30 flex flex-col items-center justify-center text-[#7138B8] shadow-xs"
        >
          <div className="w-6 h-6 rounded-lg bg-white/80 flex items-center justify-center text-[#7138B8] mb-1 shadow-2xs">
            <Languages className="w-3.5 h-3.5" />
          </div>
          <span className="text-[10px] font-bold font-mono tracking-tight uppercase line-clamp-1 px-1">
            {resolvedSource.slice(0, 4)}
          </span>

          {/* Pulse Glow Ring */}
          {!error && (
            <motion.span
              className="absolute -inset-1 rounded-2xl border border-[#7138B8]/30 pointer-events-none"
              animate={{ opacity: [0.3, 0.8, 0.3], scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            />
          )}
        </motion.div>

        {/* Dynamic Animated Arrow Connection */}
        <div className="relative flex items-center justify-center w-16 sm:w-20">
          {/* Subtle dotted connector line */}
          <div className="w-full border-b-2 border-dashed border-[#EBE8F0]" />

          {/* Animated Arrow Particle */}
          {!error ? (
            <motion.div
              className="absolute w-7 h-7 rounded-full bg-gradient-to-r from-[#7138B8] to-[#F07800] text-white flex items-center justify-center shadow-xs"
              animate={{ x: [-18, 18, -18] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            >
              <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </motion.div>
          ) : (
            <div className="absolute w-7 h-7 rounded-full bg-[#FDECEC] text-[#DC4545] border border-[#DC4545]/30 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          )}
        </div>

        {/* Target Language Card */}
        <motion.div
          animate={error ? {} : { y: [0, 3, 0] }}
          transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut", delay: 0.2 }}
          className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#FFF1E2] border border-[#F07800]/30 flex flex-col items-center justify-center text-[#F07800] shadow-xs"
        >
          <div className="w-6 h-6 rounded-lg bg-white/80 flex items-center justify-center text-[#F07800] mb-1 shadow-2xs">
            <Globe className="w-3.5 h-3.5" />
          </div>
          <span className="text-[10px] font-bold font-mono tracking-tight uppercase line-clamp-1 px-1">
            {targetLanguage.slice(0, 4)}
          </span>

          {/* Pulse Glow Ring */}
          {!error && (
            <motion.span
              className="absolute -inset-1 rounded-2xl border border-[#F07800]/30 pointer-events-none"
              animate={{ opacity: [0.3, 0.8, 0.3], scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut", delay: 0.3 }}
            />
          )}
        </motion.div>
      </div>

      {/* 2. Text Content */}
      <h3 className="text-base sm:text-[18px] font-semibold text-[#191B2B] tracking-tight">
        {error ? "Translation Interrupted" : "Translating your transcript"}
      </h3>
      <p className="text-xs text-[#686B7A] mt-1 max-w-sm mx-auto leading-relaxed">
        {error
          ? error
          : "Converting your transcript while preserving its original meaning..."}
      </p>

      {/* 3. Dynamic Selected Languages Pill */}
      <div className="mt-3.5 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF9FC] border border-[#EBE8F0] text-xs font-semibold shadow-2xs">
        <span className="text-[#7138B8]">{resolvedSource}</span>
        <ArrowRight className="w-3.5 h-3.5 text-[#F07800]" />
        <span className="text-[#F07800]">{targetLanguage}</span>
      </div>

      {/* 4. Active Progress Bar or Error Card */}
      {!error ? (
        <div className="mt-6 space-y-4 max-w-sm mx-auto">
          {/* Smooth Indeterminate Progress Bar */}
          <div className="w-full h-1.5 bg-[#EBE8F0] rounded-full overflow-hidden relative">
            <motion.div
              className="absolute top-0 bottom-0 bg-gradient-to-r from-[#7138B8] via-[#F07800] to-[#7138B8] rounded-full w-2/5"
              animate={{ x: ["-100%", "300%"] }}
              transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
            />
          </div>

          {/* Meaningful Processing Stages */}
          <div className="grid grid-cols-3 gap-2 pt-1 text-left">
            {stages.map((stage) => {
              const isPast = currentStage > stage.id;
              const isCurrent = currentStage === stage.id;
              return (
                <div key={stage.id} className="flex flex-col items-center text-center">
                  <div className="flex items-center justify-center mb-1">
                    {isPast ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#269B62]" />
                    ) : isCurrent ? (
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#7138B8] opacity-75" />
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-[#7138B8]" />
                      </span>
                    ) : (
                      <span className="w-2.5 h-2.5 rounded-full bg-[#D7D9E0]" />
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
      ) : (
        /* Error Action Controls */
        <div className="mt-6 flex items-center justify-center gap-2.5">
          {onCancel && (
            <Button size="sm" variant="secondary" onClick={onCancel}>
              Back to Options
            </Button>
          )}
          {onRetry && (
            <Button
              size="sm"
              variant="primary"
              icon={RefreshCw}
              onClick={onRetry}
              className="font-semibold shadow-xs"
            >
              Retry Translation
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default TranslationLoader;
