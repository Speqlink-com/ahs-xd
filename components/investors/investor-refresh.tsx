"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Investor views refresh from the shared database every 15 seconds while visible. */
export function InvestorRefresh() {
  const router = useRouter();
  useEffect(() => {
    const refresh = () => { if (document.visibilityState === "visible") router.refresh(); };
    const timer = window.setInterval(refresh, 15000);
    document.addEventListener("visibilitychange", refresh);
    return () => { window.clearInterval(timer); document.removeEventListener("visibilitychange", refresh); };
  }, [router]);
  return null;
}
