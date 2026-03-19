function toast(m) {
  const t = document.getElementById('toast');
  t.textContent = m; t.classList.add('on');
  setTimeout(() => t.classList.remove('on'), 2500);
}
function openMod(h) { document.getElementById('mc').innerHTML = h; document.getElementById('ov').classList.add('on'); }
function closeMod(e) { if (!e || e.target === document.getElementById('ov')) document.getElementById('ov').classList.remove('on'); }
function confirm2(msg, cb) {
  window._cb = cb;
  openMod(`<div class="mt">Підтвердження</div>
    <p style="color:var(--t2);font-size:14px;margin-bottom:16px">${msg}</p>
    <button class="btn bd" onclick="window._cb&&window._cb();closeMod()">${ic('trash',16)} Підтвердити</button>
    <button class="btn" onclick="closeMod()">Скасувати</button>`);
}
function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function srvLabel(n) { return n===1 ? 'порція' : n<5 ? 'порції' : 'порцій'; }
function fmtAmt(a) { if(!a) return ''; const n=parseFloat(a); if(isNaN(n)) return ''; return n%1===0 ? n : parseFloat(n.toFixed(2)); }
function getMon(off=0) { const d=new Date(); const day=d.getDay()||7; d.setDate(d.getDate()-day+1+off*7); d.setHours(0,0,0,0); return d; }
function wkKey(off=0) { return getMon(off).toISOString().split('T')[0]; }
function wkDates(off=0) {
  const m = getMon(off);
  return DAYS.map(({k,n},i) => { const d=new Date(m); d.setDate(m.getDate()+i); return {k,n,d:d.getDate(),mo:d.getMonth()+1}; });
}
function uSel(val, di) {
  return `<select id="usel_${di}" onchange="updIng(${di},'u',this.value)">${UNITS.map(u=>`<option${u===(val||'г')?' selected':''}>${u}</option>`).join('')}</select>`;
}