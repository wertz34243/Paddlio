import { useMemo, useState } from "react";
import {
  biologicalNorms,
  calendarNorms,
  canoeTechnique,
  includesCanoe,
  includesKayak,
  kayakTechnique,
  materialChecks,
  techniqueComparison,
  type TestAge,
  type TestDiscipline,
} from "./kadertestData";

const CHECKS_STORAGE_KEY = "paddlio-kadertest-checks-v1";

type TestTask = { id: string; name: string; target: string };
type TestSection = { id: string; title: string; description?: string; tasks: TestTask[] };

const readChecks = (): Record<string, boolean> => {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(CHECKS_STORAGE_KEY) ?? "{}");
    return parsed && typeof parsed === "object" ? parsed as Record<string, boolean> : {};
  } catch {
    return {};
  }
};

const techniqueTarget = (age: TestAge, discipline: "kayak" | "canoe"): string => {
  const norm = discipline === "kayak" ? calendarNorms[age].kayakTechnique : calendarNorms[age].canoeTechnique;
  return norm ?? `Vergleich: ${techniqueComparison(discipline)}`;
};

function buildSections(calendarAge: TestAge, biologicalAge: TestAge, discipline: TestDiscipline): TestSection[] {
  const calendar = calendarNorms[calendarAge];
  const biological = biologicalNorms[biologicalAge];
  const sections: TestSection[] = [{
    id: "basics",
    title: "Beweglichkeit & Rumpfkraft",
    description: `Zielwerte nach kalendarischem Alter K ${calendarAge.replace(".", ",")}`,
    tasks: [
      { id: "sit-and-reach", name: "Sit & Reach", target: calendar.sitAndReach },
      { id: "core-strength", name: "Rumpfkraft", target: calendar.coreStrength },
    ],
  }];

  const strengthTasks: TestTask[] = calendarAge === "13.0"
    ? [
        { id: "pull-ups", name: "Klimmzüge", target: biological.pullUps },
        { id: "push-ups", name: "Liegestütze", target: biological.pushUps },
      ]
    : calendarAge === "14.0"
      ? [
          { id: "bench-pull", name: "Bankziehen", target: `relative Kraft ${biological.relativeStrength}` },
          { id: "bench-press", name: "Bankdrücken", target: `relative Kraft ${biological.relativeStrength}` },
        ]
      : [
          { id: "pull-ups", name: "Klimmzüge", target: biological.pullUps },
          { id: "push-ups", name: "Liegestütze", target: biological.pushUps },
          { id: "bench-pull", name: "Bankziehen", target: `relative Kraft ${biological.relativeStrength}` },
          { id: "bench-press", name: "Bankdrücken", target: `relative Kraft ${biological.relativeStrength}` },
        ];
  sections.push({
    id: "strength",
    title: "Kraftstation",
    description: calendarAge === "13.5" ? "Welche Kraftstation getestet wird, richtet sich offiziell nach der Saison-Altersklasse. Bitte mit Trainer prüfen." : `Zielwerte nach biologischem Alter B ${biologicalAge.replace(".", ",")}`,
    tasks: strengthTasks,
  });

  const performanceTasks: TestTask[] = [];
  if (includesKayak(discipline)) {
    performanceTasks.push(
      { id: "kayak-sprint", name: "K1 20-m-Sprint", target: biological.kayakSprint },
      { id: "kayak-endurance", name: "K1 Ausdauertest", target: biological.kayakEndurance },
    );
  }
  if (includesCanoe(discipline)) {
    performanceTasks.push(
      { id: "canoe-sprint", name: "C1 20-m-Sprint", target: biological.canoeSprint },
      { id: "canoe-endurance", name: "C1 Ausdauertest", target: biological.canoeEndurance },
    );
  }
  sections.push({ id: "performance", title: "Sprint & Ausdauer", description: `Zielwerte nach biologischem Alter B ${biologicalAge.replace(".", ",")}`, tasks: performanceTasks });

  if (includesKayak(discipline)) {
    sections.push({
      id: "kayak-technique",
      title: "Kajak-Technik",
      description: calendarAge === "13.5" ? "Das DKV-Testmanual enthält keine eigene Technik-Norm für 13,5 Jahre." : `Technikziel ${calendar.kayakTechnique}`,
      tasks: kayakTechnique.map((name, index) => ({ id: `kayak-technique-${index}`, name, target: techniqueTarget(calendarAge, "kayak") })),
    });
  }

  if (includesCanoe(discipline)) {
    const tasks: TestTask[] = canoeTechnique.map((name, index) => ({ id: `canoe-technique-${index}`, name, target: techniqueTarget(calendarAge, "canoe") }));
    if (calendarAge === "14.0") tasks.push({ id: "canoe-edge-gate", name: "Abwärtstor verkanten", target: calendar.canoeTechnique ?? "" });
    if (calendarAge === "13.5") tasks.push({ id: "canoe-edge-gate", name: "Abwärtstor verkanten", target: "ab Altersstufe 14, mit Trainer prüfen" });
    sections.push({
      id: "canoe-technique",
      title: "Canadier-Technik",
      description: calendarAge === "13.5" ? "Das DKV-Testmanual enthält keine eigene Technik-Norm für 13,5 Jahre." : `Technikziel ${calendar.canoeTechnique}`,
      tasks,
    });
  }

  sections.push({ id: "material", title: "Vermessung & Material", tasks: materialChecks.map((name, index) => ({ id: `material-${index}`, name, target: "vollständig erfassen" })) });
  return sections;
}

export function KadertestPage() {
  const [athleteName, setAthleteName] = useState("");
  const [calendarAge, setCalendarAge] = useState<TestAge>("13.0");
  const [biologicalAge, setBiologicalAge] = useState<TestAge>("13.0");
  const [discipline, setDiscipline] = useState<TestDiscipline>("kayak");
  const [checks, setChecks] = useState<Record<string, boolean>>(readChecks);
  const sections = useMemo(() => buildSections(calendarAge, biologicalAge, discipline), [calendarAge, biologicalAge, discipline]);
  const visibleTasks = sections.flatMap((section) => section.tasks);
  const completed = visibleTasks.filter((task) => checks[task.id]).length;
  const progress = visibleTasks.length > 0 ? Math.round((completed / visibleTasks.length) * 100) : 0;

  const setChecked = (id: string, checked: boolean) => {
    setChecks((current) => {
      const next = { ...current, [id]: checked };
      window.localStorage.setItem(CHECKS_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const resetChecks = () => {
    window.localStorage.removeItem(CHECKS_STORAGE_KEY);
    setChecks({});
  };

  return <main id="main" className="public-main kadertest-page">
    <section className="kadertest-hero">
      <p className="public-eyebrow">Persönliche Checkliste</p>
      <h1>Landeskadertest – Vorbereitung</h1>
      <p>Wähle Alter und Disziplin. Paddlio stellt die passenden Zielwerte und Technikaufgaben zusammen.</p>
    </section>

    <section className="kadertest-controls" aria-label="Kadertest Einstellungen">
      <label><span>Name des Sportlers <small>(optional)</small></span><input value={athleteName} onChange={(event) => setAthleteName(event.target.value)} autoComplete="name" /></label>
      <label><span>K – kalendarisches Alter</span><select value={calendarAge} onChange={(event) => setCalendarAge(event.target.value as TestAge)}><option value="13.0">13,0</option><option value="13.5">13,5</option><option value="14.0">14,0</option></select></label>
      <label><span>B – biologisches Alter</span><select value={biologicalAge} onChange={(event) => setBiologicalAge(event.target.value as TestAge)}><option value="13.0">13,0</option><option value="13.5">13,5</option><option value="14.0">14,0</option></select></label>
      <fieldset><legend>Disziplin</legend><div className="kadertest-segments">
        <label><input type="radio" name="discipline" value="kayak" checked={discipline === "kayak"} onChange={() => setDiscipline("kayak")} /><span>Kajak</span></label>
        <label><input type="radio" name="discipline" value="canoe" checked={discipline === "canoe"} onChange={() => setDiscipline("canoe")} /><span>Canadier</span></label>
        <label><input type="radio" name="discipline" value="both" checked={discipline === "both"} onChange={() => setDiscipline("both")} /><span>Kajak + Canadier</span></label>
      </div></fieldset>
    </section>

    <section className="kadertest-progress" aria-live="polite">
      <div><span>{athleteName.trim() || "Dein Fortschritt"}</span><strong>{completed} von {visibleTasks.length} erledigt – {progress} %</strong></div>
      <progress value={completed} max={visibleTasks.length} aria-label={`${progress} Prozent erledigt`} />
    </section>

    <div className="kadertest-sections">
      {sections.map((section) => <section className="kadertest-section" key={section.id}>
        <header><h2>{section.title}</h2>{section.description ? <p>{section.description}</p> : null}</header>
        <div className="kadertest-task-list">
          {section.tasks.map((task) => <label className="kadertest-task" key={task.id}>
            <input type="checkbox" checked={Boolean(checks[task.id])} onChange={(event) => setChecked(task.id, event.target.checked)} />
            <span><strong>{task.name}</strong><small>Zielwert: {task.target}</small></span>
          </label>)}
        </div>
      </section>)}
    </div>

    <section className="kadertest-reset">
      <button type="button" onClick={resetChecks}>Alle Häkchen zurücksetzen</button>
    </section>
    <p className="kadertest-disclaimer">Diese Seite ist eine Trainings- und Vorbereitungshilfe nach der Struktur des DKV-Testmanuals. Sie ersetzt keine offizielle DKV-Auswertung.</p>
  </main>;
}
