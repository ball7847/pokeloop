import React from 'react';

// Original Pokémon HOME images are not bundled until their file bytes have
// been acquired and verified. Never request unverified external media paths.
export const HOME_STAT_FILES=Object.freeze({
  hp:'hp.png',
  attack:'attack.png',
  defense:'defense.png',
  specialAttack:'specialAttack.png',
  specialDefense:'specialDefense.png',
  speed:'speed.png'
});
const ABBREVIATIONS=Object.freeze({
  hp:'HP',attack:'공격',defense:'방어',
  specialAttack:'특공',specialDefense:'특방',speed:'스피드'
});
export function homeStatIconUrl(_key) {
  // Assets unavailable: return null instead of creating broken requests.
  return null;
}
export function StatIcon({stat,className=''}) {
  const url=homeStatIconUrl(stat);
  return url?<img className={'home-stat-icon '+className} src={url} alt="" width="18" height="18" />:null;
}
export function StatLabel({stat,label,compact=false}) {
  const name=label??ABBREVIATIONS[stat]??stat;
  const hasIcon=Boolean(homeStatIconUrl(stat));
  return <span className="stat-label" title={name}>
    {hasIcon&&<StatIcon stat={stat}/>}
    <span className="stat-label-text">{compact?(hasIcon?'':ABBREVIATIONS[stat]??name):name}</span>
  </span>;
}
