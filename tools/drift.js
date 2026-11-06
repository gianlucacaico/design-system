#!/usr/bin/env node
// Drift check: is the kit still in step with gianlucacaico.com?
// Compares the colour, card art and layout tokens in _data/kit.yml with the :root tokens of the
// main site's stylesheet (the live one by default), plus any other stylesheets you name, such as
// the main site's artwork template (tools/art/art.css in that repo), or drawings such as its project
// pictograms (.svg). It also lists colours used that are not tokens yet, as a to-do list for the kit.
//
// Usage: node tools/drift.js [site.css path or URL] [more stylesheet or drawing paths or URLs...]
// Exit code: 0 in step, 1 drift found, 2 a stylesheet could not be loaded.
const fs = require('fs'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const LIVE = 'https://gianlucacaico.com/assets/css/site.css';

function load(src) {
  if (!/^https?:\/\//.test(src)) return fs.readFileSync(src, 'utf8');
  // curl goes through the session's network proxy, which Node's own fetch does not.
  return execFileSync('curl', ['-fsSL', '-m', '30', src + (src.includes('?') ? '&' : '?') + 'v=' + Date.now()], { encoding: 'utf8' });
}

const norm = (v) => {
  const s = String(v).toLowerCase().replace(/\s+/g, '');
  const short = s.match(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/);
  return short ? '#' + short[1] + short[1] + short[2] + short[2] + short[3] + short[3] : s;
};

// Tokens from _data/kit.yml. Groups marked "source: artwork" live in image files, not in site.css.
function kitTokens() {
  const tokens = {};
  let section = null, source = 'site';
  for (const line of fs.readFileSync(path.join(ROOT, '_data/kit.yml'), 'utf8').split('\n')) {
    const sec = line.match(/^(\w+):\s*$/);
    if (sec) { section = sec[1]; source = 'site'; continue; }
    if (/^\s*-\s*group:/.test(line)) { source = 'site'; continue; }
    const src = line.match(/^\s+source:\s*(\w+)/);
    if (src) { source = src[1]; continue; }
    if (!['colours', 'art', 'layout'].includes(section)) continue;
    const n = line.match(/name:\s*([\w-]+)/), v = line.match(/value:\s*"([^"]*)"/);
    if (n && v) tokens[n[1]] = { value: v[1], source, section };
  }
  return tokens;
}

// Custom properties declared in a stylesheet's :root blocks.
function rootVars(css) {
  const out = {};
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, '');
  for (const block of clean.matchAll(/:root\s*\{([^}]*)\}/g)) {
    for (const decl of block[1].split(';')) {
      const m = decl.match(/^\s*--([\w-]+)\s*:\s*([\s\S]+?)\s*$/);
      if (m) out[m[1]] = m[2];
    }
  }
  return out;
}

const args = process.argv.slice(2);
const siteSrc = args[0] || LIVE;
const extras = args.slice(1);
const kit = kitTokens();
let drift = 0;
const say = (tag, msg) => console.log(`${tag.padEnd(5)} ${msg}`);

let siteCss;
try { siteCss = load(siteSrc); } catch (e) { say('SKIP', `Could not load ${siteSrc}, so the drift check did not run`); process.exit(2); }
console.log(`Drift check: the kit (_data/kit.yml) against ${siteSrc}`);

const site = rootVars(siteCss);
let matched = 0;
for (const [name, t] of Object.entries(kit)) {
  if (t.source !== 'site') continue;
  if (!(name in site)) {
    if (t.section === 'layout') continue; // layout tokens such as --wide are written into the site's rules, not :root
    say('DRIFT', `--${name} is in the kit (${t.value}) but not on the site`); drift++;
  } else if (norm(site[name]) !== norm(t.value)) {
    say('DRIFT', `--${name}: the site has ${site[name]}, the kit has ${t.value}`); drift++;
  } else matched++;
}
for (const name of Object.keys(site)) {
  if (!(name in kit)) { say('DRIFT', `--${name} (${site[name]}) is on the site but not in the kit`); drift++; }
}
if (matched) say('OK', `${matched} site tokens match the kit`);

for (const src of extras) {
  let css;
  try { css = load(src); } catch (e) { say('SKIP', `Could not load ${src}`); continue; }
  const vars = rootVars(css);
  let same = 0;
  for (const [name, value] of Object.entries(vars)) {
    if (!(name in kit)) { say('INFO', `${path.basename(src)} has --${name} (${value}), which is not in the kit`); continue; }
    if (norm(value) !== norm(kit[name].value)) { say('DRIFT', `${path.basename(src)} says --${name} is ${value}, the kit says ${kit[name].value}`); drift++; }
    else same++;
  }
  if (same) say('OK', `${same} tokens in ${path.basename(src)} match the kit`);
  const extra = looseColours(css);
  if (extra) say('INFO', `Colours in ${path.basename(src)} that are not tokens yet: ${extra}`);
}

// Colours written straight into rules or drawings rather than as tokens: candidates for the kit.
function looseColours(css) {
  const known = new Set(Object.values(kit).map((t) => norm(t.value)));
  const counts = {};
  const rules = css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/:root\s*\{[^}]*\}/g, '');
  for (const m of rules.matchAll(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g)) {
    const c = norm(m[0]);
    if (!known.has(c)) counts[c] = (counts[c] || 0) + 1;
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([c, n]) => `${c.toUpperCase()} (${n})`).join(', ');
}
const loose = looseColours(siteCss);
if (loose) say('INFO', `Colours on the site that are not tokens yet: ${loose}`);

console.log(drift ? `\n${drift} difference(s) between the site and the kit.` : '\nIn step: every site token matches the kit.');
process.exit(drift ? 1 : 0);
