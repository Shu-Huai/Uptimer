"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type FeedbackBannerProps = {
  success?: string;
  error?: string;
};

type ToastTone = "success" | "error";

function FeedbackToast({ message, tone }: { message: string; tone: ToastTone }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setVisible(false);
    }, 2800);

    return () => window.clearTimeout(timer);
  }, []);

  if (!visible) {
    return null;
  }

  const toast = (
    <div
      className="pointer-events-none absolute left-1/2 top-3 z-[95] w-[calc(100%-1.5rem)] max-w-[392px] -translate-x-1/2"
      role="status"
      aria-live="polite"
    >
      <div
        className={`rounded-2xl border px-4 py-3 text-sm shadow-[0_16px_36px_rgba(24,43,74,0.24)] backdrop-blur-[7px] ${
        tone === "error"
          ? "border-rose-200 bg-[linear-gradient(180deg,rgba(255,241,242,0.98)_0%,rgba(255,246,247,0.96)_100%)] text-rose-700"
          : "border-emerald-200 bg-[linear-gradient(180deg,rgba(236,253,245,0.98)_0%,rgba(240,253,248,0.96)_100%)] text-emerald-700"
      }`}
      >
        {message}
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  const overlayRoot = document.getElementById("uptimer-overlay-root");
  if (!overlayRoot) return null;

  return createPortal(toast, overlayRoot);
}

export function FeedbackBanner({ success, error }: FeedbackBannerProps) {
  if (error) {
    return <FeedbackToast key={`e:${error}`} message={error} tone="error" />;
  }

  if (success) {
    return <FeedbackToast key={`s:${success}`} message={success} tone="success" />;
  }

  return null;
}
