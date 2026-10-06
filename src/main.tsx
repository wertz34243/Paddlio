import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { isPublicWebsiteRequest } from "./public/publicSiteRouting";

const isPublicWebsite = isPublicWebsiteRequest(
  window.location.hostname,
  window.location.pathname,
  import.meta.env.VITE_PUBLIC_SITE_MODE === "true",
);

if (!isPublicWebsite) {
  document.title = "Paddlio";
  const robotsMeta = document.createElement("meta");
  robotsMeta.name = "robots";
  robotsMeta.content = "noindex, nofollow";
  document.head.append(robotsMeta);
}

const rootModule = isPublicWebsite
  ? import("./public/PublicWebsite")
  : Promise.all([import("./styles.css"), import("./App")]).then(([, appModule]) => appModule);

void rootModule.then(({ default: Root }) => {
  createRoot(document.getElementById("root") as HTMLElement).render(<StrictMode><Root /></StrictMode>);
});

const canUseServiceWorker =
  "serviceWorker" in navigator &&
  (window.location.protocol === "https:" ||
    !["localhost", "127.0.0.1", "::1"].includes(window.location.hostname));

if (canUseServiceWorker && !isPublicWebsite) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Paddlio remains fully usable without offline support.
    });
  });
}
