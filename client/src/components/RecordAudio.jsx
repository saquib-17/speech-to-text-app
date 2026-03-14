import { useState, useRef, useEffect } from "react";
import { Mic, Square, Save, RotateCcw, Radio, Activity, Zap, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function RecordAudio({ setTranscript, isRecording, handleRecord, setIsLoading, userId }) {
  const [audioURL, setAudioURL] = useState(null);
  const [blob, setBlob] = useState(null);
  const [error, setError] = useState(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const getSupportedMimeType = () => {
    const types = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/ogg;codecs=opus",
      "audio/mp4",
      "audio/wav",
    ];
    return types.find((type) => MediaRecorder.isTypeSupported(type)) || "";
  };

  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = getSupportedMimeType();
      
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: mimeType || "audio/wav" });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
        setBlob(audioBlob);
        handleRecord(); // Toggle to false only when blob is ready
      };

      mediaRecorderRef.current.start();
      handleRecord(); // Toggle to true
    } catch (err) {
      setError("Hardware Fault: Access to audio stream denied.");
      console.error("Recording start error:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => {
          track.stop();
          mediaRecorderRef.current.stream.removeTrack(track);
        });
      }
    }
  };

  const resetRecording = () => {
    setAudioURL(null);
    setBlob(null);
    setError(null);
    chunksRef.current = [];
  };

  const saveRecording = async () => {
    if (!blob) {
      setError("Logical Fault: Payload not ready.");
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    // Use a generic .wav extension if we're unsure, or match the detected type
    const extension = blob.type.includes("webm") ? "webm" : blob.type.includes("mp4") ? "mp4" : "wav";
    formData.append("audio", blob, `recording.${extension}`);
    if (userId) formData.append("userId", userId);

    try {
      const response = await fetch("http://localhost:5000/api/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (response.ok) {
        setTranscript(result.data.transcriptionText);
        resetRecording();
      } else {
        setError(result.message || "Transcription Error: Signal loss during relay.");
      }
    } catch (err) {
      if (err.name === "AbortError") {
        setError("Network Interrupt: Connection lost during relay.");
      } else {
        setError("Network Fault: Node synchronization failed.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col items-center justify-center space-y-12">
      <div className="relative">
        <AnimatePresence mode="wait">
          {!isRecording && !audioURL ? (
            <motion.button
              key="idle"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              onClick={startRecording}
              className="w-24 h-24 rounded-3xl bg-indigo-600 text-white flex items-center justify-center shadow-2xl hover:bg-indigo-500 transition-all active:scale-95"
            >
              <Mic size={32} />
            </motion.button>
          ) : isRecording ? (
             <motion.div
               key="recording"
               className="relative animate-pulse-soft"
             >
                <motion.button
                  onClick={stopRecording}
                  className="w-24 h-24 rounded-3xl bg-rose-600 text-white flex items-center justify-center shadow-2xl hover:bg-rose-500 transition-all border-4 border-rose-500/20"
                >
                  <Square size={28} fill="white" />
                </motion.button>
             </motion.div>
          ) : (
             <motion.div
              key="preview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-8 w-full"
            >
              <div className="w-20 h-20 rounded-2xl bg-slate-800 border border-white/5 flex items-center justify-center text-indigo-400">
                <Radio size={32} className="animate-pulse" />
              </div>
              
              <div className="w-full space-y-4">
                <div className="p-3 bg-slate-950/50 rounded-xl border border-white/5">
                  <audio src={audioURL} controls className="w-full h-8 grayscale contrast-125" />
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={resetRecording}
                    className="btn-secondary flex-1 py-3 text-[10px] uppercase tracking-widest"
                  >
                    <RotateCcw size={14} />
                    Reset
                  </button>
                  <button
                    onClick={saveRecording}
                    disabled={!blob}
                    className="btn-primary flex-1 py-3 text-[10px] uppercase tracking-widest"
                  >
                    <Save size={14} />
                    Analyze
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute -bottom-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center gap-2 text-rose-400 text-[9px] font-black uppercase tracking-widest"
          >
            <AlertCircle size={12} />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="text-center space-y-1.5 grayscale opacity-60">
        <h4 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">
          {isRecording ? "Input Active" : !audioURL ? "Voice Decoder" : "Payload Ready"}
        </h4>
        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">
          {isRecording ? "Neural pathway open" : !audioURL ? "Ready for signal" : "Confirm before processing"}
        </p>
      </div>

      {isRecording && (
        <div className="flex gap-1.5 items-center justify-center h-4">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="w-1 bg-indigo-500 rounded-full"
              animate={{ height: ["4px", "16px", "4px"] }}
              transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.1 }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default RecordAudio;
