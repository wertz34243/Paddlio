export type BoatClass = "K1" | "C1";

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

export type UserRole = "athlete" | "coach" | "teamAdmin" | "admin";

export type AuthUser = {
  userId: string;
  email: string;
  displayName: string;
  passwordHash: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
};

export type AuthSession = {
  userId: string;
  createdAt: string;
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

export type PlanStatus = "geplant" | "erledigt" | "ausgelassen";

export type TrainingIntensity = "locker" | "mittel" | "hart" | "maximal";

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
  | "Kehrwassertraining"
  | "Linienwahl"
  | "Bootskontrolle"
  | "GA1"
  | "GA2"
  | "Intervalle"
  | "Rhein-Ausdauer"
  | "Regeneration"
  | "Grundlagentraining"
  | "Kraftausdauer"
  | "Maximalkraft"
  | "Explosivkraft"
  | "Rumpfstabilitaet"
  | "Schulterstabilitaet"
  | "Rotation"
  | "Beweglichkeit"
  | "Kindertraining"
  | "Technikbetreuung"
  | "Anfaengertraining"
  | "Gruppenbetreuung"
  | "Pause"
  | "Mobilitaet"
  | "Dehnen"
  | "Spaziergang"
  | "Schlaf/Erholung"
  | "K1 Rennen"
  | "C1 Rennen"
  | "Mannschaft"
  | "Streckenbesichtigung"
  | "Warmfahren";

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
  date: string;
  location: string;
  boatClass: BoatClass;
  run1TimeSeconds: number;
  run1PenaltySeconds: number;
  run2TimeSeconds: number;
  run2PenaltySeconds: number;
  rank: number;
  gapToWinnerSeconds: number;
  feeling: number;
  note: string;
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
  athleteId: string;
  date: string;
  weekday: Weekday;
  time: string;
  durationMinutes: number;
  area: TrainingArea;
  trainingType: TrainingPlanType;
  goal: string;
  intensity: TrainingIntensity;
  note: string;
  status: PlanStatus;
  createdByUserId: string;
  assignedAthleteId: string;
  assignedGroupId: string;
  feedbackNote: string;
  createdAt: string;
  updatedAt: string;
};

export type Athlete = {
  id: string;
  name: string;
  club: string;
  goals: string[];
};

export type InvitationCode = {
  id: string;
  code: string;
  role: Exclude<UserRole, "admin">;
  createdByUserId: string;
  usedByUserId: string;
  createdAt: string;
  usedAt: string;
};

export type CoachAthleteStatus = "aktiv" | "pausiert";

export type CoachAthlete = {
  id: string;
  coachUserId: string;
  name: string;
  birthDate: string;
  ageClass: AgeClass | "";
  club: string;
  boatClasses: BoatClass[];
  paddleSide: PaddleSide;
  groupId: string;
  goals: string;
  notes: string;
  status: CoachAthleteStatus;
  createdAt: string;
  updatedAt: string;
};

export type CoachGroup = {
  id: string;
  coachUserId: string;
  name: string;
  description: string;
  ageRange: string;
  trainingFocus: string;
  athleteIds: string[];
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
  coachAthletes: CoachAthlete[];
  coachGroups: CoachGroup[];
};

export type PageId =
  | "dashboard"
  | "training"
  | "competitions"
  | "analysis"
  | "more"
  | "goals"
  | "records"
  | "season"
  | "plan"
  | "equipment"
  | "profile";
