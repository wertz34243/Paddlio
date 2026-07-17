export type DeviceProvider = "polar" | "garmin" | "apple_health" | "strava" | "coros" | "suunto";

export type DeviceConnectionState = "disconnected" | "prepared" | "connected" | "expired" | "error";

export type DeviceAdapterCapability =
  | "oauth"
  | "manual_sync"
  | "background_sync"
  | "delta_sync"
  | "heart_rate"
  | "gps"
  | "zones"
  | "training_load"
  | "material_context";

export type DeviceAdapterDefinition = {
  provider: DeviceProvider;
  label: string;
  status: "active" | "prepared";
  capabilities: DeviceAdapterCapability[];
};

export const deviceAdapters: DeviceAdapterDefinition[] = [
  {
    provider: "polar",
    label: "Polar Flow",
    status: "active",
    capabilities: ["oauth", "manual_sync", "background_sync", "delta_sync", "heart_rate", "gps", "zones", "training_load", "material_context"],
  },
  { provider: "garmin", label: "Garmin Connect", status: "prepared", capabilities: ["oauth", "manual_sync", "heart_rate", "gps", "zones"] },
  { provider: "apple_health", label: "Apple Health", status: "prepared", capabilities: ["manual_sync", "heart_rate", "gps", "zones"] },
  { provider: "strava", label: "Strava", status: "prepared", capabilities: ["oauth", "manual_sync", "gps"] },
  { provider: "coros", label: "Coros", status: "prepared", capabilities: ["oauth", "manual_sync", "heart_rate", "gps"] },
  { provider: "suunto", label: "Suunto", status: "prepared", capabilities: ["oauth", "manual_sync", "heart_rate", "gps"] },
];
