import {readFileSync} from 'node:fs';
// Expand CSS imports for source-level regression tests (Vite does this for browser builds).
export function readStyles(){
 const original=readFileSync(new URL('../src/style.css',import.meta.url),'utf8');
 return original.replace(/@import "\.\/styles\/([^"]+)";/g,(_,file)=>
   readFileSync(new URL('../src/styles/'+file,import.meta.url),'utf8'));
}
