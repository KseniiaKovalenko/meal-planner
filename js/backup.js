async function exportData(){
  const data={
    recipes:await dbAll('recipes'),products:await dbAll('products'),
    pantryItems:await dbAll('pantryItems'),planWeeks:await dbAll('planWeeks'),
    shopItems:await dbAll('shopItems'),exportedAt:new Date().toISOString(),version:1
  };
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;
  const d=new Date();
  a.download=`menu-backup-${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}.json`;
  a.click();URL.revokeObjectURL(url);toast('Дані експортовано ✓');
}
async function importData(file){
  try{
    const text=await file.text();const data=JSON.parse(text);
    if(!data.recipes&&!data.products){toast('Невірний формат файлу');return;}
    const stores=['recipes','products','pantryItems','planWeeks','shopItems'];
    for(const s of stores){
      if(!data[s])continue;
      const ex=await dbAll(s);
      for(const it of ex)await dbDel(s,it.id||it.wk);
      for(const it of data[s])await dbPut(s,it);
    }
    closeMod();render(curTab);toast(`Імпортовано: ${(data.recipes||[]).length} рецептів ✓`);
  }catch(e){toast('Помилка читання файлу');}
}
function showSettings(){
  openMod(`<div class="mt">${ic('save',18)} Резервна копія</div>
    <p style="font-size:13px;color:var(--t2);margin-bottom:16px;line-height:1.6">Збережіть всі дані у файл для резервної копії або передачі на інший пристрій.</p>
    <button class="btn bp" onclick="exportData()">${ic('save',16)} Експортувати дані</button>
    <div style="height:1px;background:var(--b0);margin:16px 0"></div>
    <p style="font-size:13px;color:var(--t2);margin-bottom:12px;line-height:1.6">Відновити дані з файлу. Поточні дані будуть замінені.</p>
    <button class="btn bs" onclick="document.getElementById('impf').click()">${ic('arrowL',16)} Імпортувати дані</button>
    <input type="file" id="impf" accept=".json" style="display:none" onchange="importData(this.files[0])">
    <p style="font-size:11px;color:var(--t3);margin-top:8px">Файл формату .json отриманий через «Експорт»</p>`);
}