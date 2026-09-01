# NOOR

**NOOR** is a local-first electronic lab notebook built around the way different scientists actually work. Instead of exposing one giant generic calculator toolbox, NOOR changes its experiment templates, references, and **Silly Goose** calculations according to the scientific discipline and experimental context.

> **Working name.** NOOR can be renamed later without changing the underlying architecture.

## Status

**Functional v1 MVP.** The application is a zero-build browser app with local persistence, offline caching, structured research records, contextual scientific calculators, backup/export tools, and automated formula regression tests committed to the repository.

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

Experiment records store:

- project
- discipline and experiment type
- objective / hypothesis
- materials / sample IDs
- procedure / conditions
- **Observation** — factual record of what happened
- **Interpretation** — what the scientist thinks it means
- next step
- linked calculation snapshots

Observation and interpretation are deliberately separated in both the data model and interface.

### Protocols

Protocols include purpose, materials/equipment, steps, critical parameters, troubleshooting, safety notes, optimization notes, and explicit version numbers. Creating a new version produces a new record rather than overwriting the previous method.

### Synthesis records

Organic-chemistry synthesis records include reaction/product name, reagents/equivalents, conditions, workup, purification, yield, characterization, observations, and structure exchange fields.

Current ChemDraw-friendly exchange supports:

- SMILES copy/paste
- InChI
- MOL/SDF text import
- MOL export

An embedded 2D chemical drawing editor is **not yet bundled**; NOOR currently interoperates through standard structure formats so the core ELN remains lightweight and offline-friendly.

### Results & discussion

Project-level discussion notes separate:

- finding / question
- supporting evidence
- interpretation
- limitations / anomalies
- next experiment

This lets conclusions span multiple experiment records without modifying the raw records themselves.

## Local-first data and privacy

Research data is stored in the browser using **IndexedDB**. The service worker caches the application shell for offline use after it has been served over HTTP at least once.

NOOR currently has:

- local IndexedDB persistence
- legacy `localStorage` migration for early prototype experiments/tasks
- complete JSON backup/export
- JSON restore/merge
- experiment CSV export
- browser persistent-storage request
- offline application caching

### Important security limitation

NOOR does **not** currently encrypt IndexedDB itself. Local data inherits the security of the browser profile, operating system, and device. For confidential or regulated research, use appropriate institutional security controls and do not treat the current MVP as a validated regulated ELN.

The GitHub repository contains **application source code only**. It is public, so never commit unpublished research data, confidential records, credentials, patient information, or generated NOOR backup files into the repository.

## Scientific references

The reference hub contains universal physical constants plus discipline-specific quick references. The organic-chemistry solvent panel includes BÜCHI-style rotavap reference vacuum values for solvent boiling at 40 °C. Instrument manuals, SDS documents, institutional SOPs, and experimentally validated conditions always take priority over quick-reference values.

## Design

The interface uses a University at Buffalo-inspired palette without presenting NOOR as an official UB product. UB blue is an accent rather than the entire interface, with warm amber, orange, teal, green, violet, navy, white, and neutral tones used to distinguish scientific contexts.

## Run locally

NOOR has no build step or runtime dependencies.

```bash
git clone https://github.com/so-sonali/noor.git
cd noor
python -m http.server 8000
```

Open:

```text
http://localhost:8000
```

Serving over HTTP is recommended because ES modules, the service worker, installability, and offline caching behave more reliably than when opening `index.html` directly with `file://`.

## Tests

The repository includes zero-dependency JavaScript checks for both syntax and scientific formulas.

```bash
npm run check
npm test
```

Regression cases currently cover molarity→mass, dilution, lithium theoretical capacity, RCF↔RPM, cell seeding, encapsulation/loading/recovery, and Beer–Lambert concentration.

A GitHub Actions workflow is included under `.github/workflows/noor-checks.yml`. At the time it was added, the repository API reported no Actions runs, so the workflow may need GitHub Actions to be enabled in repository settings before cloud CI executes.

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

The v1 core is intentionally browser-only and single-user. Future production work can add an embedded chemical sketcher, file/attachment storage for raw instrument data, encrypted local databases, optional institutional/private-server sync, authentication/collaboration, audit trails/e-signatures, and validated compliance workflows where required.
