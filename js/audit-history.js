import {all,get,put,uid} from './storage.js';

const TRACKED=[
  ['title','Title'],['project','Project'],['discipline','Discipline'],['type','Experiment type'],
  ['objective','Objective / hypothesis'],['materials','Materials / samples'],['procedure','Procedure / conditions'],
  ['observation','Observation'],['interpretation','Interpretation'],['nextStep','Next step']
];
const editBaselines=new Map();
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=v=>v?new Date(v).toLocaleString(undefined,{year:'numeric',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}):'—';
const actor=()=>window.NOORCloudUser?{
  id:window.NOORCloudUser.id||null,
  email:window.NOORCloudUser.email||'',
  name:window.NOORCloudUser.user_metadata?.display_name||window.NOORCloudUser.email||'Signed-in user'
}:{id:null,email:'',name:'Local user'};

function snapshot(exp){const out={};for(const [key] of TRACKED)out[key]=exp?.[key]??'';return out;}
function changedFields(before,after){if(!before)return TRACKED.map(([key])=>key);return TRACKED.filter(([key])=>String(before?.[key]??'')!==String(after?.[key]??'')).map(([key])=>key);}
async function revisionsFor(experimentId){return (await all('experimentRevisions')).filter(r=>r.experimentId===experimentId).sort((a,b)=>a.revision-b.revision);}
async function waitForSave(id,previousUpdatedAt){for(let i=0;i<40;i++){const row=await get('experiments',id);if(row&&row.updatedAt!==previousUpdatedAt)return row;await new Promise(r=>setTimeout(r,50));}return get('experiments',id);}
function preserveMetadata(before,after){
  if(!before)return after;
  const preserved={};
  for(const key of ['cloudId','workspaceId','cloudUpdatedAt','createdBy'])if(before[key]!==undefined)preserved[key]=before[key];
  return {...preserved,...after,createdBy:after.createdBy||before.createdBy};
}
async function recordRevision(id,before,rawAfter){
  if(!rawAfter)return;
  const after=preserveMetadata(before,rawAfter);
  const fields=changedFields(before,after);
  if(before&&fields.length===0){
    if(before.cloudId&&!rawAfter.cloudId)await put('experiments',after);
    return;
  }
  const existing=await revisionsFor(id);const revision=(existing.at(-1)?.revision||0)+1;const who=actor();const changedAt=after.updatedAt||new Date().toISOString();
  const rev={id:`rev_${id}_${revision}`,experimentId:id,revision,changedAt,changedBy:who,changedFields:fields,changeSummary:before?'Experiment updated':'Experiment created',snapshot:snapshot(after),pendingCloud:true};
  await put('experimentRevisions',rev);
  await put('auditEvents',{id:uid('aud'),entityType:'experiment',entityId:id,action:before?'update':'create',changedFields:fields,createdAt:changedAt,actor:who,pendingCloud:true});
  await put('experiments',{...after,revision,lastModifiedBy:who,createdBy:after.createdBy||who});
  editBaselines.delete(id);
  window.dispatchEvent(new CustomEvent('noor:experiment-revision',{detail:{experimentId:id,revision}}));setTimeout(augmentCards,60);
}

async function seedExistingHistory(){
  const experiments=await all('experiments');const revisions=await all('experimentRevisions');const existingIds=new Set(revisions.map(r=>r.experimentId));
  for(const exp of experiments){if(existingIds.has(exp.id))continue;const who=exp.createdBy||{id:null,email:'',name:'Local record'};const changedAt=exp.createdAt||exp.updatedAt||new Date().toISOString();await put('experimentRevisions',{id:`rev_${exp.id}_1`,experimentId:exp.id,revision:1,changedAt,changedBy:who,changedFields:TRACKED.map(([key])=>key),changeSummary:'Baseline record',snapshot:snapshot(exp),pendingCloud:true});if(exp.revision!==1)await put('experiments',{...exp,revision:1,createdBy:exp.createdBy||who,lastModifiedBy:exp.lastModifiedBy||who});}
}

function ensureStyles(){if(document.querySelector('#noorAuditStyles'))return;const s=document.createElement('style');s.id='noorAuditStyles';s.textContent=`
.noor-audit-meta{display:flex;flex-wrap:wrap;gap:8px;margin-top:7px;font-size:9px;color:var(--muted)}.noor-audit-meta span{background:#f4f6f7;border-radius:999px;padding:4px 7px}
#noorHistoryDialog{width:min(760px,calc(100vw - 28px));max-height:86vh;border:0;border-radius:18px;padding:0;box-shadow:0 25px 80px #11223555}#noorHistoryDialog::backdrop{background:#18273780}
.history-wrap{padding:22px}.history-list{display:grid;gap:10px;margin-top:15px}.history-item{border:1px solid var(--line);border-radius:13px;padding:13px;background:#fff}.history-item header{display:flex;justify-content:space-between;gap:10px;align-items:start}.history-item h4{margin:0;font:18px Georgia,serif}.history-item small{color:var(--muted);font-size:9px}
.history-changes{margin-top:10px;display:grid;gap:7px}.history-change{background:#f7f8f8;border-radius:9px;padding:9px}.history-change b{display:block;font-size:9px;margin-bottom:5px}.history-change del,.history-change ins{display:block;white-space:pre-wrap;overflow-wrap:anywhere;font-size:9px;line-height:1.5;text-decoration:none}.history-change del{color:#8a4c4c}.history-change ins{color:#285f45;margin-top:3px}`;document.head.appendChild(s);}
function ensureDialog(){if(document.querySelector('#noorHistoryDialog'))return;const d=document.createElement('dialog');d.id='noorHistoryDialog';d.innerHTML='<div class="history-wrap"><div class="dialog-head"><div><span class="kicker">AUDIT TRAIL</span><h2 id="historyTitle">Version history</h2></div><button type="button" class="icon-button" id="closeHistory">×</button></div><div id="historyList" class="history-list"></div></div>';document.body.appendChild(d);document.querySelector('#closeHistory').onclick=()=>d.close();}
async function openHistory(id){ensureDialog();const exp=await get('experiments',id);const revs=await revisionsFor(id);document.querySelector('#historyTitle').textContent=`${exp?.title||'Experiment'} · history`;const list=document.querySelector('#historyList');list.innerHTML=revs.length?revs.slice().reverse().map(r=>{const pos=revs.findIndex(x=>x.id===r.id);const prev=pos>0?revs[pos-1]:null;const fields=(r.changedFields||[]).map(key=>{const label=TRACKED.find(x=>x[0]===key)?.[1]||key;const oldVal=prev?.snapshot?.[key]??'';const newVal=r.snapshot?.[key]??'';return `<div class="history-change"><b>${esc(label)}</b>${prev?`<del>Before: ${esc(oldVal||'—')}</del>`:''}<ins>After: ${esc(newVal||'—')}</ins></div>`;}).join('');const who=r.changedBy?.name||r.changedBy?.email||'Local user';return `<article class="history-item"><header><div><h4>Revision ${r.revision}</h4><small>${esc(r.changeSummary||'Saved change')} · ${esc(who)}</small></div><small>${fmt(r.changedAt)}</small></header>${fields?`<details><summary>${r.changedFields.length} changed field${r.changedFields.length===1?'':'s'}</summary><div class="history-changes">${fields}</div></details>`:'<small>No tracked field changes.</small>'}</article>`;}).join(''):'<div class="empty-state">No revision history yet.</div>';document.querySelector('#noorHistoryDialog').showModal();}

async function augmentCards(){const cards=[...document.querySelectorAll('#experimentList .record-card')];for(const card of cards){const edit=card.querySelector('[data-edit-exp]');if(!edit)continue;const id=edit.dataset.editExp;if(card.dataset.auditReady==='1')continue;const exp=await get('experiments',id);if(!exp)continue;const revs=await revisionsFor(id);const revision=exp.revision||revs.at(-1)?.revision||1;const meta=document.createElement('div');meta.className='noor-audit-meta';meta.innerHTML=`<span>Created ${fmt(exp.createdAt)}</span><span>Modified ${fmt(exp.updatedAt)}</span><span>Revision ${revision}</span>${exp.lastModifiedBy?.name?`<span>By ${esc(exp.lastModifiedBy.name)}</span>`:''}`;card.querySelector('.record-top > div')?.appendChild(meta);const actions=card.querySelector('.record-actions');if(actions&&!actions.querySelector('[data-history-exp]')){const b=document.createElement('button');b.type='button';b.dataset.historyExp=id;b.textContent='History';b.onclick=()=>openHistory(id);actions.insertBefore(b,actions.firstChild);}card.dataset.auditReady='1';}}

function wireExperimentCapture(){
  document.addEventListener('click',ev=>{const edit=ev.target.closest?.('[data-edit-exp]');if(!edit)return;const id=edit.dataset.editExp;get('experiments',id).then(row=>{if(row)editBaselines.set(id,structuredClone(row));});},true);
  document.addEventListener('submit',ev=>{if(ev.target?.id!=='experimentForm')return;const idInput=document.querySelector('#expId');const isNew=!idInput.value;if(isNew)idInput.value=uid('exp');const id=idInput.value;(async()=>{const before=isNew?null:(editBaselines.get(id)||await get('experiments',id));const previousUpdatedAt=before?.updatedAt;const after=await waitForSave(id,previousUpdatedAt);await recordRevision(id,before,after);})().catch(err=>console.error('NOOR revision history:',err));},true);
}
function wire(){ensureStyles();ensureDialog();wireExperimentCapture();seedExistingHistory().then(()=>setTimeout(augmentCards,120));const list=document.querySelector('#experimentList');if(list)new MutationObserver(()=>setTimeout(augmentCards,20)).observe(list,{childList:true});window.addEventListener('noor:cloud-pull',()=>setTimeout(augmentCards,80));}
if(typeof document!=='undefined'){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(wire,220));else setTimeout(wire,220);}
