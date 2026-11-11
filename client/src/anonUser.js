/**
 * Anonymous User ID Helper
 * Generates a unique ID per browser and stores it in localStorage.
 * This replaces Supabase authentication for per-browser history tracking.
 */

const STORAGE_KEY = "speechscribe_anon_id";

export function getAnonUserId() {
  let userId = localStorage.getItem(STORAGE_KEY);
  if (!userId) {
    // Generate a random unique ID
    userId = "anon_" + crypto.randomUUID().replace(/-/g, "").slice(0, 16);
    localStorage.setItem(STORAGE_KEY, userId);
  }
  return userId;
}
