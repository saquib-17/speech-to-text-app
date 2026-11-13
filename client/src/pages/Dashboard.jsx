import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mic,
  UploadCloud,
  ShieldCheck,
  Sparkles,
  Cpu,
  Play,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import TelemetryGrid from "../components/dashboard/TelemetryGrid";
import QuickActions from "../components/dashboard/QuickActions";
import RecentTranscripts from "../components/dashboard/RecentTranscripts";
import Button from "../components/common/Button";
import api from "../api/client";

export const Dashboard = () => {
  const { isAuthenticated, requireAuth } = useAuth();
  const navigate = useNavigate();

  const [transcripts, setTranscripts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

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

  const handleStartRecording = () => {
    requireAuth(() => navigate("/studio?mode=record"), {
      title: "Sign in to Record Live Audio",
      subtitle: "Capture and transcribe audio with local Faster-Whisper",
    });
  };

  const handleUploadAudio = () => {
    requireAuth(() => navigate("/studio?mode=upload"), {
      title: "Sign in to Upload Audio",
      subtitle: "Import MP3, WAV or M4A recordings for local transcription",
    });
  };

  // Compute telemetry metrics
  const totalTranscripts = transcripts.length;
  const totalDuration = transcripts.reduce((acc, t) => {
    const meta = t.transcriptionMetadata || {};
    const audioMeta = t.audioMetadata || {};
    return acc + (meta.durationSeconds || audioMeta.durationSeconds || 0);
  }, 0);

  return (
    <div className="space-y-5 pb-8">
      {/* Reference Hero Stage: 240-260px Height Target */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#FFF6EE] via-[#FAF0FA] to-[#F5ECFC] border border-[#EBE8F0] p-6 sm:px-7 sm:py-6 shadow-xs min-h-[240px] flex items-center">
        {/* Soft Background Radial Lighting */}
        <div className="absolute top-0 right-1/4 w-72 h-72 bg-[#F07800]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6 w-full">
          {/* Left: Headline, Badges & Actions */}
          <div className="space-y-3 max-w-xl">
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/95 border border-[#EBE8F0] text-[#F07800] text-[11px] font-medium shadow-2xs">
                <Cpu className="w-3 h-3 text-[#F07800]" />
                <span>Faster-Whisper INT8</span>
              </div>

              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/95 border border-[#EBE8F0] text-[#7138B8] text-[11px] font-medium shadow-2xs">
                <ShieldCheck className="w-3 h-3 text-[#7138B8]" />
                <span>Local Private Transcription</span>
              </div>
            </div>

            {/* Main Headline: 26px Target */}
            <div>
              <h1 className="text-[22px] sm:text-[26px] font-semibold text-[#191B2B] tracking-tight leading-tight">
                Transcribe • Analyze • <span className="text-[#F07800]">Do More</span>
              </h1>
              <p className="text-[13px] sm:text-[14px] text-[#686B7A] mt-1.5 leading-normal">
                Record or upload audio, get accurate transcripts with Faster-Whisper, and unlock AI-powered summaries, key points and answers.
              </p>
            </div>

            {/* Hero CTAs: 40px High */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <Button
                variant="primary"
                size="lg"
                icon={Mic}
                onClick={handleStartRecording}
                className="font-semibold shadow-xs"
              >
                Start Recording
              </Button>

              <Button
                variant="secondary"
                size="lg"
                icon={UploadCloud}
                onClick={handleUploadAudio}
                className="font-semibold shadow-2xs"
              >
                Upload Audio
              </Button>
            </div>
          </div>

          {/* Right: Signature Speech & AI Illustration */}
          <div className="relative flex items-center justify-center shrink-0 w-full sm:w-auto py-1">
            {/* Orange Waveform lines */}
            <div className="hidden sm:flex items-center gap-1 mr-2.5">
              {[8, 16, 26, 12, 20, 30, 14, 24, 10, 18].map((h, i) => (
                <span
                  key={i}
                  className="w-0.5 rounded-full bg-[#F07800]"
                  style={{
                    height: `${h}px`,
                    opacity: 0.45 + (i % 3) * 0.25,
                  }}
                />
              ))}
            </div>

            {/* Stylized Microphone */}
            <div className="relative flex items-center justify-center">
              {/* Orange Glow */}
              <div className="absolute inset-0 bg-[#F07800]/15 rounded-full blur-lg scale-110" />

              {/* Stylized Microphone: Compact Proportions */}
              <div className="relative w-14 h-22 sm:w-16 sm:h-24 rounded-2xl bg-gradient-to-b from-[#2B1B47] via-[#1E2945] to-[#172341] border-2 border-white/60 shadow-lg flex flex-col items-center justify-between p-1.5 z-10">
                {/* Metallic Orange Ring Accent */}
                <div className="w-full h-1 rounded-full bg-[#F07800] shadow-2xs" />

                {/* Mesh pattern */}
                <div className="w-9 h-10 sm:w-10 sm:h-11 rounded-xl bg-[#172341]/80 border border-white/20 flex flex-col items-center justify-center gap-1 p-0.5">
                  <div className="w-full h-0.5 bg-white/20 rounded" />
                  <div className="w-full h-0.5 bg-white/20 rounded" />
                  <div className="w-full h-0.5 bg-white/20 rounded" />
                </div>

                {/* Microphone Stand Base */}
                <div className="w-4 h-2.5 bg-[#172341] rounded-t border-t border-white/30" />
              </div>
            </div>

            {/* Floating Transcript Card & AI Badge: Compact */}
            <div className="hidden md:flex flex-col gap-1 ml-2.5 relative">
              {/* AI Badge pill in Purple */}
              <div className="self-end inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#7138B8] text-white text-[9.5px] font-semibold shadow-xs">
                <span>AI</span>
                <Sparkles className="w-2.5 h-2.5 text-[#FF9B24]" />
              </div>

              {/* Floating Card */}
              <div className="w-32 p-2 rounded-xl bg-white/95 border border-[#EBE8F0] shadow-md space-y-1 backdrop-blur-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-4.5 h-4.5 rounded-full bg-[#7138B8] text-white flex items-center justify-center shadow-2xs">
                    <Play className="w-2 h-2 ml-0.2 fill-current" />
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="h-1 rounded-full bg-[#EBE8F0] w-3/4" />
                    <div className="h-1 rounded-full bg-[#FFF1E2] w-1/2" />
                  </div>
                </div>
                <div className="h-1 rounded-full bg-[#EBE8F0] w-full" />
                <div className="h-1 rounded-full bg-[#EBE8F0] w-4/5" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Telemetry Statistics Row */}
      <TelemetryGrid
        totalTranscripts={totalTranscripts}
        totalDurationSeconds={totalDuration}
      />

      {/* Quick Workflows */}
      <QuickActions />

      {/* Recent Transcripts & System Status */}
      <RecentTranscripts
        transcripts={transcripts}
        isLoading={isLoading}
      />
    </div>
  );
};

export default Dashboard;
