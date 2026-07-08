export type BoatClass = "K1" | "C1" | "C2" | "Mannschaft";

export type AgeClass = "U10" | "U12" | "U14" | "U16" | "U18" | "U23" | "Leistungsklasse" | "Masters";

export type TrainingType =
  | "K1"
  | "C1"
  | "Ausdauer"
  | "Kraft"
  | "Technik"
  | "Kindertraining"
  | "Pause";

export type MaterialCategory = "Boot" | "Paddel" | "Zubehoer";

export type MaterialStatus = "bereit" | "pruefen" | "wartung" | "defekt";

export type Gender = "weiblich" | "maennlich" | "divers" | "keine_angabe";

export type PaddleSide = "links" | "rechts";

export type MeasurementUnit = "metrisch" | "imperial";

export type AppLanguage = "de" | "en";

export type UserRole = "athlete" | "coach" | "teamAdmin" | "clubAdmin" | "admin";

export type UserStatus = "active" | "inactive";

export type ClubStatus = "active" | "inactive";

export type Club = {
  clubId: string;
  name: string;
  shortName: string;
  city: string;
  contactName?: string;
  contactEmail?: string;
  website?: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  status: ClubStatus;
  createdAt: string;
  updatedAt: string;
};

export type ClubRequestStatus = "open" | "approved" | "rejected";

export type ClubRequest = {
  requestId: string;
  requestedByUserId: string;
  name: string;
  shortName: string;
  city: string;
  contactName: string;
  contactEmail: string;
  website: string;
  status: ClubRequestStatus;
  createdAt: string;
  reviewedAt: string;
  reviewedBy: string;
};

export type AuthUser = {
  userId: string;
  email: string;
  displayName: string;
  passwordHash: string;
  role: UserRole;
  roles: UserRole[];
  firstName: string;
  lastName: string;
  clubId: string;
  club: string;
  trainingGroupId: string;
  coachId: string;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
};

export type AuthSession = {
  userId: string;
  token: string;
  createdAt: string;
};

export type TrainerRequestStatus = "open" | "approved" | "rejected";

export type TrainerRequest = {
  requestId: string;
  userId: string;
  club: string;
  message: string;
  hasLicense: boolean;
  licenseNumber: string;
  qualification: string;
  phone: string;
  remark: string;
  status: TrainerRequestStatus;
  createdAt: string;
  reviewedAt: string;
  reviewedBy: string;
};

export type UserProfile = {
  firstName: string;
  lastName: string;
  nickname: string;
  birthDate: string;
  gender: Gender;
  heightCm: number;
  weightKg: number;
  club: string;
  federation: string;
  coach: string;
  licenseNumber: string;
  boatClasses: BoatClass[];
  ageClass: AgeClass | "";
  paddleSide: PaddleSide;
  trainingYears: number;
  competitionExperience: string;
  longTermGoal: string;
  seasonGoal: string;
  personalNotes: string;
  profileImageDataUrl: string;
  darkMode: boolean;
  measurementUnit: MeasurementUnit;
  language: AppLanguage;
};

export type User = {
  id: string;
  userId: string;
  role: UserRole;
  profile: UserProfile;
  createdAt: string;
  updatedAt: string;
};

export type PlanStatus = "planned" | "done" | "skipped" | "cancelled" | "geplant" | "erledigt" | "ausgelassen";

export type TrainingAssignedType = "self" | "athlete" | "group";

export type TrainingRepeat = "none" | "daily" | "weekly" | "biweekly" | "monthly";

export type TrainingBoatClass = "K1" | "C1" | "K1+C1" | "none";

export type TrainingIntensity = "locker" | "mittel" | "hart" | "maximal";

export type TrainingTemplateCategory = "K1" | "C1" | "Ausdauer" | "Kraft" | "Technik" | "Regeneration" | "Wettkampf" | "Allgemein";

export type TrainingTemplateVisibility = "private" | "club";

export type TrainingArea =
  | "Wassertraining"
  | "Ausdauer"
  | "Krafttraining"
  | "Trainerarbeit"
  | "Regeneration"
  | "Wettkampf";

export type TrainingPlanType =
  | "K1 Technik"
  | "C1 Technik"
  | "Slalomstrecke"
  | "Aufwaertstore"
  | "Abwaertstore"
  | "Starttraining"
  | "Wettkampfsimulation"
  | "Kehrwasser"
  | "Kehrwassertraining"
  | "Linienwahl"
  | "Bootskontrolle"
  | "neues Paddel testen"
  | "GA1"
  | "GA2"
  | "Intervalle"
  | "Rhein-Ausdauer"
  | "Regeneration"
  | "Grundlagentraining"
  | "30-Minuten-Test"
  | "Kraftausdauer"
  | "Maximalkraft"
  | "Explosivkraft"
  | "Rumpf"
  | "Rumpfstabilitaet"
  | "Schulter"
  | "Schulterstabilitaet"
  | "Rotation"
  | "Beweglichkeit"
  | "Kindertraining"
  | "Technikbetreuung"
  | "Anfaengertraining"
  | "Gruppenbetreuung"
  | "Pause"
  | "Mobility"
  | "Mobilitaet"
  | "Dehnen"
  | "Spaziergang"
  | "Schlaf/Erholung"
  | "K1 Rennen"
  | "C1 Rennen"
  | "Mannschaft"
  | "Streckenbesichtigung"
  | "Warmfahren"
  | "Rennanalyse"
  | "Wettkampftag";

export type Weekday =
  | "Montag"
  | "Dienstag"
  | "Mittwoch"
  | "Donnerstag"
  | "Freitag"
  | "Samstag"
  | "Sonntag";

export type Competition = {
  id: string;
  athleteId: string;
  name?: string;
  date: string;
  location: string;
  organizer?: string;
  course?: string;
  level?: "Training" | "Vereinsrennen" | "Bezirk" | "Westdeutsch" | "DM" | "International";
  boatClass: BoatClass;
  run1TimeSeconds: number;
  run1PenaltySeconds: number;
  run2TimeSeconds: number;
  run2PenaltySeconds: number;
  rank: number;
  starterField?: number;
  gapToWinnerSeconds: number;
  feeling: number;
  note: string;
  source?: string;
  externalId?: string;
  sourceUrl?: string;
  createdAt: string;
  updatedAt: string;
};

export type TrainingSession = {
  id: string;
  athleteId: string;
  date: string;
  type: TrainingType;
  durationMinutes: number;
  rpe: number;
  focus: string;
  note: string;
  createdAt: string;
  updatedAt: string;
};

export type TrainingJournalEntry = {
  id: string;
  athleteId: string;
  trainingId: string;
  date: string;
  trainingRating: number;
  feeling: number;
  fatigue: number;
  sleep: number;
  motivation: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type MaterialItem = {
  id: string;
  athleteId: string;
  category: MaterialCategory;
  name: string;
  weightKg: number;
  lengthCm: number;
  imageDataUrl: string;
  status: MaterialStatus;
  rating: number;
  note: string;
  createdAt: string;
  updatedAt: string;
};

export type PlanEntry = {
  id: string;
  ownerUserId: string;
  athleteId: string;
  clubId: string;
  assignedType: TrainingAssignedType;
  assignedAthleteIds: string[];
  assignedGroupIds: string[];
  title: string;
  date: string;
  weekday: Weekday;
  time: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  area: TrainingArea;
  trainingType: TrainingPlanType;
  boatClass: TrainingBoatClass;
  goal: string;
  focus: string;
  description: string;
  intensity: TrainingIntensity;
  note: string;
  notes: string;
  status: PlanStatus;
  repeat: TrainingRepeat;
  repeatUntil: string;
  repeatMaxCount?: number;
  templateId?: string;
  createdByUserId: string;
  assignedAthleteId: string;
  assignedGroupId: string;
  feedbackNote: string;
  createdAt: string;
  updatedAt: string;
};

export type TrainingTemplate = {
  id: string;
  ownerUserId: string;
  clubId?: string;
  createdByUserId: string;
  title: string;
  category: TrainingTemplateCategory;
  trainingArea: TrainingArea;
  trainingType: TrainingPlanType;
  boatClass?: TrainingBoatClass;
  defaultDurationMinutes?: number;
  defaultIntensity: TrainingIntensity;
  focus: string;
  description?: string;
  notes?: string;
  tags: string[];
  isFavorite: boolean;
  visibility: TrainingTemplateVisibility;
  createdAt: string;
  updatedAt: string;
};

export type TrainingFeedback = {
  id: string;
  trainingId: string;
  athleteUserId: string;
  coachUserId?: string;
  status: "done" | "skipped";
  feeling: number;
  difficulty: number;
  fatigue: number;
  motivation: number;
  sleep?: number;
  reason?: string;
  comment?: string;
  completedAt: string;
};

export type Athlete = {
  id: string;
  name: string;
  club: string;
  goals: string[];
};

export type SeasonGoalCategory = "performance" | "training" | "penalty" | "technical" | "personal";

export type SeasonGoalMetric =
  | "bestK1Total"
  | "bestC1Total"
  | "averagePenalty"
  | "trainingCount"
  | "trainingMinutes"
  | "manual";

export type SeasonGoalDirection = "under" | "over" | "equal";

export type SeasonGoalStatus = "active" | "paused" | "achieved" | "archived";

export type SeasonGoalPriority = "low" | "medium" | "high";

export type SeasonGoal = {
  id: string;
  athleteId: string;
  ownerUserId: string;
  assignedByUserId: string;
  title: string;
  description: string;
  category: SeasonGoalCategory;
  metric: SeasonGoalMetric;
  direction: SeasonGoalDirection;
  targetValue: number;
  unit: string;
  startDate: string;
  dueDate: string;
  status: SeasonGoalStatus;
  priority: SeasonGoalPriority;
  currentValueOverride: number | "";
  coachNote: string;
  athleteNote: string;
  createdAt: string;
  updatedAt: string;
};

export type InvitationStatus = "offen" | "angenommen" | "abgelaufen";

export type InvitationRole = "athlete" | "coach";

export type InvitationCode = {
  invitationId: string;
  firstName: string;
  lastName: string;
  email: string;
  club: string;
  role: InvitationRole;
  trainingGroupId: string;
  coachId: string;
  invitationCode: string;
  status: InvitationStatus;
  expiresAt: string;
  createdByUserId: string;
  acceptedByUserId: string;
  createdAt: string;
  acceptedAt: string;
};

export type CoachAthleteStatus = "aktiv" | "pausiert";
export type CoachAthleteInvitationStatus = "aktiv" | "einladung_offen";

export type TrainingGroupFocus = "Technik" | "Kraft" | "Ausdauer" | "Sprint" | "Wettkampf" | "Allgemein";

export type TrainingGroupStatus = "active" | "inactive";

export type CoachAthlete = {
  id: string;
  coachUserId: string;
  clubId: string;
  firstName: string;
  lastName: string;
  email: string;
  name: string;
  birthDate: string;
  ageClass: AgeClass | "";
  club: string;
  boatClasses: BoatClass[];
  paddleSide: PaddleSide;
  groupId: string;
  groupIds: string[];
  goals: string;
  trainerNotes: string;
  notes: string;
  status: CoachAthleteStatus;
  invitationStatus: CoachAthleteInvitationStatus;
  createdAt: string;
  updatedAt: string;
};

export type CoachGroup = {
  id: string;
  groupId: string;
  clubId: string;
  coachUserId: string;
  coachId: string;
  name: string;
  description: string;
  ageCategory: AgeClass | "";
  ageRange: string;
  boatClasses: BoatClass[];
  trainingFocus: TrainingGroupFocus;
  color: string;
  status: TrainingGroupStatus;
  athleteIds: string[];
  createdAt: string;
  updatedAt: string;
};

export type NotificationItem = {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
};

export type ClubPortalStatus = "active" | "inactive";
export type ClubEventCategory = "training" | "competition" | "meeting" | "club_party" | "workday";
export type ClubDocumentFolder = "Trainer" | "Sportler" | "Vorstand" | "Wettkaempfe" | "Formulare";
export type ClubMessageAudience = "club" | "coaches" | "athletes" | "group" | "athlete";
export type ClubMaterialCategory = "Boot" | "Paddel" | "Helm" | "Schwimmweste" | "Spritzdecke" | "Anhaenger" | "Vereinsmaterial";

export type ClubMaterial = {
  id: string;
  clubId: string;
  inventoryNumber: string;
  category: ClubMaterialCategory;
  name: string;
  condition: string;
  ownerUserId: string;
  ownerName: string;
  photoUrl: string;
  lastInspectionDate: string;
  remark: string;
  status: ClubPortalStatus;
  createdAt: string;
  updatedAt: string;
};

export type ClubBoat = {
  id: string;
  clubId: string;
  manufacturer: string;
  model: string;
  boatClass: BoatClass;
  lengthCm: number;
  weightKg: number;
  buildYear: number;
  ownerUserId: string;
  ownerName: string;
  isClubBoat: boolean;
  linkedAthleteIds: string[];
  status: ClubPortalStatus;
  createdAt: string;
  updatedAt: string;
};

export type ClubEvent = {
  id: string;
  clubId: string;
  title: string;
  date: string;
  time: string;
  category: ClubEventCategory;
  groupId: string;
  trainerUserId: string;
  athleteUserId: string;
  note: string;
  createdAt: string;
  updatedAt: string;
};

export type ClubDocument = {
  id: string;
  clubId: string;
  folder: ClubDocumentFolder;
  title: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  visibleForRoles: UserRole[];
  uploadedByUserId: string;
  createdAt: string;
  updatedAt: string;
};

export type ClubMessage = {
  id: string;
  clubId: string;
  senderUserId: string;
  audience: ClubMessageAudience;
  groupId: string;
  recipientUserId: string;
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
};

export type DirectMessage = {
  id: string;
  clubId: string;
  senderId: string;
  receiverId: string;
  message: string;
  isRead: boolean;
  readAt: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string;
};

export type GroupMessage = {
  id: string;
  clubId: string;
  groupId: string;
  senderId: string;
  message: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string;
};

export type ClubPostCategory = "info" | "training" | "competition" | "material" | "urgent" | "organization";
export type ClubPostPriority = "normal" | "important" | "urgent";
export type ClubPostTargetType = "club" | "coaches" | "group" | "athlete";

export type ClubPost = {
  id: string;
  clubId: string;
  authorId: string;
  title: string;
  content: string;
  category: ClubPostCategory;
  priority: ClubPostPriority;
  targetType: ClubPostTargetType;
  targetGroupId: string;
  targetUserId: string;
  expiresAt: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string;
};

export type TeamTaskType = "general" | "technique" | "material" | "video" | "competition" | "training" | "mental" | "recovery";
export type TeamTaskPriority = "normal" | "important" | "urgent";
export type TeamTaskStatus = "open" | "in_progress" | "done" | "skipped";

export type TeamTask = {
  id: string;
  clubId: string;
  createdBy: string;
  title: string;
  description: string;
  taskType: TeamTaskType;
  priority: TeamTaskPriority;
  dueDate: string;
  relatedTrainingId: string;
  relatedCompetitionId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string;
};

export type TeamTaskAssignment = {
  id: string;
  taskId: string;
  assignedTo: string;
  status: TeamTaskStatus;
  completedAt: string;
  responseNote: string;
  createdAt: string;
  updatedAt: string;
};

export type TrainingAttendanceStatus = "pending" | "attending" | "not_attending" | "unsure";
export type TrainingAttendanceReason = "" | "Schule" | "Arbeit" | "Krankheit" | "Familie" | "Wettkampf" | "anderes";

export type TrainingAttendance = {
  id: string;
  trainingId: string;
  athleteId: string;
  clubId: string;
  groupId: string;
  status: TrainingAttendanceStatus;
  reason: TrainingAttendanceReason;
  note: string;
  respondedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type FileAttachmentRelatedType = "direct_message" | "group_message" | "club_post" | "task" | "training" | "competition";

export type FileAttachment = {
  id: string;
  clubId: string;
  ownerId: string;
  relatedType: FileAttachmentRelatedType;
  relatedId: string;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  createdAt: string;
  deletedAt: string;
};

export type ClubSettings = {
  clubId: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  address: string;
  homepage: string;
  contactName: string;
  contactEmail: string;
  clubNumber: string;
  imprint: string;
  updatedAt: string;
};

export type SmartCoachCategory =
  | "training"
  | "regeneration"
  | "technik"
  | "ausdauer"
  | "kraft"
  | "wettkampf"
  | "ziele"
  | "material"
  | "warnung"
  | "motivation";

export type SmartCoachPriority = "low" | "medium" | "high";

export type SmartCoachStatus = "open" | "done" | "dismissed";

export type SmartCoachRecommendation = {
  id: string;
  ownerUserId: string;
  createdForUserId: string;
  createdBySystem: boolean;
  clubId: string;
  category: SmartCoachCategory;
  priority: SmartCoachPriority;
  title: string;
  message: string;
  reason: string;
  suggestedAction: string;
  status: SmartCoachStatus;
  relatedEntityType?: string;
  relatedEntityId?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
};

export type PaddleMotionData = {
  activeUserId: string;
  users: User[];
  athlete: Athlete;
  competitions: Competition[];
  training: TrainingSession[];
  journal: TrainingJournalEntry[];
  material: MaterialItem[];
  plan: PlanEntry[];
  trainingTemplates: TrainingTemplate[];
  trainingFeedback: TrainingFeedback[];
  goals: SeasonGoal[];
  coachAthletes: CoachAthlete[];
  coachGroups: CoachGroup[];
  notifications: NotificationItem[];
  smartCoachRecommendations: SmartCoachRecommendation[];
  clubMaterial: ClubMaterial[];
  clubBoats: ClubBoat[];
  clubEvents: ClubEvent[];
  clubDocuments: ClubDocument[];
  clubMessages: ClubMessage[];
  clubSettings: ClubSettings[];
  directMessages: DirectMessage[];
  groupMessages: GroupMessage[];
  clubPosts: ClubPost[];
  tasks: TeamTask[];
  taskAssignments: TeamTaskAssignment[];
  trainingAttendance: TrainingAttendance[];
  fileAttachments: FileAttachment[];
};

export type PageId =
  | "dashboard"
  | "training"
  | "competitions"
  | "analysis"
  | "club"
  | "communication"
  | "more"
  | "goals"
  | "records"
  | "season"
  | "plan"
  | "equipment"
  | "profile";
