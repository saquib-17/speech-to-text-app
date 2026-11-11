import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Mic, UploadCloud, Radio, ShieldCheck, Zap } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import TelemetryGrid from "../components/dashboard/TelemetryGrid";
import QuickActions from "../components/dashboard/QuickActions";
import RecentTranscripts from "../components/dashboard/RecentTranscripts";
import Button from "../components/common/Button";
import api from "../api/client";

export const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [transcripts, setTranscripts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

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

  // Compute telemetry metrics
  const totalTranscripts = transcripts.length;
  const totalDuration = transcripts.reduce((acc, t) => {
    const meta = t.transcriptionMetadata || {};
    const audioMeta = t.audioMetadata || {};
    return acc + (meta.durationSeconds || audioMeta.durationSeconds || 0);
  }, 0);

  const firstName = user?.name ? user.name.split(" ")[0] : "Creator";

  return (
    <div className="space-y-3.5 sm:space-y-4 pb-6">
      {/* Compact Editorial Hero Stage (~145–160px on Desktop) */}
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
            </div>

            <div>
              <h1 className="text-xl sm:text-[26px] font-serif font-medium text-charcoal tracking-tight leading-tight">
                Welcome back, <span className="italic font-normal text-amber-brand">{firstName}</span>.
              </h1>
              <p className="text-xs sm:text-[13px] text-stone-grey mt-0.5 leading-normal max-w-lg font-normal">
                Your sovereign speech intelligence studio is ready. Transcribe voice privately with Faster-Whisper and generate AI insights.
              </p>
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
                onClick={() => navigate("/studio?mode=record")}
                className="shadow-2xs text-xs font-semibold px-3.5 py-1.5"
              >
                Start Recording
              </Button>

              <Button
                variant="secondary"
                size="sm"
                icon={UploadCloud}
                onClick={() => navigate("/studio?mode=upload")}
                className="bg-pure-white/90 hover:bg-pure-white border-warm-grey text-charcoal text-xs font-medium shadow-2xs px-3.5 py-1.5"
              >
                Upload Audio
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Telemetry Grid */}
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
    </div>
  );
};

export default Dashboard;
