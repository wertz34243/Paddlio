import { readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

const appNavigation = read("src/components/navigation/AppNavigation.tsx");
const segmentNav = read("src/components/SegmentNav.tsx");
const app = read("src/App.tsx");
const styles = read("src/styles.css");

assert(
  app.includes('data-testid="app-header"'),
  "App-Header braucht data-testid=\"app-header\" für E2E- und A11y-Prüfungen.",
);
assert(
  segmentNav.includes('data-testid="section-tabs"'),
  "Bereichsnavigation braucht data-testid=\"section-tabs\" für E2E- und A11y-Prüfungen.",
);
assert(
  appNavigation.includes('data-testid="bottom-navigation"'),
  "Bottom Navigation braucht data-testid=\"bottom-navigation\".",
);
assert(
  appNavigation.includes("aria-current={activePage === item.id ? \"page\" : undefined}"),
  "Hauptnavigation muss aktive Seite mit aria-current markieren.",
);
assert(
  appNavigation.includes("aria-label={bottomNavAriaLabel(item.id)}"),
  "Icon-lastige Bottom-Navigation braucht eindeutige aria-labels.",
);
assert(
  segmentNav.includes('role="tablist"') &&
    segmentNav.includes('role="tab"') &&
    segmentNav.includes("aria-selected={activeId === item.id}"),
  "SegmentNav muss tablist/tab/aria-selected semantisch auszeichnen.",
);
assert(
  /:focus-visible/.test(styles),
  "Styles brauchen sichtbare :focus-visible-Zustände.",
);
assert(
  styles.includes("@media (prefers-reduced-motion: reduce)"),
  "Styles brauchen prefers-reduced-motion-Unterstützung.",
);
assert(
  styles.includes("min-height: 44px") || styles.includes("min-height: 48px"),
  "Touch-Ziele brauchen eine Mindesthöhe.",
);

console.log("Accessibility beta check passed.");
