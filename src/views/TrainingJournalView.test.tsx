import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { TrainingJournalEntry } from "../domain/types";
import { TrainingJournalView } from "./TrainingJournalView";

const importedEntry: TrainingJournalEntry = {
  id: "749cd776-785a-486e-96da-00c58b5c946d",
  athleteId: "a1e53085-b184-4893-bac1-e09db356ddd5",
  trainingId: "749cd776-785a-486e-96da-00c58b5c946d",
  date: "2026-10-05",
  title: "Technik Import",
  trainingType: "Technik",
  boatClass: "K1",
  completionStatus: "completed",
  actualDurationMinutes: 75,
  trainingRating: 7,
  feeling: 8,
  fatigue: 4,
  sleep: 7,
  motivation: 9,
  notes: "Importierte Einheit",
  createdAt: "2026-10-05T10:00:00.000Z",
  updatedAt: "2026-10-05T10:00:00.000Z",
};

describe("TrainingJournalView", () => {
  it("renders a cloud-imported free session without local session or plan data", () => {
    const markup = renderToStaticMarkup(
      <TrainingJournalView
        journal={[importedEntry]}
        sessions={[]}
        plan={[]}
        onOpenOverview={vi.fn()}
        onOpenPlan={vi.fn()}
        onOpenSessions={vi.fn()}
      />,
    );

    expect(markup).toContain("Technik Import");
    expect(markup).toContain("Durchgeführt: 75 min");
    expect(markup).toContain("freies Training");
    expect(markup).toContain("Importierte Einheit");
  });

  it("keeps existing manual journal entries visible", () => {
    const markup = renderToStaticMarkup(
      <TrainingJournalView
        journal={[{ ...importedEntry, id: "manual-entry", title: undefined, notes: "Manueller Eintrag" }]}
        sessions={[{
          id: importedEntry.trainingId,
          athleteId: importedEntry.athleteId,
          date: importedEntry.date,
          type: "Ausdauer",
          durationMinutes: 60,
          rpe: 6,
          focus: "Manuelles Training",
          note: "",
          createdAt: importedEntry.createdAt,
          updatedAt: importedEntry.updatedAt,
        }]}
        plan={[]}
        onOpenOverview={vi.fn()}
        onOpenPlan={vi.fn()}
        onOpenSessions={vi.fn()}
      />,
    );

    expect(markup).toContain("Manuelles Training");
    expect(markup).toContain("Manueller Eintrag");
  });
});
