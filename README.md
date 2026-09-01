# NOOR

**NOOR** is a local-first electronic lab notebook built around the way different scientists actually work. Instead of exposing one giant generic calculator toolbox, NOOR changes its experiment templates, references, and **Silly Goose** calculations according to the scientific discipline and experimental context.

> **Working name.** NOOR can be renamed later without changing the underlying architecture.

## Status

**Functional v1 MVP.** The application is a zero-build browser app with local persistence, offline caching, structured research records, contextual scientific calculators, backup/export tools, and automated scientific regression tests.

The repository's GitHub Actions check has passed with both JavaScript syntax validation and the calculator regression suite.

## Scientific workspaces

NOOR currently supports five benches:

- **Organic Chemistry** — reaction/synthesis records, workup/purification, stoichiometry, yield, solvent/rotavap references, molarity/dilution, timers, and structure exchange.
- **Electrochemistry / Battery Science** — cell/electrode templates, theoretical capacity, C-rate, current density, Faraday calculations, molarity/dilution, and timers.
- **Biochemistry** — cell culture/treatment, plate assays, PCR/qPCR, buffer work, cell seeding, RNA→cDNA dilution, plate planning, buffer/reagent prep, spectro/OD, PCR mix planning, and timers.
- **Materials Science** — materials synthesis, thin films/coatings, thermal treatment, characterization, composition, stoichiometry, heating ramps, molarity/dilution, and timers.
- **Nanotechnology** — nanoparticle/microfluidic formulation, DLS/zeta records, encapsulation/release, formulation ratios, EE/loading/recovery, RCF↔RPM, molarity/dilution, and timers.

### Silly Goose inside

The user's existing **SillyGoose** lab-assistant idea is integrated as the scientific calculation engine rather than a separate app or menu. A biochemist sees plate/cell/PCR tools; an organic chemist sees stoichiometry/yield/solvent tools; an electrochemist sees capacity/C-rate/current-density tools.

Calculations can be attached to the active experiment as snapshots containing tool ID, tool version, inputs, outputs, warnings, timestamp, discipline, and experiment linkage.

## ELN records

### Experiments

Experiment records store project, discipline/type, objective/hypothesis, materials/sample IDs, procedure/conditions, next step, and linked calculation snapshots. **Observation** and **Interpretation** are deliberately separate fields in both the interface and data model.

### Protocols

Protocols include purpose, materials/equipment, steps, critical parameters, troubleshooting, safety notes, optimization notes, and explicit version numbers. Creating a new version creates a new record rather than overwriting the previous method.

### Synthesis records

Organic-chemistry records include reaction/product name, reagents/equivalents, conditions, workup, purification, yield, characterization, observations, and structure exchange.

Current ChemDraw-friendly exchange supports:

- SMILES copy/paste
- InChI
- MOL/SDF text import
- MOL export

An embedded 2D chemical drawing editor is **not yet bundled**; NOOR currently interoperates through standard structure formats so the core remains lightweight and offline-friendly.

### Results & discussion

Project-level notes separate the finding/question, supporting evidence, interpretation, limitations/anomalies, and next experiment. This lets conclusions span experiments without modifying raw records.

## Local-first data and privacy

Research data is stored in the browser using **IndexedDB**. The service worker caches the application shell for offline use after it has been served over HTTP at least once.

NOOR currently includes:

- local IndexedDB persistence
- legacy `localStorage` migration for early prototype records
- complete JSON backup/export and restore/merge
- experiment CSV export
- browser persistent-storage request
- offline application caching
- ignored patterns for generated NOOR backups/CSV exports so they are less likely to be committed accidentally

### Important security limitation

NOOR does **not** currently encrypt IndexedDB itself. Local data inherits the security of the browser profile, operating system, and device. Do not treat this MVP as a validated regulated ELN without the appropriate institutional controls and validation work.

The GitHub repository contains **application source code only** and is public. Never commit unpublished research data, confidential records, credentials, patient information, or generated NOOR backup files into the repository.

## Scientific references

The reference hub contains universal physical constants plus discipline-specific quick references. The organic-chemistry solvent panel includes BÜCHI-style rotavap reference vacuum values for solvent boiling at 40 °C. Instrument manuals, SDS documents, institutional SOPs, and experimentally validated conditions always take priority over quick-reference values.

## Design

The interface uses a University at Buffalo-inspired palette without presenting NOOR as an official UB product. UB blue is an accent rather than the entire interface, with amber, orange, teal, green, violet, navy, white, and neutral tones distinguishing scientific contexts.

## Run locally

NOOR has no build step or runtime dependencies.

```bash
git clone https://github.com/so-sonali/noor.git
cd noor
python -m http.server 8000
```

Open `http://localhost:8000`.

Serving over HTTP is recommended because ES modules, the service worker, installability, and offline caching behave more reliably than when opening `index.html` directly with `file://`.

## Tests

```bash
npm run check
npm test
```

Regression cases cover molarity→mass, dilution, lithium theoretical capacity, RCF↔RPM, cell seeding, encapsulation/loading/recovery, and Beer–Lambert concentration. GitHub Actions runs the same syntax and scientific tests on pushes and pull requests.

## Project structure

```text
index.html                 full ELN interface
styles.css                 responsive UB-inspired UI
manifest.webmanifest       installable PWA metadata
sw.js                      offline application cache
js/config.js               disciplines, tools, references, solvents, quotes
js/storage.js              IndexedDB, migration, backup/import
js/tools.js                Silly Goose scientific calculation engine + tool UIs
js/app.js                  ELN records, navigation, search, exports, integration
tests/tool-tests.mjs       scientific regression tests
.github/workflows/         syntax/test CI
```

## Next advanced integrations

The v1 core is intentionally browser-only and single-user. Production extensions can add an embedded chemical sketcher, raw instrument-file attachments, encrypted local databases, optional institutional/private-server sync, authentication/collaboration, audit trails/e-signatures, and validated compliance workflows where required.
