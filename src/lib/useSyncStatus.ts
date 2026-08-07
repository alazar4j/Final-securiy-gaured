import { useState, useEffect } from "react";
import { getPendingSyncOperations } from "./db";

export function useSyncStatus() {
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    const check = async () => {
      try {
        const ops = await getPendingSyncOperations();
        setPendingCount(ops.length);
      } catch (e) {
        // ignore
      }
    };
    check();
    const interval = setInterval(check, 2000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, []);

  return { isOnline, pendingCount };
}
