import { useMemo, useState, type FormEvent } from "react";
import {
  canAccessPlanEntry,
  canManageAdminArea,
  canUseCoachArea,
  getAthletesForCurrentUser,
  getGroupsForCurrentUser,
  getTrainingsForCurrentUser,
} from "../domain/accessControl";
import {
  getWeekdayFromDate,
  isDoneStatus,
  isPlannedStatus,
  isSkippedStatus,
  planStatuses,
  sortPlanEntries,
  trainingAreas,
  trainingIntensities,
  trainingTypeGroups,
  weekdays,
} from "../domain/trainingPlan";
import type {
  BoatClass,
  CoachAthlete,
  CoachGroup,
  PaddleMotionData,
  PlanEntry,
  PlanStatus,
  TrainingArea,
  TrainingBoatClass,
  TrainingFeedback,
  TrainingIntensity,
  TrainingPlanType,
  TrainingRepeat,
  User,
} from "../domain/types";

type PlanDraft = Omit<PlanEntry, "athleteId" | "createdAt" | "updatedAt" | "createdByUserId">;

type PlanViewProps = {
  data: PaddleMotionData;
  entries: PlanEntry[];
  user: User;
  onSave: (entry: Omit<PlanEntry, "id" | "athleteId" | "createdAt" | "updatedAt" | "createdByUserId"> & { id?: string }) => void;
  onDelete: (id: string) => void;
  onToggleDone: (id: string) => void;
  onFeedbackSave: (feedback: Omit<TrainingFeedback, "id" | "completedAt"> & { id?: string }) => void;
};

type CalendarView = "day" | "week" | "month" | "list";

const today = new Date().toISOString().slice(0, 10);

const statusLabel: Record<PlanStatus, string> = {
  planned: "Geplant",
  done: "Erledigt",
  skipped: "Ausgelassen",
  cancelled: "Abgesagt",
  geplant: "Geplant",
  erledigt: "Erledigt",
  ausgelassen: "Ausgelassen",
};

const intensityLabel: Record<TrainingIntensity, string> = {
  locker: "Locker",
  mittel: "Mittel",
  hart: "Hart",
  maximal: "Maximal",
};

const areaLabel: Record<TrainingArea, string> = {
  Wassertraining: "water",
  Ausdauer: "endurance",
  Krafttraining: "strength",
  Trainerarbeit: "coach",
  Regeneration: "regeneration",
  Wettkampf: "competition",
};

const emptyDraft = (user: User, athleteId: string): PlanDraft => ({
  id: "",
  ownerUserId: user.userId,
  clubId: user.profile.club,
  assignedType: "self",
  assignedAthleteIds: [athleteId],
  assignedGroupIds: [],
  title: "",
  date: today,
  weekday: getWeekdayFromDate(today),
  time: "17:30",
  startTime: "17:30",
  endTime: "",
  durationMinutes: 75,
  area: "Wassertraining",
  trainingType: "K1 Technik",
  boatClass: "K1",
  goal: "",
  focus: "",
  description: "",
  intensity: "mittel",
  note: "",
  notes: "",
  status: "planned",
  repeat: "none",
  repeatUntil: "",
  assignedAthleteId: athleteId,
  assignedGroupId: "",
  feedbackNote: "",
});

const getMonday = (date: string): Date => {
  const [year, month, day] = date.split("-").map(Number);
  const current = new Date(year, month - 1, day);
  const weekday = current.getDay() || 7;
  current.setDate(current.getDate() - weekday + 1);
  return current;
};

const formatDateKey = (date: Date): string => date.toISOString().slice(0, 10);

const getWeekDates = (date: string): string[] => {
  const monday = getMonday(date);
  return weekdays.map((_, index) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + index);
    return formatDateKey(day);
  });
};

const getMonthDates = (date: string): string[] => {
  const [year, month] = date.split("-").map(Number);
  const cursor = new Date(year, month - 1, 1);
  const dates: string[] = [];
  while (cursor.getMonth() === month - 1) {
    dates.push(formatDateKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
};

const getEntryStatusClass = (status: PlanStatus): string =>
  isDoneStatus(status) ? "done" : isSkippedStatus(status) ? "skipped" : status === "cancelled" ? "cancelled" : "planned";

const includesBoat = (entry: PlanEntry, boat: string): boolean =>
  boat === "all" || entry.boatClass === boat || (boat === "K1" && entry.boatClass === "K1+C1") || (boat === "C1" && entry.boatClass === "K1+C1");

export function PlanView({ data, entries, user, onSave, onDelete, onToggleDone, onFeedbackSave }: PlanViewProps) {
  const [draft, setDraft] = useState<PlanDraft | null>(null);
  const [calendarView, setCalendarView] = useState<CalendarView>("week");
  const [selectedArea, setSelectedArea] = useState<TrainingArea>("Wassertraining");
  const [selectedDate, setSelectedDate] = useState(today);
  const [feedbackEntry, setFeedbackEntry] = useState<PlanEntry | null>(null);
  const [areaFilter, setAreaFilter] = useState<"all" | TrainingArea>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | PlanStatus>("all");
  const [boatFilter, setBoatFilter] = useState<"all" | TrainingBoatClass>("all");
  const [intensityFilter, setIntensityFilter] = useState<"all" | TrainingIntensity>("all");
  const [athleteFilter, setAthleteFilter] = useState("all");
  const [groupFilter, setGroupFilter] = useState("all");
  const [formMessage, setFormMessage] = useState("");
  const isCoach = canUseCoachArea(user.role);
  const isAdmin = canManageAdminArea(user.role);

  const visibleAthletes = useMemo(() => getAthletesForCurrentUser(data, user), [data, user]);
  const visibleGroups = useMemo(() => getGroupsForCurrentUser(data, user), [data, user]);

  const visibleEntries = useMemo(() => {
    const scopedEntries = getTrainingsForCurrentUser({ ...data, plan: entries }, user);
    return sortPlanEntries(scopedEntries).filter((entry) => {
      if (areaFilter !== "all" && entry.area !== areaFilter) return false;
      if (statusFilter !== "all" && entry.status !== statusFilter) return false;
      if (!includesBoat(entry, boatFilter)) return false;
      if (intensityFilter !== "all" && entry.intensity !== intensityFilter) return false;
      if (athleteFilter !== "all" && !entry.assignedAthleteIds.includes(athleteFilter) && entry.assignedAthleteId !== athleteFilter) return false;
      if (groupFilter !== "all" && !entry.assignedGroupIds.includes(groupFilter) && entry.assignedGroupId !== groupFilter) return false;
      return true;
    });
  }, [areaFilter, athleteFilter, boatFilter, data, entries, groupFilter, intensityFilter, statusFilter, user]);

  const todayEntries = visibleEntries.filter((entry) => entry.date === today);
  const weekDates = getWeekDates(selectedDate);
  const completedThisWeek = visibleEntries.filter((entry) => weekDates.includes(entry.date) && isDoneStatus(entry.status));
  const skippedThisWeek = visibleEntries.filter((entry) => weekDates.includes(entry.date) && isSkippedStatus(entry.status));
  const plannedThisWeek = visibleEntries.filter((entry) => weekDates.includes(entry.date));
  const weeklyMinutes = completedThisWeek.reduce((sum, entry) => sum + entry.durationMinutes, 0);
  const openFeedbackCount = visibleEntries.filter((entry) => isDoneStatus(entry.status) && !data.trainingFeedback.some((feedback) => feedback.trainingId === entry.id)).length;

  const startCreate = () => {
    const nextDraft = emptyDraft(user, data.athlete.id);
    setSelectedArea(nextDraft.area);
    setSelectedDate(nextDraft.date);
    setDraft(nextDraft);
  };

  const startEdit = (entry: PlanEntry) => {
    setSelectedArea(entry.area);
    setSelectedDate(entry.date);
    setDraft({
      ...entry,
      focus: entry.focus || entry.goal,
      startTime: entry.startTime || entry.time,
      notes: entry.notes || entry.note,
    });
  };

  const getAthleteName = (athlete: CoachAthlete): string => athlete.name || `${athlete.firstName} ${athlete.lastName}`.trim() || athlete.email;
  const getGroupName = (group: CoachGroup): string => group.name;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const assignedType = String(formData.get("assignedType") ?? "self") as PlanEntry["assignedType"];
    const assignedAthleteIds = assignedType === "athlete" ? formData.getAll("assignedAthleteIds").map(String) : assignedType === "self" ? [data.athlete.id] : [];
    const assignedGroupIds = assignedType === "group" ? formData.getAll("assignedGroupIds").map(String) : [];
    const date = String(formData.get("date") ?? today);
    const title = String(formData.get("title") ?? "").trim();
    const area = String(formData.get("area") ?? "Wassertraining") as TrainingArea;
    const trainingType = String(formData.get("trainingType") ?? "K1 Technik") as TrainingPlanType;

    if (!title || !date || (assignedType === "athlete" && assignedAthleteIds.length === 0) || (assignedType === "group" && assignedGroupIds.length === 0)) {
      setFormMessage("Bitte fuelle alle Pflichtfelder aus und waehle bei Zuweisungen mindestens ein Ziel aus.");
      return;
    }

    const allowedAthletes = new Set(visibleAthletes.map((athlete) => athlete.id));
    const allowedGroups = new Set(visibleGroups.flatMap((group) => [group.id, group.groupId]));
    const hasInvalidAthlete = assignedAthleteIds.some((id) => !allowedAthletes.has(id));
    const hasInvalidGroup = assignedGroupIds.some((id) => !allowedGroups.has(id));

    if ((assignedType === "athlete" && hasInvalidAthlete) || (assignedType === "group" && hasInvalidGroup)) {
      setFormMessage("Du hast keine Berechtigung fuer mindestens eine ausgewaehlte Zuweisung.");
      return;
    }

    onSave({
      id: draft?.id || undefined,
      ownerUserId: draft?.ownerUserId || user.userId,
      clubId: user.profile.club,
      assignedType,
      assignedAthleteIds,
      assignedGroupIds,
      title,
      date,
      weekday: getWeekdayFromDate(date),
      time: String(formData.get("startTime") ?? ""),
      startTime: String(formData.get("startTime") ?? ""),
      endTime: String(formData.get("endTime") ?? ""),
      durationMinutes: Number(formData.get("durationMinutes") ?? 0),
      area,
      trainingType,
      boatClass: String(formData.get("boatClass") ?? "none") as TrainingBoatClass,
      goal: String(formData.get("focus") ?? "").trim(),
      focus: String(formData.get("focus") ?? "").trim(),
      description: String(formData.get("description") ?? "").trim(),
      intensity: String(formData.get("intensity") ?? "mittel") as TrainingIntensity,
      note: String(formData.get("notes") ?? "").trim(),
      notes: String(formData.get("notes") ?? "").trim(),
      status: String(formData.get("status") ?? "planned") as PlanStatus,
      repeat: String(formData.get("repeat") ?? "none") as TrainingRepeat,
      repeatUntil: String(formData.get("repeatUntil") ?? ""),
      assignedAthleteId: assignedAthleteIds[0] ?? "",
      assignedGroupId: assignedGroupIds[0] ?? "",
      feedbackNote: draft?.feedbackNote ?? "",
    });

    setFormMessage("");
    setDraft(null);
  };

  const handleFeedbackSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!feedbackEntry) return;
    const formData = new FormData(event.currentTarget);
    onFeedbackSave({
      trainingId: feedbackEntry.id,
      athleteUserId: user.userId,
      coachUserId: feedbackEntry.createdByUserId === user.userId ? "" : feedbackEntry.createdByUserId,
      status: String(formData.get("status") ?? "done") as "done" | "skipped",
      feeling: Number(formData.get("feeling") ?? 7),
      difficulty: Number(formData.get("difficulty") ?? 5),
      fatigue: Number(formData.get("fatigue") ?? 5),
      motivation: Number(formData.get("motivation") ?? 7),
      sleep: Number(formData.get("sleep") ?? 7),
      reason: String(formData.get("reason") ?? ""),
      comment: String(formData.get("comment") ?? "").trim(),
    });
    setFeedbackEntry(null);
  };

  const renderEntryCard = (entry: PlanEntry) => {
    const entryFeedback = data.trainingFeedback.filter((feedback) => feedback.trainingId === entry.id);
    const assignedAthletes = visibleAthletes.filter((athlete) => entry.assignedAthleteIds.includes(athlete.id) || entry.assignedAthleteId === athlete.id);
    const assignedGroups = visibleGroups.filter((group) => entry.assignedGroupIds.includes(group.id) || entry.assignedGroupId === group.id);

    return (
      <article className={`calendar-training-card status-${getEntryStatusClass(entry.status)}`} key={entry.id}>
        <div className="plan-card-head">
          <div>
            <span>{entry.date} - {entry.startTime || entry.time || "--:--"}{entry.endTime ? ` bis ${entry.endTime}` : ""}</span>
            <h4>{entry.title || entry.trainingType}</h4>
          </div>
          <b className={`status-pill ${getEntryStatusClass(entry.status)}`}>{statusLabel[entry.status]}</b>
        </div>
        <div className="smart-detail-grid">
          <span>{entry.trainingType}</span>
          <span>{entry.durationMinutes} min</span>
          <span>{intensityLabel[entry.intensity]}</span>
          <span>{entry.boatClass}</span>
        </div>
        <p>{entry.focus || entry.description || entry.notes || "Noch kein Fokus eingetragen."}</p>
        <small className="card-note">
          {entry.assignedType === "group"
            ? `Gruppe: ${assignedGroups.map(getGroupName).join(", ") || "nicht gefunden"}`
            : entry.assignedType === "athlete"
              ? `Sportler: ${assignedAthletes.map(getAthleteName).join(", ") || "nicht gefunden"}`
              : "Eigenes Training"}
        </small>
        {entryFeedback.length > 0 ? (
          <div className="feedback-list">
            {entryFeedback.map((feedback) => (
              <span key={feedback.id}>Feedback: Gefuehl {feedback.feeling}/10, Motivation {feedback.motivation}/10</span>
            ))}
          </div>
        ) : null}
        <div className="card-actions">
          <button className="save-button" type="button" onClick={() => onToggleDone(entry.id)}>
            {isDoneStatus(entry.status) ? "Wieder planen" : "Erledigt"}
          </button>
          <button className="delete-button" type="button" onClick={() => setFeedbackEntry({ ...entry, status: "skipped" })}>Ausgelassen</button>
          <button className="edit-button" type="button" onClick={() => setFeedbackEntry({ ...entry, status: "done" })}>Feedback</button>
          {(entry.createdByUserId === user.userId || user.role === "admin") && canAccessPlanEntry(data, user, entry) ? <button className="edit-button" type="button" onClick={() => startEdit(entry)}>Bearbeiten</button> : null}
          {(entry.createdByUserId === user.userId || user.role === "admin") ? <button className="delete-button" type="button" onClick={() => onDelete(entry.id)}>Loeschen</button> : null}
        </div>
      </article>
    );
  };

  return (
    <div className="stack calendar-shell">
      <section className="summary-strip">
        <div><span>Diese Woche</span><strong>{plannedThisWeek.length}</strong></div>
        <div><span>Erledigt</span><strong>{completedThisWeek.length}</strong></div>
        <div><span>Ausgelassen</span><strong>{skippedThisWeek.length}</strong></div>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Kalender</p>
            <h3>Trainingsplanung</h3>
          </div>
          <button className="primary-button" type="button" onClick={startCreate}>Training planen</button>
        </div>
        <div className="calendar-view-tabs">
          {(["day", "week", "month", "list"] as CalendarView[]).map((view) => (
            <button className={calendarView === view ? "active" : ""} key={view} type="button" onClick={() => setCalendarView(view)}>
              {view === "day" ? "Tag" : view === "week" ? "Woche" : view === "month" ? "Monat" : "Liste"}
            </button>
          ))}
        </div>
        <div className="form-grid compact-form">
          <label>Datum<input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} /></label>
          <label>Bereich<select value={areaFilter} onChange={(event) => setAreaFilter(event.target.value as typeof areaFilter)}><option value="all">Alle</option>{trainingAreas.map((area) => <option key={area} value={area}>{area}</option>)}</select></label>
          <label>Status<select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}><option value="all">Alle</option>{planStatuses.map((status) => <option key={status} value={status}>{statusLabel[status]}</option>)}</select></label>
          <label>Boot<select value={boatFilter} onChange={(event) => setBoatFilter(event.target.value as typeof boatFilter)}><option value="all">Alle</option><option value="K1">K1</option><option value="C1">C1</option><option value="K1+C1">K1+C1</option><option value="none">ohne Boot</option></select></label>
          <label>Intensitaet<select value={intensityFilter} onChange={(event) => setIntensityFilter(event.target.value as typeof intensityFilter)}><option value="all">Alle</option>{trainingIntensities.map((intensity) => <option key={intensity} value={intensity}>{intensityLabel[intensity]}</option>)}</select></label>
          {isCoach ? <label>Sportler<select value={athleteFilter} onChange={(event) => setAthleteFilter(event.target.value)}><option value="all">Alle</option>{visibleAthletes.map((athlete) => <option key={athlete.id} value={athlete.id}>{getAthleteName(athlete)}</option>)}</select></label> : null}
          {isCoach ? <label>Gruppe<select value={groupFilter} onChange={(event) => setGroupFilter(event.target.value)}><option value="all">Alle</option>{visibleGroups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}</select></label> : null}
        </div>
      </section>

      {draft ? (
        <section className="section-block">
          <div className="section-heading"><div><p className="eyebrow">Planung</p><h3>{draft.id ? "Training bearbeiten" : "Training planen"}</h3></div></div>
          {formMessage ? <p className="auth-message">{formMessage}</p> : null}
          <form className="entry-form" onSubmit={handleSubmit}>
            <div className="form-grid">
              <label>Titel<input name="title" defaultValue={draft.title} required /></label>
              <label>Datum<input name="date" type="date" defaultValue={draft.date} onChange={(event) => setSelectedDate(event.currentTarget.value)} required /></label>
              <label>Wochentag<input value={getWeekdayFromDate(selectedDate)} readOnly /></label>
              <label>Startzeit<input name="startTime" type="time" defaultValue={draft.startTime || draft.time} /></label>
              <label>Endzeit<input name="endTime" type="time" defaultValue={draft.endTime} /></label>
              <label>Dauer<input name="durationMinutes" type="number" min="0" step="5" defaultValue={draft.durationMinutes} /></label>
              <label>Zuweisung<select name="assignedType" defaultValue={draft.assignedType}><option value="self">Fuer mich</option>{isCoach ? <option value="athlete">Einzelner Sportler</option> : null}{isCoach ? <option value="group">Trainingsgruppe</option> : null}</select></label>
              <label>Trainingsbereich<select name="area" defaultValue={draft.area} onChange={(event) => setSelectedArea(event.currentTarget.value as TrainingArea)}>{trainingAreas.map((area) => <option key={area} value={area}>{area}</option>)}</select></label>
              <label>Trainingsart<select name="trainingType" defaultValue={draft.trainingType}>{trainingTypeGroups[selectedArea].map((trainingType) => <option key={trainingType} value={trainingType}>{trainingType}</option>)}</select></label>
              <label>Bootsklasse<select name="boatClass" defaultValue={draft.boatClass}><option value="K1">K1</option><option value="C1">C1</option><option value="K1+C1">K1+C1</option><option value="none">ohne Boot</option></select></label>
              <label>Intensitaet<select name="intensity" defaultValue={draft.intensity}>{trainingIntensities.map((intensity) => <option key={intensity} value={intensity}>{intensityLabel[intensity]}</option>)}</select></label>
              <label>Status<select name="status" defaultValue={draft.status}>{planStatuses.map((status) => <option key={status} value={status}>{statusLabel[status]}</option>)}</select></label>
              <label>Wiederholung<select name="repeat" defaultValue={draft.repeat}><option value="none">keine</option><option value="daily">taeglich</option><option value="weekly">woechentlich</option><option value="monthly">monatlich</option></select></label>
              <label>Wiederholen bis<input name="repeatUntil" type="date" defaultValue={draft.repeatUntil} /></label>
            </div>
            {isCoach ? <div className="choice-group"><span>Sportler fuer Einzeltraining</span><div className="tag-row">{visibleAthletes.map((athlete) => <label className="toggle-row" key={athlete.id}><span>{getAthleteName(athlete)}</span><input name="assignedAthleteIds" type="checkbox" value={athlete.id} defaultChecked={draft.assignedAthleteIds.includes(athlete.id)} /></label>)}</div></div> : null}
            {isCoach ? <div className="choice-group"><span>Trainingsgruppen</span><div className="tag-row">{visibleGroups.map((group) => <label className="toggle-row" key={group.id}><span>{group.name}</span><input name="assignedGroupIds" type="checkbox" value={group.id} defaultChecked={draft.assignedGroupIds.includes(group.id)} /></label>)}</div></div> : null}
            <label>Ziel/Fokus<input name="focus" defaultValue={draft.focus || draft.goal} placeholder="z. B. Tor 6 sauber anfahren" /></label>
            <label>Beschreibung<textarea name="description" defaultValue={draft.description} rows={3} /></label>
            <label>Notiz<textarea name="notes" defaultValue={draft.notes || draft.note} rows={3} /></label>
            <div className="form-actions"><button className="save-button" type="submit">Speichern</button><button className="ghost-button wide" type="button" onClick={() => setDraft(null)}>Abbrechen</button></div>
          </form>
        </section>
      ) : null}

      <section className="section-block">
        <div className="section-heading"><div><p className="eyebrow">Heute</p><h3>{todayEntries.length > 0 ? "Heutiges Training" : "Fuer heute ist kein Training geplant."}</h3></div></div>
        <div className="calendar-list">{todayEntries.length > 0 ? todayEntries.map(renderEntryCard) : <p className="empty-state">Plane dein erstes Training.</p>}</div>
      </section>

      {calendarView === "week" ? (
        <section className="calendar-week-grid">{weekDates.map((date, index) => <article className="calendar-day-column" key={date}><div className="plan-day-heading"><strong>{weekdays[index]}</strong><span>{new Date(date).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })}</span></div>{visibleEntries.filter((entry) => entry.date === date).map(renderEntryCard)}{visibleEntries.filter((entry) => entry.date === date).length === 0 ? <p className="empty-state compact">Noch kein Training geplant.</p> : null}</article>)}</section>
      ) : calendarView === "day" ? (
        <section className="calendar-list">{visibleEntries.filter((entry) => entry.date === selectedDate).map(renderEntryCard)}{visibleEntries.filter((entry) => entry.date === selectedDate).length === 0 ? <p className="empty-state">Fuer diesen Tag ist noch kein Training geplant.</p> : null}</section>
      ) : calendarView === "month" ? (
        <section className="calendar-month-grid">{getMonthDates(selectedDate).map((date) => { const count = visibleEntries.filter((entry) => entry.date === date).length; return <button className={count > 0 ? "has-training" : ""} key={date} type="button" onClick={() => { setSelectedDate(date); setCalendarView("day"); }}><strong>{new Date(date).getDate()}</strong><span>{count > 0 ? `${count} Einheiten` : "frei"}</span></button>; })}</section>
      ) : (
        <section className="calendar-list">{visibleEntries.length > 0 ? visibleEntries.map(renderEntryCard) : <p className="empty-state">Noch kein Training geplant.</p>}</section>
      )}

      {feedbackEntry ? (
        <section className="section-block feedback-modal">
          <div className="section-heading"><div><p className="eyebrow">Rueckmeldung</p><h3>{feedbackEntry.title || feedbackEntry.trainingType}</h3></div></div>
          <form className="entry-form" onSubmit={handleFeedbackSubmit}>
            <div className="form-grid">
              <label>Status<select name="status" defaultValue={isSkippedStatus(feedbackEntry.status) ? "skipped" : "done"}><option value="done">erledigt</option><option value="skipped">ausgelassen</option></select></label>
              <label>Gefuehl 1-10<input name="feeling" type="number" min="1" max="10" defaultValue={7} /></label>
              <label>Schwierigkeit 1-10<input name="difficulty" type="number" min="1" max="10" defaultValue={5} /></label>
              <label>Muedigkeit 1-10<input name="fatigue" type="number" min="1" max="10" defaultValue={5} /></label>
              <label>Motivation 1-10<input name="motivation" type="number" min="1" max="10" defaultValue={7} /></label>
              <label>Schlaf 1-10<input name="sleep" type="number" min="1" max="10" defaultValue={7} /></label>
              <label>Grund<select name="reason" defaultValue=""><option value="">kein Grund</option><option value="krank">krank</option><option value="schule_arbeit">Schule/Arbeit</option><option value="wetter">Wetter</option><option value="keine_zeit">keine Zeit</option><option value="andere">andere</option></select></label>
            </div>
            <label>Kommentar<textarea name="comment" rows={3} /></label>
            <div className="form-actions"><button className="save-button" type="submit">Rueckmeldung speichern</button><button className="ghost-button wide" type="button" onClick={() => setFeedbackEntry(null)}>Abbrechen</button></div>
          </form>
        </section>
      ) : null}

      <section className="section-block">
        <div className="section-heading"><div><p className="eyebrow">Wochenfortschritt</p><h3>{weeklyMinutes} Minuten</h3></div></div>
        <div className="smart-detail-grid"><span>{completedThisWeek.length} erledigt</span><span>{skippedThisWeek.length} ausgelassen</span><span>{openFeedbackCount} offene Rueckmeldungen</span></div>
      </section>
    </div>
  );
}
