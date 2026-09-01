import {all} from './storage.js';

const $=s=>document.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

async function refreshProjectOptions(){
  const input=$('#expProject');
  if(!input)return;
  let list=$('#expProjectOptions');
  if(!list){
    list=document.createElement('datalist');
    list.id='expProjectOptions';
    input.insertAdjacentElement('afterend',list);
  }
  input.setAttribute('list','expProjectOptions');
  input.setAttribute('autocomplete','off');
  const [projects,experiments]=await Promise.all([all('projects'),all('experiments')]);
  const current=input.value.trim();
  const names=[...new Set([
    ...projects.map(p=>p.name),
    ...experiments.map(e=>e.project),
    current
  ].filter(Boolean))].sort((a,b)=>a.localeCompare(b));
  list.innerHTML=names.map(name=>`<option value="${esc(name)}"></option>`).join('');
  input.placeholder=projects.length?'Choose or type a project':'Project / study';
}

function wireProjectLinking(){
  const input=$('#expProject');
  if(!input)return;
  const refresh=()=>refreshProjectOptions().catch(console.error);
  input.addEventListener('focus',refresh);
  input.addEventListener('click',async()=>{
    await refresh();
    try{input.showPicker?.();}catch(_e){}
  });
  $('#projectDialog')?.addEventListener('close',refresh);
  document.addEventListener('click',e=>{
    if(e.target.closest('#newExperiment,#workspaceNew,[data-template],[data-edit-exp]'))refresh();
  },true);
  refresh();
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',wireProjectLinking,{once:true});
else wireProjectLinking();
