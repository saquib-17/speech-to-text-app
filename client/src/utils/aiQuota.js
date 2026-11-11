/**
 * SpeechScribe AI — Gemini Quota & Cooldown Utilities (Frontend)
 *
 * Tracks known 429 quota exhaustion state to prevent redundant repeated
 * requests, display friendly countdown timers, and disable AI action buttons.
 */

const QUOTA_STORAGE_KEY = "speechscribe_ai_quota_cooldown";
export const QUOTA_EVENT_NAME = "speechscribe:quota-cooldown-updated";

/**
 * Record a quota cooldown from a 429 API response or sync
 * @param {Object} params
 * @param {number} [params.retryAfter] - Remaining seconds
 * @param {string} [params.retryAt] - ISO timestamp string
 * @param {string} [params.message] - Friendly message
 */
export const recordQuotaCooldown = ({ retryAfter, retryAt, message }) => {
  const seconds = Number(retryAfter) || 60;
  const targetTime = retryAt ? new Date(retryAt).getTime() : Date.now() + seconds * 1000;

  const data = {
    isCooldownActive: true,
    retryAt: new Date(targetTime).toISOString(),
    message:
      message ||
      "Daily Gemini AI request limit reached (20 requests/day free tier). AI summaries and Q&A will resume once the quota resets.",
  };

  try {
    localStorage.setItem(QUOTA_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage might be unavailable or full
  }

  // Notify any listening components
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(QUOTA_EVENT_NAME, { detail: data }));
  }
};

/**
 * Retrieve current quota cooldown status
 * @returns {{ isCooldownActive: boolean, remainingSeconds: number, retryAt: string | null, message: string | null }}
 */
export const getQuotaCooldown = () => {
  try {
    const raw = localStorage.getItem(QUOTA_STORAGE_KEY);
    if (!raw) {
      return { isCooldownActive: false, remainingSeconds: 0, retryAt: null, message: null };
    }

    const data = JSON.parse(raw);
    if (!data.retryAt) {
      clearQuotaCooldown();
      return { isCooldownActive: false, remainingSeconds: 0, retryAt: null, message: null };
    }

    const targetTime = new Date(data.retryAt).getTime();
    const now = Date.now();

    if (targetTime > now) {
      const remainingSeconds = Math.ceil((targetTime - now) / 1000);
      return {
        isCooldownActive: true,
        remainingSeconds,
        retryAt: data.retryAt,
        message: data.message,
      };
    }

    // Cooldown has expired
    clearQuotaCooldown();
    return { isCooldownActive: false, remainingSeconds: 0, retryAt: null, message: null };
  } catch {
    return { isCooldownActive: false, remainingSeconds: 0, retryAt: null, message: null };
  }
};

/**
 * Clear the quota cooldown state
 */
export const clearQuotaCooldown = () => {
  try {
    localStorage.removeItem(QUOTA_STORAGE_KEY);
  } catch {
    // Ignore
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(QUOTA_EVENT_NAME, {
        detail: { isCooldownActive: false, remainingSeconds: 0, retryAt: null, message: null },
      })
    );
  }
};

/**
 * Format remaining seconds into a readable countdown string:
 * e.g., "14h 23m 10s", "5m 45s", or "42s"
 * @param {number} totalSeconds
 * @returns {string}
 */
export const formatRetryCountdown = (totalSeconds) => {
  const sec = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const hours = Math.floor(sec / 3600);
  const minutes = Math.floor((sec % 3600) / 60);
  const seconds = sec % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
};

/**
 * Format target ISO timestamp into a friendly time string
 * @param {string} isoString
 * @returns {string}
 */
export const formatResetTime = (isoString) => {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  } catch {
    return "";
  }
};

