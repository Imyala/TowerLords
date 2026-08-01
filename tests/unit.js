// TowerLords unit checks — pure logic and static guarantees. Run via tests/run.sh
const fs=require('fs'), vm=require('vm'), path=require('path');
const H=require(path.join(__dirname,'sandbox.js'));
const {ctx, src, loadErr}=H.load(process.argv[2]||path.join(__dirname,'.build','towerlords.js'));
const R=[]; let fails=0;
function check(name, fn){
  try{ const msg=fn(); R.push('  PASS  '+name+(msg?'  — '+msg:'')); }
  catch(e){ fails++; R.push('  FAIL  '+name+'  — '+(e&&e.message||e)); }
}
function eq(a,b,what){ if(a!==b) throw new Error((what||'')+' expected '+b+' got '+a); }
const g=k=>vm.runInContext(k, ctx);

console.log('=== LOAD ===');
console.log(loadErr ? '  top-level threw: '+loadErr.message+'\n'+String(loadErr.stack).split('\n').slice(0,4).join('\n') : '  script evaluated with no top-level error');

console.log('\n=== EVOLUTION / RANK ===');
check('evolveFameCost rises monotonically', ()=>{
  const f=g('evolveFameCost'); let prev=-1;
  for(let n=0;n<=48;n++){ const c=f(n); if(!(c>prev)) throw new Error('not increasing at n='+n+' ('+c+' <= '+prev+')'); prev=c; }
  return '1st='+f(0).toLocaleString()+'  7th='+f(6).toLocaleString()+'  49th='+f(48).toLocaleString();
});
check('evolveRank maps 49 evolutions onto 7 tiers x 7 stars', ()=>{
  const r=g('evolveRank');
  eq(r(0).tier,0,'tier@0'); eq(r(0).stars,0,'stars@0');
  eq(r(1).stars,1,'stars@1');
  eq(r(7).tier,1,'tier@7'); eq(r(7).stars,0,'stars@7');
  eq(r(48).tier,6,'tier@48'); eq(r(48).stars,6,'stars@48');
  eq(r(49).tier,6,'tier@49'); eq(r(49).stars,7,'stars@49');
  eq(r(99).stars,7,'clamped'); eq(r(-5).stars,0,'clamped low');
  return 'n=0 Gray 0*, n=7 LightBlue 0*, n=49 White 7*';
});
check('rankStars renders', ()=>{ eq(g('rankStars')(3),'★★★'); eq(g('rankStars')(0),'☆'); return 'ok'; });
check('seal thresholds scale and cap', ()=>{
  const b=g('sealBloodNeed'), d=g('sealDepthNeed');
  eq(b(0),3,'blood@0'); eq(b(10),13,'blood@10'); eq(b(40),25,'blood cap');
  eq(d(0),20,'depth@0'); eq(d(10),120,'depth@10'); eq(d(48),250,'depth cap');
  return 'blood 3->25, depth 20->250';
});

console.log('\n=== SKILL POINT BUDGET ===');
check('a 1->255 climb grants exactly one tree', ()=>{
  const f=g('skillGrantedByLevel'), B=g('SKILL_BUDGET');
  eq(f(255),B,'at cap'); eq(f(300),B,'past cap');
  if(f(1)!==g('START_SKILL_PTS')) throw new Error('level 1 should equal the starting points');
  let prev=-1; for(let lv=1;lv<=255;lv++){ const v=f(lv); if(v<prev) throw new Error('curve went backwards at '+lv); prev=v; }
  return 'SKILL_BUDGET='+B+', level 255 grants exactly '+f(255);
});
check('curve is monotonic and never exceeds the budget', ()=>{
  const f=g('skillGrantedByLevel'), B=g('SKILL_BUDGET');
  for(let lv=1;lv<=255;lv++) if(f(lv)>B) throw new Error('overshoot at '+lv);
  return 'max='+f(255)+' <= '+B;
});

console.log('\n=== FLOOR OBJECTIVES ===');
check('ten objectives, unique ids, positive weights', ()=>{
  const O=g('FLOOR_OBJECTIVES');
  eq(O.length,10,'count');
  const ids=new Set(O.map(o=>o.id)); eq(ids.size,10,'unique ids');
  for(const o of O){ if(!(o.w>0)) throw new Error(o.id+' has no weight'); if(!o.nm||!o.ic||!o.ds) throw new Error(o.id+' missing text'); }
  return O.map(o=>o.ic+o.id).join(' ');
});
check('objWeightedPick only ever returns real objectives', ()=>{
  const p=g('objWeightedPick'), ids=new Set(g('FLOOR_OBJECTIVES').map(o=>o.id)), seen=new Set();
  for(let i=0;i<4000;i++){ const o=p(); if(!ids.has(o.id)) throw new Error('bogus '+o.id); seen.add(o.id); }
  if(seen.size<8) throw new Error('only saw '+seen.size+' distinct objectives in 4000 rolls');
  return seen.size+'/10 distinct in 4000 rolls';
});
check('objGoalText covers every objective', ()=>{
  const t=g('objGoalText');
  for(const d of g('FLOOR_OBJECTIVES')){
    const o={id:d.id, nm:d.nm, ic:d.ic, ds:d.ds, need:5, have:0, t:30, tMax:30};
    const s=t(o); if(!s) throw new Error('no goal text for '+d.id);
  }
  return 'all 10 produce text';
});
check('objHudHTML renders for every objective without throwing', ()=>{
  const h=g('objHudHTML'), G=g('G');
  for(const d of g('FLOOR_OBJECTIVES')){
    G.obj={id:d.id, nm:d.nm, ic:d.ic, ds:d.ds, need:5, have:2, t:12, tMax:30, done:false};
    const out=h(); if(!out || out.indexOf('width:')<0) throw new Error('bad html for '+d.id);
  }
  G.obj=null; return 'all 10 render a progress bar';
});
check('a timed objective reports a shrinking timer', ()=>{
  const h=g('objHudHTML'), G=g('G');
  G.obj={id:'survive', nm:'Endure', ic:'⏳', ds:'x', need:0, have:0, t:30, tMax:60, done:false};
  const a=h(); if(a.indexOf('30s')<0) throw new Error('timer not shown: '+a);
  if(a.indexOf('width:50%')<0) throw new Error('progress should be 50%: '+a);
  G.obj=null; return 'half-elapsed reads 50% / 30s';
});
check('vow breaks fall back to a purge on the third strike', ()=>{
  const G=g('G'); G.enemies=[]; G.portal=null;
  G.obj={id:'pacifist', nm:'Vow of Silence', ic:'🕊', ds:'x', need:0, have:0, t:5, tMax:40, done:false, breaks:0};
  const br=g('objBreak');
  br('test'); if(G.obj.id!=='pacifist') throw new Error('fell back too early (1)');
  if(G.obj.t!==40) throw new Error('timer did not reset');
  br('test'); if(G.obj.id!=='pacifist') throw new Error('fell back too early (2)');
  br('test'); if(G.obj.id!=='purge') throw new Error('did not fall back on the third break');
  if(!(G.obj.need>0)) throw new Error('fallback purge has no kill requirement');
  G.obj=null; return 'break x3 -> Purge (need '+'>0'+')';
});
check('objOnKill only counts kills for kill-objectives', ()=>{
  const G=g('G'), k=g('objOnKill');
  G.portal={active:false}; G.enemies=[];
  G.obj={id:'purge', nm:'Purge', ic:'⚔', ds:'x', need:3, have:0, done:false, breaks:0};
  k({}); k({}); if(G.obj.have!==2) throw new Error('purge did not count');
  G.obj={id:'survive', nm:'Endure', ic:'⏳', ds:'x', need:0, have:0, t:10, tMax:10, done:false, breaks:0};
  k({}); if(G.obj.have!==0) throw new Error('survive should ignore kills');
  G.obj=null; return 'purge counts, survive ignores';
});
check('hunt only counts the marked', ()=>{
  const G=g('G'), k=g('objOnKill');
  G.portal={active:false};
  G.obj={id:'hunt', nm:'Marked', ic:'🎯', ds:'x', need:2, have:0, done:false, breaks:0};
  k({mesh:{position:{x:0,z:0}}});                       // unmarked
  if(G.obj.have!==0) throw new Error('counted an unmarked kill');
  k({_objMark:true, mesh:{position:{x:0,z:0}}});
  if(G.obj.have!==1) throw new Error('did not count a marked kill');
  G.obj=null; return 'unmarked ignored, marked counted';
});

console.log('\n=== ENEMY SCALING ===');
check('scaling counts base attributes + total tree, ignoring which tree', ()=>{
  const G=g('G'), bp=g('basePowerLvl');
  const mk=(attr,alloc)=>({id:0, attr, alloc, S:{dmgBase:10}});
  const jp=g('joinedPlayers');
  // patch joinedPlayers for the test
  vm.runInContext('__testPlayers=null; joinedPlayers=function(){ return __testPlayers||[]; };', ctx);
  const setP=p=>{ ctx.__testPlayers=[p]; };
  setP(mk({str:5,dex:5,int:5,vit:5,will:5},{}));            const base=bp();
  setP(mk({str:25,dex:5,int:5,vit:5,will:5},{}));           const attrs=bp();
  setP(mk({str:5,dex:5,int:5,vit:5,will:5},{a:10,b:10}));   const treeA=bp();
  setP(mk({str:5,dex:5,int:5,vit:5,will:5},{q:20}));        const treeB=bp();
  eq(base,1,'no investment'); eq(attrs,21,'20 attribute points');
  eq(treeA,21,'20 tree points'); eq(treeB,21,'same 20 points, one node');
  if(treeA!==treeB) throw new Error('scaling still depends on WHICH tree');
  ctx.__testPlayers=null;
  return 'base=1, +20 attrs=21, +20 tree=21 regardless of distribution';
});
check('archetype counters are disabled', ()=>{
  if(/S\.adaptKind\s*=\s*bestKw/.test(src)) throw new Error('the dominant-spec read is still present');
  if(!/S\.adaptKind=null; S\.adaptLvl=0;/.test(src)) throw new Error('counters not explicitly disabled');
  if(/function applyEnemyCounter/.test(src)) throw new Error('applyEnemyCounter still defined');
  return 'adaptKind pinned null, applyEnemyCounter removed';
});

console.log('\n=== ITEM SORTING ===');
check('every sort mode is total and loses nothing', ()=>{
  const sort=g('sortItems'), modes=g('SORT_MODES').map(m=>m.k);
  const R2=g('RARITY'), items=[];
  for(let i=0;i<40;i++) items.push({name:'item'+(40-i), value:(i*7)%50, rarity:R2[i%R2.length], slotKey:['weapon','helm','ring'][i%3]});
  items.push({name:'gem', value:5, rarity:R2[0], isGem:true});
  items.push({name:'flask', value:9, rarity:R2[0], isFlask:true});
  for(const m of modes){
    const out=sort(items,m);
    if(out.length!==items.length) throw new Error(m+' changed the count');
    if(new Set(out).size!==items.length) throw new Error(m+' duplicated or dropped entries');
    if(items.length!==42) throw new Error('input mutated');
  }
  const byVal=sort(items,'value'); for(let i=1;i<byVal.length;i++) if((byVal[i].value||0)>(byVal[i-1].value||0)) throw new Error('value sort not descending');
  const byName=sort(items,'name'); for(let i=1;i<byName.length;i++) if(byName[i].name.localeCompare(byName[i-1].name)<0) throw new Error('name sort not ascending');
  return modes.join(', ')+' — all stable on '+items.length+' items';
});
check('sortItems tolerates junk input', ()=>{
  const sort=g('sortItems');
  eq(sort(null,'type').length,0,'null'); eq(sort([],'nonsense').length,0,'empty');
  const weird=sort([{},{name:null},{value:null}],'rarity'); eq(weird.length,3,'partial items');
  return 'null / empty / partial items all safe';
});
check('stash filter matches on name, slot and rarity', ()=>{
  const m=g('stashMatch'), G=g('G');
  const it={name:'Ashen Blade', slotNm:'Weapon', rarity:{nm:'Epic',css:'epic'}};
  const set=q=>vm.runInContext('STASH_Q='+JSON.stringify(q)+';', ctx);
  set(''); if(!m(it)) throw new Error('empty query should match everything');
  set('ashen'); if(!m(it)) throw new Error('name match failed');
  set('weapon'); if(!m(it)) throw new Error('slot match failed');
  set('epic'); if(!m(it)) throw new Error('rarity match failed');
  set('zzz'); if(m(it)) throw new Error('non-match matched');
  set('');
  return 'name / slot / rarity / negative all correct';
});

console.log('\n=== COMPASS ===');
check('screen bearing is finite for any target', ()=>{
  const b=g('_screenBearing');
  for(const [x,z] of [[0,0],[10,0],[-10,0],[0,-40],[999,999]]){
    const v=b(x,z); if(typeof v!=='number' || !isFinite(v)) throw new Error('non-finite bearing at '+x+','+z);
  }
  return 'finite for on-screen, off-screen and degenerate targets';
});
check('updateDirHud is safe with no run in progress', ()=>{
  const G=g('G'); G.running=false; G.player=null;
  g('updateDirHud')();
  return 'no throw when the game is not running';
});

console.log('\n=== REGRESSIONS ===');
check('the typing-cast minigame is fully gone', ()=>{
  for(const k of ['startTypeCast','showTypeCast','endTypeCast','G.typeCast','_typeCd'])
    if(src.indexOf(k)>=0) throw new Error('leftover: '+k);
  return 'no references remain';
});
check('map crystals never spawn', ()=>{
  if(src.indexOf("kind:'crystal'")>=0) throw new Error('a crystal pickup is still created');
  if(src.indexOf('DECORATIVE crystal')>=0) throw new Error('the decorative shard is still spawned');
  return 'no crystal spawns anywhere';
});
check('the retired equipment panel is gone', ()=>{
  if(src.indexOf('equipPanel')>=0) throw new Error('equipPanel is still referenced in script');
  return 'merged into invPanel';
});
check('no orphaned references to removed helpers', ()=>{
  for(const k of ['STAR_BASE','invStashWrap','applyEnemyCounter','SKILL_PER_LEVEL','KINDNM'])
    if(src.indexOf(k)>=0) throw new Error('leftover: '+k);
  return 'STAR_BASE, invStashWrap, applyEnemyCounter, SKILL_PER_LEVEL, KINDNM all clear';
});


check('no function is declared twice at top level', ()=>{
  const names={}, re=/^function\s+([A-Za-z_$][\w$]*)\s*\(/gm;
  let m; while((m=re.exec(src))) names[m[1]]=(names[m[1]]||0)+1;
  const dupes=Object.keys(names).filter(k=>names[k]>1);
  if(dupes.length) throw new Error('declared more than once: '+dupes.join(', '));
  return Object.keys(names).length+' top-level functions, all unique';
});

check('no duplicate top-level const/let declarations', ()=>{
  const names={}, re=/^(?:const|let)\s+([A-Z_][A-Z0-9_]{2,})\s*=/gm;
  let m; while((m=re.exec(src))) names[m[1]]=(names[m[1]]||0)+1;
  const dupes=Object.keys(names).filter(k=>names[k]>1);
  if(dupes.length) throw new Error('declared more than once: '+dupes.join(', '));
  return Object.keys(names).length+' top-level constants, all unique';
});

console.log(R.join('\n'));
console.log('\n=== '+(fails?('FAILURES: '+fails):'ALL CHECKS PASSED')+' ===');
process.exit(fails?1:0);
