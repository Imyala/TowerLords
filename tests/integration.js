// TowerLords harness #2 — build a real-ish game state, then drive the panels and the objective
// lifecycle end to end looking for runtime errors.
const fs=require('fs'), vm=require('vm'), path=require('path');
const H=require(path.join(__dirname,'sandbox.js'));
const {ctx, src}=H.load(process.argv[2]||'/tmp/tl.js');
const g=k=>vm.runInContext(k, ctx);
const run=code=>vm.runInContext(code, ctx);

const R=[]; let fails=0;
function check(name, fn){
  try{ const m=fn(); R.push('  PASS  '+name+(m?'  — '+m:'')); }
  catch(e){ fails++; R.push('  FAIL  '+name+'  — '+(e&&e.message||e)+(e&&e.stack?('\n         '+String(e.stack).split('\n')[1].trim()):'')); }
}

// ---------------------------------------------------------------- build a plausible character
check('build a live character state', ()=>{
  run(`
    G.running=true; G.dead=false; G.inTown=false; G.practice=false;
    G.floor=7; G.level=40; G.xp=10; G.xpNeed=500; G.gold=9000; G.invCap=24;
    G.player={position:{x:0,y:0,z:0}};
    G.enemies=[]; G.pickups=[]; G.chests=[]; G.scenery=[]; G.obstacles=[]; G.respawns=[];
    G.rooms=[{x0:-20,x1:20,z0:-20,z1:20},{x0:30,x1:60,z0:30,z1:60},{x0:-60,x1:-30,z0:-60,z1:-30}];
    G.portal={x:12,z:12,active:false};
    G.inv=[]; G.stash=[];
    for(let i=0;i<14;i++) G.inv.push(makeItem(7));
    G.inv.push(makeGem(7)); G.inv.push(makeFlask(7)); G.inv.push(makeSkillGem(7));
    for(let i=0;i<6;i++) G.stash.push(makeItem(7));
    META.fame=400000; META.evolves=3;
    recompute();
  `);
  const G=g('G');
  if(G.inv.length!==17) throw new Error('bag not built');
  if(G.stash.length!==6) throw new Error('stash not built');
  return G.inv.length+' carried, '+G.stash.length+' banked, fame '+g('META').fame.toLocaleString();
});

// ---------------------------------------------------------------- panels
const panels=[
  ['renderInv',    'inventory + equipment'],
  ['renderStash',  'stash panel'],
  ['renderVendor', 'vendor'],
  ['renderChar',   'character sheet'],
  ['renderTree',   'skill tree'],
  ['renderScore',  'score panel'],
  ['updateFameBar','fame strip'],
  ['refreshMenuRank','menu rank badge'],
  ['updatePips',   'pips + skill budget label'],
  ['renderActionbar','action bar'],
];
for(const [fn,label] of panels){
  check('render: '+label+' ('+fn+')', ()=>{ run('rollVendStock&&rollVendStock(); '+fn+'();'); return 'no throw'; });
}
check('panels survive being re-rendered', ()=>{
  run('for(let i=0;i<3;i++){ renderInv(); renderStash(); renderVendor(); renderChar(); }');
  return '3x each, no throw';
});

check('stash search box is built exactly once', ()=>{
  run('renderStash(); renderStash(); renderStash();');
  const top=g("document.getElementById('stashTop')");
  if(!top._built) throw new Error('stashTop never marked built');
  return 'top._built latch holds (search box keeps focus)';
});

check('stash sort + filter reach the grids', ()=>{
  run(`STASH_Q=''; STASH_SORT='rarity'; STASH_BAG_SORT='value'; renderStashGrids();`);
  const sg=g("document.getElementById('stashGrid')");
  const before=sg.children.length;
  run(`STASH_Q='zzzz-no-such-item'; renderStashGrids();`);
  const after=g("document.getElementById('stashGrid')").children.length;
  run(`STASH_Q=''; renderStashGrids();`);
  if(!(before>0)) throw new Error('vault grid rendered nothing');
  if(after>=before) throw new Error('filter did not shrink the grid ('+before+' -> '+after+')');
  return before+' tiles unfiltered, '+after+' with a no-match filter';
});

check('deposit / gear-only / retrieve buttons all work', ()=>{
  const G=g('G');
  const doc=id=>g(`document.getElementById(${JSON.stringify(id)})`);
  run('META.stashSlots=STASH_SLOT_MAX; G.stash=[]; G.inv=[]; for(let i=0;i<8;i++) G.inv.push(makeItem(7)); G.inv.push(makeGem(7)); renderStash();');
  doc('depositGear').onclick();                       // gear only — the gem should stay put
  if(G.stash.length!==8) throw new Error('gear-only banked '+G.stash.length+' (expected 8)');
  if(G.inv.length!==1 || !G.inv[0].isGem) throw new Error('gear-only should have left the gem behind');
  doc('retrieveAll').onclick();
  if(G.stash.length!==0 || G.inv.length!==9) throw new Error('retrieve all failed: '+G.stash.length+'/'+G.inv.length);
  doc('depositAll').onclick();
  const cap=g('stashCap()');
  if(G.stash.length!==Math.min(9,cap)) throw new Error('deposit all banked '+G.stash.length+' with cap '+cap);
  return 'gear-only kept the gem, retrieve/deposit respect the '+cap+'-slot cap';
});

check('retrieve respects a full bag instead of overflowing it', ()=>{
  const G=g('G');
  run('G.inv=[]; G.stash=[]; for(let i=0;i<G.invCap;i++) G.inv.push(makeItem(7)); for(let i=0;i<3;i++) G.stash.push(makeItem(7)); renderStash();');
  g("document.getElementById('retrieveAll')").onclick();
  if(G.inv.length>G.invCap) throw new Error('bag overflowed to '+G.inv.length+'/'+G.invCap);
  if(G.stash.length!==3) throw new Error('items vanished from the vault');
  return 'bag stayed at '+G.inv.length+'/'+G.invCap+', vault untouched';
});

// ---------------------------------------------------------------- objective lifecycle
check('every objective can be rolled, set up and ticked', ()=>{
  const ids=g('FLOOR_OBJECTIVES').map(o=>o.id);
  const done=[];
  for(const id of ids){
    run(`
      G.portal={x:12,z:12,active:false}; G.enemies=[]; G.scenery=[]; G.chests=[]; G.objProps=[]; _G.objKeep=false;
      for(let i=0;i<12;i++) G.enemies.push({dead:false, boss:false, mesh:{position:{x:i,y:0,z:i}, add:function(){}}, scale:1, hp:10, maxhp:10, xp:5, room:G.rooms[0], home:{x:0,z:0}});
      G.obj=null;
      __forceObj=${JSON.stringify(id)};
    `);
    // force this specific objective, then run its real setup + several ticks
    run(`
      (function(){
        const d=objDef(__forceObj);
        const o={id:d.id,nm:d.nm,ic:d.ic,ds:d.ds,need:0,have:0,t:null,tMax:null,done:false,breaks:0};
        const alive=objAliveCount();
        switch(o.id){
          case 'purge': o.need=Math.max(10,Math.round(alive*0.7)); break;
          case 'exterm': o.need=Math.max(1,alive); break;
          case 'survive': o.tMax=60; o.t=o.tMax; break;
          case 'pacifist': o.tMax=30; o.t=o.tMax; break;
          case 'flawless': o.tMax=40; o.t=o.tMax; break;
          case 'hunt': o.need=3; break;
          case 'tithe': o.need=8; break;
          case 'pylons': o.need=3; break;
          case 'hold': o.need=20; break;
          case 'plunder': o.need=3; break;
        }
        G.obj=o; objSetupProps(o, G.rooms); objAnnounce(o,false);
        for(let i=0;i<60;i++) objTick(0.05);
        objHudHTML();
      })();
    `);
    done.push(id);
  }
  return done.length+' objectives set up + ticked: '+done.join(' ');
});

check('a survive objective completes on its timer and opens the portal', ()=>{
  const G=g('G');
  run(`
    G.portal={x:12,z:12,active:false}; G.enemies=[];
    G.obj={id:'survive',nm:'Endure',ic:'⏳',ds:'x',need:0,have:0,t:2,tMax:60,done:false,breaks:0};
  `);
  run('for(let i=0;i<80;i++) objTick(0.05);');
  if(!G.obj.done) throw new Error('objective never completed');
  if(!G.portal.active) throw new Error('portal did not open');
  return 'timer ran out -> portal open';
});

check('a pylon objective completes by standing on each pylon', ()=>{
  const G=g('G');
  run(`
    G.portal={x:12,z:12,active:false}; G.objProps=[]; G.scenery=[];
    G.obj={id:'pylons',nm:'Sealing Ritual',ic:'🧩',ds:'x',need:3,have:0,t:null,tMax:null,done:false,breaks:0};
    objSetupProps(G.obj, G.rooms);
  `);
  const props=g('G.objProps').filter(p=>p.kind==='pylon');
  if(props.length!==3) throw new Error('expected 3 pylons, built '+props.length);
  for(let i=0;i<3;i++){
    run(`G.player.position.x=G.objProps[${i}].x; G.player.position.z=G.objProps[${i}].z;`);
    run('for(let k=0;k<40;k++) objTick(0.05);');
  }
  if(!G.obj.done) throw new Error('sealed '+G.obj.have+'/3 but never completed');
  if(!G.portal.active) throw new Error('portal did not open');
  return '3 pylons sealed by proximity -> portal open';
});

check('a hold objective fills inside the circle and drains outside it', ()=>{
  const G=g('G');
  run(`
    G.portal={x:12,z:12,active:false}; G.objProps=[]; G.scenery=[]; G.enemies=[];
    G.obj={id:'hold',nm:'Hold the Ground',ic:'⬢',ds:'x',need:20,have:0,t:null,tMax:null,done:false,breaks:0};
    objSetupProps(G.obj, G.rooms);
    const z=G.objProps.find(p=>p.kind==='zone');
    G.player.position.x=z.x; G.player.position.z=z.z;
  `);
  run('for(let i=0;i<100;i++) objTick(0.05);');     // 5s inside
  const inside=g('G.obj.have');
  run('G.player.position.x=G.objProps.find(p=>p.kind==="zone").x+500; for(let i=0;i<40;i++) objTick(0.05);');   // 2s outside
  const outside=g('G.obj.have');
  if(!(inside>4 && inside<6)) throw new Error('inside gain was '+inside.toFixed(2)+' (expected ~5)');
  if(!(outside<inside)) throw new Error('meter did not drain outside the circle');
  return 'inside +'+inside.toFixed(1)+'s, then drained to '+outside.toFixed(1)+'s';
});

check('a tithe objective drops shards and counts them on pickup', ()=>{
  const G=g('G');
  run(`
    G.portal={x:12,z:12,active:false}; G.pickups=[];
    G.obj={id:'tithe',nm:'The Tithe',ic:'💠',ds:'x',need:3,have:0,t:null,tMax:null,done:false,breaks:0};
    for(let i=0;i<200;i++) objOnKill({mesh:{position:{x:0,y:0,z:0}}});
  `);
  const shards=g('G.pickups').filter(p=>p.kind==='objshard').length;
  if(shards<40) throw new Error('only '+shards+' shards from 200 kills (expected ~84)');
  run('objOnShard(); objOnShard(); objOnShard();');
  if(!G.obj.done) throw new Error('3 shards did not finish a 3-shard tithe');
  return shards+' shards dropped from 200 kills, 3 collected -> complete';
});

check('an extermination suppresses respawns', ()=>{
  if(!/!\(G\.obj&&G\.obj\.id==='exterm'\)/.test(src)) throw new Error('respawn guard missing');
  const n=(src.match(/!\(G\.obj&&G\.obj\.id==='exterm'\)/g)||[]).length;
  if(n<2) throw new Error('only '+n+' of the 2 respawn paths are guarded');
  return 'both respawn paths guarded';
});

check('the reshuffle carry-over flag cannot leak between floors', ()=>{
  if(!/_G\.objKeep=false;\s*\/\/ safety/.test(src)) throw new Error('no reset at the end of generateFloor');
  if(!/if\(!_G\.objKeep\) G\.obj=null;/.test(src)) throw new Error('generateFloor still nulls the objective unconditionally');
  return 'flag consumed on roll, force-cleared on the way out of generateFloor';
});

// ---------------------------------------------------------------- evolution flow
check('evolution is blocked until the seals and the fame are in', ()=>{
  const G=g('G');
  run('G.level=1; G.evolves=0; G.sealK=0; G.sealD=0; G.sealF=0; META.fame=0;');
  if(g('canEvolve()')) throw new Error('evolvable at level 1');
  if(!/Reach Level/.test(g('evolveBlocker()'))) throw new Error('wrong blocker at low level: '+g('evolveBlocker()'));
  run('G.level=LEVEL_CAP;');
  if(!/Ascendant Seals/.test(g('evolveBlocker()'))) throw new Error('wrong blocker with no seals: '+g('evolveBlocker()'));
  run('G.sealK=99; G.sealD=999; G.sealF=1;');
  if(!/fame/.test(g('evolveBlocker()'))) throw new Error('wrong blocker with no fame: '+g('evolveBlocker()'));
  run('META.fame=evolveCost()+1;');
  if(g('evolveBlocker()')!==null) throw new Error('still blocked: '+g('evolveBlocker()'));
  if(!g('canEvolve()')) throw new Error('canEvolve disagrees with evolveBlocker');
  return 'level -> seals -> fame, in that order';
});

check('evolving spends the fame, consumes the seals and rebirths at level 1', ()=>{
  const G=g('G'), META=g('META');
  run('G.level=LEVEL_CAP; G.evolves=2; G.sealK=99; G.sealD=999; G.sealF=1; META.fame=5000000; G.attr={str:100,dex:100,int:100,vit:100,will:100}; G.alloc={x:5}; recompute();');
  const cost=g('evolveCost()'), fameBefore=META.fame, attrBefore=JSON.stringify(g('G.attr')), allocBefore=JSON.stringify(g('G.alloc'));
  run('evolve();');
  if(G.level!==1) throw new Error('level is '+G.level+', expected 1');
  if(G.evolves!==3) throw new Error('evolution count is '+G.evolves);
  if(META.fame!==fameBefore-cost) throw new Error('fame went '+fameBefore+' -> '+META.fame+' (cost '+cost+')');
  if(G.sealK!==0||G.sealD!==0||G.sealF!==0) throw new Error('seals were not consumed');
  if(JSON.stringify(g('G.attr'))!==attrBefore) throw new Error('attributes were lost');
  if(JSON.stringify(g('G.alloc'))!==allocBefore) throw new Error('talents were lost');
  return 'lvl1, evolves 2->3, -'+cost.toLocaleString()+' fame, stats & talents kept';
});

check('an evolved character never earns another skill point', ()=>{
  const G=g('G');
  run('G.evolves=1; G.level=10; G.skillGranted=SKILL_BUDGET; G.skillPts=0; G.xp=999999; G.xpNeed=1; G.xpMode="use";');
  run('for(let i=0;i<40;i++) doLevelUp();');
  if(G.skillPts!==0) throw new Error('gained '+G.skillPts+' skill points after evolving');
  if(!(G.attrPts>0)) throw new Error('should still gain attribute points, got '+G.attrPts);
  return '40 levels after evolving: +'+G.attrPts+' attributes, +0 skill points';
});

check('a first climb to 255 grants exactly one tree and no more', ()=>{
  const G=g('G'), B=g('SKILL_BUDGET');
  run('G.evolves=0; G.level=1; G.skillGranted=START_SKILL_PTS; G.skillPts=START_SKILL_PTS; G.attrPts=0; G.alloc={}; G.xpMode="use";');
  run('for(let lv=1;lv<255;lv++){ G.xp=G.xpNeed; doLevelUp(); }');
  if(G.level!==255) throw new Error('ended at level '+G.level);
  if(G.skillGranted!==B) throw new Error('lifetime grant was '+G.skillGranted+', budget is '+B);
  run('G.xp=G.xpNeed*10; for(let i=0;i<5;i++) doLevelUp();');
  if(G.skillGranted!==B) throw new Error('budget grew past the cap to '+G.skillGranted);
  return 'level 255 with exactly '+B+'/'+B+' lifetime points, capped';
});

check('seals shatter on death', ()=>{
  const G=g('G');
  run('G.sealK=9; G.sealD=99; G.sealF=1; shatterSeals(true);');
  if(G.sealK||G.sealD||G.sealF) throw new Error('seals survived');
  if(!/shatterSeals\(\);\s+\/\/ ASCENDANT SEALS/.test(src)) throw new Error('die() does not call shatterSeals');
  return 'die() clears all three';
});

// ---------------------------------------------------------------- dialogs & tree
check('confirmation dialogs open without throwing', ()=>{
  run('G.inTown=true; G.gold=999999; G.alloc={a:3}; G.level=LEVEL_CAP; G.evolves=0; G.sealK=0; G.sealD=0; G.sealF=0;');
  run('respecPrompt();');    // affordable
  run('G.gold=0; respecPrompt();');   // too poor -> informational variant
  run('evolvePrompt();');    // blocked -> checklist variant
  run('G.sealK=99; G.sealD=999; G.sealF=1; META.fame=9e9; evolvePrompt();');   // ready -> confirm variant
  return 'respec (rich/poor) + evolve (blocked/ready)';
});

check('shift+click fills a talent node to max', ()=>{
  const G=g('G');
  run('G.alloc={}; G.skillPts=500; recompute();');
  const tid=g('Object.keys(TALENTMAP).find(k=>{const t=TALENTMAP[k]; return t && !t.beastKey && t.max>=3 && t.tier===0;})');
  if(!tid) throw new Error('no unlocked talent node to test with');
  run(`G.alloc={}; G.skillPts=500; recompute(); investTalentMax(${JSON.stringify(tid)});`);
  const t=g(`TALENTMAP[${JSON.stringify(tid)}]`), got=g('G.alloc')[tid];
  if(got!==t.max) throw new Error('filled to '+got+'/'+t.max);
  return tid+' -> '+got+'/'+t.max+' in one click';
});
check('shift+click stops cleanly when points run out', ()=>{
  const G=g('G');
  run('G.alloc={}; G.skillPts=500; recompute();');
  const tid=g('Object.keys(TALENTMAP).find(k=>{const t=TALENTMAP[k]; return t && !t.beastKey && t.max>=3 && t.tier===0;})');
  run(`G.alloc={}; G.skillPts=1; recompute(); investTalentMax(${JSON.stringify(tid)});`);
  const got=g('G.alloc')[tid];
  if(got!==1) throw new Error('spent more than it had: '+got);
  if(g('G.skillPts')!==0) throw new Error('points left over: '+g('G.skillPts'));
  return 'one point available -> exactly one rank';
});

// ---------------------------------------------------------------- inspect / compare pane
console.log('\n=== INSPECT PANE ===');

// Every band the fixed-size pane promises must actually be emitted, for every kind of item, and the
// action buttons must land in the pinned footer rather than somewhere down the scrollable body.
// Build a dedicated bag first — the stash tests above shuffle items in and out of G.inv.
check('stage a bag holding one of every item kind', ()=>{
  run(`
    G.inv=[]; G.invCap=24; G.equip={};
    G._gear=makeItem(7); while(!G._gear.slotKey||G._gear.isGem||G._gear.isFlask||G._gear.isSkillGem) G._gear=makeItem(7);
    G._gem=makeGem(7); G._flask=makeFlask(7); G._skill=makeSkillGem(7);
    G.inv.push(G._gear, G._gem, G._flask, G._skill);
    G._worn=makeItem(7); G._worn.slotKey=G._gear.slotKey; G.equip[G._gear.slotKey]=G._worn;
    recompute(); renderInv();
  `);
  const G=g('G');
  if(!G._gear||!G._gem||!G._flask||!G._skill||!G._worn) throw new Error('staging failed');
  return 'gear ('+G._gear.slotKey+') · gem · flask · skill gem · one worn counterpart';
});

function inspect(expr, ctxObj){
  run('showItemDetail('+expr+', '+JSON.stringify(ctxObj)+');');
  return String(g("document.getElementById('itemDetail').innerHTML")||'');
}

check('inspecting a bag item lays out header / body / footer', ()=>{
  const h=inspect('G._gear', {kind:'bag'});
  for(const band of ['class="dp-hd','class="dp-body','class="dp-col','class="dp-foot'])
    if(h.indexOf(band)<0) throw new Error('missing band '+band);
  const foot=h.slice(h.indexOf('class="dp-foot'));
  for(const act of ['data-act="equip"','data-act="stash"','data-act="lock"'])
    if(foot.indexOf(act)<0) throw new Error(act+' is not in the pinned footer');
  return 'header + body + footer, all 3 actions pinned';
});

check('an item with nothing to compare against collapses to one column', ()=>{
  const h=inspect('G._gem', {kind:'bag'});
  if(h.indexOf('dp-body solo')<0) throw new Error('no solo class — the pane would show a dead empty column');
  if(h.indexOf('dp-colB')>=0) throw new Error('a comparison column was emitted for an item that has no equipped counterpart');
  return 'single column, no empty gutter';
});

check('a comparable item gets a real comparison column', ()=>{
  const h=inspect('G._gear', {kind:'bag'});
  if(h.indexOf('dp-colB')<0) throw new Error('no comparison column');
  if(h.indexOf('dp-body solo')>=0) throw new Error('still collapsed to one column despite having a comparison');
  const B=h.slice(h.indexOf('dp-colB'));
  if(B.indexOf('dp-cmp')<0) throw new Error('the comparison column has no equipped-item block');
  if(h.slice(0,h.indexOf('dp-colB')).indexOf('dp-cmp')>=0) throw new Error('the comparison leaked into the left column');
  if(h.slice(0,h.indexOf('dp-colB')).indexOf('dp-af')<0) throw new Error('the item own affixes left column A');
  return 'facts in column A, verdict + worn gear in column B';
});

check('every item kind inspects without throwing', ()=>{
  const kinds=[
    ['G._gem',   {kind:'bag'},   'stat gem'],
    ['G._flask', {kind:'bag'},   'flask'],
    ['G._skill', {kind:'bag'},   'skill gem'],
    ['G._gear',  {kind:'stash'}, 'stashed gear'],
    ['G._worn',  {kind:'equip'}, 'equipped gear'],
  ];
  const done=[];
  for(const [expr,c,label] of kinds){
    const h=inspect(expr, c);
    if(!h) throw new Error(label+': rendered nothing');
    if(h.indexOf('class="dp-hd')<0) throw new Error(label+': no header band');
    if(h.indexOf('class="dp-body')<0) throw new Error(label+': no body band');
    done.push(label);
  }
  return done.join(' · ');
});

check('clearing the pane leaves readable placeholder copy, not an empty box', ()=>{
  run('clearItemDetail();');
  const dp=g("document.getElementById('itemDetail')");
  if(String(dp.className||'').indexOf('blank')<0) throw new Error('the pane is not in its blank state');
  const txt=String(dp.textContent||'').trim();
  if(txt.length<20) throw new Error('blank pane has no placeholder copy — it reads as a broken empty box');
  if(String(dp.innerHTML||'').indexOf('dp-foot')>=0) throw new Error('stale action buttons survived the clear');
  return JSON.stringify(txt.slice(0,42)+'…');
});

console.log(R.join('\n'));
console.log('\n=== '+(fails?('FAILURES: '+fails):'ALL CHECKS PASSED')+' ===');
process.exit(fails?1:0);
