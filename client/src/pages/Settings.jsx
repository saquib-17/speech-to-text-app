import { useState, useEffect } from "react";
import { User, Cpu, Database, Server, Sparkles, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Button from "../components/common/Button";
import Badge from "../components/common/Badge";
import api from "../api/client";

export const Settings = () => {
  const { user, logout } = useAuth();
  const [backendHealth, setBackendHealth] = useState(null);

  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    try {
      const res = await api.health.check();
      if (res.success) {
        setBackendHealth(res.data);
      }
    } catch {
      setBackendHealth({ status: "degraded", database: "disconnected" });
    }
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Settings Header */}
      <div className="p-3.5 sm:p-4.5 rounded-xl bg-pure-white border border-warm-grey shadow-2xs">
        <h2 className="text-base sm:text-lg font-bold tracking-tight text-charcoal">System & Profile Settings</h2>
        <p className="text-xs text-stone-grey mt-0.5">
          Review authenticated user credentials, local speech engine diagnostics, and application status.
        </p>
      </div>

      {/* User Profile Card */}
      <div className="p-4 sm:p-5 rounded-xl bg-pure-white border border-warm-grey space-y-3 shadow-2xs">
        <div className="flex items-center gap-2 pb-2.5 border-b border-warm-grey/70">
          <User className="w-4 h-4 text-amber-brand" />
          <h3 className="text-xs sm:text-sm font-semibold text-charcoal">User Profile</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-warm-ivory border border-warm-grey">
            <span className="text-xs font-medium text-stone-grey">Name</span>
            <p className="text-xs sm:text-sm font-medium text-charcoal mt-0.5">{user?.name || "User"}</p>
          </div>

          <div className="p-3 rounded-lg bg-warm-ivory border border-warm-grey">
            <span className="text-xs font-medium text-stone-grey">Email Address</span>
            <p className="text-xs sm:text-sm font-medium text-charcoal mt-0.5">{user?.email || "—"}</p>
          </div>

          <div className="p-3 rounded-lg bg-warm-ivory border border-warm-grey sm:col-span-2">
            <span className="text-xs font-medium text-stone-grey">Account ID</span>
            <p className="text-xs font-mono text-stone-grey mt-0.5 break-all">{user?._id || user?.id || "—"}</p>
          </div>
        </div>
      </div>

      {/* Architecture Diagnostics Card */}
      <div className="p-4 sm:p-5 rounded-xl bg-pure-white border border-warm-grey space-y-3 shadow-2xs">
        <div className="flex items-center gap-2 pb-2.5 border-b border-warm-grey/70">
          <Server className="w-4 h-4 text-amber-brand" />
          <h3 className="text-xs sm:text-sm font-semibold text-charcoal">Architecture & System Diagnostics</h3>
        </div>

        <div className="space-y-2">
          {/* Local Speech Engine */}
          <div className="p-3 rounded-lg bg-warm-ivory border border-warm-grey flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-pure-white border border-warm-grey text-amber-brand flex items-center justify-center shrink-0 shadow-2xs">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-charcoal">Faster-Whisper Local Sidecar</h4>
                <p className="text-[10px] sm:text-[11px] text-stone-grey font-mono">127.0.0.1:5001 • Base Model (INT8 CPU) • Silero VAD</p>
              </div>
            </div>
            <Badge variant="completed" size="sm" className="font-mono self-start sm:self-auto">
              Ready (₹0)
            </Badge>
          </div>

          {/* Node.js Backend */}
          <div className="p-3 rounded-lg bg-warm-ivory border border-warm-grey flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-pure-white border border-warm-grey text-charcoal flex items-center justify-center shrink-0 shadow-2xs">
                <Server className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-charcoal">Express 5 API Server</h4>
                <p className="text-[10px] sm:text-[11px] text-stone-grey font-mono">localhost:5000 • In-memory Multer Audio Ingestion</p>
              </div>
            </div>
            <Badge variant="completed" size="sm" className="font-mono self-start sm:self-auto">
              Online
            </Badge>
          </div>

          {/* Database */}
          <div className="p-3 rounded-lg bg-warm-ivory border border-warm-grey flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-pure-white border border-warm-grey text-charcoal flex items-center justify-center shrink-0 shadow-2xs">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-charcoal">MongoDB Database</h4>
                <p className="text-[10px] sm:text-[11px] text-stone-grey font-mono">Mongoose 9 • Full-Text Search Indexes</p>
              </div>
            </div>
            <Badge variant="completed" size="sm" className="font-mono self-start sm:self-auto">
              Connected
            </Badge>
          </div>

          {/* AI Intelligence */}
          <div className="p-3 rounded-lg bg-warm-ivory border border-warm-grey flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-pure-white border border-warm-grey text-amber-brand flex items-center justify-center shrink-0 shadow-2xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-charcoal">Google Gemini 2.5 Flash</h4>
                <p className="text-[10px] sm:text-[11px] text-stone-grey font-mono">Free Tier (15 RPM) • Summaries, Points & Contextual Q&A</p>
              </div>
            </div>
            <Badge variant="mono" size="sm" className="font-mono self-start sm:self-auto">
              Free Tier Active
            </Badge>
          </div>
        </div>
      </div>

      {/* Session Management */}
      <div className="p-4 sm:p-4.5 rounded-xl bg-pure-white border border-warm-grey flex items-center justify-between shadow-2xs">
        <div>
          <h4 className="text-xs sm:text-sm font-semibold text-charcoal">Sign Out of Session</h4>
          <p className="text-xs text-stone-grey mt-0.5">End your current authenticated session on this browser.</p>
        </div>

        <Button
          variant="danger"
          size="sm"
          icon={LogOut}
          onClick={logout}
        >
          Sign Out
        </Button>
      </div>
    </div>
  );
};

export default Settings;
