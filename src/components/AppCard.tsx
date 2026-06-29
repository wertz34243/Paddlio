import type { ReactNode } from "react";
import { Icon, type IconName } from "./Icon";

type CardTone = "primary" | "secondary" | "accent" | "success" | "warning" | "danger" | "muted" | "k1" | "c1";

type AppCardProps = {
  icon: IconName;
  title: string;
  subtitle?: string;
  value?: string;
  tone?: CardTone;
  children?: ReactNode;
  className?: string;
};

export function AppCard({
  icon,
  title,
  subtitle,
  value,
  tone = "primary",
  children,
  className = "",
}: AppCardProps) {
  return (
    <article className={`app-card tone-${tone} ${className}`.trim()}>
      <div className="app-card-accent" aria-hidden="true" />
      <div className="app-card-head">
        <span className="app-card-icon">
          <Icon name={icon} />
        </span>
        <div>
          <h3>{title}</h3>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
      </div>
      {value ? <strong className="app-card-value">{value}</strong> : null}
      {children}
    </article>
  );
}
