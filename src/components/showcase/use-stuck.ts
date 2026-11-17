"use client";

import { useEffect, useRef, useState } from "react";

// True once a sticky bar has reached the top of the window: a 1px sentinel placed just above
// the bar scrolls out of view at that moment. One observer, no scroll listener.
export function useStuck() {
  const sentinel = useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setStuck(!entry.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return { sentinel, stuck };
}
