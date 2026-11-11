import { useState, useEffect } from "react";
import { Sparkles, FileText, HelpCircle, Send, CheckCircle2, ArrowRight, ListOrdered } from "lucide-react";
import Button from "../components/common/Button";
import Skeleton from "../components/common/Skeleton";
import api from "../api/client";
import { useToast } from "../context/ToastContext";

export const AiWorkspacePage = () => {
  const [transcripts, setTranscripts] = useState([]);
  const [selectedTranscript, setSelectedTranscript] = useState(null);
  const [isLoadingList, setIsLoadingList] = useState(true);

  const [activeTab, setActiveTab] = useState("summary"); // summary | qa
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isAsking, setIsAsking] = useState(false);
  const [question, setQuestion] = useState("");
  const [qaHistory, setQaHistory] = useState([]);

  const toast = useToast();

  useEffect(() => {
    fetchTranscriptList();
  }, []);

  const fetchTranscriptList = async () => {
    setIsLoadingList(true);
    try {
      const res = await api.transcripts.getAll({ limit: 50 });
      if (res.success && res.data) {
        const list = Array.isArray(res.data) ? res.data : (res.data?.transcripts || []);
        setTranscripts(list);
        if (list.length > 0) {
          // Select the first transcript with existing insights or first item
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
      const res = await api.transcripts.getById(id);
      if (res.success && res.data) {
        setSelectedTranscript(res.data);
      }
    } catch (err) {
      toast.error("Could not load selected transcript details.");
    }
  };

  const handleGenerateSummary = async () => {
    if (!selectedTranscript) return;
    setIsSummarizing(true);
    try {
      const res = await api.ai.summarize(selectedTranscript._id);
      if (res.success && res.data) {
        toast.success("AI insights generated successfully!");
        setSelectedTranscript((prev) => ({
          ...prev,
          aiInsights: res.data,
        }));
      }
    } catch (err) {
      toast.error(err.message || "Failed to generate AI insights.");
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleAskQuestion = async (e) => {
    e?.preventDefault();
    if (!selectedTranscript || !question.trim() || isAsking) return;

    const currentQuestion = question.trim();
    setQuestion("");
    setIsAsking(true);

    try {
      const res = await api.ai.ask(selectedTranscript._id, currentQuestion);
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
      toast.error(err.message || "Failed to answer question.");
    } finally {
      setIsAsking(false);
    }
  };

  const insights = selectedTranscript?.aiInsights || {};
  const hasInsights = Boolean(insights.summary);

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="p-3.5 sm:p-4.5 rounded-xl bg-pure-white border border-warm-grey shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Sparkles className="w-4 h-4 text-amber-brand" />
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-charcoal">AI Intelligence Workspace</h2>
          </div>
          <p className="text-xs text-stone-grey">
            Extract executive summaries, key discussion points, action items, and run contextual Q&A using Gemini 2.5 Flash.
          </p>
        </div>

        {/* Transcript Selector */}
        {transcripts.length > 0 && (
          <div className="min-w-[240px]">
            <select
              value={selectedTranscript?._id || ""}
              onChange={(e) => loadTranscriptDetails(e.target.value)}
              className="w-full bg-warm-ivory border border-warm-grey rounded-lg px-2.5 py-1.5 text-xs text-charcoal focus:outline-none focus:border-amber-brand focus:ring-2 focus:ring-amber-brand/20 font-mono shadow-2xs cursor-pointer"
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

      {isLoadingList ? (
        <Skeleton className="h-80 w-full" />
      ) : !selectedTranscript ? (
        <div className="p-8 text-center rounded-xl bg-pure-white border border-warm-grey shadow-2xs">
          <Sparkles className="w-8 h-8 text-stone-grey/40 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-charcoal">No Transcripts Available</h3>
          <p className="text-xs text-stone-grey mt-1">Transcribe an audio recording to access AI intelligence.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Column: Original Transcript Excerpt */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-pure-white border border-warm-grey flex flex-col h-[480px] sm:h-[520px] shadow-2xs">
            <div className="flex items-center justify-between pb-2.5 border-b border-warm-grey/70 mb-2.5">
              <h3 className="text-xs font-semibold text-charcoal">Transcript Context</h3>
              <span className="text-xs text-stone-grey">
                <span className="font-mono">{selectedTranscript.transcriptionText?.trim().split(/\s+/).length || 0}</span> words
              </span>
            </div>

            <div className="flex-1 overflow-y-auto text-xs text-charcoal leading-relaxed font-sans pr-1.5 whitespace-pre-wrap">
              {selectedTranscript.transcriptionText}
            </div>
          </div>

          {/* Right Column: AI Analysis & Q&A */}
          <div className="lg:col-span-2 p-3.5 sm:p-4 rounded-xl bg-pure-white border border-warm-grey flex flex-col h-[480px] sm:h-[520px] shadow-2xs">
            {/* Tabs */}
            <div className="flex items-center justify-between pb-2.5 border-b border-warm-grey/70 mb-3">
              <div className="flex gap-1.5">
                <button
                  onClick={() => setActiveTab("summary")}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === "summary"
                      ? "bg-amber-brand text-pure-white shadow-2xs"
                      : "text-stone-grey hover:text-charcoal hover:bg-warm-ivory"
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Summary & Points</span>
                </button>

                <button
                  onClick={() => setActiveTab("qa")}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === "qa"
                      ? "bg-amber-brand text-pure-white shadow-2xs"
                      : "text-stone-grey hover:text-charcoal hover:bg-warm-ivory"
                  }`}
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Contextual Q&A</span>
                </button>
              </div>

              {activeTab === "summary" && hasInsights && (
                <button
                  onClick={handleGenerateSummary}
                  disabled={isSummarizing}
                  className="text-xs text-amber-brand hover:text-amber-brand-hover transition-colors font-semibold cursor-pointer"
                >
                  {isSummarizing ? "Regenerating..." : "Regenerate"}
                </button>
              )}
            </div>

            {/* Content view */}
            <div className="flex-1 overflow-y-auto pr-1">
              {activeTab === "summary" && (
                <>
                  {!hasInsights ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-8">
                      <Sparkles className="w-7 h-7 text-amber-brand mb-2" />
                      <h4 className="text-xs sm:text-sm font-semibold text-charcoal">AI Analysis Not Generated</h4>
                      <p className="text-xs text-stone-grey max-w-sm mt-1 mb-4">
                        Generate structured insights, main topics, and actionable items from this recording.
                      </p>
                      <Button
                        variant="primary"
                        size="sm"
                        icon={Sparkles}
                        isLoading={isSummarizing}
                        onClick={handleGenerateSummary}
                      >
                        Generate Insights
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Summary */}
                      <div>
                        <h4 className="text-xs font-semibold text-stone-grey flex items-center gap-1.5 mb-1.5">
                          <FileText className="w-3.5 h-3.5 text-amber-brand" />
                          Executive Summary
                        </h4>
                        <div className="p-3 rounded-lg bg-warm-ivory border border-warm-grey text-xs sm:text-[13px] text-charcoal leading-relaxed whitespace-pre-wrap">
                          {insights.summary}
                        </div>
                      </div>

                      {/* Key Points */}
                      {insights.keyPoints && insights.keyPoints.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold text-stone-grey flex items-center gap-1.5 mb-1.5">
                            <ListOrdered className="w-3.5 h-3.5 text-amber-brand" />
                            Key Takeaways
                          </h4>
                          <div className="space-y-1.5">
                            {insights.keyPoints.map((point, i) => (
                              <div
                                key={i}
                                className="p-2.5 rounded-lg bg-warm-ivory border border-warm-grey text-xs text-charcoal flex items-start gap-2"
                              >
                                <span className="w-4 h-4 rounded-full bg-amber-brand-light text-amber-brand font-bold text-[9px] font-mono flex items-center justify-center shrink-0 mt-0.5 border border-amber-brand/20">
                                  {i + 1}
                                </span>
                                <span>{point}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action items */}
                      {insights.actionItems && insights.actionItems.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold text-stone-grey flex items-center gap-1.5 mb-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-amber-soft" />
                            Action Items
                          </h4>
                          <div className="space-y-1.5">
                            {insights.actionItems.map((item, i) => (
                              <div
                                key={i}
                                className="p-2.5 rounded-lg bg-amber-soft-light border border-amber-soft/25 text-xs text-charcoal flex items-start gap-2"
                              >
                                <ArrowRight className="w-3 h-3 text-amber-brand shrink-0 mt-0.5" />
                                <span>{item}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {activeTab === "qa" && (
                <div className="flex flex-col h-full space-y-3">
                  {/* Q&A Thread */}
                  <div className="flex-1 space-y-2.5 overflow-y-auto pr-1">
                    {qaHistory.length === 0 ? (
                      <div className="text-center py-12">
                        <HelpCircle className="w-7 h-7 text-stone-grey/40 mx-auto mb-2" />
                        <h4 className="text-xs font-semibold text-charcoal">Ask Anything About This Recording</h4>
                        <p className="text-[11px] text-stone-grey max-w-xs mx-auto mt-1">
                          Questions are answered with factual grounding directly sourced from the transcript.
                        </p>
                      </div>
                    ) : (
                      qaHistory.map((item, idx) => (
                        <div key={idx} className="space-y-1.5">
                          <div className="flex justify-end">
                            <div className="max-w-[85%] p-2.5 rounded-lg rounded-tr-xs bg-amber-brand text-pure-white text-xs leading-relaxed shadow-2xs">
                              {item.question}
                            </div>
                          </div>

                          <div className="flex justify-start">
                            <div className="max-w-[85%] p-2.5 sm:p-3 rounded-lg rounded-tl-xs bg-warm-ivory border border-warm-grey text-charcoal text-xs leading-relaxed whitespace-pre-wrap">
                              {item.answer}
                              <div className="mt-1 text-[10px] text-stone-grey text-right">{item.timestamp}</div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Input form */}
                  <form onSubmit={handleAskQuestion} className="pt-2 border-t border-warm-grey/70 flex gap-2">
                    <input
                      type="text"
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      placeholder="Ask a question about this recording..."
                      disabled={isAsking}
                      className="flex-1 bg-pure-white border border-warm-grey rounded-lg px-3 py-1.5 text-xs text-charcoal placeholder:text-stone-grey-light focus:outline-none focus:border-amber-brand focus:ring-2 focus:ring-amber-brand/20 shadow-2xs"
                    />
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      disabled={!question.trim() || isAsking}
                      isLoading={isAsking}
                      icon={Send}
                    />
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
