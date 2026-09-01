const NOOR_DATA = {
  disciplines: {
    "Organic Chemistry": {key:"orgo", accent:"amber", subtitle:"Reactions · structures · synthesis", tools:["Stoichiometry","Solvent guide","pKa reference","NMR solvents","Protecting groups"], prompts:["Reaction objective","Limiting reagent","Equivalents","Temperature/time","Workup","Purification","Yield"]},
    "Electrochemistry": {key:"electro", accent:"orange", subtitle:"Cells · cycling · electroanalysis", tools:["Theoretical capacity","C-rate","Nernst equation","Reference electrodes","Electrolyte windows"], prompts:["Cell chemistry","Electrode loading","Electrolyte","Voltage window","Current/C-rate","Cycles","Capacity retention"]},
    "Biochemistry": {key:"biochem", accent:"teal", subtitle:"Buffers · assays · biomolecules", tools:["Buffer equations","Protein/DNA conversions","Beer–Lambert","Enzyme kinetics","Amino acids"], prompts:["Biological question","Sample/cell line","Buffer/media","Concentration","Incubation","Assay/readout","Controls"]},
    "Materials Science": {key:"materials", accent:"green", subtitle:"Fabrication · characterization", tools:["Crystal data","Optical analysis","Film thickness","Mechanical units","Characterization checklist"], prompts:["Material/system","Fabrication","Processing conditions","Morphology","Composition","Optical/electrical property","Structure-property link"]},
    "Nanotechnology": {key:"nano", accent:"violet", subtitle:"Particles · surfaces · devices", tools:["DLS/PDI","Zeta potential","Loading/EE","Surface area","Dose conversions"], prompts:["Nanomaterial","Synthesis/formulation","Size/PDI","Zeta potential","Morphology","Loading/EE","Stability"]}
  },
  quotes: [
    {q:"If I have seen further it is by standing on the shoulders of Giants.",a:"Isaac Newton",s:"Letter to Robert Hooke, 5 February 1676"},
    {q:"What I cannot create I do not understand.",a:"Richard P. Feynman",s:"Final Caltech blackboard, 1988"},
    {q:"Chance favors only the prepared mind.",a:"Louis Pasteur",s:"University of Lille lecture, 1854 (commonly translated)"},
    {q:"Knowledge itself is power.",a:"Francis Bacon",s:"Meditationes Sacrae, 1597"}
  ],
  goose: {
    greetings:["Bench ready. What are we proving today?","Tiny steps, clean notes, fewer mysterious tubes.","Your future self would like you to label that sample.","Control group first. Heroics later."],
    tips:["Record lot numbers for critical reagents.","Separate observation from interpretation.","Write down deviations from the protocol immediately.","Add a negative and positive control where they make sense.","Save raw data before processing it.","If a result surprises you, document the surprise before explaining it away."]
  },
  constants: [
    ["Avogadro constant","Nₐ","6.022 140 76 × 10²³ mol⁻¹","exact"],
    ["Faraday constant","F","96 485.332 12 C mol⁻¹","CODATA"],
    ["Molar gas constant","R","8.314 462 618 J mol⁻¹ K⁻¹","CODATA"],
    ["Boltzmann constant","kB","1.380 649 × 10⁻²³ J K⁻¹","exact"],
    ["Planck constant","h","6.626 070 15 × 10⁻³⁴ J s","exact"],
    ["Speed of light","c","299 792 458 m s⁻¹","exact"],
    ["Elementary charge","e","1.602 176 634 × 10⁻¹⁹ C","exact"],
    ["Standard atmosphere","atm","101 325 Pa","exact"],
    ["Water ionic product, 25 °C","Kw","1.0 × 10⁻¹⁴","approx."],
    ["RT/F at 25 °C","RT/F","0.025693 V","approx."]
  ],
  pka: [
    ["Trifluoroacetic acid","TFA","0.23","water"],["Phosphoric acid (1st)","H₃PO₄","2.15","25 °C"],["Formic acid","HCO₂H","3.75","25 °C"],["Acetic acid","CH₃CO₂H","4.76","25 °C"],["Benzoic acid","PhCO₂H","4.20","25 °C"],["Pyridinium","C₅H₅NH⁺","5.23","conjugate acid"],["Phosphoric acid (2nd)","H₂PO₄⁻","7.20","25 °C"],["Ammonium","NH₄⁺","9.25","25 °C"],["Phenol","PhOH","≈10.0","water"],["Water","H₂O","15.7","as acid in water"],["Ethanol","EtOH","≈16","water"]
  ],
  resources:[
    ["PubChem","Compounds, properties, safety","https://pubchem.ncbi.nlm.nih.gov"],["NIST Chemistry WebBook","Spectra and thermochemical data","https://webbook.nist.gov/chemistry/"],["RCSB PDB","Macromolecular structures","https://www.rcsb.org"],["PubMed","Biomedical literature","https://pubmed.ncbi.nlm.nih.gov"],["Google Scholar","Broad scholarly search","https://scholar.google.com"],["Crossref","DOI metadata and lookup","https://search.crossref.org"],["ChemSpider","Chemical structure database","https://www.chemspider.com"],["NIST CODATA","Physical constants","https://physics.nist.gov/cuu/Constants/"],["Battery University","Battery fundamentals","https://batteryuniversity.com"],["Materials Project","Computed materials data","https://materialsproject.org"]
  ]
};
