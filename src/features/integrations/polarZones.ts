export type PolarZoneSummary = {
  label: "GA1" | "GA2" | "Schwelle" | "Sprint" | "VO2max";
  minPercent: number;
  maxPercent: number;
  seconds: number;
};

export const calculatePaddlioZones = (heartRateSamples: number[], maxHeartRate = 190): PolarZoneSummary[] => {
  const zones: PolarZoneSummary[] = [
    { label: "GA1", minPercent: 0.6, maxPercent: 0.72, seconds: 0 },
    { label: "GA2", minPercent: 0.72, maxPercent: 0.82, seconds: 0 },
    { label: "Schwelle", minPercent: 0.82, maxPercent: 0.9, seconds: 0 },
    { label: "VO2max", minPercent: 0.9, maxPercent: 0.96, seconds: 0 },
    { label: "Sprint", minPercent: 0.96, maxPercent: 1.1, seconds: 0 },
  ];

  if (!heartRateSamples.length || maxHeartRate <= 0) return zones;
  heartRateSamples.forEach((heartRate) => {
    const percent = heartRate / maxHeartRate;
    const match = zones.find((zone) => percent >= zone.minPercent && percent < zone.maxPercent);
    if (match) match.seconds += 1;
  });
  return zones;
};

export const formatDurationCompact = (seconds: number): string => {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
};
