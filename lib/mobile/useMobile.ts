"use client";

import { useEffect, useMemo, useState } from "react";
import { Capacitor } from "@capacitor/core";

export function useMobile() {
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const standalone =
      typeof window !== "undefined" &&
      (window.matchMedia?.("(display-mode: standalone)").matches ||
        // iOS Safari standalone
        // @ts-ignore
        window.navigator?.standalone === true);

    setIsStandalone(!!standalone);
  }, []);

  const isNative = useMemo(() => Capacitor.isNativePlatform(), []);
  const platform = useMemo(() => (isNative ? Capacitor.getPlatform() : "web"), [isNative]);

  return {
    isNative,
    platform, // 'ios' | 'android' | 'web'
    isStandalone, // PWA installed
  };
}
