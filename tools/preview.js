#!/usr/bin/env node
// Builds the site exactly as GitHub Pages does (tools/build.sh), then screenshots each page at
// phone (390px) and desktop (1280px) size into tools/previews/ (git-ignored). It also reports any
// file that fails to load, any script error, any em dash and any missing link preview tag.
// Last, it runs the drift check (tools/drift.js) against the live gianlucacaico.com stylesheet.
//
// Usage: node tools/preview.js           both pages, first screen
//        node tools/preview.js --full    whole pages
//        node tools/preview.js --live    the live site (gianlucacaico.com/design-system) instead
const fs = require('fs'), http = require('http'), path = require('path');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const PAGES = { docs: '', demo: 'demo', workflows: 'workflows' };
const SIZES = { mobile: { width: 390, height: 844 }, desktop: { width: 1280, height: 800 } };
const full = process.argv.includes('--full'), live = process.argv.includes('--live');

// Serve tools/_site so /design-system/... works as on GitHub Pages, including clean addresses (/demo).
function serve(dir) {
  const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp', '.jpg': 'image/jpeg' };
  const server = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]);
    if (p.endsWith('/')) p += 'index.html';
    let file = path.join(dir, p);
    if (!fs.existsSync(file) && fs.existsSync(file + '.html')) file += '.html';
    if (!file.startsWith(dir) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((r) => server.listen(0, '127.0.0.1', () => r({ server, url: `http://127.0.0.1:${server.address().port}` })));
}

// Answer Google Fonts requests with a local copy of Inter, so screenshots always use the real font.
async function localInter(context) {
  const dir = path.dirname(require.resolve('@fontsource/inter/package.json', { paths: [__dirname] })) + '/files';
  const css = [400, 500, 600, 700, 800].map((w) => `@font-face{font-family:'Inter';font-weight:${w};src:url(https://fonts.gstatic.com/local/inter-${w}.woff2) format('woff2');}`).join('\n');
  await context.route('https://fonts.googleapis.com/**', (r) => r.fulfill({ status: 200, contentType: 'text/css', body: css }));
  await context.route('https://fonts.gstatic.com/**', (r) => {
    const m = r.request().url().match(/inter-(\d+)\.woff2$/);
    if (!m) return r.abort();
    r.fulfill({ status: 200, contentType: 'font/woff2', body: fs.readFileSync(`${dir}/inter-latin-${m[1]}-normal.woff2`) });
  });
}

(async () => {
  let base = 'https://gianlucacaico.com', srv = null;
  if (!live) {
    const site = path.join(__dirname, '_site');
    fs.rmSync(site, { recursive: true, force: true });
    execFileSync('bash', [path.join(__dirname, 'build.sh'), ROOT, path.join(site, 'design-system')], { stdio: 'inherit' });
    srv = await serve(site); base = srv.url;
  }
  const out = path.join(__dirname, 'previews');
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch();
  let problems = 0;
  for (const [name, p] of Object.entries(PAGES)) {
    for (const [size, viewport] of Object.entries(SIZES)) {
      const context = await browser.newContext({ viewport, deviceScaleFactor: 2, isMobile: size === 'mobile', hasTouch: size === 'mobile', reducedMotion: 'reduce' });
      await localInter(context);
      const page = await context.newPage();
      const issues = [];
      page.on('pageerror', (e) => issues.push('script error: ' + e.message));
      page.on('response', (r) => { if (r.status() >= 400 && r.url().startsWith(base)) issues.push(`${r.status()} ${r.url()}`); });
      await page.goto(`${base}/design-system/${p}${live ? '?v=' + Date.now() : ''}`, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(500);
      const r = await page.evaluate(() => ({
        dashes: (document.documentElement.outerHTML.match(/\u2014/g) || []).length,
        missing: ['meta[name="description"]', 'link[rel="canonical"]', 'meta[property="og:title"]', 'meta[property="og:image"]', 'meta[name="twitter:card"]'].filter((s) => !document.querySelector(s)),
      }));
      if (r.dashes) issues.push(`${r.dashes} em dash(es)`);
      if (r.missing.length) issues.push('missing link preview tags: ' + r.missing.join(', '));
      const file = path.join(out, `${name}-${size}.png`);
      await page.screenshot({ path: file, fullPage: full });
      console.log(`${issues.length ? 'FAIL' : 'OK  '} ${path.relative(ROOT, file)}${issues.length ? '\n      ' + issues.join('\n      ') : ''}`);
      problems += issues.length;
      await context.close();
    }
  }
  await browser.close();
  if (srv) srv.server.close();
  // Is the kit still in step with the main site? (Exit 2 means the site could not be reached: a warning only.)
  console.log('');
  try { console.log(execFileSync('node', [path.join(__dirname, 'drift.js')], { encoding: 'utf8' }).trim()); }
  catch (e) { console.log(String(e.stdout || e.message).trim()); if (e.status === 1) problems++; }
  process.exit(problems ? 1 : 0);
})();
