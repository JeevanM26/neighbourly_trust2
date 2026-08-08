"use client";
import React, { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

export const OfflineBanner: React.FC = () => {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    if (typeof window !== "undefined") {
      setIsOffline(!navigator.onLine);
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      }
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[10000] bg-red-500 text-white p-2 text-center text-sm font-semibold flex items-center justify-center gap-2 animate-slide-down">
      <WifiOff className="w-4 h-4" />
      You are currently offline. Check your internet connection.
    </div>
  );
};
