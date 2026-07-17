import { useCallback, useEffect, useRef, useState } from "react";

type AutoHideOptions = {
  threshold?: number;
  topOffset?: number;
  idleMs?: number;
};

type AppChromeVisibility = {
  topChromeVisible: boolean;
  bottomNavVisible: boolean;
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

export function useAppChromeVisibility(options: AutoHideOptions = {}): AppChromeVisibility {
  const { threshold = 8, topOffset = 8, idleMs = 1300 } = options;
  const [topChromeVisible, setTopChromeVisible] = useState(true);
  const [bottomNavVisible, setBottomNavVisible] = useState(true);
  const lastScrollYRef = useRef(0);
  const tickingRef = useRef(false);
  const idleTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);

  const getScrollY = useCallback(
    () =>
      Math.max(
        0,
        window.scrollY ||
          document.documentElement.scrollTop ||
          document.body.scrollTop ||
          0,
      ),
    [],
  );

  const showBottomTemporarily = useCallback(() => {
    setBottomNavVisible(true);

    if (idleTimerRef.current) {
      window.clearTimeout(idleTimerRef.current);
    }

    idleTimerRef.current = window.setTimeout(() => {
      if (getScrollY() > topOffset) {
        setBottomNavVisible(false);
      }
    }, idleMs);
  }, [getScrollY, idleMs, topOffset]);

  useEffect(() => {
    const update = () => {
      const currentScrollY = getScrollY();
      const lastScrollY = lastScrollYRef.current;
      const delta = currentScrollY - lastScrollY;

      if (currentScrollY <= topOffset) {
        setTopChromeVisible(true);
        setBottomNavVisible(true);
      } else if (Math.abs(delta) >= threshold) {
        const scrollingUp = delta < 0;
        setTopChromeVisible(scrollingUp);
        if (scrollingUp) {
          showBottomTemporarily();
        }
      }

      lastScrollYRef.current = currentScrollY;
      tickingRef.current = false;
    };

    const onScroll = () => {
      showBottomTemporarily();

      if (!tickingRef.current) {
        window.requestAnimationFrame(update);
        tickingRef.current = true;
      }
    };

    const onInteraction = () => {
      showBottomTemporarily();
    };

    lastScrollYRef.current = getScrollY();
    setTopChromeVisible(lastScrollYRef.current <= topOffset);
    setBottomNavVisible(true);

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    window.addEventListener("wheel", onInteraction, { passive: true });
    window.addEventListener("touchstart", onInteraction, { passive: true });
    window.addEventListener("touchmove", onInteraction, { passive: true });
    window.addEventListener("pointerdown", onInteraction, { passive: true });
    window.addEventListener("keydown", onInteraction);

    showBottomTemporarily();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("wheel", onInteraction);
      window.removeEventListener("touchstart", onInteraction);
      window.removeEventListener("touchmove", onInteraction);
      window.removeEventListener("pointerdown", onInteraction);
      window.removeEventListener("keydown", onInteraction);

      if (idleTimerRef.current) {
        window.clearTimeout(idleTimerRef.current);
      }
    };
  }, [getScrollY, showBottomTemporarily, threshold, topOffset]);

  return { topChromeVisible, bottomNavVisible };
}
