import { useState, useRef } from "react";
import { Upload, FileAudio, X, Zap, AlertCircle, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function UploadAudio({ setTranscript, setIsLoading, userId }) {
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    validateAndSetFile(selectedFile);
  };

  const validateAndSetFile = (selectedFile) => {
    if (!selectedFile) return;
    
    if (!selectedFile.type.startsWith("audio/")) {
      setError("Input Error: Verify file signature (MP3/WAV/M4A).");
      setFile(null);
      return;
    }
    
    setFile(selectedFile);
    setError(null);
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsLoading(true);
    const formData = new FormData();
    formData.append("audio", file);
    if (userId) formData.append("userId", userId);

    try {
      const response = await fetch("http://localhost:5000/api/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (response.ok) {
        setTranscript(result.data.transcriptionText);
        setFile(null);
      } else {
        setError(result.message || "Engine Error: Transcription logic halted.");
      }
    } catch (err) {
      setError("Network Fault: Backend node unreachable.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {!file ? (
        <motion.div 
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            const droppedFile = e.dataTransfer.files[0];
            validateAndSetFile(droppedFile);
          }}
          className={`relative border-2 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center transition-all duration-300 cursor-pointer ${
            isDragging 
              ? "border-indigo-500 bg-indigo-500/5" 
              : "border-white/5 bg-slate-900/40 hover:border-indigo-500/30 hover:bg-slate-900/60"
          }`}
        >
          <input
            type="file"
            accept="audio/*"
            onChange={handleFileChange}
            ref={fileInputRef}
            className="hidden"
          />
          <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center text-indigo-400 mb-6 border border-white/5">
            <Upload size={28} />
          </div>
          <h3 className="text-lg font-black text-white mb-2 uppercase tracking-wide">Select Module</h3>
          <p className="text-[11px] text-slate-500 font-black uppercase tracking-[0.2em]">Drag system files here</p>
        </motion.div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative p-8 rounded-3xl bg-slate-900/60 border border-indigo-500/20 flex flex-col items-center text-center"
        >
          <div className="w-14 h-14 bg-slate-800 rounded-xl flex items-center justify-center text-indigo-400 mb-5 border border-white/5">
            <FileAudio size={28} />
          </div>
          
          <div className="space-y-1.5 mb-8">
            <p className="font-bold text-white truncate max-w-[240px] text-sm">{file.name}</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500/80">
              Payload Ready • {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>

          <button 
            onClick={() => setFile(null)}
            className="absolute top-4 right-4 p-2 text-slate-600 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-2 text-[9px] font-black text-slate-600 uppercase tracking-widest">
            <ShieldCheck size={12} className="text-emerald-500" />
            Integrity Verified
          </div>
        </motion.div>
      )}

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20 flex items-center gap-3 text-rose-400 text-[10px] font-black uppercase tracking-widest"
          >
            <AlertCircle size={14} />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={handleUpload}
        disabled={!file}
        className="btn-primary w-full py-4 text-[12px] font-black uppercase tracking-[0.3em]"
      >
        <Zap size={16} />
        Init Transcription
      </button>
    </div>
  );
}

export default UploadAudio;
