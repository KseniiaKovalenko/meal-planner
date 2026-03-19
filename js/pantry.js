async function renderPantry(){
  const el=document.getElementById('tab-pantry');
  const items=await dbAll('pantryItems');window._pi=items;
  const cnt=(await dbAll('products')).length;
  el.innerHTML=`<div class="pantry-tools">
      <button class="btn bs pantry-catbtn" onclick="showCatalog()">${ic('grid',16)} Каталог продуктів (${cnt})</button>
      <div class="sb pantry-sb">${ic('search',16)}<input placeholder="Пошук в коморі..." oninput="filtPan(this.value)"></div>
    </div>
    <div id="pl">${panList(items)}</div>`;
}
function panList(items){
  return items.length?items.map(i=>`<div class="pi${isExpiredDate(i.expDate)?' exp':''}">
    <div style="color:var(--a)">${ic('box',18)}</div><span class="pn">${esc(i.name)}</span>
    <span class="pa">${i.amt?i.amt+' ':''}${i.unit||''}${i.expDate?` · до ${fmtDate(i.expDate)}`:''}</span>
    <button style="background:none;border:none;cursor:pointer;color:var(--t3);display:flex;align-items:center" onclick="delPan(${i.id})">${ic('x',16)}</button>
  </div>`).join(''):`<div class="empty" style="padding:32px"><div class="ei">${ic('home',44)}</div><p>Комора порожня.</p></div>`;
}
function filtPan(q){const fl=(window._pi||[]).filter(i=>i.name.toLowerCase().includes(q.toLowerCase()));document.getElementById('pl').innerHTML=panList(fl);}
async function delPan(id){await dbDel('pantryItems',id);renderPantry();toast('Видалено з комори');}
async function showAddPantry(){
  window._pantryProds = await dbAll('products');
  const pdl = `<datalist id="pantry_pdl">${window._pantryProds.map(p=>`<option value="${esc(p.name)}">`).join('')}</datalist>`;
  openMod(`${pdl}<div class="mt">Додати до комори</div>
    <div class="fg"><label>Назва *</label><input id="pin" list="pantry_pdl" placeholder="Рис" oninput="syncPantryProduct(this.value)"></div>
    <div class="g2">
      <div class="fg"><label>Кількість</label><input id="pia" type="number" placeholder="500" min="0"></div>
      <div class="fg"><label>Одиниця</label><select id="piu">${UNITS.map(u=>`<option>${u}</option>`).join('')}</select></div>
    </div>
    <div class="fg"><label>Придатний до</label><input id="pie" type="date"></div>
    <button class="btn bp" onclick="addPan()">${ic('check',16)} Додати до комори</button>`);
  setTimeout(()=>document.getElementById('pin')?.focus(),100);
}
function syncPantryProduct(name){
  const p = (window._pantryProds||[]).find(prod => prod.name.toLowerCase() === String(name||'').trim().toLowerCase());
  const unitSel = document.getElementById('piu');
  if (p && unitSel && p.unit) unitSel.value = p.unit;
}
async function addPan(){
  const n=document.getElementById('pin').value.trim();if(!n){toast('Введіть назву');return;}
  const unit = document.getElementById('piu').value;
  const products = window._pantryProds || await dbAll('products');
  let product = products.find(p => p.name.toLowerCase() === n.toLowerCase());
  let created = false;
  if (!product) {
    product = {
      name: n,
      unit,
      cat: 'Інше',
      kcal: null,
      prot: null,
      fat: null,
      carb: null,
      baseUnit: defaultBaseUnitForUnit(unit),
      baseQty: null,
      tags: [RECENT_PRODUCT_TAG],
      storeName: null,
      storeLink: null
    };
    const id = await dbPut('products', product);
    product.id = id;
    products.push(product);
    created = true;
  }
  await dbPut('pantryItems',{name:n,amt:document.getElementById('pia').value||null,unit:product.unit||unit,expDate:document.getElementById('pie').value||null});
  window._pantryProds = products;
  window._prods = products;
  closeMod();renderPantry();toast(`Додано до комори${created?' · продукт створено в каталозі':''}`);
}
async function showCatalog(filterCat=null){
  const prods=await dbAll('products');
  const grps={};prods.forEach(p=>{const c=p.cat||'Інше';if(!grps[c])grps[c]=[];grps[c].push(p);});
  const catFilter=PROD_CATS.filter(c=>grps[c]);
  const catChips=`<div class="chips" style="margin-bottom:10px">
    <button class="chip${!filterCat?' on':''}" onclick="showCatalog(null)">Всі</button>
    ${catFilter.map(c=>`<button class="chip${filterCat===c?' on':''}" onclick="showCatalog('${esc(c)}')" style="display:flex;align-items:center;gap:5px"><span class="cdot" style="background:${pcClr(c)}"></span>${esc(c)}</button>`).join('')}
  </div>`;
  const filteredGrps=filterCat?{[filterCat]:grps[filterCat]||[]}:grps;
  const html=Object.keys(filteredGrps).sort().map(cat=>filteredGrps[cat]?.length?`
    <div class="cat-sec">
      <div class="cat-hdr"><span class="cdot" style="background:${pcClr(cat)}"></span>${esc(cat)}</div>
      ${filteredGrps[cat].map(p=>`<div class="citem">
        <div style="flex:1;min-width:0">
          <div style="font-weight:500;font-size:13px">${esc(p.name)}</div>
          <div style="font-size:11px;color:var(--t3);margin-top:2px">${p.unit||'г'} · ${productNutritionBasis(p)} · ${p.kcal||0} ккал · Б${p.prot||0} Ж${p.fat||0} В${p.carb||0}${productUnitNote(p)?` · ${productUnitNote(p)}`:''}${p.storeName?' · '+esc(p.storeName):''}</div>
          ${productTags(p).length?`<div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:6px">${productTags(p).map(renderProductTag).join('')}</div>`:''}
        </div>
        ${p.storeLink?`<a href="${esc(p.storeLink)}" target="_blank" style="color:var(--a);display:flex;align-items:center">${ic('link',16)}</a>`:''}
        <button onclick="showProdForm(${p.id})" style="background:none;border:none;cursor:pointer;color:var(--t3);display:flex;align-items:center">${ic('edit',16)}</button>
        <button onclick="delProduct(${p.id})" style="background:none;border:none;cursor:pointer;color:var(--t3);display:flex;align-items:center">${ic('x',16)}</button>
      </div>`).join('')}
    </div>`:'').join('')||`<div class="empty" style="padding:24px"><p>Порожньо</p></div>`;
  openMod(`<div class="mt">${ic('grid',18)} Каталог продуктів</div>
    <button class="btn bs" style="margin-bottom:10px" onclick="showProdForm()">${ic('tag',16)} Новий продукт</button>
    ${catChips}${html}`);
}
async function showProdForm(id=null){
  const p=id?await dbGet('products',id):null;
  const unit=p?.unit||'г';
  const baseUnit=p?.baseUnit||defaultBaseUnitForUnit(unit);
  const tags=productTags(p);
  const hasRecentTag=tags.includes(RECENT_PRODUCT_TAG);
  const editableTags=tags.filter(t=>t!==RECENT_PRODUCT_TAG);
  openMod(`<div class="mt">${p?'Редагувати':'Новий'} продукт</div>
    <div class="fg"><label>Назва *</label><input id="pn" placeholder="Куряче філе" value="${esc(p?.name||'')}"></div>
    <div class="g2">
      <div class="fg"><label>Одиниця</label><select id="pu" onchange="syncProductMeasureFields()">${UNITS.map(u=>`<option${u===unit?' selected':''}>${u}</option>`).join('')}</select></div>
      <div class="fg"><label>Категорія</label><select id="pc">${PROD_CATS.map(c=>`<option${c===(p?.cat||'Інше')?' selected':''}>${c}</option>`).join('')}</select></div>
    </div>
    <div class="g2">
      <div class="fg"><label>КБЖВ вказані за</label><select id="pbu" onchange="syncProductMeasureFields()"><option value="г"${baseUnit==='г'?' selected':''}>100 г</option><option value="мл"${baseUnit==='мл'?' selected':''}>100 мл</option></select></div>
      <div class="fg" id="pbq_wrap" style="${needsBaseQty(unit)?'':'display:none'}"><label id="pbq_lbl">1 ${esc(unit)} =</label><div class="g2" style="grid-template-columns:1fr 90px"><input id="pbq" type="number" placeholder="62" value="${p?.baseQty||''}" min="0" step="0.01"><select id="pbqu" disabled><option value="г"${baseUnit==='г'?' selected':''}>г</option><option value="мл"${baseUnit==='мл'?' selected':''}>мл</option></select></div></div>
    </div>
    <div class="fg"><label>КБЖВ</label>
      <div class="g4">
        <div class="mfld"><label>ккал</label><input id="pkc" type="number" placeholder="0" value="${p?.kcal||''}" min="0"></div>
        <div class="mfld"><label>білки г</label><input id="ppr" type="number" placeholder="0" value="${p?.prot||''}" min="0"></div>
        <div class="mfld"><label>жири г</label><input id="pft" type="number" placeholder="0" value="${p?.fat||''}" min="0"></div>
        <div class="mfld"><label>вугл. г</label><input id="pcb" type="number" placeholder="0" value="${p?.carb||''}" min="0"></div>
      </div></div>
    ${hasRecentTag?`<div class="fg"><label>Статус</label><div class="flag-row">${renderProductTag(RECENT_PRODUCT_TAG)}</div></div>`:''}
    <div class="fg"><label>Теги</label><input id="ptags" placeholder="через кому" value="${esc(editableTags.join(', '))}"></div>
    <div class="divider"></div>
    <p style="font-size:12px;color:var(--t3);margin-bottom:10px;display:flex;align-items:center;gap:6px">${ic('link',13)} Де купити</p>
    <div class="fg"><label>Магазин</label><input id="psn" placeholder="Сільпо, АТБ..." value="${esc(p?.storeName||'')}"></div>
    <div class="fg"><label>Посилання</label><input id="psl" type="url" placeholder="https://..." value="${esc(p?.storeLink||'')}"></div>
    <button class="btn bp" onclick="saveProduct(${p?.id??'null'})">${ic('save',16)} Зберегти</button>
    <button class="btn" onclick="showCatalog()">Назад до каталогу</button>`);
  syncProductMeasureFields();
  setTimeout(()=>document.getElementById('pn')?.focus(),100);
}
function syncProductMeasureFields(){
  const unit=document.getElementById('pu')?.value||'г';
  const basisSel=document.getElementById('pbu');
  if(basisSel&&['г','кг'].includes(unit)) basisSel.value='г';
  if(basisSel&&['мл','л'].includes(unit)) basisSel.value='мл';
  const basis=basisSel?.value||defaultBaseUnitForUnit(unit);
  const wrap=document.getElementById('pbq_wrap');
  const label=document.getElementById('pbq_lbl');
  const qtyUnit=document.getElementById('pbqu');
  if(basisSel) basisSel.disabled=!needsBaseQty(unit);
  if(qtyUnit) qtyUnit.value=basis;
  if(label) label.textContent=`1 ${unit} =`;
  if(wrap) wrap.style.display=needsBaseQty(unit)?'':'none';
}
async function saveProduct(id){
  const n=document.getElementById('pn').value.trim();if(!n){toast('Введіть назву');return;}
  const unit=document.getElementById('pu').value;
  const baseUnit=document.getElementById('pbu').value||defaultBaseUnitForUnit(unit);
  const baseQty=document.getElementById('pbq')?.value?+document.getElementById('pbq').value:null;
  const hasNutrition=['pkc','ppr','pft','pcb'].some(k=>document.getElementById(k).value!=='');
  if(hasNutrition&&needsBaseQty(unit)&&!baseQty){toast('Вкажіть, скільки грамів або мл в 1 одиниці продукту');return;}
  const tags=uniqueText((document.getElementById('ptags').value||'').split(','));
  const p={name:n,unit,cat:document.getElementById('pc').value,
    kcal:document.getElementById('pkc').value?+document.getElementById('pkc').value:null,
    prot:document.getElementById('ppr').value?+document.getElementById('ppr').value:null,
    fat:document.getElementById('pft').value?+document.getElementById('pft').value:null,
    carb:document.getElementById('pcb').value?+document.getElementById('pcb').value:null,
    baseUnit,
    baseQty:needsBaseQty(unit)?baseQty:null,
    tags,
    storeName:document.getElementById('psn').value.trim()||null,
    storeLink:document.getElementById('psl').value.trim()||null};
  if(id&&id!==null&&id!=='null') p.id=id;
  await dbPut('products',p);window._prods=await dbAll('products');showCatalog();toast('Збережено');
}
async function delProduct(id){confirm2('Видалити продукт?',async()=>{await dbDel('products',id);showCatalog();toast('Видалено');});}
