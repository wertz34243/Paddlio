import { useMemo, useState, type FormEvent } from "react";
import { SegmentNav, type SegmentItem } from "../components/SegmentNav";
import { createId } from "../data/storage";
import { canManageAdminArea, canUseCoachArea, getAthletesForCurrentUser, getGroupsForCurrentUser } from "../domain/accessControl";
import type {
  BoatClass,
  ClubBoat,
  ClubDocument,
  ClubDocumentFolder,
  ClubEvent,
  ClubEventCategory,
  ClubMaterial,
  ClubMaterialCategory,
  ClubMessage,
  ClubMessageAudience,
  ClubSettings,
  PaddleMotionData,
  User,
  UserRole,
} from "../domain/types";
import {
  upsertCloudClubBoat,
  upsertCloudClubDocument,
  upsertCloudClubEvent,
  upsertCloudClubMaterial,
  upsertCloudClubMessage,
  upsertCloudClubSettings,
} from "../services/clubPortalService";
import { todayDateKey } from "../lib/dateOnly";

type ClubPortalViewProps = {
  data: PaddleMotionData;
  user: User;
  onDataChange: (updater: (current: PaddleMotionData) => PaddleMotionData) => void;
};

type ClubPortalSegment = "dashboard" | "members" | "trainers" | "groups" | "material" | "boats" | "calendar" | "documents" | "messages" | "settings";

const segments: SegmentItem<ClubPortalSegment>[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "members", label: "Mitglieder" },
  { id: "trainers", label: "Trainer" },
  { id: "groups", label: "Gruppen" },
  { id: "material", label: "Material" },
  { id: "boats", label: "Boote" },
  { id: "calendar", label: "Kalender" },
  { id: "documents", label: "Dokumente" },
  { id: "messages", label: "Nachrichten" },
  { id: "settings", label: "Einstellungen" },
];

const materialCategories: ClubMaterialCategory[] = ["Boot", "Paddel", "Helm", "Schwimmweste", "Spritzdecke", "Anhänger", "Vereinsmaterial"];
const eventCategories: ClubEventCategory[] = ["training", "competition", "meeting", "club_party", "workday"];
const documentFolders: ClubDocumentFolder[] = ["Trainer", "Sportler", "Vorstand", "Wettkämpfe", "Formulare"];
const audiences: ClubMessageAudience[] = ["club", "coaches", "athletes", "group", "athlete"];

const roleLabel: Record<UserRole, string> = {
  athlete: "Athlete",
  coach: "Coach",
  teamAdmin: "TeamAdmin",
  clubAdmin: "ClubAdmin",
  admin: "Admin",
};

const eventLabel: Record<ClubEventCategory, string> = {
  training: "Training",
  competition: "Wettkampf",
  meeting: "Sitzung",
  club_party: "Vereinsfeier",
  workday: "Arbeitseinsatz",
};

const audienceLabel: Record<ClubMessageAudience, string> = {
  club: "Verein",
  coaches: "Trainer",
  athletes: "Sportler",
  group: "Gruppe",
  athlete: "einzelner Sportler",
};

const todayKey = todayDateKey;

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
  const current = new Date(`${date}T00:00:00`);
  return current >= start && current < end;
};

const numberValue = (value: FormDataEntryValue | null): number => Number(value || 0);

export function ClubPortalView({ data, user, onDataChange }: ClubPortalViewProps) {
  const [segment, setSegment] = useState<ClubPortalSegment>("dashboard");
  const [memberQuery, setMemberQuery] = useState("");
  const [memberRole, setMemberRole] = useState<UserRole | "all">("all");
  const [message, setMessage] = useState("");
  const canManageClub = canUseCoachArea(user.role);
  const isAdmin = canManageAdminArea(user.role);
  const userClubName = user.profile.club.trim().toLowerCase();
  const clubIds = useMemo(() => {
    if (isAdmin) return Array.from(new Set([...(data.coachGroups.map((group) => group.clubId)), ...(data.coachAthletes.map((athlete) => athlete.clubId)), user.profile.club].filter(Boolean)));
    return Array.from(new Set([user.profile.club, ...data.coachGroups.filter((group) => group.clubId === user.profile.club || group.coachUserId === user.userId).map((group) => group.clubId)].filter(Boolean)));
  }, [data.coachAthletes, data.coachGroups, isAdmin, user.profile.club, user.userId]);
  const primaryClubId = clubIds[0] || user.profile.club || "club-local";
  const clubAthletes = useMemo(() => getAthletesForCurrentUser(data, user, clubIds), [clubIds, data, user]);
  const clubGroups = useMemo(() => getGroupsForCurrentUser(data, user, clubIds), [clubIds, data, user]);
  const members = useMemo(() => {
    const localProfiles = data.users.map((localUser) => ({
      id: localUser.userId,
      name: `${localUser.profile.firstName} ${localUser.profile.lastName}`.trim() || localUser.profile.nickname || "Athlet",
      email: "",
      role: localUser.role,
      club: localUser.profile.club,
      ageClass: localUser.profile.ageClass,
      boatClasses: localUser.profile.boatClasses,
      status: "aktiv",
      joinedAt: localUser.createdAt,
      avatar: localUser.profile.profileImageDataUrl,
    }));
    const coachProfiles = clubAthletes.map((athlete) => ({
      id: athlete.id,
      name: athlete.name,
      email: athlete.email,
      role: "athlete" as UserRole,
      club: athlete.club,
      ageClass: athlete.ageClass,
      boatClasses: athlete.boatClasses,
      status: athlete.status,
      joinedAt: athlete.createdAt,
      avatar: "",
    }));
    const all = [...localProfiles, ...coachProfiles].filter((item, index, list) => list.findIndex((candidate) => candidate.id === item.id) === index);
    const query = memberQuery.trim().toLowerCase();
    return all
      .filter((item) => isAdmin || item.club.toLowerCase() === userClubName || clubIds.includes(item.club))
      .filter((item) => isAdmin || item.role !== "admin")
      .filter((item) => memberRole === "all" || item.role === memberRole)
      .filter((item) => !query || [item.name, isAdmin ? item.email : "", item.club, item.ageClass, item.boatClasses.join(" ")].join(" ").toLowerCase().includes(query));
  }, [clubAthletes, clubIds, data.users, isAdmin, memberQuery, memberRole, userClubName]);
  const trainers = members.filter((member) => member.role === "coach" || member.role === "teamAdmin" || member.role === "clubAdmin" || member.role === "admin");
  const scopedPlan = data.plan.filter((entry) => isAdmin || clubIds.includes(entry.clubId) || entry.ownerUserId === user.userId);
  const scopedCompetitions = data.competitions.filter((competition) => isAdmin || clubAthletes.some((athlete) => athlete.id === competition.athleteId) || competition.athleteId === data.athlete.id);
  const material = data.clubMaterial.filter((item) => isAdmin || clubIds.includes(item.clubId));
  const boats = data.clubBoats.filter((item) => isAdmin || clubIds.includes(item.clubId));
  const events = data.clubEvents.filter((item) => isAdmin || clubIds.includes(item.clubId)).sort((a, b) => a.date.localeCompare(b.date));
  const documents = data.clubDocuments.filter((item) => isAdmin || clubIds.includes(item.clubId));
  const messages = data.clubMessages.filter((item) => isAdmin || clubIds.includes(item.clubId)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const settings = data.clubSettings.find((item) => item.clubId === primaryClubId) ?? {
    clubId: primaryClubId,
    logoUrl: "",
    primaryColor: "#00B4D8",
    secondaryColor: "#0077B6",
    address: "",
    homepage: "",
    contactName: "",
    contactEmail: "",
    clubNumber: "",
    imprint: "",
    updatedAt: new Date().toISOString(),
  };

  if (!canManageClub) {
    return (
      <section className="section-block">
        <p className="eyebrow">Verein</p>
        <h3>{user.profile.club || "Mein Verein"}</h3>
        <p className="card-note">Athleten sehen hier aktuell die eigene Vereinszuordnung. Das vollständige Vereinsportal ist für Coach, ClubAdmin und Admin freigeschaltet.</p>
      </section>
    );
  }

  const saveLocalAndCloud = <T,>(successMessage: string, update: (current: PaddleMotionData) => PaddleMotionData, cloudAction: () => Promise<T>) => {
    onDataChange(update);
    void cloudAction()
      .then(() => setMessage(successMessage))
      .catch((error) => {
        console.error("[Paddlio Cloud] Vereinsportal konnte nicht speichern", error);
        setMessage("Lokal gespeichert. Cloud-Synchronisation wird erneut versucht, sobald die Berechtigung passt.");
      });
  };

  const upsertMaterial = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const timestamp = new Date().toISOString();
    const item: ClubMaterial = {
      id: createId("club-material"),
      clubId: primaryClubId,
      inventoryNumber: String(form.get("inventoryNumber") ?? "").trim(),
      category: String(form.get("category") ?? "Vereinsmaterial") as ClubMaterialCategory,
      name: String(form.get("name") ?? "").trim(),
      condition: String(form.get("condition") ?? "bereit").trim(),
      ownerUserId: "",
      ownerName: String(form.get("ownerName") ?? "").trim(),
      photoUrl: String(form.get("photoUrl") ?? "").trim(),
      lastInspectionDate: String(form.get("lastInspectionDate") ?? ""),
      remark: String(form.get("remark") ?? "").trim(),
      status: "active",
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    saveLocalAndCloud("Material gespeichert", (current) => ({ ...current, clubMaterial: [item, ...current.clubMaterial] }), () => upsertCloudClubMaterial(item));
    event.currentTarget.reset();
  };

  const upsertBoat = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const timestamp = new Date().toISOString();
    const boat: ClubBoat = {
      id: createId("club-boat"),
      clubId: primaryClubId,
      manufacturer: String(form.get("manufacturer") ?? "").trim(),
      model: String(form.get("model") ?? "").trim(),
      boatClass: String(form.get("boatClass") ?? "K1") as BoatClass,
      lengthCm: numberValue(form.get("lengthCm")),
      weightKg: numberValue(form.get("weightKg")),
      buildYear: numberValue(form.get("buildYear")),
      ownerUserId: "",
      ownerName: String(form.get("ownerName") ?? "").trim(),
      isClubBoat: form.get("isClubBoat") === "on",
      linkedAthleteIds: form.getAll("linkedAthleteIds").map(String),
      status: "active",
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    saveLocalAndCloud("Boot gespeichert", (current) => ({ ...current, clubBoats: [boat, ...current.clubBoats] }), () => upsertCloudClubBoat(boat));
    event.currentTarget.reset();
  };

  const upsertEvent = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const timestamp = new Date().toISOString();
    const item: ClubEvent = {
      id: createId("club-event"),
      clubId: primaryClubId,
      title: String(form.get("title") ?? "").trim(),
      date: String(form.get("date") ?? todayKey()),
      time: String(form.get("time") ?? ""),
      category: String(form.get("category") ?? "training") as ClubEventCategory,
      groupId: String(form.get("groupId") ?? ""),
      trainerUserId: String(form.get("trainerUserId") ?? ""),
      athleteUserId: String(form.get("athleteUserId") ?? ""),
      note: String(form.get("note") ?? "").trim(),
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    saveLocalAndCloud("Kalendereintrag gespeichert", (current) => ({ ...current, clubEvents: [item, ...current.clubEvents] }), () => upsertCloudClubEvent(item));
    event.currentTarget.reset();
  };

  const upsertDocument = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const timestamp = new Date().toISOString();
    const document: ClubDocument = {
      id: createId("club-document"),
      clubId: primaryClubId,
      folder: String(form.get("folder") ?? "Formulare") as ClubDocumentFolder,
      title: String(form.get("title") ?? "").trim(),
      fileName: String(form.get("fileName") ?? "").trim(),
      fileUrl: String(form.get("fileUrl") ?? "").trim(),
      mimeType: String(form.get("mimeType") ?? "").trim(),
      visibleForRoles: form.getAll("visibleForRoles").map(String) as UserRole[],
      uploadedByUserId: user.userId,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    saveLocalAndCloud("Dokument gespeichert", (current) => ({ ...current, clubDocuments: [document, ...current.clubDocuments] }), () => upsertCloudClubDocument(document));
    event.currentTarget.reset();
  };

  const upsertMessage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const timestamp = new Date().toISOString();
    const item: ClubMessage = {
      id: createId("club-message"),
      clubId: primaryClubId,
      senderUserId: user.userId,
      audience: String(form.get("audience") ?? "club") as ClubMessageAudience,
      groupId: String(form.get("groupId") ?? ""),
      recipientUserId: String(form.get("recipientUserId") ?? ""),
      title: String(form.get("title") ?? "").trim(),
      body: String(form.get("body") ?? "").trim(),
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    saveLocalAndCloud("Nachricht gespeichert", (current) => ({ ...current, clubMessages: [item, ...current.clubMessages] }), () => upsertCloudClubMessage(item));
    event.currentTarget.reset();
  };

  const upsertSettings = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const next: ClubSettings = {
      clubId: primaryClubId,
      logoUrl: String(form.get("logoUrl") ?? "").trim(),
      primaryColor: String(form.get("primaryColor") ?? "#00B4D8"),
      secondaryColor: String(form.get("secondaryColor") ?? "#0077B6"),
      address: String(form.get("address") ?? "").trim(),
      homepage: String(form.get("homepage") ?? "").trim(),
      contactName: String(form.get("contactName") ?? "").trim(),
      contactEmail: String(form.get("contactEmail") ?? "").trim(),
      clubNumber: String(form.get("clubNumber") ?? "").trim(),
      imprint: String(form.get("imprint") ?? "").trim(),
      updatedAt: new Date().toISOString(),
    };
    saveLocalAndCloud("Vereinseinstellungen gespeichert", (current) => ({
      ...current,
      clubSettings: current.clubSettings.some((item) => item.clubId === next.clubId)
        ? current.clubSettings.map((item) => item.clubId === next.clubId ? next : item)
        : [next, ...current.clubSettings],
    }), () => upsertCloudClubSettings(next));
  };

  const dashboard = (
    <section className="club-dashboard-grid">
      {[
        ["Mitglieder", members.length],
        ["Trainer", trainers.length],
        ["Trainingsgruppen", clubGroups.length],
        ["Trainings diese Woche", scopedPlan.filter((entry) => isThisWeek(entry.date)).length],
        ["Wettkämpfe", scopedCompetitions.length],
        ["Neue Mitglieder", members.filter((member) => member.joinedAt.slice(0, 10) >= todayKey().slice(0, 8) + "01").length],
        ["Vereinsmaterial", material.length],
        ["Vereinsziele", data.goals.filter((goal) => isAdmin || clubAthletes.some((athlete) => athlete.id === goal.athleteId)).length],
      ].map(([label, value]) => (
        <article className="metric-card tone-training" key={String(label)}>
          <span>{label}</span>
          <strong>{value}</strong>
          <small>{isAdmin ? "alle geladenen Vereine" : user.profile.club || "eigener Verein"}</small>
        </article>
      ))}
    </section>
  );

  const membersView = (
    <section className="section-block">
      <div className="section-heading"><div><p className="eyebrow">Vereinsportal</p><h3>Mitglieder</h3></div></div>
      <div className="smart-coach-filters">
        <label>Suche<input value={memberQuery} onChange={(event) => setMemberQuery(event.target.value)} placeholder="Name, Boot, Gruppe" /></label>
        <label>Rolle<select value={memberRole} onChange={(event) => setMemberRole(event.target.value as UserRole | "all")}><option value="all">Alle</option><option value="athlete">Athlete</option><option value="coach">Coach</option><option value="teamAdmin">TeamAdmin</option><option value="clubAdmin">ClubAdmin</option>{isAdmin ? <option value="admin">Admin</option> : null}</select></label>
      </div>
      <div className="club-card-list">
        {members.length ? members.map((member) => (
          <article className="user-admin-card" key={member.id}>
            <div className="user-admin-card-header"><span className="profile-avatar small">{member.name.slice(0, 2).toUpperCase()}</span><div><strong>{member.name}</strong><small>{member.club || "ohne Verein"} - {roleLabel[member.role]}</small></div></div>
            <div className="smart-detail-grid"><span>{member.ageClass || "keine AK"}</span><span>{member.boatClasses.join(" + ") || "keine Bootsklasse"}</span><span>{member.status}</span><span>Eintritt {member.joinedAt.slice(0, 10)}</span></div>
          </article>
        )) : <p className="empty-state">Noch keine Mitglieder gefunden.</p>}
      </div>
    </section>
  );

  const trainersView = (
    <section className="section-block">
      <div className="section-heading"><div><p className="eyebrow">Vereinsportal</p><h3>Trainer</h3></div></div>
      <div className="club-card-list">
        {trainers.length ? trainers.map((trainer) => (
          <article className="calendar-training-card" key={trainer.id}>
            <div className="plan-card-head"><div><span>{roleLabel[trainer.role]}</span><h4>{trainer.name}</h4></div><b className="status-pill planned">aktiv</b></div>
            <div className="smart-detail-grid"><span>Lizenz vorbereitet</span><span>Qualifikation vorbereitet</span><span>{trainer.club}</span></div>
          </article>
        )) : <p className="empty-state">Noch keine Trainer im Verein hinterlegt.</p>}
      </div>
    </section>
  );

  const groupsView = (
    <section className="section-block">
      <div className="section-heading"><div><p className="eyebrow">Vereinsportal</p><h3>Trainingsgruppen</h3></div></div>
      <div className="group-card-grid">
        {clubGroups.length ? clubGroups.map((group) => (
          <article className="training-group-card" key={group.id}>
            <div className="group-card-top"><span className="group-color-dot" style={{ background: group.color }} /><div><strong>{group.name}</strong><small>{group.ageCategory || "Alle"} - {group.trainingFocus}</small></div></div>
            <p>{group.description || "Gruppenbild, Co-Trainer, Orte und Maximalteilnehmer sind im Datenmodell vorbereitet."}</p>
            <div className="smart-detail-grid"><span>{group.boatClasses.join(" + ")}</span><span>{group.athleteIds.length} Sportler</span><span>Trainer {group.coachUserId || "offen"}</span></div>
          </article>
        )) : <p className="empty-state">Noch keine Gruppen im Verein.</p>}
      </div>
    </section>
  );

  const materialView = (
    <section className="section-block">
      <div className="section-heading"><div><p className="eyebrow">Inventar</p><h3>Material</h3></div></div>
      <form className="entry-form" onSubmit={upsertMaterial}>
        <div className="form-grid">
          <label>Inventarnummer<input name="inventoryNumber" /></label>
          <label>Kategorie<select name="category">{materialCategories.map((category) => <option key={category} value={category}>{category}</option>)}</select></label>
          <label>Name<input name="name" required /></label>
          <label>Zustand<input name="condition" placeholder="bereit, prüfen, defekt" /></label>
          <label>Besitzer<input name="ownerName" /></label>
          <label>Letzte Prüfung<input name="lastInspectionDate" type="date" /></label>
          <label>Foto URL<input name="photoUrl" /></label>
        </div>
        <label>Bemerkung<textarea name="remark" rows={3} /></label>
        <button className="save-button" type="submit">Material speichern</button>
      </form>
      <div className="wallet-list">{material.length ? material.map((item) => <article className="wallet-card" key={item.id}><div className="wallet-image">{item.photoUrl ? <img src={item.photoUrl} alt="" /> : <span>{item.category.slice(0, 1)}</span>}</div><div className="wallet-content"><div className="wallet-topline"><div><span>{item.inventoryNumber || item.category}</span><h4>{item.name}</h4></div><b className="status-pill planned">{item.condition}</b></div><p>{item.remark || "Keine Bemerkung."}</p><div className="smart-detail-grid"><span>{item.ownerName || "Verein"}</span><span>Prüfung {item.lastInspectionDate || "--"}</span></div></div></article>) : <p className="empty-state">Noch kein Vereinsmaterial eingetragen.</p>}</div>
    </section>
  );

  const boatsView = (
    <section className="section-block">
      <div className="section-heading"><div><p className="eyebrow">Inventar</p><h3>Boote</h3></div></div>
      <form className="entry-form" onSubmit={upsertBoat}>
        <div className="form-grid">
          <label>Hersteller<input name="manufacturer" /></label>
          <label>Modell<input name="model" required /></label>
          <label>Bootsklasse<select name="boatClass"><option value="K1">K1</option><option value="C1">C1</option><option value="C2">C2</option><option value="Mannschaft">Mannschaft</option></select></label>
          <label>Laenge cm<input name="lengthCm" type="number" /></label>
          <label>Gewicht kg<input name="weightKg" type="number" step="0.1" /></label>
          <label>Baujahr<input name="buildYear" type="number" /></label>
          <label>Besitzer<input name="ownerName" /></label>
          <label className="toggle-row">Vereinsboot<input name="isClubBoat" type="checkbox" defaultChecked /></label>
        </div>
        <div className="choice-group"><span>Sportler verknuepfen</span><div className="tag-row">{clubAthletes.map((athlete) => <label className="toggle-row" key={athlete.id}>{athlete.name}<input name="linkedAthleteIds" type="checkbox" value={athlete.id} /></label>)}</div></div>
        <button className="save-button" type="submit">Boot speichern</button>
      </form>
      <div className="wallet-list">{boats.length ? boats.map((boat) => <article className="wallet-card" key={boat.id}><div className="wallet-image"><span>{boat.boatClass}</span></div><div className="wallet-content"><div className="wallet-topline"><div><span>{boat.manufacturer || "Hersteller offen"}</span><h4>{boat.model || "Boot ohne Modell"}</h4></div><b className="status-pill planned">{boat.isClubBoat ? "Verein" : "Privat"}</b></div><div className="wallet-stats"><div><span>Laenge</span><strong>{boat.lengthCm || "--"} cm</strong></div><div><span>Gewicht</span><strong>{boat.weightKg || "--"} kg</strong></div><div><span>Baujahr</span><strong>{boat.buildYear || "--"}</strong></div></div><p>{boat.ownerName || "Kein Besitzer hinterlegt."}</p></div></article>) : <p className="empty-state">Noch keine Boote hinterlegt.</p>}</div>
    </section>
  );

  const calendarView = (
    <section className="section-block">
      <div className="section-heading"><div><p className="eyebrow">Verein</p><h3>Vereinskalender</h3></div></div>
      <form className="entry-form" onSubmit={upsertEvent}>
        <div className="form-grid"><label>Titel<input name="title" required /></label><label>Datum<input name="date" type="date" defaultValue={todayKey()} /></label><label>Uhrzeit<input name="time" type="time" /></label><label>Kategorie<select name="category">{eventCategories.map((category) => <option key={category} value={category}>{eventLabel[category]}</option>)}</select></label><label>Gruppe<select name="groupId"><option value="">Alle</option>{clubGroups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}</select></label></div>
        <label>Notiz<textarea name="note" rows={3} /></label><button className="save-button" type="submit">Termin speichern</button>
      </form>
      <div className="calendar-list">{events.length ? events.map((item) => <article className="calendar-training-card" key={item.id}><div className="plan-card-head"><div><span>{item.date} {item.time}</span><h4>{item.title}</h4></div><b className="status-pill planned">{eventLabel[item.category]}</b></div><p>{item.note || "Keine Notiz."}</p></article>) : <p className="empty-state">Noch keine Vereinstermine vorhanden.</p>}</div>
    </section>
  );

  const documentsView = (
    <section className="section-block">
      <div className="section-heading"><div><p className="eyebrow">Verein</p><h3>Dokumente</h3></div></div>
      <form className="entry-form" onSubmit={upsertDocument}><div className="form-grid"><label>Ordner<select name="folder">{documentFolders.map((folder) => <option key={folder} value={folder}>{folder}</option>)}</select></label><label>Titel<input name="title" required /></label><label>Dateiname<input name="fileName" /></label><label>Datei URL<input name="fileUrl" /></label><label>MIME Typ<input name="mimeType" placeholder="application/pdf" /></label></div><div className="choice-group"><span>Sichtbar für</span><div className="tag-row">{(["coach", "teamAdmin", "clubAdmin", "admin"] as UserRole[]).map((role) => <label className="toggle-row" key={role}>{roleLabel[role]}<input name="visibleForRoles" type="checkbox" value={role} defaultChecked /></label>)}</div></div><button className="save-button" type="submit">Dokument speichern</button></form>
      <div className="club-card-list">{documents.length ? documents.map((document) => <article className="user-admin-card" key={document.id}><strong>{document.title}</strong><span>{document.folder} - {document.fileName || "Metadaten"}</span><small>{document.fileUrl || "Upload vorbereitet, Storage-Bucket folgt."}</small></article>) : <p className="empty-state">Noch keine Dokumente vorhanden.</p>}</div>
    </section>
  );

  const messagesView = (
    <section className="section-block">
      <div className="section-heading"><div><p className="eyebrow">Verein</p><h3>Nachrichten</h3></div></div>
      <form className="entry-form" onSubmit={upsertMessage}><div className="form-grid"><label>Empfaenger<select name="audience">{audiences.map((audience) => <option key={audience} value={audience}>{audienceLabel[audience]}</option>)}</select></label><label>Gruppe<select name="groupId"><option value="">Keine Gruppe</option>{clubGroups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}</select></label><label>Titel<input name="title" required /></label></div><label>Nachricht<textarea name="body" rows={4} required /></label><button className="save-button" type="submit">Nachricht speichern</button></form>
      <div className="club-card-list">{messages.length ? messages.map((item) => <article className="user-admin-card" key={item.id}><strong>{item.title}</strong><span>{audienceLabel[item.audience]} - {item.createdAt.slice(0, 10)}</span><small>{item.body}</small></article>) : <p className="empty-state">Noch keine Vereinsnachrichten vorhanden.</p>}</div>
    </section>
  );

  const settingsView = (
    <section className="section-block">
      <div className="section-heading"><div><p className="eyebrow">Verein</p><h3>Einstellungen</h3></div></div>
      <form className="entry-form" onSubmit={upsertSettings}>
        <div className="form-grid"><label>Logo URL<input name="logoUrl" defaultValue={settings.logoUrl} /></label><label>Primaerfarbe<input name="primaryColor" type="color" defaultValue={settings.primaryColor} /></label><label>Sekundaerfarbe<input name="secondaryColor" type="color" defaultValue={settings.secondaryColor} /></label><label>Homepage<input name="homepage" defaultValue={settings.homepage} /></label><label>Ansprechpartner<input name="contactName" defaultValue={settings.contactName} /></label><label>Kontakt-E-Mail<input name="contactEmail" type="email" defaultValue={settings.contactEmail} /></label><label>Vereinsnummer<input name="clubNumber" defaultValue={settings.clubNumber} /></label></div>
        <label>Adresse<textarea name="address" rows={3} defaultValue={settings.address} /></label><label>Impressum<textarea name="imprint" rows={4} defaultValue={settings.imprint} /></label><button className="save-button" type="submit">Einstellungen speichern</button>
      </form>
    </section>
  );

  const renderSegment = () => {
    const content = {
      dashboard,
      members: membersView,
      trainers: trainersView,
      groups: groupsView,
      material: materialView,
      boats: boatsView,
      calendar: calendarView,
      documents: documentsView,
      messages: messagesView,
      settings: settingsView,
    };

    return content[segment];
  };

  return (
    <div className="category-shell club-portal">
      <SegmentNav label="Vereinsportal" items={segments} activeId={segment} onChange={setSegment} />
      <div className="segment-content stack">
        <section className="home-profile-card premium-hero">
          <div className="home-avatar">{settings.logoUrl ? <img src={settings.logoUrl} alt="" /> : "V"}</div>
          <div><p className="eyebrow">Vereinsportal</p><h2>{isAdmin ? "Alle Vereine" : user.profile.club || "Mein Verein"}</h2><p className="hero-slogan">Mitglieder. Training. Material. Organisation.</p></div>
        </section>
        {renderSegment()}
        {message ? <p className="auth-message">{message}</p> : null}
      </div>
    </div>
  );
}
