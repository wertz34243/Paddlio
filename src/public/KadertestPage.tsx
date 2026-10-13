import { useMemo, useState } from "react";
import {
  biologicalAges,
  calendarAges,
  formatAge,
  formatDecimal,
  formatDuration,
  getBiologicalNorm,
  getCalendarNorm,
  getTechniqueAge,
  getTechniqueComparison,
  includesCanoe,
  includesKayak,
  materialChecks,
  techniqueNorms,
  type BiologicalAge,
  type CalendarAge,
  type TestDiscipline,
  type TestGender,
} from "./kadertestData";

const CHECKS_STORAGE_KEY = "paddlio-kadertest-checks-v2";

export type TestTask = { id: string; name: string; target: string };
export type TestSection = { id: string; title: string; description?: string; note?: string; tasks: TestTask[] };

const readChecks = (): Record<string, boolean> => {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(CHECKS_STORAGE_KEY) ?? "{}");
    return parsed && typeof parsed === "object" ? parsed as Record<string, boolean> : {};
  } catch {
    return {};
  }
};

const techniqueSection = (age: CalendarAge, discipline: "kayak" | "canoe"): TestSection => {
  const exactAge = getTechniqueAge(age);
  const title = discipline === "kayak" ? "Kajak-Technik" : "Canadier-Technik";
  if (exactAge !== null) {
    const norm = techniqueNorms[discipline][exactAge];
    return {
      id: `${discipline}-technique`,
      title,
      description: `Technikziel Mittelwert ${formatDecimal(norm.mean, discipline === "kayak" ? 1 : 2)}`,
      tasks: Object.entries(norm.tasks).map(([name, target], index) => ({
        id: `${discipline}-technique-${index}`,
        name,
        target: `max. ${formatDecimal(target)} Fehlerpunkte im Mittel`,
      })),
    };
  }

  const lowerAge = Math.floor(Number(age));
  const upperAge = Math.ceil(Number(age));
  const taskNames = Array.from(new Set([
    ...Object.keys(techniqueNorms[discipline][lowerAge].tasks),
    ...Object.keys(techniqueNorms[discipline][upperAge].tasks),
  ]));
  return {
    id: `${discipline}-technique`,
    title,
    description: `Das DKV-Testmanual enthält keine eigene Technik-Norm für ${formatAge(age)} Jahre.`,
    note: `Vergleich Mittelwert: ${getTechniqueComparison(age, discipline)}. Welche Saison-Altersklasse gilt, bitte mit dem Trainer prüfen.`,
    tasks: taskNames.map((name, index) => ({
      id: `${discipline}-technique-${index}`,
      name,
      target: `Vergleich: ${getTechniqueComparison(age, discipline)}`,
    })),
  };
};

export function buildSections(calendarAge: CalendarAge, biologicalAge: BiologicalAge, gender: TestGender, discipline: TestDiscipline): TestSection[] {
  const calendar = getCalendarNorm(calendarAge, gender);
  const biological = getBiologicalNorm(biologicalAge, gender);
  const sections: TestSection[] = [{
    id: "basics",
    title: "Beweglichkeit & Rumpfkraft",
    description: `Zielwerte nach kalendarischem Alter K ${formatAge(calendarAge)}`,
    tasks: [
      { id: "sit-and-reach", name: "Sit & Reach", target: `${calendar.sitAndReach} cm` },
      { id: "core-strength", name: "Rumpfkraft", target: `${calendar.coreStrength} s` },
    ],
  }];

  const calendarValue = Number(calendarAge);
  const bodyweightTasks: TestTask[] = [
    { id: "pull-ups", name: "Klimmzüge", target: biological.pullUps === undefined ? "keine Norm für diese Altersstufe" : String(biological.pullUps) },
    { id: "push-ups", name: "Liegestütze", target: biological.pushUps === undefined ? "keine Norm für diese Altersstufe" : String(biological.pushUps) },
  ];
  const relativeTarget = biological.relativeStrength === undefined ? "keine Norm für diese Altersstufe" : `relative Kraft ${biological.relativeStrength} %`;
  const benchTasks: TestTask[] = [
    { id: "bench-pull", name: "Bankziehen", target: relativeTarget },
    { id: "bench-press", name: "Bankdrücken", target: relativeTarget },
  ];
  const transitionalStrength = calendarValue === 13.5;
  sections.push({
    id: "strength",
    title: "Kraftstation",
    description: `Zielwerte nach biologischem Alter B ${formatAge(biologicalAge)}`,
    note: transitionalStrength ? "Welche Kraftstation getestet wird, richtet sich offiziell nach der Saison-Altersklasse. Bitte mit Trainer prüfen." : undefined,
    tasks: transitionalStrength ? [...bodyweightTasks, ...benchTasks] : calendarValue <= 13 ? bodyweightTasks : benchTasks,
  });

  const performanceTasks: TestTask[] = [];
  if (includesKayak(discipline)) {
    performanceTasks.push(
      { id: "kayak-sprint", name: "K1 20-m-Sprint", target: `${formatDecimal(biological.kayakSprint)} s` },
      { id: "kayak-endurance", name: "K1 Ausdauertest", target: formatDuration(biological.kayakEndurance) },
    );
  }
  if (includesCanoe(discipline)) {
    performanceTasks.push(
      { id: "canoe-sprint", name: "C1 20-m-Sprint", target: `${formatDecimal(biological.canoeSprint)} s` },
      { id: "canoe-endurance", name: "C1 Ausdauertest", target: formatDuration(biological.canoeEndurance) },
    );
  }
  sections.push({ id: "performance", title: "Sprint & Ausdauer", description: `Zielwerte nach biologischem Alter B ${formatAge(biologicalAge)}`, tasks: performanceTasks });

  if (includesKayak(discipline)) sections.push(techniqueSection(calendarAge, "kayak"));
  if (includesCanoe(discipline)) sections.push(techniqueSection(calendarAge, "canoe"));
  sections.push({ id: "material", title: "Vermessung & Material", tasks: materialChecks.map((name, index) => ({ id: `material-${index}`, name, target: "vollständig erfassen" })) });
  return sections;
}

export function KadertestPage() {
  const [athleteName, setAthleteName] = useState("");
  const [gender, setGender] = useState<TestGender>("male");
  const [calendarAge, setCalendarAge] = useState<CalendarAge>("13.0");
  const [biologicalAge, setBiologicalAge] = useState<BiologicalAge>("13.0");
  const [discipline, setDiscipline] = useState<TestDiscipline>("kayak");
  const [checks, setChecks] = useState<Record<string, boolean>>(readChecks);
  const sections = useMemo(() => buildSections(calendarAge, biologicalAge, gender, discipline), [calendarAge, biologicalAge, gender, discipline]);
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
      <p>Wähle Altersstufe, Geschlecht und Disziplin. Paddlio stellt die im DKV-Testmanual ausgewiesenen Zielwerte und Technikaufgaben zusammen.</p>
    </section>

    <section className="kadertest-controls" aria-label="Kadertest Einstellungen">
      <label><span>Name des Sportlers <small>(optional)</small></span><input value={athleteName} onChange={(event) => setAthleteName(event.target.value)} autoComplete="name" /></label>
      <label><span>Geschlecht</span><select value={gender} onChange={(event) => setGender(event.target.value as TestGender)}><option value="male">männlich</option><option value="female">weiblich</option></select></label>
      <label><span>K – kalendarisches Alter</span><select value={calendarAge} onChange={(event) => setCalendarAge(event.target.value as CalendarAge)}>{calendarAges.map((age) => <option value={age} key={age}>{formatAge(age)}</option>)}</select></label>
      <label><span>B – biologisches Alter</span><select value={biologicalAge} onChange={(event) => setBiologicalAge(event.target.value as BiologicalAge)}>{biologicalAges.map((age) => <option value={age} key={age}>{formatAge(age)}</option>)}</select></label>
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
        <header><h2>{section.title}</h2>{section.description ? <p>{section.description}</p> : null}{section.note ? <p className="kadertest-note">{section.note}</p> : null}</header>
        <div className="kadertest-task-list">
          {section.tasks.map((task) => <label className="kadertest-task" key={task.id}>
            <input type="checkbox" checked={Boolean(checks[task.id])} onChange={(event) => setChecked(task.id, event.target.checked)} />
            <span><strong>{task.name}</strong><small>Zielwert: {task.target}</small></span>
          </label>)}
        </div>
      </section>)}
    </div>

    <section className="kadertest-reset"><button type="button" onClick={resetChecks}>Alle Häkchen zurücksetzen</button></section>
    <p className="kadertest-disclaimer">Diese Seite ist eine Trainings- und Vorbereitungshilfe nach der Struktur des DKV-Testmanuals. Sie ersetzt keine offizielle DKV-Auswertung.</p>
  </main>;
}
