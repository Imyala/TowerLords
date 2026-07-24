// ===== BOSS CINEMATIC SCORE — a tense, sad confrontation bed (drone + slow lament + heartbeat), routed
// AROUND the ducked game master so the battle track falls silent while the guardian speaks, then restored.
let _bossNodes=null,_bossDuck=null;
function startBossScore(){ initAudio(); if(!actx) return; try{ if(actx.state==='suspended') actx.resume(); }catch(_){}
  stopBossScore(true);
  try{ _bossDuck=(master?master.gain.value:null); if(master) master.gain.setTargetAtTime(0, actx.currentTime, 0.4); }catch(_){}
  const t0=actx.currentTime;
  const out=actx.createGain(); out.gain.value=0.0001; out.connect(actx.destination); out.gain.setTargetAtTime(G.muted?0:0.75, t0, 2.2);
  const verb=actx.createConvolver(); { const len=Math.floor(actx.sampleRate*3.0), buf=actx.createBuffer(2,len,actx.sampleRate);
    for(let ch=0;ch<2;ch++){ const d=buf.getChannelData(ch); for(let i=0;i<len;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/len,2.6); } verb.buffer=buf; }
  const wet=actx.createGain(); wet.gain.value=0.55; verb.connect(wet); wet.connect(out);
  const dry=actx.createGain(); dry.gain.value=0.85; dry.connect(out);
  const bus=nd=>{ nd.connect(dry); nd.connect(verb); };
  const oscs=[], timers=[]; let alive=true;
  [55.00,82.41,110.00].forEach((f,i)=>{ const o=actx.createOscillator(); o.type=(i===2?'triangle':'sine'); o.frequency.value=f;   // low A-minor drone, breathing
    const g=actx.createGain(); g.gain.value=0; o.connect(g); bus(g); o.start(); oscs.push(o); g.gain.setTargetAtTime(0.12/(i*0.6+1), t0, 2.8);
    const lfo=actx.createOscillator(); lfo.frequency.value=0.05+i*0.02; const lg=actx.createGain(); lg.gain.value=0.05; lfo.connect(lg); lg.connect(g.gain); lfo.start(); oscs.push(lfo); });
  { const o=actx.createOscillator(); o.type='sine'; o.frequency.value=27.5; const g=actx.createGain(); g.gain.value=0; o.connect(g); g.connect(dry); o.start(); g.gain.setTargetAtTime(0.09, t0, 3.2); oscs.push(o); }   // sub weight, modest
  { const o=actx.createOscillator(); o.type='sine'; o.frequency.value=659.26; const g=actx.createGain(); g.gain.value=0; o.connect(g); g.connect(verb); o.start(); g.gain.setTargetAtTime(0.014, t0, 5.0);   // high unease shimmer
    const lfo=actx.createOscillator(); lfo.frequency.value=0.09; const lg=actx.createGain(); lg.gain.value=0.01; lfo.connect(lg); lg.connect(g.gain); lfo.start(); oscs.push(o,lfo); }
  function heart(){ if(!alive||G.muted) return; const a=actx.currentTime; [0,0.34].forEach(dt=>{ const o=actx.createOscillator(); o.type='sine'; const g=actx.createGain(); o.connect(g); g.connect(dry);
    o.frequency.setValueAtTime(80,a+dt); o.frequency.exponentialRampToValueAtTime(38,a+dt+0.16); g.gain.setValueAtTime(0.0001,a+dt); g.gain.linearRampToValueAtTime(0.10,a+dt+0.02); g.gain.exponentialRampToValueAtTime(0.0001,a+dt+0.28); o.start(a+dt); o.stop(a+dt+0.32); }); timers.push(setTimeout(heart, 1700)); }
  timers.push(setTimeout(heart, 900));
  const SC={A3:220.00,G3:196.00,F3:174.61,E3:164.81,D3:146.83,C4:261.63,B3:246.94};
  const phrase=[['A3',3.0],['C4',2.6],['B3',2.4],['A3',3.4],['F3',3.0],['G3',2.6],['E3',4.6]];   // a slow lament over the drone
  function voice(freq,dur){ if(!alive||G.muted) return; const a=actx.currentTime; const o=actx.createOscillator(); o.type='triangle'; o.frequency.value=freq; const g=actx.createGain(); g.gain.value=0; o.connect(g); bus(g);
    g.gain.setValueAtTime(0,a); g.gain.linearRampToValueAtTime(0.10,a+0.9); g.gain.setTargetAtTime(0.00008,a+dur*0.5,dur*0.5);
    const o2=actx.createOscillator(); o2.type='sine'; o2.frequency.value=freq*2.002; const g2=actx.createGain(); g2.gain.value=0; o2.connect(g2); bus(g2); g2.gain.setValueAtTime(0,a); g2.gain.linearRampToValueAtTime(0.03,a+1.1); g2.gain.setTargetAtTime(0.00008,a+dur*0.5,dur*0.5);
    o.start(a);o2.start(a); o.stop(a+dur+1.1);o2.stop(a+dur+1.1); }
  let mi=0; function schedMel(){ if(!alive) return; const st=phrase[mi%phrase.length]; voice(SC[st[0]]||220, st[1]); mi++; timers.push(setTimeout(schedMel, (mi%phrase.length===0?4200:2400))); }
  timers.push(setTimeout(schedMel, 1900));
  function bell(freq,vol){ if(!alive||G.muted) return; const a=actx.currentTime; [1,2.76,5.4].forEach((p,i)=>{ const o=actx.createOscillator(); o.type='sine'; o.frequency.value=freq*p; const g=actx.createGain(); g.gain.value=0; o.connect(g); g.connect(verb); g.connect(dry);
    const v=vol*(i===0?1:0.4/i); g.gain.setValueAtTime(0,a); g.gain.linearRampToValueAtTime(v,a+0.008); g.gain.setTargetAtTime(0.00006,a+0.02,1.6+i*0.4); o.start(a); o.stop(a+5); }); }
  _bossNodes={out,oscs,timers,bell,setDead:()=>{alive=false;}}; }
function bossBellCue(){ if(_bossNodes&&_bossNodes.bell) try{ _bossNodes.bell(110,0.10); }catch(_){} }
function stopBossScore(instant){ const N=_bossNodes; if(!N) return; _bossNodes=null; try{ N.setDead(); }catch(_){}
  try{ N.timers.forEach(clearTimeout); }catch(_){}
  if(actx){ const t=actx.currentTime; try{ N.out.gain.cancelScheduledValues(t); N.out.gain.setTargetAtTime(0.0001, t, instant?0.05:1.4); }catch(_){}
    try{ if(master && _bossDuck!=null) master.gain.setTargetAtTime(_bossDuck, t+(instant?0.1:1.0), 0.5); }catch(_){}
    setTimeout(()=>{ try{ N.oscs.forEach(o=>{ try{o.stop();}catch(_){}}); N.out.disconnect(); }catch(_){} }, instant?140:2000); } }
