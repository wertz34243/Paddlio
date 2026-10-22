import { readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
const env={...parseEnv(readFileSync('.env.local','utf8')),...parseEnv(readFileSync('.env.e2e.local','utf8'))};
const url='https://nlllqsfdhfiwticrcrnp.supabase.co';
if(env.VITE_SUPABASE_URL!==url) throw new Error('Exact DEV URL required');
const clients=[];
const id=randomUUID();
const forgedId=randomUUID();
let owner;
let ownerId;
const check=(result,label)=>{if(result.error) throw new Error(label+' failed ('+result.error.code+')'); return result.data;};
try {
 for(const role of ['ATHLETE','COACH']) {
  const client=createClient(url,env.VITE_SUPABASE_ANON_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
  const login=await client.auth.signInWithPassword({email:env['PADDLIO_E2E_'+role+'_EMAIL'],password:env['PADDLIO_E2E_'+role+'_PASSWORD']});
  if(login.error) throw new Error(role+' DEV login failed');
  clients.push(client);
  if(role==='ATHLETE') {owner=client;ownerId=login.data.user.id;}
 }
 const other=clients[1];
 check(await owner.from('external_connections').insert({id,owner_id:ownerId,user_id:ownerId,provider:'release-rls-test',display_name:'Temporary RLS fixture'}),'Owner insert');
 for(const [label,query] of [
  ['foreign read',other.from('external_connections').select('id').eq('id',id)],
  ['foreign update',other.from('external_connections').update({display_name:'Forbidden'}).eq('id',id).select('id')],
  ['foreign delete',other.from('external_connections').delete().eq('id',id).select('id')]
 ]) {
  const rows=check(await query,label);
  if(rows.length!==0) throw new Error(label+' was permitted');
 }
 if(check(await owner.from('external_connections').select('id,display_name').eq('id',id),'Owner read')[0]?.display_name!=='Temporary RLS fixture') throw new Error('Foreign mutation changed owner data');
 const stolen=await other.from('external_connections').insert({id:forgedId,owner_id:ownerId,user_id:ownerId,provider:'release-rls-test'});
 if(!stolen.error || stolen.error.code!=='42501') throw new Error('Foreign owner insertion was not rejected by permissions');
 const mismatch=await owner.from('external_connections').update({user_id:randomUUID()}).eq('id',id);
 if(!mismatch.error || mismatch.error.code!=='42501') throw new Error('Identity mutation was not rejected');
 console.log('DEV REST isolation passed: owner access, foreign read/update/delete/insert denied, identity mutation denied.');
} catch(error) {
 console.error(error.message);
 process.exitCode=1;
} finally {
 if(owner && ownerId) {
  const cleanup=await owner.from('external_connections').delete().in('id',[id,forgedId]).eq('owner_id',ownerId).select('id');
  if(cleanup.error) {console.error('Temporary fixture cleanup failed; inspect release-rls-test rows.');process.exitCode=1;}
  else console.log('Temporary DEV REST fixture removed.');
 }
 for(const client of clients) await client.auth.signOut({scope:'local'});
}
