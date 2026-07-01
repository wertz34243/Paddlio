import { useMemo, useState, type FormEvent } from "react";
import {
  createId,
  deleteClub,
  loadClubRequests,
  loadClubs,
  deleteAuthUser,
  loadTrainerRequests,
  loadUsers,
  reviewClubRequest,
  reviewTrainerRequest,
  upsertClub,
  updateAuthUserProfileFields,
  updateAuthUserRole,
  updateAuthUserStatus,
} from "../data/storage";
import { getWeekdayFromDate } from "../domain/trainingPlan";
import type {
  AgeClass,
  AuthUser,
  BoatClass,
  Club,
  ClubRequest,
  ClubStatus,
  CoachAthlete,
  CoachAthleteStatus,
  CoachGroup,
  PaddleMotionData,
  PaddleSide,
  PlanEntry,
  TrainerRequest,
  TrainingArea,
  TrainingIntensity,
  TrainingPlanType,
  User,
  UserRole,
} from "../domain/types";

type CoachViewProps = {
  data: PaddleMotionData;
  user: User;
  onDataChange: (updater: (current: PaddleMotionData) => PaddleMotionData) => void;
};

const roleLabels: Record<UserRole, string> = {
  athlete: "Athlete",
  coach: "Coach",
  teamAdmin: "TeamAdmin",
  admin: "Admin",
};

const ageClasses: Array<AgeClass | ""> = ["", "U10", "U12", "U14", "U16", "U18", "U23", "Leistungsklasse", "Masters"];
const trainingAreas: TrainingArea[] = ["Wassertraining", "Ausdauer", "Krafttraining", "Trainerarbeit", "Regeneration", "Wettkampf"];
const trainingTypes: TrainingPlanType[] = ["K1 Technik", "C1 Technik", "Slalomstrecke", "GA1", "Intervalle", "Kraftausdauer", "Pause", "K1 Rennen", "C1 Rennen"];
const intensities: TrainingIntensity[] = ["locker", "mittel", "hart", "maximal"];

const canUseCoach = (role: UserRole): boolean => role === "coach" || role === "teamAdmin" || role === "admin";
const canManageAdmin = (role: UserRole): boolean => role === "admin";

const normalizeClubName = (value: string): string => value.trim().toLowerCase();

const todayKey = (): string => new Date().toISOString().slice(0, 10);

const getWeekStart = (): Date => {
  const today = new Date();
  const day = today.getDay() || 7;
  const monday = new Date(today);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(today.getDate() - day + 1);
  return monday;
};

const isThisWeek = (date: string): boolean => {
  const start = getWeekStart();
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  const current = new Date(date);
  return current >= start && current < end;
};

const defaultAthlete = (coachUserId: string): Omit<CoachAthlete, "id" | "createdAt" | "updatedAt"> => ({
  coachUserId,
  name: "",
  birthDate: "",
  ageClass: "",
  club: "",
  boatClasses: ["K1"],
  paddleSide: "rechts",
  groupId: "",
  goals: "",
  notes: "",
  status: "aktiv",
});

export function CoachView({ data, user, onDataChange }: CoachViewProps) {
  const [editingAthlete, setEditingAthlete] = useState<CoachAthlete | null>(null);
  const [athleteBoatClasses, setAthleteBoatClasses] = useState<BoatClass[]>(["K1"]);
  const [editingGroup, setEditingGroup] = useState<CoachGroup | null>(null);
  const [editingClub, setEditingClub] = useState<Club | null>(null);
  const [editingClubRequestId, setEditingClubRequestId] = useState("");
  const [selectedPreviewAthleteId, setSelectedPreviewAthleteId] = useState("");
  const [authUsers, setAuthUsers] = useState<AuthUser[]>(() => loadUsers());
  const [clubs, setClubs] = useState<Club[]>(() => loadClubs());
  const [clubRequests, setClubRequests] = useState<ClubRequest[]>(() => loadClubRequests());
  const [trainerRequests, setTrainerRequests] = useState<TrainerRequest[]>(() => loadTrainerRequests());
  const [userSearch, setUserSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [sortBy, setSortBy] = useState<"name" | "email" | "role" | "club">("name");
  const [message, setMessage] = useState("");

  const isAdmin = user.role === "admin";
  const userClub = user.profile.club.trim().toLowerCase();
  const ownGroups = isAdmin ? data.coachGroups : data.coachGroups.filter((group) => group.coachUserId === user.userId);
  const myClub = clubs.find((club) => normalizeClubName(club.name) === userClub);
  const clubAthletes = authUsers.filter((authUser) => authUser.role === "athlete" && Boolean(userClub) && normalizeClubName(authUser.club) === userClub);
  const canSeeAthlete = (athlete: CoachAthlete): boolean =>
    isAdmin || (Boolean(userClub) && athlete.club.trim().toLowerCase() === userClub);
  const ownAthletes = data.coachAthletes.filter(canSeeAthlete);
  const coachPlan = isAdmin ? data.plan : data.plan.filter((entry) => entry.createdByUserId === user.userId);
  const visibleAuthUsers = useMemo(() => {
    const scoped = isAdmin
      ? authUsers
      : authUsers.filter((authUser) =>
          authUser.role === "athlete" &&
          Boolean(userClub) &&
          authUser.club.trim().toLowerCase() === userClub,
        );
    const query = userSearch.trim().toLowerCase();

    return scoped
      .filter((authUser) => roleFilter === "all" || authUser.role === roleFilter)
      .filter((authUser) => {
        if (!query) {
          return true;
        }
        return [authUser.displayName, authUser.email, authUser.club, authUser.trainingGroupId]
          .join(" ")
          .toLowerCase()
          .includes(query);
      })
      .sort((a, b) => {
        const valueA = sortBy === "name" ? a.displayName : sortBy === "email" ? a.email : sortBy === "role" ? a.role : a.club;
        const valueB = sortBy === "name" ? b.displayName : sortBy === "email" ? b.email : sortBy === "role" ? b.role : b.club;
        return valueA.localeCompare(valueB);
      });
  }, [authUsers, isAdmin, roleFilter, sortBy, userClub, userSearch]);
  const previewAthlete = ownAthletes.find((athlete) => athlete.id === selectedPreviewAthleteId) ?? ownAthletes[0];
  const previewPlan = previewAthlete
    ? coachPlan.filter((entry) => entry.assignedAthleteId === previewAthlete.id || (entry.assignedGroupId && entry.assignedGroupId === previewAthlete.groupId))
    : [];
  const todaysPreviewTraining = previewPlan.find((entry) => entry.date === todayKey());
  const openFeedback = coachPlan.filter((entry) => entry.status === "erledigt" && !entry.feedbackNote).length;

  const metrics = useMemo(() => [
    { label: isAdmin ? "Sportler" : "Sportler im Verein", value: isAdmin ? ownAthletes.length : clubAthletes.length },
    { label: isAdmin ? "Gruppen" : "Gruppen im Verein", value: ownGroups.length },
    { label: "Trainings diese Woche", value: coachPlan.filter((entry) => isThisWeek(entry.date)).length },
    { label: "Offene Rueckmeldungen", value: openFeedback },
  ], [clubAthletes.length, coachPlan, isAdmin, openFeedback, ownAthletes.length, ownGroups.length]);

  if (!canUseCoach(user.role)) {
    return (
      <section className="section-block">
        <p className="eyebrow">Coach</p>
        <h3>Kein Zugriff</h3>
        <p className="card-note">Dieser Bereich ist fuer Coach, TeamAdmin und Admin Rollen vorbereitet.</p>
      </section>
    );
  }

  const upsertAthlete = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const hasC1 = athleteBoatClasses.includes("C1");
    const name = String(formData.get("name") ?? "").trim();

    if (!name || athleteBoatClasses.length === 0 || (hasC1 && !formData.get("paddleSide"))) {
      setMessage("Sportler braucht einen Namen, mindestens eine Bootsklasse und bei C1 eine Paddelseite.");
      return;
    }

    const timestamp = new Date().toISOString();
    const athlete: CoachAthlete = {
      ...(editingAthlete ?? {
        ...defaultAthlete(user.userId),
        id: createId("coach-athlete"),
        createdAt: timestamp,
      }),
      coachUserId: user.userId,
      name,
      birthDate: String(formData.get("birthDate") ?? ""),
      ageClass: String(formData.get("ageClass") ?? "") as AgeClass | "",
      club: String(formData.get("club") ?? "").trim(),
      boatClasses: athleteBoatClasses,
      paddleSide: hasC1 ? String(formData.get("paddleSide")) as PaddleSide : "rechts",
      groupId: String(formData.get("groupId") ?? ""),
      goals: String(formData.get("goals") ?? "").trim(),
      notes: String(formData.get("notes") ?? "").trim(),
      status: String(formData.get("status") ?? "aktiv") as CoachAthleteStatus,
      updatedAt: timestamp,
    };

    onDataChange((current) => ({
      ...current,
      coachAthletes: current.coachAthletes.some((item) => item.id === athlete.id)
        ? current.coachAthletes.map((item) => (item.id === athlete.id ? athlete : item))
        : [athlete, ...current.coachAthletes],
    }));
    setEditingAthlete(null);
    setAthleteBoatClasses(["K1"]);
    setMessage("Sportler gespeichert");
  };

  const deleteAthlete = (id: string) => {
    onDataChange((current) => ({
      ...current,
      coachAthletes: current.coachAthletes.filter((athlete) => athlete.id !== id),
      coachGroups: current.coachGroups.map((group) => ({
        ...group,
        athleteIds: group.athleteIds.filter((athleteId) => athleteId !== id),
      })),
    }));
  };

  const upsertGroup = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const timestamp = new Date().toISOString();
    const group: CoachGroup = {
      ...(editingGroup ?? {
        id: createId("coach-group"),
        coachUserId: user.userId,
        createdAt: timestamp,
      }),
      coachUserId: user.userId,
      name: String(formData.get("name") ?? "").trim(),
      description: String(formData.get("description") ?? "").trim(),
      ageRange: String(formData.get("ageRange") ?? "").trim(),
      trainingFocus: String(formData.get("trainingFocus") ?? "").trim(),
      athleteIds: formData.getAll("athleteIds").map(String),
      updatedAt: timestamp,
    };

    onDataChange((current) => ({
      ...current,
      coachGroups: current.coachGroups.some((item) => item.id === group.id)
        ? current.coachGroups.map((item) => (item.id === group.id ? group : item))
        : [group, ...current.coachGroups],
      coachAthletes: current.coachAthletes.map((athlete) => ({
        ...athlete,
        groupId: group.athleteIds.includes(athlete.id) ? group.id : athlete.groupId === group.id ? "" : athlete.groupId,
      })),
    }));
    setEditingGroup(null);
  };

  const deleteGroup = (id: string) => {
    onDataChange((current) => ({
      ...current,
      coachGroups: current.coachGroups.filter((group) => group.id !== id),
      coachAthletes: current.coachAthletes.map((athlete) => athlete.groupId === id ? { ...athlete, groupId: "" } : athlete),
    }));
  };

  const assignTraining = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const target = String(formData.get("target") ?? "self");
    const date = String(formData.get("date") ?? todayKey());
    const timestamp = new Date().toISOString();
    const entry: PlanEntry = {
      id: createId("coach-plan"),
      athleteId: data.athlete.id,
      date,
      weekday: getWeekdayFromDate(date),
      time: String(formData.get("time") ?? ""),
      durationMinutes: Number(formData.get("durationMinutes") ?? 0),
      area: String(formData.get("area") ?? "Wassertraining") as TrainingArea,
      trainingType: String(formData.get("trainingType") ?? "K1 Technik") as TrainingPlanType,
      goal: String(formData.get("goal") ?? "").trim(),
      intensity: String(formData.get("intensity") ?? "locker") as TrainingIntensity,
      note: String(formData.get("note") ?? "").trim(),
      status: "geplant",
      createdByUserId: user.userId,
      assignedAthleteId: target.startsWith("athlete:") ? target.replace("athlete:", "") : target === "self" ? data.athlete.id : "",
      assignedGroupId: target.startsWith("group:") ? target.replace("group:", "") : "",
      feedbackNote: "",
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    onDataChange((current) => ({
      ...current,
      plan: [entry, ...current.plan],
    }));
  };

  const changeRole = (targetUserId: string, role: UserRole) => {
    setAuthUsers(updateAuthUserRole(targetUserId, role));
  };

  const changeStatus = (targetUserId: string, status: "active" | "inactive") => {
    setAuthUsers(updateAuthUserStatus(targetUserId, status));
  };

  const changeTrainingGroup = (targetUserId: string, trainingGroupId: string) => {
    setAuthUsers(updateAuthUserProfileFields(targetUserId, { trainingGroupId, coachId: user.userId }));
  };

  const removeUser = (targetUserId: string) => {
    if (targetUserId === user.userId) {
      setMessage("Du kannst dein eigenes Konto hier nicht loeschen.");
      return;
    }

    setAuthUsers(deleteAuthUser(targetUserId));
  };

  const reviewRequest = (requestId: string, status: "approved" | "rejected") => {
    const result = reviewTrainerRequest(requestId, status, user.userId);
    setTrainerRequests(result.requests);
    setAuthUsers(result.users);
    setMessage(status === "approved" ? "Traineranfrage genehmigt" : "Traineranfrage abgelehnt");
  };

  const saveClub = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    if (!name) {
      setMessage("Vereinsname ist erforderlich.");
      return;
    }

    const clubInput = {
      clubId: editingClub?.clubId,
      name,
      shortName: String(formData.get("shortName") ?? "").trim(),
      city: String(formData.get("city") ?? "").trim(),
      contactName: String(formData.get("contactName") ?? "").trim(),
      contactEmail: String(formData.get("contactEmail") ?? "").trim(),
      website: String(formData.get("website") ?? "").trim(),
      logoUrl: String(formData.get("logoUrl") ?? "").trim(),
      primaryColor: String(formData.get("primaryColor") ?? "#00B4D8"),
      secondaryColor: String(formData.get("secondaryColor") ?? "#0077B6"),
      status: String(formData.get("status") ?? "active") as ClubStatus,
    };

    if (editingClubRequestId) {
      const result = reviewClubRequest(editingClubRequestId, "approved", user.userId, clubInput);
      setClubs(result.clubs);
      setClubRequests(result.requests);
      setAuthUsers(loadUsers());
      setEditingClubRequestId("");
      setMessage("Vereinsvorschlag bearbeitet und angenommen");
    } else {
      setClubs(upsertClub(clubInput));
      setMessage("Verein gespeichert");
    }
    setEditingClub(null);
    event.currentTarget.reset();
  };

  const removeClub = (clubId: string) => {
    setClubs(deleteClub(clubId));
    setMessage("Verein geloescht");
  };

  const reviewClub = (requestId: string, status: "approved" | "rejected") => {
    const result = reviewClubRequest(requestId, status, user.userId);
    setClubRequests(result.requests);
    setClubs(result.clubs);
    setAuthUsers(loadUsers());
    setMessage(status === "approved" ? "Vereinsvorschlag angenommen" : "Vereinsvorschlag abgelehnt");
  };

  const athleteFormValue = editingAthlete ?? defaultAthlete(user.userId);
  const groupFormValue: Pick<CoachGroup, "name" | "description" | "ageRange" | "trainingFocus" | "athleteIds"> =
    editingGroup ?? { name: "", description: "", ageRange: "", trainingFocus: "", athleteIds: [] };
  const toggleAthleteBoatClass = (boatClass: BoatClass) => {
    setAthleteBoatClasses((current) => {
      if (current.includes(boatClass)) {
        return current.length === 1 ? current : current.filter((item) => item !== boatClass);
      }

      return [...current, boatClass];
    });
  };

  const startEditingAthlete = (athlete: CoachAthlete) => {
    setEditingAthlete(athlete);
    setAthleteBoatClasses(athlete.boatClasses.length > 0 ? athlete.boatClasses : ["K1"]);
  };

  return (
    <div className="stack coach-shell">
      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Coach Foundation</p>
            <h3>{roleLabels[user.role]}</h3>
          </div>
        </div>
        <div className="metric-grid">
          {metrics.map((metric) => (
            <article className="metric-card" key={metric.label}>
              <strong>{metric.value}</strong>
              <span>{metric.label}</span>
            </article>
          ))}
        </div>
      </section>

      {!isAdmin ? (
        <section className="section-block">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Mein Verein</p>
              <h3>{myClub?.name ?? user.profile.club ?? "Kein Verein"}</h3>
            </div>
          </div>
          <div className="metric-grid">
            <article className="metric-card">
              <strong>{clubAthletes.length}</strong>
              <span>Sportler im Verein</span>
            </article>
            <article className="metric-card">
              <strong>{ownGroups.length}</strong>
              <span>Gruppen im Verein</span>
            </article>
            <article className="metric-card">
              <strong>{openFeedback}</strong>
              <span>Offene Rueckmeldungen</span>
            </article>
          </div>
          <p className="card-note">Coach-Zugriff ist auf diesen Verein begrenzt.</p>
        </section>
      ) : null}

      {canManageAdmin(user.role) ? (
        <section className="section-block">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Admin</p>
              <h3>Vereine</h3>
            </div>
          </div>
          <form className="entry-form" onSubmit={saveClub}>
            <div className="form-grid">
              <label>Name<input name="name" defaultValue={editingClub?.name ?? ""} required /></label>
              <label>Kurzname<input name="shortName" defaultValue={editingClub?.shortName ?? ""} placeholder="MKC" /></label>
              <label>Stadt<input name="city" defaultValue={editingClub?.city ?? ""} /></label>
              <label>Kontakt<input name="contactName" defaultValue={editingClub?.contactName ?? ""} /></label>
              <label>E-Mail<input name="contactEmail" type="email" defaultValue={editingClub?.contactEmail ?? ""} /></label>
              <label>Website<input name="website" defaultValue={editingClub?.website ?? ""} /></label>
              <label>Logo URL<input name="logoUrl" defaultValue={editingClub?.logoUrl ?? ""} /></label>
              <label>Primary<input name="primaryColor" type="color" defaultValue={editingClub?.primaryColor ?? "#00B4D8"} /></label>
              <label>Secondary<input name="secondaryColor" type="color" defaultValue={editingClub?.secondaryColor ?? "#0077B6"} /></label>
              <label>
                Status
                <select name="status" defaultValue={editingClub?.status ?? "active"}>
                  <option value="active">aktiv</option>
                  <option value="inactive">inaktiv</option>
                </select>
              </label>
            </div>
            <div className="card-actions">
              <button className="save-button" type="submit">{editingClub ? "Verein speichern" : "Verein erstellen"}</button>
              {editingClub ? <button type="button" onClick={() => {
                setEditingClub(null);
                setEditingClubRequestId("");
              }}>Abbrechen</button> : null}
            </div>
          </form>
          <div className="club-card-grid">
            {clubs.length > 0 ? clubs.map((club) => {
              const clubUsers = authUsers.filter((authUser) => normalizeClubName(authUser.club) === normalizeClubName(club.name));
              const clubTrainers = clubUsers.filter((authUser) => authUser.role === "coach");
              const clubAthleteCount = clubUsers.filter((authUser) => authUser.role === "athlete").length;
              return (
                <article className="club-card" key={club.clubId} style={{ borderColor: club.primaryColor ?? "#00B4D8" }}>
                  <div className="club-badge" style={{ background: club.primaryColor ?? "#00B4D8" }}>{club.shortName || club.name.slice(0, 3)}</div>
                  <div>
                    <strong>{club.name}</strong>
                    <span>{club.city || "Keine Stadt"}</span>
                    <small>Status: {club.status === "active" ? "aktiv" : "inaktiv"}</small>
                  </div>
                  <div className="smart-detail-grid">
                    <span>{clubAthleteCount} Sportler</span>
                    <span>{clubTrainers.length} Trainer</span>
                    <span>{club.contactEmail || "Keine Kontakt-E-Mail"}</span>
                  </div>
                  <div className="card-actions">
                    <button type="button" onClick={() => setEditingClub(club)}>Bearbeiten</button>
                    <button type="button" onClick={() => setUserSearch(club.name)}>Sportler anzeigen</button>
                    <button type="button" onClick={() => setRoleFilter("coach")}>Trainer anzeigen</button>
                    <button type="button" onClick={() => removeClub(club.clubId)}>Loeschen</button>
                  </div>
                </article>
              );
            }) : <p className="empty-state">Noch keine offiziellen Vereine vorhanden.</p>}
          </div>
        </section>
      ) : null}

      {canManageAdmin(user.role) ? (
        <section className="section-block">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Admin</p>
              <h3>Vereinsvorschlaege</h3>
            </div>
          </div>
          <div className="result-list">
            {clubRequests.length > 0 ? clubRequests.map((request) => (
              <article className="user-admin-card" key={request.requestId}>
                <div>
                  <strong>{request.shortName || request.name.slice(0, 4)} - {request.name}</strong>
                  <span>{request.city || "Keine Stadt"} - {request.contactEmail || "Keine E-Mail"}</span>
                  <small>Status: {request.status}</small>
                </div>
                {request.status === "open" ? (
                  <div className="card-actions">
                    <button type="button" onClick={() => reviewClub(request.requestId, "approved")}>Annehmen</button>
                    <button type="button" onClick={() => {
                      setEditingClubRequestId(request.requestId);
                      setEditingClub({
                        clubId: "",
                        name: request.name,
                        shortName: request.shortName,
                        city: request.city,
                        contactName: request.contactName,
                        contactEmail: request.contactEmail,
                        website: request.website,
                        logoUrl: "",
                        primaryColor: "#00B4D8",
                        secondaryColor: "#0077B6",
                        status: "active",
                        createdAt: "",
                        updatedAt: "",
                      });
                    }}>Bearbeiten und annehmen</button>
                    <button type="button" onClick={() => reviewClub(request.requestId, "rejected")}>Ablehnen</button>
                  </div>
                ) : null}
              </article>
            )) : <p className="empty-state">Keine offenen Vereinsvorschlaege.</p>}
          </div>
        </section>
      ) : null}

      {canManageAdmin(user.role) ? (
        <section className="section-block">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Admin</p>
              <h3>Traineranfragen</h3>
            </div>
          </div>
          <div className="result-list">
            {trainerRequests.length > 0 ? trainerRequests.map((request) => {
              const requester = authUsers.find((authUser) => authUser.userId === request.userId);
              return (
                <article className="user-admin-card" key={request.requestId}>
                  <div>
                    <strong>{requester?.displayName ?? "Unbekannter Nutzer"}</strong>
                    <span>{requester?.email ?? "Keine E-Mail"} - {request.club || requester?.club || "ohne Verein"}</span>
                    <small>{request.hasLicense ? "Trainerlizenz vorhanden" : "Keine Trainerlizenz"} - {request.status}</small>
                  </div>
                  <div className="request-detail-grid">
                    <span>Qualifikation: {request.qualification || "nicht angegeben"}</span>
                    <span>Lizenznummer: {request.licenseNumber || "optional"}</span>
                    <span>Telefon: {request.phone || "nicht angegeben"}</span>
                    <span>Datum: {new Date(request.createdAt).toLocaleDateString("de-DE")}</span>
                    <span>Nachricht: {request.message || "keine Nachricht"}</span>
                    <span>Bemerkung: {request.remark || "keine Bemerkung"}</span>
                  </div>
                  {request.status === "open" ? (
                    <div className="card-actions">
                      <button type="button" onClick={() => reviewRequest(request.requestId, "approved")}>Genehmigen</button>
                      <button type="button" onClick={() => reviewRequest(request.requestId, "rejected")}>Ablehnen</button>
                    </div>
                  ) : null}
                </article>
              );
            }) : <p className="empty-state">Keine Traineranfragen vorhanden.</p>}
          </div>
        </section>
      ) : null}

      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{isAdmin ? "Admin" : "Coach"}</p>
            <h3>Benutzer</h3>
          </div>
        </div>
        <div className="entry-form compact-form">
          <div className="form-grid">
            <label>Suche<input value={userSearch} onChange={(event) => setUserSearch(event.target.value)} placeholder="Name, E-Mail, Verein" /></label>
            <label>
              Rolle
              <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value as UserRole | "all")}>
                <option value="all">Alle Rollen</option>
                <option value="athlete">Athlete</option>
                {isAdmin ? <option value="coach">Coach</option> : null}
                {isAdmin ? <option value="teamAdmin">TeamAdmin</option> : null}
              </select>
            </label>
            <label>
              Sortierung
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value as "name" | "email" | "role" | "club")}>
                <option value="name">Name</option>
                <option value="email">E-Mail</option>
                <option value="club">Verein</option>
                <option value="role">Rolle</option>
              </select>
            </label>
          </div>
        </div>
        <div className="result-list">
          {visibleAuthUsers.length > 0 ? visibleAuthUsers.map((authUser) => (
            <article className="user-admin-card" key={authUser.userId}>
              <div>
                <div className="user-admin-card-header">
                  <span className="profile-avatar small">{`${authUser.firstName.slice(0, 1)}${authUser.lastName.slice(0, 1)}` || "P"}</span>
                  <strong>{authUser.displayName || `${authUser.firstName} ${authUser.lastName}`.trim() || authUser.email}</strong>
                </div>
                <span>{authUser.email}</span>
                <small>{authUser.club || "ohne Verein"} - {authUser.roles.map((role) => roleLabels[role]).join(", ")} - {authUser.status === "active" ? "aktiv" : "deaktiviert"}</small>
              </div>
              <div className="form-grid">
                {isAdmin && authUser.role !== "admin" ? (
                  <label>
                    Rolle
                    <select value={authUser.role} onChange={(event) => changeRole(authUser.userId, event.target.value as UserRole)}>
                      <option value="athlete">Athlete</option>
                      <option value="coach">Coach</option>
                      <option value="teamAdmin">TeamAdmin</option>
                    </select>
                  </label>
                ) : null}
                <label>
                  Trainingsgruppe
                  <select
                    value={authUser.trainingGroupId}
                    onChange={(event) => changeTrainingGroup(authUser.userId, event.target.value)}
                    disabled={!isAdmin && authUser.role !== "athlete"}
                  >
                    <option value="">Keine Gruppe</option>
                    {ownGroups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
                  </select>
                </label>
                {isAdmin ? (
                  <label>
                    Status
                    <select value={authUser.status} onChange={(event) => changeStatus(authUser.userId, event.target.value as "active" | "inactive")}>
                      <option value="active">aktiv</option>
                      <option value="inactive">deaktiviert</option>
                    </select>
                  </label>
                ) : null}
              </div>
              {isAdmin ? (
                <div className="card-actions full-width">
                  <button type="button" onClick={() => removeUser(authUser.userId)}>Benutzer loeschen</button>
                </div>
              ) : null}
            </article>
          )) : <p className="empty-state">Keine Benutzer fuer deinen Zugriff gefunden.</p>}
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Sportlerverwaltung</p>
            <h3>Sportler anlegen</h3>
          </div>
        </div>
        <form className="entry-form" onSubmit={upsertAthlete}>
          <div className="form-grid">
            <label>Name<input name="name" defaultValue={athleteFormValue.name} required /></label>
            <label>Geburtsdatum<input name="birthDate" type="date" defaultValue={athleteFormValue.birthDate} /></label>
            <label>
              Altersklasse
              <select name="ageClass" defaultValue={athleteFormValue.ageClass}>
                {ageClasses.map((ageClass) => <option key={ageClass || "empty"} value={ageClass}>{ageClass || "Bitte waehlen"}</option>)}
              </select>
            </label>
            <label>Verein<input name="club" defaultValue={athleteFormValue.club} /></label>
            <label>
              Gruppe
              <select name="groupId" defaultValue={athleteFormValue.groupId}>
                <option value="">Keine Gruppe</option>
                {ownGroups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
              </select>
            </label>
            <label>
              Status
              <select name="status" defaultValue={athleteFormValue.status}>
                <option value="aktiv">aktiv</option>
                <option value="pausiert">pausiert</option>
              </select>
            </label>
          </div>
          <div className="choice-group">
            <span>Bootsklassen</span>
            <div className="boat-class-grid">
              {(["K1", "C1"] as BoatClass[]).map((boatClass) => (
                <label className={athleteBoatClasses.includes(boatClass) ? "boat-class-option active" : "boat-class-option"} key={boatClass}>
                  <input
                    checked={athleteBoatClasses.includes(boatClass)}
                    onChange={() => toggleAthleteBoatClass(boatClass)}
                    type="checkbox"
                    value={boatClass}
                  />
                  {boatClass}
                </label>
              ))}
            </div>
          </div>
          {athleteBoatClasses.includes("C1") ? (
            <label>Paddelseite bei C1<select name="paddleSide" defaultValue={athleteFormValue.paddleSide}><option value="links">Links</option><option value="rechts">Rechts</option></select></label>
          ) : null}
          <label>Ziele<textarea name="goals" defaultValue={athleteFormValue.goals} rows={3} /></label>
          <label>Notizen<textarea name="notes" defaultValue={athleteFormValue.notes} rows={3} /></label>
          <button className="save-button" type="submit">{editingAthlete ? "Sportler speichern" : "Sportler anlegen"}</button>
        </form>
        <div className="result-list">
          {ownAthletes.map((athlete) => (
            <article className="summary-strip" key={athlete.id}>
              <span>{athlete.name} - {athlete.ageClass || "ohne AK"} - {athlete.boatClasses.join(" + ")}</span>
              <div className="card-actions">
                <button type="button" onClick={() => startEditingAthlete(athlete)}>Bearbeiten</button>
                <button type="button" onClick={() => deleteAthlete(athlete.id)}>Loeschen</button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Gruppenverwaltung</p>
            <h3>Gruppen</h3>
          </div>
        </div>
        <form className="entry-form" onSubmit={upsertGroup}>
          <div className="form-grid">
            <label>Gruppenname<input name="name" defaultValue={groupFormValue.name} required /></label>
            <label>Altersbereich<input name="ageRange" defaultValue={groupFormValue.ageRange} /></label>
            <label>Trainingsfokus<input name="trainingFocus" defaultValue={groupFormValue.trainingFocus} /></label>
          </div>
          <label>Beschreibung<textarea name="description" defaultValue={groupFormValue.description} rows={3} /></label>
          <div className="choice-group">
            <span>Sportler zuordnen</span>
            <div className="tag-row">
              {ownAthletes.map((athlete) => (
                <label className="toggle-row" key={athlete.id}>
                  <span>{athlete.name}</span>
                  <input name="athleteIds" type="checkbox" value={athlete.id} defaultChecked={groupFormValue.athleteIds.includes(athlete.id)} />
                </label>
              ))}
            </div>
          </div>
          <button className="save-button" type="submit">{editingGroup ? "Gruppe speichern" : "Gruppe anlegen"}</button>
        </form>
        <div className="result-list">
          {ownGroups.map((group) => (
            <article className="summary-strip" key={group.id}>
              <span>{group.name} - {group.trainingFocus || "ohne Fokus"} - {group.athleteIds.length} Sportler</span>
              <div className="card-actions">
                <button type="button" onClick={() => setEditingGroup(group)}>Bearbeiten</button>
                <button type="button" onClick={() => deleteGroup(group.id)}>Loeschen</button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Trainingsplaene</p>
            <h3>Training zuweisen</h3>
          </div>
        </div>
        <form className="entry-form" onSubmit={assignTraining}>
          <div className="form-grid">
            <label>Datum<input name="date" type="date" defaultValue={todayKey()} /></label>
            <label>Uhrzeit<input name="time" type="time" defaultValue="17:00" /></label>
            <label>Dauer<input name="durationMinutes" type="number" min="0" defaultValue={60} /></label>
            <label>Ziel<select name="target" defaultValue="self"><option value="self">sich selbst</option>{ownAthletes.map((athlete) => <option key={athlete.id} value={`athlete:${athlete.id}`}>{athlete.name}</option>)}{ownGroups.map((group) => <option key={group.id} value={`group:${group.id}`}>{group.name}</option>)}</select></label>
            <label>Bereich<select name="area" defaultValue="Wassertraining">{trainingAreas.map((area) => <option key={area} value={area}>{area}</option>)}</select></label>
            <label>Art<select name="trainingType" defaultValue="K1 Technik">{trainingTypes.map((type) => <option key={type} value={type}>{type}</option>)}</select></label>
            <label>Intensitaet<select name="intensity" defaultValue="mittel">{intensities.map((intensity) => <option key={intensity} value={intensity}>{intensity}</option>)}</select></label>
          </div>
          <label>Trainingsziel<input name="goal" placeholder="z. B. Tor 6 sauber anfahren" /></label>
          <label>Notiz<textarea name="note" rows={3} /></label>
          <button className="save-button" type="submit">Training zuweisen</button>
        </form>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Sportleransicht</p>
            <h3>Vorschau</h3>
          </div>
        </div>
        <label className="profile-form">
          Sportler
          <select value={previewAthlete?.id ?? ""} onChange={(event) => setSelectedPreviewAthleteId(event.target.value)}>
            {ownAthletes.map((athlete) => <option key={athlete.id} value={athlete.id}>{athlete.name}</option>)}
          </select>
        </label>
        {previewAthlete ? (
          <div className="stack">
            <article className="today-training-card">
              <div>
                <p className="eyebrow">Heute</p>
                <h3>{todaysPreviewTraining?.trainingType ?? "Kein Training"}</h3>
                <span>{todaysPreviewTraining?.goal || "Noch keine Einheit fuer heute geplant."}</span>
              </div>
            </article>
            <div className="result-list">
              {previewPlan.filter((entry) => isThisWeek(entry.date)).map((entry) => (
                <article className="summary-strip" key={entry.id}>
                  <span>{entry.weekday} {entry.time} - {entry.trainingType} - {entry.goal}</span>
                </article>
              ))}
            </div>
            <p className="card-note">Ziele: {previewAthlete.goals || "Noch keine Ziele hinterlegt."}</p>
            <label className="profile-form">Rueckmeldung<textarea rows={3} placeholder="Spaeter sendet der Sportler hier Feedback." /></label>
          </div>
        ) : <p className="empty-state">Lege zuerst einen Sportler an.</p>}
      </section>

      {message ? <p className="auth-message">{message}</p> : null}
    </div>
  );
}
