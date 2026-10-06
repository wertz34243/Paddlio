const PUBLIC_HOSTS = new Set(["paddlio.de", "www.paddlio.de"]);
export const PUBLIC_PREVIEW_PREFIX = "/public-preview";

export const isPublicWebsiteRequest = (hostname: string, pathname: string, forcePublic = false): boolean =>
  forcePublic || PUBLIC_HOSTS.has(hostname.toLowerCase()) || pathname === PUBLIC_PREVIEW_PREFIX || pathname.startsWith(`${PUBLIC_PREVIEW_PREFIX}/`);

export const getPublicRoute = (pathname: string): string => {
  if (pathname === PUBLIC_PREVIEW_PREFIX) return "/";
  if (pathname.startsWith(`${PUBLIC_PREVIEW_PREFIX}/`)) {
    return pathname.slice(PUBLIC_PREVIEW_PREFIX.length) || "/";
  }
  return pathname || "/";
};

export const publicHref = (route: string, preview: boolean): string =>
  preview ? `${PUBLIC_PREVIEW_PREFIX}${route === "/" ? "" : route}` : route;

export const getPublicAppUrl = (hostname: string, configuredUrl?: string): string => {
  const candidate = configuredUrl?.trim();
  if (candidate) return candidate;
  return PUBLIC_HOSTS.has(hostname.toLowerCase()) ? "https://app.paddlio.de" : "https://dev.paddlio.de";
};
