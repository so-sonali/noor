const $=s=>document.querySelector(s);const $$=s=>[...document.querySelectorAll(s)];
const store={get:(k,f)=>{try{return JSON.parse(localStorage.getItem(k))??f}catch{return f}},set:(k,v)=>localStorage.setItem(k,JSON.stringify(v))};
const quotes=[
 {q:"Nothing in life is to be feared; it is only to be understood.",a:"Marie Curie"},
 {q:"Somewhere, something incredible is waiting to be known.",a:"Carl Sagan"},
 {q:"The important thing is not to stop questioning.",a:"Albert Einstein"},
 {q:"What I cannot create, I do not understand.",a:"Richard Feynman"}
];
let tasks=store.get("noor.tasks",[]),experiments=store.get("noor.experiments",[]);
const date=new Date();$("#dateLabel").textContent=date.toLocaleDateString(undefined,{weekday:"long",month:"long",day:"numeric"});
const quote=quotes[Math.floor(date.getDate()%quotes.length)];$("#quoteText").textContent=quote.q;$("#quoteAuthor").textContent="— "+quote.a;
function showView(id){$$('.view').forEach(v=>v.classList.toggle('active-view',v.id===id));$$('.nav').forEach(n=>n.classList.toggle('active',n.dataset.view===id));$("#pageTitle").textContent=id==='today'?'Good day, scientist.':id.replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase());window.scrollTo({top:0,behavior:'smooth'})}
$$('.nav').forEach(n=>n.onclick=()=>showView(n.dataset.view));$$('[data-jump]').forEach(n=>n.onclick=()=>showView(n.dataset.jump));
function renderTasks(){$('#taskCount').textContent=tasks.filter(t=>!t.done).length;$('#taskList').innerHTML=tasks.map((t,i)=>`<li class="${t.done?'done':''}"><input type="checkbox" ${t.done?'checked':''} data-check="${i}"><span>${escapeHtml(t.text)}</span><button data-delete="${i}">×</button></li>`).join('');$$('[data-check]').forEach(x=>x.onchange=()=>{tasks[x.dataset.check].done=x.checked;saveTasks()});$$('[data-delete]').forEach(x=>x.onclick=()=>{tasks.splice(x.dataset.delete,1);saveTasks()})}
function saveTasks(){store.set('noor.tasks',tasks);renderTasks()}
$('#taskForm').onsubmit=e=>{e.preventDefault();const text=$('#taskInput').value.trim();if(!text)return;tasks.unshift({text,done:false});$('#taskInput').value='';saveTasks()};
function renderExperiments(){const html=experiments.length?experiments.map(e=>`<article><span class="tag">${escapeHtml(e.discipline)}</span><h3>${escapeHtml(e.title)}</h3><p><b>Objective:</b> ${escapeHtml(e.objective||'—')}</p><p><b>Observation:</b> ${escapeHtml(e.observation||'—')}</p><p><b>Interpretation:</b> ${escapeHtml(e.interpretation||'—')}</p></article>`).join(''):'<div class="placeholder">No experiments yet. Start the first record from “New experiment”.</div>';$('#experimentList').innerHTML=html;$('#recentExperiments').innerHTML=experiments.length?experiments.slice(0,3).map(e=>`<p><b>${escapeHtml(e.title)}</b><br><span>${escapeHtml(e.discipline)}</span></p>`).join(''):'No experiments yet.<br><span>Start with the question you want to answer.</span>'}
const dialog=$('#experimentDialog');$('#newExperiment').onclick=()=>dialog.showModal();$('#closeDialog').onclick=()=>dialog.close();
$('#experimentForm').onsubmit=e=>{e.preventDefault();experiments.unshift({id:crypto.randomUUID?.()||Date.now(),title:$('#expTitle').value.trim(),discipline:$('#expDiscipline').value,objective:$('#expObjective').value.trim(),observation:$('#expObservation').value.trim(),interpretation:$('#expInterpretation').value.trim(),created:new Date().toISOString()});store.set('noor.experiments',experiments);renderExperiments();e.target.reset();dialog.close();showView('experiments')};
function safeCalc(expr){if(!/^[0-9eE+\-*/().^\s]+$/.test(expr))throw Error('Use numbers and arithmetic operators only.');const normalized=expr.replace(/\^/g,'**');return Function('"use strict";return ('+normalized+')')()}
$('#calculate').onclick=()=>{try{const r=safeCalc($('#calcDisplay').value);$('#calcResult').textContent=Number.isFinite(r)?r:'Invalid result'}catch(e){$('#calcResult').textContent=e.message}};$('#clearCalc').onclick=()=>{$('#calcDisplay').value='';$('#calcResult').textContent='—'};
function escapeHtml(v){return String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
window.addEventListener('online',updateStatus);window.addEventListener('offline',updateStatus);function updateStatus(){$('#offlineText').textContent=navigator.onLine?'Local-first workspace':'Offline — your local records still work'}updateStatus();
if('serviceWorker'in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('./sw.js').catch(()=>{});
renderTasks();renderExperiments();
