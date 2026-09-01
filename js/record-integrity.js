import {all,get,put,uid} from './storage.js';

const RECORDS={
  exp:{selector:'[data-del-exp]',attr:'data-del-exp',store:'experiments',entityType:'experiment'},
  protocol:{selector:'[data-del-protocol]',attr:'data-del-protocol',store:'protocols',entityType:'protocol'},
  synthesis:{selector:'[data-del-syn]',attr:'data-del-syn',store:'syntheses',entityType:'synthesis'},
  discussion:{selector:'[data-del-disc]',attr:'data-del-disc',store:'discussions',entityType:'discussion'}
};

const EXPERIMENT_FIELDS=['title','project','discipline','type','objective','materials','procedure','observation','interpretation','nextStep','status'];
const fmt=v=>v?new Date(v).toLocaleString(undefined,{year:'numeric',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}):'—';
const actor=()=>window.NOORCloudUser?{
  id:window.NOORCloudUser.id||null,
  email:window.NOORCloudUser.email||'',
  name:window.NOORCloudUser.user_metadata?.display_name||window.NOORCloudUser.email||'Signed-in user'
}:{id:null,email:'',name:'Local user'};

function greeting(){
  const h=new Date().getHours();
  return h<12?'Good morning':h<17?'Good afternoon':'Good evening';
}

function updateClockText(){
  const pageTitle=document.querySelector('#pageTitle');
  if(pageTitle)pageTitle.textContent=greeting();
  const dateLabel=document.querySelector('#dateLabel');
  if(dateLabel)dateLabel.textContent=new Date().toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric'});
}

function ensureStyles(){
  if(document.querySelector('#noorIntegrityStyles'))return;
  const s=document.createElement('style');
  s.id='noorIntegrityStyles';
  s.textContent=`
    .record-card.noor-archived{opacity:.72;background:#f6f7f8}
    .noor-archive-badge{display:inline-flex;align-items:center;margin-left:7px;padding:3px 7px;border-radius:999px;background:#e8ebee;color:#59636d;font-size:9px;font-weight:700;letter-spacing:.04em;text-transform:uppercase}
    .noor-archive-note{display:block;margin-top:5px;color:var(--muted);font-size:9px}
    .record-actions button.noor-archive-action{border-color:#b9c1c8;color:#4f5963;background:#fff}
    .record-card.noor-archived [data-edit-exp],.record-card.noor-archived [data-bench-exp],.record-card.noor-archived [data-edit-protocol],.record-card.noor-archived [data-edit-syn],.record-card.noor-archived [data-edit-disc]{opacity:.45;pointer-events:none}
  `;
  document.head.appendChild(s);
}

function experimentSnapshot(exp){
  const out={};
  for(const key of EXPERIMENT_FIELDS)out[key]=exp?.[key]??'';
  return out;
}

async function recordExperimentStateRevision(before,after,action,who,changedAt){
  const rows=(await all('experimentRevisions')).filter(r=>r.experimentId===after.id);
  const revision=Math.max(0,...rows.map(r=>Number(r.revision)||0))+1;
  await put('experimentRevisions',{
    id:`rev_${after.id}_${revision}`,
    experimentId:after.id,
    revision,
    changedAt,
    changedBy:who,
    changedFields:['status'],
    changeSummary:action==='archive'?'Experiment archived':'Experiment restored',
    snapshot:experimentSnapshot(after),
    pendingCloud:true
  });
  await put('experiments',{...after,revision,lastModifiedBy:who,createdBy:after.createdBy||who});
  window.dispatchEvent(new CustomEvent('noor:experiment-revision',{detail:{experimentId:after.id,revision}}));
  return revision;
}

async function writeAudit(entityType,id,action,who,changedAt){
  await put('auditEvents',{
    id:uid('aud'),
    entityType,
    entityId:id,
    action,
    changedFields:['status'],
    createdAt:changedAt,
    actor:who,
    metadata:{recordIntegrity:true},
    pendingCloud:true
  });
}

function findConfig(target){
  for(const cfg of Object.values(RECORDS))if(target.matches(cfg.selector))return cfg;
  return null;
}

async function setArchived(cfg,id,archive){
  const before=await get(cfg.store,id);
  if(!before)return;
  const now=new Date().toISOString();
  const who=actor();
  const action=archive?'archive':'restore';
  const after={
    ...before,
    status:archive?'Archived':'Active',
    archivedAt:archive?now:null,
    archivedBy:archive?who:null,
    restoredAt:archive?before.restoredAt||null:now,
    restoredBy:archive?before.restoredBy||null:who,
    updatedAt:now
  };
  await put(cfg.store,after);
  let revision=null;
  if(cfg.entityType==='experiment')revision=await recordExperimentStateRevision(before,after,action,who,now);
  await writeAudit(cfg.entityType,id,action,who,now);
  await patchButtons();
  const card=document.querySelector(`${cfg.selector}[${cfg.attr}="${CSS.escape(id)}"]`)?.closest('.record-card');
  if(card&&revision){
    const spans=[...card.querySelectorAll('.noor-audit-meta span')];
    const rev=spans.find(x=>x.textContent.startsWith('Revision '));
    const mod=spans.find(x=>x.textContent.startsWith('Modified '));
    const by=spans.find(x=>x.textContent.startsWith('By '));
    if(rev)rev.textContent=`Revision ${revision}`;
    if(mod)mod.textContent=`Modified ${fmt(now)}`;
    if(by)by.textContent=`By ${who.name}`;
  }
}

async function patchOne(button,cfg){
  const id=button.getAttribute(cfg.attr);
  if(!id)return;
  const row=await get(cfg.store,id);
  if(!row)return;
  const archived=row.status==='Archived';
  button.textContent=archived?'Restore':'Archive';
  button.classList.remove('danger');
  button.classList.add('noor-archive-action');
  button.title=archived?'Restore this record to active use':'Archive without deleting the scientific record';
  button.setAttribute('aria-label',archived?'Restore record':'Archive record');
  const card=button.closest('.record-card');
  if(!card)return;
  card.classList.toggle('noor-archived',archived);
  let badge=card.querySelector('.noor-archive-badge');
  if(archived&&!badge){
    badge=document.createElement('span');
    badge.className='noor-archive-badge';
    badge.textContent='Archived';
    card.querySelector('.tag')?.after(badge);
  }else if(!archived&&badge)badge.remove();
  let note=card.querySelector('.noor-archive-note');
  if(archived){
    const who=row.archivedBy?.name||row.archivedBy?.email||'recorded user';
    if(!note){note=document.createElement('small');note.className='noor-archive-note';card.querySelector('.record-top > div')?.appendChild(note);}
    note.textContent=`Archived ${fmt(row.archivedAt||row.updatedAt)} · ${who}`;
  }else if(note)note.remove();
}

let patchQueued=false;
async function patchButtons(){
  if(patchQueued)return;
  patchQueued=true;
  requestAnimationFrame(async()=>{
    patchQueued=false;
    for(const cfg of Object.values(RECORDS)){
      for(const button of document.querySelectorAll(cfg.selector))await patchOne(button,cfg);
    }
  });
}

function interceptHardDelete(){
  document.addEventListener('click',ev=>{
    const button=ev.target.closest?.('[data-del-exp],[data-del-protocol],[data-del-syn],[data-del-disc]');
    if(!button)return;
    const cfg=findConfig(button);if(!cfg)return;
    ev.preventDefault();
    ev.stopPropagation();
    ev.stopImmediatePropagation();
    const id=button.getAttribute(cfg.attr);
    get(cfg.store,id).then(row=>{
      if(!row)return;
      const archived=row.status==='Archived';
      const message=archived?'Restore this record?':'Archive this record? It will stay in NOOR with its timestamps and audit history; nothing will be deleted.';
      if(confirm(message))setArchived(cfg,id,!archived).catch(err=>{console.error('NOOR record integrity:',err);alert(err.message);});
    });
  },true);
}

function wire(){
  ensureStyles();
  updateClockText();
  setInterval(updateClockText,60000);
  window.addEventListener('focus',updateClockText);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)updateClockText();});
  interceptHardDelete();
  patchButtons();
  new MutationObserver(()=>patchButtons()).observe(document.body,{childList:true,subtree:true});
  window.addEventListener('noor:cloud-pull',()=>patchButtons());
}

if(typeof document!=='undefined'){
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(wire,250));
  else setTimeout(wire,250);
}
