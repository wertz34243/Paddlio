import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const sourceDirs = ["src", "public"];
const forbiddenClientPatterns = [/SUPABASE_SERVICE_ROLE_KEY/i, /service_role/i];
const requiredMigration = path.join(root, "supabase", "migrations", "0031_role_rls_beta_hardening.sql");

const failures = [];

const walk = (dir) => {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(fullPath);
    return [fullPath];
  });
};

for (const dir of sourceDirs) {
  for (const file of walk(path.join(root, dir))) {
    if (!/\.(ts|tsx|js|jsx|mjs|cjs|json|html|css|md)$/.test(file)) continue;
    const text = fs.readFileSync(file, "utf8");
    for (const pattern of forbiddenClientPatterns) {
      if (pattern.test(text)) {
        failures.push(`${path.relative(root, file)} contains client-visible ${pattern}`);
      }
    }
  }
}

if (!fs.existsSync(requiredMigration)) {
  failures.push("Missing supabase/migrations/0031_role_rls_beta_hardening.sql");
} else {
  const migration = fs.readFileSync(requiredMigration, "utf8");
  const requiredSnippets = [
    'drop policy if exists "competitions_authenticated_select"',
    'drop policy if exists "academy path items readable"',
    'drop policy if exists "academy quizzes readable"',
    'drop policy if exists "academy quiz questions readable"',
    "paddlio_can_read_academy_lesson_0031",
  ];

  for (const snippet of requiredSnippets) {
    if (!migration.includes(snippet)) {
      failures.push(`RLS hardening migration is missing: ${snippet}`);
    }
  }
}

if (failures.length > 0) {
  console.error("RLS beta check failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("RLS beta check passed.");
