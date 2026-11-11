import { Clock, ShieldCheck, AlertCircle } from "lucide-react";
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
      className={`rounded-xl border border-amber-brand/30 bg-amber-brand-light/70 p-3 sm:p-3.5 text-charcoal shadow-2xs ${className}`}
      role="alert"
    >
      <div className="flex items-start gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-pure-white border border-amber-brand/30 flex items-center justify-center text-amber-brand shrink-0 shadow-2xs mt-0.5">
          <Clock className="w-4 h-4 animate-pulse" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-xs font-semibold text-charcoal">
              Daily AI Request Limit Reached
            </h4>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-amber-brand text-pure-white shadow-2xs">
              20 / day Free Tier
            </span>
          </div>

          <p className="text-[11px] text-stone-grey mt-1 leading-relaxed">
            {quotaState.message ||
              "The free Gemini 3.8 Flash daily limit has been reached. AI summaries and Q&A will resume once the quota resets."}
          </p>

          {/* Retry Countdown Badge */}
          {quotaState.remainingSeconds > 0 && (
            <div className="mt-2 flex items-center gap-2 flex-wrap text-[11px]">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-pure-white border border-warm-grey text-charcoal font-medium shadow-2xs">
                <Clock className="w-3 h-3 text-amber-brand" />
                <span>Retry available in:</span>
                <span className="font-mono font-bold text-amber-brand">
                  {retryCountdown}
                </span>
              </span>

              {resetTimeStr && (
                <span className="text-[10px] text-stone-grey">
                  (~{resetTimeStr})
                </span>
              )}
            </div>
          )}

          {/* Reassurance note */}
          <div className="mt-2 pt-2 border-t border-amber-brand/20 flex items-center gap-1.5 text-[10px] text-stone-grey">
            <ShieldCheck className="w-3 h-3 text-green-600 shrink-0" />
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

