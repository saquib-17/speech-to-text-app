import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  FileText,
  Clock,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Mic,
  AudioWaveform,
} from "lucide-react";
import Badge from "../components/common/Badge";
import Button from "../components/common/Button";
import Modal from "../components/common/Modal";
import Skeleton from "../components/common/Skeleton";
import api from "../api/client";
import { useToast } from "../context/ToastContext";

export const HistoryLibrary = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [transcripts, setTranscripts] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalCount: 0 });
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchTranscripts();
  }, [page, search]);

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
    <div className="space-y-3.5">
      {/* Top Controls Bar (Compact) */}
      <div className="p-3 sm:px-4 sm:py-2.5 rounded-xl bg-pure-white border border-warm-grey shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-stone-grey absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search transcripts by title or keyword..."
            className="w-full bg-warm-ivory border border-warm-grey rounded-lg pl-8 pr-3 py-1.5 text-xs text-charcoal placeholder:text-stone-grey focus:outline-none focus:border-amber-brand focus:ring-2 focus:ring-amber-brand/20 shadow-2xs"
          />
        </div>

        {/* Counter & Action */}
        <div className="flex items-center justify-between sm:justify-end gap-2.5">
          <span className="text-xs text-stone-grey font-medium">
            <span className="font-mono">{pagination.totalCount}</span> {pagination.totalCount === 1 ? "record" : "records"}
          </span>

          <Button
            size="sm"
            variant="primary"
            icon={Mic}
            onClick={() => navigate("/studio")}
          >
            New Audio
          </Button>
        </div>
      </div>

      {/* Transcript List Card (Compact List) */}
      <div className="rounded-xl bg-pure-white border border-warm-grey overflow-hidden shadow-2xs">
        {isLoading ? (
          <div className="p-4 space-y-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <Skeleton key={n} className="h-14 w-full" />
            ))}
          </div>
        ) : transcripts.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <FileText className="w-10 h-10 text-stone-grey/40 mx-auto mb-2" />
            <h3 className="text-sm sm:text-base font-semibold text-charcoal">
              {search ? "No matching transcripts found" : "No transcripts yet"}
            </h3>
            <p className="text-xs text-stone-grey max-w-sm mx-auto mt-0.5 mb-4">
              {search
                ? `No transcripts match "${search}". Try searching another keyword.`
                : "Record speech or upload audio files to start building your knowledge base."}
            </p>
            {!search && (
              <Button
                size="sm"
                variant="primary"
                icon={Mic}
                onClick={() => navigate("/studio")}
              >
                Launch Audio Studio
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-warm-grey/60">
            {transcripts.map((t) => {
              const wordCount = t.transcriptionText?.trim().split(/\s+/).filter(Boolean).length || 0;
              const meta = t.transcriptionMetadata || {};
              const audioMeta = t.audioMetadata || {};
              const duration = meta.durationSeconds || audioMeta.durationSeconds || 0;

              return (
                <div
                  key={t._id}
                  className="p-3 sm:px-4 sm:py-2.5 hover:bg-warm-ivory/60 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 group"
                >
                  <div
                    onClick={() => navigate(`/editor/${t._id}`)}
                    className="flex-1 min-w-0 cursor-pointer flex items-start gap-2.5"
                  >
                    <div className="w-7 h-7 rounded-lg bg-warm-ivory border border-warm-grey/80 flex items-center justify-center text-amber-brand shrink-0 group-hover:border-amber-brand/40 group-hover:bg-amber-brand-light transition-colors mt-0.5">
                      <AudioWaveform className="w-3.5 h-3.5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs sm:text-sm font-semibold text-charcoal group-hover:text-amber-brand truncate transition-colors">
                        {t.title || "Untitled Recording"}
                      </h4>
                      <p className="text-[11px] text-stone-grey mt-0.5 line-clamp-1">
                        {t.transcriptionText || "No audible text."}
                      </p>

                      <div className="flex flex-wrap items-center gap-2 mt-1 text-[10px] font-mono text-stone-grey">
                        <span className="flex items-center gap-1 bg-pure-white px-1.5 py-0.2 rounded border border-warm-grey/70">
                          <Clock className="w-2.5 h-2.5 text-amber-brand" />
                          {formatDuration(duration)}
                        </span>
                        <span>•</span>
                        <span>{wordCount} words</span>
                        <span>•</span>
                        <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                        <span>•</span>
                        <span className="uppercase text-[9px] px-1 py-0.2 rounded bg-amber-brand-light text-amber-brand font-bold">
                          {meta.language?.toUpperCase() || "EN"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-1.5 sm:pt-0 border-t sm:border-t-0 border-warm-grey/60">
                    <Badge variant={t.status === "completed" ? "completed" : "processing"} size="sm">
                      {t.status || "completed"}
                    </Badge>

                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => navigate(`/editor/${t._id}`)}
                      className="px-2 py-0.5 text-xs"
                    >
                      Open
                    </Button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(t);
                      }}
                      className="p-1 text-stone-grey hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
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

        {/* Pagination Footer */}
        {pagination.totalPages > 1 && (
          <div className="px-3.5 py-2 sm:px-4 border-t border-warm-grey/60 flex items-center justify-between text-[11px] font-mono">
            <span className="text-stone-grey">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>

            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant="secondary"
                icon={ChevronLeft}
                disabled={!pagination.hasPrevPage}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              >
                Previous
              </Button>

              <Button
                size="sm"
                variant="secondary"
                disabled={!pagination.hasNextPage}
                onClick={() => setPage((prev) => prev + 1)}
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
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
        subtitle="This action cannot be undone."
      >
        <div className="space-y-3 pt-1">
          <p className="text-xs text-stone-grey">
            Are you sure you want to permanently delete{" "}
            <strong className="text-charcoal">"{deleteTarget?.title}"</strong>?
          </p>

          <div className="flex justify-end gap-2 pt-2">
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
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default HistoryLibrary;
