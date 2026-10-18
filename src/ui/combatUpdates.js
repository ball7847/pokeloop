// Update only the numbers and progress bar fills during combat ticks.
// Keep the tab/sidebar/log button nodes mounted so pointer interactions can complete.
const pct=(current,max)=>Number.isFinite(current)&&Number.isFinite(max)&&max>0
  ?Math.min(100,Math.max(0,current/max*100)):0;
const text=n=>Number.isFinite(n)?Number(n.toFixed(2)).toLocaleString('en-US',{maximumFractionDigits:2}):'—';
function setHealth(root,selector,hp){
  const node=root.querySelector(selector);
  if(!node)return;
  const label=node.querySelector('.combat-unit-line span, .battle-health-caption span');
  if(label)label.textContent=hp?text(hp.current)+' / '+text(hp.max):'— / —';
  const bar=node.querySelector('[role="progressbar"]');
  if(bar){
    const value=pct(hp?.current,hp?.max);
    bar.setAttribute('aria-valuenow',String(Number(value.toFixed(1))));
    const fill=bar.querySelector('.combat-health-fill, .battle-health-fill');
    if(fill)fill.style.width=value.toFixed(2)+'%';
  }
}
function setCooldown(root,selector,cooldown){
  const node=root.querySelector(selector);
  if(!node)return;
  const bar=node.querySelector('[role="progressbar"]');
  if(!bar)return;
  const value=pct(cooldown?.elapsed,cooldown?.duration);
  bar.setAttribute('aria-valuenow',String(Number(value.toFixed(1))));
  const fill=bar.querySelector('.battle-cooldown-fill');
  if(fill)fill.style.width=value.toFixed(2)+'%';
}
export function updateCombatDisplay(root,combat){
  if(!combat?.active || !combat.enemy)return;
  setHealth(root,'.mini-combat .combat-unit.enemy',combat.enemy.hp);
  setHealth(root,'.mini-combat .combat-unit.ditto',combat.dittoHp);
  setHealth(root,'.ditto-battle-region .battle-health.enemy',combat.enemy.hp);
  setHealth(root,'.ditto-battle-region .battle-health.ditto',combat.dittoHp);
  setCooldown(root,'.ditto-battle-region .battle-cooldown.enemy',combat.enemy.attackCooldown);
  setCooldown(root,'.ditto-battle-region .battle-cooldown.ditto',combat.dittoAttackCooldown);
}
