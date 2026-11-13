import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Search,
  FileText,
  Clock,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Mic,
  AudioWaveform,
  LogIn,
} from "lucide-react";
import Badge from "../components/common/Badge";
import Button from "../components/common/Button";
import Modal from "../components/common/Modal";
import Skeleton from "../components/common/Skeleton";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export const HistoryLibrary = ({ mode: propMode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { isAuthenticated, requireAuth, openAuthModal } = useAuth();

  const isHistoryMode = propMode === "history" || location.pathname.startsWith("/history");

  const [transcripts, setTranscripts] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalCount: 0 });
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchTranscripts();
    } else {
      setTranscripts([]);
      setIsLoading(false);
      setPagination({ currentPage: 1, totalPages: 1, totalCount: 0 });
    }
  }, [page, search, isAuthenticated]);

  const fetchTranscripts = async () => {
    setIsLoading(true);
    try {
      const res = await api.transcripts.getAll({
        page,
        limit: 10,
        search: search.trim() || undefined,
      });

      if (res.success && res.data) {
        const list = Array.isArray(res.data) ? res.data : (res.data.transcripts || []);
        setTranscripts(list);
        if (res.meta) {
          setPagination(res.meta);
        } else if (res.data?.meta) {
          setPagination(res.data.meta);
        }
      }
    } catch (err) {
      console.error("Fetch history error:", err);
      toast.error(err.message || "Failed to load transcripts.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchFocus = () => {
    if (!isAuthenticated) {
      requireAuth(() => {}, {
        title: "Sign In to Search Archive",
        subtitle: "Search and filter through your personal transcripts",
      });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await api.transcripts.delete(deleteTarget._id);
      toast.success("Transcript deleted successfully.");
      setDeleteTarget(null);
      fetchTranscripts();
    } catch (err) {
      toast.error(err.message || "Failed to delete transcript.");
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return "0s";
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  return (
    <div className="space-y-4">
      {/* Top Controls Bar */}
      <div className="p-4 rounded-xl bg-white border border-[#EBE8F0] shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#686B7A] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onFocus={handleSearchFocus}
            onChange={(e) => {
              if (!isAuthenticated) {
                handleSearchFocus();
                return;
              }
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder={
              isHistoryMode
                ? "Search activity history by title or keyword..."
                : "Search transcripts by title or keyword..."
            }
            className="w-full bg-[#FAF9FC] border border-[#EBE8F0] rounded-xl pl-9.5 pr-3.5 py-1.5 text-xs sm:text-[13px] text-[#191B2B] placeholder:text-[#9598A8] focus:outline-none focus:border-[#F07800] focus:ring-2 focus:ring-[#F07800]/20 shadow-2xs h-[38px]"
          />
        </div>

        {/* Counter & Action */}
        <div className="flex items-center justify-between sm:justify-end gap-3">
          <span className="text-[12px] text-[#686B7A] font-medium">
            <span className="font-mono font-bold text-[#191B2B]">{pagination.totalCount}</span> {pagination.totalCount === 1 ? "record" : "records"}
          </span>

          <Button
            size="sm"
            variant="primary"
            icon={Mic}
            onClick={() => navigate("/studio")}
            className="font-semibold shadow-xs"
          >
            New Audio
          </Button>
        </div>
      </div>

      {/* Transcript List Card */}
      <div className="rounded-xl bg-white border border-[#EBE8F0] overflow-hidden shadow-2xs">
        {!isAuthenticated ? (
          /* Guest Mode: Clean informative empty state with Sign In */
          <div className="py-10 px-4 text-center">
            <div className="w-12 h-12 rounded-xl bg-[#FFF1E2] border border-[#F07800]/20 flex items-center justify-center text-[#F07800] mx-auto mb-3 shadow-2xs">
              {isHistoryMode ? <Clock className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
            </div>
            <h3 className="text-sm sm:text-base font-semibold text-[#191B2B]">
              {isHistoryMode ? "Your Session Activity Timeline" : "Your Sovereign Transcript Archive"}
            </h3>
            <p className="text-xs text-[#686B7A] max-w-md mx-auto mt-1 mb-5 leading-relaxed">
              {isHistoryMode
                ? "Your audio processing history, ingestion sessions, and timeline will be archived here. Sign in to view your activity log."
                : "Your transcribed audio recordings, word timestamps, and speaker insights will be archived here. Sign in to access your personal library."}
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button
                size="sm"
                variant="secondary"
                icon={LogIn}
                onClick={() =>
                  openAuthModal({
                    mode: "login",
                    title: isHistoryMode ? "Sign In to View History" : "Sign In to View Library",
                    subtitle: isHistoryMode ? "Access your personal activity log" : "Access your private audio archive",
                    onSuccess: fetchTranscripts,
                  })
                }
              >
                {isHistoryMode ? "Sign In to View History" : "Sign In to View Library"}
              </Button>
              <Button
                size="sm"
                variant="primary"
                icon={Mic}
                onClick={() => navigate("/studio")}
                className="font-semibold shadow-xs"
              >
                Open Audio Studio
              </Button>
            </div>
          </div>
        ) : isLoading ? (
          <div className="p-4 space-y-2.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <Skeleton key={n} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : transcripts.length === 0 ? (
          <div className="py-10 px-4 text-center">
            {isHistoryMode ? (
              <Clock className="w-10 h-10 text-[#686B7A]/30 mx-auto mb-2.5" />
            ) : (
              <FileText className="w-10 h-10 text-[#686B7A]/30 mx-auto mb-2.5" />
            )}
            <h3 className="text-sm sm:text-base font-semibold text-[#191B2B]">
              {search
                ? isHistoryMode
                  ? "No matching history logs found"
                  : "No matching transcripts found"
                : isHistoryMode
                ? "No activity recorded yet"
                : "No transcripts yet"}
            </h3>
            <p className="text-xs text-[#686B7A] max-w-sm mx-auto mt-1 mb-4">
              {search
                ? `No records match "${search}". Try searching another keyword.`
                : isHistoryMode
                ? "Record speech or upload audio files to start logging your session activity."
                : "Record speech or upload audio files to start building your knowledge base."}
            </p>
            {!search && (
              <Button
                size="sm"
                variant="primary"
                icon={Mic}
                onClick={() => navigate("/studio")}
                className="font-semibold shadow-xs"
              >
                Launch Audio Studio
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-[#EBE8F0]/70">
            {transcripts.map((t) => {
              const wordCount = t.transcriptionText?.trim().split(/\s+/).filter(Boolean).length || 0;
              const meta = t.transcriptionMetadata || {};
              const audioMeta = t.audioMetadata || {};
              const duration = meta.durationSeconds || audioMeta.durationSeconds || 0;

              return (
                <div
                  key={t._id}
                  className="p-3 sm:px-4.5 sm:py-3 hover:bg-[#FAF9FC] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 group"
                >
                  <div
                    onClick={() => navigate(`/editor/${t._id}`)}
                    className="flex-1 min-w-0 cursor-pointer flex items-start gap-2.5"
                  >
                    <div className="w-[38px] h-[38px] rounded-lg bg-[#FFF1E2] border border-[#F07800]/20 flex items-center justify-center text-[#F07800] shrink-0 group-hover:bg-[#F07800] group-hover:text-white transition-colors mt-0.5 shadow-2xs">
                      <AudioWaveform className="w-4 h-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="text-[14px] font-semibold text-[#191B2B] group-hover:text-[#F07800] truncate transition-colors">
                        {t.title || "Untitled Recording"}
                      </h3>
                      <p className="text-[12px] text-[#686B7A] mt-0.5 line-clamp-1">
                        {t.transcriptionText || "No audible text."}
                      </p>

                      <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[10px] font-mono text-[#686B7A]">
                        <span className="flex items-center gap-1 bg-[#FAF9FC] px-1.5 py-0.5 rounded-md border border-[#EBE8F0]">
                          <Clock className="w-3 h-3 text-[#F07800]" />
                          {formatDuration(duration)}
                        </span>
                        <span>•</span>
                        <span>{wordCount} words</span>
                        <span>•</span>
                        <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                        {meta.language && (
                          <>
                            <span>•</span>
                            <span className="uppercase text-[#F07800] font-bold">{meta.language}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2.5 shrink-0">
                    <Badge variant={t.status === "completed" ? "completed" : "neutral"} size="sm">
                      {t.status || "Transcribed"}
                    </Badge>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(t);
                      }}
                      className="p-1.5 text-[#686B7A] hover:text-[#DC4545] rounded-lg hover:bg-[#FDECEC] transition-colors cursor-pointer"
                      title="Delete transcript"
                      aria-label="Delete transcript"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Controls */}
        {isAuthenticated && pagination.totalPages > 1 && (
          <div className="p-3 sm:px-4 border-t border-[#EBE8F0] flex items-center justify-between bg-white text-xs">
            <span className="text-[#686B7A]">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                icon={ChevronLeft}
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="secondary"
                icon={ChevronRight}
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete Transcript"
        subtitle="This action cannot be undone"
      >
        <div className="space-y-4">
          <p className="text-xs sm:text-sm text-[#686B7A]">
            Are you sure you want to permanently delete{" "}
            <span className="font-bold text-[#191B2B]">
              &ldquo;{deleteTarget?.title || "Untitled"}&rdquo;
            </span>
            ? All audio notes and AI insights will be removed.
          </p>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="danger"
              icon={Trash2}
              isLoading={isDeleting}
              onClick={handleDeleteConfirm}
            >
              Confirm Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default HistoryLibrary;
