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
    r.onsuccess = async e => { db = e.target.result; await seedProds(); await normalizeStoredData(); ok(db); };
    r.onerror = er;
  });
}

async function seedProds() {
  const ex = await dbAll('products');
  if (ex.length > 0) return;
  for (const p of DEF_PRODS)
    await dbPut('products', {name:p.n,unit:p.u,cat:p.cat,kcal:p.k,prot:p.p,fat:p.f,carb:p.c,baseUnit:p.bu||defaultBaseUnitForUnit(p.u),baseQty:p.bq||null,tags:[],storeName:null,storeLink:null});
}

async function normalizeStoredData() {
  await normalizeRecipes();
  await normalizeProducts();
}

async function normalizeRecipes() {
  const recipes = await dbAll('recipes');
  for (const recipe of recipes) {
    const tags = recipeTags(recipe);
    const changed = JSON.stringify(tags) !== JSON.stringify(recipe.tags||[]) || Object.prototype.hasOwnProperty.call(recipe, 'cat');
    if (!changed) continue;
    const next = {...recipe, tags};
    delete next.cat;
    await dbPut('recipes', next);
  }
}

async function normalizeProducts() {
  const products = await dbAll('products');
  const defs = {};
  DEF_PRODS.forEach(p => { defs[p.n.toLowerCase()] = p; });
  for (const product of products) {
    const def = defs[(product.name||'').toLowerCase()];
    const next = {...product};
    let changed = false;
    const tags = productTags(product);
    if (JSON.stringify(tags) !== JSON.stringify(product.tags||[])) {
      next.tags = tags;
      changed = true;
    }
    const baseUnit = next.baseUnit || def?.bu || defaultBaseUnitForUnit(next.unit);
    if (baseUnit !== next.baseUnit) {
      next.baseUnit = baseUnit;
      changed = true;
    }
    if ((next.baseQty == null || next.baseQty === '') && def?.bq && needsBaseQty(next.unit)) {
      next.baseQty = def.bq;
      changed = true;
    }
    if (changed) await dbPut('products', next);
  }
}

const os = (s, m='readonly') => db.transaction(s, m).objectStore(s);

/* ── Local IndexedDB CRUD (internal) ── */
const _localAll = s => new Promise((ok,er) => { const r=os(s).getAll(); r.onsuccess=()=>ok(r.result); r.onerror=er; });
const _localGet = (s,k) => new Promise((ok,er) => { const r=os(s).get(k); r.onsuccess=()=>ok(r.result); r.onerror=er; });
const _localPut = (s,d) => new Promise((ok,er) => { const r=os(s,'readwrite').put(d); r.onsuccess=()=>ok(r.result); r.onerror=er; });
const _localDel = (s,k) => new Promise((ok,er) => { const r=os(s,'readwrite').delete(k); r.onsuccess=()=>ok(r.result); r.onerror=er; });

/* ── Public CRUD with cloud sync ── */
async function dbAll(s) { return _localAll(s); }
async function dbGet(s,k) { return _localGet(s,k); }

async function dbPut(s,d) {
  /* Generate unique ID when sync is active (prevents ID conflicts between devices) */
  if (_fs && _hhId && s !== 'planWeeks' && !d.id && !d.wk) {
    d.id = Date.now() + Math.floor(Math.random() * 1000);
  }
  const result = await _localPut(s,d);
  if (_fs && _hhId && !_fromCloud) {
    try {
      const key = s === 'planWeeks' ? d.wk : String(d.id || result);
      if (s !== 'planWeeks' && !d.id) d.id = result;
      await _fs.collection('households').doc(_hhId).collection(s)
        .doc(key).set(JSON.parse(JSON.stringify(d)));
    } catch(e) { console.warn('sync put:', e.message); }
  }
  return result;
}

async function dbDel(s,k) {
  const result = await _localDel(s,k);
  if (_fs && _hhId && !_fromCloud) {
    try {
      await _fs.collection('households').doc(_hhId).collection(s)
        .doc(String(k)).delete();
    } catch(e) { console.warn('sync del:', e.message); }
  }
  return result;
}
