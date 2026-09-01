import { SOLVENTS, TOOL_LABELS } from './config.js';

const C_FACTORS = { M:1, mM:1e-3, uM:1e-6, nM:1e-9 };
const V_FACTORS = { L:1, mL:1e-3, uL:1e-6, nL:1e-9 };
const M_FACTORS = { kg:1e3, g:1, mg:1e-3, ug:1e-6 };
const LENGTH_FACTORS = { m:1, cm:1e-2, mm:1e-3, um:1e-6, nm:1e-9 };
const PLATES = {
  '6-well': { wells:6, min:2000, max:5000 },
  '12-well': { wells:12, min:1000, max:3500 },
  '24-well': { wells:24, min:500, max:1000 },
  '48-well': { wells:48, min:200, max:500 },
  '96-well': { wells:96, min:100, max:200 },
  '384-well': { wells:384, min:20, max:50 },
  '4-chamber': { wells:4, min:200, max:400 },
  '8-chamber': { wells:8, min:100, max:200 },
  'T25': { wells:1, min:3000, max:7000 },
  'T75': { wells:1, min:7000, max:15000 },
  '100 mm dish': { wells:1, min:5000, max:12000 }
};
const REAGENTS = {
  NaCl:58.44, Tris:121.14, EDTA:292.24, EGTA:380.4, Glycine:75.07,
  HEPES:238.30, MES:195.20, Urea:60.06, NaOH:40.00, Tricine:179.20,
  KCl:74.56, K2HPO4:174.18, KH2PO4:136.09, MgCl2:95.21, MOPS:209.27, DTT:154.25
};

const positive = (value, name) => {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) throw new Error(`${name} must be greater than zero.`);
  return n;
};
const nonnegative = (value, name) => {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) throw new Error(`${name} cannot be negative.`);
  return n;
};
const finite = (value, name) => {
  const n = Number(value);
  if (!Number.isFinite(n)) throw new Error(`${name} must be a number.`);
  return n;
};
const round = n => Number(Number(n).toPrecision(7));
const convert = (value, from, to, factors) => {
  if (!(from in factors) || !(to in factors)) throw new Error('Incompatible units.');
  return Number(value) * factors[from] / factors[to];
};

export function molarityToMass({ concentration, concentrationUnit='mM', volume, volumeUnit='mL', mw, massUnit='mg' }) {
  const molarity = positive(concentration,'Concentration') * C_FACTORS[concentrationUnit];
  const liters = positive(volume,'Volume') * V_FACTORS[volumeUnit];
  const molecularWeight = positive(mw,'Molecular weight');
  const grams = molarity * liters * molecularWeight;
  return { mass:{ value:round(grams / M_FACTORS[massUnit]), unit:massUnit }, moles:{ value:round(molarity*liters), unit:'mol' } };
}
export function massToMolarity({ mass, massUnit='mg', volume, volumeUnit='mL', mw, concentrationUnit='mM' }) {
  const grams = positive(mass,'Mass') * M_FACTORS[massUnit];
  const liters = positive(volume,'Volume') * V_FACTORS[volumeUnit];
  const molecularWeight = positive(mw,'Molecular weight');
  const M = grams / molecularWeight / liters;
  return { concentration:{ value:round(M/C_FACTORS[concentrationUnit]), unit:concentrationUnit } };
}
export function dilution({ c1, c1Unit='mM', c2, c2Unit='mM', v2, v2Unit='mL', outUnit='mL' }) {
  const C1 = positive(c1,'Stock concentration') * C_FACTORS[c1Unit];
  const C2 = positive(c2,'Target concentration') * C_FACTORS[c2Unit];
  const V2 = positive(v2,'Final volume') * V_FACTORS[v2Unit];
  if (C2 > C1) throw new Error('Target concentration cannot exceed stock concentration.');
  const V1 = C2*V2/C1;
  return {
    stockVolume:{ value:round(V1/V_FACTORS[outUnit]), unit:outUnit },
    diluentVolume:{ value:round((V2-V1)/V_FACTORS[outUnit]), unit:outUnit }
  };
}
export function cellSeeding({ cellsPerWell, wells, suspensionCellsPerMl, volumePerWellUl, overage=10, vessel='96-well' }) {
  const spec = PLATES[vessel] || PLATES['96-well'];
  const nWells = positive(wells,'Number of wells');
  if (nWells > spec.wells) throw new Error(`${vessel} supports at most ${spec.wells} wells/vessels.`);
  const perWell = positive(volumePerWellUl,'Volume per well');
  if (perWell < spec.min || perWell > spec.max) throw new Error(`For ${vessel}, choose ${spec.min}–${spec.max} µL per well/vessel.`);
  const cpw = positive(cellsPerWell,'Cells per well');
  const concentration = positive(suspensionCellsPerMl,'Cell suspension concentration');
  const extra = nonnegative(overage,'Overage')/100;
  const totalCells = cpw*nWells*(1+extra);
  const finalMl = nWells*perWell/1000*(1+extra);
  const suspensionMl = totalCells/concentration;
  if (suspensionMl > finalMl) throw new Error('Required cell suspension exceeds the final mixture volume. Increase cell concentration or final volume.');
  const mediumMl = finalMl-suspensionMl;
  return {
    totalCells:{ value:round(totalCells), unit:'cells' },
    cellSuspension:{ value:round(suspensionMl), unit:'mL' },
    cellSuspensionUl:{ value:round(suspensionMl*1000), unit:'µL' },
    medium:{ value:round(mediumMl), unit:'mL' },
    mediumUl:{ value:round(mediumMl*1000), unit:'µL' },
    finalVolume:{ value:round(finalMl), unit:'mL' }
  };
}
export function rnaCdna({ stock, target, volume }) {
  const s=positive(stock,'RNA stock concentration'), t=positive(target,'Target concentration'), v=positive(volume,'Reaction volume');
  if (t>s) throw new Error('Target concentration cannot exceed RNA stock concentration.');
  const rna=t*v/s;
  return { rna:{value:round(rna),unit:'µL'}, water:{value:round(v-rna),unit:'µL'} };
}
export function theoreticalCapacity({ electrons, mw }) {
  return { capacity:{ value:round(positive(electrons,'Electrons')*96485.33212/(3.6*positive(mw,'Molar mass'))), unit:'mAh/g' } };
}
export function cRate({ capacity, rate }) { return { current:{ value:round(positive(capacity,'Capacity')*positive(rate,'C-rate')), unit:'mA' } }; }
export function currentDensity({ current, area }) { return { currentDensity:{ value:round(positive(current,'Current')/positive(area,'Area')), unit:'mA/cm²' } }; }
export function faraday({ charge, electrons=1 }) { return { moles:{ value:round(positive(charge,'Charge')/(positive(electrons,'Electrons')*96485.33212)), unit:'mol' } }; }
export function stoichiometry({ baseMmol, equivalents, mw }) {
  const mmol=positive(baseMmol,'Limiting-reagent amount')*positive(equivalents,'Equivalents');
  const out={ amount:{value:round(mmol),unit:'mmol'} };
  if (Number(mw)>0) out.mass={value:round(mmol*Number(mw)),unit:'mg'};
  return out;
}
export function percentYield({ actual, theoretical }) { return { yield:{ value:round(positive(actual,'Actual yield')/positive(theoretical,'Theoretical yield')*100), unit:'%' } }; }
export function heatingRamp({ start, end, rate, dwell=0 }) {
  const s=finite(start,'Start temperature'), e=finite(end,'End temperature'), r=positive(rate,'Ramp rate');
  if (s===e) throw new Error('Start and end temperatures must differ.');
  const ramp=Math.abs(e-s)/r;
  return { rampTime:{value:round(ramp),unit:'min'}, totalProgram:{value:round(ramp+nonnegative(dwell,'Dwell')),unit:'min'} };
}
export function rcfToRpm({ rcf, radius }) { return { rpm:{value:round(Math.sqrt(positive(rcf,'RCF')/(1.118e-5*positive(radius,'Rotor radius')))),unit:'rpm'} }; }
export function rpmToRcf({ rpm, radius }) { return { rcf:{value:round(1.118e-5*positive(radius,'Rotor radius')*positive(rpm,'RPM')**2),unit:'×g'} }; }
export function encapsulation({ initial, free, recovered, startingSolids }) {
  const i=positive(initial,'Initial payload'), f=nonnegative(free,'Free payload');
  if (f>i) throw new Error('Free payload cannot exceed initial payload.');
  const encapsulated=i-f;
  const out={ ee:{value:round(encapsulated/i*100),unit:'%'} };
  if (Number(recovered)>0) out.loading={value:round(encapsulated/Number(recovered)*100),unit:'%'};
  if (Number(startingSolids)>0 && Number(recovered)>0) out.recovery={value:round(Number(recovered)/Number(startingSolids)*100),unit:'%'};
  return out;
}
export function beerLambert({ absorbance, epsilon, path=1 }) { return { concentration:{value:round(nonnegative(absorbance,'Absorbance')/(positive(epsilon,'Extinction coefficient')*positive(path,'Path length'))),unit:'M'} }; }
export function odEstimate({ od, volume=1, coefficient=8e8 }) { return { cells:{value:round(nonnegative(od,'OD600')*positive(volume,'Volume')*positive(coefficient,'Calibration coefficient')),unit:'cells'} }; }
export function reagentMass({ mw, concentration, unit='mM', volume }) { return molarityToMass({mw,concentration,concentrationUnit:unit,volume,volumeUnit:'mL',massUnit:'g'}); }
export function composition({ massA, mwA, massB, mwB }) {
  const a=nonnegative(massA,'Mass A'), b=nonnegative(massB,'Mass B');
  if (a+b<=0) throw new Error('Total mass must be greater than zero.');
  const out={ wtA:{value:round(a/(a+b)*100),unit:'wt%'}, wtB:{value:round(b/(a+b)*100),unit:'wt%'} };
  if (Number(mwA)>0 && Number(mwB)>0) {
    const na=a/Number(mwA), nb=b/Number(mwB);
    out.atA={value:round(na/(na+nb)*100),unit:'at%'};
    out.atB={value:round(nb/(na+nb)*100),unit:'at%'};
  }
  return out;
}
export function formulation({ componentA, componentB }) {
  const a=positive(componentA,'Component A'), b=positive(componentB,'Component B');
  return { ratio:`${round(a/b)} : 1`, fractionA:{value:round(a/(a+b)*100),unit:'%'}, fractionB:{value:round(b/(a+b)*100),unit:'%'} };
}

function safeExpression(expression) {
  const raw=String(expression||'').trim();
  if (!raw) throw new Error('Enter an expression.');
  const names=['sin','cos','tan','asin','acos','atan','sqrt','log','ln','exp','abs','floor','ceil','round','pi'];
  const words=raw.match(/[A-Za-z]+/g)||[];
  if (words.some(w=>!names.includes(w.toLowerCase()) && w.toLowerCase()!=='e')) throw new Error('Unsupported function or symbol.');
  if (!/^[0-9A-Za-z+\-*/().,^\s]+$/.test(raw)) throw new Error('Unsupported character.');
  let x=raw.replace(/\^/g,'**')
    .replace(/\bpi\b/gi,'Math.PI').replace(/\be\b/g,'Math.E')
    .replace(/\bln\b/gi,'Math.log');
  for (const n of ['sin','cos','tan','asin','acos','atan','sqrt','log','exp','abs','floor','ceil','round']) x=x.replace(new RegExp(`\\b${n}\\b`,'gi'),`Math.${n}`);
  const value=Function(`"use strict"; return (${x});`)();
  if (!Number.isFinite(value)) throw new Error('Result is not finite.');
  return round(value);
}

function pretty(outputs) {
  return Object.entries(outputs).map(([key,v])=>typeof v==='string'?`${human(key)}: ${v}`:`${human(key)}: ${v.value} ${v.unit}`).join(' · ');
}
function human(s){return s.replace(/([A-Z])/g,' $1').replace(/^./,c=>c.toUpperCase());}
function field(id,label,unit='',value=''){return `<label>${label}<div class="input-unit"><input id="${id}" type="number" step="any" value="${value}">${unit?`<span>${unit}</span>`:''}</div></label>`;}
function textField(id,label,value='',placeholder=''){return `<label>${label}<input id="${id}" value="${String(value).replaceAll('"','&quot;')}" placeholder="${placeholder}"></label>`;}
function select(id,label,options,value){return `<label>${label}<select id="${id}">${options.map(o=>`<option ${o===value?'selected':''}>${o}</option>`).join('')}</select></label>`;}
function value(c,id){return c.querySelector('#'+id)?.value;}
function shell(id,body,note=''){return `<div class="tool-title"><div><span class="goose">Silly Goose</span><h3>${TOOL_LABELS[id]||human(id)}</h3></div><button class="close-tool" aria-label="Close tool">×</button></div>${note?`<p class="tool-note">${note}</p>`:''}${body}<div class="tool-actions"><button class="attach-calc" disabled>Attach calculation</button></div><output class="tool-output">—</output>`;}
function emit(c,id,inputs,outputs,warnings=[]){
  const detail={id:`calc_${Date.now()}_${Math.random().toString(36).slice(2,8)}`,schemaVersion:1,toolId:id,toolVersion:'1.0.0',inputs,outputs,warnings,createdAt:new Date().toISOString()};
  c.dataset.lastResult=JSON.stringify(detail);
  c.querySelector('.tool-output').textContent=pretty(outputs);
  c.querySelector('.attach-calc')?.removeAttribute('disabled');
  c.dispatchEvent(new CustomEvent('noor-tool-result',{bubbles:true,detail}));
  return detail;
}
function run(c,fn){try{fn();}catch(error){c.querySelector('.tool-output').textContent=error.message;}}

export function renderTool(container,id,context={}) {
  container.classList.remove('hidden');
  let body='';
  let setup=()=>{};
  if (id==='calculator') {
    body=`${textField('expr','Expression',context.expression||'','e.g. sqrt(2)+sin(pi/4)')}<button class="calc">Calculate</button>`;
    setup=()=>container.querySelector('.calc').onclick=()=>run(container,()=>emit(container,id,{expression:value(container,'expr')},{result:{value:safeExpression(value(container,'expr')),unit:''}}));
  } else if (id==='units') {
    body=`<div class="calc-row">${select('category','Category',['Volume','Mass','Length','Concentration'])}${field('uvalue','Value','','1')}${select('fromUnit','From',['mL','L','uL'])}${select('toUnit','To',['L','mL','uL'])}</div><button class="calc">Convert</button>`;
    setup=()=>{
      const category=container.querySelector('#category'), from=container.querySelector('#fromUnit'), to=container.querySelector('#toUnit');
      const units=()=>({Volume:Object.keys(V_FACTORS),Mass:Object.keys(M_FACTORS),Length:Object.keys(LENGTH_FACTORS),Concentration:Object.keys(C_FACTORS)})[category.value];
      const sync=()=>{const opts=units().map(x=>`<option>${x}</option>`).join('');from.innerHTML=opts;to.innerHTML=opts;}; category.onchange=sync; sync();
      container.querySelector('.calc').onclick=()=>run(container,()=>{const maps={Volume:V_FACTORS,Mass:M_FACTORS,Length:LENGTH_FACTORS,Concentration:C_FACTORS};const out=convert(value(container,'uvalue'),from.value,to.value,maps[category.value]);emit(container,id,{value:value(container,'uvalue'),from:from.value,to:to.value},{result:{value:round(out),unit:to.value}});});
    };
  } else if (id==='molarity') {
    body=`${select('mmode','Mode',['Molarity → mass','Mass → molarity'])}<div class="calc-row">${field('conc','Concentration','mM')}${field('mass','Mass','mg')}${field('vol','Volume','mL')}${field('mw','Molecular weight','g/mol')}</div><button class="calc">Calculate</button>`;
    setup=()=>container.querySelector('.calc').onclick=()=>run(container,()=>{const mode=value(container,'mmode');const inputs={mode,concentration:value(container,'conc'),mass:value(container,'mass'),volume:value(container,'vol'),mw:value(container,'mw')};const outputs=mode.startsWith('Molarity')?molarityToMass({concentration:inputs.concentration,volume:inputs.volume,mw:inputs.mw}):massToMolarity({mass:inputs.mass,volume:inputs.volume,mw:inputs.mw});emit(container,id,inputs,outputs);});
  } else if (id==='dilution') {
    body=`<div class="calc-row">${field('c1','Stock C1','mM')}${field('c2','Target C2','mM')}${field('v2','Final V2','mL')}</div><button class="calc">Calculate</button>`;
    setup=()=>container.querySelector('.calc').onclick=()=>run(container,()=>emit(container,id,{c1:value(container,'c1'),c2:value(container,'c2'),v2:value(container,'v2')},dilution({c1:value(container,'c1'),c2:value(container,'c2'),v2:value(container,'v2')})));
  } else if (id==='stoich') {
    body=`<div class="calc-row">${field('base','Limiting reagent','mmol')}${field('eq','Equivalents','','1')}${field('smw','Reagent MW','g/mol')}</div><button class="calc">Calculate reagent</button>`;
    setup=()=>container.querySelector('.calc').onclick=()=>run(container,()=>emit(container,id,{},stoichiometry({baseMmol:value(container,'base'),equivalents:value(container,'eq'),mw:value(container,'smw')})));
  } else if (id==='yield') {
    body=`<div class="calc-row">${field('actual','Actual yield')}${field('theory','Theoretical yield')}</div><button class="calc">Calculate % yield</button>`;
    setup=()=>container.querySelector('.calc').onclick=()=>run(container,()=>emit(container,id,{},percentYield({actual:value(container,'actual'),theoretical:value(container,'theory')})));
  } else if (id==='rotavap') {
    body=`${select('solvent','Solvent',SOLVENTS.map(s=>s.name))}<div class="solvent-card"></div>`;
    setup=()=>{const update=()=>{const s=SOLVENTS.find(x=>x.name===value(container,'solvent'));container.querySelector('.solvent-card').innerHTML=`<b>${s.name}</b><span>${s.formula}</span><div>Normal bp <strong>${s.bp} °C</strong></div><div>Density <strong>${s.density} g/cm³</strong></div><div>BÜCHI 40 °C boiling vacuum <strong>${s.vacuum40} mbar</strong></div>`;emit(container,id,{solvent:s.name},{boilingPoint:{value:s.bp,unit:'°C'},vacuum40:{value:s.vacuum40,unit:'mbar'}},['Verify against your instrument manual and SDS.']);};container.querySelector('#solvent').onchange=update;update();};
  } else if (id==='capacity') {
    body=`<div class="calc-row">${field('ne','Electrons n','','1')}${field('cmw','Molar mass','g/mol')}</div><button class="calc">Calculate capacity</button>`;
    setup=()=>container.querySelector('.calc').onclick=()=>run(container,()=>emit(container,id,{},theoreticalCapacity({electrons:value(container,'ne'),mw:value(container,'cmw')})));
  } else if (id==='crate') {
    body=`<div class="calc-row">${field('cap','Nominal capacity','mAh')}${field('rate','C-rate','C')}</div><button class="calc">Calculate current</button>`;
    setup=()=>container.querySelector('.calc').onclick=()=>run(container,()=>emit(container,id,{},cRate({capacity:value(container,'cap'),rate:value(container,'rate')})));
  } else if (id==='currentdensity') {
    body=`<div class="calc-row">${field('curr','Current','mA')}${field('area','Active area','cm²')}</div><button class="calc">Calculate</button>`;
    setup=()=>container.querySelector('.calc').onclick=()=>run(container,()=>emit(container,id,{},currentDensity({current:value(container,'curr'),area:value(container,'area')})));
  } else if (id==='faraday') {
    body=`<div class="calc-row">${field('charge','Charge','C')}${field('fe','Electrons n','','1')}</div><button class="calc">Calculate moles</button>`;
    setup=()=>container.querySelector('.calc').onclick=()=>run(container,()=>emit(container,id,{},faraday({charge:value(container,'charge'),electrons:value(container,'fe')})));
  } else if (id==='seeding') {
    body=`${select('vessel','Vessel',Object.keys(PLATES),'96-well')}<div class="vessel-hint"></div><div class="calc-row">${field('cpw','Cells / well')}${field('wells','Wells','','40')}${field('cellconc','Suspension','cells/mL')}${field('vpw','Volume / well','µL','100')}${field('over','Overage','%','10')}</div><button class="calc">Calculate seeding mix</button>`;
    setup=()=>{const sync=()=>{const p=PLATES[value(container,'vessel')];container.querySelector('.vessel-hint').textContent=`${p.wells} max · ${p.min}–${p.max} µL recommended range`;container.querySelector('#vpw').value=p.min;container.querySelector('#wells').value=Math.min(p.wells,40);};container.querySelector('#vessel').onchange=sync;sync();container.querySelector('.calc').onclick=()=>run(container,()=>{const inputs={vessel:value(container,'vessel'),cellsPerWell:value(container,'cpw'),wells:value(container,'wells'),suspensionCellsPerMl:value(container,'cellconc'),volumePerWellUl:value(container,'vpw'),overage:value(container,'over')};emit(container,id,inputs,cellSeeding(inputs));});};
  } else if (id==='rna') {
    body=`<div class="calc-row">${field('stock','RNA stock','ng/µL')}${field('target','Target','ng/µL')}${field('rxnvol','Final volume','µL')}</div><button class="calc">Calculate</button>`;
    setup=()=>container.querySelector('.calc').onclick=()=>run(container,()=>emit(container,id,{},rnaCdna({stock:value(container,'stock'),target:value(container,'target'),volume:value(container,'rxnvol')})));
  } else if (id==='buffer') {
    body=`${select('bmode','Mode',['Mass needed','Dilute stock'])}<div class="calc-row"><label>Common reagent<select id="reagent"><option value="">Custom</option>${Object.keys(REAGENTS).map(r=>`<option>${r}</option>`).join('')}</select></label>${field('bmw','Molecular weight','g/mol')}${field('bc','Target concentration','mM')}${field('bv','Final volume','mL')}${field('bsc','Stock concentration','mM')}</div><button class="calc">Calculate</button>`;
    setup=()=>{container.querySelector('#reagent').onchange=e=>{if(REAGENTS[e.target.value])container.querySelector('#bmw').value=REAGENTS[e.target.value];};container.querySelector('.calc').onclick=()=>run(container,()=>{const mode=value(container,'bmode');if(mode==='Mass needed')emit(container,id,{mode},reagentMass({mw:value(container,'bmw'),concentration:value(container,'bc'),volume:value(container,'bv')}));else emit(container,id,{mode},dilution({c1:value(container,'bsc'),c2:value(container,'bc'),v2:value(container,'bv')}));});};
  } else if (id==='spectro') {
    body=`<div class="calc-row">${field('abs','Absorbance A')}${field('eps','ε','M⁻¹cm⁻¹')}${field('path','Path length','cm','1')}</div><button class="calc">Beer–Lambert</button><details><summary>OD600 estimate</summary><div class="calc-row">${field('od','OD600')}${field('odvol','Culture volume','mL','1')}${field('coeff','Calibration','cells/mL/OD','800000000')}</div><button class="odcalc">Estimate cells</button></details>`;
    setup=()=>{container.querySelector('.calc').onclick=()=>run(container,()=>emit(container,id,{},beerLambert({absorbance:value(container,'abs'),epsilon:value(container,'eps'),path:value(container,'path')})));container.querySelector('.odcalc').onclick=()=>run(container,()=>emit(container,id,{},odEstimate({od:value(container,'od'),volume:value(container,'odvol'),coefficient:value(container,'coeff')}),['OD-to-cell conversion is calibration-dependent.']));};
  } else if (id==='pcr') {
    body=`<div class="calc-row">${field('prxn','Reactions','','10')}${field('pvol','Volume / reaction','µL','20')}${field('pover','Overage','%','10')}</div><div class="pcr-head"><span>Reagent</span><span>Stock</span><span>Final</span><span></span></div><div id="pcrRows"></div><button class="add-reagent" type="button">+ Reagent</button><button class="calc">Calculate master mix</button>`;
    setup=()=>setupPcr(container,id);
  } else if (id==='plate96') {
    body=`<div class="plate-controls"><input id="plateDefault" placeholder="Label selected wells"><button class="fill-selected">Fill selected</button><button class="clear-plate">Clear</button><button class="export-plate">Export CSV</button></div><div class="plate96"></div>`;
    setup=()=>setupPlate(container,id);
  } else if (id==='composition') {
    body=`<div class="calc-row">${field('ma','Mass A','g')}${field('mwa','MW A','g/mol')}${field('mb','Mass B','g')}${field('mwb','MW B','g/mol')}</div><button class="calc">Calculate composition</button>`;
    setup=()=>container.querySelector('.calc').onclick=()=>run(container,()=>emit(container,id,{},composition({massA:value(container,'ma'),mwA:value(container,'mwa'),massB:value(container,'mb'),mwB:value(container,'mwb')})));
  } else if (id==='heating') {
    body=`<div class="calc-row">${field('ts','Start','°C')}${field('te','End','°C')}${field('hr','Ramp','°C/min')}${field('dwell','Dwell','min','0')}</div><button class="calc">Calculate program</button>`;
    setup=()=>container.querySelector('.calc').onclick=()=>run(container,()=>emit(container,id,{},heatingRamp({start:value(container,'ts'),end:value(container,'te'),rate:value(container,'hr'),dwell:value(container,'dwell')})));
  } else if (id==='formulation') {
    body=`<div class="calc-row">${field('fa','Component A')}${field('fb','Component B')}</div><button class="calc">Calculate ratio</button>`;
    setup=()=>container.querySelector('.calc').onclick=()=>run(container,()=>emit(container,id,{},formulation({componentA:value(container,'fa'),componentB:value(container,'fb')})));
  } else if (id==='ee') {
    body=`<div class="calc-row">${field('initial','Initial payload')}${field('free','Free payload')}${field('recovered','Recovered particles')}${field('solids','Starting solids')}</div><button class="calc">Calculate</button>`;
    setup=()=>container.querySelector('.calc').onclick=()=>run(container,()=>emit(container,id,{},encapsulation({initial:value(container,'initial'),free:value(container,'free'),recovered:value(container,'recovered'),startingSolids:value(container,'solids')})));
  } else if (id==='rcf') {
    body=`${select('rcfmode','Mode',['RCF → RPM','RPM → RCF'])}<div class="calc-row">${field('rcf','RCF','×g')}${field('rpm','RPM')}${field('rad','Rotor radius','cm')}</div><button class="calc">Calculate</button>`;
    setup=()=>container.querySelector('.calc').onclick=()=>run(container,()=>{const mode=value(container,'rcfmode');emit(container,id,{mode},mode.startsWith('RCF')?rcfToRpm({rcf:value(container,'rcf'),radius:value(container,'rad')}):rpmToRcf({rpm:value(container,'rpm'),radius:value(container,'rad')}));});
  } else if (id==='timer') {
    body=`<div class="calc-row">${field('minutes','Duration','min','10')}</div><button class="start-timer">Start</button><button class="stop-timer">Stop</button><div class="timer-display">00:00</div>`;
    setup=()=>setupTimer(container,id);
  } else {
    body='<p>This tool is not available.</p>';
  }
  container.innerHTML=shell(id,body,id==='rotavap'?'Reference vacuum values are not a substitute for the instrument manual, solvent SDS, or local SOP.':'');
  container.querySelector('.close-tool').onclick=()=>container.classList.add('hidden');
  setup();
  container.querySelector('.attach-calc')?.addEventListener('click',()=>{
    if (!container.dataset.lastResult) return;
    container.dispatchEvent(new CustomEvent('noor-attach-calculation',{bubbles:true,detail:JSON.parse(container.dataset.lastResult)}));
  });
  container.scrollIntoView({behavior:'smooth',block:'center'});
}

function setupPcr(container,id) {
  const rows=container.querySelector('#pcrRows');
  const add=(name='Reagent',stock=10,final=1)=>{
    const row=document.createElement('div');
    row.className='pcr-row';
    row.innerHTML=`<input class="rname" value="${name}"><input class="rstock" type="number" step="any" value="${stock}"><input class="rfinal" type="number" step="any" value="${final}"><button type="button" aria-label="Remove">×</button>`;
    row.querySelector('button').onclick=()=>row.remove(); rows.appendChild(row);
  };
  add('Primer F',10,0.5); add('Primer R',10,0.5); add('dNTP',10,0.2);
  container.querySelector('.add-reagent').onclick=()=>add();
  container.querySelector('.calc').onclick=()=>run(container,()=>{
    const n=positive(value(container,'prxn'),'Reactions'), rv=positive(value(container,'pvol'),'Reaction volume'), extra=nonnegative(value(container,'pover'),'Overage')/100;
    const totalRxns=n*(1+extra); let perUsed=0;
    const reagents=[...rows.children].map(row=>{
      const name=row.querySelector('.rname').value.trim()||'Reagent';
      const stock=positive(row.querySelector('.rstock').value,`${name} stock`), final=nonnegative(row.querySelector('.rfinal').value,`${name} final`);
      const per=final/stock*rv; perUsed+=per;
      return {name,perReaction:round(per),total:round(per*totalRxns)};
    });
    if (perUsed>rv) throw new Error('Reagent volumes exceed the total reaction volume.');
    const outputs={totalReactions:{value:round(totalRxns),unit:'rxn'},masterMix:{value:round(rv*totalRxns),unit:'µL'},water:{value:round((rv-perUsed)*totalRxns),unit:'µL'}};
    emit(container,id,{reactions:n,reactionVolume:rv,overage:extra*100,reagents},outputs);
    container.querySelector('.tool-output').textContent=pretty(outputs)+' · '+reagents.map(r=>`${r.name}: ${r.total} µL`).join(' · ');
  });
}
function setupPlate(container,id) {
  const grid=container.querySelector('.plate96'), selected=new Set(), labels={};
  grid.innerHTML='<span></span>'+Array.from({length:12},(_,i)=>`<b>${i+1}</b>`).join('')+Array.from({length:8},(_,ri)=>`<b>${String.fromCharCode(65+ri)}</b>`+Array.from({length:12},(_,ci)=>{const w=String.fromCharCode(65+ri)+(ci+1);return `<button data-well="${w}" title="${w}">${w}</button>`;}).join('')).join('');
  grid.querySelectorAll('[data-well]').forEach(btn=>btn.onclick=()=>{btn.classList.toggle('selected');btn.classList.contains('selected')?selected.add(btn.dataset.well):selected.delete(btn.dataset.well);});
  container.querySelector('.fill-selected').onclick=()=>{const label=container.querySelector('#plateDefault').value.trim();selected.forEach(w=>{labels[w]=label;const b=grid.querySelector(`[data-well="${w}"]`);b.textContent=label||w;b.classList.remove('selected');});selected.clear();emit(container,id,{format:96,labels},{labeledWells:{value:Object.keys(labels).length,unit:'wells'}});};
  container.querySelector('.clear-plate').onclick=()=>{Object.keys(labels).forEach(k=>delete labels[k]);grid.querySelectorAll('[data-well]').forEach(b=>{b.textContent=b.dataset.well;b.classList.remove('selected');});selected.clear();};
  container.querySelector('.export-plate').onclick=()=>{const csv='Well,Label\n'+Array.from({length:96},(_,i)=>{const w=String.fromCharCode(65+Math.floor(i/12))+(i%12+1);return `${w},"${(labels[w]||'').replaceAll('"','""')}"`;}).join('\n');downloadText('noor-plate-96.csv',csv,'text/csv');};
}
function setupTimer(container,id) {
  let interval;
  const display=container.querySelector('.timer-display'), key='noor.activeTimer';
  const render=()=>{const end=Number(localStorage.getItem(key)||0);if(!end){display.textContent='00:00';return;}const left=Math.max(0,Math.ceil((end-Date.now())/1000));display.textContent=`${String(Math.floor(left/60)).padStart(2,'0')}:${String(left%60).padStart(2,'0')}`;if(left===0){clearInterval(interval);localStorage.removeItem(key);}};
  container.querySelector('.start-timer').onclick=()=>run(container,()=>{const mins=positive(value(container,'minutes'),'Duration');const end=Date.now()+mins*60000;localStorage.setItem(key,String(end));clearInterval(interval);interval=setInterval(render,250);render();emit(container,id,{minutes:mins},{endsAt:new Date(end).toISOString()});});
  container.querySelector('.stop-timer').onclick=()=>{clearInterval(interval);localStorage.removeItem(key);render();};
  interval=setInterval(render,1000);render();
}
export function downloadText(name,text,type='text/plain') {
  const blob=new Blob([text],{type}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=name; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1000);
}
export { convert, C_FACTORS, V_FACTORS, M_FACTORS, PLATES, REAGENTS };
