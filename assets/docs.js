/*
  Design system script, on every page. The playground sends its settings to the demo frame as
  messages, and the demo replies with its height so the frame fits it. The settings are also kept
  in this browser, so "Use it anywhere" can show them as code on its own page.
  Segmented controls (the lens and pressed state) come from gc.js.
*/
var GCDocs = (function(){
  var KEY = 'gc-kit-playground';
  var DEFAULTS = {accent: '#635BFF', deep: '#4B44D6', partner: '#EB5D76', surface: 'light', round: 100, glass: 20};
  function vars(s){
    return [['--accent', s.accent], ['--accent-deep', s.deep], ['--accent-2', s.partner], ['--round', String(s.round / 100)], ['--glass-blur', s.glass + 'px']];
  }
  function code(s){
    var lines = s.surface === 'dark' ? ['<!-- Also add data-surface="dark" to the <html> tag -->'] : [];
    lines.push('<style>', '  :root{');
    vars(s).forEach(function(v){ lines.push('    ' + v[0] + ':' + v[1] + ';'); });
    lines.push('  }', '</style>');
    return lines.join('\n');
  }
  // Browser storage can be missing or blocked (private windows), so every read and write is guarded.
  function load(){
    try { var v = JSON.parse(localStorage.getItem(KEY)); return v && v.accent ? v : null; } catch (e) { return null; }
  }
  function save(s){ try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} }
  return {DEFAULTS: DEFAULTS, vars: vars, code: code, load: load, save: save};
})();

// Use it anywhere: show the playground's last settings as code (the page ships with the defaults).
(function(){
  var codeTheme = document.getElementById('code-theme');
  if (!codeTheme || document.querySelector('.sys-frame')) return;
  var saved = GCDocs.load();
  if (saved) codeTheme.textContent = GCDocs.code(saved);
})();

// Playground
(function(){
  var frame = document.querySelector('.sys-frame');
  if (!frame) return;
  var page = frame.closest('main');
  var codeTheme = document.getElementById('code-theme');
  var round = document.getElementById('ctl-round'), glass = document.getElementById('ctl-glass');
  var picker = page.querySelector('.sys-pick input');
  var DEFAULTS = GCDocs.DEFAULTS;
  var s = {}, saved = GCDocs.load();
  Object.keys(DEFAULTS).forEach(function(k){ s[k] = saved && saved[k] !== undefined ? saved[k] : DEFAULTS[k]; });

  // A deeper shade for hovers: the accent mixed with 22% ink, as violet is to violet-deep.
  function deepen(hex){
    var n = parseInt(hex.slice(1), 16), ink = [10, 37, 64];
    return '#' + [n >> 16, (n >> 8) & 255, n & 255].map(function(v, i){
      return ('0' + Math.round(v * 0.78 + ink[i] * 0.22).toString(16)).slice(-2);
    }).join('').toUpperCase();
  }

  function vars(){ return GCDocs.vars(s); }

  // The demo lives in a frame, so settings travel to it as a message (this works wherever the demo is hosted).
  function apply(){
    var v = {};
    vars().forEach(function(x){ v[x[0]] = x[1]; });
    if (frame.contentWindow) frame.contentWindow.postMessage({type: 'gc-kit-theme', vars: v, surface: s.surface}, '*');
    if (codeTheme) codeTheme.textContent = GCDocs.code(s);
    GCDocs.save(s);
    round.previousElementSibling.querySelector('output').textContent = s.round + '%';
    glass.previousElementSibling.querySelector('output').textContent = s.glass + 'px';
  }

  function press(group, value){
    var hit = false;
    group.querySelectorAll('button').forEach(function(b){
      var on = b.getAttribute('data-value').toUpperCase() === value.toUpperCase();
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      if (on) hit = true;
    });
    return hit;
  }

  page.querySelectorAll('.sys-dots').forEach(function(group){
    group.addEventListener('click', function(e){
      var b = e.target.closest('button');
      if (!b) return;
      var v = b.getAttribute('data-value');
      press(group, v);
      if (group.getAttribute('data-set') === 'accent'){
        s.accent = v; s.deep = b.getAttribute('data-deep') || deepen(v);
        picker.parentNode.classList.remove('is-on');
      } else s.partner = v;
      apply();
    });
  });
  picker.addEventListener('input', function(){
    s.accent = picker.value.toUpperCase(); s.deep = deepen(s.accent);
    press(picker.closest('.sys-dots'), '');
    picker.parentNode.classList.add('is-on');
    apply();
  });
  // gc.js presses the button and slides the lens, then tells us which surface was picked.
  page.querySelector('.sys-surface').addEventListener('gc:change', function(e){ s.surface = e.detail.value; apply(); });
  round.addEventListener('input', function(){ s.round = +round.value; apply(); });
  glass.addEventListener('input', function(){ s.glass = +glass.value; apply(); });
  // Show the current settings on the controls (after a reset, or when coming back with saved ones).
  function sync(){
    page.querySelectorAll('.sys-dots').forEach(function(g){ press(g, g.getAttribute('data-set') === 'accent' ? s.accent : s.partner); });
    press(page.querySelector('.sys-surface'), s.surface);
    picker.value = s.accent;
    var custom = !page.querySelector('.sys-dots[data-set="accent"] button[aria-pressed="true"]');
    picker.parentNode.classList.toggle('is-on', custom);
    round.value = s.round; glass.value = s.glass;
    if (window.GC) window.GC.refresh();
  }
  page.querySelector('.sys-reset').addEventListener('click', function(){
    Object.keys(DEFAULTS).forEach(function(k){ s[k] = DEFAULTS[k]; });
    sync();
    apply();
  });
  if (saved) sync();

  // The demo reports its height, so the frame grows to fit and the page scrolls instead of the frame.
  var sized = false;
  window.addEventListener('message', function(e){
    if (e.source !== frame.contentWindow || !e.data || e.data.type !== 'gc-kit-size') return;
    frame.style.height = (Math.ceil(e.data.height) + 2) + 'px';
    if (!sized){ sized = true; apply(); }
  });
  frame.addEventListener('load', apply);
  // The demo may have loaded before this script ran (it often does on a repeat visit), so say hello now too.
  // It answers any settings message with its height.
  apply();
})();

// Operating model: the switch shows one real change at a time. gc.js presses the button and
// slides the lens, then says which was picked.
(function(){
  var pick = document.querySelector('.sys-case-pick');
  if (!pick) return;
  var cases = document.querySelectorAll('.sys-case');
  function show(id){ cases.forEach(function(c){ c.hidden = c.getAttribute('data-case') !== id; }); }
  pick.addEventListener('gc:change', function(e){ show(e.detail.value); });
  var on = pick.querySelector('[aria-pressed="true"]');
  show(on ? on.getAttribute('data-value') : cases[0].getAttribute('data-case'));
})();

// Copy buttons, on every page: copy the text of the element named in data-copy.
(function(){
  document.querySelectorAll('[data-copy]').forEach(function(btn){
    var label = btn.textContent;
    btn.addEventListener('click', function(){
      var text = document.getElementById(btn.getAttribute('data-copy')).textContent;
      function done(){ btn.textContent = 'Copied'; setTimeout(function(){ btn.textContent = label; }, 1600); }
      function fallback(){
        var t = document.createElement('textarea');
        t.value = text; t.style.position = 'fixed'; t.style.opacity = '0';
        document.body.appendChild(t); t.select();
        try { document.execCommand('copy'); done(); } catch (err) {}
        t.remove();
      }
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done, fallback); else fallback();
    });
  });
})();

// Workflow library: filter by kind, and open a card when it is linked to.
(function(){
  var page = document.getElementById('workflows');
  if (!page) return;
  var cards = page.querySelectorAll('.wf-card');
  var status = page.querySelector('.wf-status');
  var names = {skill: 'skills', harness: 'harnesses', hook: 'hooks', workflow: 'workflows'};
  page.querySelector('.wf-filter').addEventListener('gc:change', function(e){
    var kind = e.detail.value, shown = 0;
    cards.forEach(function(c){ var on = kind === 'all' || c.getAttribute('data-type') === kind; c.hidden = !on; if (on) shown++; });
    status.textContent = kind === 'all' ? 'Showing all ' + cards.length + ' templates' : 'Showing ' + shown + ' ' + names[kind];
  });
  function open(id){
    var card = id && document.getElementById(id);
    if (!card || !card.classList.contains('wf-card')) return;
    if (card.hidden){ var all = page.querySelector('.wf-filter button[data-value="all"]'); if (all) all.click(); }
    card.open = true;
    card.scrollIntoView({block: 'start'});
  }
  page.addEventListener('click', function(e){
    var a = e.target.closest('.wf-link');
    if (!a) return;
    e.preventDefault();
    var id = a.getAttribute('href').slice(1);
    history.replaceState(null, '', '#' + id);
    open(id);
  });
  window.addEventListener('hashchange', function(){ open(location.hash.slice(1)); });
  open(location.hash.slice(1));
})();

// Home: addresses that jumped to a section of the old single page (#foundations and so on) go to
// that section's own page now.
(function(){
  var home = document.querySelector('.ds-portal');
  if (!home) return;
  var base = home.getAttribute('data-base');
  var moved = {trace: 'operating-model#trace', program: 'operating-model#program', foundations: 'foundations', imagery: 'imagery',
    playground: 'playground', use: 'use', governance: 'governance', 'decision-log': 'governance#decision-log', standard: '#explore'};
  function go(){
    var to = moved[location.hash.slice(1)];
    if (!to) return;
    if (to.charAt(0) === '#') location.hash = to; else location.replace(base + to);
  }
  go();
  window.addEventListener('hashchange', go);
})();

// Phone menu: closes on a tap outside it, or with Escape.
(function(){
  var menu = document.querySelector('.ds-menu');
  if (!menu) return;
  document.addEventListener('click', function(e){ if (menu.open && !menu.contains(e.target)) menu.open = false; });
  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape' && menu.open){ menu.open = false; menu.querySelector('summary').focus(); }
  });
})();
