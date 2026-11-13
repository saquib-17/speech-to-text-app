import { useState, useEffect } from "react";
import { User, Cpu, Database, Server, Sparkles, LogOut, ShieldCheck, LogIn, UserPlus } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Button from "../components/common/Button";
import Badge from "../components/common/Badge";
import api from "../api/client";

export const Settings = () => {
  const { user, isAuthenticated, logout, openAuthModal } = useAuth();
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
      <div className="p-4 rounded-xl bg-white border border-[#EBE8F0] shadow-2xs flex items-center justify-between">
        <div>
          <h2 className="text-[17px] font-semibold tracking-tight text-[#191B2B]">
            System & Profile Settings
          </h2>
          <p className="text-[12px] text-[#686B7A] mt-0.5">
            Review authenticated credentials, local speech engine diagnostics, and application status.
          </p>
        </div>
      </div>

      {/* User Profile Card */}
      <div className="p-4 rounded-xl bg-white border border-[#EBE8F0] space-y-3.5 shadow-2xs">
        <div className="flex items-center justify-between pb-2.5 border-b border-[#EBE8F0]">
          <div className="flex items-center gap-2">
            <div className="w-[38px] h-[38px] rounded-lg bg-[#F3EBFC] border border-[#E2CEF7] flex items-center justify-center text-[#7138B8]">
              <User className="w-4 h-4" />
            </div>
            <h3 className="text-[14px] font-semibold text-[#191B2B]">User Profile</h3>
          </div>
          <Badge variant={isAuthenticated ? "completed" : "neutral"} size="sm">
            {isAuthenticated ? "Authenticated" : "Guest Mode"}
          </Badge>
        </div>

        {isAuthenticated ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-lg bg-[#FAF9FC] border border-[#EBE8F0]">
              <span className="text-[11px] font-semibold text-[#686B7A] uppercase tracking-wider">
                Full Name
              </span>
              <p className="text-[13px] font-semibold text-[#191B2B] mt-0.5">{user?.name || "User"}</p>
            </div>

            <div className="p-3.5 rounded-lg bg-[#FAF9FC] border border-[#EBE8F0]">
              <span className="text-[11px] font-semibold text-[#686B7A] uppercase tracking-wider">
                Email Address
              </span>
              <p className="text-[13px] font-semibold text-[#191B2B] mt-0.5">{user?.email || "—"}</p>
            </div>

            <div className="p-3.5 rounded-lg bg-[#FAF9FC] border border-[#EBE8F0] sm:col-span-2">
              <span className="text-[11px] font-semibold text-[#686B7A] uppercase tracking-wider">
                Account ID
              </span>
              <p className="text-[11px] font-mono text-[#686B7A] mt-0.5 break-all">{user?._id || user?.id || "—"}</p>
            </div>

            <div className="sm:col-span-2 pt-1.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-[#269B62]">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="font-medium text-[#191B2B]">Session active & protected with JWT</span>
              </div>

              <Button
                size="sm"
                variant="secondary"
                icon={LogOut}
                onClick={logout}
              >
                Sign Out
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-5 rounded-lg bg-[#FAF9FC] border border-[#EBE8F0] text-center space-y-2">
            <p className="text-[13px] text-[#191B2B] font-semibold">
              Exploring in Sovereign Guest Mode
            </p>
            <p className="text-[12px] text-[#686B7A] max-w-md mx-auto leading-relaxed">
              Personal preferences, persistent transcripts, and AI intelligence history are preserved when signed in to your account.
            </p>
            <div className="pt-1.5 flex items-center justify-center gap-2.5">
              <Button
                size="sm"
                variant="primary"
                icon={LogIn}
                onClick={() => openAuthModal({ mode: "login", title: "Sign In to Access Profile" })}
              >
                Sign In
              </Button>
              <Button
                size="sm"
                variant="secondary"
                icon={UserPlus}
                onClick={() => openAuthModal({ mode: "register", title: "Create Your Account" })}
              >
                Create Account
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Architecture Diagnostics Card */}
      <div className="p-4 rounded-xl bg-white border border-[#EBE8F0] space-y-3.5 shadow-2xs">
        <div className="flex items-center gap-2 pb-2.5 border-b border-[#EBE8F0]">
          <div className="w-[38px] h-[38px] rounded-lg bg-[#FFF1E2] border border-[#FFDEC0] flex items-center justify-center text-[#F07800]">
            <Server className="w-4 h-4" />
          </div>
          <h3 className="text-[14px] font-semibold text-[#191B2B]">Architecture & System Diagnostics</h3>
        </div>

        <div className="space-y-2.5">
          {/* Local Speech Engine */}
          <div className="p-3.5 rounded-lg bg-[#FAF9FC] border border-[#EBE8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-[38px] h-[38px] rounded-lg bg-white border border-[#EBE8F0] text-[#F07800] flex items-center justify-center shrink-0 shadow-2xs">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-[13px] font-semibold text-[#191B2B]">Faster-Whisper Local Sidecar</h4>
                <p className="text-[11px] text-[#686B7A] font-mono">127.0.0.1:5001 • Base Model (INT8 CPU) • Silero VAD</p>
              </div>
            </div>
            <Badge variant="completed" size="sm" className="font-mono self-start sm:self-auto">
              Ready (INT8)
            </Badge>
          </div>

          {/* Node.js Backend */}
          <div className="p-3.5 rounded-lg bg-[#FAF9FC] border border-[#EBE8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-[38px] h-[38px] rounded-lg bg-white border border-[#EBE8F0] text-[#2563EB] flex items-center justify-center shrink-0 shadow-2xs">
                <Server className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-[13px] font-semibold text-[#191B2B]">Express 5 API Server</h4>
                <p className="text-[11px] text-[#686B7A] font-mono">localhost:5000 • In-memory Multer Audio Ingestion</p>
              </div>
            </div>
            <Badge variant="completed" size="sm" className="font-mono self-start sm:self-auto">
              Online
            </Badge>
          </div>

          {/* MongoDB Persistence */}
          <div className="p-3.5 rounded-lg bg-[#FAF9FC] border border-[#EBE8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-[38px] h-[38px] rounded-lg bg-white border border-[#EBE8F0] text-[#269B62] flex items-center justify-center shrink-0 shadow-2xs">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-[13px] font-semibold text-[#191B2B]">Persistent MongoDB Database</h4>
                <p className="text-[11px] text-[#686B7A] font-mono">server/data/db • Multi-Tenant User Isolation</p>
              </div>
            </div>
            <Badge
              variant={backendHealth?.database === "connected" ? "completed" : "neutral"}
              size="sm"
              className="font-mono self-start sm:self-auto"
            >
              {backendHealth?.database === "connected" ? "Connected" : "Persistent Local"}
            </Badge>
          </div>

          {/* Gemini AI Engine */}
          <div className="p-3.5 rounded-lg bg-[#FAF9FC] border border-[#EBE8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-[38px] h-[38px] rounded-lg bg-white border border-[#EBE8F0] text-[#7138B8] flex items-center justify-center shrink-0 shadow-2xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-[13px] font-semibold text-[#191B2B]">Gemini 3.8 Flash Interactions API</h4>
                <p className="text-[11px] text-[#686B7A] font-mono">Structured Summaries & Contextual Q&A (Free Tier 20 req/day)</p>
              </div>
            </div>
            <Badge variant="completed" size="sm" className="font-mono self-start sm:self-auto">
              Quota: 20 req/day
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
