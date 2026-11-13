import { useNavigate, useLocation } from "react-router-dom";
import { Menu, Rocket, Bell, LayoutGrid } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export const Header = ({ onOpenMobileMenu }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, openAuthModal } = useAuth();

  const getPageTitle = (pathname) => {
    if (pathname.startsWith("/studio"))
      return {
        title: "Audio Studio",
        subtitle: "High-fidelity recording & local Faster-Whisper transcription",
      };
    if (pathname.startsWith("/editor"))
      return {
        title: "Transcript Editor",
        subtitle: "Interactive synchronized playback, editing & AI insights",
      };
    if (pathname.startsWith("/transcripts"))
      return {
        title: "Transcripts",
        subtitle: "Browse, filter and manage your voice transcript records",
      };
    if (pathname.startsWith("/history"))
      return {
        title: "History",
        subtitle: "Session activity, audio ingestion and processing timeline",
      };
    if (pathname.startsWith("/insights"))
      return {
        title: "AI Workspace",
        subtitle: "Executive summaries, key points & contextual transcript Q&A",
      };
    if (pathname.startsWith("/settings"))
      return {
        title: "Settings",
        subtitle: "System telemetry, local engine status & user preferences",
      };
    return {
      title: "Dashboard",
      subtitle: "Your speech workspace for recording, transcription and AI insights",
    };
  };

  const { title, subtitle } = getPageTitle(location.pathname);
  const displayName = user?.name || "Mohammed Saquib";
  const avatarLetter = (displayName || "M").charAt(0).toUpperCase();

  return (
    <header className="h-[68px] px-6 border-b border-[#EBE8F0] bg-[#FAF9FC]/90 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between shrink-0">
      {/* Left: Mobile Trigger & Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-1.5 text-[#686B7A] hover:text-[#191B2B] rounded-lg hover:bg-white transition-colors cursor-pointer"
          aria-label="Open mobile menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-white border border-[#EBE8F0] flex items-center justify-center text-[#191B2B] shadow-2xs">
            <LayoutGrid className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-[20px] sm:text-[23px] font-semibold text-[#191B2B] tracking-tight leading-tight">
              {title}
            </h1>
            <p className="text-[12px] sm:text-[13px] text-[#686B7A] hidden sm:block font-normal leading-tight">
              {subtitle}
            </p>
          </div>
        </div>
      </div>

      {/* Right: Engine Status, Launch Studio, Notifications, Avatar */}
      <div className="flex items-center gap-2.5">
        {/* Whisper Engine Status Pill */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[#EBE8F0] text-[12px] text-[#191B2B] font-medium shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-[#269B62] animate-pulse" />
          <span>Whisper Engine Online</span>
        </div>

        {/* Launch Studio Action */}
        {location.pathname !== "/studio" && (
          <button
            onClick={() => navigate("/studio")}
            className="flex items-center gap-2 h-[38px] px-4 py-1.5 rounded-full bg-[#F07800] hover:bg-[#D96B00] text-white text-[13px] font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Rocket className="w-[18px] h-[18px]" />
            <span>Launch Studio</span>
          </button>
        )}

        {/* Notification Bell */}
        <button
          onClick={() => {}}
          className="w-[38px] h-[38px] rounded-full bg-white hover:bg-[#FFF1E2] border border-[#EBE8F0] flex items-center justify-center text-[#686B7A] hover:text-[#F07800] transition-colors shadow-2xs cursor-pointer"
          aria-label="Notifications"
        >
          <Bell className="w-[18px] h-[18px]" />
        </button>

        {/* User Avatar Circle */}
        {isAuthenticated ? (
          <button
            onClick={() => navigate("/settings")}
            className="w-[38px] h-[38px] rounded-full bg-[#7138B8] text-white font-semibold text-xs flex items-center justify-center shadow-2xs cursor-pointer hover:ring-2 hover:ring-[#7138B8]/30 transition-all"
            title={displayName}
          >
            {avatarLetter}
          </button>
        ) : (
          <button
            onClick={() => openAuthModal({ mode: "login", title: "Sign In to Workspace" })}
            className="w-[38px] h-[38px] rounded-full bg-[#7138B8] text-white font-bold text-xs flex items-center justify-center shadow-2xs cursor-pointer hover:ring-2 hover:ring-[#7138B8]/30 transition-all"
            title="Sign In"
          >
            M
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
