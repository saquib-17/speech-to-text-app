import { useNavigate } from "react-router-dom";
import { FileText, Play, MoreHorizontal, ArrowRight, Activity } from "lucide-react";

export const RecentTranscripts = ({ transcripts = [], isLoading = false }) => {
  const navigate = useNavigate();

  const formatDuration = (seconds) => {
    if (!seconds) return "6s";
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  // Sample data fallback if user has no transcripts yet so it matches the reference mockup aesthetic
  const displayItems = transcripts.length > 0 ? transcripts.slice(0, 3) : [
    {
      _id: "demo-1",
      title: "Meeting - Project Discussion",
      createdAt: "2026-11-30T10:00:00Z",
      duration: 6,
      lang: "EN",
      status: "Transcribed",
    },
    {
      _id: "demo-2",
      title: "Lecture - AI Basics",
      createdAt: "2026-11-29T14:30:00Z",
      duration: 872,
      lang: "EN",
      status: "Transcribed",
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Left 2 Cols: Recent Transcripts */}
      <div className="lg:col-span-2 rounded-xl bg-white border border-[#EBE8F0] p-4 shadow-2xs flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-2.5 mb-1.5 border-b border-[#EBE8F0]/60">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#7138B8]" />
              <h2 className="text-[17px] font-semibold text-[#191B2B]">
                Recent Transcripts
              </h2>
            </div>
            <button
              onClick={() => navigate("/transcripts")}
              className="text-[12px] text-[#7138B8] hover:text-[#602DA2] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* List */}
          {isLoading ? (
            <div className="space-y-2 py-1.5">
              {[1, 2].map((n) => (
                <div
                  key={n}
                  className="h-12 rounded-lg bg-[#F3EBFC]/50 animate-pulse border border-[#EBE8F0]"
                />
              ))}
            </div>
          ) : (
            <div className="divide-y divide-[#EBE8F0]/50">
              {displayItems.map((item) => {
                const meta = item.transcriptionMetadata || {};
                const audioMeta = item.audioMetadata || {};
                const dur = item.duration || meta.durationSeconds || audioMeta.durationSeconds || 6;
                const lang = item.lang || meta.language?.toUpperCase() || "EN";
                const dateStr = item.createdAt
                  ? new Date(item.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "Nov 30, 2026";

                return (
                  <div
                    key={item._id}
                    onClick={() => {
                      if (item._id.startsWith("demo-")) {
                        navigate("/studio");
                      } else {
                        navigate(`/editor/${item._id}`);
                      }
                    }}
                    className="py-2.5 flex items-center justify-between gap-3 hover:bg-[#FAF9FC] px-1.5 rounded-lg transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-[#FFF1E2] group-hover:bg-[#F07800] text-[#F07800] group-hover:text-white flex items-center justify-center shrink-0 transition-colors shadow-2xs">
                        <Play className="w-3 h-3 ml-0.5 fill-current" />
                      </div>

                      <div className="min-w-0">
                        <h3 className="text-[14px] font-semibold text-[#191B2B] group-hover:text-[#F07800] transition-colors truncate">
                          {item.title || "Meeting - Project Discussion"}
                        </h3>
                        <p className="text-[12px] text-[#686B7A] mt-0.5">
                          {dateStr} • {formatDuration(dur)} • {lang}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#E8F7EF] text-[#269B62] border border-[#269B62]/20">
                        Transcribed
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!item._id.startsWith("demo-")) navigate(`/editor/${item._id}`);
                        }}
                        className="p-1 text-[#9598A8] hover:text-[#191B2B] rounded-md transition-colors cursor-pointer"
                        title="Options"
                      >
                        <MoreHorizontal className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right 1 Col: System Status */}
      <div className="rounded-xl bg-white border border-[#EBE8F0] p-4 shadow-2xs flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex items-center gap-2 pb-2.5 mb-1.5 border-b border-[#EBE8F0]/60">
            <Activity className="w-4 h-4 text-[#7138B8]" />
            <h2 className="text-[17px] font-semibold text-[#191B2B]">
              System Status
            </h2>
          </div>

          {/* Status Rows */}
          <div className="space-y-2 py-1">
            <div className="flex items-center justify-between py-1.5 border-b border-[#EBE8F0]/40">
              <div className="flex items-center gap-2 text-[13px] font-medium text-[#191B2B]">
                <span className="w-2 h-2 rounded-full bg-[#269B62] animate-pulse" />
                <span>Whisper Engine</span>
              </div>
              <span className="text-[12px] font-semibold text-[#269B62]">
                Online
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-[#EBE8F0]/40">
              <div className="flex items-center gap-2 text-[13px] font-medium text-[#191B2B]">
                <span className="w-2 h-2 rounded-full bg-[#269B62]" />
                <span>Backend API</span>
              </div>
              <span className="text-[12px] font-semibold text-[#269B62]">
                Healthy
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5">
              <div className="flex items-center gap-2 text-[13px] font-medium text-[#191B2B]">
                <span className="w-2 h-2 rounded-full bg-[#269B62]" />
                <span>Database</span>
              </div>
              <span className="text-[12px] font-semibold text-[#269B62]">
                Connected
              </span>
            </div>
          </div>
        </div>

        <div className="pt-2.5 border-t border-[#EBE8F0]/60 flex items-center justify-between text-[11px] text-[#686B7A]">
          <span>INT8 CPU Execution</span>
          <span className="text-[#F07800] font-semibold">100% Sovereign</span>
        </div>
      </div>
    </div>
  );
};

export default RecentTranscripts;
