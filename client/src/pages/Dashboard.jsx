import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mic,
  UploadCloud,
  Radio,
  ShieldCheck,
  Zap,
  Sparkles,
  Cpu,
  Database,
  ArrowRight,
  CheckCircle2,
  Lock,
  UserPlus,
  LogIn,
  Clock,
  AudioWaveform,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import TelemetryGrid from "../components/dashboard/TelemetryGrid";
import QuickActions from "../components/dashboard/QuickActions";
import RecentTranscripts from "../components/dashboard/RecentTranscripts";
import Button from "../components/common/Button";
import AuthModal from "../components/auth/AuthModal";
import api from "../api/client";

export const Dashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [transcripts, setTranscripts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Auth Modal State for Protected Actions in Guest Mode
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState("login");
  const [authModalTarget, setAuthModalTarget] = useState("/studio");
  const [authModalTitle, setAuthModalTitle] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardData();
    } else {
      setTranscripts([]);
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const res = await api.transcripts.getAll({ limit: 50 });
      if (res.success && res.data) {
        const list = Array.isArray(res.data) ? res.data : (res.data.transcripts || []);
        setTranscripts(list);
      }
    } catch (err) {
      console.error("Dashboard data fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProtectedAction = (targetPath, mode = "login", title = null) => {
    if (isAuthenticated) {
      navigate(targetPath);
    } else {
      setAuthModalTarget(targetPath);
      setAuthModalMode(mode);
      setAuthModalTitle(title);
      setAuthModalOpen(true);
    }
  };

  // Compute telemetry metrics for authenticated user
  const totalTranscripts = transcripts.length;
  const totalDuration = transcripts.reduce((acc, t) => {
    const meta = t.transcriptionMetadata || {};
    const audioMeta = t.audioMetadata || {};
    return acc + (meta.durationSeconds || audioMeta.durationSeconds || 0);
  }, 0);

  const firstName = user?.name ? user.name.split(" ")[0] : "Creator";

  return (
    <div className="space-y-3.5 sm:space-y-4 pb-6">
      {/* Auth Modal for Guest Actions */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
        title={authModalTitle}
        onSuccess={() => {
          if (authModalTarget) {
            navigate(authModalTarget);
          }
        }}
      />

      {/* Editorial Hero Stage */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#FFFDF9] via-[#FAF4EA] to-[#F3E7D7] border border-[#E5D7C3] p-3.5 sm:p-4 shadow-2xs">
        {/* Subtle Decorative Ambient Background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-soft/10 rounded-full blur-3xl pointer-events-none -mr-12 -mt-12" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
          {/* Left: Narrative & Status */}
          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-pure-white/95 border border-amber-brand/25 text-amber-brand text-xs font-medium shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-brand animate-pulse" />
                <span>Faster-Whisper INT8</span>
              </div>

              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-pure-white/80 border border-warm-grey text-stone-grey text-xs font-normal">
                <ShieldCheck className="w-3 h-3 text-amber-brand" />
                <span>Local Private Transcription</span>
              </div>

              {!isAuthenticated && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-pure-white/80 border border-warm-grey text-stone-grey text-xs font-normal">
                  <Sparkles className="w-3 h-3 text-amber-brand" />
                  <span>Gemini 3.8 Flash AI</span>
                </div>
              )}
            </div>

            <div>
              {isAuthenticated ? (
                <>
                  <h1 className="text-xl sm:text-[26px] font-serif font-medium text-charcoal tracking-tight leading-tight">
                    Welcome back, <span className="italic font-normal text-amber-brand">{firstName}</span>.
                  </h1>
                  <p className="text-xs sm:text-[13px] text-stone-grey mt-0.5 leading-normal max-w-lg font-normal">
                    Your sovereign speech intelligence studio is ready. Transcribe voice privately with Faster-Whisper and generate AI insights.
                  </p>
                </>
              ) : (
                <>
                  <h1 className="text-xl sm:text-[26px] font-serif font-medium text-charcoal tracking-tight leading-tight">
                    Speech Intelligence & <span className="italic font-normal text-amber-brand">Sovereign Audio</span> Workspace.
                  </h1>
                  <p className="text-xs sm:text-[13px] text-stone-grey mt-0.5 leading-normal max-w-xl font-normal">
                    Transcribe audio locally with Faster-Whisper on CPU. Analyze conversations, extract action points, and ask questions with Gemini 3.8 Flash.
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Right: Actions & Acoustic Waveform Visual */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            {/* Mini Acoustic Waveform Badge (Desktop) */}
            <div className="hidden xl:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-pure-white/85 border border-[#E3D3BE] shadow-2xs">
              <div className="flex items-end h-4.5 gap-0.5">
                {[30, 60, 95, 45, 80, 100, 70, 50, 85, 40].map((h, i) => (
                  <span
                    key={i}
                    className="w-0.5 sm:w-1 rounded-full bg-amber-brand"
                    style={{
                      height: `${h}%`,
                      opacity: 0.65 + (i % 3) * 0.15,
                    }}
                  />
                ))}
              </div>
              <div className="text-[11px] text-stone-grey leading-tight pl-2 border-l border-warm-grey">
                <span className="block font-semibold text-charcoal text-xs">16 kHz Audio</span>
                <span className="text-amber-brand text-[10px] font-mono">Local Stream</span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                icon={Mic}
                onClick={() => handleProtectedAction("/studio?mode=record", "login", "Sign in to record live audio")}
                className="shadow-2xs text-xs font-semibold px-3.5 py-1.5"
              >
                Start Recording
              </Button>

              <Button
                variant="secondary"
                size="sm"
                icon={UploadCloud}
                onClick={() => handleProtectedAction("/studio?mode=upload", "login", "Sign in to upload audio files")}
                className="bg-pure-white/90 hover:bg-pure-white border-warm-grey text-charcoal text-xs font-medium shadow-2xs px-3.5 py-1.5"
              >
                Upload Audio
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Workspace Body */}
      {isAuthenticated ? (
        <>
          {/* Authenticated Telemetry Grid */}
          <TelemetryGrid
            totalTranscripts={totalTranscripts}
            totalDurationSeconds={totalDuration}
          />

          {/* Quick Actions */}
          <QuickActions />

          {/* Recent Transcripts */}
          <RecentTranscripts
            transcripts={transcripts}
            isLoading={isLoading}
          />
        </>
      ) : (
        <>
          {/* Guest Feature Architecture Showcase */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3.5 sm:p-4 rounded-xl bg-pure-white border border-warm-grey shadow-2xs space-y-2">
              <div className="w-8 h-8 rounded-lg bg-amber-brand-light border border-amber-brand/25 flex items-center justify-center text-amber-brand">
                <Cpu className="w-4 h-4" />
              </div>
              <h3 className="text-xs sm:text-sm font-semibold text-charcoal">
                Faster-Whisper INT8 Inference
              </h3>
              <p className="text-xs text-stone-grey leading-relaxed">
                Processes speech locally on your computer with zero per-minute audio charges and full conversational privacy.
              </p>
            </div>

            <div className="p-3.5 sm:p-4 rounded-xl bg-pure-white border border-warm-grey shadow-2xs space-y-2">
              <div className="w-8 h-8 rounded-lg bg-[#FAF4EA] border border-amber-brand/20 flex items-center justify-center text-amber-brand">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="text-xs sm:text-sm font-semibold text-charcoal">
                Gemini 3.8 Flash Intelligence
              </h3>
              <p className="text-xs text-stone-grey leading-relaxed">
                Generates executive summaries, key bullet points, and answers questions with context-aware AI retrieval.
              </p>
            </div>

            <div className="p-3.5 sm:p-4 rounded-xl bg-pure-white border border-warm-grey shadow-2xs space-y-2">
              <div className="w-8 h-8 rounded-lg bg-warm-ivory border border-warm-grey flex items-center justify-center text-charcoal">
                <Database className="w-4 h-4 text-amber-brand" />
              </div>
              <h3 className="text-xs sm:text-sm font-semibold text-charcoal">
                Persistent MongoDB Storage
              </h3>
              <p className="text-xs text-stone-grey leading-relaxed">
                Your transcripts and account are safely persisted across restarts with dedicated user data isolation.
              </p>
            </div>
          </div>

          {/* Public Quick Workflows Grid */}
          <div>
            <div className="flex items-center justify-between mb-2 px-0.5">
              <h3 className="text-xs sm:text-sm font-semibold text-charcoal">
                Explore Studio Capabilities
              </h3>
              <span className="text-xs text-stone-grey">
                Click any action to access studio
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div
                onClick={() => handleProtectedAction("/studio?mode=record", "login", "Sign in to record audio")}
                className="p-3.5 sm:p-4 rounded-xl bg-pure-white border border-warm-grey hover:border-amber-brand/50 hover:shadow-xs hover:-translate-y-0.5 cursor-pointer transition-all duration-200 flex flex-col justify-between group shadow-2xs"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center border shadow-2xs shrink-0 bg-amber-brand-light text-amber-brand border-amber-brand/25">
                    <Mic className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex items-center gap-1 text-xs font-medium text-stone-grey group-hover:text-amber-brand transition-colors">
                    <span>Open Studio</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-semibold text-charcoal group-hover:text-amber-brand transition-colors">
                    Live Audio Recording
                  </h4>
                  <p className="text-xs text-stone-grey mt-0.5 leading-normal">
                    Capture crystal clear voice with real-time waveform visualization.
                  </p>
                </div>
              </div>

              <div
                onClick={() => handleProtectedAction("/studio?mode=upload", "login", "Sign in to upload audio")}
                className="p-3.5 sm:p-4 rounded-xl bg-pure-white border border-warm-grey hover:border-amber-brand/50 hover:shadow-xs hover:-translate-y-0.5 cursor-pointer transition-all duration-200 flex flex-col justify-between group shadow-2xs"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center border shadow-2xs shrink-0 bg-warm-ivory text-charcoal border-warm-grey">
                    <UploadCloud className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex items-center gap-1 text-xs font-medium text-stone-grey group-hover:text-amber-brand transition-colors">
                    <span>Upload Audio</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-semibold text-charcoal group-hover:text-amber-brand transition-colors">
                    Audio File Upload
                  </h4>
                  <p className="text-xs text-stone-grey mt-0.5 leading-normal">
                    Import MP3, WAV, M4A, or FLAC recordings for fast transcription.
                  </p>
                </div>
              </div>

              <div
                onClick={() => handleProtectedAction("/history", "login", "Sign in to view transcripts")}
                className="p-3.5 sm:p-4 rounded-xl bg-pure-white border border-warm-grey hover:border-amber-brand/50 hover:shadow-xs hover:-translate-y-0.5 cursor-pointer transition-all duration-200 flex flex-col justify-between group shadow-2xs"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center border shadow-2xs shrink-0 bg-[#FAF4EA] text-amber-brand border-amber-brand/20">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex items-center gap-1 text-xs font-medium text-stone-grey group-hover:text-amber-brand transition-colors">
                    <span>Explore Library</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-semibold text-charcoal group-hover:text-amber-brand transition-colors">
                    Transcript Archive & Q&A
                  </h4>
                  <p className="text-xs text-stone-grey mt-0.5 leading-normal">
                    Interactive audio-synced editor and contextual AI chat.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Guest Sample Preview & Call to Action */}
          <div className="rounded-xl bg-pure-white border border-warm-grey overflow-hidden shadow-2xs p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-semibold text-charcoal">
                  Ready to Transcribe Voice Notes & Meetings?
                </span>
              </div>
              <p className="text-xs text-stone-grey max-w-lg leading-relaxed">
                Sign in to your account or create a new profile to record voice, persist transcripts, and ask questions with Gemini 3.8 Flash.
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <Button
                variant="secondary"
                size="sm"
                icon={LogIn}
                onClick={() => handleProtectedAction("/dashboard", "login", "Sign In to Your Workspace")}
                className="text-xs font-semibold"
              >
                Sign In
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={UserPlus}
                onClick={() => handleProtectedAction("/studio", "register", "Create Your Free Account")}
                className="text-xs font-semibold shadow-xs"
              >
                Create Account
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
