# NOOR

**NOOR** is an experimental electronic lab notebook for scientists — designed around the daily reality of research: experiments, protocols, synthesis schemes, calculations, references, results, discussion, and the small tasks that keep a project moving.

> Working name. The product name may change as the project evolves.

## v0.1 goals

- Daily lab dashboard
- Experiment records with observations separated from interpretation
- Protocol library with optimization/versioning in mind
- Discipline workspaces for Organic Chemistry, Electrochemistry, Biochemistry, Materials Science, and Nanotechnology
- Scientific calculator and quick conversions
- Reference hub and important scientific resources
- Scientist/philosopher quotations with attribution
- Local-first/offline-friendly architecture
- Exportable research records so users retain ownership of their data

## Design direction

NOOR uses a University at Buffalo-inspired palette without presenting itself as an official UB product. Blue is used as an accent rather than dominating the workspace, with warm and discipline-specific colors for navigation and status.

## Run locally

The first prototype has no build step.

1. Clone or download the repository.
2. Open `index.html` directly, or serve the folder with any static web server.
3. For full service-worker offline caching, use a local HTTP server rather than `file://`.

Example:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Roadmap

The prototype will grow toward structured experiment records, protocol versioning, ChemDraw/structure interoperability, scientific references, project-level discussion, searchable records, local storage, backups, and optional collaboration.

## Status

Early prototype / research project.
