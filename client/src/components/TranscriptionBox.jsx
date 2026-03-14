import { Copy, Check, Quote, Terminal, Download, Share2, FileText, Activity } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

function TranscriptionBox({ transcript }) {
  const [copied, setCopied] = useState(false);
  const [displayText, setDisplayText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (transcript) {
      setIsTyping(true);
      setDisplayText("");
      let i = 0;
      const interval = setInterval(() => {
        setDisplayText(transcript.slice(0, i));
        i++;
        if (i > transcript.length) {
          clearInterval(interval);
          setIsTyping(false);
        }
      }, 8); // Crisp typing speed
      return () => clearInterval(interval);
    } else {
      setDisplayText("");
    }
  }, [transcript]);

  const copyToClipboard = () => {
    if (!transcript) return;
    navigator.clipboard.writeText(transcript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative h-[400px] md:h-full md:flex-1 md:max-h-[500px]">
      <div className="card-clean h-full flex flex-col overflow-hidden bg-slate-900/40">
        {/* V3 Header Toolbar */}
        <div className="px-6 py-4 border-b border-white/5 bg-slate-950/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-800" />
              <div className="w-2.5 h-2.5 rounded-full bg-slate-800" />
              <div className="w-2.5 h-2.5 rounded-full bg-slate-800" />
            </div>
            <span className="ml-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Live Feed</span>
          </div>
          
          <div className="flex items-center gap-5">
             <button className="text-slate-600 hover:text-white transition-colors">
                <Download size={15} />
             </button>
             <button className="text-slate-600 hover:text-white transition-colors">
                <Share2 size={15} />
             </button>
          </div>
        </div>

        <div className="flex-1 p-8 md:p-14 overflow-y-auto relative custom-scrollbar">
          <AnimatePresence mode="wait">
            {!transcript ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex flex-col items-center justify-center text-center space-y-6 grayscale opacity-40"
              >
                <div className="w-20 h-20 rounded-3xl bg-slate-800 flex items-center justify-center text-slate-600 border border-white/5">
                  <Terminal size={32} />
                </div>
                <div className="space-y-1.5">
                  <h4 className="text-sm font-black text-white uppercase tracking-widest">Awaiting Stream</h4>
                  <p className="text-slate-600 text-[10px] font-bold uppercase tracking-widest leading-loose">
                    Initialize engine to generate output
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-8"
              >
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-emerald-500/5 border border-emerald-500/10 text-[9px] font-black text-emerald-500 uppercase tracking-widest">
                  <Activity size={10} />
                  Confidence: 99.1%
                </div>
                
                <div className="prose prose-invert max-w-none">
                   <p className="text-slate-100 leading-[2] text-lg font-bold tracking-tight bg-clip-text">
                    {displayText}
                    {isTyping && (
                      <motion.span
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ repeat: Infinity, duration: 0.8 }}
                        className="inline-block w-1 h-5 ml-1 bg-indigo-500 align-middle"
                      />
                    )}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {transcript && (
          <div className="p-6 border-t border-white/5 bg-slate-950/20 flex justify-end">
            <button
               onClick={copyToClipboard}
               className={`group flex items-center gap-2.5 px-5 py-2.5 rounded-xl transition-all duration-300 border ${
                 copied 
                   ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                   : "bg-slate-800 text-slate-300 border-white/5 hover:bg-slate-700 hover:text-white"
               }`}
            >
              {copied ? (
                <>
                  <Check size={16} />
                  <span className="font-black text-[10px] uppercase tracking-widest">Copied</span>
                </>
              ) : (
                <>
                  <Copy size={16} className="group-hover:scale-110 transition-transform" />
                  <span className="font-black text-[10px] uppercase tracking-widest">Copy Text</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default TranscriptionBox;
