import { FileText, Clock, Cpu, HardDrive, CheckCircle2 } from "lucide-react";

export const TelemetryGrid = ({
  totalTranscripts = 0,
  totalDurationSeconds = 0,
}) => {
  const formatTotalTime = (seconds) => {
    if (!seconds || seconds <= 0) return "0s";
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `${mins}m ${Math.round(seconds % 60)}s`;
    const hrs = (seconds / 3600).toFixed(1);
    return `${hrs}h`;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
      {/* Card 1: Total Transcripts */}
      <div className="p-3.5 sm:p-4 rounded-xl bg-pure-white border border-warm-grey hover:border-amber-brand/40 transition-all duration-200 shadow-2xs flex flex-col justify-between group min-h-[145px]">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-stone-grey">
              Total Transcripts
            </span>
            <div className="w-6 h-6 rounded-md bg-amber-brand-light border border-amber-brand/20 flex items-center justify-center text-amber-brand shadow-2xs">
              <FileText className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="text-2xl font-bold font-mono text-charcoal tracking-tight">
            {totalTranscripts}
          </div>
          <p className="text-xs text-stone-grey mt-0.5 font-normal">
            Indexed library records
          </p>
        </div>

        <div className="mt-2.5 pt-2 border-t border-warm-grey/60 flex items-center justify-between text-[11px] text-stone-grey">
          <span>Storage</span>
          <span className="text-amber-brand font-medium">MongoDB Local</span>
        </div>
      </div>

      {/* Card 2: Audio Transcribed */}
      <div className="p-3.5 sm:p-4 rounded-xl bg-pure-white border border-warm-grey hover:border-amber-brand/40 transition-all duration-200 shadow-2xs flex flex-col justify-between group min-h-[145px]">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-stone-grey">
              Audio Transcribed
            </span>
            <div className="w-6 h-6 rounded-md bg-amber-brand-light border border-amber-brand/20 flex items-center justify-center text-amber-brand shadow-2xs">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="text-2xl font-bold font-mono text-charcoal tracking-tight">
            {formatTotalTime(totalDurationSeconds)}
          </div>
          <p className="text-xs text-stone-grey mt-0.5 font-normal">
            Cumulative audio processed
          </p>
        </div>

        <div className="mt-2.5 pt-2 border-t border-warm-grey/60 flex items-center justify-between text-[11px] text-stone-grey">
          <span>Buffer Pipeline</span>
          <span className="text-amber-brand font-medium">In-Memory Stream</span>
        </div>
      </div>

      {/* Card 3: Speech Engine */}
      <div className="p-3.5 sm:p-4 rounded-xl bg-pure-white border border-warm-grey hover:border-amber-brand/40 transition-all duration-200 shadow-2xs flex flex-col justify-between group min-h-[145px]">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-stone-grey">
              Speech Engine
            </span>
            <div className="w-6 h-6 rounded-md bg-amber-brand-light border border-amber-brand/20 flex items-center justify-center text-amber-brand shadow-2xs">
              <Cpu className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="text-lg sm:text-xl font-bold tracking-tight text-charcoal truncate font-sans">
            Faster-Whisper
          </div>
          <p className="text-xs text-stone-grey mt-0.5 font-normal">
            Base model • INT8 CPU
          </p>
        </div>

        <div className="mt-2.5 pt-2 border-t border-warm-grey/60 flex items-center justify-between text-[11px] text-stone-grey">
          <span>Engine Status</span>
          <span className="text-amber-brand font-medium">Local Engine Active</span>
        </div>
      </div>

      {/* Card 4: Processing Mode */}
      <div className="p-3.5 sm:p-4 rounded-xl bg-pure-white border border-warm-grey hover:border-amber-brand/40 transition-all duration-200 shadow-2xs flex flex-col justify-between group min-h-[145px]">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-stone-grey">
              Processing Mode
            </span>
            <div className="w-6 h-6 rounded-md bg-amber-soft-light border border-amber-soft/30 flex items-center justify-center text-amber-brand shadow-2xs">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="text-lg sm:text-xl font-bold tracking-tight text-charcoal truncate font-sans">
            Local Offline
          </div>
          <p className="text-xs text-stone-grey mt-0.5 font-normal">
            Private speech transcription
          </p>
        </div>

        <div className="mt-2.5 pt-2 border-t border-warm-grey/60 flex items-center justify-between text-[11px] text-stone-grey">
          <span>Infrastructure</span>
          <span className="text-emerald-700 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            ₹0 Local
          </span>
        </div>
      </div>
    </div>
  );
};

export default TelemetryGrid;
