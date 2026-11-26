import {ALL_POKEMON,getKillLimit,ENCOUNTER_SLOTS} from './wildData.js';
import {TYPES,typeLayer,particleMilestoneThreshold} from './energySystem.js';
import {compareAmount} from './bigNumber.js';

// Repair only facts supported by the save itself. Historical kill caps and
// earned milestones may differ from current balance; never discard those.
export function reconcileSaveProgress(game){
 const discovered=new Set(game.dexDiscovered);
 for(const p of ALL_POKEMON){
  const count=game.killCounts[p.id]??0;
  if(count>0){
   game.dexLifetimeKills[p.id]=Math.max(count,game.dexLifetimeKills[p.id]??0);
   if(p.evolvesFrom)game.evolutionResults[p.id]=true;
  }
  if((game.dexLifetimeKills[p.id]??0)>0)discovered.add(p.id);
 }
 game.dexDiscovered=[...discovered];
 // A recorded victory is proof of encounter even when an old slot was absent.
 // Do not replace a conflicting selection or fabricate parent victories.
 if(game.raritySlotResults!==null){
  for(const slot of ENCOUNTER_SLOTS){
   const killed=slot.candidates.filter(id=>(game.killCounts[id]??0)>0);
   if(killed.length===1&&game.raritySlotResults[slot.id]===null)
    game.raritySlotResults[slot.id]=killed[0];
  }
  game.uncommonStarterId=game.raritySlotResults.W010802??null;
  game.berryRareAppeared=game.raritySlotResults.W020502==='pikachu';
 }
 for(const type of TYPES){
  // Old saves could hold currencies for types subsequently locked. Keep
  // balances dormant; economy and shop already gate on unlockedLayer.
  if(compareAmount(game.particleEarned[type],game.particleBalances[type])<0)
   game.particleEarned[type]=game.particleBalances[type];
  if(typeLayer(type)>game.unlockedLayer)continue;
  let level=game.particleMilestones[type];
  while(level<10&&compareAmount(game.particleEarned[type],particleMilestoneThreshold(level))>=0)level++;
  game.particleMilestones[type]=level;
 }
 if(game.particleMilestones['노말']>=1)game.normalFirstMilestonePermanent=true;
 if(game.normalFirstMilestonePermanent)game.particleMilestones['노말']=Math.max(1,game.particleMilestones['노말']);
 if(compareAmount(game.totalStellarEarned,game.stellar)<0)game.totalStellarEarned=game.stellar;
 return game;
}

// These are diagnostics, not grounds for deleting valid historical progress.
export function saveProgressIssues(game){
 const issues=[];
 for(const p of ALL_POKEMON){
  const count=game.killCounts[p.id]??0;
  if(count>getKillLimit(p))issues.push('historical-kill-cap:'+p.id);
  if(p.evolvesFrom&&Object.hasOwn(game.evolutionResults,p.id)&&!(game.killCounts[p.evolvesFrom]>0))
   issues.push('evolution-parent:'+p.id);
 }
 for(const slot of ENCOUNTER_SLOTS){
  if(game.raritySlotResults===null)continue;
  for(const id of slot.candidates){
   if(game.killCounts[id]>0&&game.raritySlotResults[slot.id]!==id)issues.push('slot-conflict:'+id);
  }
 }
 for(const type of TYPES){
  if(typeLayer(type)>game.unlockedLayer&&(compareAmount(game.energyBalances[type],0)>0||
   compareAmount(game.particleBalances[type],0)>0||compareAmount(game.particleEarned[type],0)>0||game.particleMilestones[type]>0))
   issues.push('locked-currency:'+type);
  const level=game.particleMilestones[type];
  if(level>0&&!(type==='노말'&&level===1&&game.normalFirstMilestonePermanent)&&
   compareAmount(game.particleEarned[type],particleMilestoneThreshold(level-1))<0)
   issues.push('historical-milestone:'+type);
 }
 return issues;
}
