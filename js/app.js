// ── Global state ──
let curTab='recipes', wkOff=0, fCat='all', fQ='';
 
const HDR_ICO = {recipes:'recipes',planner:'calendar',shopping:'cart',pantry:'box'};
const HDR_LBL = {recipes:'Рецепти',planner:'Планувальник',shopping:'Список покупок',pantry:'Комора'};
 
function showTab(tab){
  curTab=tab;
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('on'));
  document.getElementById('tab-'+tab).classList.add('on');
  document.querySelectorAll('.nb').forEach((b,i)=>b.classList.toggle('on',['recipes','planner','shopping','pantry'][i]===tab));
  document.getElementById('ht').textContent=HDR_LBL[tab];
  document.getElementById('hico').innerHTML=ic(HDR_ICO[tab],16);
  document.getElementById('fab').style.display=tab==='planner'?'none':'flex';
  document.getElementById('ha').innerHTML=`<button class="hbtn" onclick="showSettings()">${ic('save',16)}</button>`;
  render(tab);
}
async function render(tab){
  if(tab==='recipes')await renderRec();
  else if(tab==='planner')await renderPlan();
  else if(tab==='shopping')await renderShop();
  else if(tab==='pantry')await renderPantry();
}
function fabAct(){
  if(curTab==='recipes')showRForm();
  else if(curTab==='shopping')showAddShop();
  else if(curTab==='pantry')showAddPantry();
}
 
// ── Service Worker ──
if('serviceWorker' in navigator){
  navigator.serviceWorker.register('/sw.js').catch(console.error);
}
 
// ── Init ──
openDB().then(()=>{
  document.getElementById('hico').innerHTML=ic('recipes',16);
  document.getElementById('ha').innerHTML=`<button class="hbtn" onclick="showSettings()">${ic('save',16)}</button>`;
  render('recipes');
}).catch(console.error);