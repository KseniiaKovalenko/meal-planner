async function renderRec() {
  const el = document.getElementById('tab-recipes');
  const rs = await dbAll('recipes');
  const allTags = ['all',...new Set(rs.flatMap(r=>[r.cat,...(r.tags||[])]).filter(Boolean))];
  let fl = [...rs];
  if (fCat !== 'all') fl = fl.filter(r => r.cat===fCat || (r.tags||[]).includes(fCat));
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
  const tags = [(r.cat||''),(r.tags||[])].flat().filter(Boolean).map(t=>`<span class="tg">${esc(t)}</span>`).join('');
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
  window._fd = {id:r?.id,name:r?.name||'',cat:r?.cat||'',time:r?.time||'',srv:r?.srv||'',
    cal:r?.cal||'',pro:r?.pro||'',fat:r?.fat||'',carb:r?.carb||'',link:r?.link||'',
    tags:r?.tags?[...r.tags]:[],photo:r?.photo||null,
    ings:r?.ings?.length?JSON.parse(JSON.stringify(r.ings)):[{n:'',a:'',u:'г',pid:null}],
    steps:r?.steps?.length?[...r.steps]:['']};
  const pdl = `<datalist id="pdl">${window._prods.map(p=>`<option value="${esc(p.name)}">`).join('')}</datalist>`;
  openMod(`${pdl}<div class="mt">${id?'Редагувати':'Новий'} рецепт</div>
    <div class="fg"><label>Фото</label>
      <div class="pp" id="pp" onclick="document.getElementById('pf').click()">${r?.photo?`<img src="${r.photo}">`:`${ic('camera',24)}<span>Додати фото</span>`}</div>
      <input type="file" id="pf" accept="image/*" style="display:none" onchange="handlePhoto(this)"></div>
    <div class="fg"><label>Назва *</label><input placeholder="Назва рецепту" value="${esc(r?.name||'')}" oninput="window._fd.name=this.value"></div>
    <div class="fg"><label>Категорія</label><select onchange="window._fd.cat=this.value"><option value="">Оберіть...</option>${CATS.map(c=>`<option value="${c}"${r?.cat===c?' selected':''}>${c}</option>`).join('')}</select></div>
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
  const rd=new FileReader();
  rd.onload=e=>{window._fd.photo=e.target.result;document.getElementById('pp').innerHTML=`<img src="${e.target.result}">`;};
  rd.readAsDataURL(f);
}
async function autoCalc() {
  const prods=window._prods||await dbAll('products');
  const pid={};prods.forEach(p=>pid[p.id]=p);
  const pnm={};prods.forEach(p=>pnm[p.name.toLowerCase()]=p);
  const srv=parseInt(window._fd.srv)||1;
  let kc=0,pr=0,ft=0,cb=0,has=false;
  for (const ing of window._fd.ings) {
    const p=ing.pid?pid[ing.pid]:pnm[(ing.n||'').toLowerCase()];
    if(!p?.kcal||!ing.a) continue;
    const a=parseFloat(ing.a)||0;
    let g=ing.u==='г'?a:ing.u==='кг'?a*1000:ing.u==='мл'?a:ing.u==='л'?a*1000:0;
    if(!g) continue;
    kc+=g*p.kcal/100;pr+=g*(p.prot||0)/100;ft+=g*(p.fat||0)/100;cb+=g*(p.carb||0)/100;has=true;
  }
  if(!has){toast('Вкажіть КБЖВ у каталозі продуктів');return;}
  window._fd.cal=Math.round(kc/srv);window._fd.pro=Math.round(pr/srv);
  window._fd.fat=Math.round(ft/srv);window._fd.carb=Math.round(cb/srv);
  const ins=document.querySelectorAll('#mc .g4 input');
  if(ins[0])ins[0].value=window._fd.cal;if(ins[1])ins[1].value=window._fd.pro;
  if(ins[2])ins[2].value=window._fd.fat;if(ins[3])ins[3].value=window._fd.carb;
  toast(`${window._fd.cal} ккал · Б${window._fd.pro} Ж${window._fd.fat} В${window._fd.carb} ✓`);
}
async function saveRec() {
  const fd=window._fd; if(!fd.name.trim()){toast('Введіть назву');return;}
  const rec={name:fd.name.trim(),cat:fd.cat,time:fd.time?+fd.time:null,srv:fd.srv?+fd.srv:null,
    cal:fd.cal?+fd.cal:null,pro:fd.pro?+fd.pro:null,fat:fd.fat?+fd.fat:null,carb:fd.carb?+fd.carb:null,
    tags:fd.tags,photo:fd.photo,link:fd.link||null,
    ings:fd.ings.filter(i=>i.n.trim()),steps:fd.steps.filter(s=>s.trim())};
  if(fd.id) rec.id=fd.id;
  await dbPut('recipes',rec); closeMod(); renderRec(); toast(fd.id?'Рецепт оновлено':'Рецепт додано');
}