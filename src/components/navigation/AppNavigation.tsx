import { APP_SLOGAN, APP_VERSION } from "../../brand";
import { getDisplayName, getInitials } from "../../domain/profile";
import type { PageId, User } from "../../domain/types";
import { Icon, type IconName } from "../Icon";

export type MainNavItem = { id: PageId; label: string; icon: IconName };

export const mainNavItems: MainNavItem[] = [
  { id: "dashboard", label: "Heute", icon: "home" },
  { id: "training", label: "Training", icon: "training" },
  { id: "analysis", label: "Analyse", icon: "chart" },
  { id: "communication", label: "Team", icon: "message" },
  { id: "more", label: "Mehr", icon: "more" },
];

const roleLabelMap: Record<string, string> = {
  athlete: "Sportler",
  coach: "Trainer",
  clubAdmin: "ClubAdmin",
  teamAdmin: "TeamAdmin",
  admin: "Admin",
};

const bottomNavAriaLabel = (pageId: PageId): string => {
  if (pageId === "dashboard") return "Zur Heute-Übersicht wechseln";
  if (pageId === "training") return "Training-Bereich öffnen";
  if (pageId === "analysis") return "Analyse-Bereich öffnen";
  if (pageId === "communication") return "Team-Bereich öffnen";
  return "Mehr-Bereich öffnen";
};

export function DesktopSideNavigation({
  appName,
  appSlogan = APP_SLOGAN,
  appVersion = APP_VERSION,
  activePage,
  user,
  onNavigate,
}: {
  appName: string;
  appSlogan?: string;
  appVersion?: string;
  activePage: PageId;
  user: User;
  onNavigate: (page: PageId) => void;
}) {
  return (
    <aside className="desktop-side-nav app-sidebar" aria-label="Desktop-Navigation" data-testid="app-sidebar">
      <div className="desktop-brand">
        <span aria-hidden="true">{appName.slice(0, 1)}</span>
        <div>
          <strong>{appName}</strong>
          <small>{appSlogan}</small>
        </div>
      </div>
      <div className="desktop-user-card">
        <span aria-hidden="true">{getInitials(user.profile)}</span>
        <div>
          <strong>{getDisplayName(user.profile)}</strong>
          <small>{roleLabelMap[user.role] ?? user.role} · Version {appVersion}</small>
        </div>
      </div>
      <nav className="desktop-nav-list" aria-label="Hauptnavigation Desktop">
        {mainNavItems.map((item) => (
          <button
            className={activePage === item.id ? "desktop-nav-item active" : "desktop-nav-item"}
            key={item.id}
            type="button"
            onClick={() => onNavigate(item.id)}
            aria-current={activePage === item.id ? "page" : undefined}
          >
            <span className="desktop-nav-icon" aria-hidden="true">
              <Icon name={item.icon} />
            </span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}

export function BottomNavigation({
  activePage,
  visible,
  onNavigate,
}: {
  activePage: PageId;
  visible: boolean;
  onNavigate: (page: PageId) => void;
}) {
  return (
    <nav
      className={`bottom-nav bottom-navigation ${visible ? "is-visible" : "is-idle-hidden"}`}
      aria-label="Hauptnavigation"
      data-testid="bottom-navigation"
    >
      {mainNavItems.map((item) => (
        <button
          className={activePage === item.id ? "nav-item active" : "nav-item"}
          key={item.id}
          type="button"
          onClick={() => onNavigate(item.id)}
          aria-current={activePage === item.id ? "page" : undefined}
          aria-label={bottomNavAriaLabel(item.id)}
        >
          <span className="nav-icon" aria-hidden="true">
            <Icon name={item.icon} />
          </span>
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
