import { NavLink, useNavigate } from "react-router-dom";
import {
  Radio,
  Mic,
  LayoutDashboard,
  FileText,
  Sparkles,
  Settings,
  LogOut,
  Cpu,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import Badge from "../common/Badge";

export const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    {
      to: "/dashboard",
      icon: LayoutDashboard,
      label: "Dashboard",
      description: "Overview & Analytics",
    },
    {
      to: "/studio",
      icon: Mic,
      label: "Audio Studio",
      badge: "Live",
      description: "Record & Transcribe",
    },
    {
      to: "/history",
      icon: FileText,
      label: "Transcripts",
      description: "Searchable Archive",
    },
    {
      to: "/insights",
      icon: Sparkles,
      label: "AI Intelligence",
      description: "Summaries & Q&A",
    },
    {
      to: "/settings",
      icon: Settings,
      label: "Settings",
      description: "Preferences & System",
    },
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-charcoal/40 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-[275px] border-r border-[#82563B] flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        style={{
          background: "linear-gradient(180deg, #542B17 0%, #713B1E 100%)",
        }}
      >
        {/* Brand Header */}
        <div className="h-13 sm:h-14 px-4 flex items-center justify-between border-b border-[#82563B]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#3E1E0F]/90 border border-[#82563B] flex items-center justify-center text-[#FFB36B] shadow-2xs">
              <Radio className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-xs sm:text-sm tracking-tight text-[#F4E5D8]">SpeechScribe</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#3E1E0F]/80 border border-[#82563B] text-[#C6A995] font-medium">v2</span>
              </div>
              <p className="text-[10px] text-[#C6A995] font-medium">Speech Intelligence</p>
            </div>
          </div>
        </div>

        {/* Navigation List */}
        <div className="flex-1 px-2.5 py-3 space-y-1 overflow-y-auto">
          <div className="px-2.5 pb-1">
            <span className="text-[10px] font-medium uppercase tracking-wider text-[#C6A995]">Workspace</span>
          </div>

          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => {
                if (window.innerWidth < 1024) onClose();
              }}
              className={({ isActive }) =>
                `group flex items-center justify-between px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${isActive
                  ? "bg-[#C87932] text-white font-semibold shadow-xs border border-[#E89548]/30"
                  : "text-[#F4E5D8] hover:text-white hover:bg-[#754326] border border-transparent"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-2.5">
                    <item.icon
                      className={`w-4 h-4 transition-colors ${isActive ? "text-white" : "text-[#C6A995] group-hover:text-white"
                        }`}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-medium tracking-wide ${isActive
                        ? "bg-white/20 text-white border border-white/30"
                        : "bg-[#754326] text-[#FFB36B] border border-[#82563B]"
                        }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>

        {/* Local Engine Diagnostics Widget */}
        <div className="p-2.5 mx-2.5 mb-2.5 rounded-lg bg-[#5E321C]/90 border border-[#82563B] text-xs shadow-2xs">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 text-[#F4E5D8] text-xs font-semibold">
              <Cpu className="w-3.5 h-3.5 text-[#FFB36B]" />
              <span>Whisper Base</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FFB36B] animate-pulse" />
              <span className="text-[10px] text-[#FFB36B] font-mono font-semibold">INT8 Ready</span>
            </div>
          </div>
          <p className="text-xs text-[#C6A995] leading-tight font-normal">
            Local speech inference on CPU. No cloud latency.
          </p>
        </div>

        {/* User Profile Bar */}
        <div className="p-2.5 border-t border-[#82563B] bg-[#4C2614]/50 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-full bg-[#754326] border border-[#82563B] flex items-center justify-center font-bold text-xs text-[#FFB36B] shrink-0">
              {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#F4E5D8] truncate">{user?.name || "User"}</p>
              <p className="text-[10px] text-[#C6A995] truncate">{user?.email || ""}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="Sign Out"
            className="p-1 text-[#C6A995] hover:text-[#FFB36B] hover:bg-[#754326] rounded-lg transition-colors shrink-0 cursor-pointer"
            aria-label="Sign out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
