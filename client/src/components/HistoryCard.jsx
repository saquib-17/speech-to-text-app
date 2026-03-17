import { FileText, Calendar, Clock, ChevronRight, Trash2 } from "lucide-react";
import { motion } from "framer-motion";

function HistoryCard({ transcription, onClick, onDelete }) {
  const date = new Date(transcription.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  
  const time = new Date(transcription.createdAt).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <motion.div
      whileHover={{ x: 4 }}
      onClick={() => onClick(transcription)}
      className="group p-5 rounded-2xl bg-slate-900/40 border border-white/5 hover:border-indigo-500/30 hover:bg-slate-900/60 transition-all cursor-pointer flex items-center justify-between"
    >
      <div className="flex items-center gap-4 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors border border-white/5">
          <FileText size={18} />
        </div>
        <div className="min-w-0">
          <h4 className="text-sm font-bold text-white truncate group-hover:text-indigo-400 transition-colors">
            {transcription.transcriptionText
              ? `${transcription.transcriptionText.slice(0, 72)}${transcription.transcriptionText.length > 72 ? "…" : ""}`
              : transcription.audioFile}
          </h4>
          <div className="flex items-center gap-3 mt-1">
            <span className="flex items-center gap-1 text-[10px] font-black text-slate-500 uppercase tracking-widest">
              <Calendar size={10} /> {date}
            </span>
            <span className="flex items-center gap-1 text-[10px] font-black text-slate-500 uppercase tracking-widest">
              <Clock size={10} /> {time}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button 
          onClick={(e) => {
            e.stopPropagation();
            if (onDelete) onDelete(transcription._id);
          }}
          className="p-2 text-slate-600 hover:bg-rose-500/10 hover:text-rose-500 rounded-lg transition-colors group/delete"
          title="Delete Record"
        >
          <Trash2 size={16} className="group-hover/delete:scale-110 transition-transform" />
        </button>
        <ChevronRight size={16} className="text-slate-600 group-hover:text-indigo-400 transition-colors" />
      </div>
    </motion.div>
  );
}

export default HistoryCard;
