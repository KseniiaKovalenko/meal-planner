async function renderPlan() {
  const el=document.getElementById('tab-planner');
  const wk=wkKey(wkOff),dates=wkDates(wkOff);
  const plan=await dbGet('planWeeks',wk)||{wk,days:{},people:2};
  window._curPpl=plan.people||2;
  const rs=await dbAll('recipes');const rm={};rs.forEach(r=>rm[r.id]=r);
  const fd=dates[0],ld=dates[6];
  const wlbl=`${fd.d}.${String(fd.mo).padStart(2,'0')} – ${ld.d}.${String(ld.mo).padStart(2,'0')}`;
  const days=dates.map(d=>{
    const dp=plan.days[d.k]||{};
    const meals=MEALS.map(m=>{const r=dp[m.k]?rm[dp[m.k]]:null;
      return `<div class="ms${r?' fi':''}" onclick="openMP('${wk}','${d.k}','${m.k}')">
        <span class="msl">${m.l}</span>
        <span class="msn">${r?esc(r.name):`<span style="color:var(--t3);font-size:11px">Не задано</span>`}</span>
        ${r?`<button class="msc" onclick="clrM(event,'${wk}','${d.k}','${m.k}')">${ic('x',14)}</button>`:''}
      </div>`;}).join('');
    return `<div class="dc"><div class="dl">${d.n} <span style="font-weight:400;color:var(--t3);font-size:12px">${d.d}.${String(d.mo).padStart(2,'0')}</span></div>${meals}</div>`;
  }).join('');
  el.innerHTML=`<div class="wn">
    <div class="wc"><button onclick="chWk(-1)">${ic('chevL',16)}</button><span>${wlbl}</span><button onclick="chWk(1)">${ic('chevR',16)}</button></div>
    <div class="pplc">${ic('users',14)}<button onclick="chPpl(-1)">&minus;</button><span>${window._curPpl}</span><button onclick="chPpl(1)">+</button></div>
  </div>${days}
  <button class="btn bp" style="margin-top:4px" onclick="genShop()">${ic('cart',16)} Генерувати список покупок</button>`;
}
function chWk(d){wkOff+=d;renderPlan();}
async function chPpl(d){
  const wk=wkKey(wkOff);let p=await dbGet('planWeeks',wk)||{wk,days:{},people:2};
  p.people=Math.max(1,Math.min(20,(p.people||2)+d));await dbPut('planWeeks',p);renderPlan();
}
async function openMP(wk,dk,mk){
  const rs=await dbAll('recipes');if(!rs.length){toast('Спочатку додайте рецепти');return;}
  window._mprs=rs;window._mpp={wk,dk,mk};
  openMod(`<div class="mt">Обрати рецепт</div>
    <div class="sb">${ic('search',16)}<input placeholder="Пошук..." oninput="filtMP(this.value)"></div>
    <div id="mpl">${mpList(rs)}</div>`);
}
function mpList(rs){
  const{wk,dk,mk}=window._mpp||{};
  return rs.length?rs.map(r=>`<div class="pi" style="cursor:pointer" onclick="assM('${wk}','${dk}','${mk}',${r.id})">
    <div style="color:var(--a)">${ic('recipes',20)}</div><span class="pn">${esc(r.name)}</span>
    ${r.cal?`<span class="pa">${ic('flame',11)} ${r.cal}</span>`:''}
  </div>`).join(''):'<div class="empty" style="padding:20px"><p>Нічого не знайдено</p></div>';
}
function filtMP(q){const fl=(window._mprs||[]).filter(r=>r.name.toLowerCase().includes(q.toLowerCase()));document.getElementById('mpl').innerHTML=mpList(fl);}
async function assM(wk,dk,mk,rid){let p=await dbGet('planWeeks',wk)||{wk,days:{},people:2};if(!p.days[dk])p.days[dk]={};p.days[dk][mk]=rid;await dbPut('planWeeks',p);closeMod();renderPlan();}
async function clrM(e,wk,dk,mk){e.stopPropagation();let p=await dbGet('planWeeks',wk);if(p?.days?.[dk]){delete p.days[dk][mk];await dbPut('planWeeks',p);renderPlan();}}
async function genShop(){
  const wk=wkKey(wkOff);const plan=await dbGet('planWeeks',wk);
  if(!plan||!Object.keys(plan.days||{}).length){toast('План порожній');return;}
  const ppl=plan.people||2;
  const rs=await dbAll('recipes');const rm={};rs.forEach(r=>rm[r.id]=r);
  const prods=await dbAll('products');const pnm={};prods.forEach(p=>pnm[p.name.toLowerCase()]=p);
  const pantry=await dbAll('pantryItems');const pantrySet=new Set(pantry.map(p=>p.name.toLowerCase()));
  const im={};
  for(const dk of Object.keys(plan.days))for(const mk of Object.keys(plan.days[dk])){
    const r=rm[plan.days[dk][mk]];if(!r)continue;
    const sc=ppl/(r.srv||1);
    (r.ings||[]).forEach(ing=>{
      if(!ing.n)return;const key=ing.n.toLowerCase();const prod=pnm[key];const inP=pantrySet.has(key);
      if(!im[key])im[key]={name:ing.n,amt:0,unit:ing.u||'',cat:prod?.cat||'Інше',fromPantry:inP,storeLink:prod?.storeLink||null,storeName:prod?.storeName||null};
      im[key].amt+=(parseFloat(ing.a)||0)*sc;
    });
  }
  const ex=await dbAll('shopItems');for(const it of ex.filter(i=>!i.manual))await dbDel('shopItems',it.id);
  const keys=Object.keys(im);if(!keys.length){showTab('shopping');toast('Немає інгредієнтів');return;}
  for(const k of keys){const i=im[k];await dbPut('shopItems',{name:i.name,amt:i.amt?parseFloat(i.amt.toFixed(2)):null,unit:i.unit,cat:i.cat,chk:i.fromPantry,manual:false,fromPantry:i.fromPantry,storeLink:i.storeLink,storeName:i.storeName});}
  showTab('shopping');toast(`Додано ${keys.length} позицій (${ppl} осіб)`);
}