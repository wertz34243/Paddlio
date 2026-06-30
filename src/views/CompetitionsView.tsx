import { useEffect, useState, type FormEvent } from "react";
import {
  formatSeconds,
  getBestDriveTime,
  getBestTotalTime,
  getCompetitionAveragePenalty,
  getRun1Total,
  getRun2Total,
} from "../domain/metrics";
import type { BoatClass, Competition } from "../domain/types";

type CompetitionDraft = Omit<Competition, "athleteId" | "createdAt" | "updatedAt">;

type CompetitionsViewProps = {
  competitions: Competition[];
  onSave: (competition: Omit<Competition, "id" | "athleteId" | "createdAt" | "updatedAt"> & { id?: string }) => void;
  onDelete: (id: string) => void;
  openNewSignal?: number;
};

const emptyDraft: CompetitionDraft = {
  id: "",
  date: new Date().toISOString().slice(0, 10),
  location: "",
  boatClass: "K1",
  run1TimeSeconds: 0,
  run1PenaltySeconds: 0,
  run2TimeSeconds: 0,
  run2PenaltySeconds: 0,
  rank: 1,
  gapToWinnerSeconds: 0,
  feeling: 7,
  note: "",
};

const toNumber = (value: FormDataEntryValue | null): number => Number(value ?? 0);

export function CompetitionsView({ competitions, onSave, onDelete, openNewSignal = 0 }: CompetitionsViewProps) {
  const [draft, setDraft] = useState<CompetitionDraft | null>(null);
  const [openId, setOpenId] = useState<string>("");
  const sortedCompetitions = [...competitions].sort((a, b) => b.date.localeCompare(a.date) || a.location.localeCompare(b.location));

  useEffect(() => {
    if (openNewSignal > 0) {
      setDraft({ ...emptyDraft, date: new Date().toISOString().slice(0, 10) });
    }
  }, [openNewSignal]);

  const closeForm = () => setDraft(null);

  const startEdit = (competition: Competition) => {
    setDraft({
      id: competition.id,
      date: competition.date,
      location: competition.location,
      boatClass: competition.boatClass,
      run1TimeSeconds: competition.run1TimeSeconds,
      run1PenaltySeconds: competition.run1PenaltySeconds,
      run2TimeSeconds: competition.run2TimeSeconds,
      run2PenaltySeconds: competition.run2PenaltySeconds,
      rank: competition.rank,
      gapToWinnerSeconds: competition.gapToWinnerSeconds,
      feeling: competition.feeling,
      note: competition.note,
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    onSave({
      id: draft?.id || undefined,
      date: String(formData.get("date")),
      location: String(formData.get("location")).trim(),
      boatClass: String(formData.get("boatClass")) as BoatClass,
      run1TimeSeconds: toNumber(formData.get("run1TimeSeconds")),
      run1PenaltySeconds: toNumber(formData.get("run1PenaltySeconds")),
      run2TimeSeconds: toNumber(formData.get("run2TimeSeconds")),
      run2PenaltySeconds: toNumber(formData.get("run2PenaltySeconds")),
      rank: toNumber(formData.get("rank")),
      gapToWinnerSeconds: toNumber(formData.get("gapToWinnerSeconds")),
      feeling: toNumber(formData.get("feeling")),
      note: String(formData.get("note")).trim(),
    });

    closeForm();
  };

  return (
    <div className="stack">
      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Timeline</p>
            <h3>Wettkaempfe</h3>
          </div>
          <button className="primary-button" type="button" onClick={() => setDraft(emptyDraft)} aria-label="Wettkampf hinzufuegen">
            +
          </button>
        </div>

        {draft ? (
          <form className="entry-form" onSubmit={handleSubmit}>
            <div className="form-grid">
              <label>
                Datum
                <input name="date" type="date" defaultValue={draft.date} required />
              </label>
              <label>
                Ort
                <input name="location" defaultValue={draft.location} placeholder="z. B. Unna" required />
              </label>
              <label>
                Boot
                <select name="boatClass" defaultValue={draft.boatClass}>
                  <option value="K1">K1</option>
                  <option value="C1">C1</option>
                </select>
              </label>
              <label>
                Lauf 1 Fahrzeit
                <input name="run1TimeSeconds" type="number" min="0" step="0.01" defaultValue={draft.run1TimeSeconds} />
              </label>
              <label>
                Lauf 1 Strafsekunden
                <input name="run1PenaltySeconds" type="number" min="0" step="1" defaultValue={draft.run1PenaltySeconds} />
              </label>
              <label>
                Lauf 2 Fahrzeit
                <input name="run2TimeSeconds" type="number" min="0" step="0.01" defaultValue={draft.run2TimeSeconds} />
              </label>
              <label>
                Lauf 2 Strafsekunden
                <input name="run2PenaltySeconds" type="number" min="0" step="1" defaultValue={draft.run2PenaltySeconds} />
              </label>
              <label>
                Platz
                <input name="rank" type="number" min="1" step="1" defaultValue={draft.rank} />
              </label>
              <label>
                Abstand Sieger
                <input name="gapToWinnerSeconds" type="number" min="0" step="0.01" defaultValue={draft.gapToWinnerSeconds} />
              </label>
              <label>
                Gefuehl 1-10
                <input name="feeling" type="number" min="1" max="10" step="1" defaultValue={draft.feeling} />
              </label>
            </div>
            <label>
              Notiz
              <textarea name="note" defaultValue={draft.note} rows={3} />
            </label>
            <div className="form-actions">
              <button className="save-button" type="submit">
                Speichern
              </button>
              <button className="ghost-button wide" type="button" onClick={closeForm}>
                Abbrechen
              </button>
            </div>
          </form>
        ) : null}

        <div className="competition-timeline">
          {sortedCompetitions.map((competition) => {
            const isOpen = openId === competition.id;
            const penalty = getCompetitionAveragePenalty(competition);

            return (
              <article className={`competition-timeline-item tone-${competition.boatClass.toLowerCase()}`} key={competition.id}>
                <div className="competition-logo">{competition.boatClass}</div>
                <button className="competition-summary" type="button" onClick={() => setOpenId(isOpen ? "" : competition.id)}>
                  <div>
                    <span>{new Date(competition.date).toLocaleDateString("de-DE")}</span>
                    <h4>{competition.location}</h4>
                    <small>
                      Platz {competition.rank} - {penalty.toLocaleString("de-DE", { maximumFractionDigits: 1 })} Strafsek.
                    </small>
                  </div>
                  <strong>{formatSeconds(getBestTotalTime(competition))}</strong>
                </button>
                {isOpen ? (
                  <div className="competition-details">
                    <div className="split-grid">
                      <div>
                        <span>Lauf 1 Total</span>
                        <b>{formatSeconds(getRun1Total(competition))}</b>
                      </div>
                      <div>
                        <span>Lauf 2 Total</span>
                        <b>{formatSeconds(getRun2Total(competition))}</b>
                      </div>
                      <div>
                        <span>Beste Fahrzeit</span>
                        <b>{formatSeconds(getBestDriveTime(competition))}</b>
                      </div>
                      <div>
                        <span>Abstand Sieger</span>
                        <b>{formatSeconds(competition.gapToWinnerSeconds)}</b>
                      </div>
                      <div>
                        <span>Gefuehl</span>
                        <b>{competition.feeling}/10</b>
                      </div>
                      <div>
                        <span>Boot</span>
                        <b>{competition.boatClass}</b>
                      </div>
                    </div>
                    {competition.note ? <p className="card-note">{competition.note}</p> : null}
                    <div className="card-actions">
                      <button className="edit-button" type="button" onClick={() => startEdit(competition)}>
                        Bearbeiten
                      </button>
                      <button className="delete-button" type="button" onClick={() => onDelete(competition.id)}>
                        Loeschen
                      </button>
                    </div>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
