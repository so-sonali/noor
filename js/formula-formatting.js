const FORMULAS={
'n = m / M':'<i>n</i> = <i>m</i> / <i>M</i>',
'C = n / V':'<i>C</i> = <i>n</i> / <i>V</i>',
'm = C × V × M':'<i>m</i> = <i>C</i> × <i>V</i> × <i>M</i>',
'C₁V₁ = C₂V₂':'<i>C</i><sub>1</sub><i>V</i><sub>1</sub> = <i>C</i><sub>2</sub><i>V</i><sub>2</sub>',
'equivᵢ = nᵢ / nref':'equiv<sub>i</sub> = <i>n</i><sub>i</sub> / <i>n</i><sub>ref</sub>',
'extent = min(nᵢ / νᵢ)':'extent = min(<i>n</i><sub>i</sub> / ν<sub>i</sub>)',
'nproduct,theor = extent × νproduct':'<i>n</i><sub>product,theor</sub> = extent × ν<sub>product</sub>',
'mtheor = nproduct,theor × Mproduct':'<i>m</i><sub>theor</sub> = <i>n</i><sub>product,theor</sub> × <i>M</i><sub>product</sub>',
'% yield = 100 × mactual / mtheor':'% yield = 100 × <i>m</i><sub>actual</sub> / <i>m</i><sub>theor</sub>',
'Rf = distance spot / distance solvent front':'<i>R</i><sub>f</sub> = distance<sub>spot</sub> / distance<sub>solvent front</sub>',
'm = ρV':'<i>m</i> = ρ<i>V</i>',
'log₁₀P = A − B/(C + T)':'log<sub>10</sub><i>P</i> = <i>A</i> − <i>B</i>/(<i>C</i> + <i>T</i>)',
'Vstock = Ntarget / Cstock':'<i>V</i><sub>stock</sub> = <i>N</i><sub>target</sub> / <i>C</i><sub>stock</sub>',
'Nwell = Cstock × Vwell':'<i>N</i><sub>well</sub> = <i>C</i><sub>stock</sub> × <i>V</i><sub>well</sub>',
'VRNA = mtarget / CRNA':'<i>V</i><sub>RNA</sub> = <i>m</i><sub>target</sub> / <i>C</i><sub>RNA</sub>',
'Vstock = Cfinal × Vrxn / Cstock':'<i>V</i><sub>stock</sub> = <i>C</i><sub>final</sub> × <i>V</i><sub>rxn</sub> / <i>C</i><sub>stock</sub>',
'Vtotal = Vper rxn × Nrxn × (1 + overage)':'<i>V</i><sub>total</sub> = <i>V</i><sub>per rxn</sub> × <i>N</i><sub>rxn</sub> × (1 + overage)',
'A = εbc':'<i>A</i> = ε<i>b</i><i>c</i>',
'Acorr = Asample − Ablank':'<i>A</i><sub>corr</sub> = <i>A</i><sub>sample</sub> − <i>A</i><sub>blank</sub>',
'pH = pKa + log₁₀([A⁻]/[HA])':'pH = p<i>K</i><sub>a</sub> + log<sub>10</sub>([A<sup>−</sup>]/[HA])',
'DF = Vfinal / Vsample':'DF = <i>V</i><sub>final</sub> / <i>V</i><sub>sample</sub>',
'Viability % = 100 × signaltreated / signalcontrol':'Viability % = 100 × signal<sub>treated</sub> / signal<sub>control</sub>',
'Qtheor = nF / (3.6M)':'<i>Q</i><sub>theor</sub> = <i>nF</i> / (3.6<i>M</i>)',
'I = C-rate × Qnominal':'<i>I</i> = C-rate × <i>Q</i><sub>nominal</sub>',
'mA = mactive / A':'<i>m</i><sub>A</sub> = <i>m</i><sub>active</sub> / <i>A</i>',
'QA = Qspecific × mA':'<i>Q</i><sub>A</sub> = <i>Q</i><sub>specific</sub> × <i>m</i><sub>A</sub>',
'j = I / A':'<i>j</i> = <i>I</i> / <i>A</i>',
'N/P = Qareal,negative / Qareal,positive':'N/P = <i>Q</i><sub>areal,negative</sub> / <i>Q</i><sub>areal,positive</sub>',
'E/C = Velectrolyte / Qcell':'E/C = <i>V</i><sub>electrolyte</sub> / <i>Q</i><sub>cell</sub>',
'E = ∫ V dQ ≈ Vavg × Q':'<i>E</i> = ∫ <i>V</i> d<i>Q</i> ≈ <i>V</i><sub>avg</sub> × <i>Q</i>',
'Esp = E / m':'<i>E</i><sub>sp</sub> = <i>E</i> / <i>m</i>',
'P = E / Δt = VI':'<i>P</i> = <i>E</i> / Δ<i>t</i> = <i>VI</i>',
'E = E° − (RT/nF) ln Q':'<i>E</i> = <i>E</i><sup>°</sup> − (<i>RT</i>/<i>nF</i>) ln <i>Q</i>',
'm = Q M / (nF)':'<i>m</i> = <i>QM</i> / (<i>nF</i>)',
'CE % = 100 × Qdischarge / Qcharge':'CE % = 100 × <i>Q</i><sub>discharge</sub> / <i>Q</i><sub>charge</sub>',
'Retention % = 100 × Qcycle / Qinitial':'Retention % = 100 × <i>Q</i><sub>cycle</sub> / <i>Q</i><sub>initial</sub>',
'C = m / V':'<i>C</i> = <i>m</i> / <i>V</i>',
'EE % = 100 × (minitial − mfree) / minitial':'EE % = 100 × (<i>m</i><sub>initial</sub> − <i>m</i><sub>free</sub>) / <i>m</i><sub>initial</sub>',
'DL % = 100 × mencapsulated / mrecovered particles':'DL % = 100 × <i>m</i><sub>encapsulated</sub> / <i>m</i><sub>recovered particles</sub>',
'Recovery % = 100 × mrecovered / mstarting solids':'Recovery % = 100 × <i>m</i><sub>recovered</sub> / <i>m</i><sub>starting solids</sub>',
'RCF = 1.118×10⁻⁵ × r × RPM²':'RCF = 1.118×10<sup>−5</sup> × <i>r</i> × RPM<sup>2</sup>',
'RPM = √(RCF / (1.118×10⁻⁵ r))':'RPM = √(RCF / (1.118×10<sup>−5</sup> <i>r</i>))',
'A = 4πr²':'<i>A</i> = 4π<i>r</i><sup>2</sup>',
'V = 4πr³/3':'<i>V</i> = 4π<i>r</i><sup>3</sup>/3',
'N ≈ mtotal / (ρ × 4πr³/3)':'<i>N</i> ≈ <i>m</i><sub>total</sub> / (ρ × 4π<i>r</i><sup>3</sup>/3)',
'Atotal ≈ N × 4πr²':'<i>A</i><sub>total</sub> ≈ <i>N</i> × 4π<i>r</i><sup>2</sup>',
'E = P × t':'<i>E</i> = <i>P</i> × <i>t</i>',
'E/V = P t / Vsample':'<i>E</i>/<i>V</i> = <i>Pt</i> / <i>V</i><sub>sample</sub>',
'xᵢ = nᵢ / Σn':'<i>x</i><sub>i</sub> = <i>n</i><sub>i</sub> / Σ<i>n</i>',
'wt%ᵢ = 100 × mᵢ / Σm':'wt%<sub>i</sub> = 100 × <i>m</i><sub>i</sub> / Σ<i>m</i>',
'at%ᵢ = 100 × nᵢ / Σn':'at%<sub>i</sub> = 100 × <i>n</i><sub>i</sub> / Σ<i>n</i>',
'ρ = m / V':'ρ = <i>m</i> / <i>V</i>',
'nλ = 2d sinθ':'<i>n</i>λ = 2<i>d</i> sin θ',
'D = Kλ / (β cosθ)':'<i>D</i> = <i>K</i>λ / (β cos θ)',
'βsample ≈ √(βmeas² − βinst²)':'β<sub>sample</sub> ≈ √(β<sub>meas</sub><sup>2</sup> − β<sub>inst</sub><sup>2</sup>)',
't = m / (ρA)':'<i>t</i> = <i>m</i> / (ρ<i>A</i>)',
'R = t / Δt':'<i>R</i> = <i>t</i> / Δ<i>t</i>',
'Δt = (Tfinal − Tinitial) / ramp rate':'Δ<i>t</i> = (<i>T</i><sub>final</sub> − <i>T</i><sub>initial</sub>) / ramp rate',
'ttotal = tramp up + tdwell + tramp down':'<i>t</i><sub>total</sub> = <i>t</i><sub>ramp up</sub> + <i>t</i><sub>dwell</sub> + <i>t</i><sub>ramp down</sub>',
'Porosity % ≈ 100 × (1 − ρbulk/ρskeletal)':'Porosity % ≈ 100 × (1 − ρ<sub>bulk</sub>/ρ<sub>skeletal</sub>)',
'Rs = ρe / t':'<i>R</i><sub>s</sub> = ρ<sub>e</sub> / <i>t</i>'
};

function formatEquations(){
  document.querySelectorAll('.equation-card code').forEach(code=>{
    const raw=code.textContent.trim();
    const html=FORMULAS[raw];
    if(html) code.innerHTML=html;
  });
}

function styleNotation(){
  if(document.querySelector('#formulaNotationStyles'))return;
  const s=document.createElement('style');s.id='formulaNotationStyles';
  s.textContent='.equation-card code sub,.equation-card code sup{font-size:.72em;line-height:0}.equation-card code sub{vertical-align:-.32em}.equation-card code sup{vertical-align:.48em}.equation-card code i{font-family:Georgia,serif;font-style:italic;font-weight:600}';
  document.head.appendChild(s);
}

function wire(){
  styleNotation();formatEquations();
  const root=document.querySelector('#references');
  if(root)new MutationObserver(()=>formatEquations()).observe(root,{childList:true,subtree:true});
}
if(typeof document!=='undefined'){
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(wire,160));
  else setTimeout(wire,160);
}
