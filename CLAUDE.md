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
| `index.html` | Docs page: foundations, playground, "Use it anywhere" | `/design-system/` |
| `demo.html` | Every component, loading only the kit. Also what the playground shows | `/design-system/demo` |
| `gc.css` | The kit stylesheet. Tokens are filled in from `_data/kit.yml` at build time | `/design-system/gc.css` |
| `gc.js` | The kit's only script: segmented controls and their sliding lens | `/design-system/gc.js` |
| `_data/kit.yml` | Every token: colours, card art, type, radii, motion, layout, breakpoints. One source for the kit and the docs | Build only |
| `_layouts/default.html` | Docs page shell: head with link preview tags, header, footer, scripts | Build only |
| `assets/docs.css`, `assets/docs.js` | Docs-only styles (built on the kit's tokens) and the playground script | Published |
| `assets/avatar.webp`, `assets/og-image.jpg` | Copies of the main site's avatar and link preview image | Published |
| `tools/` | `build.sh` (GitHub Pages' own Jekyll) and `preview.js` | Not published |

## How it works

- **The kit.** Class names match gianlucacaico.com (`.btn-pill`, `.glass`, `.seg`, `.work-card` and so on), so markup copied from the site works here. Components use roles rather than raw colours: `--accent`, `--accent-deep`, `--accent-2`, `--accent-ink`, `--surface`, `--strong`. Every radius scales with `--round` and glass blur with `--glass-blur`. `data-surface="dark"` on `<html>` or any block remaps the neutrals for dark.
- **The docs are built from the kit.** The layout loads `gc.css`, then `assets/docs.css` for the docs-only `sys-*` and `ds-*` classes.
- **The playground.** `assets/docs.js` posts `{type: 'gc-kit-theme', vars, surface}` to the demo frame. The demo applies it and posts back `{type: 'gc-kit-size', height}` so the frame fits. This works wherever the demo is hosted.
- **Code panels.** Each demo component's Code panel is filled from its live markup, so it cannot go stale.

## Keeping it in step with the main site

The kit is a copy, not the source: gianlucacaico.com still runs on its own `assets/css/site.css`. When a colour, type size, radius or component changes there, make the same change here in `_data/kit.yml` (and in `gc.css` for a component). Anything served from here reaches every page that uses the one-line plug-in, so treat changes as carefully as changes to the site.

The kit's dark surface values are derived from ink and the main site's on-dark tokens. The main site has no dark mode of its own.

## Tools

Run from the repo root.

- `node tools/preview.js [--full] [--live]`: builds with GitHub Pages' own Jekyll, screenshots both pages at 390px and 1280px into `tools/previews/` (git-ignored), and fails on any missing file, script error, em dash or missing link preview tag. The first run in a fresh session installs the builder and a local copy of the Inter font (a minute or two).
- `bash tools/build.sh [source] [destination]`: the build on its own.

Send previews to Gianluca with the SendUserFile tool, phone first.
