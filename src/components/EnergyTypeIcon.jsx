import React from 'react';

// SVGs: partywhale/pokemon-type-icons (MIT); bundled locally under public/assets/types.
export const TYPE_ICON_FILES=Object.freeze({
  '노말':'normal','불꽃':'fire','물':'water','풀':'grass','전기':'electric',
  '얼음':'ice','격투':'fighting','독':'poison','땅':'ground','비행':'flying',
  '에스퍼':'psychic','벌레':'bug','바위':'rock','고스트':'ghost','드래곤':'dragon',
  '악':'dark','강철':'steel','페어리':'fairy'
});
export function typeIconUrl(type){
  const file=TYPE_ICON_FILES[type];
  return file?import.meta.env.BASE_URL+'assets/types/'+file+'.svg':null;
}
export function EnergyTypeIcon({type,className=''}) {
  const src=typeIconUrl(type);
  return src?<img src={src} className={'energy-type-icon '+className} alt="" aria-hidden="true"
    width="16" height="16" loading="eager"/>:null;
}
export function EnergyTypeLabel({type}){
  return <span className="energy-type-label"><EnergyTypeIcon type={type}/>{type} 에너지</span>;
}
