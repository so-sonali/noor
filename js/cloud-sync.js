import {all,get,put,remove,uid} from './storage.js';

const SUPABASE_URL='https://swreuprsggqdmcjawtrw.supabase.co';
const SUPABASE_KEY='sb_publishable_hsf0ftgRAEFP7DeLyvtJ-Q_oDgqDifK';
const GENERIC_STORES=['protocols','syntheses','discussions','plates','calculations','tasks','timers','samples','instruments','literature','decisions','analyses','handwriting','settings'];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const newer=(a,b)=>new Date(a||0).getTime()>new Date(b||0).getTime();
const cleanJSON=value=>JSON.parse(JSON.stringify(value,(k,v)=>v instanceof Blob?undefined:v));
const safeName=v=>String(v||'file').replace(/[^A-Za-z0-9._-]+/g,'_').slice(-120)||'file';

let sb=null,user=null,workspaces=[],activeWorkspace=null,channel=null,syncing=false,syncTimer=null;

function setMessage(text,isError=false){
  const el=document.querySelector('#noorCloudMessage');if(el){el.textContent=text||'';el.classList.toggle('error',Boolean(isError));}
}
function setSyncState(text){
  const el=document.querySelector('#noorSyncState');if(el)el.textContent=text;
  const offline=document.querySelector('#offlineText');if(offline)offline.textContent=user?text:'Local-first workspace';
}
function toast(text){
  const t=document.querySelector('#toast');if(t){t.textContent=text;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2400);}
}
function ensureStyles(){
  if(document.querySelector('#noorCloudStyles'))return;
  const s=document.createElement('style');s.id='noorCloudStyles';
  s.textContent=`
  #noorAccountBtn{margin-right:8px}.cloud-dot{width:7px;height:7px;border-radius:50%;display:inline-block;background:#93a0aa;margin-right:5px}.cloud-dot.on{background:#2d8d62}
  #noorAccountDialog{width:min(680px,calc(100vw - 24px));max-height:88vh;border:0;border-radius:18px;padding:0;box-shadow:0 25px 90px #10223455}#noorAccountDialog::backdrop{background:#18273780}
  .cloud-wrap{padding:22px}.cloud-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.cloud-panel{border:1px solid var(--line);border-radius:14px;padding:14px;background:#fff}.cloud-panel h3{margin:0 0 7px;font:18px Georgia,serif}.cloud-panel p{font-size:9px;line-height:1.5;color:var(--muted)}
  .cloud-form{display:grid;gap:9px}.cloud-form label{font-size:9px;font-weight:700}.cloud-form input,.cloud-form select{width:100%;box-sizing:border-box;margin-top:4px;border:1px solid var(--line);border-radius:9px;padding:10px;background:#fff}.cloud-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}.cloud-user{background:#f4f7f8;border-radius:11px;padding:11px;margin:10px 0;font-size:10px}.cloud-status{font-size:9px;color:var(--muted);margin:8px 0}.cloud-message{min-height:16px;font-size:9px;color:#2b684d}.cloud-message.error{color:#9b3f3f}.cloud-note{margin-top:12px;border-radius:11px;padding:11px;background:#f5f8fb;font-size:9px;line-height:1.55;color:#54606d}.share-panel{margin-top:12px;border-top:1px solid var(--line);padding-top:12px}.share-panel.hidden{display:none}
  .record-actions [data-share-exp]{white-space:nowrap}@media(max-width:700px){.cloud-grid{grid-template-columns:1fr}#noorAccountBtn{font-size:0;padding:9px 10px}#noorAccountBtn .cloud-dot{margin:0}}
  `;document.head.appendChild(s);
}
function ensureUI(){
  if(document.querySelector('#noorAccountBtn'))return;
  const topbar=document.querySelector('.topbar');const newExp=document.querySelector('#newExperiment');
  if(topbar&&newExp){const b=document.createElement('button');b.id='noorAccountBtn';b.type='button';b.className='secondary-button';b.innerHTML='<span class="cloud-dot"></span><span class="account-label">Account</span>';topbar.insertBefore(b,newExp);b.onclick=()=>openAccount();}
  const d=document.createElement('dialog');d.id='noorAccountDialog';d.innerHTML=`
    <div class="cloud-wrap"><div class="dialog-head"><div><span class="kicker">NOOR CLOUD</span><h2>Account & collaboration</h2></div><button type="button" class="icon-button" id="closeCloud">×</button></div>
    <div id="cloudSignedOut" class="cloud-grid">
      <section class="cloud-panel"><h3>Sign in</h3><p>Your browser remains the offline copy; signing in adds encrypted transport, cloud persistence and collaboration.</p><form id="cloudSignIn" class="cloud-form"><label>Email<input id="cloudEmail" type="email" autocomplete="email" required></label><label>Password<input id="cloudPassword" type="password" autocomplete="current-password" required></label><button class="primary">Sign in</button></form></section>
      <section class="cloud-panel"><h3>Create account</h3><p>Use your own email. Passwords are handled by Supabase Auth and are never stored in NOOR's IndexedDB or GitHub source.</p><form id="cloudSignUp" class="cloud-form"><label>Name<input id="cloudName" autocomplete="name"></label><label>Email<input id="cloudNewEmail" type="email" autocomplete="email" required></label><label>Password<input id="cloudNewPassword" type="password" minlength="8" autocomplete="new-password" required></label><button class="primary">Create account</button></form></section>
    </div>
    <div id="cloudSignedIn" hidden>
      <div class="cloud-user"><b id="cloudUserName"></b><br><span id="cloudUserEmail"></span></div>
      <div class="cloud-grid">
        <section class="cloud-panel"><h3>Cloud workspace</h3><label class="cloud-form">Current workspace<select id="noorWorkspaceSelect"></select></label><div class="cloud-actions"><button id="syncNow" class="primary" type="button">Sync now</button><button id="newWorkspace" class="secondary-button" type="button">+ Lab workspace</button></div><div class="cloud-status" id="noorSyncState">Ready to sync</div></section>
        <section class="cloud-panel"><h3>Invite lab member</h3><p>Workspace members can collaborate across the lab workspace. Use experiment sharing below when someone should see only one record.</p><form id="workspaceInviteForm" class="cloud-form"><label>Email<input id="workspaceInviteEmail" type="email" required></label><label>Role<select id="workspaceInviteRole"><option value="editor">Editor</option><option value="viewer">Viewer</option><option value="admin">Admin</option></select></label><button class="secondary-button">Create invite link</button></form></section>
      </div>
      <section id="noorSharePanel" class="cloud-panel share-panel hidden"><h3>Share one experiment</h3><p id="shareExperimentName"></p><form id="experimentInviteForm" class="cloud-form"><input id="shareExperimentId" type="hidden"><label>Email<input id="experimentInviteEmail" type="email" required></label><label>Permission<select id="experimentInvitePermission"><option value="editor">Can edit</option><option value="viewer">View only</option></select></label><button class="primary">Create experiment invite</button></form></section>
      <div class="cloud-actions"><button id="signOutCloud" class="secondary-button" type="button">Sign out</button></div>
      <div class="cloud-note"><b>Local-first stays on.</b> Closing a tab or restarting the browser does not erase IndexedDB. When signed in, NOOR also synchronizes the notebook to your account. Local JSON backup remains available as a separate safety layer.</div>
    </div>
    <div id="noorCloudMessage" class="cloud-message"></div></div>`;
  document.body.appendChild(d);
  document.querySelector('#closeCloud').onclick=()=>d.close();
  document.querySelector('#cloudSignIn').onsubmit=signIn;
  document.querySelector('#cloudSignUp').onsubmit=signUp;
  document.querySelector('#signOutCloud').onclick=signOut;
  document.querySelector('#syncNow').onclick=()=>syncNow();
  document.querySelector('#newWorkspace').onclick=createWorkspace;
  document.querySelector('#workspaceInviteForm').onsubmit=createWorkspaceInvite;
  document.querySelector('#experimentInviteForm').onsubmit=createExperimentInvite;
  document.querySelector('#noorWorkspaceSelect').onchange=async e=>{localStorage.setItem('noor.activeWorkspace',e.target.value);activeWorkspace=workspaces.find(w=>w.id===e.target.value)||null;await subscribeRealtime();await syncNow();};
}
function openAccount(){ensureUI();document.querySelector('#noorAccountDialog').showModal();renderAuthState();}
function renderAuthState(){
  if(!document.querySelector('#noorAccountDialog'))return;
  document.querySelector('#cloudSignedOut').hidden=Boolean(user);document.querySelector('#cloudSignedIn').hidden=!user;
  const dot=document.querySelector('#noorAccountBtn .cloud-dot');dot?.classList.toggle('on',Boolean(user));
  const label=document.querySelector('#noorAccountBtn .account-label');if(label)label.textContent=user?(user.user_metadata?.display_name||'Synced'):'Account';
  if(user){document.querySelector('#cloudUserName').textContent=user.user_metadata?.display_name||user.email?.split('@')[0]||'NOOR user';document.querySelector('#cloudUserEmail').textContent=user.email||'';}
}
async function loadClient(){
  if(sb)return sb;
  const {createClient}=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
  sb=createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  return sb;
}
async function signIn(ev){
  ev.preventDefault();setMessage('Signing in…');
  const {error}=await sb.auth.signInWithPassword({email:document.querySelector('#cloudEmail').value.trim(),password:document.querySelector('#cloudPassword').value});
  if(error)return setMessage(error.message,true);setMessage('Signed in. Syncing notebook…');
}
async function signUp(ev){
  ev.preventDefault();setMessage('Creating account…');const name=document.querySelector('#cloudName').value.trim();
  const {data,error}=await sb.auth.signUp({email:document.querySelector('#cloudNewEmail').value.trim(),password:document.querySelector('#cloudNewPassword').value,options:{data:{display_name:name},emailRedirectTo:location.origin+location.pathname}});
  if(error)return setMessage(error.message,true);
  if(!data.session)setMessage('Account created. Check your email to confirm it, then sign in.');else setMessage('Account created. Syncing notebook…');
}
async function signOut(){await sb.auth.signOut();user=null;window.NOORCloudUser=null;activeWorkspace=null;workspaces=[];if(channel){await sb.removeChannel(channel);channel=null;}renderAuthState();setSyncState('Local-first workspace');setMessage('Signed out. Local notebook remains on this device.');}

async function loadWorkspaces(){
  if(!user)return;
  const {data,error}=await sb.from('workspace_members').select('workspace_id,role,workspaces(id,name,owner_id)').order('joined_at',{ascending:true});
  if(error)throw error;
  workspaces=(data||[]).map(x=>({id:x.workspace_id,role:x.role,name:x.workspaces?.name||'Workspace',ownerId:x.workspaces?.owner_id}));
  if(!workspaces.length){
    const {data:w,error:we}=await sb.from('workspaces').insert({name:'My NOOR',owner_id:user.id}).select('id,name,owner_id').single();if(we)throw we;
    const {error:me}=await sb.from('workspace_members').insert({workspace_id:w.id,user_id:user.id,role:'owner'});if(me)throw me;
    workspaces=[{id:w.id,name:w.name,ownerId:w.owner_id,role:'owner'}];
  }
  const remembered=localStorage.getItem('noor.activeWorkspace');activeWorkspace=workspaces.find(w=>w.id===remembered)||workspaces[0];localStorage.setItem('noor.activeWorkspace',activeWorkspace.id);
  const sel=document.querySelector('#noorWorkspaceSelect');if(sel){sel.innerHTML=workspaces.map(w=>`<option value="${w.id}" ${w.id===activeWorkspace.id?'selected':''}>${esc(w.name)} · ${esc(w.role)}</option>`).join('');}
}
async function createWorkspace(){
  const name=prompt('Lab workspace name');if(!name?.trim())return;
  const {data:w,error}=await sb.from('workspaces').insert({name:name.trim(),owner_id:user.id}).select('id,name,owner_id').single();if(error)return setMessage(error.message,true);
  const {error:me}=await sb.from('workspace_members').insert({workspace_id:w.id,user_id:user.id,role:'owner'});if(me)return setMessage(me.message,true);
  await loadWorkspaces();activeWorkspace=workspaces.find(x=>x.id===w.id);localStorage.setItem('noor.activeWorkspace',w.id);await subscribeRealtime();setMessage(`Created ${name.trim()}.`);await syncNow();
}
async function copyInvite(kind,token){
  const url=new URL(location.href);url.search='';url.hash='';url.searchParams.set(kind,token);
  try{await navigator.clipboard.writeText(url.toString());setMessage('Invite link copied to clipboard.');}catch{setMessage(`Invite link: ${url}`);}
}
async function createWorkspaceInvite(ev){
  ev.preventDefault();if(!activeWorkspace)return setMessage('Choose a workspace first.',true);
  const email=document.querySelector('#workspaceInviteEmail').value.trim().toLowerCase(),role=document.querySelector('#workspaceInviteRole').value;
  const {data,error}=await sb.from('workspace_invites').upsert({workspace_id:activeWorkspace.id,email,role,invited_by:user.id,accepted_at:null},{onConflict:'workspace_id,email'}).select('token').single();
  if(error)return setMessage(error.message,true);await copyInvite('workspaceInvite',data.token);ev.target.reset();
}
async function createExperimentInvite(ev){
  ev.preventDefault();const localId=document.querySelector('#shareExperimentId').value;let exp=await get('experiments',localId);if(!exp)return setMessage('Experiment not found.',true);
  if(!exp.cloudId){await syncNow({silent:true});exp=await get('experiments',localId);}if(!exp?.cloudId)return setMessage('Sync this experiment before sharing it.',true);
  const email=document.querySelector('#experimentInviteEmail').value.trim().toLowerCase(),permission=document.querySelector('#experimentInvitePermission').value;
  const {data,error}=await sb.from('experiment_invites').upsert({experiment_id:exp.cloudId,email,permission,invited_by:user.id,accepted_at:null},{onConflict:'experiment_id,email'}).select('token').single();
  if(error)return setMessage(error.message,true);await copyInvite('experimentInvite',data.token);ev.target.reset();
}
async function acceptInviteParams(){
  if(!user)return;const url=new URL(location.href);let accepted=false;
  const workspaceToken=url.searchParams.get('workspaceInvite');if(workspaceToken){const {error}=await sb.rpc('accept_workspace_invite',{invite_token:workspaceToken});if(error)setMessage(error.message,true);else{url.searchParams.delete('workspaceInvite');accepted=true;setMessage('Lab workspace invite accepted.');}}
  const experimentToken=url.searchParams.get('experimentInvite');if(experimentToken){const {error}=await sb.rpc('accept_experiment_invite',{invite_token:experimentToken});if(error)setMessage(error.message,true);else{url.searchParams.delete('experimentInvite');accepted=true;setMessage('Experiment invite accepted.');}}
  if(accepted)history.replaceState({},'',url.toString());
}

function cloudExperimentPayload(exp,workspaceId,projectId=null){return{
  workspace_id:workspaceId,project_id:projectId,title:exp.title||'Untitled experiment',discipline:exp.discipline||null,experiment_type:exp.type||null,
  objective:exp.objective||null,materials:exp.materials||null,procedure:exp.procedure||null,observation:exp.observation||null,interpretation:exp.interpretation||null,next_step:exp.nextStep||null,status:exp.status||null,revision:Number(exp.revision||1),updated_by:user.id
};}
function localExperimentFromCloud(row){return{
  id:row.local_id||`cloud_${row.id}`,cloudId:row.id,workspaceId:row.workspace_id,cloudUpdatedAt:row.updated_at,
  title:row.title||'',project:row.projects?.name||'',discipline:row.discipline||'Biochemistry',type:row.experiment_type||'',objective:row.objective||'',materials:row.materials||'',procedure:row.procedure||'',observation:row.observation||'',interpretation:row.interpretation||'',nextStep:row.next_step||'',status:row.status||'',revision:row.revision||1,
  createdAt:row.created_at,updatedAt:row.updated_at,createdBy:{id:row.created_by,name:'Cloud user'},lastModifiedBy:{id:row.updated_by,name:'Cloud user'}
};}
async function syncProjects(workspaceId){
  const locals=(await all('projects')).filter(p=>!p.workspaceId||p.workspaceId===workspaceId);
  const {data:cloud,error}=await sb.from('projects').select('id,local_id,name,updated_at').eq('workspace_id',workspaceId);if(error)throw error;
  const map=new Map((cloud||[]).map(x=>[x.local_id,x]));
  for(const p of locals){
    let row=map.get(p.id);const payload={name:p.name||p.title||'Untitled project',description:p.description||'',status:p.status||'',blocker:p.blocker||p.blockers||''};
    if(row){const {data,error:e}=await sb.from('projects').update(payload).eq('id',row.id).select('id,local_id,name,updated_at').single();if(e)throw e;row=data;}
    else{const {data,error:e}=await sb.from('projects').insert({...payload,workspace_id:workspaceId,local_id:p.id,created_by:user.id}).select('id,local_id,name,updated_at').single();if(e)throw e;row=data;map.set(p.id,row);}
    if(p.workspaceId!==workspaceId||p.cloudId!==row.id||p.cloudUpdatedAt!==row.updated_at)await put('projects',{...p,workspaceId,cloudId:row.id,cloudUpdatedAt:row.updated_at});
  }
  return map;
}
async function syncExperiments(workspaceId,projectMap){
  const locals=await all('experiments');const localRevs=await all('experimentRevisions');
  const {data:accessible,error}=await sb.from('experiments').select('id,local_id,workspace_id,project_id,updated_at,revision,created_by,updated_by,title,discipline,experiment_type,objective,materials,procedure,observation,interpretation,next_step,status,created_at,projects(name)');if(error)throw error;
  const byCloud=new Map((accessible||[]).map(x=>[x.id,x])),byLocal=new Map((accessible||[]).map(x=>[x.local_id,x]));
  for(let exp of locals){
    let row=exp.cloudId?byCloud.get(exp.cloudId):byLocal.get(exp.id);
    const targetWorkspace=row?.workspace_id||exp.workspaceId||workspaceId;
    if(!row&&exp.workspaceId&&exp.workspaceId!==workspaceId)continue;
    let projectId=null;if(targetWorkspace===workspaceId&&exp.project){const localProjects=await all('projects');const lp=localProjects.find(p=>(p.name||p.title)===exp.project&&p.workspaceId===workspaceId);if(lp)projectId=projectMap.get(lp.id)?.id||lp.cloudId||null;}
    if(row){
      const lastSeen=exp.cloudUpdatedAt;const cloudChanged=lastSeen&&newer(row.updated_at,lastSeen);const localChanged=lastSeen&&newer(exp.updatedAt,lastSeen);
      if(cloudChanged&&localChanged){
        await put('auditEvents',{id:uid('aud'),entityType:'experiment',entityId:exp.id,action:'sync-conflict',changedFields:[],createdAt:new Date().toISOString(),actor:{id:user.id,email:user.email,name:user.email},metadata:{cloudUpdatedAt:row.updated_at,localUpdatedAt:exp.updatedAt}});continue;
      }
      if(!cloudChanged&&(!lastSeen||localChanged||newer(exp.updatedAt,row.updated_at))){
        const {data,error:e}=await sb.from('experiments').update(cloudExperimentPayload(exp,targetWorkspace,projectId||row.project_id)).eq('id',row.id).select('id,local_id,workspace_id,updated_at,revision').single();if(e)throw e;row={...row,...data};
      }
    }else{
      const {data,error:e}=await sb.from('experiments').insert({...cloudExperimentPayload(exp,targetWorkspace,projectId),local_id:exp.id,created_by:user.id}).select('id,local_id,workspace_id,updated_at,revision').single();if(e)throw e;row=data;byLocal.set(exp.id,row);byCloud.set(row.id,row);
    }
    exp={...exp,cloudId:row.id,workspaceId:row.workspace_id,cloudUpdatedAt:row.updated_at};await put('experiments',exp);
    const {data:remoteRevs,error:re}=await sb.from('experiment_revisions').select('revision').eq('experiment_id',row.id);if(re)throw re;const remoteNumbers=new Set((remoteRevs||[]).map(r=>r.revision));
    for(const rev of localRevs.filter(r=>r.experimentId===exp.id&&!remoteNumbers.has(r.revision))){
      const {error:ie}=await sb.from('experiment_revisions').insert({experiment_id:row.id,revision:rev.revision,changed_by:user.id,changed_at:rev.changedAt,change_summary:rev.changeSummary,snapshot:rev.snapshot});if(ie&&ie.code!=='23505')throw ie;await put('experimentRevisions',{...rev,pendingCloud:false,cloudExperimentId:row.id});
    }
  }
}
async function pushGeneric(workspaceId){
  const experiments=await all('experiments');const expMap=new Map(experiments.filter(e=>e.cloudId).map(e=>[e.id,e.cloudId]));
  const {data:cloud,error}=await sb.from('notebook_records').select('id,store,local_id,workspace_id,updated_at,data,experiment_id');if(error)throw error;
  const map=new Map((cloud||[]).map(x=>[`${x.store}:${x.local_id}`,x]));
  for(const store of GENERIC_STORES){
    for(let rec of await all(store)){
      const existing=map.get(`${store}:${rec.id}`);const targetWorkspace=existing?.workspace_id||rec.workspaceId||workspaceId;if(!existing&&rec.workspaceId&&rec.workspaceId!==workspaceId)continue;
      const data=cleanJSON({...rec,workspaceId:targetWorkspace});const experimentId=rec.experimentId?expMap.get(rec.experimentId)||null:null;
      if(existing){
        const localTime=rec.updatedAt||rec.createdAt||0;if(rec.cloudUpdatedAt&&newer(existing.updated_at,rec.cloudUpdatedAt)&&newer(localTime,rec.cloudUpdatedAt))continue;
        if(!rec.cloudUpdatedAt||newer(localTime,existing.updated_at)){const {data:r,error:e}=await sb.from('notebook_records').update({data,experiment_id:experimentId,updated_by:user.id}).eq('id',existing.id).select('id,updated_at').single();if(e)throw e;await put(store,{...rec,workspaceId:targetWorkspace,cloudRecordId:r.id,cloudUpdatedAt:r.updated_at});}
      }else{const {data:r,error:e}=await sb.from('notebook_records').insert({workspace_id:targetWorkspace,store,local_id:rec.id,experiment_id:experimentId,data,created_by:user.id,updated_by:user.id}).select('id,updated_at').single();if(e)throw e;await put(store,{...rec,workspaceId:targetWorkspace,cloudRecordId:r.id,cloudUpdatedAt:r.updated_at});}
    }
  }
}
async function pushAttachments(workspaceId){
  const experiments=await all('experiments');const expMap=new Map(experiments.filter(e=>e.cloudId).map(e=>[e.id,e.cloudId]));
  const {data:remote,error}=await sb.from('cloud_files').select('id,workspace_id,attachment_local_id,storage_path,updated_at,size_bytes');if(error)throw error;const map=new Map((remote||[]).map(x=>[x.attachment_local_id,x]));
  for(let a of await all('attachments')){
    if(!(a.blob instanceof Blob))continue;const existing=map.get(a.id);const targetWorkspace=existing?.workspace_id||a.workspaceId||workspaceId;if(!existing&&a.workspaceId&&a.workspaceId!==workspaceId)continue;
    const experimentId=a.experimentId?expMap.get(a.experimentId)||null:null;const path=existing?.storage_path||`${targetWorkspace}/${a.id}/${safeName(a.name||a.filename||'attachment')}`;
    const metadata=cleanJSON({...a,blob:undefined,workspaceId:targetWorkspace});
    let fileRow=existing;
    if(!existing){const {data:r,error:e}=await sb.from('cloud_files').insert({workspace_id:targetWorkspace,attachment_local_id:a.id,experiment_id:experimentId,storage_path:path,name:a.name||a.filename||'attachment',mime_type:a.blob.type||a.mime||null,size_bytes:a.blob.size,metadata,created_by:user.id,updated_by:user.id}).select('id,storage_path,updated_at').single();if(e)throw e;fileRow=r;}
    else{const {data:r,error:e}=await sb.from('cloud_files').update({experiment_id:experimentId,name:a.name||a.filename||'attachment',mime_type:a.blob.type||a.mime||null,size_bytes:a.blob.size,metadata,updated_by:user.id}).eq('id',existing.id).select('id,storage_path,updated_at').single();if(e)throw e;fileRow={...existing,...r};}
    if(!a.cloudUpdatedAt||newer(a.updatedAt||a.createdAt,fileRow.updated_at)||Number(existing?.size_bytes)!==a.blob.size){const {error:ue}=await sb.storage.from('noor-files').upload(path,a.blob,{upsert:true,contentType:a.blob.type||'application/octet-stream'});if(ue)throw ue;}
    await put('attachments',{...a,workspaceId:targetWorkspace,cloudFileId:fileRow.id,cloudStoragePath:path,cloudUpdatedAt:fileRow.updated_at});
  }
}
async function pullCloud(){
  let changed=0;
  const {data:cloudExp,error}=await sb.from('experiments').select('id,local_id,workspace_id,project_id,updated_at,revision,created_by,updated_by,title,discipline,experiment_type,objective,materials,procedure,observation,interpretation,next_step,status,created_at,projects(name)');if(error)throw error;
  for(const row of cloudExp||[]){const id=row.local_id||`cloud_${row.id}`,local=await get('experiments',id);if(!local||newer(row.updated_at,local.cloudUpdatedAt||local.updatedAt)){await put('experiments',{...(local||{}),...localExperimentFromCloud(row)});changed++;}}
  const expIdMap=new Map((cloudExp||[]).map(e=>[e.id,e.local_id||`cloud_${e.id}`]));
  const {data:revs,error:re}=await sb.from('experiment_revisions').select('id,experiment_id,revision,changed_by,changed_at,change_summary,snapshot');if(re)throw re;
  for(const r of revs||[]){const localExpId=expIdMap.get(r.experiment_id);if(!localExpId)continue;const id=`rev_${localExpId}_${r.revision}`;if(!await get('experimentRevisions',id))await put('experimentRevisions',{id,experimentId:localExpId,revision:r.revision,changedAt:r.changed_at,changedBy:{id:r.changed_by,name:'Cloud user'},changeSummary:r.change_summary,snapshot:r.snapshot,changedFields:Object.keys(r.snapshot||{}),pendingCloud:false,cloudId:r.id,cloudExperimentId:r.experiment_id});}
  const {data:records,error:nr}=await sb.from('notebook_records').select('id,workspace_id,store,local_id,experiment_id,data,updated_at');if(nr)throw nr;
  for(const r of records||[]){if(!GENERIC_STORES.includes(r.store))continue;const local=await get(r.store,r.local_id);if(!local||newer(r.updated_at,local.cloudUpdatedAt||local.updatedAt||local.createdAt)){await put(r.store,{...r.data,id:r.local_id,workspaceId:r.workspace_id,cloudRecordId:r.id,cloudUpdatedAt:r.updated_at});changed++;}}
  const {data:files,error:fe}=await sb.from('cloud_files').select('id,workspace_id,attachment_local_id,experiment_id,storage_path,name,mime_type,size_bytes,metadata,updated_at');if(fe)throw fe;
  for(const f of files||[]){const local=await get('attachments',f.attachment_local_id);if(local&&local.blob instanceof Blob&&!newer(f.updated_at,local.cloudUpdatedAt))continue;const {data:blob,error:de}=await sb.storage.from('noor-files').download(f.storage_path);if(de){console.warn('NOOR file download skipped',de.message);continue;}await put('attachments',{...f.metadata,id:f.attachment_local_id,name:f.name||f.metadata?.name,blob,workspaceId:f.workspace_id,cloudFileId:f.id,cloudStoragePath:f.storage_path,cloudUpdatedAt:f.updated_at});changed++;}
  if(changed)window.dispatchEvent(new CustomEvent('noor:cloud-pull',{detail:{changed}}));return changed;
}
async function pushAuditEvents(workspaceId){
  for(const event of (await all('auditEvents')).filter(e=>e.pendingCloud&&e.entityType==='experiment')){
    const {error}=await sb.from('audit_events').insert({workspace_id:workspaceId,actor_id:user.id,entity_type:event.entityType,entity_id:event.entityId,action:event.action,changed_fields:event.changedFields||[],metadata:event.metadata||{}});if(error){if(error.code==='42501')continue;throw error;}await put('auditEvents',{...event,pendingCloud:false});
  }
}
async function syncNow({silent=false}={}){
  if(!user||!sb||syncing)return;if(!navigator.onLine){setSyncState('Offline · changes saved locally');return;}
  syncing=true;try{
    if(!activeWorkspace)await loadWorkspaces();const ws=activeWorkspace?.id;if(!ws)throw new Error('No cloud workspace available.');setSyncState('Syncing…');
    const projectMap=await syncProjects(ws);await syncExperiments(ws,projectMap);await pushGeneric(ws);await pushAttachments(ws);await pushAuditEvents(ws);const pulled=await pullCloud();
    const now=new Date().toISOString();await put('settings',{id:'cloudSync',lastSyncAt:now,workspaceId:ws});setSyncState(`Synced ${new Date(now).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}`);if(!silent)toast('NOOR synced');
    if(pulled){sessionStorage.setItem('noor.cloudRefresh','1');setTimeout(()=>location.reload(),180);}
  }catch(err){console.error('NOOR cloud sync',err);setSyncState('Sync needs attention');setMessage(err.message||String(err),true);}finally{syncing=false;}
}
function scheduleSync(){clearTimeout(syncTimer);syncTimer=setTimeout(()=>syncNow({silent:true}),900);}
async function subscribeRealtime(){
  if(!sb||!user)return;if(channel){await sb.removeChannel(channel);channel=null;}
  channel=sb.channel(`noor-${user.id}`).on('postgres_changes',{event:'*',schema:'public',table:'experiments'},()=>scheduleSync()).on('postgres_changes',{event:'*',schema:'public',table:'experiment_revisions'},()=>scheduleSync()).on('postgres_changes',{event:'*',schema:'public',table:'notebook_records'},()=>scheduleSync()).subscribe();
}
async function augmentShareButtons(){
  if(!user)return;for(const card of document.querySelectorAll('#experimentList .record-card')){const edit=card.querySelector('[data-edit-exp]');const actions=card.querySelector('.record-actions');if(!edit||!actions||actions.querySelector('[data-share-exp]'))continue;const b=document.createElement('button');b.type='button';b.dataset.shareExp=edit.dataset.editExp;b.textContent='Share';b.onclick=async()=>{const exp=await get('experiments',b.dataset.shareExp);openAccount();document.querySelector('#noorSharePanel').classList.remove('hidden');document.querySelector('#shareExperimentId').value=exp.id;document.querySelector('#shareExperimentName').textContent=`Share only “${exp.title||'this experiment'}” without granting access to the whole workspace.`;};actions.insertBefore(b,actions.firstChild);}
}
async function onSignedIn(nextUser){
  user=nextUser;window.NOORCloudUser=user;renderAuthState();await acceptInviteParams();await loadWorkspaces();await subscribeRealtime();setMessage('Signed in. Local-first sync is active.');await syncNow({silent:true});setTimeout(augmentShareButtons,120);
}
async function wire(){
  ensureStyles();ensureUI();try{await loadClient();}catch(err){console.warn('NOOR cloud unavailable',err);setMessage('Cloud login could not load. Local notebook is still available.',true);return;}
  const {data:{session}}=await sb.auth.getSession();if(session?.user)await onSignedIn(session.user);else renderAuthState();
  sb.auth.onAuthStateChange((event,session)=>{setTimeout(async()=>{if(session?.user)await onSignedIn(session.user);else{user=null;window.NOORCloudUser=null;renderAuthState();}},0);});
  window.addEventListener('online',scheduleSync);window.addEventListener('noor:experiment-revision',scheduleSync);
  const list=document.querySelector('#experimentList');if(list)new MutationObserver(()=>setTimeout(augmentShareButtons,30)).observe(list,{childList:true});
  if(sessionStorage.getItem('noor.cloudRefresh'))sessionStorage.removeItem('noor.cloudRefresh');
}
if(typeof document!=='undefined'){
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(wire,300));else setTimeout(wire,300);
}
