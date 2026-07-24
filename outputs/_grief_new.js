function harpVoice(f,t,v){ if(!actx||!musGain)return; const g=actx.createGain(); const o=actx.createOscillator(); o.type='triangle'; o.frequency.value=f; const o2=actx.createOscillator(); o2.type='sine'; o2.frequency.value=f*2.0; const g2=actx.createGain(); g2.gain.value=0.18; o2.connect(g2); g2.connect(g);
  o.connect(g); g.connect(musGain); g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(v,t+0.004); g.gain.exponentialRampToValueAtTime(0.0001,t+0.95); o.start(t);o2.start(t); o.stop(t+1.05);o2.stop(t+1.05); }   // plucked harp — shimmer & rolled texture
function tambVoice(t,v){ if(!actx||!musGain)return; const n=Math.floor(actx.sampleRate*0.13), buf=actx.createBuffer(1,n,actx.sampleRate), d=buf.getChannelData(0); for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/n,2.6); const s=actx.createBufferSource(); s.buffer=buf; const bp=actx.createBiquadFilter(); bp.type='bandpass'; bp.frequency.value=6800; bp.Q.value=0.7; const g=actx.createGain(); g.gain.value=v; s.connect(bp); bp.connect(g); g.connect(musGain); s.start(t); }   // soft tambourine jingle — the quiet, increasingly urgent pulse
// ===== GRIEF ARRANGEMENT — a cinematic neoclassical build: a piano ostinato drives it, a solo violin
// carries the theme, and strings (double bass, cello, viola, upper violins), harp and tambourine accumulate
// over ~4 loops into a long crescendo. Bittersweet: it climbs toward something like triumph, never quite joy.
function playGrief(song,ls,bar,s,t,sd,chord,root,nf,cO,bO,XSAD){
  const loop=Math.floor((MUS.step||0)/64);
  const ph=Math.max(0,Math.min(1, loop/4));          // 0 → 1 crescendo across four loops, then holds
  const beat=(s%4===0);
  const OST=[chord[0], chord[1], chord[2], chord[0]+12, chord[2], chord[1], chord[2], chord[0]+12];   // the flowing, repeating figure
  // 1) PIANO OSTINATO — always present, the engine of the piece
  if(XSAD){ if(s%4===0){ const oi=(s/4)%OST.length; pianoVoice(nf(cO+OST[oi]),t,sd*3.4, 0.028+0.014*ph); } }
  else { if(s%2===0){ const oi=(s/2)%OST.length; pianoVoice(nf(cO+OST[oi]),t,sd*2.6, 0.026+0.02*ph); } }
  // 2) DOUBLE BASS — lowest foundation, from the first bar
  if(s===0) strVoice(nf(bO+root),t,sd*16, (XSAD?0.026:0.03), 1.3);
  // 3) CELLO — deep, mournful weight, enters loop 1
  if(loop>=1 && (s===0 || s===8)) strVoice(nf(bO+12+chord[s===0?0:2]),t,sd*8, (0.02+0.02*ph)*(XSAD?0.8:1), 1.6);
  // 4) VIOLA — warm middle harmony under the violins, enters loop 1
  if(loop>=1 && s===0) strVoice(nf(cO+chord[1]),t,sd*15, (0.015+0.018*ph), 2.3);
  // 5) HARP — shimmer and plucked arpeggio, enters loop 1
  if(loop>=1){ if(s%4===2){ const hi=((s>>2)+bar)%3; harpVoice(nf(cO+12+chord[hi]),t, 0.018+0.02*ph); } if(!XSAD && ph>0.55 && s%8===4) harpVoice(nf(chord[(s>>2)%3]+24),t,0.013*ph); }
  // 6) TAMBOURINE — the quiet, increasingly urgent pulse, enters loop 1
  if(loop>=1 && !XSAD){ if(s%2===0) tambVoice(t, (beat?0.02:0.011)*(0.4+ph)); }
  else if(XSAD && ph>0.6 && s%4===0) tambVoice(t, 0.011*ph);
  // 7) UPPER VIOLIN pad — the soaring layer, enters loop 2
  if(loop>=2 && s===0) strVoice(nf(chord[2]+12),t,sd*15, 0.012*ph, 3.6);
  // 8) SOLO VIOLIN — the theme, swelling with the build; additional violins double it up high late in the climb
  const mn=song.melAt[ls]; if(mn){ const f=nf(mn.p), d=sd*mn.d;
    violinVoice(f,t,d, (XSAD?0.07:0.085) + 0.02*ph);
    if(loop>=2 && !XSAD) violinVoice(nf(mn.p+12),t,d, 0.03*ph);
    if(XSAD && loop>=1 && s%8===0) handpanVoice(nf(cO+mn.p),t,0.03); }
}
