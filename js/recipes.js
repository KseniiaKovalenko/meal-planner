async function renderRec() {
  const el = document.getElementById('tab-recipes');
  const rs = await dbAll('recipes');
  const allTags = ['all',...new Set(rs.flatMap(r=>recipeTags(r)).filter(Boolean))];
  let fl = [...rs];
  if (fCat !== 'all') fl = fl.filter(r => recipeTags(r).includes(fCat));
  if (fQ) fl = fl.filter(r => r.name.toLowerCase().includes(fQ.toLowerCase()));
  const chips = allTags.slice(0,14).map(c =>
    `<button class="chip${c===fCat?' on':''}" data-c="${esc(c)}" onclick="setCat(this.dataset.c)">${c==='all'?'Всі':c}</button>`
  ).join('');
  const cards = fl.length
    ? `<div class="rg">${fl.map(r=>`<div class="rc" onclick="showRec(${r.id})">
        <div class="rth">${r.photo?`<img src="${r.photo}">`:ic('recipes',30)}</div>
        <div class="rin"><div class="rn">${esc(r.name)}</div>
        <div class="rm">${r.time?`${ic('clock',12)} ${r.time}хв`:''}
        ${r.cal?`&nbsp;${ic('flame',11)} ${r.cal}`:''}</div></div></div>`).join('')}</div>`
    : `<div class="empty"><div class="ei">${ic('recipes',44)}</div><p>Рецептів ще немає.<br>Натисніть + щоб додати</p></div>`;
  el.innerHTML = `<div class="sb">${ic('search',16)}<input placeholder="Пошук рецептів..." value="${esc(fQ)}" oninput="fQ=this.value;renderRec()"></div>
    <div class="chips">${chips}</div>${cards}`;
}
function setCat(c) { fCat = c; renderRec(); }
 
async function showRec(id) {
  const r = await dbGet('recipes', id); if (!r) return;
  window._viewSrv = r.srv||1; window._viewRec = r; _drawRec();
}
function _drawRec() {
  const r=window._viewRec, vs=window._viewSrv, bs=r.srv||1, sc=vs/bs;
  const img = r.photo ? `<div class="rdi"><img src="${r.photo}"></div>` : `<div class="rdi">${ic('recipes',52)}</div>`;
  const mac = (r.cal||r.pro||r.fat||r.carb) ? `<div class="mac">
    ${r.cal?`<div class="mc"><div class="mv">${Math.round(r.cal*sc)}</div><div class="ml">ккал</div></div>`:''}
    ${r.pro?`<div class="mc"><div class="mv">${fmtAmt(r.pro*sc)}</div><div class="ml">білки</div></div>`:''}
    ${r.fat?`<div class="mc"><div class="mv">${fmtAmt(r.fat*sc)}</div><div class="ml">жири</div></div>`:''}
    ${r.carb?`<div class="mc"><div class="mv">${fmtAmt(r.carb*sc)}</div><div class="ml">вугл.</div></div>`:''}
  </div>` : '';
  const ings = (r.ings||[]).map(i => `<div class="irow"><span style="color:var(--t2)">${esc(i.n)}</span><span>${i.a?fmtAmt(parseFloat(i.a)*sc):''} ${i.u||''}</span></div>`).join('');
  const steps = (r.steps||[]).map((s,i) => `<div class="strow"><div class="stnum">${i+1}</div><div class="sttxt">${esc(s)}</div></div>`).join('');
  const tags = recipeTags(r).map(t=>`<span class="tg">${esc(t)}</span>`).join('');
  openMod(`${img}
    <div class="mt" style="margin-bottom:5px">${esc(r.name)}</div>
    ${r.link?`<a href="${esc(r.link)}" target="_blank" style="display:inline-flex;align-items:center;gap:6px;color:var(--a);font-size:13px;text-decoration:none;margin-bottom:10px">${ic('link',14)} Переглянути рецепт</a><br>`:''}
    <div style="margin-bottom:10px">${tags}</div>
    <div class="srv-adj"><button onclick="adjSrv(-1)">&minus;</button><span>${ic('users',14)}&nbsp;${vs} ${srvLabel(vs)}</span><button onclick="adjSrv(1)">+</button></div>
    ${mac}
    ${r.time||bs?`<p style="font-size:12px;color:var(--t3);margin-bottom:10px">${r.time?`${ic('clock',12)} ${r.time} хв`:''}${bs?` &nbsp;${ic('users',12)} базово ${bs} ${srvLabel(bs)}`:''}</p>`:''}
    ${ings?`<div class="st">${ic('tag',16)} Інгредієнти</div>${ings}`:''}
    ${steps?`<div class="st">${ic('clock',16)} Кроки</div>${steps}`:''}
    <div style="height:14px"></div>
    <button class="btn bs" onclick="showRForm(${r.id})">${ic('edit',16)} Редагувати</button>
    <button class="btn bd" onclick="delRec(${r.id})">${ic('trash',16)} Видалити</button>`);
}
function adjSrv(d) { window._viewSrv = Math.max(1, window._viewSrv+d); _drawRec(); }
async function delRec(id) { confirm2('Видалити цей рецепт?', async()=>{ await dbDel('recipes',id); closeMod(); renderRec(); toast('Рецепт видалено'); }); }
 
async function showRForm(id=null) {
  const r = id ? await dbGet('recipes',id) : null;
  window._prods = await dbAll('products');
  window._fd = {id:r?.id,name:r?.name||'',time:r?.time||'',srv:r?.srv||'',
    cal:r?.cal||'',pro:r?.pro||'',fat:r?.fat||'',carb:r?.carb||'',link:r?.link||'',
    tags:recipeTags(r),photo:r?.photo||null,
    ings:r?.ings?.length?JSON.parse(JSON.stringify(r.ings)):[{n:'',a:'',u:'г',pid:null}],
    steps:r?.steps?.length?[...r.steps]:['']};
  const pdl = `<datalist id="pdl">${window._prods.map(p=>`<option value="${esc(p.name)}">`).join('')}</datalist>`;
  openMod(`${pdl}<div class="mt">${id?'Редагувати':'Новий'} рецепт</div>
    <div class="fg"><label>Фото</label>
      <div class="pp" id="pp" onclick="document.getElementById('pf').click()">${r?.photo?`<img src="${r.photo}">`:`${ic('camera',24)}<span>Додати фото</span>`}</div>
      <input type="file" id="pf" accept="image/*" style="display:none" onchange="handlePhoto(this)"></div>
    <div class="fg"><label>Назва *</label><input placeholder="Назва рецепту" value="${esc(r?.name||'')}" oninput="window._fd.name=this.value"></div>
    <div class="fg"><label>Теги</label><div class="tagsw">${TAGS.map(t=>`<button class="ts${(window._fd.tags||[]).includes(t)?' on':''}" data-t="${esc(t)}" onclick="togTag(this.dataset.t,this)">${esc(t)}</button>`).join('')}</div></div>
    <div class="g2">
      <div class="fg"><label>Час (хв)</label><input type="number" placeholder="30" value="${esc(r?.time||'')}" oninput="window._fd.time=this.value" min="0"></div>
      <div class="fg"><label>Порцій</label><input type="number" placeholder="4" value="${esc(r?.srv||'')}" oninput="window._fd.srv=this.value" min="1"></div>
    </div>
    <div class="fg"><label>КБЖВ (на 1 порцію)</label>
      <div class="g4">
        <div class="mfld"><label>ккал</label><input id="cal_in" type="number" placeholder="0" value="${esc(r?.cal||'')}" oninput="window._fd.cal=this.value" min="0"></div>
        <div class="mfld"><label>білки г</label><input type="number" placeholder="0" value="${esc(r?.pro||'')}" oninput="window._fd.pro=this.value" min="0"></div>
        <div class="mfld"><label>жири г</label><input type="number" placeholder="0" value="${esc(r?.fat||'')}" oninput="window._fd.fat=this.value" min="0"></div>
        <div class="mfld"><label>вугл. г</label><input type="number" placeholder="0" value="${esc(r?.carb||'')}" oninput="window._fd.carb=this.value" min="0"></div>
      </div>
      <div class="note"><button class="autob" onclick="autoCalc()">${ic('zap',12)} Авто з інгредієнтів</button></div></div>
    <div class="fg"><label>Посилання на рецепт</label><input type="url" placeholder="https://..." value="${esc(r?.link||'')}" oninput="window._fd.link=this.value"></div>
    <div class="fg"><label>Інгредієнти</label><div id="ic"></div><button class="btn bs" style="margin-top:6px" onclick="addIng()">${ic('tag',15)} Додати інгредієнт</button></div>
    <div class="fg"><label>Кроки приготування</label><div id="sc"></div><button class="btn bs" style="margin-top:6px" onclick="addStep()">${ic('clock',15)} Додати крок</button></div>
    <button class="btn bp" onclick="saveRec()">${ic('save',16)} Зберегти</button>
    <button class="btn" onclick="closeMod()">Скасувати</button>`);
  renderIngs(); renderSteps();
}
function togTag(t,el) { const i=window._fd.tags.indexOf(t); if(i>=0) window._fd.tags.splice(i,1); else window._fd.tags.push(t); el.classList.toggle('on'); }
function updIng(i,k,v) { if(window._fd.ings[i]) window._fd.ings[i][k]=v; }
function chkProd(i,v) {
  const p = (window._prods||[]).find(p => p.name.toLowerCase()===v.toLowerCase());
  if (p) { window._fd.ings[i].pid=p.id; const s=document.getElementById(`usel_${i}`); if(s&&p.unit){s.value=p.unit;window._fd.ings[i].u=p.unit;} }
  else window._fd.ings[i].pid = null;
}
function renderIngs() {
  document.getElementById('ic').innerHTML = window._fd.ings.map((g,i) => `
    <div class="ir">
      <input list="pdl" placeholder="Продукт" value="${esc(g.n||'')}" oninput="updIng(${i},'n',this.value);chkProd(${i},this.value)">
      <input type="number" placeholder="К-сть" value="${g.a||''}" oninput="updIng(${i},'a',this.value)" step="0.01" min="0">
      ${uSel(g.u,i)}
      <button onclick="rmIng(${i})">${ic('x',16)}</button>
    </div>`).join('');
}
function renderSteps() {
  document.getElementById('sc').innerHTML = window._fd.steps.map((s,i) => `
    <div class="sr"><div class="sn">${i+1}</div>
    <textarea placeholder="Опис кроку..." oninput="window._fd.steps[${i}]=this.value">${esc(s||'')}</textarea>
    <button onclick="rmStep(${i})" style="margin-top:8px;background:none;border:none;cursor:pointer;color:var(--t3);display:flex;align-items:center">${ic('x',16)}</button></div>`).join('');
}
function addIng() { window._fd.ings.push({n:'',a:'',u:'г',pid:null}); renderIngs(); }
function rmIng(i) { window._fd.ings.splice(i,1); renderIngs(); }
function addStep() { window._fd.steps.push(''); renderSteps(); }
function rmStep(i) { window._fd.steps.splice(i,1); renderSteps(); }
function handlePhoto(inp) {
  const f=inp.files[0]; if(!f) return;
  const img=new Image();
  img.onload=()=>{
    const MAX=800;
    let w=img.width,h=img.height;
    if(w>MAX||h>MAX){const r=Math.min(MAX/w,MAX/h);w=Math.round(w*r);h=Math.round(h*r);}
    const c=document.createElement('canvas');c.width=w;c.height=h;
    c.getContext('2d').drawImage(img,0,0,w,h);
    const data=c.toDataURL('image/jpeg',0.7);
    window._fd.photo=data;
    document.getElementById('pp').innerHTML=`<img src="${data}">`;
  };
  img.src=URL.createObjectURL(f);
}
async function autoCalc() {
  const prods=window._prods||await dbAll('products');
  const pid={};prods.forEach(p=>pid[p.id]=p);
  const pnm={};prods.forEach(p=>pnm[p.name.toLowerCase()]=p);
  const srv=parseInt(window._fd.srv)||1;
  let kc=0,pr=0,ft=0,cb=0,has=false;
  let skipped=0;
  for (const ing of window._fd.ings) {
    const p=ing.pid?pid[ing.pid]:pnm[(ing.n||'').toLowerCase()];
    const hasMacros=[p?.kcal,p?.prot,p?.fat,p?.carb].some(v=>v!=null);
    if(!hasMacros||!ing.a) continue;
    const a=parseFloat(ing.a)||0;
    const baseAmt=productBaseAmount(p,a,ing.u||p?.unit);
    if(!baseAmt){skipped++;continue;}
    kc+=baseAmt*(p.kcal||0)/100;
    pr+=baseAmt*(p.prot||0)/100;
    ft+=baseAmt*(p.fat||0)/100;
    cb+=baseAmt*(p.carb||0)/100;
    has=true;
  }
  if(!has){toast('Вкажіть КБЖВ і вагу/обʼєм одиниці у каталозі продуктів');return;}
  window._fd.cal=Math.round(kc/srv);window._fd.pro=Math.round(pr/srv);
  window._fd.fat=Math.round(ft/srv);window._fd.carb=Math.round(cb/srv);
  const ins=document.querySelectorAll('#mc .g4 input');
  if(ins[0])ins[0].value=window._fd.cal;if(ins[1])ins[1].value=window._fd.pro;
  if(ins[2])ins[2].value=window._fd.fat;if(ins[3])ins[3].value=window._fd.carb;
  toast(`${window._fd.cal} ккал · Б${window._fd.pro} Ж${window._fd.fat} В${window._fd.carb}${skipped?` · ${skipped} пропущено`:''} ✓`);
}
async function saveRec() {
  const fd=window._fd; if(!fd.name.trim()){toast('Введіть назву');return;}
  const products = await dbAll('products');
  const byId = {};
  const byName = {};
  products.forEach(p => {
    byId[p.id] = p;
    byName[p.name.toLowerCase()] = p;
  });
  let addedCount = 0;
  for (const ing of fd.ings) {
    const name = ing.n.trim();
    if (!name) continue;
    const existing = (ing.pid && byId[ing.pid]) || byName[name.toLowerCase()];
    if (existing) {
      ing.pid = existing.id;
      continue;
    }
    const product = {
      name,
      unit: ing.u || 'г',
      cat: 'Інше',
      kcal: null,
      prot: null,
      fat: null,
      carb: null,
      baseUnit: defaultBaseUnitForUnit(ing.u || 'г'),
      baseQty: null,
      tags: [RECENT_PRODUCT_TAG],
      storeName: null,
      storeLink: null
    };
    const id = await dbPut('products', product);
    product.id = id;
    byId[id] = product;
    byName[name.toLowerCase()] = product;
    products.push(product);
    ing.pid = id;
    addedCount++;
  }
  window._prods = products;
  const rec={name:fd.name.trim(),time:fd.time?+fd.time:null,srv:fd.srv?+fd.srv:null,
    cal:fd.cal?+fd.cal:null,pro:fd.pro?+fd.pro:null,fat:fd.fat?+fd.fat:null,carb:fd.carb?+fd.carb:null,
    tags:uniqueText(fd.tags),photo:fd.photo,link:fd.link||null,
    ings:fd.ings.filter(i=>i.n.trim()),steps:fd.steps.filter(s=>s.trim())};
  if(fd.id) rec.id=fd.id;
  await dbPut('recipes',rec); closeMod(); renderRec(); toast(`${fd.id?'Рецепт оновлено':'Рецепт додано'}${addedCount?` · нових продуктів: ${addedCount}`:''}`);
}
