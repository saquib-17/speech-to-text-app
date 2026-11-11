import { useNavigate } from "react-router-dom";
import { FileText, Clock, ChevronRight, Mic, AudioWaveform, ArrowUpRight } from "lucide-react";
import Button from "../common/Button";

export const RecentTranscripts = ({ transcripts = [], isLoading = false }) => {
  const navigate = useNavigate();

  const formatDuration = (seconds) => {
    if (!seconds) return "0s";
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  return (
    <div className="rounded-xl bg-pure-white border border-warm-grey overflow-hidden shadow-2xs">
      {/* Section Header */}
      <div className="px-3.5 py-2.5 sm:px-4 sm:py-3 border-b border-warm-grey/70 flex items-center justify-between bg-gradient-to-r from-pure-white via-[#FCFBF8] to-warm-ivory/40">
        <div className="flex items-center gap-2 sm:gap-2.5">
          <div className="w-6 h-6 rounded-md bg-amber-brand-light border border-amber-brand/25 flex items-center justify-center text-amber-brand">
            <FileText className="w-3 h-3" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs sm:text-sm font-semibold text-charcoal">
                Recent Transcriptions
              </h3>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-warm-ivory border border-warm-grey text-stone-grey">
                {transcripts.length} records
              </span>
            </div>
          </div>
        </div>

        {transcripts.length > 0 && (
          <button
            onClick={() => navigate("/history")}
            className="text-xs text-amber-brand hover:text-amber-brand-hover font-medium flex items-center gap-0.5 transition-colors cursor-pointer px-2 py-1 rounded hover:bg-amber-brand-light/60"
          >
            <span>Browse Library</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Body Content */}
      {isLoading ? (
        <div className="p-3.5 space-y-2">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-14 rounded-lg bg-warm-ivory/60 animate-pulse border border-warm-grey/50"
            />
          ))}
        </div>
      ) : transcripts.length === 0 ? (
        <div className="py-10 px-4 text-center">
          <div className="w-10 h-10 rounded-xl bg-warm-ivory border border-warm-grey flex items-center justify-center text-stone-grey mx-auto mb-2.5 shadow-2xs">
            <Mic className="w-4 h-4 text-amber-brand" />
          </div>
          <h4 className="text-xs sm:text-sm font-semibold text-charcoal">
            No voice transcripts yet
          </h4>
          <p className="text-[11px] text-stone-grey max-w-sm mx-auto mt-1 mb-4 leading-normal">
            Capture audio through your microphone or upload audio files to start generating offline transcripts powered by Faster-Whisper.
          </p>
          <div className="flex items-center justify-center">
            <Button
              size="sm"
              variant="primary"
              icon={Mic}
              onClick={() => navigate("/studio?mode=record")}
            >
              Start Recording
            </Button>
          </div>
        </div>
      ) : (
        <div className="divide-y divide-warm-grey/60">
          {transcripts.slice(0, 5).map((item) => {
            const wordCount =
              item.transcriptionText?.trim().split(/\s+/).filter(Boolean).length || 0;
            const meta = item.transcriptionMetadata || {};
            const audioMeta = item.audioMetadata || {};
            const duration = meta.durationSeconds || audioMeta.durationSeconds || 0;
            const snippet = item.transcriptionText?.trim()
              ? item.transcriptionText.slice(0, 95) + (item.transcriptionText.length > 95 ? "..." : "")
              : "No transcription preview available.";

            return (
              <div
                key={item._id}
                onClick={() => navigate(`/editor/${item._id}`)}
                className="p-3 sm:px-4 sm:py-2.5 hover:bg-[#FAF7F1] transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 group"
              >
                {/* Left details */}
                <div className="min-w-0 flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-warm-ivory border border-warm-grey/80 flex items-center justify-center text-amber-brand shrink-0 group-hover:border-amber-brand/40 group-hover:bg-amber-brand-light transition-colors mt-0.5">
                    <AudioWaveform className="w-3.5 h-3.5" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs sm:text-sm font-semibold text-charcoal group-hover:text-amber-brand truncate transition-colors">
                        {item.title || "Untitled Recording"}
                      </h4>
                      <ArrowUpRight className="w-3 h-3 text-stone-grey opacity-0 group-hover:opacity-100 group-hover:text-amber-brand transition-all -ml-0.5 shrink-0" />
                    </div>

                    {/* Text Preview Snippet */}
                    <p className="text-[11px] text-stone-grey line-clamp-1 mt-0.5 font-normal">
                      &ldquo;{snippet}&rdquo;
                    </p>

                    {/* Metadata tags */}
                    <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[10px] text-stone-grey font-mono">
                      <span className="flex items-center gap-1 bg-pure-white px-1.5 py-0.2 rounded border border-warm-grey/70">
                        <Clock className="w-2.5 h-2.5 text-amber-brand" />
                        {formatDuration(duration)}
                      </span>
                      <span>•</span>
                      <span>{wordCount} words</span>
                      <span>•</span>
                      <span>{new Date(item.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>
                      {meta.language && (
                        <>
                          <span>•</span>
                          <span className="uppercase text-[9px] px-1 py-0.2 rounded bg-amber-brand-light text-amber-brand font-bold">
                            {meta.language}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right status & action */}
                <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 pt-1.5 sm:pt-0 border-t sm:border-0 border-warm-grey/40">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-xs text-stone-grey font-medium capitalize">
                      {item.status || "completed"}
                    </span>
                  </div>

                  <div className="w-6 h-6 rounded-full border border-warm-grey flex items-center justify-center text-stone-grey group-hover:text-amber-brand group-hover:border-amber-brand/50 group-hover:bg-pure-white transition-all">
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RecentTranscripts;
