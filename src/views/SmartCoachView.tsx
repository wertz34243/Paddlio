import { useMemo, useState } from "react";
import { buildSmartCoachRecommendations, getSmartCoachCategoryLabel } from "../domain/smartCoach";
import type { PaddleMotionData, SmartCoachCategory, SmartCoachPriority, SmartCoachRecommendation, User } from "../domain/types";

type SmartCoachViewProps = {
  data: PaddleMotionData;
  user: User;
  compact?: boolean;
  onOpenDetails?: () => void;
  onUpdateRecommendation: (recommendation: SmartCoachRecommendation, updates: Partial<Pick<SmartCoachRecommendation, "status" | "note">>) => void;
};

type PriorityFilter = "all" | SmartCoachPriority;
type CategoryFilter = "all" | SmartCoachCategory;

const priorityLabel: Record<SmartCoachPriority, string> = {
  high: "hoch",
  medium: "mittel",
  low: "niedrig",
};

const priorityOptions: PriorityFilter[] = ["all", "high", "medium", "low"];

const categoryOptions: CategoryFilter[] = [
  "all",
  "training",
  "regeneration",
  "technik",
  "ausdauer",
  "kraft",
  "wettkampf",
  "ziele",
  "material",
  "warnung",
  "motivation",
];

const iconForCategory = (category: SmartCoachCategory): string => {
  if (category === "regeneration") return "R";
  if (category === "technik") return "T";
  if (category === "ausdauer") return "A";
  if (category === "wettkampf") return "W";
  if (category === "ziele") return "Z";
  if (category === "material") return "M";
  if (category === "warnung") return "!";
  if (category === "motivation") return "+";
  if (category === "kraft") return "K";
  return "P";
};

export function SmartCoachView({ data, user, compact = false, onOpenDetails, onUpdateRecommendation }: SmartCoachViewProps) {
  const [priority, setPriority] = useState<PriorityFilter>("all");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [athleteQuery, setAthleteQuery] = useState("");
  const [noteById, setNoteById] = useState<Record<string, string>>({});

  const recommendations = useMemo(() => buildSmartCoachRecommendations(data, user), [data, user]);
  const visibleRecommendations = useMemo(() => {
    const query = athleteQuery.trim().toLowerCase();
    return recommendations.filter((item) => {
      const matchesPriority = priority === "all" || item.priority === priority;
      const matchesCategory = category === "all" || item.category === category;
      const athleteName = data.coachAthletes.find((athlete) => athlete.id === item.createdForUserId)?.name ?? "";
      const matchesQuery = !query || athleteName.toLowerCase().includes(query) || item.title.toLowerCase().includes(query) || item.message.toLowerCase().includes(query);
      return matchesPriority && matchesCategory && matchesQuery;
    });
  }, [athleteQuery, category, data.coachAthletes, priority, recommendations]);

  const openCount = recommendations.filter((item) => item.status === "open").length;
  const topRecommendations = compact ? visibleRecommendations.filter((item) => item.status === "open").slice(0, 3) : visibleRecommendations;

  return (
    <section className={`section-block smart-coach-panel ${compact ? "compact" : ""}`}>
      <div className="section-heading">
        <div>
          <p className="eyebrow">Smart Coach</p>
          <h3>{compact ? "Dein Smart Coach" : "Regelbasierte Trainingsintelligenz"}</h3>
        </div>
        <span className="status-pill planned">{openCount} offen</span>
      </div>

      {!compact ? (
        <div className="smart-coach-filters">
          <label>
            Prioritaet
            <select value={priority} onChange={(event) => setPriority(event.target.value as PriorityFilter)}>
              {priorityOptions.map((option) => (
                <option value={option} key={option}>{option === "all" ? "Alle" : priorityLabel[option]}</option>
              ))}
            </select>
          </label>
          <label>
            Kategorie
            <select value={category} onChange={(event) => setCategory(event.target.value as CategoryFilter)}>
              {categoryOptions.map((option) => (
                <option value={option} key={option}>{option === "all" ? "Alle" : getSmartCoachCategoryLabel(option)}</option>
              ))}
            </select>
          </label>
          <label>
            Sportler / Hinweis
            <input value={athleteQuery} onChange={(event) => setAthleteQuery(event.target.value)} placeholder="Suchen" />
          </label>
        </div>
      ) : null}

      <div className="smart-coach-list">
        {topRecommendations.length > 0 ? topRecommendations.map((recommendation) => (
          <article className={`smart-coach-recommendation priority-${recommendation.priority}`} key={recommendation.id}>
            <div className="smart-coach-icon">{iconForCategory(recommendation.category)}</div>
            <div className="smart-coach-copy">
              <div className="smart-coach-meta">
                <span>{getSmartCoachCategoryLabel(recommendation.category)}</span>
                <b>{priorityLabel[recommendation.priority]}</b>
                {recommendation.status !== "open" ? <em>{recommendation.status === "done" ? "erledigt" : "ausgeblendet"}</em> : null}
              </div>
              <h4>{recommendation.title}</h4>
              <p>{recommendation.message}</p>
              <small>{recommendation.reason}</small>
              {!compact ? (
                <>
                  <div className="smart-coach-action">
                    <strong>Vorschlag</strong>
                    <span>{recommendation.suggestedAction}</span>
                  </div>
                  <label className="smart-coach-note">
                    Notiz
                    <textarea
                      value={noteById[recommendation.id] ?? recommendation.note ?? ""}
                      onChange={(event) => setNoteById((current) => ({ ...current, [recommendation.id]: event.target.value }))}
                      placeholder="Kurze Trainer- oder Athletennotiz"
                    />
                  </label>
                </>
              ) : null}
              <div className="inline-actions">
                {!compact ? (
                  <button type="button" className="ghost-button" onClick={() => onUpdateRecommendation(recommendation, { note: noteById[recommendation.id] ?? recommendation.note ?? "" })}>
                    Notiz speichern
                  </button>
                ) : null}
                <button type="button" className="save-button" onClick={() => onUpdateRecommendation(recommendation, { status: "done", note: noteById[recommendation.id] ?? recommendation.note ?? "" })}>
                  Erledigt
                </button>
                <button type="button" className="danger-button" onClick={() => onUpdateRecommendation(recommendation, { status: "dismissed", note: noteById[recommendation.id] ?? recommendation.note ?? "" })}>
                  Ausblenden
                </button>
              </div>
            </div>
          </article>
        )) : (
          <p className="empty-state">Noch nicht genug Daten fï¿½r Smart-Coach-Hinweise. Plane Training, erfasse Feedback oder lege Ziele an.</p>
        )}
      </div>

      {compact ? (
        <button type="button" className="ghost-button wide" onClick={onOpenDetails}>
          Details ï¿½ffnen
        </button>
      ) : (
        <p className="muted">Paddlio Smart Coach ersetzt keinen Trainer, Arzt oder medizinische Beratung.</p>
      )}
    </section>
  );
}
