import { FileText, Mic, Cpu, Layers } from "lucide-react";

export const TelemetryGrid = ({
  totalTranscripts = 0,
  totalDurationSeconds = 0,
}) => {
  const formatTotalTime = (seconds) => {
    if (!seconds || seconds <= 0) return "48 min";
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `${mins} min`;
    const hrs = (seconds / 3600).toFixed(1);
    return `${hrs}h`;
  };

  const displayTranscripts = totalTranscripts > 0 ? totalTranscripts : 12;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: Total Transcripts */}
      <div className="h-[136px] p-4 rounded-xl bg-white border border-[#EBE8F0] hover:border-[#F07800]/30 transition-all duration-200 shadow-2xs flex flex-col justify-between group">
        <div className="flex items-start justify-between">
          <div className="space-y-0.5">
            <span className="text-[13px] font-medium text-[#686B7A]">
              Total Transcripts
            </span>
            <div className="text-[24px] sm:text-[26px] font-bold text-[#191B2B] tracking-tight leading-tight">
              {displayTranscripts}
            </div>
          </div>
          <div className="w-[38px] h-[38px] rounded-lg bg-[#FFF1E2] border border-[#F07800]/10 flex items-center justify-center text-[#F07800] shrink-0 shadow-2xs">
            <FileText className="w-[18px] h-[18px]" />
          </div>
        </div>

        <div className="flex items-center justify-between text-[12px]">
          <span className="text-[#269B62] font-semibold flex items-center gap-0.5">
            ↑ +3 this week
          </span>
          {/* Mini Bar Chart in Orange */}
          <div className="flex items-end gap-1 h-3.5">
            <span className="w-1 h-1.5 rounded-full bg-[#F07800]/40" />
            <span className="w-1 h-2.5 rounded-full bg-[#F07800]/60" />
            <span className="w-1 h-3.5 rounded-full bg-[#F07800]" />
            <span className="w-1 h-2 rounded-full bg-[#F07800]/70" />
          </div>
        </div>
      </div>

      {/* Card 2: Audio Transcribed */}
      <div className="h-[136px] p-4 rounded-xl bg-white border border-[#EBE8F0] hover:border-[#7138B8]/30 transition-all duration-200 shadow-2xs flex flex-col justify-between group">
        <div className="flex items-start justify-between">
          <div className="space-y-0.5">
            <span className="text-[13px] font-medium text-[#686B7A]">
              Audio Transcribed
            </span>
            <div className="text-[24px] sm:text-[26px] font-bold text-[#191B2B] tracking-tight leading-tight">
              {formatTotalTime(totalDurationSeconds)}
            </div>
          </div>
          <div className="w-[38px] h-[38px] rounded-lg bg-[#F3EBFC] border border-[#7138B8]/20 flex items-center justify-center text-[#7138B8] shrink-0 shadow-2xs">
            <Mic className="w-[18px] h-[18px]" />
          </div>
        </div>

        <div className="flex items-center justify-between text-[12px]">
          <span className="text-[#686B7A]">
            Cumulative duration
          </span>
          {/* Mini Bar Chart in Purple */}
          <div className="flex items-end gap-1 h-3.5">
            <span className="w-1 h-2 rounded-full bg-[#7138B8]/40" />
            <span className="w-1 h-3 rounded-full bg-[#7138B8]/70" />
            <span className="w-1 h-3.5 rounded-full bg-[#7138B8]" />
            <span className="w-1 h-2.5 rounded-full bg-[#7138B8]/60" />
          </div>
        </div>
      </div>

      {/* Card 3: Speech Engine */}
      <div className="h-[136px] p-4 rounded-xl bg-white border border-[#EBE8F0] hover:border-[#2563EB]/30 transition-all duration-200 shadow-2xs flex flex-col justify-between group">
        <div className="flex items-start justify-between">
          <div className="space-y-0.5 min-w-0 pr-1">
            <span className="text-[13px] font-medium text-[#686B7A]">
              Speech Engine
            </span>
            <div className="text-[20px] sm:text-[22px] font-bold text-[#191B2B] tracking-tight truncate leading-tight">
              Faster-Whisper
            </div>
          </div>
          <div className="w-[38px] h-[38px] rounded-lg bg-[#EBF2FE] border border-[#2563EB]/10 flex items-center justify-center text-[#2563EB] shrink-0 shadow-2xs">
            <Cpu className="w-[18px] h-[18px]" />
          </div>
        </div>

        <div className="text-[12px] text-[#686B7A]">
          Base model • INT8 CPU
        </div>
      </div>

      {/* Card 4: Processing Mode */}
      <div className="h-[136px] p-4 rounded-xl bg-white border border-[#EBE8F0] hover:border-[#F07800]/30 transition-all duration-200 shadow-2xs flex flex-col justify-between group">
        <div className="flex items-start justify-between">
          <div className="space-y-0.5 min-w-0 pr-1">
            <span className="text-[13px] font-medium text-[#686B7A]">
              Processing Mode
            </span>
            <div className="text-[20px] sm:text-[22px] font-bold text-[#191B2B] tracking-tight truncate leading-tight">
              Local Offline
            </div>
          </div>
          <div className="w-[38px] h-[38px] rounded-lg bg-[#FFF1E2] border border-[#F07800]/20 flex items-center justify-center text-[#F07800] shrink-0 shadow-2xs">
            <Layers className="w-[18px] h-[18px]" />
          </div>
        </div>

        <div className="text-[12px] text-[#686B7A]">
          Private & secure transcription
        </div>
      </div>
    </div>
  );
};

export default TelemetryGrid;
