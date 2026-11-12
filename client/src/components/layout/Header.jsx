import { useNavigate, useLocation } from "react-router-dom";
import { Menu, Mic, LogIn, UserPlus } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import Button from "../common/Button";

export const Header = ({ onOpenMobileMenu }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  const getPageTitle = (pathname) => {
    if (pathname.startsWith("/studio")) return { title: "Audio Studio", subtitle: "Real-time recording & Whisper transcription" };
    if (pathname.startsWith("/editor")) return { title: "Transcript Editor", subtitle: "Interactive reading, editing & AI insights" };
    if (pathname.startsWith("/history")) return { title: "Transcript Library", subtitle: "Search and manage audio transcriptions" };
    if (pathname.startsWith("/insights")) return { title: "AI Intelligence", subtitle: "Summaries, action points & contextual Q&A" };
    if (pathname.startsWith("/settings")) return { title: "Settings", subtitle: "System telemetry & user preferences" };
    return { title: "Dashboard", subtitle: "Speech workspace & sovereign transcription" };
  };

  const { title, subtitle } = getPageTitle(location.pathname);

  return (
    <header className="h-13 sm:h-14 px-3.5 sm:px-6 border-b border-warm-grey bg-warm-ivory/90 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between">
      {/* Left: Mobile Trigger & Title */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-1.5 text-stone-grey hover:text-charcoal rounded-lg hover:bg-pure-white transition-colors cursor-pointer"
          aria-label="Open mobile menu"
        >
          <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        <div>
          <h1 className="text-sm sm:text-base font-semibold text-charcoal tracking-tight leading-tight">{title}</h1>
          <p className="text-xs text-stone-grey hidden sm:block">{subtitle}</p>
        </div>
      </div>

      {/* Right: Studio Action & Status / Guest Quick Links */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-pure-white border border-warm-grey text-xs text-stone-grey font-medium shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-brand animate-pulse" />
          <span>Whisper Engine Online</span>
        </div>

        {isAuthenticated ? (
          location.pathname !== "/studio" && (
            <Button
              size="sm"
              variant="primary"
              icon={Mic}
              onClick={() => navigate("/studio")}
              className="text-xs font-semibold shadow-xs"
            >
              Launch Studio
            </Button>
          )
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/login")}
              className="px-2.5 py-1.5 text-xs font-semibold text-charcoal hover:text-amber-brand bg-pure-white hover:bg-warm-ivory border border-warm-grey rounded-lg shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5 text-amber-brand" />
              <span>Sign In</span>
            </button>
            <button
              onClick={() => navigate("/register")}
              className="px-2.5 py-1.5 text-xs font-semibold text-white bg-amber-brand hover:bg-amber-brand-hover rounded-lg shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Get Started</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
