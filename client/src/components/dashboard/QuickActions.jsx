import { useNavigate } from "react-router-dom";
import { Mic, UploadCloud, FileText, ArrowRight, Zap } from "lucide-react";

export const QuickActions = () => {
  const navigate = useNavigate();

  const actions = [
    {
      title: "Live Audio Recording",
      desc: "Record and transcribe audio directly from your browser.",
      icon: Mic,
      action: () => navigate("/studio?mode=record"),
    },
    {
      title: "Audio File Upload",
      desc: "Upload audio files (MP3, WAV, M4A) for transcription.",
      icon: UploadCloud,
      action: () => navigate("/studio?mode=upload"),
    },
    {
      title: "Transcript Library",
      desc: "Browse, search and manage your transcripts in one place.",
      icon: FileText,
      action: () => navigate("/transcripts"),
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-0.5">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-[#F07800] fill-current" />
          <h2 className="text-[17px] font-semibold text-[#191B2B]">
            Quick Workflows
          </h2>
        </div>
        <button
          onClick={() => navigate("/studio")}
          className="text-[12px] text-[#7138B8] hover:text-[#602DA2] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
        >
          <span>Audio & Transcription Actions</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {actions.map((act, i) => (
          <div
            key={i}
            onClick={act.action}
            className="p-4 rounded-xl bg-white border border-[#EBE8F0] hover:border-[#F07800]/40 hover:shadow-xs cursor-pointer transition-all duration-200 flex items-center justify-between group shadow-2xs"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-[38px] h-[38px] rounded-xl bg-[#F3EBFC] border border-[#7138B8]/10 flex items-center justify-center text-[#7138B8] shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                <act.icon className="w-[18px] h-[18px]" />
              </div>

              <div className="min-w-0">
                <h3 className="text-[14px] font-semibold text-[#191B2B] group-hover:text-[#F07800] transition-colors truncate">
                  {act.title}
                </h3>
                <p className="text-[12px] text-[#686B7A] mt-0.5 leading-snug line-clamp-2">
                  {act.desc}
                </p>
              </div>
            </div>

            <div className="w-7 h-7 rounded-full bg-[#F3EBFC] text-[#7138B8] group-hover:bg-[#F07800] group-hover:text-white flex items-center justify-center transition-colors shrink-0 ml-2.5 shadow-2xs">
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;
