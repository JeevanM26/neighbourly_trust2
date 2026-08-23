"use client";
import React, { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";import { useApp } from "@/context/AppContext";

export const OfflineBanner: React.FC = () => {
  // Lazy initializer reads navigator.onLine once at mount without a sync setState in an effect
  const [isOffline, setIsOffline] = useState(() =>
    typeof window !== "undefined" ? !navigator.onLine : false
  );
  const { t } = useApp();

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    if (typeof window !== "undefined") {
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
      {t('offline_message')}
    </div>
  );
};
