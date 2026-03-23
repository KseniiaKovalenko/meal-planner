async function renderShop(){
  const el=document.getElementById('tab-shopping');
  const items=await dbAll('shopItems');
  const total=items.length,done=items.filter(i=>i.chk).length;
  const grps={};items.forEach(i=>{const c=i.cat||'Інше';if(!grps[c])grps[c]=[];grps[c].push(i);});
  const gHtml=Object.keys(grps).sort().map(cat=>`<div class="sg">
    <div class="sgt"><span class="cdot" style="background:${pcClr(cat)}"></span>${esc(cat)}</div>
    ${grps[cat].map(i=>`<div class="si${i.chk?' ck':''}${i.fromPantry?' frp':''}">
      <input type="checkbox" ${i.chk?'checked':''} onchange="togShop(${i.id},this.checked)">
      <span class="sin">${esc(i.name)}${i.fromPantry?` <span style="color:var(--a);font-size:10px">${ic('home',11)}${i.chk?'':' частково'}</span>`:''}</span>
      <span class="sia">${i.amt?i.amt+' ':''}${i.unit||''}</span>
      ${i.storeLink?`<a href="${esc(i.storeLink)}" target="_blank" style="color:var(--a);display:flex;align-items:center">${ic('link',15)}</a>`:''}
      <button class="sdl" onclick="delShop(${i.id})">${ic('x',15)}</button>
    </div>`).join('')}
  </div>`).join('')||`<div class="empty"><div class="ei">${ic('cart',44)}</div><p>Список порожній.<br>Генеруйте зі плану або додайте +</p></div>`;
  el.innerHTML=`<div class="shdr">
    <span style="font-size:13px;color:var(--t3)">${total?`${done} / ${total} куплено`:''}</span>
    <div style="display:flex;gap:6px">
      ${done>0?`<button class="chip" onclick="clrChk()">Куплено ${ic('check',13)}</button>`:''}
      ${total?`<button class="chip" onclick="clrAll()">Очистити</button>`:''}
    </div>
  </div>
  ${total>0&&done===total?`<div style="text-align:center;padding:10px;color:var(--a);font-weight:600;font-size:15px">Все куплено!</div>`:''}
  ${gHtml}
  ${items.some(i=>i.fromPantry)?`<p style="font-size:11px;color:var(--t3);padding:4px 2px;display:flex;align-items:center;gap:4px">${ic('home',12)} є в коморі${items.some(i=>i.fromPantry&&!i.chk)?' (частково — показано залишок до купівлі)':' (відмічено автоматично)'}</p>`:''}`;
}
async function togShop(id,v){const i=await dbGet('shopItems',id);if(i){i.chk=v;await dbPut('shopItems',i);renderShop();}}
async function delShop(id){await dbDel('shopItems',id);renderShop();}
async function clrChk(){const its=await dbAll('shopItems');for(const i of its.filter(i=>i.chk&&!i.fromPantry))await dbDel('shopItems',i.id);renderShop();toast('Куплені видалено');}
function clrAll(){confirm2('Очистити весь список покупок?',async()=>{const its=await dbAll('shopItems');for(const i of its)await dbDel('shopItems',i.id);renderShop();});}
function showAddShop(){
  openMod(`<div class="mt">Додати товар</div>
    <div class="fg"><label>Назва *</label><input id="sin" placeholder="Молоко"></div>
    <div class="g2">
      <div class="fg"><label>Кількість</label><input id="sia" type="number" placeholder="1" min="0"></div>
      <div class="fg"><label>Одиниця</label><select id="siu">${UNITS.map(u=>`<option>${u}</option>`).join('')}</select></div>
    </div>
    <div class="fg"><label>Категорія</label><select id="sic">${PROD_CATS.map(c=>`<option>${c}</option>`).join('')}</select></div>
    <button class="btn bp" onclick="addShop()">${ic('check',16)} Додати</button>`);
  setTimeout(()=>document.getElementById('sin')?.focus(),100);
}
async function addShop(){
  const n=document.getElementById('sin').value.trim();if(!n){toast('Введіть назву');return;}
  await dbPut('shopItems',{name:n,amt:document.getElementById('sia').value||null,unit:document.getElementById('siu').value,cat:document.getElementById('sic').value||'Інше',chk:false,manual:true,fromPantry:false,storeLink:null});
  closeMod();renderShop();toast('Додано до списку');
}