import { useEffect, useState } from "react";
import { getResponsiveCapabilities, type ResponsiveCapabilities } from "../lib/deviceCapabilities";

function readCapabilities(): ResponsiveCapabilities {
  if (typeof window === "undefined") {
    return getResponsiveCapabilities({ width: 1200, pointer: "fine", hover: true });
  }

  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  const pointer = coarsePointer ? "coarse" : finePointer ? "fine" : "none";
  const hover = window.matchMedia("(hover: hover)").matches;
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);

  return getResponsiveCapabilities({
    width: window.innerWidth,
    pointer,
    hover,
    standalone,
    platform: window.navigator.platform,
    userAgent: window.navigator.userAgent,
  });
}

export function useResponsiveCapabilities(): ResponsiveCapabilities {
  const [capabilities, setCapabilities] = useState<ResponsiveCapabilities>(() => readCapabilities());

  useEffect(() => {
    const update = () => setCapabilities(readCapabilities());
    const coarsePointer = window.matchMedia("(pointer: coarse)");
    const hover = window.matchMedia("(hover: hover)");

    window.addEventListener("resize", update, { passive: true });
    window.addEventListener("orientationchange", update, { passive: true });
    coarsePointer.addEventListener("change", update);
    hover.addEventListener("change", update);

    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
      coarsePointer.removeEventListener("change", update);
      hover.removeEventListener("change", update);
    };
  }, []);

  return capabilities;
}
