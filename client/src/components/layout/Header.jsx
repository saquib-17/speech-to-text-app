import { useNavigate, useLocation } from "react-router-dom";
import { Menu, Mic } from "lucide-react";
import Button from "../common/Button";

export const Header = ({ onOpenMobileMenu }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const getPageTitle = (pathname) => {
    if (pathname.startsWith("/studio")) return { title: "Audio Studio", subtitle: "Real-time recording & Whisper transcription" };
    if (pathname.startsWith("/editor")) return { title: "Transcript Editor", subtitle: "Interactive reading, editing & AI insights" };
    if (pathname.startsWith("/history")) return { title: "Transcript Library", subtitle: "Search and manage audio transcriptions" };
    if (pathname.startsWith("/insights")) return { title: "AI Intelligence", subtitle: "Summaries, action points & contextual Q&A" };
    if (pathname.startsWith("/settings")) return { title: "Settings", subtitle: "System telemetry & user preferences" };
    return { title: "Dashboard", subtitle: "Audio workspace & transcription activity" };
  };

  const { title, subtitle } = getPageTitle(location.pathname);

  return (
    <header className="h-13 sm:h-14 px-3.5 sm:px-6 border-b border-warm-grey bg-warm-ivory/90 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between">
      {/* Left: Mobile Trigger & Title */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-1.5 text-stone-grey hover:text-charcoal rounded-lg hover:bg-pure-white transition-colors"
          aria-label="Open mobile menu"
        >
          <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        <div>
          <h1 className="text-sm sm:text-base font-semibold text-charcoal tracking-tight leading-tight">{title}</h1>
          <p className="text-xs text-stone-grey hidden sm:block">{subtitle}</p>
        </div>
      </div>

      {/* Right: Studio Action & Status */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-pure-white border border-warm-grey text-xs text-stone-grey font-medium shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-brand animate-pulse" />
          <span>Whisper Engine Online</span>
        </div>

        {location.pathname !== "/studio" && (
          <Button
            size="sm"
            variant="primary"
            icon={Mic}
            onClick={() => navigate("/studio")}
            className="text-xs font-semibold shadow-xs"
          >
            Launch Studio
          </Button>
        )}
      </div>
    </header>
  );
};

export default Header;
