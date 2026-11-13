import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import AuthModal from "../auth/AuthModal";
import { useAuth } from "../../context/AuthContext";

export const AppLayout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { authModalState, closeAuthModal, handleAuthModalSuccess } = useAuth();

  return (
    <div className="min-h-screen bg-[#FAF9FC] text-[#191B2B] flex flex-col antialiased selection:bg-[#F07800]/20 selection:text-[#191B2B] w-full overflow-x-hidden font-sans">
      {/* Centralized Global Auth Modal */}
      <AuthModal
        isOpen={authModalState.isOpen}
        initialMode={authModalState.mode}
        title={authModalState.title}
        subtitle={authModalState.subtitle}
        onClose={closeAuthModal}
        onSuccess={handleAuthModalSuccess}
      />

      <Sidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      <div className="flex-1 lg:pl-[245px] flex flex-col min-w-0 w-full overflow-x-hidden">
        <Header onOpenMobileMenu={() => setMobileMenuOpen(true)} />

        <main className="flex-1 px-4 sm:px-6 lg:px-6 py-4 sm:py-5 max-w-[1400px] w-full mx-auto min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
