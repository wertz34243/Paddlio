import { readFileSync, writeFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { randomBytes } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createClient } from '@supabase/supabase-js';

// Explicitly scoped to the four authorized DEV accounts. Never resets passwords.
const url = 'https://nlllqsfdhfiwticrcrnp.supabase.co';
const local = parseEnv(readFileSync('.env.development.local', 'utf8'));
const secretFile = '.env.e2e.local';
for (const file of ['.env.development.local', secretFile]) {
  if (execFileSync('git', ['check-ignore', '--', file], { encoding: 'utf8' }).trim() !== file) throw new Error('Secret file must be Git ignored');
}
if (local.SUPABASE_URL !== url) throw new Error('Exact DEV URL required');
const claims = JSON.parse(Buffer.from((local.SUPABASE_SERVICE_ROLE_KEY || '').split('.')[1] || '', 'base64url'));
if (claims.ref !== 'nlllqsfdhfiwticrcrnp' || claims.role !== 'service_role') throw new Error('DEV service_role required');
const client = createClient(url, local.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const accounts = [['ATHLETE', 'athlete'], ['COACH', 'coach'], ['CLUBADMIN', 'clubadmin'], ['ADMIN', 'admin']];
function checked(result, operation) {
  if (result.error) throw new Error(`${operation} failed (status ${result.error.status || result.status || 'unknown'}, code ${result.error.code || 'unknown'})`);
  return result.data;
}
try {
  const users = [];
  for (let page = 1; ; page++) {
    const data = checked(await client.auth.admin.listUsers({ page, perPage: 100 }), 'DEV admin access');
    users.push(...data.users);
    if (data.users.length < 100) break;
  }
  console.log('DEV admin access verified.');
  if (!process.argv.includes('--create')) process.exit(0);
  let source = readFileSync(secretFile, 'utf8');
  const env = parseEnv(source);
  for (const [role, slug] of accounts) {
    const email = `e2e-${slug}@paddlio.de`;
    const existing = users.find(user => user.email?.toLowerCase() === email);
    const emailKey = `PADDLIO_E2E_${role}_EMAIL`;
    const passwordKey = `PADDLIO_E2E_${role}_PASSWORD`;
    if (env[emailKey] && env[emailKey] !== email) throw new Error(`Existing ${role} credential belongs to another account`);
    if (existing && !env[passwordKey]) throw new Error(`Existing ${role} account requires local credentials; no reset performed`);
    if (!existing) {
      const password = env[passwordKey] || randomBytes(32).toString('base64url') + '!aA7';
      for (const [key, value] of [[emailKey, email], [passwordKey, password]]) {
        const line = new RegExp(`^${key}=.*$`, 'm');
        source = line.test(source) ? source.replace(line, `${key}=${value}`) : source + `\n${key}=${value}\n`;
      }
      // Persist before creating, so interruption cannot lose the generated password.
      writeFileSync(secretFile, source, { mode: 0o600 });
      const created = checked(await client.auth.admin.createUser({ email, password, email_confirm: true,
        user_metadata: { first_name: 'Test', last_name: role === 'ATHLETE' ? 'Athlete' : slug, birthDate: '1990-01-01', paddlio_seed: 'release-e2e-dev' }
      }), `Create ${role}`);
      users.push(created.user);
      console.log(`${role}: DEV account created, email confirmed; password stored locally.`);
    } else console.log(`${role}: existing account preserved.`);
  }
  const roles = { ATHLETE: 'Athlete', COACH: 'Coach', CLUBADMIN: 'ClubAdmin', ADMIN: 'Admin' };
  const foundClubs = checked(await client.from('clubs').select('id').eq('short_name', 'E2E-RELEASE-50'), 'Find dedicated test club');
  if (foundClubs.length > 1) throw new Error('Ambiguous dedicated test club');
  const club = foundClubs[0] || checked(await client.from('clubs').insert({ name: 'Paddlio Release E2E', short_name: 'E2E-RELEASE-50', status: 'active' }).select('id').single(), 'Create dedicated test club');
  for (const [role, slug] of accounts) {
    const user = users.find(user => user.email === `e2e-${slug}@paddlio.de`);
    const rows = checked(await client.from('profiles').update({ roles: [roles[role]], primary_role: roles[role], club_id: club.id, active_club_id: club.id, status: 'active', display_name: `Test ${roles[role]}` }).eq('id', user.id).select('id,roles'), `Assign ${role}`);
    if (rows.length !== 1 || !rows[0].roles.includes(roles[role])) throw new Error(`Role assignment not verified for ${role}`);
    checked(await client.from('club_memberships').upsert({ club_id: club.id, user_id: user.id, role: roles[role], status: 'active' }, { onConflict: 'club_id,user_id' }), `Membership ${role}`);
    console.log(`${role}: profile role and dedicated DEV club verified.`);
  }
  const coach = users.find(user => user.email === 'e2e-coach@paddlio.de').id;
  const athlete = users.find(user => user.email === 'e2e-athlete@paddlio.de').id;
  for (const title of ['GA1 Grundlagenfahrt', 'K1 Technik', 'Kraftausdauer Zirkel', 'Wettkampfsimulation']) {
    const found = checked(await client.from('training_templates').select('id').eq('owner_id',coach).eq('title',title), 'Find test template');
    if (!found.length) checked(await client.from('training_templates').insert({ owner_id: coach, created_by: coach, club_id: club.id, title, category: 'Technik', training_area: 'Wasser', training_type: 'Technik', boat_class: 'K1', default_duration_minutes: 60, default_intensity: 'locker', tags: ['release-e2e'], visibility: 'club', description: 'Dedicated DEV release fixture' }), 'Create test template');
  }
  const groups = checked(await client.from('training_groups').select('id').eq('club_id', club.id).eq('name', 'Release E2E Gruppe'), 'Find group');
  if (groups.length > 1) throw new Error('Ambiguous test group');
  const group = groups[0] || checked(await client.from('training_groups').insert({ club_id: club.id, coach_id: coach, name: 'Release E2E Gruppe', status: 'active' }).select('id').single(), 'Create test group');
  const members = checked(await client.from('group_members').select('id').eq('group_id', group.id).eq('athlete_id', athlete), 'Find athlete membership');
  if (!members.length) checked(await client.from('group_members').insert({ group_id: group.id, athlete_id: athlete, user_id: athlete, role: 'Athlete' }), 'Add test athlete');
  checked(await client.from('group_memberships').upsert([{ group_id: group.id, user_id: coach, role: 'Coach' }, { group_id: group.id, user_id: athlete, role: 'Athlete' }], { onConflict: 'group_id,user_id' }), 'Test group memberships');
  const monday = new Date();
  monday.setDate(monday.getDate() - (monday.getDay() + 6) % 7);
  for (let day = 0; day < 7; day++) {
    const date = new Date(monday);
    date.setDate(date.getDate() + day);
    const dateKey = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
    const title = `Release E2E Technik ${day+1}`;
    const found = checked(await client.from('training_plan_items').select('id').eq('owner_id', coach).eq('title',title).eq('date',dateKey), 'Find test training');
    if (!found.length) checked(await client.from('training_plan_items').insert({ owner_id: coach, coach_id: coach, club_id: club.id, assigned_athlete_id: athlete, assigned_group_id: group.id, title, date: dateKey, start_time: '17:00', end_time: '18:00', duration_minutes: 60, area: 'Wasser', training_type: 'Technik', status: 'planned', notes: 'Dedicated DEV release fixture' }), 'Create test training');
  }
  console.log('Dedicated DEV group and current-week training fixtures ready.');
} catch (error) {
  // Never print raw Supabase responses, request headers, sessions or credential values.
  console.error(error.message);
  process.exitCode = 1;
}
