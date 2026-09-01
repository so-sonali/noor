# NOOR — How to Use It

NOOR is a local-first electronic lab notebook for **Organic Chemistry, Electrochemistry / Battery Science, Biochemistry / Cell Biology, Materials Science, and Nanotechnology**.

**Open NOOR:** https://so-sonali.github.io/noor/

You do not need to create an account. Open the app in a supported browser and start working. Your notebook data is saved locally in that browser/device rather than in this public GitHub repository.

> **Important:** NOOR currently stores research data locally in your browser using IndexedDB. If you open NOOR on another device or browser, that device starts with its own notebook. Use the backup tools regularly if the data matters.

---

## 1. Start using NOOR

Open the live app:

**https://so-sonali.github.io/noor/**

You can use it directly in Safari, Chrome, Edge, and other modern browsers.

### Install it like an app

NOOR is a Progressive Web App (PWA), so you can keep it on your phone, tablet, or desktop without using an app store.

**iPhone / iPad**

1. Open NOOR in Safari.
2. Tap **Share**.
3. Choose **Add to Home Screen**.
4. Open NOOR from the new Home Screen icon.

**Android**

1. Open NOOR in Chrome.
2. Use the browser menu.
3. Choose **Install app** or **Add to Home screen**.

**Desktop**

Open NOOR in Chrome or Edge and use the browser's **Install** option when available.

Once NOOR has been loaded and cached, the app shell can also work offline. New updates are fetched when you are online.

---

## 2. Choose the scientific context you are working in

NOOR currently supports five scientific areas:

- **Organic Chemistry**
- **Electrochemistry / Battery Science**
- **Biochemistry / Cell Biology**
- **Materials Science**
- **Nanotechnology**

Each area has its own experiment templates, scientific references, and contextual **Silly Goose** calculation tools.

For example, a biochemistry workflow exposes cell seeding, plate, PCR, buffer, and spectrophotometry tools, while an organic chemistry workflow emphasizes stoichiometry, equivalents, yield, solvent properties, and rotavap guidance.

---

## 3. Create an experiment

Go to **Experiments** and select **+ New**.

An experiment can contain:

- Title
- Project
- Scientific discipline
- Experiment type
- Objective / hypothesis
- Materials / samples
- Procedure / conditions
- Observation
- Interpretation
- Next step
- Photos and evidence images
- Files / raw data
- Calculations
- Protocol provenance and deviations
- Sample and instrument links

NOOR deliberately keeps **Observation** separate from **Interpretation** so the record of what happened remains distinct from what you think it means.

### Type or handwrite

Long-form experiment fields support **Type | Write**.

Choose **Type** for a normal text field.

Choose **Write** to open the handwriting page. On an iPad or compatible tablet you can write directly with Apple Pencil or another stylus.

The handwriting workspace includes:

- Pen
- Highlighter
- Eraser
- Ink color
- Pen thickness
- Undo / redo
- Multiple pages
- Blank, ruled, grid, or dot paper

Handwriting is saved as **editable stroke data**, not only as a screenshot. NOOR also creates a PDF archival copy for that handwritten field.

You can mix both modes within the same experiment. For example, the procedure may be typed while the observation is handwritten.

---

## 4. Add photos and result images

While creating or editing an experiment, use the **Results / evidence photos** area.

You can:

- **Take photo** — opens the device camera when supported
- **Add images** — selects one or more images from Photos or Files

Images can include metadata such as:

- Caption / result note
- Sample ID
- Instrument
- Timestamp
- Original file information

Images are linked to that experiment and displayed in its result gallery.

Camera photos may be resized to reduce unnecessary browser-storage use. Images deliberately selected through **Add images** can retain their original image data for scientific use.

---

## 5. Attach raw data and other files

NOOR can attach general research files to experiments, including items such as:

- CSV files
- PDFs
- Spectra exports
- Instrument output
- Processed-data files
- Figures
- Other supporting research files

These attachments stay associated with the experiment so the experiment record can connect the bench work to its evidence and analysis.

For very large instrument datasets, keep an eye on local browser storage and preserve external/raw-data archives where appropriate.

---

## 6. Use Projects

Use the **Projects** workspace to organize related experiments into a larger research question.

A project can track:

- Hypothesis / objective
- Current status
- Milestone
- Blockers
- Experiments
- Samples
- Files
- Decisions
- Analyses

This is useful for seeing where a project currently stands without opening every experiment individually.

---

## 7. Register samples and follow sample lineage

NOOR treats samples as their own research records.

A sample can contain information such as:

- Sample ID
- Batch
- Storage location / condition
- Source experiment
- Parent sample
- Derived samples

Use sample lineage when one experiment produces material that is later characterized or reused in another experiment.

For example:

`Synthesis experiment → nanoparticle batch → DLS → TEM → release study`

The same sample identity can remain connected across that chain.

---

## 8. Repeat or clone an experiment

When you want to repeat an experiment with only a few changes, use the clone / repeat workflow rather than recreating the record manually.

NOOR can retain the relationship to the previous experiment and record **What changed?**

Examples:

- Sonication: 2 min → 4 min
- Polymer: 5 mg → 7.5 mg
- Flow rate: 1.0 → 1.5 mL/min

This makes optimization history much easier to reconstruct later.

Experiment status can also distinguish records such as:

- Planned
- In progress
- Successful
- Partial
- Failed
- Inconclusive
- Repeat needed

Failed experiments are worth documenting: troubleshooting information often becomes valuable later.

---

## 9. Compare experiments

Use the experiment-comparison tools when several runs belong to the same optimization series.

Select experiments and compare their conditions and results side-by-side. NOOR can highlight values that differ between runs so you can quickly see which variables changed.

This is especially useful for formulation optimization, synthesis optimization, cell-treatment comparisons, battery conditions, and materials-processing studies.

---

## 10. Use protocols and protocol versions

The **Protocols** section stores reusable methods.

A protocol can include:

- Purpose
- Materials / equipment
- Steps
- Critical parameters
- Troubleshooting
- Safety notes
- Optimization notes
- Version number

When a method changes, create a **new version** rather than overwriting the old one.

Experiments can link to the protocol version actually used and record any **protocol deviation** made during that experiment.

---

## 11. Use synthesis records

The **Synthesis** section is optimized for chemistry-oriented records.

It supports fields such as:

- Reaction / product name
- Reagents and equivalents
- Conditions
- Workup
- Purification
- Yield
- Characterization
- Observation

Structure exchange supports standard text/file formats including:

- SMILES
- InChI
- MOL / SDF text
- MOL export

This allows structure information to move between NOOR and external chemistry software without making NOOR depend on a full chemical drawing package.

---

## 12. Use Silly Goose calculations inside the experiment workflow

Silly Goose is NOOR's contextual scientific calculation layer.

It is not a separate generic calculator page. The tools shown depend on the scientific context.

### Organic Chemistry

Molarity ↔ mass, dilution, equivalents, limiting reagent, theoretical yield, reaction stoichiometry, solvent properties, boiling points, density, miscibility, TLC/Rf notes, and rotavap pressure guidance.

### Biochemistry / Cell Biology

Cell seeding, plate layouts, RNA → cDNA dilution, PCR mix planning, buffer preparation, spectro/OD calculations, dilution, and timers.

### Electrochemistry / Battery Science

C-rate, theoretical capacity, areal loading, current density, Faraday calculations, N/P concepts, potentials, energy/power relations, and related electrochemical references.

### Nanotechnology

Formulation ratios, concentration/dilution, encapsulation efficiency, loading %, recovery %, RCF ↔ RPM, DLS-related notes, particle/surface-area calculations, and sonication records.

### Materials Science

Precursor stoichiometry, wt% / at%, composition, density, crystallite-size relations, film thickness, annealing/heating ramps, and deposition-related references.

Calculations can be attached to the active experiment as snapshots so the numerical work remains connected to the record that used it.

---

## 13. Use the Scientific Reference Hub

The **Reference** section is designed as an in-app scientific reference desk.

It includes:

- Universal scientific constants
- Interactive periodic table
- Discipline-specific formulas and equations
- Unit-aware equation notes
- Solvent/reference information
- Recommended scientific books and reference texts

Use these as quick references. Instrument manuals, safety data sheets, institutional SOPs, and validated experimental procedures should always take priority where applicable.

---

## 14. Use Data & Analysis

NOOR includes lightweight analysis tools for quick scientific checks.

For suitable CSV data you can:

- Import the data
- Select X and Y columns
- Plot the data
- Calculate basic statistics such as n, mean, SD, minimum, and maximum
- Link the analysis back to the experiment

This is intended for quick notebook-level analysis, not as a replacement for full scientific software such as Origin, Prism, MATLAB, R, or Python.

---

## 15. Save literature and research decisions

Use the literature manager to keep papers connected to the work they influenced.

A literature record can include DOI, PMID, URL, project/experiment links, why the paper matters, and which method or idea was adapted.

Use the **Decision log** for decisions such as:

- Why a condition was abandoned
- Why a method was changed
- Why a sample was excluded
- What evidence supported the decision
- What should happen next

This prevents important scientific reasoning from disappearing between experiments.

---

## 16. Prepare manuscript and handoff packages

For mature projects, NOOR can assemble structured research information into exportable packages.

### Manuscript-oriented package

Can gather items such as:

- Protocol provenance
- Experiment results
- Analyses
- Discussion notes
- Literature links

### Lab handoff package

Can organize:

- Project status
- Sample lineage
- Important experiments
- Failures / troubleshooting
- Decisions
- Next experiments
- Data inventory

These exports are intended to help organize a project for writing, collaboration, or transition to another researcher.

---

## 17. Search your notebook

Use **Search** to find records across the notebook.

Depending on the record type, search can surface experiments, projects, samples, instruments, literature, decisions, analyses, and other saved research information.

Use consistent sample IDs and descriptive experiment titles to make retrieval easier later.

---

## 18. Back up your data

This is one of the most important parts of using NOOR.

Go to **Backup & Export** regularly.

NOOR supports a full JSON backup containing locally stored notebook records and supported attachments, including editable handwriting records. Backups can later be restored into NOOR.

You can also export experiment information in CSV form where appropriate.

### Recommended habit

Back up after important experiments and keep copies somewhere outside the browser, such as an approved institutional storage location, encrypted drive, or other storage system appropriate for your research.

---

## 19. Understand where your data is stored

NOOR is currently **local-first**.

If ten people open the same public NOOR link, they do **not** automatically share one notebook. Each person's research data is stored in that person's own browser/device.

The public GitHub repository contains the application source code — not each user's experiment data.

Current behavior:

- No account is required.
- No automatic cross-device sync is provided.
- A notebook on your iPad is separate from a notebook opened on your laptop unless you move/restore a backup.
- Clearing browser/site data may remove locally stored NOOR records.
- Available storage depends on the device and browser.
- NOOR does not impose an artificial experiment/page limit; practical limits come from available device/browser storage.

Use the storage information in **Backup & Export** to monitor browser usage, especially when storing many images, PDFs, and raw-data files.

---

## 20. Privacy and security notes

NOOR's IndexedDB storage is **not currently encrypted by NOOR itself**. The data inherits the protection of the browser profile, operating system, and device.

Do not treat the current project as a validated regulated ELN without the institutional controls, validation, audit trails, signatures, security, and compliance requirements appropriate to your environment.

Do not commit unpublished research data, credentials, confidential data, patient information, or NOOR backup files into the public GitHub repository.

---

## Quick workflow

A typical NOOR workflow can look like:

**Create Project → Create Protocol → Start Experiment → Register Sample → Record Procedure → Type or Handwrite Observations → Take Photos / Attach Raw Data → Run Silly Goose Calculations → Analyze Data → Interpret Result → Record Decision → Clone Next Experiment → Compare Runs → Back Up → Prepare Manuscript / Handoff**

That complete research chain is the main idea behind NOOR.

---

## For developers

NOOR is a browser-based PWA with no application build step required for basic use. If you want to run a local development copy:

```bash
git clone https://github.com/so-sonali/noor.git
cd noor
python -m http.server 8000
```

Then open `http://localhost:8000`.

To run the repository checks:

```bash
npm run check
npm test
```

---

**NOOR is an evolving research tool.** If you are testing it with real scientific work, keep independent backups and preserve original/raw instrument data according to your laboratory or institutional data-management requirements.
