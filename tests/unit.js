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
const run=code=>vm.runInContext(code, ctx);

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


// ================================================================================================
//  SKILL TREE INTEGRITY — the trees are pure data, so every promise they make is checkable.
// ================================================================================================
const ROLE_SPECS=()=>g('SPECS').filter(s=>!s.relic);
const ALL_NODES=()=>ROLE_SPECS().flatMap(s=>s.tiers.flat());

check('six role columns plus the relic Beast', ()=>{
  const S=g('SPECS');
  if(S.length!==7) throw new Error('expected 7 columns, got '+S.length);
  const roles=ROLE_SPECS();
  if(roles.length!==6) throw new Error('expected 6 point-spent roles, got '+roles.length);
  const subs=roles.map(s=>s.sub);
  for(const want of ['Tank','Healer','Melee DPS','Ranged DPS','Caster DPS','Support / Hybrid'])
    if(!subs.includes(want)) throw new Error('missing role: '+want);
  return subs.join(' · ');
});

check('every role has 9 rows and exactly 4 sub-role lanes', ()=>{
  const out=[];
  for(const sp of ROLE_SPECS()){
    if(sp.tiers.length!==9) throw new Error(sp.kw+' has '+sp.tiers.length+' rows');
    const lanes=[...new Set(sp.tiers.flat().map(n=>n.lane).filter(Boolean))];
    if(lanes.length!==4) throw new Error(sp.kw+' has '+lanes.length+' lanes: '+lanes);
    out.push(sp.kw+'='+lanes.join('/'));
  }
  return out.join('  ');
});

check('lane codes are globally unique and all have labels', ()=>{
  const seen={}, LBL=g('LANE_LBL');
  for(const sp of ROLE_SPECS()) for(const n of sp.tiers.flat()){
    if(!n.lane) continue;
    if(seen[n.lane] && seen[n.lane]!==sp.kw) throw new Error('lane "'+n.lane+'" used by both '+seen[n.lane]+' and '+sp.kw);
    seen[n.lane]=sp.kw;
    if(!LBL[n.lane]) throw new Error('lane "'+n.lane+'" has no LANE_LBL entry');
  }
  const codes=Object.keys(seen);
  if(codes.length!==24) throw new Error('expected 24 sub-roles, found '+codes.length);
  return codes.length+' sub-roles, all labelled';
});

check('every tree costs exactly the skill budget', ()=>{
  const B=g('SKILL_BUDGET'), bad=[];
  for(const sp of ROLE_SPECS()){
    const ranks=sp.tiers.reduce((a,t)=>a+t.reduce((b,n)=>b+(n.max||0),0),0);
    if(ranks!==B) bad.push(sp.kw+'='+ranks);
  }
  if(bad.length) throw new Error('trees do not all cost '+B+': '+bad.join(', ')+' — a player in a cheaper tree would be left with unspendable points');
  return 'all six cost exactly '+B+' points';
});

check('the trees are short', ()=>{
  const nodes=ALL_NODES().length;
  const per=nodes/6;
  if(per>30) throw new Error('averaging '+per+' nodes per tree — not short');
  return nodes+' nodes across 6 roles ('+per+' each)';
});

check('every node is well formed', ()=>{
  for(const n of ALL_NODES()){
    if(!n.nm) throw new Error('a node has no name');
    if(!n.ic) throw new Error(n.nm+' has no icon');
    if(!(n.max>=1)) throw new Error(n.nm+' has max '+n.max);
    if(!n.eff && !n.grantSkill && !n.gives && !n.procs) throw new Error(n.nm+' does nothing at all');
  }
  return ALL_NODES().length+' nodes, all named / iconed / ranked / effective';
});

check('every stat a node grants is a real, displayable stat', ()=>{
  const LBL=g('EFF_LBL'), bad=new Set();
  for(const n of ALL_NODES()) if(n.eff) for(const k in n.eff) if(!LBL[k]) bad.add(n.nm+'.'+k);
  if(bad.size) throw new Error('unknown effect keys: '+[...bad].join(', '));
  return 'all effect keys exist in EFF_LBL';
});

check('every skill a node teaches exists', ()=>{
  const SK=g('SKILLS'), taught=[];
  for(const n of ALL_NODES()) if(n.grantSkill){
    if(!SK[n.grantSkill]) throw new Error(n.nm+' teaches "'+n.grantSkill+'" which is not a skill');
    taught.push(SK[n.grantSkill].nm);
  }
  if(taught.length!==12) throw new Error('expected 12 skill nodes (2 per role), found '+taught.length);
  for(const n of ALL_NODES()) if(n.grantSkill && n.lane) throw new Error(n.nm+' is lane-locked, but every lane must pass through the skill rows');
  return taught.join(', ');
});

check('every keystone flag is actually implemented, not just declared', ()=>{
  // a flag that recompute() stores but nothing ever reads is a node that lies to the player
  const dead=[];
  for(const n of ALL_NODES()){
    if(!n.gives) continue;
    const f=n.gives;
    const re=new RegExp('\\b'+f+'\\b','g');
    const lines=src.split('\n').filter(l=>re.test(l));
    const reads=lines.filter(l=>
      l.indexOf("gives:'"+f+"'")<0 &&                                  // the tree node itself
      !new RegExp('S\\.'+f+'\\s*=\\s*!!flags\\.'+f).test(l) &&         // the plain recompute copy
      l.indexOf('flagNames=')<0                                        // the HUD label table
    );
    if(!reads.length) dead.push(f);
  }
  if(dead.length) throw new Error('these flags are set but never read — the nodes would do nothing: '+dead.join(', '));
  const flags=ALL_NODES().filter(n=>n.gives).map(n=>n.gives);
  return flags.length+' rule-breaker flags, all with live implementations';
});

check('every proc a node fires is a type the engine handles', ()=>{
  const known=new Set(['heal','nova','fervor','shield','empower','ignite','chill','shock','haste','mana','charge','minion']);
  const bad=[];
  for(const n of ALL_NODES()) for(const pr of (n.procs||[])) if(!known.has(pr.type)) bad.push(n.nm+':'+pr.type);
  if(bad.length) throw new Error('unhandled proc types: '+bad.join(', '));
  return 'all proc types handled';
});

check('each role ends in exactly one keystone row and one capstone', ()=>{
  for(const sp of ROLE_SPECS()){
    const keys=sp.tiers[7], cap=sp.tiers[8];
    if(keys.length!==4) throw new Error(sp.kw+' keystone row has '+keys.length+' nodes');
    if(keys.some(n=>n.max!==1)) throw new Error(sp.kw+' has a multi-rank keystone');
    if(new Set(keys.map(n=>n.lane)).size!==4) throw new Error(sp.kw+' keystones do not cover all 4 lanes');
    if(cap.length!==1 || cap[0].max!==1) throw new Error(sp.kw+' capstone row is malformed');
  }
  return '6 roles x 4 lane keystones + 1 capstone each';
});

check('a single lane can be climbed from the top of a tree to its keystone', ()=>{
  const G=g('G'), report=[];
  for(const sp of ROLE_SPECS()){
    const lanes=[...new Set(sp.tiers.flat().map(n=>n.lane).filter(Boolean))];
    for(const lane of lanes){
      run('G.alloc={}; G.skillPts=9999;');
      // spend ONLY on this lane (plus the row-0 foundation and the single-node rows)
      for(let ti=0; ti<sp.tiers.length; ti++){
        const row=sp.tiers[ti];
        const mine=row.filter(n=>!n.lane || n.lane===lane);
        if(!mine.length) throw new Error(sp.kw+'/'+lane+' has no node in row '+ti);
        for(const n of mine){
          run(`(function(){ const t=TALENTMAP[${JSON.stringify(n.id)}];
            for(let i=0;i<t.max;i++){ if(talentReason(t)) break; G.alloc[t.id]=(G.alloc[t.id]||0)+1; } })();`);
        }
        const got=g('G.alloc');
        if(ti<sp.tiers.length-1 && !mine.some(n=>got[n.id]>0))
          throw new Error(sp.kw+'/'+lane+' stalled at row '+ti+' — that lane cannot open the next row alone');
      }
      const key=sp.tiers[7].find(n=>n.lane===lane);
      if(!(g('G.alloc')[key.id]>0)) throw new Error(sp.kw+'/'+lane+' could not reach its keystone "'+key.nm+'" following only that lane');
      const spent=Object.values(g('G.alloc')).reduce((a,b)=>a+b,0);
      report.push(lane+':'+spent);
    }
  }
  run('G.alloc={};');
  const costs=report.map(r=>+r.split(':')[1]);
  return '24/24 lanes reach their keystone solo, costing '+Math.min(...costs)+'–'+Math.max(...costs)+' points';
});

check('migration refunds a character holding allocations from the old tree', ()=>{
  const B=g('SKILL_BUDGET');
  run(`__mig={ alloc:{tk123:5, st99:4, zz7:3}, skillPts:0, skillGranted:213, treeVer:0 };`);
  const moved=g('migrateTalents(__mig)');
  const p=g('__mig');
  if(!moved) throw new Error('migration reported no change');
  if(Object.keys(p.alloc).length) throw new Error('stale allocation survived: '+JSON.stringify(p.alloc));
  if(p.skillPts!==B) throw new Error('refunded '+p.skillPts+' points, expected a full budget of '+B);
  if(p.skillGranted!==B) throw new Error('lifetime grant not clamped to the new budget: '+p.skillGranted);
  if(p.treeVer!==g('TREE_VERSION')) throw new Error('tree version not stamped');
  return 'stale ids dropped, '+B+' points refunded, budget re-clamped';
});

check('migration leaves an up-to-date character completely alone', ()=>{
  const id=g('Object.keys(TALENTMAP).find(k=>TALENTMAP[k].tier===0 && !TALENTMAP[k].beastKey)');
  run(`__mig2={ alloc:{${JSON.stringify(id)}:2}, skillPts:7, skillGranted:20, treeVer:TREE_VERSION };`);
  const moved=g('migrateTalents(__mig2)');
  const p=g('__mig2');
  if(moved) throw new Error('touched a current character');
  if(p.alloc[id]!==2 || p.skillPts!==7) throw new Error('mutated a valid save');
  return 'no-op on a current save';
});

check('migration clamps a rank that exceeds a shrunken node', ()=>{
  const id=g('Object.keys(TALENTMAP).find(k=>TALENTMAP[k].tier===0 && !TALENTMAP[k].beastKey)');
  const max=g(`TALENTMAP[${JSON.stringify(id)}].max`);
  run(`__mig3={ alloc:{${JSON.stringify(id)}:${max+4}}, skillPts:0, skillGranted:10, treeVer:TREE_VERSION };`);
  g('migrateTalents(__mig3)');
  const p=g('__mig3');
  if(p.alloc[id]!==max) throw new Error('rank not clamped: '+p.alloc[id]+' > '+max);
  if(p.skillPts!==4) throw new Error('overflow not refunded: got '+p.skillPts+' expected 4');
  return 'over-cap rank clamped and the difference refunded';
});


check('negative armour means no mitigation, never maximum mitigation', ()=>{
  run('G.floor=1;');
  const dr=v=>{ run(`G.S={armor:${v}};`); return g('dr()'); };
  if(dr(0)!==0) throw new Error('zero armour should mitigate nothing');
  for(const v of [-1,-8,-40,-71,-500]){ const r=dr(v); if(r!==0) throw new Error('armour '+v+' gave '+(r*100).toFixed(1)+'% reduction'); }
  const a=dr(200), b=dr(400); if(!(b>a&&b<=0.78)) throw new Error('positive armour curve broken: '+a+' -> '+b);
  return 'negative clamps to 0%, 200 armour = '+(a*100).toFixed(0)+'%, 400 = '+(b*100).toFixed(0)+'%';
});


// ================================================================================================
//  UI / HUD REGRESSIONS
// ================================================================================================

check('the red screen edge only appears while alive in a run', ()=>{
  const v=g("document.getElementById('vignette')");
  const set=o=>run(`G.running=${o.running}; G.dead=${o.dead}; G.hp=${o.hp}; G.maxhp=${o.maxhp}; G.fervor=0;`);
  const low=()=>{ try{ g('updateHUD()'); }catch(e){} return v.classList.contains('low'); };
  set({running:false,dead:false,hp:0,maxhp:0});     if(low()) throw new Error('red edge on the menu (no run in progress)');
  set({running:false,dead:false,hp:10,maxhp:100});  if(low()) throw new Error('red edge with the game not running');
  set({running:true, dead:true, hp:0,  maxhp:100}); if(low()) throw new Error('red edge stuck on after death');
  set({running:true, dead:false,hp:0,  maxhp:0});   if(low()) throw new Error('red edge from a 0/0 divide');
  set({running:true, dead:false,hp:90, maxhp:100}); if(low()) throw new Error('red edge at 90% health');
  set({running:true, dead:false,hp:10, maxhp:100}); if(!low()) throw new Error('no red edge at 10% health — the warning is gone');
  set({running:false,dead:false,hp:100,maxhp:100});
  return 'menu / dead / 0-max-hp / healthy = clear · 10% health = warning';
});

check('panels open at their default size, then keep whatever size you drag them to', ()=>{
  const mk=()=>{ const e=g("document.createElement('div')"); e.style.width=''; e.style.height=''; return e; };
  run("localStorage.removeItem(PANELSIZE_KEY);");
  const a=mk(); ctx.__pa=a; g("persistPanelSize(__pa,'testPanel','min(1240px,94vw)')");
  if(a.style.width!=='min(1240px,94vw)') throw new Error('default width not applied, got "'+a.style.width+'"');
  if(a.style.height) throw new Error('a default height was forced ("'+a.style.height+'") — the panel should hug its content');
  // nothing should have been written to storage just by opening
  if(g("localStorage.getItem(PANELSIZE_KEY)")) throw new Error('merely opening the panel persisted a size');
  // now pretend the player dragged it
  run(`localStorage.setItem(PANELSIZE_KEY, JSON.stringify({testPanel:{w:'640px',h:'480px'}}));`);
  const b=mk(); ctx.__pb=b; g("persistPanelSize(__pb,'testPanel','min(1240px,94vw)')");
  if(b.style.width!=='640px' || b.style.height!=='480px') throw new Error('saved size ignored: '+b.style.width+' x '+b.style.height);
  run("localStorage.removeItem(PANELSIZE_KEY);");
  return 'first open = full size, saved size wins forever after, opening never writes';
});

check('panel contents get wrapped so the title bar and ✕ stay pinned', ()=>{
  // build a fake panel: <h3> + .closeX + three content blocks
  run(`
    __fake=document.createElement('div'); __fake.id='fakePanel'; __fake._cls=new Set(['panel']);
    (function(){
      const h=document.createElement('div'); h.tagName='H3';
      const x=document.createElement('div'); x._cls=new Set(['closeX']);
      __fake.appendChild(h); __fake.appendChild(x);
      for(let i=0;i<3;i++) __fake.appendChild(document.createElement('div'));
      __panels=[__fake];
      __origQSA=document.querySelectorAll;
      document.querySelectorAll=function(sel){ return sel==='.panel'?__panels:[]; };
    })();
    pinPanelHeaders();
    document.querySelectorAll=__origQSA;
  `);
  const p=g('__fake');
  const kids=p.children;
  if(kids.length!==3) throw new Error('expected h3 + closeX + panelBody, got '+kids.length+' children');
  if(kids[0].tagName!=='H3') throw new Error('the title bar is no longer the first child');
  if(!kids[1]._cls.has('closeX')) throw new Error('the close button was swallowed into the scroll area');
  const body=kids[2];
  if(!body._cls.has('panelBody')) throw new Error('no .panelBody wrapper was created');
  if(body.children.length!==3) throw new Error('content not moved into the scroll area: '+body.children.length);
  return 'h3 + ✕ stay outside the scroll area, 3 content blocks moved into .panelBody';
});

check('the tree panel is left alone (it already has a pinned header)', ()=>{
  run(`
    __tp=document.createElement('div'); __tp.id='treePanel'; __tp._cls=new Set(['panel']);
    (function(){ const h=document.createElement('div'); h.id='treeHead'; const b=document.createElement('div'); b.id='treeBody';
      __tp.appendChild(h); __tp.appendChild(b);
      __origQSA2=document.querySelectorAll; document.querySelectorAll=function(sel){ return sel==='.panel'?[__tp]:[]; }; })();
    pinPanelHeaders();
    document.querySelectorAll=__origQSA2;
  `);
  const p=g('__tp');
  if(p.children.length!==2) throw new Error('the tree panel was rewrapped — #treeBody would lose its flex sizing');
  if(p._pinned) throw new Error('tree panel marked as wrapped');
  return '#treeHead / #treeBody left untouched';
});

check('the quest line is styled as an objective, not ambient text', ()=>{
  const html=require('fs').readFileSync(require('path').join(__dirname,'..','towerlords.html'),'utf8');
  if(html.indexOf('#bountyTxt:not(:empty)')<0) throw new Error('the quest line has no dedicated style');
  const m=html.match(/#bountyTxt:not\(:empty\)\{[^}]*font-size:([\d.]+)px/);
  if(!m || parseFloat(m[1])<13) throw new Error('quest text is still small: '+(m?m[1]:'?')+'px');
  if(html.indexOf('questPulse')<0) throw new Error('no attention pulse on the quest card');
  const t=html.match(/#towerInfo \.sm\{font-size:([\d.]+)px/);
  if(!t || parseFloat(t[1])<12.5) throw new Error('top-right HUD text still small: '+(t?t[1]:'?')+'px');
  return 'quest card '+m[1]+'px + pulse, top-right HUD '+t[1]+'px';
});

check('scrollbars are hidden but scrolling still works', ()=>{
  const html=require('fs').readFileSync(require('path').join(__dirname,'..','towerlords.html'),'utf8');
  if(html.indexOf('scrollbar-width:none')<0) throw new Error('no scrollbar-width:none rule');
  const kill=html.match(/\.panel::-webkit-scrollbar[^{]*\{width:0;height:0;display:none;\}/);
  if(!kill) throw new Error('webkit scrollbars not suppressed');
  for(const sel of ['.panelBody','.bagGrid','#treeCols','#chatBody'])
    if(html.indexOf(sel+'::-webkit-scrollbar')<0) throw new Error(sel+' can still paint a scrollbar');
  if(html.indexOf('.panelBody{flex:1 1 auto;min-height:0;overflow-y:auto')<0) throw new Error('.panelBody no longer scrolls — the wheel would stop working');
  return 'bars suppressed, .panelBody still overflow-y:auto';
});

check('panel body text is legible', ()=>{
  const html=require('fs').readFileSync(require('path').join(__dirname,'..','towerlords.html'),'utf8');
  const want=[['.hint{font-size:',12],['.invWrap h4,.invSec h4{font-size:',12],['.invTools .st{cursor:pointer;font-size:',10.5],['.panel h3{font-size:',15]];
  const got=[];
  for(const [needle,min] of want){
    const i=html.indexOf(needle); if(i<0) throw new Error('rule missing: '+needle);
    const px=parseFloat(html.slice(i+needle.length));
    if(!(px>=min)) throw new Error(needle+' is '+px+'px, wanted >= '+min);
    got.push(px+'px');
  }
  return 'hint/headings/chips/titles = '+got.join(' / ');
});


check('item grids cannot be stretched out of shape', ()=>{
  const html=require('fs').readFileSync(require('path').join(__dirname,'..','towerlords.html'),'utf8');
  const m=html.match(/\.bagGrid\{display:grid[^}]*\}/); if(!m) throw new Error('.bagGrid rule missing');
  for(const need of ['grid-auto-rows:min-content','align-content:start','align-items:start'])
    if(m[0].indexOf(need)<0) throw new Error('.bagGrid is missing '+need+' — a tall row would stretch the tiles and override aspect-ratio');
  const st=html.match(/\.stashSide \.bagGrid\{[^}]*\}/); if(!st) throw new Error('stash grid rule missing');
  if(st[0].indexOf('flex:0 0 auto')<0) throw new Error('stash grids still stretch with flex:1 inside an indefinite column');
  if(!/height:min\(/.test(st[0])) throw new Error('stash grids have no definite height');
  if(html.indexOf('.tile{position:relative;aspect-ratio:1/1')<0) throw new Error('tiles lost their square aspect-ratio');
  return 'rows are min-content, items align to start, stash grids have a definite height';
});


check('every lane and node role has a glyph', ()=>{
  const GL=g('TREE_GLYPH'), LBL=g('LANE_LBL');
  for(const lane of Object.keys(LBL)) if(!GL[lane]) throw new Error('lane "'+lane+'" has no glyph');
  for(const k of ['core','skill','capstone','beast']) if(!GL[k]) throw new Error('missing structural glyph: '+k);
  return Object.keys(GL).length+' glyphs covering 24 lanes + 4 structural roles';
});

check('every glyph is valid drawing data', ()=>{
  const GL=g('TREE_GLYPH');
  for(const k in GL) for(const p of GL[k].split('|')){
    if(p.charAt(0)==='C'){ const a=p.slice(2).split(','); if(a.length!==3||a.some(n=>isNaN(parseFloat(n)))) throw new Error(k+': bad circle "'+p+'"'); }
    else if(p.charAt(0)==='E'){ const a=p.slice(2).split(','); if(a.length!==4||a.some(n=>isNaN(parseFloat(n)))) throw new Error(k+': bad ellipse "'+p+'"'); }
    else if(!/^[Mm]/.test(p)) throw new Error(k+': a path must start with a move command, got "'+p.slice(0,12)+'"');
    // relative commands (h/v/l/a/c) carry DELTAS, not coordinates, so a negative value is
    // legitimate — this is a typo guard, not a grid check
    else { const nums=p.match(/-?\d*\.?\d+/g)||[]; for(const n of nums){ const v=parseFloat(n); if(v<-30||v>30) throw new Error(k+': number '+v+' is far off the 24x24 grid — likely a typo'); } }
  }
  return Object.keys(GL).length+' glyphs, all well-formed and in scale';
});

check('lane labels are labels, not stray data', ()=>{
  // a line-anchored regex once overwrote LANE_LBL.mk with SVG path data because the same two-letter
  // keys appear in both LANE_LBL and TREE_GLYPH — this catches that class of mistake
  const LBL=g('LANE_LBL');
  for(const k in LBL){
    const v=LBL[k];
    if(typeof v!=='string' || !/^[A-Za-z][A-Za-z /-]*$/.test(v)) throw new Error('LANE_LBL.'+k+' is not a readable label: "'+String(v).slice(0,40)+'"');
    if(v.length>24) throw new Error('LANE_LBL.'+k+' is suspiciously long');
  }
  return Object.keys(LBL).length+' lane labels, all plain text';
});

check('the tree draws glyphs, not emoji', ()=>{
  if(src.indexOf('<span class="tic">')>=0) throw new Error('a talent cell still renders an emoji span');
  if(src.indexOf('function treeIconSVG')<0) throw new Error('the glyph renderer is missing');
  const svg=g('treeIconSVG(TALENTMAP[Object.keys(TALENTMAP)[0]])');
  if(svg.indexOf('<svg')!==0 || svg.indexOf('viewBox="0 0 24 24"')<0) throw new Error('bad svg output: '+svg.slice(0,60));
  return 'talent cells and tooltips both render inline SVG';
});


// ================================================================================================
//  CLASS PURITY — a player can dip into any tree, so each tree must grant only ITS class's stats.
//  The 16 stat nodes (rows 1,2,4,5) plus the foundation are held to a per-class whitelist.
//  Row 7 KEYSTONES and the row 8 capstone are exempt: a keystone's whole job is to be the one
//  deliberate trade, and each says so in its own text.
// ================================================================================================
const CLASS_STATS={
  tk:['armor','lifePct','lifeFlat','lifeRegen','reflectPct','dodgePct','lifeOnHit','lifeOnKill','area'],
  mn:['lifeRegen','lifeOnHit','lifeOnKill','lifePct','manaFlat','manaPct','manaRegen','manaCostPct','cdrPct','armor'],
  st:['dmgPct','crit','critMultPct','asPct','execPct','lifesteal','fervorRatePct','lowHpDmgPct','area'],
  rg:['dmgPct','asPct','crit','critMultPct','proj','pierce','movePct','dashCdrPct','petDmgPct','area'],
  el:['elemDmgPct','ailDmgPct','skillDmgPct','area','manaRegen','cdrPct','critMultPct'],
  wd:['skillDmgPct','manaPct','manaFlat','manaRegen','manaCostPct','cdrPct','area','petDmgPct','dmgPct','asPct'],
};
check('each tree grants only its own class of stats', ()=>{
  const bad=[], summary=[];
  for(const sp of g('SPECS').filter(s=>!s.relic)){
    const allow=new Set(CLASS_STATS[sp.kw]||[]);
    if(!allow.size) throw new Error('no stat whitelist defined for '+sp.kw);
    const used=new Set();
    sp.tiers.forEach((row,ti)=>{
      if(ti===3||ti===6||ti===7||ti===8) return;      // skill rows, keystones, capstone are exempt
      for(const n of row) for(const k in (n.eff||{})){
        used.add(k);
        if(!allow.has(k)) bad.push(`${sp.nm} row ${ti} "${n.nm}" grants ${k}`);
      }
    });
    summary.push(sp.kw+':'+used.size);
  }
  if(bad.length) throw new Error('off-class stats:\n           '+bad.join('\n           '));
  return 'all six trees stay inside their own vocabulary ('+summary.join(' ')+' distinct stats each)';
});

check('the tank tree grants no damage, crit or attack speed', ()=>{
  const sp=g('SPECS').find(s=>s.kw==='tk'); const bad=[];
  sp.tiers.forEach((row,ti)=>{ if(ti===7||ti===8) return;
    for(const n of row) for(const k of ['dmgPct','crit','critMultPct','asPct','lifesteal','execPct'])
      if(n.eff&&n.eff[k]!=null) bad.push(n.nm+'.'+k); });
  if(bad.length) throw new Error('offensive stats on tank nodes: '+bad.join(', '));
  const key=sp.tiers[7].find(n=>n.lane==='br');
  if(!key.eff.lifesteal) throw new Error('the Brawler keystone should still be the sanctioned defence-for-offence trade');
  return 'clean — the only lifesteal/damage is the Brawler KEYSTONE, which is the deliberate trade';
});

check('the healer tree grants no damage or move speed', ()=>{
  const sp=g('SPECS').find(s=>s.kw==='mn'); const bad=[];
  sp.tiers.forEach((row,ti)=>{ if(ti===7||ti===8) return;
    for(const n of row) for(const k of ['dmgPct','crit','critMultPct','asPct','movePct','skillDmgPct','elemDmgPct'])
      if(n.eff&&n.eff[k]!=null) bad.push(n.nm+'.'+k); });
  if(bad.length) throw new Error('off-class stats on healer nodes: '+bad.join(', '));
  return 'clean — healing, mana and cooldowns only';
});

check('only the hybrid column mixes weapon damage with spell power', ()=>{
  const mixers=[];
  for(const sp of g('SPECS').filter(s=>!s.relic)){
    let wep=false, spell=false;
    sp.tiers.forEach((row,ti)=>{ if(ti===7||ti===8) return;
      for(const n of row){ if(n.eff&&(n.eff.dmgPct||n.eff.asPct)) wep=true;
        if(n.eff&&(n.eff.skillDmgPct||n.eff.elemDmgPct)) spell=true; } });
    if(wep&&spell) mixers.push(sp.kw);
  }
  if(mixers.length!==1 || mixers[0]!=='wd')
    throw new Error('expected only the Warden to mix, got: '+(mixers.join(', ')||'none'));
  return 'Warden alone — mixing is its class identity';
});

check('the skill tree shows one tooltip, not two', ()=>{
  if(/class="spec\$\{xc\}"[^`]*title=/.test(src)) throw new Error('the column div still carries a native title= that stacks on the custom tooltip');
  if(src.indexOf('specRole')<0) throw new Error('the role text has nowhere to live now');
  return 'native title removed; role + lanes shown in the column header';
});

console.log(R.join('\n'));
console.log('\n=== '+(fails?('FAILURES: '+fails):'ALL CHECKS PASSED')+' ===');
process.exit(fails?1:0);
