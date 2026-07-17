import { useEffect, useRef, useState } from "react";

type AutoHideOptions = {
  threshold?: number;
  topOffset?: number;
};

export function useAutoHideOnScroll(options: AutoHideOptions = {}) {
  const { threshold = 8, topOffset = 8 } = options;
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollYRef = useRef(0);
  const tickingRef = useRef(false);

  useEffect(() => {
    const getScrollY = () =>
      window.scrollY ||
      document.documentElement.scrollTop ||
      document.body.scrollTop ||
      0;

    const update = () => {
      const currentScrollY = Math.max(0, getScrollY());
      const lastScrollY = lastScrollYRef.current;
      const delta = currentScrollY - lastScrollY;

      if (currentScrollY <= topOffset) {
        setIsVisible(true);
      } else if (Math.abs(delta) >= threshold) {
        setIsVisible(delta < 0);
      }

      lastScrollYRef.current = currentScrollY;
      tickingRef.current = false;
    };

    const onScroll = () => {
      if (!tickingRef.current) {
        window.requestAnimationFrame(update);
        tickingRef.current = true;
      }
    };

    lastScrollYRef.current = getScrollY();
    setIsVisible(lastScrollYRef.current <= topOffset);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [threshold, topOffset]);

  return isVisible;
}
