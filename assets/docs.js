/*
  Docs page script. The playground sends its settings to the demo frame as
  messages, and the demo replies with its height so the frame fits it.
  Segmented controls (the lens and pressed state) come from gc.js.
*/
(function(){
  var page = document.getElementById('docs');
  if (!page) return;
  var frame = page.querySelector('.sys-frame');
  var codeTheme = document.getElementById('code-theme');
  var round = document.getElementById('ctl-round'), glass = document.getElementById('ctl-glass');
  var picker = page.querySelector('.sys-pick input');
  var DEFAULTS = {accent: '#635BFF', deep: '#4B44D6', partner: '#EB5D76', surface: 'light', round: 100, glass: 20};
  var s = {};
  Object.keys(DEFAULTS).forEach(function(k){ s[k] = DEFAULTS[k]; });

  // A deeper shade for hovers: the accent mixed with 22% ink, as violet is to violet-deep.
  function deepen(hex){
    var n = parseInt(hex.slice(1), 16), ink = [10, 37, 64];
    return '#' + [n >> 16, (n >> 8) & 255, n & 255].map(function(v, i){
      return ('0' + Math.round(v * 0.78 + ink[i] * 0.22).toString(16)).slice(-2);
    }).join('').toUpperCase();
  }

  function vars(){
    return [['--accent', s.accent], ['--accent-deep', s.deep], ['--accent-2', s.partner], ['--round', String(s.round / 100)], ['--glass-blur', s.glass + 'px']];
  }

  // The demo lives in a frame, so settings travel to it as a message (this works wherever the demo is hosted).
  function apply(){
    var v = {};
    vars().forEach(function(x){ v[x[0]] = x[1]; });
    if (frame.contentWindow) frame.contentWindow.postMessage({type: 'gc-kit-theme', vars: v, surface: s.surface}, '*');
    var lines = s.surface === 'dark' ? ['<!-- Also add data-surface="dark" to the <html> tag -->'] : [];
    lines.push('<style>', '  :root{');
    vars().forEach(function(v){ lines.push('    ' + v[0] + ':' + v[1] + ';'); });
    lines.push('  }', '</style>');
    codeTheme.textContent = lines.join('\n');
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
  page.querySelector('.sys-reset').addEventListener('click', function(){
    Object.keys(DEFAULTS).forEach(function(k){ s[k] = DEFAULTS[k]; });
    page.querySelectorAll('.sys-dots').forEach(function(g){ press(g, g.getAttribute('data-set') === 'accent' ? s.accent : s.partner); });
    press(page.querySelector('.sys-surface'), s.surface);
    picker.value = s.accent; picker.parentNode.classList.remove('is-on');
    round.value = s.round; glass.value = s.glass;
    apply();
    if (window.GC) window.GC.refresh();
  });

  // Copy buttons for the code snippets.
  page.querySelectorAll('[data-copy]').forEach(function(btn){
    btn.addEventListener('click', function(){
      var text = document.getElementById(btn.getAttribute('data-copy')).textContent;
      function done(){ btn.textContent = 'Copied'; setTimeout(function(){ btn.textContent = 'Copy'; }, 1600); }
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
