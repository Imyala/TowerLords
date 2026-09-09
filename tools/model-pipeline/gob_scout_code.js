// ============================================================ GOBLIN SCOUT — the sculpted 3D model (Imyala)
// The goblin scout is the first enemy to use a real sculpt instead of a primitive rig. The source is L's
// Meshy sculpt "Dagger Eared Goblin" (3M triangles) run through Imyala's asset pipeline: quadric decimation
// to 5k triangles, box-projection UV charts packed into one 1024 atlas, colours re-baked from the original
// texture, and a five-bone region rig (root / armL / armR / legL / legR) so the engine's walk-swing still
// drives it. Geometry + atlas live in the <script id="imyala-goblin-scout"> data block after the game
// script (kept out of the main script so tests/extract.js still sees one clean program).
// Engine contract kept: root Group with userData.body (a Mesh whose material takes the hit-flash /
// telegraph emissiveIntensity, whose rotation.y is the heading, whose position.y is forced to scale*.95),
// userData.humanoid, userData.arms / userData.legs (rotation.x = swing). Feet sit at y=0 like every rig.
const GOB3D = { geo:null, tex:null, bones:null, anchor:null, tried:false, author:'Imyala' };
function gobScoutData(){ const el=(typeof document!=='undefined')&&document.getElementById('imyala-goblin-scout'); if(!el) return null; try{ return JSON.parse(el.textContent); }catch(_){ return null; } }
function gobScoutGeometry(){ if(GOB3D.geo||GOB3D.tried) return GOB3D.geo; GOB3D.tried=true; const D=gobScoutData(); if(!D||!D.h||!D.geo) return null;
  try{ const h=D.h, nv=h.nv, nf=h.nf; const b64=atob(D.geo); const bin=new Uint8Array(b64.length); for(let i=0;i<b64.length;i++) bin[i]=b64.charCodeAt(i); const buf=bin.buffer; let o=0;
    const p16=new Uint16Array(buf,o,nv*3); o+=nv*6; const uv16=new Uint16Array(buf,o,nv*2); o+=nv*4; const idx=new Uint16Array(buf,o,nf*3); o+=nf*6;
    const nrm=new Int8Array(buf,o,nv*3); o+=nv*3; const si=new Uint8Array(buf,o,nv*4); o+=nv*4; const sw=new Uint8Array(buf,o,nv*4); o+=nv*4;
    const pos=new Float32Array(nv*3); for(let i=0;i<nv;i++) for(let k=0;k<3;k++) pos[i*3+k]=h.min[k]+p16[i*3+k]*h.scale[k];   // de-quantise into model units (1 unit = scale 1, feet at y=-.95, faces +Z)
    const geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
    geo.setAttribute('normal',new THREE.BufferAttribute(new Int8Array(nrm),3,true));
    geo.setAttribute('uv',new THREE.BufferAttribute(new Uint16Array(uv16),2,true));
    geo.setAttribute('skinIndex',new THREE.BufferAttribute(new Uint8Array(si),4));
    geo.setAttribute('skinWeight',new THREE.BufferAttribute(new Uint8Array(sw),4,true));
    geo.setIndex(new THREE.BufferAttribute(new Uint16Array(idx),1)); geo.computeBoundingSphere(); geo.computeBoundingBox();
    const tex=new THREE.TextureLoader().load(D.tex); tex.colorSpace=THREE.SRGBColorSpace; tex.anisotropy=4; tex.flipY=true;
    GOB3D.geo=geo; GOB3D.tex=tex; GOB3D.bones=h.bones;
    const an=new THREE.BufferGeometry(); an.setAttribute('position',new THREE.BufferAttribute(new Float32Array(9),3)); an.setAttribute('normal',new THREE.BufferAttribute(new Float32Array([0,1,0,0,1,0,0,1,0]),3)); an.setIndex([0,1,2]); GOB3D.anchor=an;   // a zero-area triangle: the body Mesh the engine drives, invisible, but a real geometry so crGrade can walk it
    return geo; }catch(err){ console.warn('goblin scout model failed to decode — falling back to the primitive rig',err); return null; } }
function makeGoblinScout3D(s){ const geo=gobScoutGeometry(); if(!geo) return null; s=s||1;
  const grp=new THREE.Group(); grp.userData.humanoid=true; grp.userData.arms=[]; grp.userData.legs=[]; grp.userData.model3d='goblin-scout'; grp.userData.author=GOB3D.author;
  const mat=new THREE.MeshStandardMaterial({map:GOB3D.tex, emissiveMap:GOB3D.tex, emissive:0xffffff, emissiveIntensity:.08, roughness:.85, metalness:0});
  mat.userData.kind='skin'; mat.userData.noDetail=true;   // kind:'skin' lets crGrade roll the per-goblin lightness so a pack isn't ten clones; noDetail: it has its own texture
  const body=new THREE.Mesh(GOB3D.anchor, mat); body.frustumCulled=false; body.position.y=.95*s; body.userData.apRounded=true; grp.add(body); grp.userData.body=body;
  const skin=new THREE.SkinnedMesh(geo, mat); skin.scale.setScalar(s); skin.castShadow=true; skin.frustumCulled=false; skin.userData.apRounded=true; body.add(skin);
  const B=GOB3D.bones; const mk=(k,parent)=>{ const b=new THREE.Bone(); b.name=k; b.position.set(B[k][0],B[k][1],B[k][2]); parent.add(b); return b; };
  const root=mk('root',skin), aL=mk('armL',root), aR=mk('armR',root), lL=mk('legL',root), lR=mk('legR',root);   // order matches the baked skinIndex: 0 root, 1 armL, 2 armR, 3 legL, 4 legR
  skin.bind(new THREE.Skeleton([root,aL,aR,lL,lR]));
  grp.userData.arms.push(aL,aR); grp.userData.legs.push(lL,lR);
  const head=new THREE.Group(); head.position.set(0,.45*s,.05*s); body.add(head); grp.userData.head=head;   // empty head anchor (model centre of the skull) — no gripL/gripR, the sculpt already holds its daggers
  return grp; }
