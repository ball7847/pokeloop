import React from 'react';

// Local SVG vectorizations of the six user-provided Pokémon HOME PNG silhouettes.
export const HOME_STAT_FILES = Object.freeze({
  hp:'hp.svg', attack:'attack.svg', defense:'defense.svg',
  specialAttack:'specialAttack.svg', specialDefense:'specialDefense.svg', speed:'speed.svg'
});
export const DAMAGE_STAT_FILES=Object.freeze({minDamagePercent:'minDamagePercent.svg',maxDamagePercent:'maxDamagePercent.svg'});
// Icons traced from the player's transparent paralysis / poison artwork.
export const STATUS_STAT_FILES=Object.freeze({paralysis:'paralysis.svg',poison:'poison.svg',antidote:'antidote.svg'});
export const MULTISTRIKE_STAT_FILES=Object.freeze({multiStrike:'multiStrike.svg'});
const ADDITIONAL_STAT_FILES=Object.freeze({accuracy:'accuracy.svg',dodge:'dodge.svg',regeneration:'regeneration.svg',intimidation:'intimidation.svg'});
const EXTRA_ICONS=Object.freeze({sound:'♪',criticalChance:'✦',criticalMultiplier:'×',honey:'✿'});
const SHORT_LABELS=Object.freeze({
  hp:'HP',attack:'공격',defense:'방어',
  specialAttack:'특공',specialDefense:'특방',speed:'스피드'
});
export function homeStatIconUrl(stat) {
  const file=HOME_STAT_FILES[stat]??DAMAGE_STAT_FILES[stat]??STATUS_STAT_FILES[stat]??MULTISTRIKE_STAT_FILES[stat]??ADDITIONAL_STAT_FILES[stat];
  return file ? import.meta.env.BASE_URL+'assets/stats/'+file : null;
}
export function StatIcon({stat,className='',fallback=false}) {
  const src=homeStatIconUrl(stat)??(fallback&&!EXTRA_ICONS[stat]?import.meta.env.BASE_URL+'assets/stats/unknown.svg':null);
  return src?<img className={'home-stat-icon '+className} src={src} alt="" width="18" height="18" loading="eager"/>:EXTRA_ICONS[stat]?<span className={'extra-stat-icon '+className} aria-hidden="true">{EXTRA_ICONS[stat]}</span>:null;
}
export function StatLabel({stat,label,compact=false}) {
  const name=label??SHORT_LABELS[stat]??stat;
  const src=homeStatIconUrl(stat);
  return <span className="stat-label" title={name}>
    {(src||EXTRA_ICONS[stat])?<StatIcon stat={stat}/>:null}
    {!compact&&<span className="stat-label-text">{name}</span>}
    {compact&&!src&&!EXTRA_ICONS[stat]&&<span className="stat-label-text">{SHORT_LABELS[stat]??name}</span>}
  </span>;
}
