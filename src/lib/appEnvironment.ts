export type AppEnvironment = "production" | "development" | "preview" | "test";

const normalizeEnvironment = (value: unknown): AppEnvironment => {
  if (typeof value !== "string") return import.meta.env.DEV ? "development" : "production";
  const normalized = value.trim().toLowerCase();
  if (normalized === "development" || normalized === "dev") return "development";
  if (normalized === "preview") return "preview";
  if (normalized === "test") return "test";
  return "production";
};

export const APP_ENVIRONMENT: AppEnvironment = normalizeEnvironment(import.meta.env.VITE_APP_ENV);

export const isProductionEnvironment = APP_ENVIRONMENT === "production";
export const isDevelopmentEnvironment = APP_ENVIRONMENT === "development" || APP_ENVIRONMENT === "preview" || APP_ENVIRONMENT === "test";

export const APP_ENVIRONMENT_LABEL = isProductionEnvironment ? "Production" : APP_ENVIRONMENT.toUpperCase();
