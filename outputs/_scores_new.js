// ===== BOSS CINEMATIC SCORES — variant pools, chosen at random each time, anti-repeated. =====
// INTRO: somber and ANGRY but QUIET and beatless — a low drone, a smoldering dissonant growl that swells and
// recedes, and a slow, dark motif. No heartbeat, no drums, no risers. 12 variants (different keys/motifs/clashes).
// DEFEAT: the slow, calm, sad rain, in 10 variants (different sad chords, piano laments, rain colour, thunder).
let _bossNodes=null,_bossDuck=null,_lastIntroV=-1,_lastDefV=-1;
const INTRO_VARIANTS=[
  {root:55.00, motif:[0,-2,-3,-2,-7], clash:1,  bright:2.4, dur:3.8},
  {root:48.99, motif:[0,3,2,0,-2],    clash:6,  bright:2.0, dur:4.2},
  {root:43.65, motif:[0,-1,0,-5,-3],  clash:11, bright:2.2, dur:4.6},
  {root:41.20, motif:[0,2,3,2,0],     clash:1,  bright:1.8, dur:4.0},
  {root:36.71, motif:[0,-2,-5,-7],    clash:6,  bright:2.6, dur:5.2},
  {root:58.27, motif:[0,3,5,3,0,-2],  clash:13, bright:2.2, dur:3.6},
  {root:51.91, motif:[0,-3,-2,0,3],   clash:1,  bright:2.0, dur:4.4},
  {root:61.74, motif:[0,-1,-3,-1],    clash:6,  bright:2.8, dur:3.4},
  {root:46.25, motif:[0,2,0,-3,-5],   clash:11, bright:1.9, dur:4.8},
  {root:55.00, motif:[0,-5,-3,-2,0],  clash:6,  bright:2.4, dur:4.2},
  {root:49.00, motif:[0,3,7,3,2,0],   clash:1,  bright:2.1, dur:3.8},
  {root:38.89, motif:[0,-2,-3,-7,-5], clash:13, bright:2.5, dur:5.4},
];
function _pickV(arr,lastRef){ if(arr.length<2) return 0; let i=Math.floor(Math.random()*arr.length); if(i===lastRef.v) i=(i+1)%arr.length; lastRef.v=i; return i; }
const _lastI={v:-1}, _lastD={v:-1};
function startBossScore(){ initAudio(); if(!actx) return; try{ if(actx.state==='suspended') actx.resume(); }catch(_){}
  stopBossScore(true);
  const cfg=INTRO_VARIANTS[_pickV(INTRO_VARIANTS,_lastI)];
  const F=(semis)=>cfg.root*Math.pow(2,semis/12);
  try{ _bossDuck=(master?master.gain.value:null); if(master) master.gain.setTargetAtTime(0, actx.currentTime, 0.5); }catch(_){}
  const t0=actx.currentTime;
  const out=actx.createGain(); out.gain.value=0.0001; out.connect(actx.destination); out.gain.setTargetAtTime(G.muted?0:0.42, t0, 3.0);   // QUIET
  const verb=actx.createConvolver(); { const len=Math.floor(actx.sampleRate*3.4), buf=actx.createBuffer(2,len,actx.sampleRate);
    for(let ch=0;ch<2;ch++){ const d=buf.getChannelData(ch); for(let i=0;i<len;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/len,2.8); } verb.buffer=buf; }
  const wet=actx.createGain(); wet.gain.value=0.55; verb.connect(wet); wet.connect(out);
  const dry=actx.createGain(); dry.gain.value=0.85; dry.connect(out);
  const bus=nd=>{ nd.connect(dry); nd.connect(verb); };
  const oscs=[], timers=[]; let alive=true;
  // low drone (root, fifth, octave), slow breathing
  [F(0),F(7),F(12)].forEach((f,i)=>{ const o=actx.createOscillator(); o.type=(i===2?'triangle':'sine'); o.frequency.value=f;
    const g=actx.createGain(); g.gain.value=0; o.connect(g); bus(g); o.start(); oscs.push(o); g.gain.setTargetAtTime(0.11/(i*0.6+1), t0, 3.4);
    const lfo=actx.createOscillator(); lfo.frequency.value=0.04+i*0.015; const lg=actx.createGain(); lg.gain.value=0.04; lfo.connect(lg); lg.connect(g.gain); lfo.start(); oscs.push(lfo); });
  { const o=actx.createOscillator(); o.type='sine'; o.frequency.value=F(-12); const g=actx.createGain(); g.gain.value=0; o.connect(g); g.connect(dry); o.start(); g.gain.setTargetAtTime(0.08, t0, 3.6); oscs.push(o); }   // sub weight, quiet
  // SMOULDERING GROWL — the 'angry': a low detuned pair a clash-interval apart, swelling in and out very slowly. No rhythm.
  { const lp=actx.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=F(12)*3+120; lp.Q.value=0.9; const g=actx.createGain(); g.gain.value=0; lp.connect(g); bus(g);
    const oa=actx.createOscillator(); oa.type='sawtooth'; oa.frequency.value=F(12); const ob=actx.createOscillator(); ob.type='sawtooth'; ob.frequency.value=F(12+cfg.clash); const oc=actx.createOscillator(); oc.type='sawtooth'; oc.frequency.value=F(12)*1.004;
    oa.connect(lp); ob.connect(lp); oc.connect(lp);
    g.gain.setValueAtTime(0.0001,t0); g.gain.setTargetAtTime(0.018,t0+2,5);   // creeps in, stays low
    const sw=actx.createOscillator(); sw.type='sine'; sw.frequency.value=0.05; const sg=actx.createGain(); sg.gain.value=0.012; sw.connect(sg); sg.connect(g.gain); sw.start();   // slow smoulder swell
    oa.start();ob.start();oc.start(); oscs.push(oa,ob,oc,sw); }
  // faint high shimmer — cold and distant
  { const o=actx.createOscillator(); o.type='sine'; o.frequency.value=F(36); const g=actx.createGain(); g.gain.value=0; o.connect(g); g.connect(verb); o.start(); g.gain.setTargetAtTime(0.010, t0, 6.0);
    const lfo=actx.createOscillator(); lfo.frequency.value=0.07; const lg=actx.createGain(); lg.gain.value=0.008; lfo.connect(lg); lg.connect(g.gain); lfo.start(); oscs.push(o,lfo); }
  // SLOW DARK MOTIF — a dark voice (sawtooth into a soft lowpass), quiet, no beat
  function voice(freq,dur){ if(!alive||G.muted) return; const a=actx.currentTime; const lp=actx.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=freq*cfg.bright+280; lp.Q.value=0.8;
    const o=actx.createOscillator(); o.type='sawtooth'; o.frequency.value=freq; const o2=actx.createOscillator(); o2.type='sine'; o2.frequency.value=freq*2.001; const g2=actx.createGain(); g2.gain.value=0.25; o2.connect(g2); g2.connect(lp);
    const g=actx.createGain(); g.gain.value=0; o.connect(lp); lp.connect(g); bus(g);
    g.gain.setValueAtTime(0,a); g.gain.linearRampToValueAtTime(0.075,a+dur*0.35); g.gain.setTargetAtTime(0.00008,a+dur*0.6,dur*0.5);
    o.start(a);o2.start(a); o.stop(a+dur+1.0);o2.stop(a+dur+1.0); }
  let mi=0; function schedMel(){ if(!alive) return; const off=cfg.motif[mi%cfg.motif.length]; voice(F(24+off), cfg.dur); mi++; timers.push(setTimeout(schedMel, (cfg.dur*1000)*(mi%cfg.motif.length===0?1.5:1.0))); }
  timers.push(setTimeout(schedMel, 1800));
  function bell(freq,vol){ if(!alive||G.muted) return; const a=actx.currentTime; [1,2.76,5.4].forEach((p,i)=>{ const o=actx.createOscillator(); o.type='sine'; o.frequency.value=freq*p; const g=actx.createGain(); g.gain.value=0; o.connect(g); g.connect(verb); g.connect(dry);
    const v=vol*(i===0?1:0.4/i); g.gain.setValueAtTime(0,a); g.gain.linearRampToValueAtTime(v,a+0.008); g.gain.setTargetAtTime(0.00006,a+0.02,1.8+i*0.4); o.start(a); o.stop(a+5); }); }
  _bossNodes={out,oscs,timers,bell,setDead:()=>{alive=false;}}; }
function bossBellCue(){ if(_bossNodes&&_bossNodes.bell) try{ _bossNodes.bell(110,0.07); }catch(_){} }
function stopBossScore(instant){ const N=_bossNodes; if(!N) return; _bossNodes=null; try{ N.setDead(); }catch(_){}
  try{ N.timers.forEach(clearTimeout); }catch(_){}
  if(actx){ const t=actx.currentTime; try{ N.out.gain.cancelScheduledValues(t); N.out.gain.setTargetAtTime(0.0001, t, instant?0.05:1.4); }catch(_){}
    try{ if(master && _bossDuck!=null) master.gain.setTargetAtTime(_bossDuck, t+(instant?0.1:1.0), 0.5); }catch(_){}
    setTimeout(()=>{ try{ N.oscs.forEach(o=>{ try{o.stop();}catch(_){}}); N.out.disconnect(); }catch(_){} }, instant?140:1900); } }
// ===== BOSS DEFEAT SCORE — slow, calm, sad rain, 10 variants (different sad chords / laments / rain / thunder). =====
let _defNodes=null,_defDuck=null;
const DEFEAT_VARIANTS=[
  {rain:2200, rainG:0.05,  pad:[220.00,261.63,329.63], scale:[293.66,261.63,246.94,220.00,196.00,174.61], thunder:true},
  {rain:1800, rainG:0.045, pad:[196.00,246.94,293.66], scale:[261.63,246.94,220.00,196.00,174.61,164.81], thunder:true},
  {rain:2600, rainG:0.055, pad:[174.61,220.00,261.63], scale:[261.63,233.08,220.00,196.00,174.61],        thunder:false},
  {rain:2000, rainG:0.05,  pad:[164.81,196.00,246.94], scale:[246.94,220.00,196.00,164.81,146.83],        thunder:true},
  {rain:2400, rainG:0.048, pad:[146.83,174.61,220.00], scale:[220.00,196.00,174.61,146.83,130.81],        thunder:false},
  {rain:1600, rainG:0.042, pad:[130.81,164.81,196.00], scale:[196.00,174.61,164.81,146.83,130.81],        thunder:true},
  {rain:2800, rainG:0.05,  pad:[246.94,293.66,349.23], scale:[293.66,277.18,246.94,220.00,196.00],        thunder:false},
  {rain:2100, rainG:0.05,  pad:[220.00,277.18,329.63], scale:[277.18,246.94,220.00,185.00,164.81],        thunder:true},
  {rain:1900, rainG:0.046, pad:[185.00,220.00,277.18], scale:[220.00,196.00,185.00,164.81,146.83],        thunder:false},
  {rain:2300, rainG:0.052, pad:[196.00,233.08,293.66], scale:[233.08,220.00,196.00,174.61,146.83],        thunder:true},
];
function startDefeatScore(){ initAudio(); if(!actx) return; try{ if(actx.state==='suspended') actx.resume(); }catch(_){}
  stopDefeatScore(true);
  const cfg=DEFEAT_VARIANTS[_pickV(DEFEAT_VARIANTS,_lastD)];
  try{ _defDuck=(master?master.gain.value:null); if(master) master.gain.setTargetAtTime(0, actx.currentTime, 0.6); }catch(_){}
  const t0=actx.currentTime;
  const out=actx.createGain(); out.gain.value=0.0001; out.connect(actx.destination); out.gain.setTargetAtTime(G.muted?0:0.72, t0, 2.6);
  const verb=actx.createConvolver(); { const len=Math.floor(actx.sampleRate*3.6), buf=actx.createBuffer(2,len,actx.sampleRate);
    for(let ch=0;ch<2;ch++){ const d=buf.getChannelData(ch); for(let i=0;i<len;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/len,3.0); } verb.buffer=buf; }
  const wet=actx.createGain(); wet.gain.value=0.5; verb.connect(wet); wet.connect(out);
  const dry=actx.createGain(); dry.gain.value=0.9; dry.connect(out);
  const bus=nd=>{ nd.connect(dry); nd.connect(verb); };
  const oscs=[], timers=[], srcs=[]; let alive=true;
  // RAIN — steady soft downpour (looping filtered noise)
  { const dur=2.2, n=Math.floor(actx.sampleRate*dur), buf=actx.createBuffer(2,n,actx.sampleRate); for(let ch=0;ch<2;ch++){ const d=buf.getChannelData(ch); for(let i=0;i<n;i++) d[i]=(Math.random()*2-1); }
    const s=actx.createBufferSource(); s.buffer=buf; s.loop=true; const hp=actx.createBiquadFilter(); hp.type='highpass'; hp.frequency.value=900; const bp=actx.createBiquadFilter(); bp.type='bandpass'; bp.frequency.value=cfg.rain; bp.Q.value=0.3;
    const g=actx.createGain(); g.gain.value=0; s.connect(hp); hp.connect(bp); bp.connect(g); g.connect(dry); g.gain.setTargetAtTime(cfg.rainG, t0, 2.8); s.start(t0); srcs.push(s); }
  // distant THUNDER (variant-gated)
  if(cfg.thunder){ (function thunder(){ if(!alive) return; const a=actx.currentTime; const dur=2.4+Math.random()*1.5, n=Math.floor(actx.sampleRate*dur), buf=actx.createBuffer(1,n,actx.sampleRate), d=buf.getChannelData(0); for(let i=0;i<n;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/n,1.6);
    const s=actx.createBufferSource(); s.buffer=buf; const lp=actx.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=180; lp.Q.value=0.7; const g=actx.createGain(); g.gain.setValueAtTime(0.0001,a); g.gain.linearRampToValueAtTime(0.05,a+0.6); g.gain.exponentialRampToValueAtTime(0.0001,a+dur); s.connect(lp); lp.connect(g); g.connect(dry); s.start(a); srcs.push(s);
    timers.push(setTimeout(thunder, 13000+Math.random()*12000)); })(); timers.push(setTimeout(()=>{}, 0)); }
  // warm faraway STRING pad — the variant's sad chord, very soft
  cfg.pad.forEach((f,i)=>{ const o=actx.createOscillator(); o.type='sawtooth'; o.frequency.value=f; const o2=actx.createOscillator(); o2.type='sawtooth'; o2.frequency.value=f*1.005;
    const lp=actx.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=f*3+300; lp.Q.value=0.7; const g=actx.createGain(); g.gain.value=0; o.connect(lp); o2.connect(lp); lp.connect(g); bus(g);
    g.gain.setTargetAtTime(0.018/(i*0.5+1), t0, 4.0);
    const lfo=actx.createOscillator(); lfo.frequency.value=0.06+i*0.02; const lg=actx.createGain(); lg.gain.value=0.006; lfo.connect(lg); lg.connect(g.gain); lfo.start(); o.start();o2.start(); oscs.push(o,o2,lfo); });
  // soft felt-PIANO lament — the variant's descending line
  function felt(freq,vol){ if(!alive||G.muted) return; const a=actx.currentTime; const g=actx.createGain(); const lp=actx.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=2000;
    const o=actx.createOscillator(); o.type='triangle'; o.frequency.value=freq; const o2=actx.createOscillator(); o2.type='sine'; o2.frequency.value=freq*2.001; const g2=actx.createGain(); g2.gain.value=0.22; o2.connect(g2); g2.connect(lp);
    o.connect(lp); lp.connect(g); bus(g); g.gain.setValueAtTime(0.0001,a); g.gain.linearRampToValueAtTime(vol,a+0.02); g.gain.exponentialRampToValueAtTime(0.0001,a+2.6); o.start(a);o2.start(a); o.stop(a+2.7);o2.stop(a+2.7); }
  const NP=cfg.scale; let pi=0; function schedP(){ if(!alive) return; felt(NP[pi%NP.length], 0.05+Math.random()*0.015); if(Math.random()<0.35) felt(NP[pi%NP.length]/2, 0.03); pi++; timers.push(setTimeout(schedP, 2600+Math.random()*1500)); }
  timers.push(setTimeout(schedP, 1400));
  _defNodes={out,oscs,timers,srcs,setDead:()=>{alive=false;}}; }
function defeatCue(){ if(!_defNodes||!actx||G.muted) return; try{ const a=actx.currentTime; const o=actx.createOscillator(); o.type='triangle'; o.frequency.value=523.25; const g=actx.createGain(); o.connect(g); g.connect(_defNodes.out); g.gain.setValueAtTime(0.0001,a); g.gain.linearRampToValueAtTime(0.045,a+0.02); g.gain.exponentialRampToValueAtTime(0.0001,a+2.2); o.start(a); o.stop(a+2.3); }catch(_){} }
function stopDefeatScore(instant){ const N=_defNodes; if(!N) return; _defNodes=null; try{ N.setDead(); }catch(_){}
  try{ N.timers.forEach(clearTimeout); }catch(_){}
  if(actx){ const t=actx.currentTime; try{ N.out.gain.cancelScheduledValues(t); N.out.gain.setTargetAtTime(0.0001, t, instant?0.05:1.8); }catch(_){}
    try{ if(master && _defDuck!=null) master.gain.setTargetAtTime(_defDuck, t+(instant?0.1:1.4), 0.6); }catch(_){}
    setTimeout(()=>{ try{ N.oscs.forEach(o=>{ try{o.stop();}catch(_){}}); (N.srcs||[]).forEach(s=>{ try{s.stop();}catch(_){}}); N.out.disconnect(); }catch(_){} }, instant?150:2400); } }
