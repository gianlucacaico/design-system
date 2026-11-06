/*
  GC kit 0.1: interactions for gianlucacaico.com/design-system/gc.css.
  Segmented controls (.seg with buttons): tapping a button presses it and slides the glass lens under it.
  Each tap sends a "gc:change" event from the .seg, with the button's data-value (or its text) as detail.value.
  Call GC.refresh() after adding controls to the page or changing their size.
*/
(function(){
  function place(seg){
    var lens = seg.querySelector(':scope > .lens');
    var on = seg.querySelector('button[aria-pressed="true"]');
    if (!lens) return;
    if (!on || !seg.getClientRects().length){ lens.style.opacity = '0'; return; }
    lens.style.opacity = '1';
    lens.style.width = on.offsetWidth + 'px';
    lens.style.transform = 'translateX(' + on.offsetLeft + 'px)';
  }

  function refresh(){
    document.querySelectorAll('.seg').forEach(function(seg){
      if (!seg.querySelector(':scope > .lens')){
        var lens = document.createElement('span');
        lens.className = 'lens';
        lens.setAttribute('aria-hidden', 'true');
        seg.insertBefore(lens, seg.firstChild);
      }
      seg.classList.add('has-lens');
      place(seg);
    });
  }

  document.addEventListener('click', function(e){
    var btn = e.target.closest('.seg button');
    if (!btn) return;
    var seg = btn.closest('.seg');
    seg.querySelectorAll('button').forEach(function(b){ b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'); });
    place(seg);
    seg.dispatchEvent(new CustomEvent('gc:change', {bubbles: true, detail: {value: btn.getAttribute('data-value') || btn.textContent.trim()}}));
  });

  window.addEventListener('resize', refresh);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', refresh); else refresh();

  window.GC = {refresh: refresh};
})();
