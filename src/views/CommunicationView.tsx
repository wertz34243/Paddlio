import { useMemo, useState, type FormEvent } from "react";
import { SegmentNav, type SegmentItem } from "../components/SegmentNav";
import { createId } from "../data/storage";
import { canManageAdminArea, canUseCoachArea, getAthletesForCurrentUser, getGroupsForCurrentUser, getTrainingsForCurrentUser } from "../domain/accessControl";
import type {
  ClubPost,
  ClubPostCategory,
  ClubPostPriority,
  ClubPostTargetType,
  DirectMessage,
  FileAttachment,
  GroupMessage,
  PaddleMotionData,
  TeamTask,
  TeamTaskAssignment,
  TeamTaskPriority,
  TeamTaskStatus,
  TeamTaskType,
  TrainingAttendance,
  TrainingAttendanceReason,
  TrainingAttendanceStatus,
  User,
} from "../domain/types";
import {
  upsertCloudClubPost,
  upsertCloudDirectMessage,
  upsertCloudFileAttachment,
  upsertCloudGroupMessage,
  upsertCloudTask,
  upsertCloudTaskAssignment,
  upsertCloudTrainingAttendance,
} from "../services/communicationService";

type CommunicationSegment = "messages" | "groups" | "news" | "tasks" | "attendance" | "files";

type CommunicationViewProps = {
  data: PaddleMotionData;
  user: User;
  onDataChange: (updater: (current: PaddleMotionData) => PaddleMotionData) => void;
};

const segments: SegmentItem<CommunicationSegment>[] = [
  { id: "messages", label: "Nachrichten" },
  { id: "groups", label: "Gruppen" },
  { id: "news", label: "Vereinsnews" },
  { id: "tasks", label: "Aufgaben" },
  { id: "attendance", label: "Anwesenheit" },
  { id: "files", label: "Dateien" },
];

const taskTypes: TeamTaskType[] = ["general", "technique", "material", "video", "competition", "training", "mental", "recovery"];
const priorities: TeamTaskPriority[] = ["normal", "important", "urgent"];
const postCategories: ClubPostCategory[] = ["info", "training", "competition", "material", "urgent", "organization"];
const targetTypes: ClubPostTargetType[] = ["club", "coaches", "group", "athlete"];
const attendanceStatuses: TrainingAttendanceStatus[] = ["attending", "not_attending", "unsure"];
const attendanceReasons: TrainingAttendanceReason[] = ["", "Schule", "Arbeit", "Krankheit", "Familie", "Wettkampf", "anderes"];

const todayKey = (): string => new Date().toISOString().slice(0, 10);

const formatShort = (value: string): string =>
  value ? new Date(value).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "--";

const statusLabel: Record<TrainingAttendanceStatus, string> = {
  pending: "offen",
  attending: "dabei",
  not_attending: "nicht dabei",
  unsure: "unsicher",
};

export function CommunicationView({ data, user, onDataChange }: CommunicationViewProps) {
  const [segment, setSegment] = useState<CommunicationSegment>("messages");
  const [selectedContactId, setSelectedContactId] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [message, setMessage] = useState("");
  const isAdmin = canManageAdminArea(user.role);
  const isCoachLike = canUseCoachArea(user.role);
  const clubIds = useMemo(() => Array.from(new Set([user.profile.club, ...data.coachGroups.map((group) => group.clubId)].filter(Boolean))), [data.coachGroups, user.profile.club]);
  const contacts = useMemo(() => {
    const athletes = getAthletesForCurrentUser(data, user, clubIds).map((athlete) => ({ id: athlete.id, name: athlete.name, role: "Athlete", clubId: athlete.clubId }));
    const local = data.users.map((item) => ({ id: item.userId, name: `${item.profile.firstName} ${item.profile.lastName}`.trim() || item.profile.nickname || "Paddlio Nutzer", role: item.role, clubId: item.profile.club }));
    return [...local, ...athletes].filter((item, index, list) => item.id !== user.userId && list.findIndex((candidate) => candidate.id === item.id) === index);
  }, [clubIds, data, user]);
  const groups = useMemo(() => getGroupsForCurrentUser(data, user, clubIds), [clubIds, data, user]);
  const trainings = useMemo(() => getTrainingsForCurrentUser(data, user, clubIds), [clubIds, data, user]);
  const contactId = selectedContactId || contacts[0]?.id || "";
  const groupId = selectedGroupId || groups[0]?.id || "";
  const directThread = data.directMessages
    .filter((item) => !item.deletedAt && ((item.senderId === user.userId && item.receiverId === contactId) || (item.receiverId === user.userId && item.senderId === contactId)))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const groupThread = data.groupMessages.filter((item) => !item.deletedAt && item.groupId === groupId).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const visiblePosts = data.clubPosts
    .filter((post) => !post.deletedAt)
    .filter((post) => isAdmin || clubIds.includes(post.clubId) || post.targetUserId === user.userId || post.targetType === "club")
    .sort((a, b) => Number(b.isPinned) - Number(a.isPinned) || b.createdAt.localeCompare(a.createdAt));
  const visibleTasks = data.tasks.filter((task) => !task.deletedAt && (isAdmin || clubIds.includes(task.clubId) || data.taskAssignments.some((assignment) => assignment.taskId === task.id && assignment.assignedTo === user.userId)));
  const myAssignments = data.taskAssignments.filter((assignment) => assignment.assignedTo === user.userId || isCoachLike || isAdmin);
  const attendance = data.trainingAttendance;
  const unreadDirect = data.directMessages.filter((item) => item.receiverId === user.userId && !item.isRead && !item.deletedAt).length;
  const unreadGroups = data.groupMessages.filter((item) => item.senderId !== user.userId && groups.some((group) => group.id === item.groupId) && !item.deletedAt).length;
  const openTasks = data.taskAssignments.filter((item) => item.assignedTo === user.userId && item.status !== "done").length;
  const pendingAttendance = trainings.filter((entry) => !attendance.some((item) => item.trainingId === entry.id && item.athleteId === user.userId)).length;

  const saveLocalAndCloud = <T,>(success: string, update: (current: PaddleMotionData) => PaddleMotionData, cloudAction: () => Promise<T>) => {
    onDataChange(update);
    void cloudAction()
      .then(() => setMessage(success))
      .catch((error) => {
        console.error("[Paddlio Kommunikation] Cloud-Speichern fehlgeschlagen", error);
        setMessage("Lokal gespeichert. Wird synchronisiert, sobald du online bist.");
      });
  };

  const sendDirect = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const text = String(form.get("message") ?? "").trim();
    if (!text || !contactId) return;
    const timestamp = new Date().toISOString();
    const item: DirectMessage = {
      id: createId("direct-message"),
      clubId: clubIds[0] ?? "",
      senderId: user.userId,
      receiverId: contactId,
      message: text,
      isRead: false,
      readAt: "",
      createdAt: timestamp,
      updatedAt: timestamp,
      deletedAt: "",
    };
    saveLocalAndCloud("Nachricht gesendet", (current) => ({ ...current, directMessages: [...current.directMessages, item] }), () => upsertCloudDirectMessage(item));
    event.currentTarget.reset();
  };

  const sendGroup = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const text = String(form.get("message") ?? "").trim();
    if (!text || !groupId) return;
    const timestamp = new Date().toISOString();
    const group = groups.find((item) => item.id === groupId);
    const item: GroupMessage = {
      id: createId("group-message"),
      clubId: group?.clubId ?? clubIds[0] ?? "",
      groupId,
      senderId: user.userId,
      message: text,
      createdAt: timestamp,
      updatedAt: timestamp,
      deletedAt: "",
    };
    saveLocalAndCloud("Gruppennachricht gesendet", (current) => ({ ...current, groupMessages: [...current.groupMessages, item] }), () => upsertCloudGroupMessage(item));
    event.currentTarget.reset();
  };

  const createPost = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const timestamp = new Date().toISOString();
    const item: ClubPost = {
      id: createId("club-post"),
      clubId: clubIds[0] ?? "",
      authorId: user.userId,
      title: String(form.get("title") ?? "").trim(),
      content: String(form.get("content") ?? "").trim(),
      category: String(form.get("category") ?? "info") as ClubPostCategory,
      priority: String(form.get("priority") ?? "normal") as ClubPostPriority,
      targetType: String(form.get("targetType") ?? "club") as ClubPostTargetType,
      targetGroupId: String(form.get("targetGroupId") ?? ""),
      targetUserId: String(form.get("targetUserId") ?? ""),
      expiresAt: String(form.get("expiresAt") ?? ""),
      isPinned: form.get("isPinned") === "on",
      createdAt: timestamp,
      updatedAt: timestamp,
      deletedAt: "",
    };
    saveLocalAndCloud("Vereinsmeldung erstellt", (current) => ({ ...current, clubPosts: [item, ...current.clubPosts] }), () => upsertCloudClubPost(item));
    event.currentTarget.reset();
  };

  const createTask = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const timestamp = new Date().toISOString();
    const assignedTo = String(form.get("assignedTo") ?? user.userId);
    const task: TeamTask = {
      id: createId("task"),
      clubId: clubIds[0] ?? "",
      createdBy: user.userId,
      title: String(form.get("title") ?? "").trim(),
      description: String(form.get("description") ?? "").trim(),
      taskType: String(form.get("taskType") ?? "general") as TeamTaskType,
      priority: String(form.get("priority") ?? "normal") as TeamTaskPriority,
      dueDate: String(form.get("dueDate") ?? ""),
      relatedTrainingId: "",
      relatedCompetitionId: "",
      createdAt: timestamp,
      updatedAt: timestamp,
      deletedAt: "",
    };
    const assignment: TeamTaskAssignment = {
      id: createId("task-assignment"),
      taskId: task.id,
      assignedTo,
      status: "open",
      completedAt: "",
      responseNote: "",
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    saveLocalAndCloud("Aufgabe erstellt", (current) => ({ ...current, tasks: [task, ...current.tasks], taskAssignments: [assignment, ...current.taskAssignments] }), async () => {
      await upsertCloudTask(task);
      await upsertCloudTaskAssignment(assignment);
    });
    event.currentTarget.reset();
  };

  const updateAssignment = (assignment: TeamTaskAssignment, status: TeamTaskStatus, note = "") => {
    const next: TeamTaskAssignment = { ...assignment, status, responseNote: note || assignment.responseNote, completedAt: status === "done" ? new Date().toISOString() : assignment.completedAt, updatedAt: new Date().toISOString() };
    saveLocalAndCloud("Aufgabe aktualisiert", (current) => ({ ...current, taskAssignments: current.taskAssignments.map((item) => item.id === next.id ? next : item) }), () => upsertCloudTaskAssignment(next));
  };

  const setAttendance = (trainingId: string, status: TrainingAttendanceStatus, reason: TrainingAttendanceReason, note: string) => {
    const training = trainings.find((item) => item.id === trainingId);
    const timestamp = new Date().toISOString();
    const existing = attendance.find((item) => item.trainingId === trainingId && item.athleteId === user.userId);
    const next: TrainingAttendance = {
      id: existing?.id ?? createId("attendance"),
      trainingId,
      athleteId: user.userId,
      clubId: training?.clubId ?? clubIds[0] ?? "",
      groupId: training?.assignedGroupId ?? "",
      status,
      reason,
      note,
      respondedAt: timestamp,
      createdAt: existing?.createdAt ?? timestamp,
      updatedAt: timestamp,
    };
    saveLocalAndCloud("Anwesenheit gespeichert", (current) => ({
      ...current,
      trainingAttendance: current.trainingAttendance.some((item) => item.id === next.id) ? current.trainingAttendance.map((item) => item.id === next.id ? next : item) : [next, ...current.trainingAttendance],
    }), () => upsertCloudTrainingAttendance(next));
  };

  const createAttachment = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const item: FileAttachment = {
      id: createId("attachment"),
      clubId: clubIds[0] ?? "",
      ownerId: user.userId,
      relatedType: String(form.get("relatedType") ?? "training") as FileAttachment["relatedType"],
      relatedId: String(form.get("relatedId") ?? ""),
      fileName: String(form.get("fileName") ?? "").trim(),
      filePath: String(form.get("filePath") ?? "").trim(),
      fileType: String(form.get("fileType") ?? "").trim(),
      fileSize: Number(form.get("fileSize") ?? 0),
      createdAt: new Date().toISOString(),
      deletedAt: "",
    };
    saveLocalAndCloud("Anhang vorbereitet", (current) => ({ ...current, fileAttachments: [item, ...current.fileAttachments] }), () => upsertCloudFileAttachment(item));
    event.currentTarget.reset();
  };

  const messagesView = (
    <section className="communication-layout">
      <div className="section-block">
        <div className="section-heading"><div><p className="eyebrow">Direktnachrichten</p><h3>{unreadDirect} ungelesen</h3></div></div>
        <div className="club-card-list">{contacts.length ? contacts.map((contact) => {
          const last = data.directMessages.filter((item) => item.senderId === contact.id || item.receiverId === contact.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
          return <button className={contactId === contact.id ? "communication-contact active" : "communication-contact"} type="button" key={contact.id} onClick={() => setSelectedContactId(contact.id)}><strong>{contact.name}</strong><span>{last?.message ?? "Noch keine Nachricht"}</span><small>{last ? formatShort(last.createdAt) : contact.role}</small></button>;
        }) : <p className="empty-state">Du hast noch keine Kontakte.</p>}</div>
      </div>
      <div className="section-block chat-panel">
        <h3>{contacts.find((item) => item.id === contactId)?.name ?? "Chat"}</h3>
        <div className="chat-thread">{directThread.length ? directThread.map((item) => <article className={item.senderId === user.userId ? "chat-bubble own" : "chat-bubble"} key={item.id}><p>{item.message}</p><small>{formatShort(item.createdAt)} {item.isRead ? "gelesen" : "ungelesen"}</small></article>) : <p className="empty-state">Du hast noch keine Nachrichten.</p>}</div>
        <form className="chat-form" onSubmit={sendDirect}><input name="message" placeholder="Nachricht schreiben" /><button className="save-button" type="submit">Senden</button></form>
      </div>
    </section>
  );

  const groupsView = (
    <section className="communication-layout">
      <div className="section-block"><div className="section-heading"><div><p className="eyebrow">Gruppenchat</p><h3>{unreadGroups} neue Meldungen</h3></div></div>{groups.length ? groups.map((group) => <button className={groupId === group.id ? "communication-contact active" : "communication-contact"} key={group.id} type="button" onClick={() => setSelectedGroupId(group.id)}><strong>{group.name}</strong><span>{group.athleteIds.length} Mitglieder</span><small>{data.groupMessages.filter((item) => item.groupId === group.id).length} Nachrichten</small></button>) : <p className="empty-state">Für diese Gruppe gibt es noch keine Nachrichten.</p>}</div>
      <div className="section-block chat-panel"><h3>{groups.find((item) => item.id === groupId)?.name ?? "Gruppe"}</h3><div className="chat-thread">{groupThread.length ? groupThread.map((item) => <article className={item.senderId === user.userId ? "chat-bubble own" : "chat-bubble"} key={item.id}><p>{item.message}</p><small>{formatShort(item.createdAt)}</small></article>) : <p className="empty-state">Für diese Gruppe gibt es noch keine Nachrichten.</p>}</div><form className="chat-form" onSubmit={sendGroup}><input name="message" placeholder="Gruppennachricht" disabled={!groupId} /><button className="save-button" type="submit" disabled={!groupId}>Senden</button></form></div>
    </section>
  );

  const newsView = (
    <section className="section-block">
      <div className="section-heading"><div><p className="eyebrow">Pinnwand</p><h3>Vereinsnews</h3></div></div>
      {isCoachLike || isAdmin ? <form className="entry-form" onSubmit={createPost}><div className="form-grid"><label>Titel<input name="title" required /></label><label>Kategorie<select name="category">{postCategories.map((item) => <option key={item} value={item}>{item}</option>)}</select></label><label>Priorität<select name="priority">{priorities.map((item) => <option key={item} value={item}>{item}</option>)}</select></label><label>Zielgruppe<select name="targetType">{targetTypes.map((item) => <option key={item} value={item}>{item}</option>)}</select></label><label>Ablaufdatum<input name="expiresAt" type="datetime-local" /></label><label className="toggle-row">Wichtig<input name="isPinned" type="checkbox" /></label></div><label>Inhalt<textarea name="content" rows={4} required /></label><button className="save-button" type="submit">Beitrag erstellen</button></form> : null}
      <div className="club-card-list">{visiblePosts.length ? visiblePosts.map((post) => <article className={`club-post-card priority-${post.priority}`} key={post.id}><div className="plan-card-head"><div><span>{post.category} - {formatShort(post.createdAt)}</span><h4>{post.title}</h4></div>{post.isPinned ? <b className="status-pill planned">Wichtig</b> : null}</div><p>{post.content}</p><small>Zielgruppe: {post.targetType}</small></article>) : <p className="empty-state">Keine Vereinsmeldungen vorhanden.</p>}</div>
    </section>
  );

  const tasksView = (
    <section className="section-block">
      <div className="section-heading"><div><p className="eyebrow">Aufgaben</p><h3>{openTasks} offen</h3></div></div>
      {isCoachLike || isAdmin ? <form className="entry-form" onSubmit={createTask}><div className="form-grid"><label>Titel<input name="title" required /></label><label>Typ<select name="taskType">{taskTypes.map((item) => <option key={item} value={item}>{item}</option>)}</select></label><label>Priorität<select name="priority">{priorities.map((item) => <option key={item} value={item}>{item}</option>)}</select></label><label>Faellig<input name="dueDate" type="date" /></label><label>Empfaenger<select name="assignedTo"><option value={user.userId}>Ich</option>{contacts.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label></div><label>Beschreibung<textarea name="description" rows={3} /></label><button className="save-button" type="submit">Aufgabe erstellen</button></form> : null}
      <div className="club-card-list">{visibleTasks.length ? visibleTasks.map((task) => {
        const assignment = myAssignments.find((item) => item.taskId === task.id);
        return <article className="task-card" key={task.id}><div className="plan-card-head"><div><span>{task.taskType} - faellig {task.dueDate || "offen"}</span><h4>{task.title}</h4></div><b className="status-pill planned">{assignment?.status ?? "open"}</b></div><p>{task.description || "Keine Beschreibung."}</p>{assignment ? <div className="inline-actions"><button type="button" onClick={() => updateAssignment(assignment, "in_progress")}>In Arbeit</button><button className="save-button" type="button" onClick={() => updateAssignment(assignment, "done")}>Erledigt</button><button type="button" onClick={() => updateAssignment(assignment, "skipped")}>Auslassen</button></div> : null}</article>;
      }) : <p className="empty-state">Keine offenen Aufgaben.</p>}</div>
    </section>
  );

  const attendanceView = (
    <section className="section-block">
      <div className="section-heading"><div><p className="eyebrow">Anwesenheit</p><h3>{pendingAttendance} offene Antworten</h3></div></div>
      <div className="club-card-list">{trainings.length ? trainings.map((training) => {
        const current = attendance.find((item) => item.trainingId === training.id && item.athleteId === user.userId);
        const groupAttendance = attendance.filter((item) => item.trainingId === training.id);
        return <article className="attendance-card" key={training.id}><div className="plan-card-head"><div><span>{training.date} {training.time}</span><h4>{training.title || training.trainingType}</h4></div><b className="status-pill planned">{current ? statusLabel[current.status] : "offen"}</b></div><div className="smart-detail-grid"><span>Dabei {groupAttendance.filter((item) => item.status === "attending").length}</span><span>Nicht dabei {groupAttendance.filter((item) => item.status === "not_attending").length}</span><span>Unsicher {groupAttendance.filter((item) => item.status === "unsure").length}</span></div><div className="attendance-actions">{attendanceStatuses.map((status) => <button type="button" key={status} onClick={() => setAttendance(training.id, status, "", "")}>{statusLabel[status]}</button>)}</div></article>;
      }) : <p className="empty-state">Noch kein Training fär Anwesenheit gefunden.</p>}</div>
    </section>
  );

  const filesView = (
    <section className="section-block">
      <div className="section-heading"><div><p className="eyebrow">Dateien</p><h3>Anhaenge vorbereiten</h3></div></div>
      <form className="entry-form" onSubmit={createAttachment}><div className="form-grid"><label>Dateiname<input name="fileName" required /></label><label>Pfad / URL<input name="filePath" required /></label><label>Typ<input name="fileType" placeholder="application/pdf" /></label><label>Groesse Bytes<input name="fileSize" type="number" /></label><label>Verknuepfung<select name="relatedType"><option value="direct_message">Direktnachricht</option><option value="group_message">Gruppennachricht</option><option value="club_post">Vereinsnews</option><option value="task">Aufgabe</option><option value="training">Training</option><option value="competition">Wettkampf</option></select></label><label>Verknuepfte ID<input name="relatedId" /></label></div><button className="save-button" type="submit">Anhang speichern</button></form>
      <p className="muted">Supabase Storage Bucket `paddlio-files` ist vorbereitet. Uploads laufen später ueber separate Storage Policies; diese Version speichert stabile Metadaten ohne App-Absturz.</p>
      <div className="club-card-list">{data.fileAttachments.length ? data.fileAttachments.map((file) => <article className="user-admin-card" key={file.id}><strong>{file.fileName}</strong><span>{file.relatedType} - {file.fileType || "Datei"}</span><small>{file.filePath}</small></article>) : <p className="empty-state">Noch keine Anhaenge vorbereitet.</p>}</div>
    </section>
  );

  const content = {
    messages: messagesView,
    groups: groupsView,
    news: newsView,
    tasks: tasksView,
    attendance: attendanceView,
    files: filesView,
  }[segment];

  return (
    <div className="category-shell communication-shell">
      <SegmentNav label="Kommunikation" items={segments} activeId={segment} onChange={setSegment} />
      <div className="segment-content stack">
        <section className="home-profile-card premium-hero">
          <div className="home-avatar">K</div>
          <div>
            <p className="eyebrow">Paddlio 3.8</p>
            <h2>Kommunikation</h2>
            <p className="hero-slogan">Nachrichten. Aufgaben. Anwesenheit. Vereinsnews.</p>
          </div>
        </section>
        <section className="metric-grid two-columns">
          <article className="metric-card tone-training"><span>Direkt</span><strong>{unreadDirect}</strong><small>ungelesen</small></article>
          <article className="metric-card tone-k1"><span>Gruppen</span><strong>{unreadGroups}</strong><small>Aktivitaet</small></article>
          <article className="metric-card tone-penalty"><span>Aufgaben</span><strong>{openTasks}</strong><small>offen</small></article>
          <article className="metric-card tone-c1"><span>Anwesenheit</span><strong>{pendingAttendance}</strong><small>offene Antworten</small></article>
        </section>
        {content}
        {message ? <p className="auth-message">{message}</p> : null}
      </div>
    </div>
  );
}
