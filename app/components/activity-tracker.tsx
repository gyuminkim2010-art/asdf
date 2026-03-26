"use client";

import { useEffect } from "react";

export default function ActivityTracker() {
  useEffect(() => {
    const interval = setInterval(() => {
      fetch("/api/activity", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          seconds: 30,
        }),
      }).catch(() => {});
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return null;
}