import React from 'react';
import {useShallow} from 'zustand/react/shallow';
import {createPortal} from 'react-dom';
import {useGameStore} from '../../store/useGameStore.js';
import {LAYERS} from '../../core/energySystem.js';
import {formatAmount,compareAmount} from '../../core/bigNumber.js';
import {STELLAR_UPGRADES,stellarUpgradeLevel,stellarUpgradeCost,stellarUpgradeMaxed} from '../../core/stellarUpgrades.js';

const SU_TYPE_PALETTE=Object.freeze({
  '노말':['#efefec','#b6b6a8','#66665b'],'풀':['#e6f6dd','#78c850','#386b21'],
  '불꽃':['#ffecdc','#f08030','#9d3e09'],'물':['#e2edff','#6890f0','#234cba'],
  '전기':['#fff7d5','#f8d030','#927507'],'벌레':['#f1f5d5','#a8b820','#58640b'],
  '비행':['#f0edff','#a890f0','#5640ac'],'땅':['#faf0cc','#e0c068','#8e7130'],
  '바위':['#efead1','#b8a038','#61501a'],'격투':['#ffe1dd','#c03028','#741912'],
  '에스퍼':['#ffe3ef','#f85888','#a61a4a'],'악':['#eee9e7','#705848','#382820'],
  '강철':['#eeeff8','#b8b8d0','#545775'],'독':['#f4e4f9','#a040a0','#5e196d'],
  '얼음':['#e3f8f8','#98d8d8','#377e82'],'고스트':['#eae4f3','#705898','#372354'],
  '드래곤':['#e8e0ff','#7038f8','#3712a3'],'페어리':['#ffeaf0','#ee99ac','#9b4269']
});
export function stellarTypeColors(type){
  const [empty,node,purchased]=SU_TYPE_PALETTE[type]??SU_TYPE_PALETTE['노말'];
  return {'--su-empty':empty,'--su-node':node,'--su-purchased':purchased};
}

const OUTER_LAYERS=LAYERS.map(layer=>({...layer,types:layer.level===2?['풀','불꽃','물']:layer.types}));
const STELLAR_NODES=STELLAR_UPGRADES;
export function stellarUpgradeRows(nodes=STELLAR_NODES){
  let row=0;
  return OUTER_LAYERS.map(layer=>({...layer,rows:layer.types.map(type=>{
    row++;
    const slots=Array.from({length:row%2?14:13},(_,slot)=>{
      const node=nodes[type]?.[slot]??null;
      return {slot,node,id:node?.id??null};
    });
    return {type,row,slots};
  })}));
}
const HEX_R=24,HEX_W=Math.sqrt(3)*HEX_R,HEX_STEP=1.5*HEX_R;
const HEX_POINTS=Array.from({length:6},(_,i)=>{
  const angle=(60*i-90)*Math.PI/180;
  return [Math.cos(angle)*HEX_R,Math.sin(angle)*HEX_R].join(',');
}).join(' ');
function stellarNodeLabelLines(name){
  // Keep longer names legible inside a 42px-wide hexagon.
  return name.replace('노말에너지','노말 에너지').replace('증폭 I','증폭I').split(' ');
}
export function OuterStellarWorld(){
  const [selected,setSelected]=React.useState(null);
  const closeButtonRef=React.useRef(null);
  const previouslyFocusedRef=React.useRef(null);
  const openUpgrade=(id,event)=>{
    previouslyFocusedRef.current=event.currentTarget;
    setSelected(id);
  };
  const closeUpgrade=()=>{
    setSelected(null);
    previouslyFocusedRef.current?.focus();
  };
  React.useEffect(()=>{
    if(!selected)return;
    closeButtonRef.current?.focus();
    const onEscape=event=>{if(event.key==='Escape'){event.preventDefault();setSelected(null);previouslyFocusedRef.current?.focus();}};
    document.addEventListener('keydown',onEscape);
    return ()=>document.removeEventListener('keydown',onEscape);
  },[selected]);
  // The stellar grid only depends on permanent upgrades, SE and running state.
  const game=useGameStore(useShallow(state=>({
    permanentUpgrades:state.game.permanentUpgrades,
    stellar:state.game.stellar,
    phase:state.game.phase
  })));
  const dispatch=useGameStore(state=>state.dispatch);
  const layers=stellarUpgradeRows();
  const nodes=layers.flatMap(layer=>layer.rows.flatMap(row=>row.slots.filter(slot=>slot.node)));
  const detail=nodes.find(slot=>slot.id===selected)?.node??null;
  const currentLevel=detail?stellarUpgradeLevel(game,selected):0;
  const nextCost=detail?stellarUpgradeCost(game,selected):null;
  const maxed=detail?stellarUpgradeMaxed(game,selected):false;
  const effectText=detail?.id==='SU012'?(currentLevel?`HP +${10*2**(currentLevel-1)}, 공격 +${2**(currentLevel-1)}`:'HP +10, 공격 +1'):
    detail?.id==='SU011'?`전투 노말에너지 +${currentLevel*10}%`:
    detail?.id==='SU013'?`안흔한 등장 확률 +${currentLevel}%p`:
    detail?.id==='SU014'?`HP +${currentLevel*10}%`:
    detail?.id==='SU015'?`공격 +${currentLevel*8}%`:'';
  return <section className="panel energy-outer-panel" role="tabpanel" aria-label="외체계">
    <div className="energy-outer-scroll" role="region" aria-label="외체계 육각형 강화 격자" tabIndex={0}>
      <svg className="energy-outer-honeycomb" viewBox="0 0 800 730" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="10계층 18타입 243개 육각형 슬롯">
        {layers.map(layer=><g key={layer.level}>
          <text x="6" y={34+((layer.rows[0].row+layer.rows[layer.rows.length-1].row)/2-1)*HEX_STEP+4} className="energy-outer-layer-label">{layer.level}계층</text>
          {layer.rows.map(({type,row,slots})=><g key={type} style={stellarTypeColors(type)}>
            <text x="76" y={34+(row-1)*HEX_STEP+4} className="energy-outer-type-text">{type}</text>
            {slots.map(({slot,node,id})=><g key={slot} transform={`translate(${164+(slot+(row%2===0?.5:0))*HEX_W},${34+(row-1)*HEX_STEP})`}>
              <polygon points={HEX_POINTS} className={node?'energy-outer-hex is-node'+(stellarUpgradeLevel(game,id)>0?' is-purchased':'')+(selected===id?' is-selected':''):'energy-outer-hex is-empty'}/>
              {node&&<>
                <text textAnchor="middle" className={"energy-outer-node-name"+(stellarUpgradeLevel(game,id)>0?" is-purchased":"")}>
                  {stellarNodeLabelLines(node.name).map((line,lineIndex,lines)=>
                    <tspan key={lineIndex} x="0" y={(lineIndex-(lines.length-1)/2)*9+2}>{line}</tspan>)}
                </text>
                <rect x={-HEX_W/2} y={-HEX_R} width={HEX_W} height={HEX_R*2} fill="transparent"
                  role="button" tabIndex="0" aria-label={id+' '+node.name}
                  onClick={event=>openUpgrade(id,event)} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();openUpgrade(id,event);}}}
                  className="energy-outer-node-hitbox"/>
              </>}
            </g>)}
          </g>)}
        </g>)}
      </svg>
    </div>
    {detail&&createPortal(<div className="energy-su-modal-backdrop" onClick={event=>{if(event.target===event.currentTarget)closeUpgrade();}}>
      <section className="energy-su-modal" role="dialog" aria-modal="true" aria-labelledby="energy-su-modal-title" aria-describedby="energy-su-modal-effect">
        <button ref={closeButtonRef} type="button" className="energy-su-modal-close" aria-label="닫기" onClick={closeUpgrade}>×</button>
        <small className="energy-su-modal-id">{selected}</small>
        <h3 id="energy-su-modal-title">{detail.name}</h3>
        <div className="energy-su-modal-field"><span>업그레이드 비용</span><strong>{maxed?'최대 레벨':`SE ${formatAmount(nextCost)}`}</strong></div>
        <div className="energy-su-modal-field"><span>업그레이드 효과</span><strong id="energy-su-modal-effect">{detail.description} · 현재 {effectText}</strong></div>
        <small>보유 SE {formatAmount(game.stellar??0)} · 레벨 {currentLevel}/{detail.maxLevel} · {detail.levelCosts?'레벨별 고정 비용 1 / 300 / 1,000 SE':`비용 레벨당 ×${detail.costGrowth}`}</small>
        <button type="button" className="energy-su-modal-buy"
          disabled={maxed||nextCost===null||compareAmount(game.stellar??0,nextCost)<0||game.phase!=='running'}
          onClick={()=>dispatch({type:'BUY_STELLAR_UPGRADE',id:selected})}>
          {maxed?'최대 레벨':'SE '+formatAmount(nextCost)+' 구매'}
        </button>
      </section>
    </div>,document.body)}
  </section>;
}

