import {all,put,get,uid} from './storage.js';

const FIELDS=[
  {id:'expObjective',key:'objective',label:'Objective / hypothesis'},
  {id:'expMaterials',key:'materials',label:'Materials / samples'},
  {id:'expProcedure',key:'procedure',label:'Procedure / conditions'},
  {id:'expObservation',key:'observation',label:'Observation'},
  {id:'expInterpretation',key:'interpretation',label:'Interpretation'},
  {id:'expNext',key:'nextStep',label:'Next step'}
];
const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const now=()=>new Date().toISOString();
const enc=s=>new TextEncoder().encode(s);
let state={experimentId:null,field:null,pages:[],pageIndex:0,tool:'pen',color:'#17202a',width:2.2,drawing:false,lastPoint:null,history:[],redo:[]};

function injectStyles(){if($('#hwStyles'))return;const s=document.createElement('style');s.id='hwStyles';s.textContent=`
.hw-switch{display:flex;gap:5px;align-items:center;margin:7px 0 6px}.hw-switch span{font-size:8px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);font-weight:800;margin-right:2px}.hw-switch button{border:1px solid var(--line);background:#fff;border-radius:999px;padding:5px 9px;font-size:8px;font-weight:800;cursor:pointer}.hw-switch button.active{background:var(--blue);border-color:var(--blue);color:#fff}.hw-open{width:100%;min-height:88px;border:1px dashed #97abc0;background:#f7fbff;border-radius:11px;padding:13px;text-align:left;cursor:pointer;margin-top:5px}.hw-open b{display:block;font-size:11px;color:#173b64}.hw-open span{display:block;font-size:9px;color:var(--muted);margin-top:4px}.hw-typed-hidden{display:none!important}.hw-dialog{width:min(980px,98vw);max-height:96vh;border:0;border-radius:16px;padding:0;overflow:hidden;background:#edf2f5}.hw-dialog::backdrop{background:#001b3da8}.hw-head{display:flex;align-items:center;justify-content:space-between;gap:10px;background:#fff;padding:12px 14px;border-bottom:1px solid #d9e0e5}.hw-head h2{font:22px Georgia,serif;margin:1px 0}.hw-head small{font-size:9px;color:var(--muted)}.hw-toolbar{display:flex;gap:6px;align-items:center;flex-wrap:wrap;background:#f7f9fa;padding:8px 10px;border-bottom:1px solid #d9e0e5}.hw-toolbar button,.hw-toolbar select,.hw-toolbar input[type=color]{height:34px;border:1px solid #cbd5dd;background:#fff;border-radius:8px;font-size:9px;font-weight:800;padding:0 9px}.hw-toolbar button.active{background:#123d68;color:#fff;border-color:#123d68}.hw-toolbar input[type=color]{width:38px;padding:3px}.hw-page-tools{margin-left:auto;display:flex;align-items:center;gap:6px}.hw-page-tools span{font-size:9px;font-weight:800;color:#596979}.hw-stage{height:min(72vh,850px);overflow:auto;padding:14px;display:flex;justify-content:center;background:#dfe5e9}.hw-paper-wrap{width:min(760px,96vw);box-shadow:0 6px 26px #17324c26;background:#fff}.hw-canvas{display:block;width:100%;aspect-ratio:8.5/11;touch-action:none;background:#fff;cursor:crosshair}.hw-foot{display:flex;justify-content:space-between;gap:8px;align-items:center;background:#fff;border-top:1px solid #d9e0e5;padding:10px 12px}.hw-foot p{margin:0;font-size:9px;color:var(--muted)}.hw-foot-actions{display:flex;gap:7px}.hw-foot button{border:1px solid var(--line);background:#fff;border-radius:8px;padding:9px 12px;font-size:9px;font-weight:800}.hw-foot .hw-save{background:var(--blue);color:#fff;border-color:var(--blue)}
@media(max-width:700px){.hw-dialog{width:100vw;max-width:100vw;height:100dvh;max-height:100dvh;border-radius:0}.hw-stage{height:calc(100dvh - 178px);padding:8px}.hw-toolbar{gap:4px}.hw-toolbar button,.hw-toolbar select{padding:0 7px}.hw-page-tools{margin-left:0}.hw-foot p{display:none}}
`;
document.head.appendChild(s);}

function defaultPage(){return {id:uid('page'),background:'ruled',strokes:[]};}
function recordId(expId,key){return `hw_${expId}_${key}`;}
function pdfId(expId,key){return `hwpdf_${expId}_${key}`;}
function ensureExperimentId(){const el=$('#expId');if(!el)return null;if(!el.value)el.value=uid('exp');return el.value;}

function injectDialog(){if($('#handwritingDialog'))return;const d=document.createElement('dialog');d.id='handwritingDialog';d.className='hw-dialog';d.innerHTML=`
<div class="hw-head"><div><small id="hwContext">HANDWRITTEN ELN FIELD</small><h2 id="hwTitle">Handwriting</h2></div><button type="button" class="icon-button" id="hwClose">×</button></div>
<div class="hw-toolbar">
  <button type="button" data-hw-tool="pen" class="active">Pen</button>
  <button type="button" data-hw-tool="highlighter">Highlighter</button>
  <button type="button" data-hw-tool="eraser">Eraser</button>
  <input id="hwColor" type="color" value="#17202a" aria-label="Ink color">
  <select id="hwWidth" aria-label="Pen width"><option value="1.4">Fine</option><option value="2.2" selected>Medium</option><option value="3.6">Bold</option><option value="5.5">Extra bold</option></select>
  <select id="hwBackground" aria-label="Paper background"><option value="blank">Blank</option><option value="ruled" selected>Ruled</option><option value="grid">Grid</option><option value="dot">Dot</option></select>
  <button type="button" id="hwUndo">Undo</button><button type="button" id="hwRedo">Redo</button>
  <div class="hw-page-tools"><button type="button" id="hwPrev">‹</button><span id="hwPageLabel">Page 1 / 1</span><button type="button" id="hwNext">›</button><button type="button" id="hwAddPage">+ Page</button><button type="button" id="hwDeletePage">Delete page</button></div>
</div>
<div class="hw-stage"><div class="hw-paper-wrap"><canvas id="hwCanvas" class="hw-canvas"></canvas></div></div>
<div class="hw-foot"><p>Apple Pencil/stylus pressure is used when the browser provides it. Strokes stay editable; PDF is regenerated when you save.</p><div class="hw-foot-actions"><button type="button" id="hwDownloadPdf">PDF</button><button type="button" class="hw-save" id="hwSave">Save handwriting</button></div></div>`;
document.body.appendChild(d);
$('#hwClose').onclick=()=>d.close();
$$('[data-hw-tool]').forEach(b=>b.onclick=()=>{state.tool=b.dataset.hwTool;$$('[data-hw-tool]').forEach(x=>x.classList.toggle('active',x===b));});
$('#hwColor').oninput=e=>state.color=e.target.value;
$('#hwWidth').onchange=e=>state.width=Number(e.target.value)||2.2;
$('#hwBackground').onchange=e=>{currentPage().background=e.target.value;redraw();};
$('#hwUndo').onclick=undo;
$('#hwRedo').onclick=redo;
$('#hwPrev').onclick=()=>changePage(-1);
$('#hwNext').onclick=()=>changePage(1);
$('#hwAddPage').onclick=()=>{state.pages.push(defaultPage());state.pageIndex=state.pages.length-1;resetHistory();syncPageUi();redraw();};
$('#hwDeletePage').onclick=()=>{if(state.pages.length===1){currentPage().strokes=[];}else{state.pages.splice(state.pageIndex,1);state.pageIndex=Math.min(state.pageIndex,state.pages.length-1);}resetHistory();syncPageUi();redraw();};
$('#hwSave').onclick=()=>saveHandwriting(true);
$('#hwDownloadPdf').onclick=async()=>{const blob=await pagesToPdf(state.pages);downloadBlob(`${safeName(state.field?.label||'handwriting')}.pdf`,blob);};
setupCanvas();}

function injectFieldSwitches(){for(const f of FIELDS){const ta=$(`#${f.id}`);if(!ta||ta.dataset.hwReady)return;ta.dataset.hwReady='1';const label=ta.closest('label');if(!label)continue;const sw=document.createElement('div');sw.className='hw-switch';sw.innerHTML=`<span>Input</span><button type="button" data-hw-mode="type" data-field="${f.key}" class="active">Type</button><button type="button" data-hw-mode="write" data-field="${f.key}">Write</button>`;label.insertBefore(sw,ta);const open=document.createElement('button');open.type='button';open.className='hw-open';open.dataset.hwOpen=f.key;open.hidden=true;open.innerHTML=`<b>Open handwritten ${f.label.toLowerCase()}</b><span>Apple Pencil / stylus · editable pages · PDF archive</span>`;ta.after(open);sw.querySelector('[data-hw-mode="type"]').onclick=()=>setFieldMode(f,'type');sw.querySelector('[data-hw-mode="write"]').onclick=()=>setFieldMode(f,'write',true);open.onclick=()=>openPad(f);}}

async function getRecord(expId,key){return get('handwriting',recordId(expId,key));}
async function setFieldMode(f,mode,open=false){const expId=ensureExperimentId();if(!expId)return;const old=await getRecord(expId,f.key);const rec=old||{id:recordId(expId,f.key),experimentId:expId,fieldKey:f.key,fieldLabel:f.label,pages:[defaultPage()],createdAt:now()};rec.mode=mode;rec.updatedAt=now();await put('handwriting',rec);applyFieldMode(f,rec);if(open)openPad(f);}
function applyFieldMode(f,rec){const ta=$(`#${f.id}`),label=ta?.closest('label');if(!ta||!label)return;const write=rec?.mode==='write';ta.classList.toggle('hw-typed-hidden',write);const open=label.querySelector(`[data-hw-open="${f.key}"]`);if(open){open.hidden=!write;const pages=rec?.pages?.length||1;open.querySelector('span').textContent=`${pages} handwritten page${pages===1?'':'s'} · editable strokes · PDF archive`;}
label.querySelectorAll(`[data-field="${f.key}"]`).forEach(b=>b.classList.toggle('active',b.dataset.hwMode===(write?'write':'type')));}

async function syncFieldModes(){const expId=ensureExperimentId();if(!expId)return;for(const f of FIELDS)applyFieldMode(f,await getRecord(expId,f.key));}

async function openPad(f){const expId=ensureExperimentId();if(!expId)return;let rec=await getRecord(expId,f.key);if(!rec)rec={id:recordId(expId,f.key),experimentId:expId,fieldKey:f.key,fieldLabel:f.label,mode:'write',pages:[defaultPage()],createdAt:now(),updatedAt:now()};rec.mode='write';await put('handwriting',rec);state.experimentId=expId;state.field=f;state.pages=structuredClone(rec.pages?.length?rec.pages:[defaultPage()]);state.pageIndex=0;state.tool='pen';state.color='#17202a';state.width=2.2;resetHistory();$('#hwTitle').textContent=f.label;$('#hwContext').textContent=`${$('#expTitle')?.value?.trim()||'EXPERIMENT'} · HANDWRITTEN FIELD`;$('#hwColor').value=state.color;$('#hwWidth').value=String(state.width);$$('[data-hw-tool]').forEach(x=>x.classList.toggle('active',x.dataset.hwTool==='pen'));syncPageUi();$('#handwritingDialog').showModal();requestAnimationFrame(resizeCanvas);applyFieldMode(f,rec);}

function currentPage(){return state.pages[state.pageIndex]||state.pages[0];}
function resetHistory(){state.history=[];state.redo=[];}
function snapshot(){return structuredClone(currentPage().strokes||[]);}
function pushHistory(){state.history.push(snapshot());if(state.history.length>60)state.history.shift();state.redo=[];}
function undo(){if(!state.history.length)return;state.redo.push(snapshot());currentPage().strokes=state.history.pop();redraw();}
function redo(){if(!state.redo.length)return;state.history.push(snapshot());currentPage().strokes=state.redo.pop();redraw();}
function changePage(delta){state.pageIndex=Math.max(0,Math.min(state.pages.length-1,state.pageIndex+delta));resetHistory();syncPageUi();redraw();}
function syncPageUi(){const p=currentPage();$('#hwPageLabel').textContent=`Page ${state.pageIndex+1} / ${state.pages.length}`;$('#hwBackground').value=p?.background||'ruled';$('#hwPrev').disabled=state.pageIndex===0;$('#hwNext').disabled=state.pageIndex===state.pages.length-1;}

function setupCanvas(){const c=$('#hwCanvas');const point=e=>{const r=c.getBoundingClientRect();return {x:(e.clientX-r.left)/r.width,y:(e.clientY-r.top)/r.height,p:e.pointerType==='pen'&&Number.isFinite(e.pressure)?Math.max(.05,e.pressure):.5};};c.addEventListener('pointerdown',e=>{e.preventDefault();c.setPointerCapture?.(e.pointerId);state.drawing=true;state.lastPoint=point(e);pushHistory();if(state.tool==='eraser')eraseAt(state.lastPoint);else{const stroke={tool:state.tool,color:state.color,width:state.tool==='highlighter'?Math.max(10,state.width*5):state.width,points:[state.lastPoint]};currentPage().strokes.push(stroke);}redraw();});c.addEventListener('pointermove',e=>{if(!state.drawing)return;e.preventDefault();const p=point(e);if(state.tool==='eraser')eraseAt(p);else{const stroke=currentPage().strokes[currentPage().strokes.length-1];stroke?.points.push(p);}state.lastPoint=p;redraw();});const end=e=>{if(!state.drawing)return;e.preventDefault();state.drawing=false;state.lastPoint=null;};c.addEventListener('pointerup',end);c.addEventListener('pointercancel',end);window.addEventListener('resize',resizeCanvas);}

function eraseAt(p){const radius=.025;currentPage().strokes=(currentPage().strokes||[]).filter(st=>!st.points?.some(q=>Math.hypot(q.x-p.x,q.y-p.y)<radius));}
function resizeCanvas(){const c=$('#hwCanvas');if(!c)return;const rect=c.getBoundingClientRect();const dpr=Math.min(window.devicePixelRatio||1,2.5);const w=Math.max(600,Math.round(rect.width*dpr)),h=Math.round(w*11/8.5);if(c.width!==w||c.height!==h){c.width=w;c.height=h;}redraw();}
function drawPaper(ctx,w,h,bg='ruled'){ctx.save();ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);ctx.lineWidth=1;if(bg==='ruled'){ctx.strokeStyle='#dbe8f4';const gap=h/32;for(let y=gap*2;y<h;y+=gap){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}ctx.strokeStyle='#f3cfd1';ctx.beginPath();ctx.moveTo(w*.09,0);ctx.lineTo(w*.09,h);ctx.stroke();}else if(bg==='grid'){ctx.strokeStyle='#e4edf4';const gap=w/24;for(let x=gap;x<w;x+=gap){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke();}for(let y=gap;y<h;y+=gap){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}}else if(bg==='dot'){ctx.fillStyle='#cfdbe4';const gap=w/24;for(let x=gap;x<w;x+=gap)for(let y=gap;y<h;y+=gap){ctx.beginPath();ctx.arc(x,y,1.1,0,Math.PI*2);ctx.fill();}}ctx.restore();}
function drawStrokes(ctx,w,h,strokes=[]){ctx.save();ctx.lineCap='round';ctx.lineJoin='round';for(const st of strokes){const pts=st.points||[];if(!pts.length)continue;ctx.globalAlpha=st.tool==='highlighter'?.25:1;ctx.strokeStyle=st.tool==='highlighter'?'#ffe45c':st.color||'#17202a';ctx.beginPath();for(let i=0;i<pts.length;i++){const p=pts[i],x=p.x*w,y=p.y*h;if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);const pressure=.62+(Number(p.p)||.5)*.7;ctx.lineWidth=(Number(st.width)||2)*pressure*(w/760);}if(pts.length===1){const p=pts[0];ctx.fillStyle=ctx.strokeStyle;ctx.beginPath();ctx.arc(p.x*w,p.y*h,Math.max(1,(Number(st.width)||2)*(w/760)/2),0,Math.PI*2);ctx.fill();}else ctx.stroke();}ctx.restore();}
function redraw(){const c=$('#hwCanvas');if(!c||!state.pages.length)return;const ctx=c.getContext('2d');ctx.clearRect(0,0,c.width,c.height);drawPaper(ctx,c.width,c.height,currentPage().background);drawStrokes(ctx,c.width,c.height,currentPage().strokes);}

async function renderPage(page,width=1275,height=1650){const c=document.createElement('canvas');c.width=width;c.height=height;const ctx=c.getContext('2d');drawPaper(ctx,width,height,page.background);drawStrokes(ctx,width,height,page.strokes);return c;}
function canvasJpeg(canvas){return new Promise((resolve,reject)=>canvas.toBlob(async b=>{if(!b)return reject(new Error('Could not render handwriting page.'));resolve(new Uint8Array(await b.arrayBuffer()));},'image/jpeg',.94));}
function concat(parts){const total=parts.reduce((n,p)=>n+p.length,0),out=new Uint8Array(total);let o=0;for(const p of parts){out.set(p,o);o+=p.length;}return out;}
async function pagesToPdf(pages){const images=[];for(const p of pages)images.push({bytes:await canvasJpeg(await renderPage(p)),w:1275,h:1650});const count=images.length,objCount=2+count*3,objects=new Array(objCount+1);objects[1]=enc('<< /Type /Catalog /Pages 2 0 R >>');const kids=[];for(let i=0;i<count;i++)kids.push(`${3+i*3} 0 R`);objects[2]=enc(`<< /Type /Pages /Kids [${kids.join(' ')}] /Count ${count} >>`);for(let i=0;i<count;i++){const pageNo=3+i*3,contentNo=4+i*3,imageNo=5+i*3,img=images[i];objects[pageNo]=enc(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /XObject << /Im0 ${imageNo} 0 R >> >> /Contents ${contentNo} 0 R >>`);const stream=enc('q\n612 0 0 792 0 0 cm\n/Im0 Do\nQ\n');objects[contentNo]=concat([enc(`<< /Length ${stream.length} >>\nstream\n`),stream,enc('endstream')]);objects[imageNo]=concat([enc(`<< /Type /XObject /Subtype /Image /Width ${img.w} /Height ${img.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${img.bytes.length} >>\nstream\n`),img.bytes,enc('\nendstream')]);}
const chunks=[enc('%PDF-1.4\n%NOOR handwriting\n')],offsets=new Array(objCount+1).fill(0);let pos=chunks[0].length;for(let i=1;i<=objCount;i++){offsets[i]=pos;const ob=concat([enc(`${i} 0 obj\n`),objects[i],enc('\nendobj\n')]);chunks.push(ob);pos+=ob.length;}const xref=pos;let table=`xref\n0 ${objCount+1}\n0000000000 65535 f \n`;for(let i=1;i<=objCount;i++)table+=`${String(offsets[i]).padStart(10,'0')} 00000 n \n`;table+=`trailer\n<< /Size ${objCount+1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;chunks.push(enc(table));return new Blob([concat(chunks)],{type:'application/pdf'});}

async function saveHandwriting(close=false){if(!state.experimentId||!state.field)return;const old=await getRecord(state.experimentId,state.field.key);const pdf=await pagesToPdf(state.pages);const attachmentId=pdfId(state.experimentId,state.field.key);await put('attachments',{id:attachmentId,experimentId:state.experimentId,kind:'handwriting-pdf',category:'Handwritten note',fieldKey:state.field.key,fieldLabel:state.field.label,name:`${safeName(state.field.label)}_handwriting.pdf`,mime:'application/pdf',size:pdf.size,blob:pdf,createdAt:old?.createdAt||now(),updatedAt:now()});const rec={...(old||{}),id:recordId(state.experimentId,state.field.key),experimentId:state.experimentId,fieldKey:state.field.key,fieldLabel:state.field.label,mode:'write',pages:structuredClone(state.pages),pdfAttachmentId:attachmentId,createdAt:old?.createdAt||now(),updatedAt:now()};await put('handwriting',rec);const exp=await get('experiments',state.experimentId);if(exp){exp.handwritingFields={...(exp.handwritingFields||{}),[state.field.key]:{mode:'write',pages:state.pages.length,pdfAttachmentId:attachmentId,updatedAt:now()}};exp.updatedAt=now();await put('experiments',exp);}applyFieldMode(state.field,rec);decorateExperimentCards();if(close)$('#handwritingDialog').close();notify('Handwriting saved + PDF updated');}

function safeName(v){return String(v||'handwriting').replace(/[^a-z0-9_-]+/gi,'_').replace(/^_+|_+$/g,'').slice(0,80)||'handwriting';}
function downloadBlob(name,blob){const a=document.createElement('a'),url=URL.createObjectURL(blob);a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1200);}
function notify(text){const t=$('#toast');if(!t)return;t.textContent=text;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2200);}

async function patchExperimentSummary(expId){const exp=await get('experiments',expId);if(!exp)return;const rows=(await all('handwriting')).filter(r=>r.experimentId===expId&&r.mode==='write');const map={};for(const r of rows)map[r.fieldKey]={mode:'write',pages:r.pages?.length||1,pdfAttachmentId:r.pdfAttachmentId||pdfId(expId,r.fieldKey),updatedAt:r.updatedAt};exp.handwritingFields=map;await put('experiments',exp);}
async function decorateExperimentCards(){const rows=await all('handwriting');const counts={};for(const r of rows)if(r.mode==='write')counts[r.experimentId]=(counts[r.experimentId]||0)+1;$$('#experimentList .record-card').forEach(card=>{const id=card.querySelector('[data-edit-exp]')?.dataset.editExp;if(!id)return;card.querySelector('.hw-card-badge')?.remove();if(counts[id]){const badge=document.createElement('span');badge.className='hw-card-badge tag';badge.textContent=`✎ ${counts[id]} handwritten section${counts[id]===1?'':'s'}`;card.querySelector('.record-top>div')?.appendChild(badge);}});}

function watchExperimentDialog(){const d=$('#experimentDialog');if(!d)return;new MutationObserver(async muts=>{if(muts.some(m=>m.attributeName==='open')&&d.open){await syncFieldModes();}}).observe(d,{attributes:true,attributeFilter:['open']});const form=$('#experimentForm');form?.addEventListener('submit',()=>{const id=ensureExperimentId();setTimeout(()=>patchExperimentSummary(id).then(decorateExperimentCards).catch(console.error),500);},true);const list=$('#experimentList');if(list)new MutationObserver(()=>decorateExperimentCards().catch(console.error)).observe(list,{childList:true,subtree:true});}

injectStyles();injectDialog();injectFieldSwitches();watchExperimentDialog();decorateExperimentCards().catch(console.error);
