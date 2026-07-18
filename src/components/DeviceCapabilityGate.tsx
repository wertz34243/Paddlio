import type { ReactNode } from "react";
import type { UserRole } from "../domain/types";
import { getFeatureMode, type DeviceClass, type FeatureId } from "../lib/deviceCapabilities";

export function DeviceCapabilityGate({
  feature,
  role,
  deviceClass,
  children,
  fallback = null,
}: {
  feature: FeatureId;
  role: UserRole;
  deviceClass: DeviceClass;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return getFeatureMode(feature, role, deviceClass) === "hidden" ? <>{fallback}</> : <>{children}</>;
}

export function ContinueOnLargerDevice({ title = "Auf Tablet oder Computer fortsetzen" }: { title?: string }) {
  return (
    <section className="empty-state device-limited-state" aria-live="polite">
      <strong>{title}</strong>
      <p>Diese Funktion lässt sich auf einem größeren Bildschirm übersichtlicher und sicherer bearbeiten.</p>
    </section>
  );
}
