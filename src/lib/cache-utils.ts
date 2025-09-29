/**
 * Client-side cache clearing utilities
 * Helps resolve browser caching issues that can affect authentication
 */

export const clearBrowserCache = async (): Promise<void> => {
  try {
    // Clear service worker caches if available
    if ("caches" in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map((cacheName) => caches.delete(cacheName)),
      );
      console.log("Browser caches cleared");
    }

    // Clear localStorage and sessionStorage
    if (typeof Storage !== "undefined") {
      localStorage.clear();
      sessionStorage.clear();
      console.log("Storage cleared");
    }

    // Force reload from server (bypasses cache)
    if (typeof window !== "undefined") {
      // Use location.reload(true) equivalent for modern browsers
      window.location.href = window.location.href + "?cache-bust=" + Date.now();
    }
  } catch (error) {
    console.warn("Cache clearing failed:", error);
  }
};

export const addCacheBustingToUrl = (url: string): string => {
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}t=${Date.now()}`;
};

export const getCacheBustingHeaders = () => ({
  "Cache-Control": "no-cache, no-store, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
});

export const fetchWithCacheBusting = async (
  url: string,
  options: RequestInit = {},
) => {
  const cacheBustedUrl = addCacheBustingToUrl(url);
  const headers = {
    ...getCacheBustingHeaders(),
    ...options.headers,
  };

  return fetch(cacheBustedUrl, {
    ...options,
    headers,
    cache: "no-store",
  });
};
