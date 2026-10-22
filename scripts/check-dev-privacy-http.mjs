import { readFileSync, appendFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { parseEnv } from 'node:util';
import { createClient } from '@supabase/supabase-js';

const env = { ...parseEnv(readFileSync('.env.local','utf8')), ...parseEnv(readFileSync('.env.e2e.local','utf8')) };
const url = 'https://nlllqsfdhfiwticrcrnp.supabase.co';
if (env.VITE_SUPABASE_URL !== url) throw new Error('DEV only');
const client = createClient(url,env.VITE_SUPABASE_ANON_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
async function call(token, body) {
  const result = await fetch(`${url}/functions/v1/account-privacy`, {method:'POST',headers:{apikey:env.VITE_SUPABASE_ANON_KEY,Authorization:`Bearer ${token}`,Origin:'https://dev.paddlio.de','Content-Type':'application/json'},body:JSON.stringify(body)});
  return {status:result.status,body:await result.json()};
}
try {
  const {data,error}=await client.auth.signInWithPassword({email:env.PADDLIO_E2E_ATHLETE_EMAIL,password:env.PADDLIO_E2E_ATHLETE_PASSWORD});
  if(error) throw new Error(`DEV login failed (${error.status})`);
  const token=data.session.access_token;
  const exported=await call(token,{action:'export'});
  if(exported.status!==200) throw new Error(`Export HTTP ${exported.status}; code=${exported.body.error || 'unknown'}; table=${exported.body.diagnostic?.table || 'not reported'}`);
  if(exported.body.export.account.id!==data.user.id) throw new Error('Wrong export identity');
  const profiles=exported.body.export.datasets.profiles;
  if(profiles.length!==1 || profiles[0].id!==data.user.id) throw new Error('Export contains foreign profile');
  console.log(`DEV own-account export passed (${Object.keys(exported.body.export.datasets).length} datasets).`);
  const foreign=await call(token,{action:'delete',confirmation:'KONTO ENDGUELTIG LOESCHEN',confirmAccountId:'00000000-0000-4000-8000-000000000000'});
  if(foreign.status!==400) throw new Error('Foreign-account deletion was not rejected');
  console.log('Foreign-account deletion confirmation rejected.');
  const roleAttempt=await client.from('profiles').update({roles:['Admin'],primary_role:'Admin',status:'disabled'}).eq('id',data.user.id).select('roles,primary_role,status');
  if(roleAttempt.error) throw new Error(`Role regression request failed (${roleAttempt.error.code})`);
  if(roleAttempt.data.length!==1 || roleAttempt.data[0].roles.includes('Admin') || roleAttempt.data[0].primary_role==='Admin' || roleAttempt.data[0].status!=='active') throw new Error('Role escalation regression');
  console.log('Authenticated REST self-escalation rejected by canonical profile protection.');
  await client.auth.signOut();
  if(process.argv.includes('--delete-test')) {
    const local=parseEnv(readFileSync('.env.development.local','utf8'));
    const claims=JSON.parse(Buffer.from(local.SUPABASE_SERVICE_ROLE_KEY.split('.')[1],'base64url'));
    if(local.SUPABASE_URL!==url || claims.ref!=='nlllqsfdhfiwticrcrnp' || claims.role!=='service_role') throw new Error('DEV admin guard failed');
    const admin=createClient(url,local.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
    const email=`e2e-delete-${Date.now()}@paddlio.de`;
    const password=randomBytes(32).toString('base64url')+'!aA7';
    appendFileSync('.env.e2e.local',`\n# Disposable privacy test; retained locally for recovery if deletion fails.\nPADDLIO_E2E_DISPOSABLE_EMAIL=${email}\nPADDLIO_E2E_DISPOSABLE_PASSWORD=${password}\n`);
    const created=await admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{birthDate:'1990-01-01',paddlio_seed:'release-delete-test'}});
    if(created.error) throw new Error(`Disposable account creation failed (${created.error.status})`);
    const disposable=await client.auth.signInWithPassword({email,password});
    if(disposable.error) throw new Error('Disposable login failed');
    const id=created.data.user.id;
    const deletion=await call(disposable.data.session.access_token,{action:'delete',confirmation:'KONTO ENDGUELTIG LOESCHEN',confirmAccountId:id});
    if(deletion.status!==200 || deletion.body.deleted!==true) throw new Error(`Disposable deletion failed: HTTP ${deletion.status}`);
    const remaining=await admin.from('profiles').select('id').eq('id',id);
    const authRemaining=await admin.auth.admin.getUserById(id);
    if(remaining.error || remaining.data.length!==0 || !authRemaining.error || authRemaining.error.status!==404) throw new Error('Deletion not verified');
    const survivor=await admin.auth.admin.getUserById(data.user.id);
    if(survivor.error || survivor.data.user.id!==data.user.id) throw new Error('Unrelated test account missing');
    console.log('Disposable-account HTTP deletion passed: Auth and profile removed; unrelated Athlete retained.');
  }
} catch(error) { console.error(error.message); process.exitCode=1; }
