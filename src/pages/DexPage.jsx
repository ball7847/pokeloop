import React,{useCallback,useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {useGameStore} from '../store/useGameStore.js';
import {ALL_POKEMON,REGIONS,regionForPokemon,spriteUrl,battleEnergyRewards} from '../core/wildData.js';
import {BASIC_STAT_FIELDS,BASIC_STAT_KEYS,formatStatValue} from '../core/dittoStats.js';
import {formatAmount} from '../core/bigNumber.js';
import {EnergyTypeIcon} from '../components/EnergyTypeIcon.jsx';
import {ITEMS} from '../core/itemSystem.js';

const POKEMON=Object.freeze([...ALL_POKEMON].sort((a,b)=>a.number-b.number||a.id.localeCompare(b.id)));
const STAT_DETAILS=Object.freeze({
  hp:'전투 시작 시 최대 HP를 결정합니다. HP가 0 이하가 되면 패배합니다. 현재 HP는 연속 전투에서 이월될 수 있습니다.',
  attack:'물리 피해 계산에 사용됩니다. 상대의 방어가 피해를 감소시키며 최소·최대 피해량 배율의 영향을 받습니다.',
  defense:'상대 물리 공격의 피해를 감소시킵니다. 특수 공격에는 특수방어가 적용됩니다.',
  specialAttack:'특수 피해 계산에 사용됩니다. 물리 공격과 별도 피해 경로로 계산됩니다.',
  specialDefense:'상대 특수 공격의 피해를 감소시킵니다.',
  speed:'공격 간격을 밀리초(ms)로 표시합니다. 수치가 작을수록 빠릅니다. 마비에 의해 다음 공격이 지연될 수 있습니다.',
  accuracy:'명중률(%)입니다. 100% 초과분은 상대 회피의 효과를 감소시킵니다.',
  dodge:'상대 공격이 명중하지 않을 확률에 영향을 줍니다. 상대 명중에 의해 감소할 수 있습니다.',
  minDamagePercent:'한 번의 공격 피해에 적용되는 무작위 배율의 최솟값(%)입니다.',
  maxDamagePercent:'한 번의 공격 피해에 적용되는 무작위 배율의 최댓값(%)입니다.',
  paralysis:'공격 적중 시 상대에게 누적되는 마비입니다. 공격 시 25% 확률로 누적 마비가 소모되어 다음 공격 간격이 증가합니다.',
  poison:'공격 적중 시 상대에게 누적되는 독입니다. 누적 독은 매초 피해를 줍니다.',
  antidote:'1초마다 독 피해를 적용하기 전에 자신의 누적 독을 해독 수치만큼 줄입니다.',
  regeneration:'1초마다 HP를 회복합니다. 최대 HP를 넘길 수 없습니다.',
  multiStrike:'공격할 때 연타 수치 1당 0.1% 확률로 즉시 추가 타격합니다. 1000마다 확정 추가 타격이 발생합니다.'
});
const dexKills=(game,id)=>Math.max(game.dexLifetimeKills?.[id]??0,game.killCounts?.[id]??0);
const isKnown=(game,id)=>game.dexDiscovered?.includes(id)||dexKills(game,id)>0;
const stage=(game,id)=>dexKills(game,id)>0?'defeated':isKnown(game,id)?'found':'unknown';
const stageName={unknown:'미발견',found:'발견',defeated:'처치 완료'};
function DexDialog({pokemon,game,onClose}){
  const closeRef=useRef(null);
  useEffect(()=>{
    const previous=document.activeElement;
    closeRef.current?.focus();
    const escape=event=>{if(event.key==='Escape'){event.preventDefault();onClose();}};
    document.addEventListener('keydown',escape);
    return ()=>{document.removeEventListener('keydown',escape);previous?.focus?.();};
  },[onClose]);
  const defeated=dexKills(game,pokemon.id)>0;
  const discovered=isKnown(game,pokemon.id);
  const region=REGIONS.find(r=>r.id===regionForPokemon(pokemon.id));
  return createPortal(<div className="dex-modal-backdrop" onClick={event=>{if(event.target===event.currentTarget)onClose();}}>
    <section className="dex-modal" role="dialog" aria-modal="true" aria-labelledby="dex-dialog-title">
      <button ref={closeRef} className="dex-modal-close" onClick={onClose} aria-label="닫기" type="button">×</button>
      <small>전국도감 #{String(pokemon.number).padStart(4,'0')}</small>
      {discovered?<img className="dex-modal-sprite" src={spriteUrl(pokemon.number)} alt="" />:<div className="dex-modal-unknown-sprite" aria-label="미발견 포켓몬">???</div>}
      <h3 id="dex-dialog-title">{discovered?pokemon.name:"???"}</h3>
      <div className="dex-type-list">{pokemon.types.map(t=><span key={t} className="dex-type"><EnergyTypeIcon type={t}/>{t}</span>)}</div>
      <div className="dex-dialog-metrics"><span>등장 지역</span><strong>{region?.name??'—'}</strong>
        <span>누적 처치</span><strong>{discovered?formatAmount(dexKills(game,pokemon.id))+"회":"???"}</strong>
        <span>현재 행성 처치</span><strong>{discovered?formatAmount(game.killCounts?.[pokemon.id]??0)+" / 10":"???"}</strong></div>
      {defeated?<><h4>전투 능력치</h4>
        <div className="dex-stat-grid">{BASIC_STAT_FIELDS.filter(field=>field.key==='hp'||field.key==='attack'||field.key==='speed'||pokemon[field.key]!==0).map(field=>
          <div key={field.key}><span>{field.label}</span><strong>{formatStatValue(field.key,pokemon[field.key])}</strong></div>)}</div>
        <h4>기본 처치 보상</h4><div className="dex-rewards">
          {Object.entries(pokemon.rewards??{}).map(([k,v])=><span key={k}>{BASIC_STAT_FIELDS.find(field=>field.key===k)?.label??k} {v<0?'−':'+'}{formatStatValue(k,Math.abs(v))}</span>)}
          {Object.entries(battleEnergyRewards(pokemon,0)).map(([type,value])=><span key={type}><EnergyTypeIcon type={type}/>{type} 에너지 +{formatAmount(value)}</span>)}
        </div>
        <small>현재 회차의 반복 처치 보상은 별도 감소 규칙을 따릅니다.</small>
      </>:<><h4>전투 능력치</h4><p>???</p><h4>기본 처치 보상</h4><p>???</p></>}
    </section>
  </div>,document.body);
}
function PokemonDex({game}){
  const [query,setQuery]=useState('');
  const [type,setType]=useState('all');
  const [region,setRegion]=useState('all');
  const [filter,setFilter]=useState('all');
  const [selected,setSelected]=useState(null);
  const closeDialog=useCallback(()=>setSelected(null),[]);
  const known=POKEMON.filter(p=>isKnown(game,p.id)).length;
  const defeated=POKEMON.filter(p=>dexKills(game,p.id)>0).length;
  const mastered=POKEMON.filter(p=>dexKills(game,p.id)>=10).length;
  const matches=POKEMON.filter(p=>{
    const status=stage(game,p.id);
    return (type==='all'||p.types.includes(type))&&
      (region==='all'||regionForPokemon(p.id)===region)&&
      (filter==='all'||filter===status)&&
      (!query.trim()||String(p.number).includes(query.trim())||(status!=='unknown'&&p.name.includes(query.trim())));
  });
  return <div className="dex-section">
    <div className="dex-progress"><span>발견 <strong>{known}/{POKEMON.length}</strong></span><span>첫 처치 <strong>{defeated}/{POKEMON.length}</strong></span><span>누적 10회 <strong>{mastered}/{POKEMON.length}</strong></span></div>
    <div className="dex-filters">
      <input aria-label="포켓몬 검색" placeholder="이름 또는 도감번호 검색" value={query} onChange={e=>setQuery(e.target.value)} />
      <select aria-label="타입 필터" value={type} onChange={e=>setType(e.target.value)}>
        <option value="all">전체 타입</option>{[...new Set(ALL_POKEMON.flatMap(p=>p.types))].map(t=><option key={t} value={t}>{t}</option>)}
      </select>
      <select aria-label="지역 필터" value={region} onChange={e=>setRegion(e.target.value)}>
        <option value="all">전체 지역</option>{REGIONS.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}
      </select>
      <select aria-label="발견 상태 필터" value={filter} onChange={e=>setFilter(e.target.value)}>
        <option value="all">전체 상태</option><option value="unknown">미발견</option><option value="found">발견</option><option value="defeated">처치 완료</option>
      </select>
    </div>
    <div className="dex-pokemon-grid">{matches.map(p=>{
      const status=stage(game,p.id);
      return <button key={p.id} type="button" className={'dex-pokemon-card '+(status==='unknown'?'is-unknown':'')}
        onClick={()=>setSelected(p)} aria-label={status==='unknown'?'도감번호 '+p.number+' 미발견 포켓몬 상세 보기':p.name+' 상세 보기'}>
        <small>#{String(p.number).padStart(4,'0')}</small>
        {status==='unknown'?<div className="dex-unknown-sprite">?</div>:<img src={spriteUrl(p.number)} alt="" loading="lazy"/>}
        <strong>{status==='unknown'?'???':p.name}</strong><span>{stageName[status]}</span>
      </button>;
    })}</div>
    {matches.length===0&&<p className="dex-empty">검색 조건에 해당하는 포켓몬이 없습니다.</p>}
    {selected&&<DexDialog pokemon={selected} game={game} onClose={closeDialog}/>}
  </div>;
}
function StatsDex(){
  return <div className="dex-section">
    <p className="dex-info-note">현재 전투 엔진의 작동 규칙을 기준으로 설명합니다. 수치가 높은 것이 항상 유리하지 않은 능력치도 있습니다.</p>
    {['기본 능력치','특수 능력치'].map((category,i)=><section key={category} className="dex-stat-section">
      <h3>{category}</h3><div className="dex-stat-entries">
      {BASIC_STAT_FIELDS.filter(f=>i===0?BASIC_STAT_KEYS.includes(f.key):!BASIC_STAT_KEYS.includes(f.key)).map(f=>
        <details key={f.key} className="dex-stat-entry"><summary>{f.label}</summary><p>{STAT_DETAILS[f.key]??f.description}</p></details>)}
      </div></section>)}
  </div>;
}
function ItemsDex({game}){
  return <div className="dex-section">
    <p className="dex-info-note">도구는 조건을 달성한 뒤 다음 행성 이동 시 자동 획득합니다. 한 행성에서 달성하는 조건과 전체 행성의 누적 조건을 모두 지원합니다. 획득 전에는 효과가 적용되지 않습니다.</p>
    {ITEMS.length===0?<div className="dex-empty"><h3>등록된 도구가 없습니다.</h3><p>도구 이름·획득 조건·효과는 후속 개발에서 추가됩니다.</p></div>:
      <div className="dex-item-grid">{ITEMS.map(item=>{
        const owned=game.itemOwned?.includes(item.id);
        const pending=game.itemPending?.includes(item.id);
        const record=item.condition.scope==='run'?game.itemRunProgress:game.itemLifetimeProgress;
        return <div className="dex-item-card" key={item.id}>
          <strong>{item.name}</strong><span>{owned?'보유':pending?'획득 대기':'미달성'}</span>
          <p>{item.description}</p><p>조건: {item.conditionLabel}</p><small>진행: {Math.min(record?.[item.condition.metric]??0,item.condition.target)} / {item.condition.target}</small>
        </div>;
      })}</div>}
  </div>;
}
export function DexPage(){
  const [tab,setTab]=useState('pokemon');
  const game=useGameStore(s=>s.game);
  return <div className="dex-page">
    <div className="ditto-info-tabs dex-tabs" role="tablist" aria-label="도감 분류">
      {[['pokemon','포켓몬'],['stats','능력치'],['moves','기술'],['items','도구']].map(([key,label])=>
        <button key={key} type="button" role="tab" aria-selected={tab===key}
          className={'ditto-info-tab '+(tab===key?'is-active':'')} onClick={()=>setTab(key)}>{label}</button>)}
    </div>
    <div role="tabpanel" aria-label={tab==='pokemon'?'포켓몬':tab==='stats'?'능력치':tab==='moves'?'기술':'도구'}>
      {tab==='pokemon'?<PokemonDex game={game}/>:tab==='stats'?<StatsDex/>:tab==='moves'?
        <div className="dex-empty"><h3>기술 도감</h3><p>기술 시스템 추후 추가 예정</p></div>:<ItemsDex game={game}/>}
    </div>
  </div>;
}
