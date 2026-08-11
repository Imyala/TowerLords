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

check('the damage flash schedules its own removal instead of throwing half-way through', ()=>{
  // Regression: `_hurtFlashT` was never declared, so hurtFlash() painted the red edge, then threw a
  // ReferenceError on clearTimeout(_hurtFlashT) BEFORE scheduling the timeout that takes it back off.
  // The frame loop swallowed the throw, so the first hit of a run left the red stuck on for good.
  const v=g("document.getElementById('vignette')");
  v.classList.remove('hit','hitBig');
  run('_hurtFlashT=undefined;');
  g('hurtFlash(true)');                                     // must not throw — a throw here is the bug
  if(!v.classList.contains('hitBig')) throw new Error('no damage flash painted');
  if(g('_hurtFlashT')===undefined) throw new Error('no removal timer scheduled — the flash would never clear');
  g('hurtFlash(false)');                                    // and again, re-arming cleanly
  if(!v.classList.contains('hit')) throw new Error('second flash did not paint');
  if(g('_hurtFlashT')===undefined) throw new Error('second flash scheduled no removal timer');
  try{ g('clearTimeout(_hurtFlashT)'); }catch(e){}
  v.classList.remove('hit','hitBig');
  return 'flash paints and always arms its own clear-down timer';
});

check('the red screen edge is wiped at death, not left frozen on the death screen', ()=>{
  // updateHUD() only runs while the sim loop ticks, and death stops the loop — so the vignette has to
  // be cleared by the transitions themselves, or the red stays burned on all the way to the sanctuary.
  const v=g("document.getElementById('vignette')");
  const red=()=>['low','rage','hit','hitBig'].filter(c=>v.classList.contains(c));
  run(`G.running=true; G.dead=false; G.maxhp=100; G.hp=8; G.fervor=0; G.inTown=false; G.practice=false; G.floor=5;`);
  try{ g('hurtFlash(true)'); }catch(e){}
  try{ g('updateHUD()'); }catch(e){}
  if(!v.classList.contains('low')) throw new Error('setup failed — no red edge at 8% health');
  // die() must clear it on the spot: nothing repaints the HUD again until the player leaves this screen
  try{ g('die()'); }catch(e){ throw new Error('die() threw: '+e.message); }
  let r=red(); if(r.length) throw new Error('red left on the death screen: '+r.join('+'));
  // …and the trip home must not reintroduce it, even if the HUD never gets a clean tick
  run(`G.running=true; G.dead=false; G.hp=8; G.maxhp=100;`);   // pretend the HUD is mid-repaint with stale vitals
  try{ g('updateHUD()'); }catch(e){}
  try{ g('returnToTown()'); }catch(e){ throw new Error('returnToTown() threw: '+e.message); }
  r=red(); if(r.length) throw new Error('red followed you into the sanctuary: '+r.join('+'));
  // a fresh respawn starts clean too
  run(`G.running=true; G.dead=false; G.hp=8; G.maxhp=100;`);
  try{ g('updateHUD()'); }catch(e){}
  try{ g('respawn()'); }catch(e){}
  r=red(); if(r.length) throw new Error('red survived a respawn: '+r.join('+'));
  run(`G.running=false; G.dead=false; G.hp=100; G.maxhp=100;`);
  return 'die() / returnToTown() / respawn() each clear low+rage+hit';
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
  // Sizes may be written as a literal (14px) or as a design token (var(--f-md)).
  // Resolve tokens against :root so this guard survives the token system instead
  // of quietly passing on a NaN.
  const root=html.match(/:root\{([\s\S]*?)\n  \}/);
  if(!root) throw new Error('no :root token block to resolve var() against');
  const tokens={};
  for(const m of root[1].matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) tokens[m[1]]=m[2].trim();
  const px=raw=>{
    const v=raw.trim();
    const ref=v.match(/^var\((--[\w-]+)\)/);
    if(ref){
      if(!(ref[1] in tokens)) throw new Error('unknown token '+ref[1]);
      return parseFloat(tokens[ref[1]]);
    }
    return parseFloat(v);
  };
  const want=[['.hint{font-size:',12],['.invWrap h4,.invSec h4{font-size:',12],['.invTools .st{cursor:pointer;font-size:',10.5],['.panel h3{font-size:',15]];
  const got=[];
  for(const [needle,min] of want){
    const i=html.indexOf(needle); if(i<0) throw new Error('rule missing: '+needle);
    const size=px(html.slice(i+needle.length, i+needle.length+40));
    if(!(size>=min)) throw new Error(needle+' is '+size+'px, wanted >= '+min);
    got.push(size+'px');
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


check('the quest readout has room for the quest and never clips it', ()=>{
  const html=require('fs').readFileSync(require('path').join(__dirname,'..','towerlords.html'),'utf8');
  const ti=html.match(/#towerInfo\{[^}]*\}/); if(!ti) throw new Error('#towerInfo rule missing');
  if(ti[0].indexOf('overflow:hidden')>=0) throw new Error('the readout still clips its own contents');
  if(ti[0].indexOf('resize:')>=0 && ti[0].indexOf('resize:none')<0) throw new Error('the readout is still a resizable box');
  if(!/width:min\(/.test(ti[0])) throw new Error('the readout has no default width — it will shrink to its shortest line');
  const bt=html.match(/#bountyTxt:not\(:empty\)\{[^}]*\}/); if(!bt) throw new Error('quest card rule missing');
  if(bt[0].indexOf('display:block')<0) throw new Error('the quest card is still shrink-to-fit');
  if(bt[0].indexOf('white-space:normal')<0) throw new Error('the quest card cannot wrap');
  for(const cls of ['qLbl','qNm','qPg']) if(html.indexOf('#bountyTxt .'+cls)<0) throw new Error('missing quest line style: '+cls);
  return 'fixed-width readout, block quest card, label / name / progress on their own lines';
});


check('top-centre HUD elements never sit on each other', ()=>{
  const html=require('fs').readFileSync(require('path').join(__dirname,'..','towerlords.html'),'utf8');
  const topOf=(sel,scope)=>{
    const esc=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    const m=html.match(new RegExp(esc((scope||'')+sel)+'\\{[^}]*top:(\\d+)px'));
    if(!m) throw new Error('no top: found for '+(scope||'')+sel);
    return +m[1];
  };
  const H={dirHud:42, floorBanner:56, bossBar:74};   // generous estimates of each painted box
  const plain={ dirHud:topOf('#dirHud',''), floorBanner:topOf('#floorBanner',''),
                bossBar:topOf('#bossBar',''), bossSpeech:topOf('#bossSpeech','') };
  const on={ floorBanner:topOf('#floorBanner','body.dirhud-on '),
             bossBar:topOf('#bossBar','body.dirhud-on '),
             bossSpeech:topOf('#bossSpeech','body.dirhud-on ') };
  if(plain.floorBanner+H.floorBanner > plain.bossBar) throw new Error('boss bar overlaps the floor banner');
  if(plain.bossBar+H.bossBar > plain.bossSpeech) throw new Error('boss subtitle overlaps the boss bar');
  if(plain.dirHud+H.dirHud > on.floorBanner) throw new Error('the compass overlaps the floor banner');
  if(on.floorBanner+H.floorBanner > on.bossBar) throw new Error('boss bar overlaps the banner with the compass on');
  if(on.bossBar+H.bossBar > on.bossSpeech) throw new Error('boss subtitle overlaps the boss bar with the compass on');
  return 'compass '+plain.dirHud+' → banner '+on.floorBanner+' → boss bar '+on.bossBar+' → subtitle '+on.bossSpeech;
});

check('the direction arrow is drawn, not a text glyph', ()=>{
  const html=require('fs').readFileSync(require('path').join(__dirname,'..','towerlords.html'),'utf8');
  if(html.indexOf('<span class="dhArrow">➤</span>')>=0) throw new Error('still a text glyph — it vanishes against bright scenery');
  if(html.indexOf('class="dhArw"')<0) throw new Error('no drawn arrow svg');
  const head=html.match(/\.dhArw \.hd\{[^}]*\}/);
  if(!head) throw new Error('arrow head has no style');
  if(head[0].indexOf('stroke:rgba(0,0,0')<0) throw new Error('the arrow head has no dark outline to survive light backgrounds');
  const w=html.match(/\.dhArrow\{[^}]*width:(\d+)px/);
  if(!w || +w[1]<24) throw new Error('the arrow is still small: '+(w?w[1]:'?')+'px');
  const chip=html.match(/\.dhChip\{[^}]*\}/);
  if(!/background:rgba\(3,6,13,\.9/.test(chip[0])) throw new Error('the chip is still translucent enough to disappear');
  return 'drawn arrow '+w[1]+'px, dark outline, glow, near-opaque chip';
});

console.log('\n=== BOOT & MENU LAYOUT ===');

const BUILDS=['towerlords.html','towerlords-mobile.html','towerlords-offline.html'];
const readBuild=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');

check('the game never depends on a CDN to start', ()=>{
  // A blocked/unreachable cdn.jsdelivr.net used to kill the whole ES module before a single line
  // ran: the menu still painted, but nothing was wired up and no error appeared anywhere.
  const out=[];
  for(const f of ['towerlords.html','towerlords-mobile.html']){
    const html=readBuild(f);
    const map=html.match(/<script type="importmap">([\s\S]*?)<\/script>/);
    if(!map) throw new Error(f+': no import map');
    if(/cdn\.jsdelivr|unpkg\.com/.test(map[1])) throw new Error(f+': three still resolves to a CDN');
    if(map[1].indexOf('./vendor/three.module.js')<0) throw new Error(f+': three does not resolve to the local vendor copy');
    out.push(f.replace('towerlords','').replace('.html','')||'desktop');
  }
  const three=path.join(__dirname,'..','vendor','three.module.js');
  if(!fs.existsSync(three)) throw new Error('vendor/three.module.js is missing — the import map points at nothing');
  const src=fs.readFileSync(three,'utf8');
  if(!/const REVISION = '160'/.test(src)) throw new Error('vendor three is not the r160 the game was built against');
  const off=readBuild('towerlords-offline.html');
  if(/cdn\.jsdelivr|unpkg\.com/.test(off.match(/<script type="importmap">([\s\S]*?)<\/script>/)[1]))
    throw new Error('the offline build reaches for a CDN');
  return 'local three r160 ('+Math.round(fs.statSync(three).size/1024)+'KB), no CDN in any build';
});

check('a failed boot is reported instead of leaving a dead menu', ()=>{
  for(const f of BUILDS){
    const html=readBuild(f);
    if(html.indexOf('window.__bootFail')<0) throw new Error(f+': no boot guard');
    if(html.indexOf('window.__bootOK = true')<0) throw new Error(f+': the module never signals a successful boot');
    if(html.indexOf('__bootFail')>html.indexOf('<script type="importmap">'))
      throw new Error(f+': the guard is installed after the import map — it would miss the failure it exists to catch');
    if(html.indexOf('var healer=setInterval')<0) throw new Error(f+': a slow-but-successful boot would stay buried under the error screen');
  }
  return 'guard + success flag + self-heal in all three builds';
});

check('the main menu is centred even though its last child is hidden', ()=>{
  for(const f of BUILDS){
    const html=readBuild(f);
    if(/\.overlay > \*:last-child\{margin-bottom:auto/.test(html))
      throw new Error(f+': auto margin on the last child — it is display:none, so the menu sinks to the bottom');
    if(html.indexOf(".overlay::before,.overlay::after{content:''")<0) throw new Error(f+': no flex spacers to centre the overlay');
    const sp=html.match(/\.overlay::before,\.overlay::after\{([^}]*)\}/)[1];
    if(sp.indexOf('flex:1 1 0')<0) throw new Error(f+': spacers do not grow');
    if(sp.indexOf('min-height:0')<0) throw new Error(f+': spacers cannot shrink — a tall menu would scroll past its own top');
  }
  // and the thing that made it bite: #start really does end on a hidden element
  const start=readBuild('towerlords.html').match(/<div id="start" class="overlay">([\s\S]*?)\n  <\/div>/);
  if(!start || !/id="onlineLobby" class="menuCol hidden"/.test(start[1]))
    throw new Error('#start no longer ends on the hidden lobby — re-check this assumption');
  return 'pseudo-element spacers, immune to hidden first/last children';
});

check('the menu scales up on large displays', ()=>{
  const html=readBuild('towerlords.html');
  for(const q of ['@media (min-width:1500px)','@media (min-width:2200px)'])
    if(html.indexOf(q)<0) throw new Error('no '+q+' block — the menu stays a postage stamp on a wide monitor');
  const wide=html.slice(html.indexOf('@media (min-width:2200px)'));
  const w=wide.match(/\.menuShell\{width:min\((\d+)px/);
  if(!w || +w[1]<=980) throw new Error('the menu shell is still capped near its 980px default: '+(w?w[1]:'?'));
  return 'shell grows to '+w[1]+'px at 2200px+';
});

console.log('\n=== INSPECT PANE ===');

check('the inspect pane is always mounted, so the bag never jumps', ()=>{
  for(const f of BUILDS){
    const html=readBuild(f);
    if(/<div id="inspectSec" class="hidden">/.test(html))
      throw new Error(f+': Inspect starts hidden — the CARRIED grid slides up and down as you click items');
    if(/inspectSec[^\n]*classList\.(add|remove)\('hidden'\)/.test(html))
      throw new Error(f+': something still shows/hides the Inspect section at runtime');
    if(html.indexOf('const INSPECT_EMPTY=')<0) throw new Error(f+': no empty-state copy — the pane would be a blank box');
    if(html.indexOf('#inspectSec{min-height:var(--dpH')<0) throw new Error(f+': the section does not reserve its height');
  }
  return 'permanently mounted with a placeholder empty state';
});

check('the inspect pane is a fixed size driven by one variable', ()=>{
  const html=readBuild('towerlords.html');
  const v=html.match(/#invPanel\{--dpH:([^;}]+)[;}]/);
  if(!v) throw new Error('no --dpH custom property');
  for(const sel of ['.detailPane{height:var(--dpH','.detailPane.blank','#inspectSec{min-height:var(--dpH'])
    if(html.indexOf(sel)<0) throw new Error(sel+' does not follow --dpH — pane, empty state and reserved space could disagree');
  const blank=html.match(/\.detailPane\.blank\{([^}]*)\}/)[1];
  if(blank.indexOf('height:var(--dpH')<0) throw new Error('the empty state is a different height from the filled pane');
  return '--dpH = '+v[1].trim();
});

check('everything in the inspect pane is reachable without scrolling for it', ()=>{
  const html=readBuild('towerlords.html');
  // header / two-column body / pinned footer — the actions must not be able to fall below a scroll line
  for(const cls of ['dp-hd','dp-body','dp-col','dp-foot'])
    if(html.indexOf('class="'+cls)<0 && html.indexOf('"dp-body${')<0) throw new Error('no .'+cls+' band in the rendered markup');
  const pane=html.match(/\.detailPane\{([^}]*)\}/)[1];
  if(pane.indexOf('display:flex')<0 || pane.indexOf('flex-direction:column')<0)
    throw new Error('the pane is not a flex column — the footer cannot pin');
  if(pane.indexOf('overflow:hidden')<0) throw new Error('the whole pane still scrolls, which is what buried the buttons');
  const foot=html.match(/\.dp-foot\{([^}]*)\}/)[1];
  if(foot.indexOf('flex:none')<0) throw new Error('the action footer can be squashed or scrolled away');
  const body=html.match(/\.dp-body\{([^}]*)\}/)[1];
  if(body.indexOf('flex:1 1 auto')<0 || body.indexOf('min-height:0')<0) throw new Error('the body does not absorb the leftover height');
  if(body.indexOf('grid-template-columns')<0) throw new Error('the body is not two columns — the old single column is what overflowed');
  if(html.indexOf('.dp-body.solo{grid-template-columns:minmax(0,1fr)')<0)
    throw new Error('items with nothing to compare against would leave a dead empty column');
  if(html.indexOf('@container (max-width:560px)')<0) throw new Error('a narrowed panel would squeeze both columns instead of stacking them');
  return 'header + 2-col scrollable body + pinned footer';
});

check('an item too long for the pane says so instead of clipping silently', ()=>{
  const html=fs.readFileSync(path.join(__dirname,'..','towerlords.html'),'utf8');
  if(html.indexOf('function markInspectOverflow')<0) throw new Error('nothing measures whether the body overflowed');
  if(html.indexOf('class="dp-more"')<0) throw new Error('no overflow cue is rendered');
  if(html.indexOf('.detailPane.hasMore .dp-more{display:block}')<0 && html.indexOf('.detailPane.hasMore .dp-more{display:block;}')<0)
    throw new Error('the cue is never revealed');
  // the ONE place a scrollbar must stay visible — everywhere else they are hidden for looks
  const hide=html.match(/\.panel,\.panelBody,\.bagGrid,\.detailPane,([^{]*)\{scrollbar-width:none/);
  if(hide && hide[1].indexOf('.dp-body')>=0) throw new Error('.dp-body scrollbar is hidden — clipped stats would give no signal at all');
  if(html.indexOf('.dp-body::-webkit-scrollbar{width:8px')<0) throw new Error('.dp-body has no visible scrollbar');
  if(html.indexOf('.detailPane.hasMore .dp-body{mask-image')<0) throw new Error('no fade to show content continues below');
  return 'measured on render + "scroll for more" cue + visible bar + fade';
});

check('the running build identifies itself', ()=>{
  // a stale cached copy of a 1.3MB local file looks exactly like a fix that did not work
  for(const f of BUILDS){
    const html=readBuild(f);
    if(html.indexOf("const BUILD_ID=")<0) throw new Error(f+': no build id');
    if(html.indexOf("console.info('[TowerLords] build '+BUILD_ID)")<0) throw new Error(f+': build id never logged');
    if(html.indexOf('class="buildStamp"')<0) throw new Error(f+': build id never shown on the menu');
  }
  const id=readBuild('towerlords.html').match(/const BUILD_ID='([^']+)'/)[1];
  return 'stamped on the menu + console: '+id;
});

check('the action buttons render inside the footer, not the body', ()=>{
  const html=readBuild('towerlords.html');
  const i=html.indexOf('if(acts) h+=`<div class="dp-foot">');
  if(i<0) throw new Error('actions are not wrapped in the footer band');
  if(html.indexOf('<div class="dp-foot"><div class="dp-acts">${acts}</div></div>')<0)
    throw new Error('the footer does not contain the action row');
  return 'Equip / Stash / Lock always on screen';
});

console.log(R.join('\n'));
console.log('\n=== '+(fails?('FAILURES: '+fails):'ALL CHECKS PASSED')+' ===');
process.exit(fails?1:0);
