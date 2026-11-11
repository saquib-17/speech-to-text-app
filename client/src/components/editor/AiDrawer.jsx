import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  X,
  FileText,
  HelpCircle,
  Send,
  CheckCircle2,
  ListOrdered,
} from "lucide-react";
import Button from "../common/Button";
import AiQuotaBanner from "../common/AiQuotaBanner";
import api from "../../api/client";
import { useToast } from "../../context/ToastContext";
import {
  getQuotaCooldown,
  recordQuotaCooldown,
  QUOTA_EVENT_NAME,
} from "../../utils/aiQuota";

export const AiDrawer = ({ isOpen, onClose, transcript, onUpdateTranscript }) => {
  const [activeTab, setActiveTab] = useState("summary"); // summary | qa
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isAsking, setIsAsking] = useState(false);
  const [question, setQuestion] = useState("");
  const [qaHistory, setQaHistory] = useState([]);
  const [quotaState, setQuotaState] = useState(getQuotaCooldown());

  const toast = useToast();

  // Sync quota status with server and local storage on drawer open
  useEffect(() => {
    if (isOpen) {
      setQuotaState(getQuotaCooldown());

      api.ai
        .getQuota()
        .then((res) => {
          if (res.data?.isCooldownActive) {
            recordQuotaCooldown({
              retryAfter: res.data.retryAfter,
              retryAt: res.data.retryAt,
              message: res.data.message,
            });
          }
        })
        .catch(() => {
          // Graceful fallback if offline
        });
    }
  }, [isOpen]);

  // Real-time countdown tick & cross-tab / cross-component quota event listener
  useEffect(() => {
    const handleQuotaEvent = (e) => {
      setQuotaState(e.detail || getQuotaCooldown());
    };

    window.addEventListener(QUOTA_EVENT_NAME, handleQuotaEvent);

    let interval = null;
    if (quotaState.isCooldownActive) {
      interval = setInterval(() => {
        const current = getQuotaCooldown();
        setQuotaState(current);
        if (!current.isCooldownActive && interval) {
          clearInterval(interval);
        }
      }, 1000);
    }

    return () => {
      window.removeEventListener(QUOTA_EVENT_NAME, handleQuotaEvent);
      if (interval) clearInterval(interval);
    };
  }, [quotaState.isCooldownActive]);

  if (!transcript) return null;

  const insights = transcript.aiInsights || {};
  const hasInsights = Boolean(insights.summary);

  // Generate or refresh summary
  const handleGenerateSummary = async () => {
    if (quotaState.isCooldownActive) {
      toast.error(
        quotaState.message ||
          "Daily Gemini AI limit reached (20 requests/day). Please wait for the quota cooldown."
      );
      return;
    }

    setIsSummarizing(true);
    try {
      const res = await api.ai.summarize(transcript._id);
      if (res.success && res.data) {
        toast.success("AI insights generated successfully!");
        if (onUpdateTranscript) {
          onUpdateTranscript({
            ...transcript,
            aiInsights: res.data,
          });
        }
      }
    } catch (err) {
      if (err.status === 429 || err.data?.isQuotaExceeded) {
        recordQuotaCooldown({
          retryAfter: err.data?.retryAfter,
          retryAt: err.data?.retryAt,
          message: err.message,
        });
        toast.error(
          err.message ||
            "Daily AI request limit reached (20 requests/day). AI features will resume once the quota resets."
        );
      } else {
        toast.error(err.message || "Failed to generate AI summary.");
      }
    } finally {
      setIsSummarizing(false);
    }
  };

  // Ask question
  const handleAskQuestion = async (e) => {
    e?.preventDefault();
    if (!question.trim() || isAsking) return;

    if (quotaState.isCooldownActive) {
      toast.error(
        quotaState.message ||
          "Daily Gemini AI limit reached (20 requests/day). Please wait for the quota cooldown."
      );
      return;
    }

    const currentQuestion = question.trim();
    setQuestion("");
    setIsAsking(true);

    try {
      const res = await api.ai.ask(transcript._id, currentQuestion);
      if (res.success && res.data) {
        setQaHistory((prev) => [
          ...prev,
          {
            question: res.data.question,
            answer: res.data.answer,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      }
    } catch (err) {
      if (err.status === 429 || err.data?.isQuotaExceeded) {
        recordQuotaCooldown({
          retryAfter: err.data?.retryAfter,
          retryAt: err.data?.retryAt,
          message: err.message,
        });
        toast.error(
          err.message ||
            "Daily AI request limit reached (20 requests/day). AI features will resume once the quota resets."
        );
      } else {
        toast.error(err.message || "Failed to answer question.");
      }
    } finally {
      setIsAsking(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-charcoal/40 backdrop-blur-xs z-40 lg:bg-transparent lg:pointer-events-none"
          />

          {/* Drawer container (Compact) */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 z-50 w-full sm:w-[420px] bg-pure-white border-l border-warm-grey shadow-2xl flex flex-col text-charcoal"
          >
            {/* Drawer Header */}
            <div className="h-13 sm:h-14 px-4 border-b border-warm-grey flex items-center justify-between bg-warm-ivory">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-brand-light border border-amber-brand/20 flex items-center justify-center text-amber-brand shadow-2xs">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-semibold text-charcoal">AI Intelligence</h3>
                  <p className="text-[10px] text-stone-grey">Gemini 3.8 Flash Free Tier (20/day)</p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-1 text-stone-grey hover:text-charcoal rounded-lg hover:bg-pure-white transition-colors"
                aria-label="Close AI panel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tab navigation */}
            <div className="px-4 pt-2.5 pb-2 border-b border-warm-grey/60 flex gap-1.5 bg-pure-white">
              <button
                onClick={() => setActiveTab("summary")}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === "summary"
                    ? "bg-amber-brand text-pure-white shadow-2xs"
                    : "text-stone-grey hover:text-charcoal hover:bg-warm-ivory"
                }`}
              >
                <FileText className="w-3 h-3" />
                <span>Executive Summary</span>
              </button>

              <button
                onClick={() => setActiveTab("qa")}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === "qa"
                    ? "bg-amber-brand text-pure-white shadow-2xs"
                    : "text-stone-grey hover:text-charcoal hover:bg-warm-ivory"
                }`}
              >
                <HelpCircle className="w-3 h-3" />
                <span>Ask Questions</span>
                {qaHistory.length > 0 && (
                  <span className="w-3.5 h-3.5 rounded-full bg-pure-white text-amber-brand text-[9px] font-bold flex items-center justify-center ml-0.5">
                    {qaHistory.length}
                  </span>
                )}
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-4">
              {/* Daily Quota Cooldown Banner */}
              {quotaState.isCooldownActive && (
                <AiQuotaBanner quotaState={quotaState} className="mb-3" />
              )}

              {activeTab === "summary" && (
                <>
                  {!hasInsights ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <div className="w-10 h-10 rounded-xl bg-amber-brand-light border border-amber-brand/20 flex items-center justify-center text-amber-brand mb-2.5 shadow-2xs">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <h4 className="text-xs sm:text-sm font-semibold text-charcoal">No AI Insights Generated</h4>
                      <p className="text-[11px] text-stone-grey max-w-xs mt-0.5 mb-4 leading-normal">
                        Generate an executive summary, key takeaways, and action items from this transcript with one click.
                      </p>
                      <Button
                        variant="primary"
                        size="sm"
                        icon={Sparkles}
                        isLoading={isSummarizing}
                        disabled={quotaState.isCooldownActive}
                        onClick={handleGenerateSummary}
                      >
                        {quotaState.isCooldownActive ? "Quota Limit Active" : "Generate Insights"}
                      </Button>
                      {quotaState.isCooldownActive && (
                        <p className="text-[10px] text-stone-grey mt-2">
                          Daily 20 requests limit reached. Re-enables after reset.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Summary Block */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-stone-grey flex items-center gap-1">
                            <FileText className="w-3 h-3 text-amber-brand" />
                            Executive Summary
                          </h4>
                          <button
                            onClick={handleGenerateSummary}
                            disabled={isSummarizing || quotaState.isCooldownActive}
                            className={`text-[10px] font-semibold transition-colors ${
                              quotaState.isCooldownActive
                                ? "text-stone-grey/50 cursor-not-allowed"
                                : "text-amber-brand hover:text-amber-brand-hover cursor-pointer"
                            }`}
                          >
                            {isSummarizing
                              ? "Regenerating..."
                              : quotaState.isCooldownActive
                              ? "Quota limit active"
                              : "Regenerate"}
                          </button>
                        </div>
                        <div className="p-3 rounded-lg bg-warm-ivory border border-warm-grey text-xs sm:text-sm text-charcoal leading-relaxed whitespace-pre-wrap">
                          {insights.summary}
                        </div>
                      </div>

                      {/* Key Points */}
                      {insights.keyPoints && insights.keyPoints.length > 0 && (
                        <div>
                          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-stone-grey flex items-center gap-1 mb-1.5">
                            <CheckCircle2 className="w-3 h-3 text-amber-brand" />
                            Key Takeaways
                          </h4>
                          <ul className="space-y-1.5">
                            {insights.keyPoints.map((point, idx) => (
                              <li
                                key={idx}
                                className="p-2.5 rounded-lg bg-warm-ivory/60 border border-warm-grey/70 text-xs text-charcoal flex items-start gap-2"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-brand mt-1.5 shrink-0" />
                                <span>{point}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Action Items */}
                      {insights.actionItems && insights.actionItems.length > 0 && (
                        <div>
                          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-stone-grey flex items-center gap-1 mb-1.5">
                            <ListOrdered className="w-3 h-3 text-amber-soft" />
                            Action Items
                          </h4>
                          <ul className="space-y-1.5">
                            {insights.actionItems.map((item, idx) => (
                              <li
                                key={idx}
                                className="p-2.5 rounded-lg bg-warm-ivory/60 border border-warm-grey/70 text-xs text-charcoal flex items-start gap-2"
                              >
                                <span className="w-4 h-4 rounded-full bg-amber-soft-light text-amber-soft border border-amber-soft/30 text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                                  {idx + 1}
                                </span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {activeTab === "qa" && (
                <div className="flex flex-col h-full space-y-3">
                  <div className="flex-1 space-y-3 overflow-y-auto">
                    {qaHistory.length === 0 ? (
                      <div className="py-8 text-center">
                        <HelpCircle className="w-8 h-8 text-stone-grey/40 mx-auto mb-2" />
                        <h4 className="text-xs sm:text-sm font-semibold text-charcoal">Ask anything about this audio</h4>
                        <p className="text-[11px] text-stone-grey max-w-xs mx-auto mt-0.5">
                          AI answers are strictly grounded in this transcript text.
                        </p>
                      </div>
                    ) : (
                      qaHistory.map((item, idx) => (
                        <div key={idx} className="space-y-2">
                          {/* User question */}
                          <div className="p-2.5 rounded-lg bg-amber-brand-light border border-amber-brand/20 text-xs text-charcoal">
                            <span className="text-[10px] font-mono text-amber-brand block mb-0.5">QUESTION</span>
                            {item.question}
                          </div>

                          {/* AI answer */}
                          <div className="p-3 rounded-lg bg-warm-ivory border border-warm-grey text-xs sm:text-sm text-charcoal leading-relaxed">
                            <span className="text-[10px] font-mono text-stone-grey block mb-1">
                              SPEECHSCRIBE AI • {item.timestamp}
                            </span>
                            {item.answer}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Ask Question Input Form */}
                  <form onSubmit={handleAskQuestion} className="pt-2 border-t border-warm-grey/70">
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        placeholder={
                          quotaState.isCooldownActive
                            ? "Daily AI quota limit active. Cooldown in progress..."
                            : "Ask about this transcript..."
                        }
                        disabled={isAsking || quotaState.isCooldownActive}
                        className={`flex-1 bg-pure-white border rounded-lg px-3 py-1.5 text-xs text-charcoal placeholder:text-stone-grey focus:outline-none focus:border-amber-brand ${
                          quotaState.isCooldownActive
                            ? "border-amber-brand/40 bg-amber-brand-light/30 cursor-not-allowed"
                            : "border-warm-grey"
                        }`}
                      />
                      <Button
                        type="submit"
                        size="sm"
                        variant="primary"
                        isLoading={isAsking}
                        disabled={!question.trim() || isAsking || quotaState.isCooldownActive}
                        icon={Send}
                      >
                        Ask
                      </Button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AiDrawer;
