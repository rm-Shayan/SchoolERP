/**
 * Request deduplication utility to prevent duplicate requests
 * Tracks in-flight requests and returns the same promise for duplicates
 */

interface PendingRequest {
  promise: Promise<any>;
  timestamp: number;
}

const pendingRequests = new Map<string, PendingRequest>();

/**
 * Wrap an async function to prevent duplicate concurrent requests
 * @param key - Unique key for the request (e.g., "delete-school-123")
 * @param fn - The async function to execute
 * @returns Promise that resolves/rejects with the result
 */
export async function dedupRequest<T>(
  key: string,
  fn: () => Promise<T>
): Promise<T> {
  // Return existing pending request if it exists
  const existing = pendingRequests.get(key);
  if (existing) {
    return existing.promise;
  }

  // Create new request
  const promise = fn()
    .finally(() => {
      // Clean up after request completes
      pendingRequests.delete(key);
    });

  // Store the pending request
  pendingRequests.set(key, {
    promise,
    timestamp: Date.now(),
  });

  return promise;
}

/**
 * Clear all pending requests (useful for cleanup)
 */
export function clearPendingRequests() {
  pendingRequests.clear();
}

/**
 * Check if a request is currently in-flight
 */
export function isRequestPending(key: string): boolean {
  return pendingRequests.has(key);
}
