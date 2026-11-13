import { useState, useEffect } from "react";
import {
  Sparkles,
  FileText,
  HelpCircle,
  Send,
  CheckCircle2,
  ArrowRight,
  ListOrdered,
  LogIn,
  Mic,
  Cpu,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import Button from "../components/common/Button";
import Skeleton from "../components/common/Skeleton";
import AiQuotaBanner from "../components/common/AiQuotaBanner";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import {
  getQuotaCooldown,
  recordQuotaCooldown,
  QUOTA_EVENT_NAME,
} from "../utils/aiQuota";

export const AiWorkspacePage = () => {
  const { isAuthenticated, requireAuth, openAuthModal } = useAuth();
  const [transcripts, setTranscripts] = useState([]);
  const [selectedTranscript, setSelectedTranscript] = useState(null);
  const [isLoadingList, setIsLoadingList] = useState(false);

  const [activeTab, setActiveTab] = useState("summary"); // summary | qa
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryError, setSummaryError] = useState(null);
  const [isAsking, setIsAsking] = useState(false);
  const [question, setQuestion] = useState("");
  const [qaHistory, setQaHistory] = useState([]);
  const [quotaState, setQuotaState] = useState(getQuotaCooldown());

  const toast = useToast();

  useEffect(() => {
    if (isAuthenticated) {
      fetchTranscriptList();
    } else {
      setTranscripts([]);
      setSelectedTranscript(null);
      setIsLoadingList(false);
    }
  }, [isAuthenticated]);

  // Sync quota status with server and local storage on mount
  useEffect(() => {
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
        // Graceful offline fallback
      });
  }, []);

  // Real-time countdown tick & cross-tab quota event listener
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

  const fetchTranscriptList = async () => {
    setIsLoadingList(true);
    try {
      const res = await api.transcripts.getAll({ limit: 50 });
      if (res.success && res.data) {
        const list = Array.isArray(res.data) ? res.data : (res.data?.transcripts || []);
        setTranscripts(list);
        if (list.length > 0) {
          const withInsights = list.find((t) => t.aiInsights?.summary);
          loadTranscriptDetails((withInsights || list[0])._id);
        }
      }
    } catch (err) {
      console.error("Failed to load transcripts:", err);
    } finally {
      setIsLoadingList(false);
    }
  };

  const loadTranscriptDetails = async (id) => {
    try {
      setSummaryError(null);
      const res = await api.transcripts.getById(id);
      if (res.success && res.data) {
        setSelectedTranscript(res.data);
      }
    } catch (err) {
      toast.error("Could not load selected transcript details.");
    }
  };

  const handleGenerateSummary = async () => {
    if (!selectedTranscript || isSummarizing) return;

    requireAuth(
      async () => {
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
          const res = await api.ai.summarize(selectedTranscript._id);
          if (res.success && res.data) {
            toast.success("AI insights generated successfully!");
            setSummaryError(null);
            setSelectedTranscript((prev) => ({
              ...prev,
              aiInsights: res.data,
            }));
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
          } else if (err.status === 503 || err.status === 504 || err.message?.includes("high demand") || err.message?.includes("timed out")) {
            const friendlyMsg =
              "AI insights are temporarily unavailable. Your transcript is safe and saved. Please try again shortly.";
            setSummaryError(friendlyMsg);
            toast.error(friendlyMsg);
          } else {
            const genericMsg = err.message || "Failed to generate AI insights.";
            setSummaryError(genericMsg);
            toast.error(genericMsg);
          }
        } finally {
          setIsSummarizing(false);
        }
      },
      {
        title: "Sign In for AI Intelligence",
        subtitle: "Generate summaries, key points, and action items with Gemini 3.8 Flash",
      }
    );
  };

  const handleAskQuestion = async (e, retryQuestionText = null) => {
    e?.preventDefault();
    const query = (retryQuestionText || question).trim();
    if (!query || isAsking) return;

    requireAuth(
      async () => {
        if (!selectedTranscript || isAsking) return;

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

        if (retryQuestionText) {
          setQaHistory((prev) =>
            prev.map((entry) =>
              entry.question === retryQuestionText
                ? { ...entry, loading: true, error: null }
                : entry
            )
          );
        } else {
          const optimisticEntry = {
            question: query,
            answer: null,
            loading: true,
            error: null,
            timestamp: new Date().toISOString(),
          };
          setQaHistory((prev) => [...prev, optimisticEntry]);
        }

        try {
          const res = await api.ai.ask(selectedTranscript._id, query);
          if (res.success && res.data) {
            setQaHistory((prev) =>
              prev.map((entry) =>
                entry.question === query
                  ? { ...entry, answer: res.data.answer, loading: false, error: null }
                  : entry
              )
            );
          }
        } catch (err) {
          if (err.status === 429 || err.data?.isQuotaExceeded) {
            recordQuotaCooldown({
              retryAfter: err.data?.retryAfter,
              retryAt: err.data?.retryAt,
              message: err.message,
            });
          }
          let errorMsg;
          if (err.status === 429 || err.data?.isQuotaExceeded) {
            errorMsg = err.message || "Daily AI limit reached. Please wait for cooldown.";
          } else if (err.status === 503 || err.status === 504 || err.message?.includes("high demand") || err.message?.includes("busy")) {
            errorMsg = "AI service is temporarily busy. Your transcript is safe and saved. Please retry your question.";
          } else {
            errorMsg = err.message || "Failed to retrieve contextual answer. Gemini may be temporarily unavailable.";
          }

          setQaHistory((prev) =>
            prev.map((entry) =>
              entry.question === query
                ? { ...entry, error: errorMsg, loading: false }
                : entry
            )
          );
          toast.error(errorMsg);
        } finally {
          setIsAsking(false);
        }
      },
      {
        title: "Sign In to Query Transcript",
        subtitle: "Ask contextual questions against your audio recordings using Gemini 3.8 Flash",
      }
    );
  };

  const hasInsights = Boolean(
    selectedTranscript?.aiInsights?.summary ||
      (selectedTranscript?.aiInsights?.keyPoints &&
        selectedTranscript.aiInsights.keyPoints.length > 0)
  );

  return (
    <div className="space-y-4">
      {/* Workspace Header */}
      <div className="p-4 rounded-xl bg-white border border-[#EBE8F0] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-[38px] h-[38px] rounded-lg bg-[#F3EBFC] border border-[#E2CEF7] flex items-center justify-center text-[#7138B8] shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[17px] font-semibold tracking-tight text-[#191B2B]">
                AI Intelligence Workspace
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F3EBFC] text-[#7138B8] border border-[#E2CEF7]">
                Gemini 3.8 Flash
              </span>
            </div>
            <p className="text-[12px] text-[#686B7A] mt-0.5">
              Extract executive summaries, key discussion points, action items, and run grounded Q&A.
            </p>
          </div>
        </div>

        {/* Transcript Selector (Authenticated only) */}
        {isAuthenticated && transcripts.length > 0 && (
          <div className="min-w-[240px]">
            <label className="block text-[11px] font-semibold text-[#686B7A] uppercase tracking-wider mb-1">
              Active Recording
            </label>
            <select
              value={selectedTranscript?._id || ""}
              onChange={(e) => loadTranscriptDetails(e.target.value)}
              className="w-full bg-[#FAF9FC] border border-[#EBE8F0] rounded-lg px-2.5 py-1.5 text-xs text-[#191B2B] focus:outline-none focus:border-[#7138B8] focus:ring-2 focus:ring-[#7138B8]/20 font-medium shadow-2xs cursor-pointer h-[38px]"
            >
              {transcripts.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.title || "Untitled Recording"}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Quota Cooldown Banner */}
      {quotaState.isCooldownActive && (
        <AiQuotaBanner quotaState={quotaState} className="mb-3.5" />
      )}

      {/* Body Section */}
      {!isAuthenticated ? (
        /* Guest Mode: Clean informative showcase with Sign In */
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-white border border-[#EBE8F0] shadow-2xs space-y-2">
              <div className="w-[38px] h-[38px] rounded-lg bg-[#F3EBFC] border border-[#E2CEF7] flex items-center justify-center text-[#7138B8]">
                <FileText className="w-4 h-4" />
              </div>
              <h3 className="text-[14px] font-semibold text-[#191B2B]">Executive Summaries</h3>
              <p className="text-[12px] text-[#686B7A] leading-relaxed">
                Transforms lengthy voice recordings, meetings, and interviews into structured executive briefs highlighting core themes.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-[#EBE8F0] shadow-2xs space-y-2">
              <div className="w-[38px] h-[38px] rounded-lg bg-[#FFF1E2] border border-[#FFDEC0] flex items-center justify-center text-[#F07800]">
                <ListOrdered className="w-4 h-4" />
              </div>
              <h3 className="text-[14px] font-semibold text-[#191B2B]">Key Takeaways & Actions</h3>
              <p className="text-[12px] text-[#686B7A] leading-relaxed">
                Automatically extracts critical decisions and actionable to-do assignments directly from the spoken dialogue.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-[#EBE8F0] shadow-2xs space-y-2">
              <div className="w-[38px] h-[38px] rounded-lg bg-[#F3EBFC] border border-[#E2CEF7] flex items-center justify-center text-[#7138B8]">
                <HelpCircle className="w-4 h-4" />
              </div>
              <h3 className="text-[14px] font-semibold text-[#191B2B]">Contextual Grounded Q&A</h3>
              <p className="text-[12px] text-[#686B7A] leading-relaxed">
                Query conversations directly. Answers are strictly verified and grounded within the transcript audio context.
              </p>
            </div>
          </div>

          <div className="p-6 sm:p-7 rounded-xl bg-gradient-to-br from-[#FFF9F3] via-white to-[#F9F5FD] border border-[#EBE8F0] shadow-2xs text-center space-y-2.5">
            <div className="w-11 h-11 rounded-xl bg-white border border-[#EBE8F0] flex items-center justify-center text-[#F07800] mx-auto shadow-2xs">
              <Sparkles className="w-5 h-5 text-[#7138B8]" />
            </div>
            <h3 className="text-[18px] sm:text-[20px] font-semibold text-[#191B2B]">
              Unlock Gemini 3.8 Flash Speech Intelligence
            </h3>
            <p className="text-[13px] text-[#686B7A] max-w-lg mx-auto leading-relaxed">
              AI summaries and conversational Q&A operate on your private saved transcripts. Sign in or create a free profile to transcribe and analyze audio.
            </p>
            <div className="pt-2 flex items-center justify-center gap-3">
              <Button
                size="md"
                variant="primary"
                icon={LogIn}
                onClick={() =>
                  openAuthModal({
                    mode: "login",
                    title: "Sign In for AI Intelligence",
                    subtitle: "Analyze your speech transcripts with Gemini 3.8 Flash",
                    onSuccess: fetchTranscriptList,
                  })
                }
              >
                Sign In to Workspace
              </Button>
              <Button
                size="md"
                variant="secondary"
                icon={Mic}
                onClick={() => openAuthModal({ mode: "register", title: "Create Your Free Account" })}
              >
                Create Account
              </Button>
            </div>
          </div>
        </div>
      ) : isLoadingList ? (
        <Skeleton className="h-80 w-full rounded-xl" />
      ) : !selectedTranscript ? (
        <div className="p-10 text-center rounded-xl bg-white border border-[#EBE8F0] shadow-2xs space-y-2">
          <div className="w-10 h-10 rounded-xl bg-[#FAF9FC] border border-[#EBE8F0] flex items-center justify-center text-[#686B7A] mx-auto">
            <Sparkles className="w-5 h-5 text-[#7138B8]" />
          </div>
          <h3 className="text-xs sm:text-sm font-semibold text-[#191B2B]">No Transcripts Available</h3>
          <p className="text-[11.5px] text-[#686B7A] max-w-xs mx-auto">
            Record or upload an audio file in the Audio Studio to begin generating AI insights.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
          {/* Left Column: Original Transcript Excerpt */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-white border border-[#EBE8F0] flex flex-col h-[480px] sm:h-[510px] shadow-2xs">
            <div className="flex items-center justify-between pb-2.5 border-b border-[#EBE8F0] mb-2.5">
              <div>
                <h3 className="text-[11px] font-bold text-[#191B2B] uppercase tracking-wider">
                  Transcript Context
                </h3>
                <p className="text-[11px] text-[#686B7A] truncate max-w-[180px]">
                  {selectedTranscript.title || "Untitled Recording"}
                </p>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10.5px] font-mono font-medium bg-[#FAF9FC] text-[#686B7A] border border-[#EBE8F0]">
                {selectedTranscript.transcriptionText?.trim().split(/\s+/).length || 0} words
              </span>
            </div>

            <div className="flex-1 overflow-y-auto text-xs text-[#191B2B] leading-relaxed font-sans pr-1.5 whitespace-pre-wrap">
              {selectedTranscript.transcriptionText}
            </div>
          </div>

          {/* Right Column: AI Analysis & Q&A */}
          <div className="lg:col-span-2 p-3.5 sm:p-4 rounded-xl bg-white border border-[#EBE8F0] flex flex-col h-[480px] sm:h-[510px] shadow-2xs">
            {/* Tabs */}
            <div className="flex items-center justify-between pb-2.5 border-b border-[#EBE8F0] mb-2.5">
              <div className="flex gap-1.5 bg-[#FAF9FC] p-1 rounded-lg border border-[#EBE8F0]">
                <button
                  onClick={() => setActiveTab("summary")}
                  className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === "summary"
                      ? "bg-[#7138B8] text-white shadow-xs"
                      : "text-[#686B7A] hover:text-[#191B2B] hover:bg-white"
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Summary & Points</span>
                </button>

                <button
                  onClick={() => setActiveTab("qa")}
                  className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === "qa"
                      ? "bg-[#7138B8] text-white shadow-xs"
                      : "text-[#686B7A] hover:text-[#191B2B] hover:bg-white"
                  }`}
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Contextual Q&A</span>
                </button>
              </div>

              {activeTab === "summary" && hasInsights && (
                <button
                  onClick={handleGenerateSummary}
                  disabled={isSummarizing || quotaState.isCooldownActive}
                  className={`text-xs transition-colors font-semibold flex items-center gap-1 cursor-pointer ${
                    quotaState.isCooldownActive
                      ? "text-[#686B7A]/50 cursor-not-allowed"
                      : "text-[#F07800] hover:text-[#D96B00]"
                  }`}
                >
                  <RefreshCw className={`w-3 h-3 ${isSummarizing ? "animate-spin" : ""}`} />
                  <span>
                    {isSummarizing
                      ? "Regenerating..."
                      : quotaState.isCooldownActive
                      ? "Cooldown Active"
                      : "Regenerate"}
                  </span>
                </button>
              )}
            </div>

            {/* Content view */}
            <div className="flex-1 overflow-y-auto pr-1">
              {activeTab === "summary" && (
                <>
                  {!hasInsights ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-8">
                      <div className="w-10 h-10 rounded-xl bg-[#F3EBFC] border border-[#E2CEF7] flex items-center justify-center text-[#7138B8] mb-2.5">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <h4 className="text-xs sm:text-[13px] font-semibold text-[#191B2B]">
                        {isSummarizing ? "Generating AI Insights..." : "AI Analysis Not Generated"}
                      </h4>
                      <p className="text-xs text-[#686B7A] max-w-sm mt-1 mb-3.5 leading-relaxed">
                        {isSummarizing
                          ? "Analyzing transcript text with Gemini 3.8 Flash..."
                          : "Generate structured executive briefs, main discussion points, and actionable items from this recording using Gemini 3.8 Flash."}
                      </p>

                      {summaryError && !isSummarizing && (
                        <div className="mb-3 p-3 rounded-lg bg-[#FFF9F3] border border-[#FFE8D1] text-xs text-[#191B2B] text-left flex items-start gap-2 max-w-sm">
                          <AlertCircle className="w-3.5 h-3.5 text-[#F07800] mt-0.5 shrink-0" />
                          <div className="flex-1">
                            <p className="font-medium">{summaryError}</p>
                          </div>
                        </div>
                      )}

                      <Button
                        variant="primary"
                        size="sm"
                        icon={summaryError ? RefreshCw : Sparkles}
                        isLoading={isSummarizing}
                        disabled={quotaState.isCooldownActive || isSummarizing}
                        onClick={handleGenerateSummary}
                      >
                        {quotaState.isCooldownActive
                          ? "Quota Cooldown Active"
                          : isSummarizing
                          ? "Generating Insights..."
                          : summaryError
                          ? "Retry Insights"
                          : "Generate AI Insights"}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Temporary error banner with Retry button if regeneration failed */}
                      {summaryError && (
                        <div className="p-3 rounded-xl bg-[#FFF9F3] border border-[#FFE8D1] text-xs text-[#191B2B] flex items-start justify-between gap-2.5">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="w-3.5 h-3.5 text-[#F07800] mt-0.5 shrink-0" />
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

                      {/* Executive Summary */}
                      {selectedTranscript.aiInsights?.summary && (
                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#7138B8]" />
                            <h4 className="text-[10.5px] font-bold text-[#191B2B] uppercase tracking-wider">
                              Executive Summary
                            </h4>
                          </div>
                          <div className="p-3 rounded-lg bg-[#FAF9FC] border border-[#EBE8F0] text-xs text-[#191B2B] leading-relaxed">
                            {selectedTranscript.aiInsights.summary}
                          </div>
                        </div>
                      )}

                      {/* Key Points */}
                      {selectedTranscript.aiInsights?.keyPoints?.length > 0 && (
                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#7138B8]" />
                            <h4 className="text-[10.5px] font-bold text-[#191B2B] uppercase tracking-wider">
                              Key Discussion Points
                            </h4>
                          </div>
                          <ul className="space-y-1.5">
                            {selectedTranscript.aiInsights.keyPoints.map((point, i) => (
                              <li
                                key={i}
                                className="flex items-start gap-2 text-xs text-[#191B2B] bg-[#FAF9FC] p-2 rounded-lg border border-[#EBE8F0]"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-[#7138B8] mt-1 shrink-0" />
                                <span>{point}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Action Items */}
                      {selectedTranscript.aiInsights?.actionItems?.length > 0 && (
                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#F07800]" />
                            <h4 className="text-[10.5px] font-bold text-[#191B2B] uppercase tracking-wider">
                              Action Items
                            </h4>
                          </div>
                          <ul className="space-y-1.5">
                            {selectedTranscript.aiInsights.actionItems.map((item, i) => (
                              <li
                                key={i}
                                className="flex items-start gap-2 text-xs text-[#191B2B] bg-[#FFF9F3] p-2 rounded-lg border border-[#FFE8D1]"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-[#F07800] mt-0.5 shrink-0" />
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
                <div className="flex flex-col h-full">
                  <div className="flex-1 overflow-y-auto space-y-2.5 mb-2.5 pr-1">
                    {qaHistory.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center py-8">
                        <div className="w-10 h-10 rounded-xl bg-[#F3EBFC] border border-[#E2CEF7] flex items-center justify-center text-[#7138B8] mb-2.5">
                          <HelpCircle className="w-5 h-5" />
                        </div>
                        <h4 className="text-xs sm:text-[13px] font-semibold text-[#191B2B]">
                          Ask Contextual Questions
                        </h4>
                        <p className="text-xs text-[#686B7A] max-w-sm mt-1 leading-relaxed">
                          Query dates, numbers, decisions, or ask for clarifications based strictly on the spoken audio text.
                        </p>
                      </div>
                    ) : (
                      qaHistory.map((entry, i) => (
                        <div key={i} className="space-y-1.5">
                          {/* User Question */}
                          <div className="flex justify-end">
                            <div className="max-w-[85%] px-3 py-2 rounded-xl rounded-tr-xs bg-[#7138B8] text-white text-xs shadow-xs font-medium">
                              {entry.question}
                            </div>
                          </div>

                          {/* AI Answer */}
                          <div className="flex justify-start">
                            <div className="max-w-[85%] p-3 rounded-xl rounded-tl-xs bg-[#FAF9FC] border border-[#EBE8F0] text-xs text-[#191B2B] shadow-2xs">
                              {entry.loading ? (
                                <span className="flex items-center gap-2 text-[#686B7A] animate-pulse">
                                  <Sparkles className="w-3.5 h-3.5 text-[#7138B8]" />
                                  <span>Analyzing transcript context...</span>
                                </span>
                              ) : entry.error ? (
                                <div className="space-y-2">
                                  <span className="text-red-600 font-medium block">{entry.error}</span>
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    icon={RefreshCw}
                                    onClick={(e) => handleAskQuestion(e, entry.question)}
                                    disabled={isAsking || quotaState.isCooldownActive}
                                    className="text-[11px] py-1 px-2.5"
                                  >
                                    Retry Question
                                  </Button>
                                </div>
                              ) : (
                                entry.answer
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Input Form */}
                  <form onSubmit={handleAskQuestion} className="flex gap-2 pt-2 border-t border-[#EBE8F0]">
                    <input
                      type="text"
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      placeholder={
                        quotaState.isCooldownActive
                          ? "Daily AI quota limit active. Cooldown in progress..."
                          : isAsking
                          ? "Querying Gemini 3.8 Flash..."
                          : "Ask anything grounded in this transcript..."
                      }
                      disabled={isAsking || quotaState.isCooldownActive}
                      className="flex-1 bg-[#FAF9FC] border border-[#EBE8F0] rounded-xl px-3.5 py-1.5 text-xs text-[#191B2B] placeholder:text-[#686B7A] focus:outline-none focus:border-[#7138B8] focus:ring-2 focus:ring-[#7138B8]/20 shadow-2xs h-9 sm:h-9.5"
                    />
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      icon={Send}
                      isLoading={isAsking}
                      disabled={!question.trim() || isAsking || quotaState.isCooldownActive}
                    >
                      Ask
                    </Button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AiWorkspacePage;
