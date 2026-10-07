import { useEffect, useCallback, useRef } from "react";

interface CleanupState {
  audioBlob: Blob | null;
  objectUrls: string[];
}

/**
 * Browser-only privacy cleanup for session data.
 * - Revokes object URLs
 * - Drops the audio blob reference
 * - Clears sessionStorage
 */
export function usePrivacyCleanup() {
  const cleanupStateRef = useRef<CleanupState>({ audioBlob: null, objectUrls: [] });

  const trackObjectUrl = useCallback((url: string) => {
    cleanupStateRef.current.objectUrls.push(url);
  }, []);

  const trackAudioBlob = useCallback((audio: Blob | null) => {
    cleanupStateRef.current.audioBlob = audio;
  }, []);

  const revokeAllObjectUrls = useCallback(() => {
    cleanupStateRef.current.objectUrls.forEach((url) => {
      try {
        URL.revokeObjectURL(url);
      } catch {
        // Ignore errors revoking URLs
      }
    });
    cleanupStateRef.current.objectUrls = [];
  }, []);

  const performFullCleanup = useCallback(() => {
    revokeAllObjectUrls();
    cleanupStateRef.current.audioBlob = null;
    try {
      sessionStorage.removeItem("session_analysis_state");
    } catch {
      // Ignore storage errors
    }
  }, [revokeAllObjectUrls]);

  useEffect(() => {
    const handleBeforeUnload = () => performFullCleanup();
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") revokeAllObjectUrls();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [performFullCleanup, revokeAllObjectUrls]);

  return { trackObjectUrl, trackAudioBlob, revokeAllObjectUrls, performFullCleanup };
}
