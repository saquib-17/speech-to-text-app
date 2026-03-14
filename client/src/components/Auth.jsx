import { useState } from "react";
import { supabase } from "../supabaseClient";
import { LogIn, UserPlus, Mail, Lock, ShieldCheck, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState(null);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage({ type: "success", text: "Check your email for confirmation!" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto p-8 rounded-3xl bg-slate-900/60 border border-white/5 shadow-2xl">
      <div className="flex flex-col items-center mb-10">
        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg">
          <ShieldCheck size={28} />
        </div>
        <h2 className="text-2xl font-black text-white uppercase tracking-tight">
          {isSignUp ? "Identity Registration" : "Security Access"}
        </h2>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mt-2">
          {isSignUp ? "Initialize neural signature" : "Validate user credentials"}
        </p>
      </div>

      <form onSubmit={handleAuth} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Network Identity</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input
              id="email"
              type="email"
              placeholder="email@provider.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-800/50 border border-white/5 rounded-xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-colors"
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Access Cipher</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-800/50 border border-white/5 rounded-xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-colors"
              required
            />
          </div>
        </div>

        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`p-3 rounded-xl border text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${
                message.type === "error" 
                  ? "bg-rose-500/10 border-rose-500/20 text-rose-400" 
                  : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              }`}
            >
              {message.text}
            </motion.div>
          )}
        </AnimatePresence>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-4 text-xs font-black uppercase tracking-[0.2em] mt-4"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              {isSignUp ? <UserPlus size={16} /> : <LogIn size={16} />}
              {isSignUp ? "Initialize" : "Establish Link"}
            </>
          )}
        </button>
      </form>

      <div className="mt-8 pt-8 border-t border-white/5 text-center">
        <button
          onClick={() => setIsSignUp(!isSignUp)}
          className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-400 transition-colors"
        >
          {isSignUp ? "Existing operative? Authenticate here" : "New identity? Initialize registration"}
        </button>
      </div>
    </div>
  );
}

export default Auth;
