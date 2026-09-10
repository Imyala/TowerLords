// ============================================================ SCULPTED 3D ENEMY MODELS (Imyala)
// The goblin and ratman families use real sculpts instead of primitive rigs. Each model is one of
// L's Meshy sculpts (~3M triangles) run through Imyala's asset pipeline (tools/model-pipeline): quadric
// decimation to 5k triangles, box-projection UV charts packed into one 1024 atlas, colours re-baked from
// the original texture, and a five-bone region rig (root / armL / armR / legL / legR) so the engine's
// walk-swing still drives it. Each model's geometry + atlas lives in its own
// <script id="imyala-model-<id>" type="application/json"> data block after the game script (kept out of
// the main script so tests/extract.js still sees one clean program) and is decoded lazily on first use.
// Engine contract kept: root Group with userData.body (a Mesh whose material takes the hit-flash /
// telegraph emissiveIntensity, whose rotation.y is the heading, whose position.y is the rest height),
// userData.humanoid, userData.arms / userData.legs (rotation.x = swing). Feet sit at y=0 like every rig.
const MODEL3D = { author:'Imyala', cache:{}, anchor:null };
function model3dLoad(id){ const c=MODEL3D.cache; if(c[id]!==undefined) return c[id]; c[id]=null;
  const el=(typeof document!=='undefined')&&document.getElementById('imyala-model-'+id); if(!el) return null;
  try{ const D=JSON.parse(el.textContent); const h=D.h, nv=h.nv, nf=h.nf; const b64=atob(D.geo); const bin=new Uint8Array(b64.length); for(let i=0;i<b64.length;i++) bin[i]=b64.charCodeAt(i); const buf=bin.buffer; let o=0;
    const p16=new Uint16Array(buf,o,nv*3); o+=nv*6; const uv16=new Uint16Array(buf,o,nv*2); o+=nv*4; const idx=new Uint16Array(buf,o,nf*3); o+=nf*6;   // 2-byte arrays first (alignment)
    const nrm=new Int8Array(buf,o,nv*3); o+=nv*3; const limb=new Uint8Array(buf,o,nv); o+=nv; const limbW=new Uint8Array(buf,o,nv); o+=nv;
    const pos=new Float32Array(nv*3); for(let i=0;i<nv;i++) for(let k=0;k<3;k++) pos[i*3+k]=h.min[k]+p16[i*3+k]*h.scale[k];   // de-quantise into model units (feet at y=-.95, faces +Z)
    const si=new Uint8Array(nv*4), sw=new Uint8Array(nv*4); for(let i=0;i<nv;i++){ si[i*4]=limb[i]; sw[i*4]=limbW[i]; si[i*4+1]=0; sw[i*4+1]=255-limbW[i]; }   // one limb bone + the root takes the rest
    const geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
    geo.setAttribute('normal',new THREE.BufferAttribute(new Int8Array(nrm),3,true));
    geo.setAttribute('uv',new THREE.BufferAttribute(new Uint16Array(uv16),2,true));
    geo.setAttribute('skinIndex',new THREE.BufferAttribute(si,4));
    geo.setAttribute('skinWeight',new THREE.BufferAttribute(sw,4,true));
    geo.setIndex(new THREE.BufferAttribute(new Uint16Array(idx),1)); geo.computeBoundingSphere(); geo.computeBoundingBox();
    const tex=new THREE.TextureLoader().load(D.tex); tex.colorSpace=THREE.SRGBColorSpace; tex.anisotropy=4; tex.flipY=true;
    if(!MODEL3D.anchor){ const an=new THREE.BufferGeometry(); an.setAttribute('position',new THREE.BufferAttribute(new Float32Array(9),3)); an.setAttribute('normal',new THREE.BufferAttribute(new Float32Array([0,1,0,0,1,0,0,1,0]),3)); an.setIndex([0,1,2]); MODEL3D.anchor=an; }   // a zero-area triangle: the body Mesh the engine drives, invisible, but a real geometry so crGrade can walk it
    c[id]={geo,tex,bones:h.bones}; return c[id]; }
  catch(err){ console.warn('3D model "'+id+'" failed to decode — falling back to the primitive rig',err); return null; } }
// Build one instance. s = the rig scale the family builder was given; opts.size = per-role size multiplier.
function makeModel3D(id,s,opts){ const M=model3dLoad(id); if(!M) return null; opts=opts||{}; const k=(s||1)*(opts.size||1);
  const grp=new THREE.Group(); grp.userData.humanoid=true; grp.userData.arms=[]; grp.userData.legs=[]; grp.userData.model3d=id; grp.userData.author=MODEL3D.author;
  const mat=new THREE.MeshStandardMaterial({map:M.tex, emissiveMap:M.tex, emissive:0xffffff, emissiveIntensity:.08, roughness:.85, metalness:0});
  mat.userData.kind='skin'; mat.userData.noDetail=true;   // kind:'skin' lets crGrade roll the per-creature lightness so a pack isn't clones; noDetail: it has its own texture
  const body=new THREE.Mesh(MODEL3D.anchor, mat); body.frustumCulled=false; body.position.y=.95*k; body.userData.apRounded=true; grp.add(body); grp.userData.body=body;
  const skin=new THREE.SkinnedMesh(M.geo, mat); skin.scale.setScalar(k); skin.castShadow=true; skin.frustumCulled=false; skin.userData.apRounded=true; body.add(skin);
  const B=M.bones; const mk=(name,parent)=>{ const b=new THREE.Bone(); b.name=name; const p=B[name]||[0,0,0]; b.position.set(p[0],p[1],p[2]); parent.add(b); return b; };
  const root=mk('root',skin), aL=mk('armL',root), aR=mk('armR',root), lL=mk('legL',root), lR=mk('legR',root);   // order matches the baked limb ids: 0 root, 1 armL, 2 armR, 3 legL, 4 legR
  skin.bind(new THREE.Skeleton([root,aL,aR,lL,lR]));
  if(B.armL&&B.armR) grp.userData.arms.push(aL,aR);   // models whose arms hold a two-handed bow / planted spear register no arm swing
  if(B.legL&&B.legR) grp.userData.legs.push(lL,lR);   // robed models register no leg swing
  const head=new THREE.Group(); head.position.set(0,.45*k,.05*k); body.add(head); grp.userData.head=head;   // empty head anchor — no gripL/gripR, the sculpts already hold their weapons
  return grp; }
// The ten goblin roles → sculpts, with the size each role had as a primitive rig (clubber is the wall of muscle).
const GOBLIN_MODEL_SIZE = { scout:1, shaman:1, archer:1, poisoner:1, trapper:1, bomber:1, berserker:1.1, spearguard:1.1, commander:1.15, clubber:1.35 };
function makeGoblinModel3D(v,s){ if(!(v in GOBLIN_MODEL_SIZE)) return null; return makeModel3D('goblin-'+v, s, {size:GOBLIN_MODEL_SIZE[v]}); }
// The ratman sheet → sculpts (no burrower sculpt yet — that role keeps its primitive rig); brute and warblade are the big ones.
const RATMAN_MODEL_SIZE = { scout:.95, skirmisher:1, slinger:1, poisoner:1, shaman:1, assassin:1, packleader:1.1, brute:1.3, warblade:1.3 };
function makeRatmanModel3D(v,s){ if(!(v in RATMAN_MODEL_SIZE)) return null; return makeModel3D('ratman-'+v, s, {size:RATMAN_MODEL_SIZE[v]}); }
