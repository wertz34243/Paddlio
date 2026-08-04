import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";
import type { PaddlioOneTheme } from "../../lib/paddlioOneTheme";
import { Icon, type IconName } from "../Icon";

export type PaddlioOneTone = "default" | "primary" | "success" | "warning" | "danger" | "info" | "muted";

type BaseProps = {
  children: ReactNode;
  className?: string;
};

type HeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: IconName;
  loading?: boolean;
  variant?: "primary" | "secondary" | "ghost" | "danger";
};

export function PaddlioOnePageShell({
  children,
  className = "",
  theme,
}: BaseProps & { theme?: PaddlioOneTheme }) {
  return (
    <div className={`po-page-shell ${className}`.trim()} data-po-theme={theme}>
      {children}
    </div>
  );
}

export function PaddlioOneAppShell({
  sidebar,
  children,
  context,
  className = "",
}: {
  sidebar?: ReactNode;
  children: ReactNode;
  context?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`po-app-shell ${className}`.trim()}>
      {sidebar ? <aside className="po-sidebar">{sidebar}</aside> : null}
      <main className="po-app-main">{children}</main>
      {context ? <aside className="po-context-panel">{context}</aside> : null}
    </div>
  );
}

export function PaddlioOneToolbar({ children, className = "" }: BaseProps) {
  return <div className={`po-toolbar ${className}`.trim()}>{children}</div>;
}

export function PaddlioOneContentGrid({ children, className = "" }: BaseProps) {
  return <section className={`po-content-grid ${className}`.trim()}>{children}</section>;
}

export function PaddlioOneMasterDetailLayout({
  master,
  detail,
  className = "",
}: {
  master: ReactNode;
  detail: ReactNode;
  className?: string;
}) {
  return (
    <section className={`po-master-detail ${className}`.trim()}>
      <div>{master}</div>
      <div>{detail}</div>
    </section>
  );
}

export function PaddlioOnePageHeader({ eyebrow, title, description, action, className = "" }: HeaderProps) {
  return (
    <header className={`po-page-header ${className}`.trim()}>
      <div>
        {eyebrow ? <p className="po-eyebrow">{eyebrow}</p> : null}
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
      </div>
      {action ? <div className="po-header-action">{action}</div> : null}
    </header>
  );
}

export function PaddlioOneSectionHeader({ eyebrow, title, description, action, className = "" }: HeaderProps) {
  return (
    <header className={`po-section-header ${className}`.trim()}>
      <div>
        {eyebrow ? <p className="po-eyebrow">{eyebrow}</p> : null}
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      {action ? <div className="po-header-action">{action}</div> : null}
    </header>
  );
}

export function PaddlioOneCard({
  children,
  className = "",
  tone = "default",
}: BaseProps & { tone?: PaddlioOneTone }) {
  return <section className={`po-card po-tone-${tone} ${className}`.trim()}>{children}</section>;
}

export function PaddlioOneMetricCard({
  label,
  value,
  detail,
  icon,
  tone = "default",
}: {
  label: string;
  value: string | number;
  detail?: string;
  icon?: IconName;
  tone?: PaddlioOneTone;
}) {
  return (
    <article className={`po-metric-card po-tone-${tone}`}>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        {detail ? <small>{detail}</small> : null}
      </div>
      {icon ? (
        <span className="po-icon-box" aria-hidden="true">
          <Icon name={icon} />
        </span>
      ) : null}
    </article>
  );
}

export function PaddlioOneButton({
  children,
  icon,
  loading = false,
  variant = "secondary",
  className = "",
  disabled,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`po-button po-button-${variant} ${className}`.trim()}
      disabled={disabled || loading}
      type={type}
      {...props}
    >
      {icon ? <Icon name={icon} /> : null}
      <span>{loading ? "Lädt ..." : children}</span>
    </button>
  );
}

export function PaddlioOneIconButton({
  label,
  icon,
  variant = "secondary",
  className = "",
  ...props
}: Omit<ButtonProps, "children" | "icon"> & { label: string; icon: IconName }) {
  return (
    <button className={`po-icon-button po-button-${variant} ${className}`.trim()} aria-label={label} type="button" {...props}>
      <Icon name={icon} />
    </button>
  );
}

export function PaddlioOneStatusChip({
  children,
  tone = "default",
  icon,
}: BaseProps & { tone?: PaddlioOneTone; icon?: IconName }) {
  return (
    <span className={`po-status-chip po-tone-${tone}`}>
      {icon ? <Icon name={icon} /> : null}
      <span>{children}</span>
    </span>
  );
}

export function PaddlioOneListRow({
  title,
  meta,
  value,
  icon,
  tone = "default",
}: {
  title: string;
  meta?: string;
  value?: string;
  icon?: IconName;
  tone?: PaddlioOneTone;
}) {
  return (
    <article className={`po-list-row po-tone-${tone}`}>
      {icon ? (
        <span className="po-icon-box" aria-hidden="true">
          <Icon name={icon} />
        </span>
      ) : null}
      <div>
        <strong>{title}</strong>
        {meta ? <small>{meta}</small> : null}
      </div>
      {value ? <em>{value}</em> : null}
    </article>
  );
}

export function PaddlioOneTextField({
  label,
  helper,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; helper?: string }) {
  const fieldId = props.id ?? `po-field-${label.toLowerCase().replace(/\W+/g, "-")}`;
  return (
    <label className="po-field" htmlFor={fieldId}>
      <span>{label}</span>
      <input id={fieldId} {...props} />
      {helper ? <small>{helper}</small> : null}
    </label>
  );
}

export function PaddlioOneEmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <section className="po-empty-state">
      <h2>{title}</h2>
      {description ? <p>{description}</p> : null}
      {action ? <div>{action}</div> : null}
    </section>
  );
}

export function PaddlioOneErrorState({
  title,
  description,
  details,
}: {
  title: string;
  description?: string;
  details?: string;
}) {
  return (
    <section className="po-error-state" role="alert">
      <h2>{title}</h2>
      {description ? <p>{description}</p> : null}
      {details ? (
        <details>
          <summary>Technische Details</summary>
          <pre>{details}</pre>
        </details>
      ) : null}
    </section>
  );
}
