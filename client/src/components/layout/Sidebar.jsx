import { NavLink } from "react-router-dom";
import {
  Mic,
  LayoutDashboard,
  FileText,
  Sparkles,
  Clock,
  Settings,
  LogOut,
  Crown,
  ChevronDown,
  LogIn,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export const Sidebar = ({ isOpen, onClose }) => {
  const { user, isAuthenticated, logout, openAuthModal } = useAuth();

  const navItems = [
    {
      to: "/dashboard",
      icon: LayoutDashboard,
      label: "Dashboard",
    },
    {
      to: "/studio",
      icon: Mic,
      label: "Audio Studio",
      badge: "Live",
    },
    {
      to: "/transcripts",
      icon: FileText,
      label: "Transcripts",
    },
    {
      to: "/insights",
      icon: Sparkles,
      label: "AI Workspace",
    },
    {
      to: "/history",
      icon: Clock,
      label: "History",
    },
    {
      to: "/settings",
      icon: Settings,
      label: "Settings",
    },
  ];

  const handleLogout = () => {
    logout();
  };

  const displayName = user?.name || "Mohammed Saquib";
  const displayEmail = user?.email || "mohammedsaquibansari82@gmail.com";
  const avatarLetter = (displayName || "M").charAt(0).toUpperCase();

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-[#172341]/70 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-[245px] border-r border-[#303D5D] flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        style={{
          backgroundColor: "#172341",
        }}
      >
        {/* Brand Header: 72px Target */}
        <div className="h-[72px] px-4 flex items-center justify-between border-b border-[#303D5D] shrink-0">
          <div className="flex items-center gap-2.5">
            {/* Orange Circular Soundwave Icon */}
            <div className="w-8 h-8 rounded-full bg-[#F07800] text-white flex items-center justify-center shrink-0 shadow-xs">
              <div className="flex items-end gap-0.5 h-4 py-0.5">
                <span className="w-0.5 h-2 rounded-full bg-white" />
                <span className="w-0.5 h-3.5 rounded-full bg-white" />
                <span className="w-0.5 h-4 rounded-full bg-white" />
                <span className="w-0.5 h-2.5 rounded-full bg-white" />
                <span className="w-0.5 h-3.5 rounded-full bg-white" />
                <span className="w-0.5 h-1.5 rounded-full bg-white" />
              </div>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-[14px] tracking-tight text-white">SpeechScribe AI</span>
                <span className="text-[10px] font-mono px-1 py-0.5 rounded-md bg-[#202D50] text-[#8E99B4] font-semibold border border-[#303D5D]">
                  v2
                </span>
              </div>
              <p className="text-[11px] text-[#8E99B4] font-normal leading-tight">Speech to Text & AI</p>
            </div>
          </div>
        </div>

        {/* Navigation List: 40px item height, 14px font, 18px icons, compact gap */}
        <div className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.label + item.to}
              to={item.to}
              onClick={() => {
                if (window.innerWidth < 1024) onClose();
              }}
              className={({ isActive }) =>
                `group flex items-center justify-between h-[40px] px-3 rounded-xl text-[14px] font-medium transition-all ${isActive
                  ? "bg-[#FFF9F3] text-[#191B2B] shadow-xs font-semibold"
                  : "text-[#F1F4FA] hover:text-white hover:bg-[#202D50]"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-2.5">
                    <item.icon
                      className={`w-[18px] h-[18px] transition-colors shrink-0 ${isActive ? "text-[#191B2B]" : "text-[#8E99B4] group-hover:text-white"
                        }`}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide bg-[#F07800] text-white shadow-2xs">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>

        {/* Decorative Waveform graphic */}
        <div className="relative px-2 py-0.5 pointer-events-none overflow-hidden shrink-0">
          <svg viewBox="0 0 245 28" className="w-full h-5 fill-current">
            <path
              d="M0 18 Q 45 6, 90 18 T 175 18 T 245 18 V 28 H 0 Z"
              fill="#204595"
              opacity="0.45"
            />
            <path
              d="M0 22 Q 50 10, 110 20 T 195 18 T 245 20 V 28 H 0 Z"
              fill="#F07800"
              opacity="0.9"
            />
          </svg>
        </div>

        {/* Plan / Quota Card: Compact Height */}
        <div className="p-2.5 mx-2.5 mb-2 rounded-xl bg-[#202D50] border border-[#303D5D] text-[11px] shadow-2xs shrink-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5 text-white text-[11px] font-semibold">
              <Crown className="w-3.5 h-3.5 text-[#F07800]" />
              <span>Free Plan</span>
            </div>
            <span className="text-[10px] text-[#8E99B4]">20 req/day</span>
          </div>

          <div className="w-full h-1 bg-[#172341] rounded-full overflow-hidden mt-1 mb-1">
            <div className="h-full bg-[#F07800] rounded-full w-[70%]" />
          </div>

          <div className="flex items-center justify-end text-[10px] text-[#8E99B4] font-mono">
            <span>14 / 20 used</span>
          </div>
        </div>

        {/* User Profile Bar: Compact Height */}
        {isAuthenticated ? (
          <div className="py-2 px-3 border-t border-[#303D5D] bg-[#172341] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-full bg-[#7138B8] border border-[#9B6BD0]/30 flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-2xs">
                {avatarLetter}
              </div>
              <div className="min-w-0">
                <p className="text-[12px] font-medium text-white truncate">{displayName}</p>
                <p className="text-[10px] text-[#8E99B4] truncate">{displayEmail}</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleLogout}
                title="Sign Out"
                className="p-1 text-[#8E99B4] hover:text-[#F07800] hover:bg-[#202D50] rounded-md transition-colors shrink-0 cursor-pointer"
                aria-label="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="py-2 px-3 border-t border-[#303D5D] bg-[#172341] flex items-center justify-between shrink-0">
            <div
              onClick={() => openAuthModal({ mode: "login", title: "Sign In to Workspace" })}
              className="flex items-center gap-2 min-w-0 cursor-pointer group flex-1 mr-2"
            >
              <div className="w-7 h-7 rounded-full bg-[#7138B8] flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-2xs">
                M
              </div>
              <div className="min-w-0">
                <p className="text-[12px] font-medium text-white group-hover:text-[#F07800] transition-colors truncate">Guest User</p>
                <p className="text-[10px] text-[#8E99B4] truncate">Sign in to sync data</p>
              </div>
            </div>

            <button
              onClick={() => {
                if (window.innerWidth < 1024) onClose();
                openAuthModal({ mode: "login", title: "Sign In to Workspace" });
              }}
              title="Sign In"
              className="p-1 text-[#8E99B4] hover:text-white hover:bg-[#202D50] rounded-md transition-colors shrink-0 cursor-pointer"
              aria-label="Sign in"
            >
              <LogIn className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;
