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
  AlertCircle,
  RefreshCw,
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
  const [summaryError, setSummaryError] = useState(null);
  const [question, setQuestion] = useState("");
  const [qaHistory, setQaHistory] = useState([]);
  const [quotaState, setQuotaState] = useState(getQuotaCooldown());

  const toast = useToast();

  // Sync quota status with server and local storage on drawer open
  useEffect(() => {
    if (isOpen) {
      setQuotaState(getQuotaCooldown());
      setSummaryError(null);

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

  // Generate or refresh summary with duplicate guard & smart error recovery
  const handleGenerateSummary = async () => {
    // Prevent accidental duplicate submissions
    if (isSummarizing) return;

    if (quotaState.isCooldownActive) {
      toast.error(
        quotaState.message ||
          "Daily Gemini AI limit reached (20 requests/day). Please wait for the quota cooldown."
      );
      return;
    }

    setIsSummarizing(true);
    setSummaryError(null);

    try {
      const res = await api.ai.summarize(transcript._id);
      if (res.success && res.data) {
        toast.success("AI insights generated successfully!");
        setSummaryError(null);
        if (onUpdateTranscript) {
          onUpdateTranscript({
            ...transcript,
            aiInsights: res.data,
          });
        }
      }
    } catch (err) {
      // 1. Quota Exhaustion (429)
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
      }
      // 2. High Demand / Temporary Overload / Timeout (503 / 504)
      else if (err.status === 503 || err.status === 504 || err.message?.includes("high demand") || err.message?.includes("timed out")) {
        const friendlyMsg =
          "AI insights are temporarily unavailable. Your transcript is safe and saved. Please try again shortly.";
        setSummaryError(friendlyMsg);
        toast.error(friendlyMsg);
      }
      // 3. General error
      else {
        const genericMsg = err.message || "Failed to generate AI summary.";
        setSummaryError(genericMsg);
        toast.error(genericMsg);
      }
    } finally {
      setIsSummarizing(false);
    }
  };

  // Ask question with duplicate submission guard & retry ability
  const handleAskQuestion = async (e, retryQuestionText = null) => {
    e?.preventDefault();
    const query = (retryQuestionText || question).trim();
    if (!query || isAsking) return;

    if (quotaState.isCooldownActive) {
      toast.error(
        quotaState.message ||
          "Daily Gemini AI limit reached (20 requests/day). Please wait for the quota cooldown."
      );
      return;
    }

    if (!retryQuestionText) {
      setQuestion("");
    }
    setIsAsking(true);

    // If retrying, mark previous entry as loading again, otherwise add new entry
    if (retryQuestionText) {
      setQaHistory((prev) =>
        prev.map((item) =>
          item.question === retryQuestionText
            ? { ...item, loading: true, error: null }
            : item
        )
      );
    } else {
      setQaHistory((prev) => [
        ...prev,
        {
          question: query,
          answer: null,
          loading: true,
          error: null,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }

    try {
      const res = await api.ai.ask(transcript._id, query);
      if (res.success && res.data) {
        setQaHistory((prev) =>
          prev.map((item) =>
            item.question === query
              ? {
                  ...item,
                  answer: res.data.answer,
                  loading: false,
                  error: null,
                }
              : item
          )
        );
      }
    } catch (err) {
      let errorMsg;
      if (err.status === 429 || err.data?.isQuotaExceeded) {
        recordQuotaCooldown({
          retryAfter: err.data?.retryAfter,
          retryAt: err.data?.retryAt,
          message: err.message,
        });
        errorMsg = err.message || "Daily AI request limit reached. Please wait for cooldown.";
      } else if (err.status === 503 || err.status === 504 || err.message?.includes("high demand") || err.message?.includes("busy")) {
        errorMsg = "AI service is temporarily busy. Your transcript is safe and saved. Please retry your question.";
      } else {
        errorMsg = err.message || "Failed to answer question. Please try again.";
      }

      setQaHistory((prev) =>
        prev.map((item) =>
          item.question === query
            ? {
                ...item,
                loading: false,
                error: errorMsg,
              }
            : item
        )
      );
      toast.error(errorMsg);
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
            className="fixed inset-0 bg-[#172341]/60 backdrop-blur-xs z-40 lg:bg-transparent lg:pointer-events-none"
          />

          {/* Drawer container */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 z-50 w-full sm:w-[400px] bg-white border-l border-[#EBE8F0] shadow-2xl flex flex-col text-[#191B2B]"
          >
            {/* Drawer Header */}
            <div className="h-14 px-4 border-b border-[#EBE8F0] flex items-center justify-between bg-[#FAF9FC]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#F3EBFC] border border-[#7138B8]/20 flex items-center justify-center text-[#7138B8] shadow-2xs">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="text-[14px] font-semibold text-[#191B2B]">AI Intelligence</h3>
                  <p className="text-[10px] text-[#686B7A]">Gemini Free Tier (20/day)</p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-1 text-[#686B7A] hover:text-[#191B2B] rounded-lg hover:bg-white transition-colors cursor-pointer"
                aria-label="Close AI panel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tab navigation */}
            <div className="px-3.5 pt-2.5 pb-2 border-b border-[#EBE8F0] flex gap-1.5 bg-white">
              <button
                onClick={() => setActiveTab("summary")}
                className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === "summary"
                    ? "bg-[#7138B8] text-white shadow-xs"
                    : "text-[#686B7A] hover:text-[#191B2B] hover:bg-[#FAF9FC]"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Executive Summary</span>
              </button>

              <button
                onClick={() => setActiveTab("qa")}
                className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === "qa"
                    ? "bg-[#7138B8] text-white shadow-xs"
                    : "text-[#686B7A] hover:text-[#191B2B] hover:bg-[#FAF9FC]"
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Ask Questions</span>
                {qaHistory.length > 0 && (
                  <span className="w-3.5 h-3.5 rounded-full bg-white text-[#7138B8] text-[9px] font-bold flex items-center justify-center ml-0.5">
                    {qaHistory.length}
                  </span>
                )}
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-3.5">
              {/* Daily Quota Cooldown Banner */}
              {quotaState.isCooldownActive && (
                <AiQuotaBanner quotaState={quotaState} className="mb-3" />
              )}

              {activeTab === "summary" && (
                <>
                  {!hasInsights ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <div className="w-12 h-12 rounded-2xl bg-[#F3EBFC] border border-[#7138B8]/20 flex items-center justify-center text-[#7138B8] mb-3 shadow-2xs">
                        <Sparkles className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-bold text-[#191B2B]">
                        {isSummarizing ? "Generating AI Insights..." : "No AI Insights Generated"}
                      </h4>
                      <p className="text-xs text-[#686B7A] max-w-xs mt-1 mb-5 leading-normal">
                        {isSummarizing
                          ? "Analyzing transcript text with Gemini 3.8 Flash..."
                          : "Generate an executive summary, key takeaways, and action items from this transcript with one click."}
                      </p>

                      {summaryError && !isSummarizing && (
                        <div className="mb-4 p-3 rounded-xl bg-[#FFF9F3] border border-[#FFE8D1] text-xs text-[#191B2B] text-left flex items-start gap-2 max-w-xs">
                          <AlertCircle className="w-4 h-4 text-[#F07800] mt-0.5 shrink-0" />
                          <div className="flex-1">
                            <p className="font-medium">{summaryError}</p>
                          </div>
                        </div>
                      )}

                      <Button
                        variant={summaryError ? "primary" : "purple"}
                        size="sm"
                        icon={summaryError ? RefreshCw : Sparkles}
                        isLoading={isSummarizing}
                        disabled={quotaState.isCooldownActive || isSummarizing}
                        onClick={handleGenerateSummary}
                        className="font-semibold shadow-xs"
                      >
                        {quotaState.isCooldownActive
                          ? "Quota Limit Active"
                          : isSummarizing
                          ? "Generating Insights..."
                          : summaryError
                          ? "Retry Generation"
                          : "Generate Insights"}
                      </Button>
                      {quotaState.isCooldownActive && (
                        <p className="text-[10px] text-[#686B7A] mt-2">
                          Daily 20 requests limit reached. Re-enables after reset.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Temporary error banner with Retry button if regeneration failed */}
                      {summaryError && (
                        <div className="p-3.5 rounded-2xl bg-[#FFF9F3] border border-[#FFE8D1] text-xs text-[#191B2B] flex items-start justify-between gap-2.5">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-[#F07800] mt-0.5 shrink-0" />
                            <p className="leading-relaxed">{summaryError}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="primary"
                            icon={RefreshCw}
                            isLoading={isSummarizing}
                            onClick={handleGenerateSummary}
                            disabled={isSummarizing || quotaState.isCooldownActive}
                            className="text-[11px] py-1 px-2.5 shrink-0"
                          >
                            Retry
                          </Button>
                        </div>
                      )}

                      {/* Summary Block */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-[#686B7A] flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-[#7138B8]" />
                            Executive Summary
                          </h4>
                          <button
                            onClick={handleGenerateSummary}
                            disabled={isSummarizing || quotaState.isCooldownActive}
                            className={`text-[10px] font-bold transition-colors flex items-center gap-1 ${
                              quotaState.isCooldownActive
                                ? "text-[#686B7A]/50 cursor-not-allowed"
                                : "text-[#7138B8] hover:text-[#602DA2] cursor-pointer"
                            }`}
                          >
                            <RefreshCw className={`w-3 h-3 ${isSummarizing ? "animate-spin" : ""}`} />
                            <span>
                              {isSummarizing
                                ? "Regenerating..."
                                : quotaState.isCooldownActive
                                ? "Quota limit active"
                                : "Regenerate"}
                            </span>
                          </button>
                        </div>
                        <div className="p-4 rounded-2xl bg-[#FAF9FC] border border-[#EBE8F0] text-xs sm:text-sm text-[#191B2B] leading-relaxed whitespace-pre-wrap">
                          {insights.summary}
                        </div>
                      </div>

                      {/* Key Points */}
                      {insights.keyPoints && insights.keyPoints.length > 0 && (
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-[#686B7A] flex items-center gap-1.5 mb-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#269B62]" />
                            Key Takeaways
                          </h4>
                          <ul className="space-y-2">
                            {insights.keyPoints.map((point, idx) => (
                              <li
                                key={idx}
                                className="p-3 rounded-2xl bg-[#FAF9FC] border border-[#EBE8F0] text-xs text-[#191B2B] flex items-start gap-2.5"
                              >
                                <span className="w-2 h-2 rounded-full bg-[#7138B8] mt-1.5 shrink-0" />
                                <span>{point}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Action Items */}
                      {insights.actionItems && insights.actionItems.length > 0 && (
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-[#686B7A] flex items-center gap-1.5 mb-2">
                            <ListOrdered className="w-3.5 h-3.5 text-[#F07800]" />
                            Action Items
                          </h4>
                          <ul className="space-y-2">
                            {insights.actionItems.map((item, idx) => (
                              <li
                                key={idx}
                                className="p-3 rounded-2xl bg-[#FAF9FC] border border-[#EBE8F0] text-xs text-[#191B2B] flex items-start gap-2.5"
                              >
                                <span className="w-5 h-5 rounded-full bg-[#FFF1E2] text-[#F07800] border border-[#F07800]/20 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
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
                        <HelpCircle className="w-8 h-8 text-[#686B7A]/40 mx-auto mb-2" />
                        <h4 className="text-xs sm:text-sm font-bold text-[#191B2B]">Ask anything about this audio</h4>
                        <p className="text-[11px] text-[#686B7A] max-w-xs mx-auto mt-0.5">
                          AI answers are strictly grounded in this transcript text.
                        </p>
                      </div>
                    ) : (
                      qaHistory.map((item, idx) => (
                        <div key={idx} className="space-y-2">
                          {/* User question */}
                          <div className="p-3 rounded-2xl bg-[#FFF1E2] border border-[#F07800]/20 text-xs text-[#191B2B]">
                            <span className="text-[10px] font-mono text-[#F07800] font-bold block mb-0.5">QUESTION</span>
                            {item.question}
                          </div>

                          {/* AI answer */}
                          <div className="p-3.5 rounded-2xl bg-[#FAF9FC] border border-[#EBE8F0] text-xs sm:text-sm text-[#191B2B] leading-relaxed">
                            <span className="text-[10px] font-mono text-[#7138B8] font-bold block mb-1">
                              SPEECHSCRIBE AI • {item.timestamp}
                            </span>
                            {item.loading ? (
                              <div className="flex items-center gap-2 text-[#7138B8] animate-pulse">
                                <Sparkles className="w-3.5 h-3.5" />
                                <span className="text-xs">Analyzing transcript context...</span>
                              </div>
                            ) : item.error ? (
                              <div className="space-y-2">
                                <p className="text-xs text-red-600 font-medium">{item.error}</p>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  icon={RefreshCw}
                                  onClick={(e) => handleAskQuestion(e, item.question)}
                                  disabled={isAsking || quotaState.isCooldownActive}
                                  className="text-[11px] py-1 px-2.5"
                                >
                                  Retry Question
                                </Button>
                              </div>
                            ) : (
                              item.answer
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Ask Question Input Form */}
                  <form onSubmit={handleAskQuestion} className="pt-2 border-t border-[#EBE8F0]">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        placeholder={
                          quotaState.isCooldownActive
                            ? "Daily AI quota limit active. Cooldown in progress..."
                            : isAsking
                            ? "Consulting Gemini 3.8 Flash..."
                            : "Ask about this transcript..."
                        }
                        disabled={isAsking || quotaState.isCooldownActive}
                        className={`flex-1 bg-white border rounded-full px-4 py-2 text-xs text-[#191B2B] placeholder:text-[#9598A8] focus:outline-none focus:border-[#F07800] ${
                          quotaState.isCooldownActive
                            ? "border-[#F07800]/40 bg-[#FFF1E2]/30 cursor-not-allowed"
                            : "border-[#EBE8F0]"
                        }`}
                      />
                      <Button
                        type="submit"
                        size="sm"
                        variant="primary"
                        isLoading={isAsking}
                        disabled={!question.trim() || isAsking || quotaState.isCooldownActive}
                        icon={Send}
                        className="font-semibold"
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
