import { useNavigate } from "react-router-dom";
import { Mic, UploadCloud, ArrowRight, FileText } from "lucide-react";

export const QuickActions = () => {
  const navigate = useNavigate();

  const actions = [
    {
      title: "Live Audio Recording",
      desc: "Record audio directly from your browser.",
      icon: Mic,
      cta: "Open Studio",
      action: () => navigate("/studio?mode=record"),
      iconBg: "bg-amber-brand-light text-amber-brand border-amber-brand/25",
    },
    {
      title: "Audio File Upload",
      desc: "Upload audio files for local speech-to-text processing.",
      icon: UploadCloud,
      cta: "Upload Audio",
      action: () => navigate("/studio?mode=upload"),
      iconBg: "bg-warm-ivory text-charcoal border-warm-grey",
    },
    {
      title: "Transcript Library",
      desc: "Browse, search and manage your transcripts.",
      icon: FileText,
      cta: "Browse Library",
      action: () => navigate("/history"),
      iconBg: "bg-amber-soft-light text-amber-brand border-amber-soft/30",
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-2 px-0.5">
        <h3 className="text-xs sm:text-sm font-semibold text-charcoal">
          Quick Workflows
        </h3>
        <span className="text-xs text-stone-grey">
          Audio & Transcription Actions
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {actions.map((act, i) => (
          <div
            key={i}
            onClick={act.action}
            className="p-3.5 sm:p-4 rounded-xl bg-pure-white border border-warm-grey hover:border-amber-brand/50 hover:shadow-xs hover:-translate-y-0.5 cursor-pointer transition-all duration-200 flex flex-col justify-between group shadow-2xs"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center border shadow-2xs shrink-0 ${act.iconBg}`}
              >
                <act.icon className="w-3.5 h-3.5" />
              </div>

              <div className="flex items-center gap-1 text-xs font-medium text-stone-grey group-hover:text-amber-brand transition-colors">
                <span>{act.cta}</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>

            <div>
              <h4 className="text-xs sm:text-sm font-semibold text-charcoal group-hover:text-amber-brand transition-colors">
                {act.title}
              </h4>
              <p className="text-xs text-stone-grey mt-0.5 leading-normal">
                {act.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;
