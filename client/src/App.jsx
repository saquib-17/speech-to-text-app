import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Upload, FileText, Sparkles, BrainCircuit, Settings, Layout, Zap, Menu, X } from "lucide-react";
import UploadAudio from "./components/UploadAudio";
import RecordAudio from "./components/RecordAudio";
import TranscriptionBox from "./components/TranscriptionBox";
import HistoryCard from "./components/HistoryCard";
import Auth from "./components/Auth";
import { supabase } from "./supabaseClient";
import confetti from "canvas-confetti";
function App() {
  const [transcript, setTranscript] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("upload");
  const [history, setHistory] = useState([]);
  const [currentView, setCurrentView] = useState("studio");
  const [session, setSession] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      fetchHistory();
    }
  }, [session]);

  const fetchHistory = async () => {
    if (!session) return;
    try {
      const response = await fetch(`http://localhost:5000/api/history?userId=${session.user.id}`);
      const result = await response.json();
      if (result.success) {
        setHistory(result.data);
      }
    } catch (err) {
      console.error("Failed to fetch history:", err);
    }
  };

  const handleDeleteHistory = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/history/${id}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (result.success) {
        // Optimistically remove from UI
        setHistory(prev => prev.filter(item => item._id !== id));
      } else {
        console.error("Failed to delete from server:", result.message);
      }
    } catch (err) {
      console.error("Network error during delete:", err);
    }
  };

  const handleRecord = () => {
    setIsRecording((prev) => !prev);
  };

  const handleTranscriptionSuccess = (text) => {
    setTranscript(text);
    setIsLoading(false);
    fetchHistory(); // Refresh history
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#6366f1", "#4f46e5"],
    });
  };

  return (
    <div className="min-h-screen selection:bg-indigo-500/30">
      {/* V3 Navigation: Clean & High Contrast */}
      <nav className="fixed top-0 w-full z-50 nav-blur px-8 py-5">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5 group cursor-pointer">
            <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg group-hover:bg-indigo-500 transition-colors">
              <BrainCircuit className="text-white" size={20} />
            </div>
            <span className="text-xl font-black tracking-tight text-white uppercase italic">
              Vox<span className="text-indigo-500">Scribe</span>
            </span>
          </div>
          
          <div className="hidden md:flex items-center gap-10 text-[13px] font-bold uppercase tracking-widest text-slate-500">
            {session && (
              <>
                <button 
                  onClick={() => setCurrentView("studio")}
                  className={`hover:text-white transition-colors border-b-2 pb-1 ${
                    currentView === "studio" ? "text-white border-indigo-500" : "border-transparent hover:border-indigo-500"
                  }`}
                >
                  Studio
                </button>
                <button 
                  onClick={() => setCurrentView("history")}
                  className={`hover:text-white transition-colors border-b-2 pb-1 ${
                    currentView === "history" ? "text-white border-indigo-500" : "border-transparent hover:border-indigo-500"
                  }`}
                >
                  Archives
                </button>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button className="hidden md:block p-2 text-slate-500 hover:text-white transition-colors">
              <Settings size={20} />
            </button>
            <div className="w-9 h-9 rounded-lg bg-slate-800 border border-white/5 flex items-center justify-center text-indigo-400 font-bold text-xs">
              {session ? session.user.email?.[0].toUpperCase() : "JD"}
            </div>
            {session && (
              <button 
                onClick={() => supabase.auth.signOut()}
                className="hidden md:block text-[10px] font-black text-slate-500 hover:text-rose-500 uppercase tracking-widest transition-colors ml-2"
              >
                Logout
              </button>
            )}
            
            {/* Mobile Menu Toggle */}
            {session && (
              <button 
                className="md:hidden p-2 text-slate-400 hover:text-white transition-colors ml-2"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            )}
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && session && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden mt-4 pt-4 border-t border-white/10 flex flex-col gap-4"
            >
              <button 
                onClick={() => { setCurrentView("studio"); setIsMobileMenuOpen(false); }}
                className={`text-left text-sm font-bold uppercase tracking-widest p-2 rounded-lg ${
                  currentView === "studio" ? "bg-indigo-500/10 text-indigo-400" : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                Studio
              </button>
              <button 
                onClick={() => { setCurrentView("history"); setIsMobileMenuOpen(false); }}
                className={`text-left text-sm font-bold uppercase tracking-widest p-2 rounded-lg ${
                  currentView === "history" ? "bg-indigo-500/10 text-indigo-400" : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                Archives
              </button>
              <button className="text-left text-sm font-bold uppercase tracking-widest p-2 text-slate-400 hover:bg-white/5 hover:text-white rounded-lg flex items-center gap-2">
                <Settings size={16} /> Settings
              </button>
              <button 
                onClick={() => { supabase.auth.signOut(); setIsMobileMenuOpen(false); }}
                className="text-left text-sm font-bold uppercase tracking-widest p-2 text-rose-500/80 hover:bg-rose-500/10 hover:text-rose-500 rounded-lg mt-2"
              >
                Logout
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <main className="pt-28 md:pt-32 pb-24 px-4 md:px-8 max-w-screen-xl mx-auto">
        {/* Streamlined Hero */}
        <div className="mb-10 md:mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em] mb-4">
            <Zap size={12} />
            AI Pipeline Ready
          </div>
          <h1 className="text-3xl md:text-5xl font-black mb-3 md:mb-4 tracking-tight text-white leading-tight">
            Advanced <span className="text-indigo-500">Speech Synthesis</span> & Extraction
          </h1>
          <p className="text-slate-500 text-sm md:text-base max-w-xl font-medium">
            Deploy neural transcription models for high-fidelity audio analysis. 
            Select an input source below to begin processing.
          </p>
        </div>

        {/* Workspace Layout */}
        {/* Workspace Layout */}
        {!session ? (
          <div className="flex justify-center items-center min-h-[500px]">
            <Auth />
          </div>
        ) : currentView === "studio" ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* Left: Operations Panel */}
            <div className="lg:col-span-5 space-y-6 md:space-y-8">
              <div className="bg-slate-900/50 p-1.5 rounded-2xl border border-white/5 flex gap-1">
                <button
                  onClick={() => setActiveTab("upload")}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all duration-200 ${
                    activeTab === "upload" 
                      ? "bg-indigo-600 text-white shadow-xl" 
                      : "text-slate-500 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Upload size={18} />
                  <span className="text-xs font-black uppercase tracking-wider">Upload</span>
                </button>
                <button
                  onClick={() => setActiveTab("record")}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all duration-200 ${
                    activeTab === "record" 
                      ? "bg-indigo-600 text-white shadow-xl" 
                      : "text-slate-500 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Mic size={18} />
                  <span className="text-xs font-black uppercase tracking-wider">Record</span>
                </button>
              </div>

              <div className="card-clean p-8 min-h-[420px] shadow-2xl relative overflow-hidden">
                 {/* Subtle background detail */}
                <div className="absolute top-0 right-0 p-4 opacity-5">
                  <Layout size={120} />
                </div>

                <AnimatePresence mode="wait">
                  {activeTab === "upload" ? (
                    <motion.div
                      key="upload"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <UploadAudio 
                        setTranscript={handleTranscriptionSuccess} 
                        setIsLoading={setIsLoading} 
                        userId={session.user.id}
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="record"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <RecordAudio
                        setTranscript={handleTranscriptionSuccess}
                        isRecording={isRecording}
                        handleRecord={handleRecord}
                        setIsLoading={setIsLoading}
                        userId={session.user.id}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-6 rounded-2xl bg-indigo-600/10 border border-indigo-600/20 flex flex-col items-center gap-4 text-center"
                >
                  <div className="w-10 h-10 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
                  <div className="space-y-1">
                    <p className="text-indigo-400 font-black text-xs uppercase tracking-widest">Processing Node...</p>
                    <p className="text-slate-500 text-[10px] font-bold">Neural network analysis in progress</p>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Right: Studio Viewer */}
            <div className="lg:col-span-7 flex flex-col h-full mt-8 lg:mt-0">
               <div className="flex items-center justify-between mb-4 px-2">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Studio Output</h2>
                </div>
                {transcript && (
                  <button 
                    onClick={() => setTranscript("")}
                    className="text-[10px] font-black text-slate-500 hover:text-rose-500 uppercase tracking-widest transition-colors"
                  >
                    Terminate Output
                  </button>
                )}
              </div>

              <TranscriptionBox transcript={transcript} />
            </div>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8 min-h-[500px]"
          >
            <div className="flex items-center justify-between border-b border-white/5 pb-6">
              <div>
                <h2 className="text-3xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-indigo-500" />
                  Historical Archives
                </h2>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-2">{history.length} Saved Records</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {history.length > 0 ? (
                history.map((item) => (
                  <HistoryCard 
                    key={item._id} 
                    transcription={item} 
                    onClick={(t) => {
                      setTranscript(t.transcriptionText);
                      setCurrentView("studio");
                    }} 
                    onDelete={handleDeleteHistory}
                  />
                ))
              ) : (
                <div className="col-span-full p-20 rounded-3xl border border-white/5 bg-slate-900/20 flex flex-col items-center justify-center text-center grayscale opacity-50 shadow-inner">
                  <FileText size={40} className="text-slate-700 mb-6" />
                  <p className="text-sm font-black uppercase tracking-widest text-slate-600">No records found</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </main>

      {/* Simplified Status Bar */}
      <footer className="fixed bottom-0 w-full border-t border-white/5 py-3 px-4 md:px-8 bg-slate-950/80 backdrop-blur-sm z-40">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600">
          <div className="flex items-center gap-2 md:gap-4 flex-wrap">
            <span className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="hidden sm:inline">Service: </span>Online
            </span>
            <span className="text-slate-800">|</span>
            <span className="whitespace-nowrap">API: Ver. 2.4.1</span>
          </div>
          <div className="hidden sm:block whitespace-nowrap">
            © LexiNode Intelligence Unit
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
