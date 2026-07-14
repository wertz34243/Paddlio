import type { Competition } from "./types";

export type NormalizedCompetitionLevel =
  | "general"
  | "club"
  | "district"
  | "state"
  | "national"
  | "international";

export const competitionLevelLabels: Record<NormalizedCompetitionLevel, string> = {
  general: "Allgemeiner Wettkampf",
  club: "Vereinswettkampf",
  district: "Bezirksmeisterschaft",
  state: "Landesmeisterschaft",
  national: "Deutsche Meisterschaft",
  international: "Internationaler Wettkampf",
};

export const competitionLevelOptions: Array<{ value: NormalizedCompetitionLevel; label: string }> =
  Object.entries(competitionLevelLabels).map(([value, label]) => ({
    value: value as NormalizedCompetitionLevel,
    label,
  }));

export const normalizeCompetitionLevel = (level: unknown): NormalizedCompetitionLevel => {
  const value = String(level ?? "").trim().toLowerCase();

  if (["club", "vereinsrennen", "vereinswettkampf"].includes(value)) return "club";
  if (["district", "bezirk", "bezirksmeisterschaft"].includes(value)) return "district";
  if (["state", "land", "landesmeisterschaft", "westdeutsch"].includes(value)) return "state";
  if (["national", "dm", "deutsche meisterschaft"].includes(value)) return "national";
  if (["international", "internationaler wettkampf"].includes(value)) return "international";

  return "general";
};

export const formatCompetitionLevel = (level: unknown): string =>
  competitionLevelLabels[normalizeCompetitionLevel(level)];

export const toNonNegativeNumber = (value: unknown): number => {
  const parsed = typeof value === "number" ? value : Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
};

export const calculateCompetitionTotalTime = (rawTime: unknown, penaltySeconds: unknown): number =>
  toNonNegativeNumber(rawTime) + toNonNegativeNumber(penaltySeconds);

export const getCompetitionRunTotals = (competition: Competition) => {
  const run1Total = calculateCompetitionTotalTime(competition.run1TimeSeconds, competition.run1PenaltySeconds);
  const run2Total = calculateCompetitionTotalTime(competition.run2TimeSeconds, competition.run2PenaltySeconds);

  return {
    run1Total,
    run2Total,
    bestTotal: Math.min(run1Total, run2Total),
  };
};
