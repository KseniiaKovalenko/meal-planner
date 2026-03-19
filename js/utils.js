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
function uniqueText(arr) { return [...new Set((arr||[]).map(v=>String(v||'').trim()).filter(Boolean))]; }
function recipeTags(r) { return uniqueText([...(r?.tags||[]), r?.cat]); }
function productTags(p) { return uniqueText(p?.tags||[]); }
function defaultBaseUnitForUnit(unit) { return ['мл','л'].includes(unit) ? 'мл' : 'г'; }
function needsBaseQty(unit) { return !['г','кг','мл','л'].includes(unit||''); }
function productBaseAmount(product, amount, unit) {
  const val = parseFloat(amount);
  if (!val) return 0;
  if (unit === 'г') return val;
  if (unit === 'кг') return val * 1000;
  if (unit === 'мл') return val;
  if (unit === 'л') return val * 1000;
  if (!product || unit !== product.unit) return 0;
  const perUnit = parseFloat(product.baseQty);
  return perUnit ? val * perUnit : 0;
}
function productNutritionBasis(product) {
  return (product?.baseUnit || defaultBaseUnitForUnit(product?.unit)) === 'мл' ? '100 мл' : '100 г';
}
function productUnitNote(product) {
  if (!needsBaseQty(product?.unit) || !product?.baseQty) return '';
  return `1 ${product.unit} = ${fmtAmt(product.baseQty)} ${product.baseUnit||defaultBaseUnitForUnit(product.unit)}`;
}
function renderProductTag(tag) {
  if (tag === RECENT_PRODUCT_TAG) return `<span class="flag-new">Новий</span>`;
  return `<span class="tg">${esc(tag)}</span>`;
}
function isExpiredDate(dateStr) {
  if (!dateStr) return false;
  const today = new Date();
  today.setHours(0,0,0,0);
  const exp = new Date(`${dateStr}T00:00:00`);
  return !Number.isNaN(exp.getTime()) && exp < today;
}
function fmtDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('uk-UA');
}
function getMon(off=0) { const d=new Date(); const day=d.getDay()||7; d.setDate(d.getDate()-day+1+off*7); d.setHours(0,0,0,0); return d; }
function wkKey(off=0) { return getMon(off).toISOString().split('T')[0]; }
function wkDates(off=0) {
  const m = getMon(off);
  return DAYS.map(({k,n},i) => { const d=new Date(m); d.setDate(m.getDate()+i); return {k,n,d:d.getDate(),mo:d.getMonth()+1}; });
}
function uSel(val, di) {
  return `<select id="usel_${di}" onchange="updIng(${di},'u',this.value)">${UNITS.map(u=>`<option${u===(val||'г')?' selected':''}>${u}</option>`).join('')}</select>`;
}
