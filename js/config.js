if (typeof document !== 'undefined') {
  import('./reference-enhancements.js');
  import('./formula-formatting.js');
  import('./postdoc-workflow.js');
  import('./handwriting.js');
  import('./project-linking.js');
}

export const DISCIPLINES = {
  orgo: {
    id: 'orgo', label: 'Organic Chemistry', className: 'orgo',
    blurb: 'Reactions, purification, solvent handling, structure exchange and yield.',
    templates: ['Reaction / synthesis','Workup & purification','Column chromatography','Recrystallization'],
    tools: ['molarity','dilution','stoich','yield','rotavap','timer'],
    references: [
      ['Reaction math','equivalents · limiting reagent · theoretical yield'],
      ['Solvent data','bp · mp · density · 40 °C rotavap vacuum'],
      ['Structure exchange','SMILES · InChI · MOL/SDF · ChemDraw copy/paste'],
      ['Spectroscopy notes','NMR solvent peaks · UV/Vis · IR'],
      ['Safety','SDS and institution SOP always take priority']
    ]
  },
  electro: {
    id: 'electro', label: 'Electrochemistry', className: 'electro',
    blurb: 'Electrodes, cells, cycling, current, capacity and Faradaic calculations.',
    templates: ['Coin cell assembly','Galvanostatic cycling','Cyclic voltammetry','Electrode preparation'],
    tools: ['capacity','crate','currentdensity','faraday','molarity','dilution','timer'],
    references: [
      ['Faraday constant','96 485.332 12 C mol⁻¹'],
      ['Nernst equation','E = E° − RT/(nF) ln Q'],
      ['C-rate','1C = nominal capacity delivered in 1 hour'],
      ['Current density','current / active area'],
      ['Capacity','theoretical Q = nF/(3.6M) mAh g⁻¹']
    ]
  },
  biochem: {
    id: 'biochem', label: 'Biochemistry', className: 'biochem',
    blurb: 'Cells, plates, PCR/qPCR, buffers, absorbance and dilution workflows.',
    templates: ['Cell culture / treatment','96-well assay','PCR / qPCR','Protein / buffer experiment'],
    tools: ['molarity','dilution','seeding','rna','plate96','buffer','spectro','pcr','timer'],
    references: [
      ['Beer–Lambert','A = εbc'],
      ['Common buffers','MES ~6.15 · phosphate ~7.21 · HEPES ~7.55 · Tris ~8.06 pKa near room temperature'],
      ['Plate formats','6 · 12 · 24 · 48 · 96 · 384 wells'],
      ['PCR planning','explicit stock/final units and master-mix overage'],
      ['OD600','conversion to cells depends on organism/instrument; treat as calibrated assumption']
    ]
  },
  materials: {
    id: 'materials', label: 'Materials Science', className: 'materials',
    blurb: 'Synthesis, composition, thin films, thermal processing and characterization.',
    templates: ['Material synthesis','Thin film / coating','Thermal treatment','Characterization run'],
    tools: ['molarity','dilution','stoich','composition','heating','timer'],
    references: [
      ['Bragg law','nλ = 2d sin θ'],
      ['Composition','track mass %, mol %, and atomic % explicitly'],
      ['Thermal program','ramp rate · dwell · atmosphere · cooling'],
      ['Characterization','instrument settings belong with the sample record'],
      ['Precursors','record chemical form/hydration state with molecular weight']
    ]
  },
  nano: {
    id: 'nano', label: 'Nanotechnology', className: 'nano',
    blurb: 'Formulation, microfluidics, particles, encapsulation, centrifugation and characterization.',
    templates: ['Nanoparticle formulation','Microfluidic formulation','DLS / zeta characterization','Encapsulation / release'],
    tools: ['molarity','dilution','formulation','ee','rcf','timer'],
    references: [
      ['Encapsulation efficiency','(initial − free) / initial × 100'],
      ['Drug loading','encapsulated drug / recovered nanoparticle mass × 100'],
      ['Recovery','recovered material / starting solids × 100'],
      ['DLS','record size distribution, PDI, dispersant, temperature and dilution'],
      ['RCF/RPM','RCF = 1.118×10⁻⁵ × r(cm) × RPM²']
    ]
  }
};

export const TOOL_LABELS = {
  molarity:'Molarity ⇄ mass', dilution:'Dilution', stoich:'Reaction stoichiometry', yield:'Yield', rotavap:'Solvent / rotavap',
  capacity:'Theoretical capacity', crate:'C-rate', currentdensity:'Current density', faraday:'Faraday',
  seeding:'Cell seeding', rna:'RNA → cDNA dilution', plate96:'Plate builder', buffer:'Buffer / reagent prep', spectro:'Spectro / OD', pcr:'PCR mix planner',
  composition:'wt% / at%', heating:'Heating ramp', formulation:'Formulation ratios', ee:'EE / loading / recovery', rcf:'RCF ⇄ RPM', timer:'Experiment timer'
};

export const UNIVERSAL_CONSTANTS = [
  ['Avogadro constant','6.022 140 76 × 10²³ mol⁻¹'],
  ['Faraday constant','96 485.332 12 C mol⁻¹'],
  ['Gas constant R','8.314 462 618 J mol⁻¹ K⁻¹'],
  ['Planck constant','6.626 070 15 × 10⁻³⁴ J s'],
  ['Speed of light','299 792 458 m s⁻¹'],
  ['Elementary charge','1.602 176 634 × 10⁻¹⁹ C']
];

// Rotavap entries are from BÜCHI Rotavapor R-100/R-300 solvent tables: vacuum for solvent boiling at 40 °C.
export const SOLVENTS = [
  {name:'Acetone', formula:'C3H6O', mw:58.1, bp:56, density:0.790, vacuum40:556},
  {name:'Dichloromethane', formula:'CH2Cl2', mw:84.9, bp:40, density:1.327, vacuum40:850},
  {name:'Ethanol', formula:'C2H6O', mw:46.0, bp:79, density:0.789, vacuum40:175},
  {name:'Ethyl acetate', formula:'C4H8O2', mw:88.1, bp:77, density:0.900, vacuum40:240},
  {name:'Hexane', formula:'C6H14', mw:86.2, bp:69, density:0.660, vacuum40:360},
  {name:'Isopropanol', formula:'C3H8O', mw:60.1, bp:82, density:0.786, vacuum40:137},
  {name:'Methanol', formula:'CH4O', mw:32.0, bp:65, density:0.791, vacuum40:337},
  {name:'Toluene', formula:'C7H8', mw:92.2, bp:111, density:0.867, vacuum40:77},
  {name:'THF', formula:'C4H8O', mw:72.1, bp:67, density:0.889, vacuum40:374},
  {name:'Water', formula:'H2O', mw:18.0, bp:100, density:1.000, vacuum40:72}
];

export const QUOTES = [
  {
    text:'Do not use your energy to worry. Use your energy to believe, to create, to learn, to think and to grow.',
    author:'Richard Feynman',
    source:''
  }
];

export function disciplineFromLabel(label){ return Object.values(DISCIPLINES).find(d=>d.label===label) || DISCIPLINES.biochem; }
