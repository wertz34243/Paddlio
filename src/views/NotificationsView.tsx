import type { NotificationItem } from "../domain/types";

type NotificationsViewProps = {
  notifications: NotificationItem[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
};

const formatDateTime = (value: string): string =>
  new Date(value).toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

const typeLabel = (type: string): string => {
  if (type.includes("training")) return "Training";
  if (type.includes("feedback")) return "Feedback";
  if (type.includes("goal")) return "Ziel";
  if (type.includes("coach")) return "Coach";
  if (type.includes("group")) return "Gruppe";
  return "Info";
};

export function NotificationsView({ notifications, onMarkRead, onMarkAllRead }: NotificationsViewProps) {
  const sorted = [...notifications].sort((a, b) => Number(a.read) - Number(b.read) || b.createdAt.localeCompare(a.createdAt));
  const unreadCount = notifications.filter((notification) => !notification.read).length;

  return (
    <div className="stack">
      <section className="section-block notification-center-head">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Live Updates</p>
            <h3>{unreadCount > 0 ? `${unreadCount} ungelesene Benachrichtigungen` : "Alles gelesen"}</h3>
          </div>
          <button className="primary-button" type="button" onClick={onMarkAllRead} disabled={unreadCount === 0}>
            Alle gelesen
          </button>
        </div>
      </section>

      <section className="calendar-list">
        {sorted.length > 0 ? sorted.map((notification) => (
          <article className={notification.read ? "notification-card read" : "notification-card"} key={notification.id}>
            <div className="plan-card-head">
              <div>
                <span>{typeLabel(notification.type)} - {formatDateTime(notification.createdAt)}</span>
                <h4>{notification.title}</h4>
              </div>
              {!notification.read ? <b className="status-pill planned">Neu</b> : null}
            </div>
            <p>{notification.message || "Keine weiteren Details."}</p>
            {!notification.read ? (
              <div className="card-actions">
                <button type="button" onClick={() => onMarkRead(notification.id)}>Als gelesen markieren</button>
              </div>
            ) : null}
          </article>
        )) : (
          <p className="empty-state">Noch keine Benachrichtigungen. Live-Updates zu Trainings, Feedback und Zielen erscheinen hier.</p>
        )}
      </section>
    </div>
  );
}
