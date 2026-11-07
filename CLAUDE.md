# GC design system: project manual

The GC kit: a mini design system reverse engineered from gianlucacaico.com (Gianluca Caico's personal site), with its docs and a live playground. A proof of concept.
Gianluca is a design and CX leader (not a developer) who mostly works from a phone. Explain anything technical in one plain sentence. Never ask him to run code locally.
This file is not published (see `_config.yml`). Keep it current whenever the structure changes.

## Working agreement (the human gate)

- **Nothing goes live without explicit approval.** Before any publish, show the exact current and proposed wording side by side, plus phone and desktop previews (`node tools/preview.js`). Approval for one change does not carry over to the next.
- **Every change goes through a pull request.** Merging to `main` is what puts it live (GitHub Pages, about a minute). Never push directly to `main`.
- **One change per commit**, with a plain-English commit message.
- **After every publish, check the live site** with `node tools/preview.js --live`.
- **Never add a `.nojekyll` file.** It would publish this manual and `tools/`.
- **If unsure about a fact or design decision, ask.** Do not guess.

## Content rules

The same as the main site: Australian English, never an em dash anywhere (copy, code comments, commit messages), plain and outcome-first language, no overclaiming. Demo copy uses placeholders and clearly labelled example figures, never client names or outcomes.

## Hosting

- Repo `gianlucacaico/design-system`, default branch `main`. GitHub Pages: "Deploy from a branch", `main`, root.
- Served at https://gianlucacaico.com/design-system/ because the main site's repo (`gianlucacaico/gianlucacaico.github.io`) owns the gianlucacaico.com domain. There is no CNAME file here and nothing here ever needs a DNS change. Renaming this repo changes the address.
- `baseurl` is `/design-system`, so every internal address goes through Jekyll's `relative_url` or `absolute_url` filter. Never hard-code `/design-system/` or a bare `/`.
- Pages serves with a 10-minute cache, so add `?v=<timestamp>` when checking a fresh deploy.
- Never write `{{` or `{%` in copy, because Jekyll treats them as template code.

## Files

| Path | What it is | Address |
|---|---|---|
| `index.html` | Docs page: foundations, imagery, playground, "Use it anywhere", governance | `/design-system/` |
| `workflows.html` | Workflow library: every skill, harness, hook and workflow behind both sites, as tool-agnostic templates | `/design-system/workflows` |
| `demo.html` | Every component, loading only the kit. Also what the playground shows | `/design-system/demo` |
| `_includes/gc.css` | The kit stylesheet's source. Tokens are filled in from `_data/kit.yml` at build time | Build only |
| `_includes/gc.js` | The kit script's source: segmented controls and their sliding lens | Build only |
| `v1/gc.css`, `v1/gc.js` | Version 1 of the kit, the address pages should use. Each is one line that includes the source | `/design-system/v1/gc.css`, `/v1/gc.js` |
| `gc.css`, `gc.js` | The latest kit, built from the same source. The demo and docs use it | `/design-system/gc.css`, `/gc.js` |
| `tokens.json` | The kit's colour, card art and layout tokens as JSON (W3C design tokens layout), built from `_data/kit.yml`. gianlucacaico.com's drift check reads it, so keep its shape stable | `/design-system/tokens.json` |
| `_data/kit.yml` | Every token: colours, card art, type, radii, motion, layout, breakpoints. One source for the kit and the docs | Build only |
| `_data/decisions.yml` | The decision log shown in the Governance section | Build only |
| `_data/workflows.yml` | The workflow library's entries, one per skill, harness, hook or workflow | Build only |
| `_layouts/default.html` | Docs page shell: head with link preview tags, header, footer, scripts | Build only |
| `assets/docs.css`, `assets/docs.js` | Docs-only styles (built on the kit's tokens) and the playground script | Published |
| `assets/avatar.webp`, `assets/og-image.jpg` | Copies of the main site's avatar and link preview image | Published |
| `assets/sample-artwork.svg`, `assets/sample-pictogram.svg` | Generic sample post artwork (1200x630) and project pictogram (240x156) for the demo and the Imagery diagrams. No client content | Published |
| `tools/` | `build.sh` (GitHub Pages' own Jekyll), `preview.js` and `drift.js` | Not published |

## How it works

- **The kit.** Class names match gianlucacaico.com (`.btn-pill`, `.glass`, `.seg`, `.work-card` and so on), so markup copied from the site works here. Components use roles rather than raw colours: `--accent`, `--accent-deep`, `--accent-2`, `--accent-ink`, `--surface`, `--strong`. Every radius scales with `--round` and glass blur with `--glass-blur`. `data-surface="dark"` on `<html>` or any block remaps the neutrals for dark.
- **The docs are built from the kit.** The layout loads `gc.css`, then `assets/docs.css` for the docs-only `sys-*` and `ds-*` classes.
- **The playground.** `assets/docs.js` posts `{type: 'gc-kit-theme', vars, surface}` to the demo frame. The demo applies it and posts back `{type: 'gc-kit-size', height}` so the frame fits. This works wherever the demo is hosted.
- **Code panels.** Each demo component's Code panel is filled from its live markup, so it cannot go stale.

## Imagery

The docs page's Imagery section holds the rules for the main site's drawn images, first written in gianlucacaico.github.io#10 (live since November 2026):
- **Post artwork:** one illustration per post (banner, list thumbnail, featured card, link preview), 1200x630, important parts in the middle 80% of the width, bottom-left corner clear for the Featured label, only words and figures from the post.
- **Project pictograms:** 240x156, the right of the work card at full height, cropped by the card. Name corner (x under 60, y under 48) and label corner (x under 110, y over 112) clear, one focal point fully inside, white plus exactly one tint (`--tint-cyan`, `--tint-coral`, `--tint-amber`), no words or figures.
- **Client names:** written as text (`.big`, 18px bold white), top left of the card's art. Gianluca decided against client logos without formal permission (November 2026). If a client ever gives it: the brand's own white version, never recoloured, stretched or redrawn, about 18 to 32px high, name as alt text.

The main site makes the images (its `tools/art/` and `tools/art.js`); this repo holds the standard. When the main site's rules change, update the Imagery section, the Artwork colour group in `_data/kit.yml`, and the kit's `.work-art`, `.post-feature`, `.row-thumb` and `.article-hero` styles to match. The demo's samples are generic on purpose: never copy a client's pictogram, name artwork or logo into this repo.

## Governance

The docs page's Governance section explains, for anyone reading: who owns what (the main site is the source, this repo is the standard, Gianluca approves, Claude sessions draft and check), how a change goes live, what the drift check does, the version rules, how to propose a change, and a decision log.
- **Decision log:** `_data/decisions.yml`, newest first, month and year only. Add an entry whenever Gianluca makes a design decision, in the same pull request as the change it explains.
- Keep the section's wording true to how things actually work. If the process, the drift check or the version rules change, update it in the same pull request.

## Workflow library

`/design-system/workflows` lists every skill (a named procedure an agent follows when asked), harness (an automated run of checks that passes or fails), hook (a point where something fires by itself or plugs in) and workflow (those chained together with a human gate) behind gianlucacaico.com and this design system. Every card, and its copyable template, is built from `_data/workflows.yml`.
- **Keep it true.** When a skill, harness or hook is added, changed or removed in either repo, update its entry in the same pull request (or the next one, for a change in the other repo).
- **Keep templates tool-agnostic.** The name, summary, when, inputs, steps, outputs and guardrails say what happens, not which tool does it, and say "the owner" rather than naming Gianluca. Tools, file paths and names belong in `here`.
- `works_with` lists the ids of related entries. Every id must exist, or its link shows empty.

## Versions

- Pages use `/design-system/v1/gc.css` (and `/v1/gc.js`). Version 1 only takes changes that cannot break a page using it: new tokens, new components, fixes, values that move with the main site's look.
- A breaking change (a renamed or removed class or token, or a markup change components depend on) becomes version 2: copy `_includes/gc.css` to `_includes/gc-v1.css` and point `v1/gc.css` at it, so v1 is frozen, then add `v2/gc.css` and move the docs' copy lines to v2. Do the same for `gc.js`. Ask Gianluca before any breaking change.
- `/gc.css` and `/gc.js` are always the latest. Only the demo and docs should rely on them.

## Keeping it in step with the main site

The kit is a copy, not the source: gianlucacaico.com still runs on its own `assets/css/site.css`. When a colour, type size, radius or component changes there, make the same change here in `_data/kit.yml` (and in `_includes/gc.css` for a component). Anything served from here reaches every page that uses the one-line plug-in, so treat changes as carefully as changes to the site.

**Drift check, from both sides.** gianlucacaico.com runs its own `tools/drift.js` in its `tools/health.sh` after every publish, reading this repo's published `tokens.json`. This repo's check reads the site's live stylesheet. Keep `tokens.json`'s shape stable, since the site depends on it.

**This repo's drift check** (`node tools/drift.js`, also run at the end of every `tools/preview.js`): compares the kit's colour, card art and layout tokens with the `:root` tokens of the live site stylesheet. It reports DRIFT for any token that differs or exists on only one side (exit code 1), and INFO for colours written straight into rules or drawings that are not tokens yet. Give it other files to check as extra arguments, local paths or URLs: a main site branch's `assets/css/site.css`, its artwork template `tools/art/art.css`, or its pictograms `assets/img/work/*.svg`. Run it against a main site pull request before that pull request merges, so the kit can follow in the same week. Token groups in `_data/kit.yml` marked `source: artwork` live in image files, not in `site.css`, so they are not expected there.

The kit's dark surface values are derived from ink and the main site's on-dark tokens. The main site has no dark mode of its own.

## Tools

Run from the repo root.

- `node tools/preview.js [--full] [--live]`: builds with GitHub Pages' own Jekyll, screenshots the docs, demo and workflows pages at 390px and 1280px into `tools/previews/` (git-ignored), and fails on any missing file, script error, em dash or missing link preview tag, or on drift from the live site. The first run in a fresh session installs the builder and a local copy of the Inter font (a minute or two).
- `node tools/drift.js [site.css] [more files...]`: the drift check on its own (see "Keeping it in step").
- `bash tools/build.sh [source] [destination]`: the build on its own.

Send previews to Gianluca with the SendUserFile tool, phone first.
