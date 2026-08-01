// Shared stub environment: runs the real TowerLords script with no browser, no WebGL, no three.js.
const fs=require('fs'), vm=require('vm');

function deep(name){
  const f=function(){ return deep(name); };
  return new Proxy(f,{
    get(t,k){
      if(k===Symbol.toPrimitive) return ()=>0;
      if(k==='toString') return ()=>name;
      if(k===Symbol.iterator) return function*(){};
      if(k==='then'||k==='constructor') return undefined;
      if(k==='length') return 0;
      if(k==='nodeType') return 1;
      if(typeof k==='symbol') return undefined;
      if(!(k in t)) t[k]=deep(name+'.'+String(k));
      return t[k];
    },
    set(t,k,v){ t[k]=v; return true; },
    apply(){ return deep(name+'()'); },
    construct(){ return deep('new '+name); },
    has(){ return true; },
  });
}

function mkList(){ const a=[]; return a; }
// reparenting: appendChild/insertBefore must pull a node out of its previous parent, exactly as the
// real DOM does — otherwise a node that gets moved appears in both places and tests read nonsense
function detach(n){ const p=n&&n.parentNode; if(p&&p.children){ const i=p.children.indexOf(n); if(i>=0) p.children.splice(i,1); } }
function mkEl(id){
  const el={
    id:id||'', tagName:'DIV', textContent:'', value:'', title:'', disabled:false, draggable:false,
    dataset:{}, children:[], parentNode:null, _cls:new Set(['hidden']), _item:null,
    offsetWidth:100, offsetHeight:100, offsetParent:{}, scrollTop:0, scrollHeight:0, clientWidth:100, clientHeight:100,
  };
  let _html='';
  Object.defineProperty(el,'innerHTML',{ get:()=>_html, set:v=>{ _html=String(v); el.children.length=0; }, enumerable:true, configurable:true });
  // className has to write through to the class set, or `el.className='panelBody'` is invisible to
  // classList.contains() and every class-based assertion quietly reads the wrong thing
  Object.defineProperty(el,'className',{ get:()=>[...el._cls].join(' '),
    set:v=>{ el._cls=new Set(String(v).split(/\s+/).filter(Boolean)); }, enumerable:true, configurable:true });
  el.style=new Proxy({},{ get:(t,k)=>(k==='setProperty'||k==='removeProperty')?(()=>{}):(t[k]===undefined?'':t[k]), set:(t,k,v)=>{t[k]=v;return true;} });
  el.classList={
    add:(...c)=>c.forEach(x=>el._cls.add(x)),
    remove:(...c)=>c.forEach(x=>el._cls.delete(x)),
    toggle:(c,f)=>{ const on = f===undefined ? !el._cls.has(c) : !!f; on?el._cls.add(c):el._cls.delete(c); return on; },
    contains:c=>el._cls.has(c),
  };
  el.appendChild=n=>{ detach(n); el.children.push(n); if(n) n.parentNode=el; return n; };
  el.prepend=n=>{ detach(n); el.children.unshift(n); if(n) n.parentNode=el; return n; };
  el.removeChild=n=>{ detach(n); if(n) n.parentNode=null; return n; };
  el.remove=()=>detach(el);
  el.insertBefore=(n,ref)=>{ detach(n);
    const i=el.children.indexOf(ref); if(i<0) el.children.push(n); else el.children.splice(i,0,n);
    if(n) n.parentNode=el; return n; };
  el.cloneNode=()=>mkEl();
  el.querySelector=()=>mkEl(); el.querySelectorAll=()=>mkList();
  el.addEventListener=()=>{}; el.removeEventListener=()=>{}; el.closest=()=>null;
  el.getBoundingClientRect=()=>({left:0,top:0,right:100,bottom:100,width:100,height:100});
  el.focus=()=>{}; el.blur=()=>{}; el.setAttribute=()=>{}; el.getAttribute=()=>null; el.hasAttribute=()=>false;
  el.getContext=()=>deep('ctx2d');
  return el;
}

function load(file){
  const elCache=new Map();
  const byId=id=>{ if(!elCache.has(id)) elCache.set(id, mkEl(id)); return elCache.get(id); };
  const document={
    getElementById:byId, createElement:()=>mkEl(), createElementNS:()=>mkEl(),
    querySelector:()=>mkEl(), querySelectorAll:()=>mkList(),
    addEventListener:()=>{}, removeEventListener:()=>{},
    body:mkEl('body'), head:mkEl('head'), documentElement:mkEl('html'),
    activeElement:mkEl(), hidden:false, exitPointerLock:()=>{},
  };
  const store=new Map();
  const localStorage={ getItem:k=>store.has(k)?store.get(k):null, setItem:(k,v)=>store.set(k,String(v)), removeItem:k=>store.delete(k), clear:()=>store.clear() };
  const sandbox={
    console, Math, JSON, Date, Object, Array, String, Number, Boolean, Error, Set, Map, WeakMap, Proxy, Reflect,
    Symbol, RegExp, Promise, parseInt, parseFloat, isNaN, isFinite, encodeURIComponent, decodeURIComponent,
    setTimeout:()=>0, clearTimeout:()=>{}, setInterval:()=>0, clearInterval:()=>{},
    requestAnimationFrame:()=>0, cancelAnimationFrame:()=>{},
    document, localStorage, sessionStorage:localStorage,
    performance:{now:()=>Date.now()},
    navigator:{userAgent:'node', maxTouchPoints:0, getGamepads:()=>[], clipboard:{writeText:()=>Promise.resolve()}, language:'en'},
    location:{href:'file:///towerlords.html', search:'', hash:'', protocol:'file:'},
    innerWidth:1600, innerHeight:900, devicePixelRatio:1,
    addEventListener:()=>{}, removeEventListener:()=>{},
    matchMedia:()=>({matches:false, addEventListener:()=>{}, addListener:()=>{}}),
    alert:()=>{}, confirm:()=>true, prompt:()=>null,
    THREE:deep('THREE'),
    AudioContext:function(){ return deep('actx'); }, webkitAudioContext:function(){ return deep('actx'); },
    RTCPeerConnection:function(){ return deep('rtc'); },
    fetch:()=>Promise.reject(new Error('no network in harness')),
    atob:x=>x, btoa:x=>x, structuredClone:x=>JSON.parse(JSON.stringify(x)),
    TextEncoder:function(){ return {encode:()=>new Uint8Array()}; },
    Uint8Array, Float32Array, Int32Array, Uint32Array, Uint16Array,
  };
  sandbox.window=sandbox; sandbox.globalThis=sandbox; sandbox.self=sandbox; sandbox.top=sandbox;
  const src=fs.readFileSync(file,'utf8');
  const ctx=vm.createContext(sandbox);
  let loadErr=null;
  try{ vm.runInContext(src, ctx, {filename:'towerlords.js'}); }catch(e){ loadErr=e; }
  return {ctx, src, loadErr, sandbox};
}

module.exports={load, deep, mkEl};
