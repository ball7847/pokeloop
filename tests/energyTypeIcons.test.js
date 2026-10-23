import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createServer} from 'vite';
import {TYPES} from '../src/core/energySystem.js';

test('all 18 type icons are vendored SVG with the original MIT notice',async()=>{
 const vite=await createServer({server:{middlewareMode:true},appType:'custom'});
 try{
   const {TYPE_ICON_FILES,typeIconUrl,EnergyTypeIcon}=await vite.ssrLoadModule('/src/components/EnergyTypeIcon.jsx');
   assert.deepEqual(Object.keys(TYPE_ICON_FILES),TYPES);
   for(const type of TYPES){
     const file=TYPE_ICON_FILES[type];
     const path=new URL('../public/assets/types/'+file+'.svg',import.meta.url);
     assert.equal(existsSync(path),true,type);
     assert.match(readFileSync(path,'utf8'),/<svg\b/);
     assert.match(typeIconUrl(type),new RegExp('/pokeloop/assets/types/'+file+'\\.svg$'));
     const html=renderToStaticMarkup(React.createElement(EnergyTypeIcon,{type}));
     assert.match(html,/<img/);
     assert.match(html,/alt=""/);
   }
   assert.match(readFileSync(new URL('../public/assets/types/LICENSE',import.meta.url),'utf8'),/MIT License/);
 }finally{await vite.close();}
});
test('type icons appear alongside energy labels without changing displayed reward text',async()=>{
 const vite=await createServer({server:{middlewareMode:true},appType:'custom'});
 try{
   const {WildPage}=await vite.ssrLoadModule('/src/pages/WildPage.jsx');
   const wild=renderToStaticMarkup(React.createElement(WildPage));
   assert.match(wild,/assets\/types\/normal\.svg/);
   assert.match(wild,/assets\/types\/flying\.svg/);
   assert.match(wild,/노말 에너지 \+1/);
   const {EnergyPage}=await vite.ssrLoadModule('/src/pages/EnergyPage.jsx');
   const energy=renderToStaticMarkup(React.createElement(EnergyPage));
   assert.match(energy,/assets\/types\/normal\.svg/);
   assert.match(energy,/노말 에너지/);
   const {renderLogMessage}=await vite.ssrLoadModule('/src/components/LogPanel.jsx');
   const message='구구 1회 처치 · HP +1, 노말 에너지 +2, 비행 에너지 +2';
   const html=renderToStaticMarkup(React.createElement(React.Fragment,null,...renderLogMessage(message)));
   assert.match(html,/assets\/types\/normal\.svg/);
   assert.match(html,/assets\/types\/flying\.svg/);
   assert.match(html,/노말 에너지 \+2/);
   assert.match(html,/비행 에너지 \+2/);
   assert.doesNotMatch(html,/undefined/);
 }finally{await vite.close();}
});
