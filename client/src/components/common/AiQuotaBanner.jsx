import { Clock, ShieldCheck } from "lucide-react";
import { formatRetryCountdown, formatResetTime } from "../../utils/aiQuota";

/**
 * AiQuotaBanner — Displays a friendly, non-intrusive alert when Gemini 3.8 Flash
 * daily quota (20 requests/day) or rate limits are reached.
 */
export const AiQuotaBanner = ({ quotaState, className = "" }) => {
  if (!quotaState?.isCooldownActive) return null;

  const retryCountdown = formatRetryCountdown(quotaState.remainingSeconds);
  const resetTimeStr = formatResetTime(quotaState.retryAt);

  return (
    <div
      className={`rounded-xl border border-[#F07800]/30 bg-[#FFF1E2] p-3 sm:p-3.5 text-[#191B2B] shadow-2xs ${className}`}
      role="alert"
    >
      <div className="flex items-start gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-white border border-[#F07800]/30 flex items-center justify-center text-[#F07800] shrink-0 shadow-2xs mt-0.5">
          <Clock className="w-3.5 h-3.5 animate-pulse" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-xs sm:text-[12.5px] font-semibold text-[#191B2B]">
              Daily AI Request Limit Reached
            </h4>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#F07800] text-white shadow-2xs">
              20 / day Free Tier
            </span>
          </div>

          <p className="text-[11px] text-[#686B7A] mt-0.5 leading-relaxed">
            {quotaState.message ||
              "The free Gemini 3.8 Flash daily limit has been reached. AI summaries and Q&A will resume once the quota resets."}
          </p>

          {/* Retry Countdown Badge */}
          {quotaState.remainingSeconds > 0 && (
            <div className="mt-2 flex items-center gap-2 flex-wrap text-[11px]">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white border border-[#EBE8F0] text-[#191B2B] font-medium shadow-2xs">
                <Clock className="w-3 h-3 text-[#F07800]" />
                <span>Retry available in:</span>
                <span className="font-mono font-bold text-[#F07800]">
                  {retryCountdown}
                </span>
              </span>

              {resetTimeStr && (
                <span className="text-[10px] text-[#686B7A]">
                  (~{resetTimeStr})
                </span>
              )}
            </div>
          )}

          {/* Reassurance note */}
          <div className="mt-2 pt-1.5 border-t border-[#F07800]/20 flex items-center gap-1.5 text-[10px] text-[#686B7A]">
            <ShieldCheck className="w-3 h-3 text-[#269B62] shrink-0" />
            <span>
              Transcripts, audio storage, and local Whisper transcription remain 100% operational.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiQuotaBanner;
