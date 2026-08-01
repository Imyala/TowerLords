// Pull the inline game script out of towerlords.html so node can load it.
const fs=require('fs'), path=require('path');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'towerlords.html'),'utf8');
const blocks=[...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
let js=blocks.reduce((a,b)=>b.length>a.length?b:a,'');
js=js.replace(/^\s*import[^\n;]*;?\s*$/gm,'');   // ES-module imports; THREE is stubbed by the harness
fs.mkdirSync(path.join(__dirname,'.build'),{recursive:true});
fs.writeFileSync(path.join(__dirname,'.build','towerlords.js'), js);
console.log('extracted '+js.length+' chars -> tests/.build/towerlords.js');
