import { useMemo, useState, type FormEvent } from "react";
import {
  canManageAdminArea,
  canUseCoachArea,
  getAthletesForCurrentUser,
  getGroupsForCurrentUser,
  getTrainingsForCurrentUser,
  isSameScopeValue,
} from "../domain/accessControl";
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
import { useAuth } from "../auth/AuthProvider";
import { updateCloudProfileAdminFields } from "../services/profileService";
import { reviewCloudClubRequest, setCloudClubStatus, upsertCloudClub, type CloudClubRequest } from "../services/clubService";
import {
  reviewCloudTrainerRequest,
  setCloudAthleteGroups,
  setCloudTrainingGroupStatus,
  upsertCloudTrainingGroup,
  setCloudGroupMembers,
  type CloudTrainerRequest,
} from "../services/coachService";
import type {
  AgeClass,
  AuthUser,
  BoatClass,
  Club,
  ClubRequest,
  ClubStatus,
  CoachAthlete,
  CoachAthleteInvitationStatus,
  CoachAthleteStatus,
  CoachGroup,
  PaddleMotionData,
  PaddleSide,
  PlanEntry,
  TrainerRequest,
  TrainingArea,
  TrainingGroupFocus,
  TrainingGroupStatus,
  TrainingIntensity,
  TrainingPlanType,
  User,
  UserRole,
} from "../domain/types";
import { canSeeSystemPrivateData, maskEmail } from "../domain/privacy";

type CoachViewProps = {
  data: PaddleMotionData;
  user: User;
  onDataChange: (updater: (current: PaddleMotionData) => PaddleMotionData) => void;
};

const roleLabels: Record<UserRole, string> = {
  athlete: "Athlete",
  coach: "Coach",
  teamAdmin: "TeamAdmin",
  clubAdmin: "ClubAdmin",
  admin: "Admin",
};

const ageClasses: Array<AgeClass | ""> = ["", "U10", "U12", "U14", "U16", "U18", "U23", "Leistungsklasse", "Masters"];
const groupFocuses: TrainingGroupFocus[] = ["Technik", "Kraft", "Ausdauer", "Sprint", "Wettkampf", "Allgemein"];
const trainingAreas: TrainingArea[] = ["Wassertraining", "Ausdauer", "Krafttraining", "Trainerarbeit", "Regeneration", "Wettkampf"];
const trainingTypes: TrainingPlanType[] = ["K1 Technik", "C1 Technik", "Slalomstrecke", "GA1", "Intervalle", "Kraftausdauer", "Pause", "K1 Rennen", "C1 Rennen"];
const intensities: TrainingIntensity[] = ["locker", "mittel", "hart", "maximal"];

const normalizeClubName = (value: string): string => value.trim().toLowerCase();

const isUuid = (value: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

const toCloudRoles = (role: UserRole): Array<"Athlete" | "Coach" | "TeamAdmin" | "ClubAdmin" | "Admin"> => {
  if (role === "admin") return ["Athlete", "Coach", "Admin"];
  if (role === "clubAdmin") return ["Athlete", "Coach", "ClubAdmin"];
  if (role === "teamAdmin") return ["Athlete", "TeamAdmin"];
  if (role === "coach") return ["Athlete", "Coach"];
  return ["Athlete"];
};

const toCloudPaddleSide = (value: PaddleSide): "Links" | "Rechts" => value === "links" ? "Links" : "Rechts";

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

const defaultAthlete = (coachUserId: string, clubId: string, club: string): Omit<CoachAthlete, "id" | "createdAt" | "updatedAt"> => ({
  coachUserId,
  clubId,
  firstName: "",
  lastName: "",
  email: "",
  name: "",
  birthDate: "",
  ageClass: "",
  club,
  boatClasses: ["K1"],
  paddleSide: "rechts",
  groupId: "",
  groupIds: [],
  goals: "",
  trainerNotes: "",
  notes: "",
  status: "aktiv",
  invitationStatus: "aktiv",
});

const getAthleteName = (athlete: CoachAthlete): string =>
  athlete.name || `${athlete.firstName} ${athlete.lastName}`.trim() || athlete.email || "Unbenannter Sportler";

export function CoachView({ data, user, onDataChange }: CoachViewProps) {
  const { refreshCloudData } = useAuth();
  const [editingAthlete, setEditingAthlete] = useState<CoachAthlete | null>(null);
  const [athleteBoatClasses, setAthleteBoatClasses] = useState<BoatClass[]>(["K1"]);
  const [athleteGroupIds, setAthleteGroupIds] = useState<string[]>([]);
  const [editingGroup, setEditingGroup] = useState<CoachGroup | null>(null);
  const [groupBoatClasses, setGroupBoatClasses] = useState<BoatClass[]>(["K1"]);
  const [editingClub, setEditingClub] = useState<Club | null>(null);
  const [editingClubRequestId, setEditingClubRequestId] = useState("");
  const [selectedPreviewAthleteId, setSelectedPreviewAthleteId] = useState("");
  const [selectedProfileAthleteId, setSelectedProfileAthleteId] = useState("");
  const [authUsers, setAuthUsers] = useState<AuthUser[]>(() => loadUsers());
  const [clubs, setClubs] = useState<Club[]>(() => loadClubs());
  const [clubRequests, setClubRequests] = useState<ClubRequest[]>(() => loadClubRequests());
  const [trainerRequests, setTrainerRequests] = useState<TrainerRequest[]>(() => loadTrainerRequests());
  const [userSearch, setUserSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [sortBy, setSortBy] = useState<"name" | "email" | "role" | "club">("name");
  const [athleteSearch, setAthleteSearch] = useState("");
  const [athleteFilter, setAthleteFilter] = useState<"all" | BoatClass | AgeClass | CoachAthleteStatus>("all");
  const [message, setMessage] = useState("");
  const [isSavingCloud, setIsSavingCloud] = useState(false);

  const isAdmin = canManageAdminArea(user.role);
  const canRevealEmails = canSeeSystemPrivateData(user.role);
  const userClub = user.profile.club.trim().toLowerCase();
  const myClub = clubs.find((club) => normalizeClubName(club.name) === userClub);
  const userClubId = myClub?.clubId ?? "";
  const ownGroups = useMemo(() => getGroupsForCurrentUser(data, user, [userClubId]), [data, user, userClubId]);
  const clubAthletes = authUsers.filter((authUser) => authUser.role === "athlete" && Boolean(userClub) && normalizeClubName(authUser.club) === userClub);
  const ownAthletes = useMemo(() => getAthletesForCurrentUser(data, user, [userClubId]), [data, user, userClubId]);
  const getAthleteGroups = (athlete: CoachAthlete): CoachGroup[] => {
    const ids = athlete.groupIds.length > 0 ? athlete.groupIds : athlete.groupId ? [athlete.groupId] : [];
    return ownGroups.filter((group) => ids.includes(group.id) || ids.includes(group.groupId));
  };
  const filteredAthletes = useMemo(() => {
    const query = athleteSearch.trim().toLowerCase();
    return ownAthletes.filter((athlete) => {
      const groups = getAthleteGroups(athlete);
      const searchable = [
        athlete.firstName,
        athlete.lastName,
        athlete.name,
        athlete.email,
        athlete.ageClass,
        athlete.boatClasses.join(" "),
        athlete.status,
        groups.map((group) => group.name).join(" "),
      ].join(" ").toLowerCase();
      const matchesQuery = !query || searchable.includes(query);
      const matchesFilter =
        athleteFilter === "all" ||
        athlete.boatClasses.includes(athleteFilter as BoatClass) ||
        athlete.ageClass === athleteFilter ||
        athlete.status === athleteFilter;
      return matchesQuery && matchesFilter;
    });
  }, [athleteFilter, athleteSearch, ownAthletes, ownGroups]);
  const coachPlan = useMemo(() => getTrainingsForCurrentUser(data, user, [userClubId]), [data, user, userClubId]);
  const visibleAuthUsers = useMemo(() => {
    const scoped = isAdmin
      ? authUsers
      : authUsers.filter((authUser) =>
          authUser.role === "athlete" &&
          Boolean(userClub) &&
          isSameScopeValue(authUser.club, userClub),
        );
    const query = userSearch.trim().toLowerCase();

    return scoped
      .filter((authUser) => roleFilter === "all" || authUser.role === roleFilter)
      .filter((authUser) => {
        if (!query) {
          return true;
        }
        return [authUser.displayName, canRevealEmails ? authUser.email : "", authUser.club, authUser.trainingGroupId]
          .join(" ")
          .toLowerCase()
          .includes(query);
      })
      .sort((a, b) => {
        const valueA = sortBy === "name" ? a.displayName : sortBy === "email" ? a.email : sortBy === "role" ? a.role : a.club;
        const valueB = sortBy === "name" ? b.displayName : sortBy === "email" ? b.email : sortBy === "role" ? b.role : b.club;
        return valueA.localeCompare(valueB);
      });
  }, [authUsers, canRevealEmails, isAdmin, roleFilter, sortBy, userClub, userSearch]);
  const previewAthlete = ownAthletes.find((athlete) => athlete.id === selectedPreviewAthleteId) ?? ownAthletes[0];
  const profileAthlete = ownAthletes.find((athlete) => athlete.id === selectedProfileAthleteId) ?? null;
  const previewPlan = previewAthlete
    ? coachPlan.filter((entry) => {
        const groupIds = previewAthlete.groupIds.length > 0 ? previewAthlete.groupIds : previewAthlete.groupId ? [previewAthlete.groupId] : [];
        return entry.assignedAthleteId === previewAthlete.id || (entry.assignedGroupId && groupIds.includes(entry.assignedGroupId));
      })
    : [];
  const todaysPreviewTraining = previewPlan.find((entry) => entry.date === todayKey());
  const openFeedback = coachPlan.filter((entry) => (entry.status === "done" || entry.status === "erledigt") && !entry.feedbackNote).length;
  const weeklyTrainingCount = coachPlan.filter((entry) => isThisWeek(entry.date)).length;

  const metrics = useMemo(() => [
    { label: isAdmin ? "Sportler" : "Sportler im Verein", value: isAdmin ? ownAthletes.length : clubAthletes.length },
    { label: isAdmin ? "Gruppen" : "Gruppen im Verein", value: ownGroups.length },
    { label: "Trainings diese Woche", value: weeklyTrainingCount },
    { label: "Offene Rückmeldungen", value: openFeedback },
  ], [clubAthletes.length, isAdmin, openFeedback, ownAthletes.length, ownGroups.length, weeklyTrainingCount]);

  const runCloudAction = async (successMessage: string, action: () => Promise<void>) => {
    try {
      setIsSavingCloud(true);
      await action();
      await refreshCloudData();
      setMessage(successMessage);
    } catch (error) {
      console.error("[Paddlio Cloud] Coach/Admin-Aktion fehlgeschlagen", error);
      setMessage("Aktion konnte nicht gespeichert werden. Bitte pr?fe deine Berechtigung oder versuche es erneut.");
    } finally {
      setIsSavingCloud(false);
    }
  };

  if (!canUseCoachArea(user.role)) {
    return (
      <section className="section-block">
        <p className="eyebrow">Coach</p>
        <h3>Kein Zugriff</h3>
        <p className="card-note">Dieser Bereich ist für Coach, TeamAdmin und Admin Rollen vorbereitet.</p>
      </section>
    );
  }

  const upsertAthlete = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const hasC1 = athleteBoatClasses.includes("C1");
    const firstName = String(formData.get("firstName") ?? "").trim();
    const lastName = String(formData.get("lastName") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const name = `${firstName} ${lastName}`.trim();

    if (!firstName || !lastName || athleteBoatClasses.length === 0 || (hasC1 && !formData.get("paddleSide"))) {
      setMessage("Sportler braucht Vorname, Nachname, mindestens eine Bootsklasse und bei C1 eine Paddelseite.");
      return;
    }

    const timestamp = new Date().toISOString();
    const selectedGroups = formData.getAll("groupIds").map(String);
    const athlete: CoachAthlete = {
      ...(editingAthlete ?? {
        ...defaultAthlete(user.userId, userClubId, user.profile.club),
        id: createId("coach-athlete"),
        createdAt: timestamp,
      }),
      coachUserId: user.userId,
      clubId: editingAthlete?.clubId || userClubId,
      firstName,
      lastName,
      email,
      name,
      birthDate: String(formData.get("birthDate") ?? ""),
      ageClass: String(formData.get("ageClass") ?? "") as AgeClass | "",
      club: String(formData.get("club") ?? user.profile.club).trim(),
      boatClasses: athleteBoatClasses,
      paddleSide: hasC1 ? String(formData.get("paddleSide")) as PaddleSide : "rechts",
      groupId: selectedGroups[0] ?? "",
      groupIds: selectedGroups,
      goals: String(formData.get("goals") ?? "").trim(),
      trainerNotes: String(formData.get("trainerNotes") ?? "").trim(),
      notes: String(formData.get("notes") ?? "").trim(),
      status: String(formData.get("status") ?? "aktiv") as CoachAthleteStatus,
      invitationStatus: String(formData.get("invitationStatus") ?? "aktiv") as CoachAthleteInvitationStatus,
      updatedAt: timestamp,
    };

    void runCloudAction("Sportler gespeichert", async () => {
      if (isUuid(athlete.id)) {
        await updateCloudProfileAdminFields(athlete.id, {
          club_id: athlete.clubId || null,
          age_category: athlete.ageClass || null,
          boat_classes: athlete.boatClasses,
          paddle_side: athlete.boatClasses.includes("C1") ? toCloudPaddleSide(athlete.paddleSide) : null,
        });
        await setCloudAthleteGroups(athlete.id, selectedGroups);
      }
      onDataChange((current) => ({
        ...current,
        coachAthletes: current.coachAthletes.some((item) => item.id === athlete.id)
          ? current.coachAthletes.map((item) => (item.id === athlete.id ? athlete : item))
          : [athlete, ...current.coachAthletes],
      }));
      setEditingAthlete(null);
      setAthleteBoatClasses(["K1"]);
      setAthleteGroupIds([]);
    });
  };

  const deleteAthlete = (id: string) => {
    void runCloudAction("Sportler pausiert", async () => {
      if (isUuid(id)) await updateCloudProfileAdminFields(id, { status: "disabled" });
      onDataChange((current) => ({
        ...current,
        coachAthletes: current.coachAthletes.map((athlete) => athlete.id === id ? { ...athlete, status: "pausiert", updatedAt: new Date().toISOString() } : athlete),
        coachGroups: current.coachGroups.map((group) => ({
          ...group,
          athleteIds: group.athleteIds.filter((athleteId) => athleteId !== id),
        })),
      }));
    });
  };

  const upsertGroup = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const timestamp = new Date().toISOString();
    const selectedAthletes = formData.getAll("athleteIds").map(String);
    const groupId = editingGroup?.id ?? createId("coach-group");
    const group: CoachGroup = {
      ...(editingGroup ?? {
        id: groupId,
        groupId,
        coachUserId: user.userId,
        coachId: user.userId,
        clubId: userClubId,
        createdAt: timestamp,
      }),
      groupId: editingGroup?.groupId ?? groupId,
      clubId: editingGroup?.clubId || userClubId,
      coachUserId: user.userId,
      coachId: user.userId,
      name: String(formData.get("name") ?? "").trim(),
      description: String(formData.get("description") ?? "").trim(),
      ageCategory: String(formData.get("ageCategory") ?? "") as AgeClass | "",
      ageRange: String(formData.get("ageCategory") ?? "").trim(),
      boatClasses: groupBoatClasses,
      trainingFocus: String(formData.get("trainingFocus") ?? "Allgemein") as TrainingGroupFocus,
      color: String(formData.get("color") ?? "#00B4D8"),
      status: String(formData.get("status") ?? "active") as TrainingGroupStatus,
      athleteIds: selectedAthletes,
      updatedAt: timestamp,
    };

    void runCloudAction("Trainingsgruppe gespeichert", async () => {
      const cloudGroup = await upsertCloudTrainingGroup({
        ...(editingGroup?.id && isUuid(editingGroup.id) ? { id: editingGroup.id } : {}),
        club_id: group.clubId,
        coach_id: user.userId,
        name: group.name,
        description: group.description,
        age_category: group.ageCategory || null,
        boat_classes: group.boatClasses,
        training_focus: group.trainingFocus,
        color: group.color,
        status: group.status,
      });
      const persistedGroup = cloudGroup ? {
        ...group,
        id: cloudGroup.id,
        groupId: cloudGroup.id,
        createdAt: cloudGroup.created_at,
        updatedAt: cloudGroup.updated_at,
      } : group;
      await setCloudGroupMembers(persistedGroup.id, selectedAthletes);
      onDataChange((current) => ({
        ...current,
        coachGroups: current.coachGroups.some((item) => item.id === persistedGroup.id || item.id === group.id)
          ? current.coachGroups.map((item) => (item.id === persistedGroup.id || item.id === group.id ? persistedGroup : item))
          : [persistedGroup, ...current.coachGroups],
        coachAthletes: current.coachAthletes.map((athlete) => ({
          ...athlete,
          groupIds: selectedAthletes.includes(athlete.id)
            ? Array.from(new Set([...(athlete.groupIds ?? []).filter((id) => id !== group.id), persistedGroup.id]))
            : (athlete.groupIds ?? []).filter((groupId) => groupId !== persistedGroup.id && groupId !== group.id),
          groupId: selectedAthletes.includes(athlete.id)
            ? persistedGroup.id
            : athlete.groupId === persistedGroup.id || athlete.groupId === group.id
              ? (athlete.groupIds ?? []).filter((groupId) => groupId !== persistedGroup.id && groupId !== group.id)[0] ?? ""
              : athlete.groupId,
        })),
      }));
      setEditingGroup(null);
      setGroupBoatClasses(["K1"]);
    });
  };

  const deleteGroup = (id: string) => {
    void runCloudAction("Trainingsgruppe deaktiviert", async () => {
      await setCloudTrainingGroupStatus(id, "inactive");
      onDataChange((current) => ({
        ...current,
        coachGroups: current.coachGroups.map((group) => group.id === id ? { ...group, status: "inactive", updatedAt: new Date().toISOString() } : group),
        coachAthletes: current.coachAthletes.map((athlete) => ({
          ...athlete,
          groupIds: athlete.groupIds.filter((groupId) => groupId !== id),
          groupId: athlete.groupId === id ? athlete.groupIds.filter((groupId) => groupId !== id)[0] ?? "" : athlete.groupId,
        })),
      }));
    });
  };

  const assignTraining = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const target = String(formData.get("target") ?? "self");
    const date = String(formData.get("date") ?? todayKey());
    const timestamp = new Date().toISOString();
    const assignedType = target.startsWith("athlete:") ? "athlete" : target.startsWith("group:") ? "group" : "self";
    const assignedAthleteId = target.startsWith("athlete:") ? target.replace("athlete:", "") : target === "self" ? data.athlete.id : "";
    const assignedGroupId = target.startsWith("group:") ? target.replace("group:", "") : "";
    const entry: PlanEntry = {
      id: createId("coach-plan"),
      ownerUserId: user.userId,
      athleteId: data.athlete.id,
      clubId: userClubId,
      assignedType,
      assignedAthleteIds: assignedAthleteId ? [assignedAthleteId] : [],
      assignedGroupIds: assignedGroupId ? [assignedGroupId] : [],
      title: String(formData.get("trainingType") ?? "K1 Technik"),
      date,
      weekday: getWeekdayFromDate(date),
      time: String(formData.get("time") ?? ""),
      startTime: String(formData.get("time") ?? ""),
      endTime: "",
      durationMinutes: Number(formData.get("durationMinutes") ?? 0),
      area: String(formData.get("area") ?? "Wassertraining") as TrainingArea,
      trainingType: String(formData.get("trainingType") ?? "K1 Technik") as TrainingPlanType,
      boatClass: String(formData.get("trainingType") ?? "").includes("C1") ? "C1" : String(formData.get("trainingType") ?? "").includes("K1") ? "K1" : "none",
      goal: String(formData.get("goal") ?? "").trim(),
      focus: String(formData.get("goal") ?? "").trim(),
      description: "",
      intensity: String(formData.get("intensity") ?? "locker") as TrainingIntensity,
      note: String(formData.get("note") ?? "").trim(),
      notes: String(formData.get("note") ?? "").trim(),
      status: "planned",
      repeat: "none",
      repeatUntil: "",
      createdByUserId: user.userId,
      assignedAthleteId,
      assignedGroupId,
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
    void runCloudAction("Rolle gespeichert", async () => {
      await updateCloudProfileAdminFields(targetUserId, { roles: toCloudRoles(role) });
      setAuthUsers(updateAuthUserRole(targetUserId, role));
    });
  };

  const changeStatus = (targetUserId: string, status: "active" | "inactive") => {
    void runCloudAction("Status gespeichert", async () => {
      await updateCloudProfileAdminFields(targetUserId, { status: status === "active" ? "active" : "disabled" });
      setAuthUsers(updateAuthUserStatus(targetUserId, status));
    });
  };

  const changeTrainingGroup = (targetUserId: string, trainingGroupId: string) => {
    void runCloudAction("Gruppenzuweisung gespeichert", async () => {
      await setCloudAthleteGroups(targetUserId, trainingGroupId ? [trainingGroupId] : []);
      setAuthUsers(updateAuthUserProfileFields(targetUserId, { trainingGroupId, coachId: user.userId }));
    });
  };

  const removeUser = (targetUserId: string) => {
    if (targetUserId === user.userId) {
      setMessage("Du kannst dein eigenes Konto hier nicht löschen.");
      return;
    }

    setAuthUsers(deleteAuthUser(targetUserId));
  };

  const reviewRequest = (requestId: string, status: "approved" | "rejected") => {
    void runCloudAction(status === "approved" ? "Traineranfrage genehmigt" : "Traineranfrage abgelehnt", async () => {
      const request = trainerRequests.find((item) => item.requestId === requestId);
      if (!request) throw new Error("Traineranfrage nicht gefunden.");
      const cloudRequest: CloudTrainerRequest = {
        id: request.requestId,
        user_id: request.userId || null,
        club_id: null,
        club_name: request.club,
        message: request.message,
        has_license: request.hasLicense,
        license_number: request.licenseNumber || null,
        qualification: request.qualification || null,
        phone: request.phone || null,
        status: request.status,
        reviewed_by: request.reviewedBy || null,
        reviewed_at: request.reviewedAt || null,
        created_at: request.createdAt,
      };
      if (status === "approved") {
        if (!request.userId) throw new Error("Profil zur Traineranfrage nicht gefunden.");
        await updateCloudProfileAdminFields(request.userId, { roles: ["Athlete", "Coach"] });
        await reviewCloudTrainerRequest(request.requestId, "approved", user.userId);
      } else {
        await reviewCloudTrainerRequest(request.requestId, "rejected", user.userId);
      }
      const result = reviewTrainerRequest(requestId, status, user.userId);
      setTrainerRequests(result.requests);
      setAuthUsers(result.users);
    });
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

    const form = event.currentTarget;
    void runCloudAction(editingClubRequestId ? "Vereinsvorschlag angenommen" : "Verein gespeichert", async () => {
      if (editingClubRequestId) {
        const request = clubRequests.find((item) => item.requestId === editingClubRequestId);
        if (!request) throw new Error("Vereinsvorschlag nicht gefunden.");
        const cloudRequest: CloudClubRequest = {
          id: request.requestId,
          requested_by: request.requestedByUserId || null,
          name: request.name,
          short_name: request.shortName || null,
          city: request.city || null,
          message: null,
          status: request.status,
          reviewed_by: request.reviewedBy || null,
          reviewed_at: request.reviewedAt || null,
          created_at: request.createdAt,
        };
        await reviewCloudClubRequest(cloudRequest, "approved", user.userId, {
          name: clubInput.name,
          short_name: clubInput.shortName,
          city: clubInput.city,
          contact_name: clubInput.contactName,
          contact_email: clubInput.contactEmail,
          website: clubInput.website,
          logo_url: clubInput.logoUrl,
          primary_color: clubInput.primaryColor,
          secondary_color: clubInput.secondaryColor,
          status: clubInput.status,
        });
        const result = reviewClubRequest(editingClubRequestId, "approved", user.userId, clubInput);
        setClubs(result.clubs);
        setClubRequests(result.requests);
        setAuthUsers(loadUsers());
        setEditingClubRequestId("");
      } else {
        const cloudClub = await upsertCloudClub({
          ...(editingClub?.clubId && isUuid(editingClub.clubId) ? { id: editingClub.clubId } : {}),
          name: clubInput.name,
          short_name: clubInput.shortName,
          city: clubInput.city,
          contact_name: clubInput.contactName,
          contact_email: clubInput.contactEmail,
          website: clubInput.website,
          logo_url: clubInput.logoUrl,
          primary_color: clubInput.primaryColor,
          secondary_color: clubInput.secondaryColor,
          status: clubInput.status,
        });
        setClubs(upsertClub({ ...clubInput, clubId: cloudClub?.id ?? clubInput.clubId }));
      }
      setEditingClub(null);
      form.reset();
    });
  };

  const removeClub = (clubId: string) => {
    void runCloudAction("Verein deaktiviert", async () => {
      await setCloudClubStatus(clubId, "inactive");
      setClubs(deleteClub(clubId));
    });
  };

  const reviewClub = (requestId: string, status: "approved" | "rejected") => {
    void runCloudAction(status === "approved" ? "Vereinsvorschlag angenommen" : "Vereinsvorschlag abgelehnt", async () => {
      const request = clubRequests.find((item) => item.requestId === requestId);
      if (!request) throw new Error("Vereinsvorschlag nicht gefunden.");
      const cloudRequest: CloudClubRequest = {
        id: request.requestId,
        requested_by: request.requestedByUserId || null,
        name: request.name,
        short_name: request.shortName || null,
        city: request.city || null,
        message: null,
        status: request.status,
        reviewed_by: request.reviewedBy || null,
        reviewed_at: request.reviewedAt || null,
        created_at: request.createdAt,
      };
      await reviewCloudClubRequest(cloudRequest, status, user.userId);
      const result = reviewClubRequest(requestId, status, user.userId);
      setClubRequests(result.requests);
      setClubs(result.clubs);
      setAuthUsers(loadUsers());
    });
  };

  const athleteFormValue = editingAthlete ?? defaultAthlete(user.userId, userClubId, user.profile.club);
  const groupFormValue: Pick<CoachGroup, "name" | "description" | "ageCategory" | "trainingFocus" | "color" | "status" | "athleteIds"> =
    editingGroup ?? { name: "", description: "", ageCategory: "", trainingFocus: "Allgemein", color: "#00B4D8", status: "active", athleteIds: [] };
  const toggleAthleteBoatClass = (boatClass: BoatClass) => {
    setAthleteBoatClasses((current) => {
      if (current.includes(boatClass)) {
        return current.length === 1 ? current : current.filter((item) => item !== boatClass);
      }

      return [...current, boatClass];
    });
  };
  const toggleGroupBoatClass = (boatClass: BoatClass) => {
    setGroupBoatClasses((current) => {
      if (current.includes(boatClass)) {
        return current.length === 1 ? current : current.filter((item) => item !== boatClass);
      }

      return [...current, boatClass];
    });
  };

  const startEditingAthlete = (athlete: CoachAthlete) => {
    setEditingAthlete(athlete);
    setAthleteBoatClasses(athlete.boatClasses.length > 0 ? athlete.boatClasses : ["K1"]);
    setAthleteGroupIds(athlete.groupIds.length > 0 ? athlete.groupIds : athlete.groupId ? [athlete.groupId] : []);
  };

  const startEditingGroup = (group: CoachGroup) => {
    setEditingGroup(group);
    setGroupBoatClasses(group.boatClasses.length > 0 ? group.boatClasses : ["K1"]);
  };

  return (
    <div className="stack coach-shell">
      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Vereins- und Teamverwaltung 3.1</p>
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

      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Meine Trainingsgruppen</p>
            <h3>{ownGroups.length} Gruppen im Fokus</h3>
          </div>
        </div>
        <div className="metric-grid">
          <article className="metric-card">
            <strong>{ownAthletes.length}</strong>
            <span>Sportler</span>
          </article>
          <article className="metric-card">
            <strong>{ownGroups.length}</strong>
            <span>Trainingsgruppen</span>
          </article>
          <article className="metric-card">
            <strong>{openFeedback}</strong>
            <span>Offene Rückmeldungen</span>
          </article>
          <article className="metric-card">
            <strong>{weeklyTrainingCount}</strong>
            <span>Trainings diese Woche</span>
          </article>
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
              <span>Offene Rückmeldungen</span>
            </article>
          </div>
          <p className="card-note">Coach-Zugriff ist auf diesen Verein begrenzt.</p>
        </section>
      ) : null}

      {canManageAdminArea(user.role) ? (
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
                    <button type="button" onClick={() => removeClub(club.clubId)}>Löschen</button>
                  </div>
                </article>
              );
            }) : <p className="empty-state">Noch keine offiziellen Vereine vorhanden.</p>}
          </div>
        </section>
      ) : null}

      {canManageAdminArea(user.role) ? (
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

      {canManageAdminArea(user.role) ? (
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
            <label>Suche<input value={userSearch} onChange={(event) => setUserSearch(event.target.value)} placeholder={isAdmin ? "Name, E-Mail, Verein" : "Name, Verein"} /></label>
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
                {isAdmin ? <span>{authUser.email}</span> : <span>{maskEmail(authUser.email)}</span>}
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
                  <button type="button" onClick={() => removeUser(authUser.userId)}>Benutzer löschen</button>
                </div>
              ) : null}
            </article>
          )) : <p className="empty-state">Keine Benutzer für deinen Zugriff gefunden.</p>}
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Sportler</p>
            <h3>Sportlerverwaltung</h3>
          </div>
        </div>
        <div className="entry-form compact-form">
          <div className="form-grid">
            <label>Suche<input value={athleteSearch} onChange={(event) => setAthleteSearch(event.target.value)} placeholder={isAdmin ? "Name, E-Mail, Gruppe, Bootsklasse" : "Name, Gruppe, Bootsklasse"} /></label>
            <label>
              Filter
              <select value={athleteFilter} onChange={(event) => setAthleteFilter(event.target.value as typeof athleteFilter)}>
                <option value="all">Alle</option>
                <option value="K1">K1</option>
                <option value="C1">C1</option>
                <option value="Leistungsklasse">Leistungsklasse</option>
                <option value="U18">U18</option>
                <option value="aktiv">Aktiv</option>
                <option value="pausiert">Pausiert</option>
              </select>
            </label>
          </div>
        </div>
        <form className="entry-form" onSubmit={upsertAthlete}>
          <div className="form-grid">
            <label>Vorname<input name="firstName" defaultValue={athleteFormValue.firstName} required /></label>
            <label>Nachname<input name="lastName" defaultValue={athleteFormValue.lastName} required /></label>
            <label>E-Mail<input name="email" type="email" defaultValue={athleteFormValue.email} /></label>
            <label>Geburtsdatum<input name="birthDate" type="date" defaultValue={athleteFormValue.birthDate} /></label>
            <label>
              Altersklasse
              <select name="ageClass" defaultValue={athleteFormValue.ageClass}>
                {ageClasses.map((ageClass) => <option key={ageClass || "empty"} value={ageClass}>{ageClass || "Bitte wählen"}</option>)}
              </select>
            </label>
            <label>Verein<input name="club" defaultValue={athleteFormValue.club || user.profile.club} readOnly={!isAdmin} /></label>
            <label>
              Status
              <select name="status" defaultValue={athleteFormValue.status}>
                <option value="aktiv">aktiv</option>
                <option value="pausiert">pausiert</option>
              </select>
            </label>
            <label>
              Einladung
              <select name="invitationStatus" defaultValue={athleteFormValue.invitationStatus}>
                <option value="aktiv">aktiv</option>
                <option value="einladung_offen">Einladung offen</option>
              </select>
            </label>
          </div>
          <div className="choice-group">
            <span>Trainingsgruppen</span>
            <div className="tag-row">
              {ownGroups.length > 0 ? ownGroups.map((group) => (
                <label className="toggle-row" key={group.id}>
                  <span>{group.name}</span>
                  <input
                    name="groupIds"
                    type="checkbox"
                    value={group.id}
                    defaultChecked={athleteGroupIds.includes(group.id) || athleteFormValue.groupIds.includes(group.id)}
                  />
                </label>
              )) : <small>Erstelle zuerst eine Trainingsgruppe.</small>}
            </div>
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
          <label>Saisonziele<textarea name="goals" defaultValue={athleteFormValue.goals} rows={3} /></label>
          <label>Trainernotizen<textarea name="trainerNotes" defaultValue={athleteFormValue.trainerNotes} rows={3} /></label>
          <label>Interne Notiz<textarea name="notes" defaultValue={athleteFormValue.notes} rows={3} /></label>
          <button className="save-button" type="submit">{editingAthlete ? "Sportler speichern" : "Sportler einladen"}</button>
        </form>
        <div className="athlete-table">
          <div className="athlete-table-header">
            <span>Sportler</span>
            <span>Altersklasse</span>
            <span>Boot</span>
            <span>Gruppe</span>
            <span>Status</span>
          </div>
          {filteredAthletes.length > 0 ? filteredAthletes.map((athlete) => {
            const groups = getAthleteGroups(athlete);
            return (
            <article className="athlete-row" key={athlete.id}>
              <div className="user-admin-card-header">
                <span className="profile-avatar small">{`${athlete.firstName.slice(0, 1)}${athlete.lastName.slice(0, 1)}` || "P"}</span>
                <div>
                  <strong>{getAthleteName(athlete)}</strong>
                  <small>{isAdmin ? athlete.email || "Keine E-Mail" : maskEmail(athlete.email)}</small>
                </div>
              </div>
              <span>{athlete.ageClass || "ohne AK"}</span>
              <span>{athlete.boatClasses.join(" + ")}</span>
              <span>{groups.length > 0 ? groups.map((group) => group.name).join(" + ") : "Keine Gruppe"}</span>
              <span>{athlete.invitationStatus === "einladung_offen" ? "Einladung offen" : athlete.status}</span>
              <div className="card-actions">
                <button type="button" onClick={() => setSelectedProfileAthleteId(athlete.id)}>Profil</button>
                <button type="button" onClick={() => startEditingAthlete(athlete)}>Bearbeiten</button>
                <button type="button" onClick={() => startEditingAthlete(athlete)}>Gruppe ändern</button>
              </div>
            </article>
            );
          }) : <p className="empty-state">Keine Sportler für diese Suche gefunden.</p>}
        </div>
        {profileAthlete ? (
          <article className="athlete-profile-card">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Sportlerprofil</p>
                <h3>{getAthleteName(profileAthlete)}</h3>
              </div>
              <button type="button" onClick={() => setSelectedProfileAthleteId("")}>Schliessen</button>
            </div>
            <div className="smart-detail-grid">
              <span>{profileAthlete.club || "Kein Verein"}</span>
              <span>{profileAthlete.ageClass || "Keine Altersklasse"}</span>
              <span>{profileAthlete.boatClasses.join(" + ")}</span>
              <span>{getAthleteGroups(profileAthlete).map((group) => group.name).join(" + ") || "Keine Gruppe"}</span>
              <span>{profileAthlete.status}</span>
            </div>
            <div className="profile-insight-grid">
              <div><strong>Ziele</strong><span>{profileAthlete.goals || "Noch keine Ziele hinterlegt."}</span></div>
              <div><strong>Trainings</strong><span>{coachPlan.filter((entry) => entry.assignedAthleteId === profileAthlete.id).length} geplante Einheiten</span></div>
              <div><strong>Wettkämpfe</strong><span>Wettkampfdaten werden mit dem Athletenprofil verknüpft vorbereitet.</span></div>
              <div><strong>Material</strong><span>MaterialÜbersicht wird für Coach-Freigaben vorbereitet.</span></div>
              <div><strong>Journal</strong><span>Rückmeldungen und Befinden werden hier zusammengeführt.</span></div>
              <div><strong>Trainernotizen</strong><span>{profileAthlete.trainerNotes || "Keine Trainernotizen."}</span></div>
            </div>
            <div className="card-actions">
              <button type="button" onClick={() => startEditingAthlete(profileAthlete)}>Gruppen, Ziele und Status bearbeiten</button>
              <button type="button" onClick={() => deleteAthlete(profileAthlete.id)}>Sportler entfernen</button>
            </div>
          </article>
        ) : null}
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Trainingsgruppen</p>
            <h3>Gruppenverwaltung</h3>
          </div>
          <button type="button" onClick={() => {
            setEditingGroup(null);
            setGroupBoatClasses(["K1"]);
          }}>Neue Gruppe erstellen</button>
        </div>
        <form className="entry-form" onSubmit={upsertGroup}>
          <div className="form-grid">
            <label>Gruppenname<input name="name" defaultValue={groupFormValue.name} required /></label>
            <label>
              Altersklasse
              <select name="ageCategory" defaultValue={groupFormValue.ageCategory}>
                {ageClasses.map((ageClass) => <option key={ageClass || "empty"} value={ageClass}>{ageClass || "Alle"}</option>)}
              </select>
            </label>
            <label>
              Trainingsfokus
              <select name="trainingFocus" defaultValue={groupFormValue.trainingFocus}>
                {groupFocuses.map((focus) => <option key={focus} value={focus}>{focus}</option>)}
              </select>
            </label>
            <label>Farbe<input name="color" type="color" defaultValue={groupFormValue.color} /></label>
            <label>
              Status
              <select name="status" defaultValue={groupFormValue.status}>
                <option value="active">aktiv</option>
                <option value="inactive">inaktiv</option>
              </select>
            </label>
          </div>
          <div className="choice-group">
            <span>Bootsklassen</span>
            <div className="boat-class-grid">
              {(["K1", "C1"] as BoatClass[]).map((boatClass) => (
                <label className={groupBoatClasses.includes(boatClass) ? "boat-class-option active" : "boat-class-option"} key={boatClass}>
                  <input
                    checked={groupBoatClasses.includes(boatClass)}
                    onChange={() => toggleGroupBoatClass(boatClass)}
                    type="checkbox"
                    value={boatClass}
                  />
                  {boatClass}
                </label>
              ))}
            </div>
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
        <div className="group-card-grid">
          {ownGroups.length > 0 ? ownGroups.map((group) => (
            <article className="training-group-card" key={group.id} style={{ borderColor: group.color }}>
              <div className="group-card-top">
                <span className="group-color-dot" style={{ background: group.color }} />
                <div>
                  <strong>{group.name}</strong>
                  <small>{group.ageCategory || "Alle Altersklassen"} - {group.trainingFocus}</small>
                </div>
              </div>
              <p>{group.description || "Keine Beschreibung hinterlegt."}</p>
              <div className="smart-detail-grid">
                <span>{group.boatClasses.join(" + ")}</span>
                <span>{group.athleteIds.length} Sportler</span>
                <span>{group.status === "active" ? "aktiv" : "inaktiv"}</span>
              </div>
              <div className="card-actions">
                <button type="button" onClick={() => startEditingGroup(group)}>Bearbeiten</button>
                <button type="button" onClick={() => deleteGroup(group.id)}>Löschen</button>
              </div>
            </article>
          )) : <p className="empty-state">Noch keine Trainingsgruppen vorhanden.</p>}
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
            <label>Intensität<select name="intensity" defaultValue="mittel">{intensities.map((intensity) => <option key={intensity} value={intensity}>{intensity}</option>)}</select></label>
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
                <span>{todaysPreviewTraining?.goal || "Noch keine Einheit für heute geplant."}</span>
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
            <label className="profile-form">Rückmeldung<textarea rows={3} placeholder="Später sendet der Sportler hier Feedback." /></label>
          </div>
        ) : <p className="empty-state">Lege zuerst einen Sportler an.</p>}
      </section>

      {isSavingCloud ? <p className="auth-message">Speichere in Supabase...</p> : null}
      {message ? <p className="auth-message">{message}</p> : null}
    </div>
  );
}
