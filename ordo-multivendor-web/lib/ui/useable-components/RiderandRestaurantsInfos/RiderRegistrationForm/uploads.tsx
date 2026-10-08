"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

// Uploads run in the background so the rider never waits on them; while one
// is in flight its field holds the local preview (a blob: URL). Submitting
// waits for all of them through this tracker.

interface UploadTracker {
  pendingCount: number;
  track: (upload: Promise<unknown>) => void;
  waitForAll: () => Promise<void>;
}

const UploadTrackerContext = createContext<UploadTracker | null>(null);

export const UploadTrackerProvider = ({ children }: { children: React.ReactNode }) => {
  const pending = useRef(new Set<Promise<unknown>>());
  const [pendingCount, setPendingCount] = useState(0);

  const track = useCallback((upload: Promise<unknown>) => {
    pending.current.add(upload);
    setPendingCount(pending.current.size);
    upload.finally(() => {
      pending.current.delete(upload);
      setPendingCount(pending.current.size);
    });
  }, []);

  const waitForAll = useCallback(async () => {
    // uploads can start while we wait, so loop until none are left
    while (pending.current.size) {
      await Promise.allSettled(Array.from(pending.current));
    }
  }, []);

  const value = useMemo(
    () => ({ pendingCount, track, waitForAll }),
    [pendingCount, track, waitForAll]
  );

  return <UploadTrackerContext.Provider value={value}>{children}</UploadTrackerContext.Provider>;
};

export const useUploadTracker = () => useContext(UploadTrackerContext);

export const isLocalPreview = (url?: string) => !!url && url.startsWith("blob:");

// drops in-flight previews, e.g. before saving a draft that outlives the page
export const withoutLocalPreviews = <T,>(value: T): T => {
  if (typeof value === "string") return (isLocalPreview(value) ? "" : value) as T;
  if (Array.isArray(value)) return value.map(withoutLocalPreviews) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, inner]) => [key, withoutLocalPreviews(inner)])
    ) as T;
  }
  return value;
};
