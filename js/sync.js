/* ── Firebase Cloud Sync ── */
let _fbAuth,_fbFs;
let _fs=null,_hhId=null,_fromCloud=false;
let _unsubs=[],_renderTimer;

function initFirebase(){
  if(!FIREBASE_CONFIG.apiKey||typeof firebase==='undefined')return;
  firebase.initializeApp(FIREBASE_CONFIG);
  _fbAuth=firebase.auth();
  _fbFs=firebase.firestore();
  _fbFs.enablePersistence({synchronizeTabs:true}).catch(()=>{});
  _fbAuth.onAuthStateChanged(_onAuth);
}

function _fsCol(s){return _fbFs.collection('households').doc(_hhId).collection(s);}

/* ── Auth ── */
async function _onAuth(user){
  if(user){
    try{
      const uDoc=await _fbFs.collection('users').doc(user.uid).get();
      if(uDoc.exists){
        _hhId=uDoc.data().householdId;_fs=_fbFs;
        await _pullCloud();
        _startListeners();
      }else{
        _showCloudSetup(user);
      }
    }catch(e){console.error('auth:',e);}
  }else{
    _unsubAll();_fs=null;_hhId=null;
  }
  updateAuthUI();
}

function cloudSignIn(){
  if(!FIREBASE_CONFIG.apiKey||typeof firebase==='undefined'){toast('Firebase не налаштовано');return;}
  _fbAuth.signInWithPopup(new firebase.auth.GoogleAuthProvider()).catch(e=>toast('Помилка входу'));
}

function cloudSignOut(){
  _unsubAll();_fs=null;_hhId=null;
  _fbAuth.signOut();updateAuthUI();render(curTab);toast('Вийшли з хмари');
}

/* ── Household ── */
async function _createHousehold(){
  const user=_fbAuth.currentUser;if(!user)return;
  const hhId=user.uid;
  const code=_genCode();
  /* Спочатку створюємо user doc (потрібен для Firestore Rules) */
  await _fbFs.collection('users').doc(user.uid).set({
    householdId:hhId,name:user.displayName||'',email:user.email||''
  });
  await _fbFs.collection('households').doc(hhId).set({
    owner:user.uid,code,
    createdAt:firebase.firestore.FieldValue.serverTimestamp(),
    members:[user.uid]
  });
  await _fbFs.collection('inviteCodes').doc(code).set({householdId:hhId});
  _hhId=hhId;_fs=_fbFs;
  await _pushCloud();
  _startListeners();
  closeMod();updateAuthUI();render(curTab);
  toast('Хмарну синхронізацію увімкнено!');
}

async function _joinWithCode(){
  const code=(document.getElementById('jcode')?.value||'').toUpperCase().trim();
  if(!code){toast('Введіть код');return;}
  try{
    const snap=await _fbFs.collection('inviteCodes').doc(code).get();
    if(!snap.exists){toast('Невірний код');return;}
    const hhId=snap.data().householdId;
    const user=_fbAuth.currentUser;
    await _fbFs.collection('users').doc(user.uid).set({
      householdId:hhId,name:user.displayName||'',email:user.email||''
    });
    await _fbFs.collection('households').doc(hhId).update({
      members:firebase.firestore.FieldValue.arrayUnion(user.uid)
    });
    _hhId=hhId;_fs=_fbFs;
    await _pullCloud();
    _startListeners();
    closeMod();updateAuthUI();render(curTab);
    toast('Приєднано! Дані синхронізовано.');
  }catch(e){toast('Помилка приєднання');}
}

function _genCode(){
  const c='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let r='';for(let i=0;i<6;i++)r+=c[Math.floor(Math.random()*c.length)];
  return r;
}

/* ── Sync ── */
const STORES=['recipes','products','pantryItems','planWeeks','shopItems'];

async function _pushCloud(){
  for(const s of STORES){
    const items=await _localAll(s);
    for(const item of items){
      const key=s==='planWeeks'?item.wk:String(item.id);
      if(!key)continue;
      try{await _fsCol(s).doc(key).set(JSON.parse(JSON.stringify(item)));}catch(e){console.warn('push:',e.message);}
    }
  }
}

async function _pullCloud(){
  _fromCloud=true;
  try{
    for(const s of STORES){
      const snap=await _fsCol(s).get();
      if(snap.empty)continue;
      const local=await _localAll(s);
      for(const item of local)await _localDel(s,item.id||item.wk);
      for(const d of snap.docs)await _localPut(s,d.data());
    }
    await normalizeStoredData();
  }catch(e){console.error('pull:',e);}
  _fromCloud=false;
}

function _unsubAll(){_unsubs.forEach(u=>u());_unsubs=[];}

function _startListeners(){
  _unsubAll();
  STORES.forEach(s=>{
    _unsubs.push(_fsCol(s).onSnapshot(snap=>{
      snap.docChanges().forEach(async ch=>{
        _fromCloud=true;
        try{
          if(ch.type==='removed'){
            const d=ch.doc.data();await _localDel(s,d.id||d.wk);
          }else{
            await _localPut(s,ch.doc.data());
          }
        }catch(e){}
        _fromCloud=false;
      });
      clearTimeout(_renderTimer);
      _renderTimer=setTimeout(()=>render(curTab),200);
    }));
  });
}

async function _forceSync(){
  closeMod();toast('Синхронізація...');
  await _pullCloud();render(curTab);toast('Синхронізовано!');
}

/* ── UI ── */
function updateAuthUI(){
  const ha=document.getElementById('ha');if(!ha)return;
  if(!FIREBASE_CONFIG.apiKey||typeof firebase==='undefined'){
    ha.innerHTML=`<button class="hbtn" onclick="showSettings()">${ic('save',16)}</button>`;
    return;
  }
  const user=_fbAuth?.currentUser;
  if(user&&_hhId){
    ha.innerHTML=`<button class="hbtn" onclick="showCloudPanel()" style="color:var(--a)">${ic('cloud',16)}</button>
      <button class="hbtn" onclick="showSettings()">${ic('save',16)}</button>`;
  }else{
    ha.innerHTML=`<button class="hbtn" onclick="cloudSignIn()">${ic('cloud',16)}</button>
      <button class="hbtn" onclick="showSettings()">${ic('save',16)}</button>`;
  }
}

function _showCloudSetup(user){
  openMod(`<div class="mt">${ic('cloud',18)} Хмарна синхронізація</div>
    <p style="font-size:13px;color:var(--t2);margin-bottom:16px;line-height:1.6">Вітаємо, ${esc(user.displayName||'')}!</p>
    <button class="btn bp" onclick="_createHousehold()">${ic('zap',16)} Створити нову сім'ю</button>
    <p style="font-size:12px;color:var(--t3);margin-top:8px;margin-bottom:16px;line-height:1.5">Ваші поточні рецепти, план та комора будуть завантажені в хмару.</p>
    <div style="height:1px;background:var(--b0);margin:16px 0"></div>
    <p style="font-size:13px;color:var(--t2);margin-bottom:12px;line-height:1.6">Або приєднатися до існуючої за кодом:</p>
    <div class="fg"><input id="jcode" placeholder="ABC123" maxlength="6" style="text-transform:uppercase;text-align:center;font-size:18px;letter-spacing:4px"></div>
    <button class="btn bs" onclick="_joinWithCode()">${ic('users',16)} Приєднатися</button>
    <p style="font-size:11px;color:var(--t3);margin-top:8px;line-height:1.5">Ваші локальні дані будуть замінені даними сім'ї.</p>`);
}

async function showCloudPanel(){
  const user=_fbAuth.currentUser;if(!user||!_hhId)return;
  let code='...',memberNames=[];
  try{
    const hhDoc=await _fbFs.collection('households').doc(_hhId).get();
    code=hhDoc.data()?.code||'—';
    const members=hhDoc.data()?.members||[];
    for(const uid of members){
      const u=await _fbFs.collection('users').doc(uid).get();
      if(u.exists)memberNames.push(u.data().name||u.data().email||uid.slice(0,8));
    }
  }catch(e){}
  openMod(`<div class="mt">${ic('cloud',18)} Хмарна синхронізація</div>
    <p style="font-size:13px;color:var(--a);display:flex;align-items:center;gap:6px;margin-bottom:12px">${ic('check',13)} ${esc(user.displayName||user.email||'')}</p>
    <div style="height:1px;background:var(--b0);margin:12px 0"></div>
    <p style="font-size:12px;color:var(--t3);margin-bottom:8px">Код для приєднання:</p>
    <div style="font-size:24px;font-weight:700;letter-spacing:6px;text-align:center;color:var(--a);padding:12px;background:var(--b0);border-radius:12px;margin-bottom:12px;user-select:all">${code}</div>
    <p style="font-size:11px;color:var(--t3);margin-bottom:16px;line-height:1.5">Поділіться цим кодом з близькими, щоб вони бачили ваші рецепти, план та список покупок.</p>
    ${memberNames.length>1?`<p style="font-size:12px;color:var(--t3);margin-bottom:6px">Учасники:</p>
    ${memberNames.map(n=>`<p style="font-size:13px;color:var(--t2);display:flex;align-items:center;gap:6px;margin-bottom:4px">${ic('users',12)} ${esc(n)}</p>`).join('')}
    <div style="height:1px;background:var(--b0);margin:12px 0"></div>`:''}
    <button class="btn bs" onclick="_forceSync()">${ic('cloud',16)} Примусова синхронізація</button>
    <button class="btn" style="margin-top:8px" onclick="cloudSignOut()">${ic('x',16)} Вийти з хмари</button>`);
}
