#!/usr/bin/env bash
# Builds the site exactly as GitHub Pages does (same Jekyll version and settings).
# Usage: bash tools/build.sh [source folder] [destination folder]
# Defaults: builds the repo into tools/_site (git-ignored).
# The first run in a fresh session installs the builder (a minute or two).
set -e
TOOLS="$(cd "$(dirname "$0")" && pwd)"
SRC="$(cd "${1:-$TOOLS/..}" && pwd)"
DEST="${2:-$TOOLS/_site}"
export BUNDLE_GEMFILE="$TOOLS/Gemfile" BUNDLE_PATH="$TOOLS/vendor"
bundle check >/dev/null 2>&1 || bundle install -j4 --quiet
[ -d "$TOOLS/node_modules" ] || (cd "$TOOLS" && npm install --no-audit --no-fund --silent)
# Run from tools/ so Jekyll finds the Gemfile and loads GitHub Pages' standard plugins,
# with UTF-8 text handling and the repo name, as on GitHub's own build servers.
export LANG=C.UTF-8 LC_ALL=C.UTF-8 JEKYLL_ENV=production PAGES_REPO_NWO=gianlucacaico/design-system
cd "$TOOLS"
bundle exec jekyll build --safe --quiet -s "$SRC" -d "$DEST"
