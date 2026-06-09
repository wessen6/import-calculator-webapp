"use client";

import { recordPwaVisit } from "@/lib/pwa-tracking";
import { useEffect } from "react";

export function PwaVisitTracker() {
  useEffect(() => {
    recordPwaVisit();
  }, []);

  return null;
}
