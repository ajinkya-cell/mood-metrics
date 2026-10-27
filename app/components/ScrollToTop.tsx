"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

// Next's <Link> keeps the scroll position when any part of the new page is
// already in the viewport, so a link clicked from far down (the footer) opened
// the next page scrolled down too. This sends every new route to the top,
// except Back/Forward (which should restore where you were) and #hash links.

export default function ScrollToTop() {
  const pathname = usePathname();
  const fromHistory = useRef(false);
  const first = useRef(true);

  useEffect(() => {
    const onPop = () => (fromHistory.current = true);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (fromHistory.current) {
      fromHistory.current = false;
      return;
    }
    if (window.location.hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  return null;
}
