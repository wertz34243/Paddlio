import { useState, type FormEvent } from "react";
import type { MaterialCategory, MaterialItem, MaterialStatus } from "../domain/types";

type MaterialDraft = Omit<MaterialItem, "athleteId" | "createdAt" | "updatedAt">;

type EquipmentViewProps = {
  material: MaterialItem[];
  onSave: (item: Omit<MaterialItem, "id" | "athleteId" | "createdAt" | "updatedAt"> & { id?: string }) => void;
  onDelete: (id: string) => void;
};

const categories: MaterialCategory[] = ["Boot", "Paddel", "Zubehör"];
const statuses: MaterialStatus[] = ["bereit", "pruefen", "wartung", "defekt"];

const statusLabel: Record<MaterialStatus, string> = {
  bereit: "Bereit",
  pruefen: "Prüfen",
  wartung: "Wartung",
  defekt: "Defekt",
};

const emptyDraft: MaterialDraft = {
  id: "",
  category: "Boot",
  name: "",
  weightKg: 0,
  lengthCm: 0,
  imageDataUrl: "",
  status: "bereit",
  rating: 8,
  note: "",
};

const toNumber = (value: FormDataEntryValue | null): number => Number(value ?? 0);

export function EquipmentView({ material, onSave, onDelete }: EquipmentViewProps) {
  const [draft, setDraft] = useState<MaterialDraft | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    onSave({
      id: draft?.id || undefined,
      category: String(formData.get("category")) as MaterialCategory,
      name: String(formData.get("name")).trim(),
      weightKg: toNumber(formData.get("weightKg")),
      lengthCm: toNumber(formData.get("lengthCm")),
      imageDataUrl: draft?.imageDataUrl ?? "",
      status: String(formData.get("status")) as MaterialStatus,
      rating: toNumber(formData.get("rating")),
      note: String(formData.get("note")).trim(),
    });

    setDraft(null);
  };

  const startEdit = (item: MaterialItem) => {
    setDraft({
      id: item.id,
      category: item.category,
      name: item.name,
      weightKg: item.weightKg,
      lengthCm: item.lengthCm,
      imageDataUrl: item.imageDataUrl,
      status: item.status,
      rating: item.rating,
      note: item.note,
    });
  };

  return (
    <div className="stack">
      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Apple Wallet Style</p>
            <h3>Material</h3>
          </div>
          <button className="primary-button" type="button" onClick={() => setDraft(emptyDraft)} aria-label="Material hinzufügen">
            +
          </button>
        </div>

        {draft ? (
          <form className="entry-form" onSubmit={handleSubmit}>
            <div className="form-grid">
              <label>
                Kategorie
                <select name="category" defaultValue={draft.category}>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Status
                <select name="status" defaultValue={draft.status}>
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {statusLabel[status]}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Gewicht kg
                <input name="weightKg" type="number" min="0" step="0.1" defaultValue={draft.weightKg} />
              </label>
              <label>
                Laenge cm
                <input name="lengthCm" type="number" min="0" step="1" defaultValue={draft.lengthCm} />
              </label>
              <label>
                Bewertung 1-10
                <input name="rating" type="number" min="1" max="10" step="1" defaultValue={draft.rating} />
              </label>
            </div>
            <label>
              Name
              <input name="name" defaultValue={draft.name} placeholder="z. B. K1 Wettkampfboot" required />
            </label>
            <label>
              Notiz
              <textarea name="note" defaultValue={draft.note} rows={3} />
            </label>
            <div className="form-actions">
              <button className="save-button" type="submit">
                Speichern
              </button>
              <button className="ghost-button wide" type="button" onClick={() => setDraft(null)}>
                Abbrechen
              </button>
            </div>
          </form>
        ) : null}

        <div className="wallet-list">
          {material.length > 0 ? (
            material.map((item) => (
              <article className={`wallet-card category-${item.category.toLowerCase()}`} key={item.id}>
                <div className="wallet-image">
                  {item.imageDataUrl ? <img src={item.imageDataUrl} alt="" /> : <span>{item.category.slice(0, 1)}</span>}
                </div>
                <div className="wallet-content">
                  <div className="wallet-topline">
                    <div>
                      <span>{item.category}</span>
                      <h4>{item.name}</h4>
                    </div>
                    <b className={`status-pill ${item.status}`}>{statusLabel[item.status]}</b>
                  </div>
                  <div className="wallet-stats">
                    <div>
                      <span>Gewicht</span>
                      <strong>{item.weightKg > 0 ? `${item.weightKg} kg` : "--"}</strong>
                    </div>
                    <div>
                      <span>Laenge</span>
                      <strong>{item.lengthCm > 0 ? `${item.lengthCm} cm` : "--"}</strong>
                    </div>
                    <div>
                      <span>Rating</span>
                      <strong>{item.rating}/10</strong>
                    </div>
                  </div>
                  <p>{item.note || "Keine Notiz gespeichert."}</p>
                  <div className="card-actions">
                    <button className="edit-button" type="button" onClick={() => startEdit(item)}>
                      Bearbeiten
                    </button>
                    <button className="delete-button" type="button" onClick={() => onDelete(item.id)}>
                      Löschen
                    </button>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <p className="empty-state">Noch kein Material gespeichert. Füge Boote, Paddel oder Zubehör über den Plus-Button hinzu.</p>
          )}
        </div>
      </section>
    </div>
  );
}
