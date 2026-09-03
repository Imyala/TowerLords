// Rebuild towerlords-offline.html from the current towerlords.html by swapping the
// Three.js CDN importmap for the base64 data:-URL importmap already inlined in the
// existing offline file. Result = latest main game code + self-contained Three.js.
const fs = require('fs');
const DIR = process.env.TL_DIR || require('path').join(__dirname,'..');   // repo-relative by default; override with TL_DIR
const main = fs.readFileSync(DIR + '/towerlords.html', 'utf8');
const off  = fs.readFileSync(DIR + '/towerlords-offline.html', 'utf8');

const reMap = /<script type="importmap">\s*([\s\S]*?)\s*<\/script>/;
const offMatch = off.match(reMap);
const mainMatch = main.match(reMap);
if (!offMatch) throw new Error('no importmap in offline file');
if (!mainMatch) throw new Error('no importmap in main file');

const offMap = offMatch[1].trim();
if (!/data:text\/javascript;base64,/.test(offMap)) throw new Error('offline importmap is not a base64 data URL');
if (!/cdn\.jsdelivr\.net|unpkg|esm\.sh|https?:\/\//.test(mainMatch[1])) {
  console.warn('WARNING: main importmap does not look like a remote URL:', mainMatch[1].slice(0,120));
}

let out = main.replace(reMap, '<script type="importmap">\n' + offMap + '\n</script>');

// The two builds give different boot-failure advice, and copying the desktop
// wording wholesale tells an offline player to "open towerlords-offline.html
// instead" — which is the file they already have open. Carry the offline
// wording across every rebuild instead of hand-fixing it afterwards.
const reBootMsg = /('<br><br>Reload to try again\.[\s\S]*?<\/div>';)/;
const offBoot = off.match(reBootMsg);
const outBoot = out.match(reBootMsg);
if (!offBoot) throw new Error('offline build has no boot-failure message to preserve');
if (!outBoot) throw new Error('main build has no boot-failure message to replace');
if (offBoot[1] !== outBoot[1]) {
  out = out.replace(reBootMsg, () => offBoot[1]);
  console.log('kept the offline build\'s own boot-failure wording');
}
if (/towerlords-offline\.html<\/b> instead/.test(out.match(reBootMsg)[1]))
  throw new Error('offline build still tells the player to open the offline build');

// sanity: out must contain the data URL and NOT the cdn url inside the importmap
const outMap = out.match(reMap)[1];
if (!/data:text\/javascript;base64,/.test(outMap)) throw new Error('rebuild failed: data URL not present');
if (/cdn\.jsdelivr\.net/.test(outMap)) throw new Error('rebuild failed: cdn url still present in importmap');

fs.writeFileSync(DIR + '/towerlords-offline.html', out, 'utf8');
console.log('OK — offline rebuilt.');
console.log('main size   :', main.length);
console.log('offline size:', out.length, '(+inlined three.js)');
