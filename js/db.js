const DBN = 'MealPlannerPWA';
let db;
 
async function openDB() {
  return new Promise((ok, er) => {
    const r = indexedDB.open(DBN, 4);
    r.onupgradeneeded = e => {
      const d = e.target.result;
      ['recipes','planWeeks','shopItems','pantryItems','products'].forEach(s => {
        if (!d.objectStoreNames.contains(s))
          d.createObjectStore(s, s === 'planWeeks' ? {keyPath:'wk'} : {keyPath:'id',autoIncrement:true});
      });
    };
    r.onsuccess = async e => { db = e.target.result; await seedProds(); ok(db); };
    r.onerror = er;
  });
}
 
async function seedProds() {
  const ex = await dbAll('products');
  if (ex.length > 0) return;
  for (const p of DEF_PRODS)
    await dbPut('products', {name:p.n,unit:p.u,cat:p.cat,kcal:p.k,prot:p.p,fat:p.f,carb:p.c,storeName:null,storeLink:null});
}
 
const os  = (s, m='readonly') => db.transaction(s, m).objectStore(s);
const dbAll = s => new Promise((ok,er) => { const r=os(s).getAll(); r.onsuccess=()=>ok(r.result); r.onerror=er; });
const dbGet = (s,k) => new Promise((ok,er) => { const r=os(s).get(k); r.onsuccess=()=>ok(r.result); r.onerror=er; });
const dbPut = (s,d) => new Promise((ok,er) => { const r=os(s,'readwrite').put(d); r.onsuccess=()=>ok(r.result); r.onerror=er; });
const dbDel = (s,k) => new Promise((ok,er) => { const r=os(s,'readwrite').delete(k); r.onsuccess=()=>ok(r.result); r.onerror=er; });