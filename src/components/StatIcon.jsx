import React,{useState} from 'react';

// Official Pokémon HOME stat sprites as catalogued by Bulbagarden Archives.
// MediaWiki's file redirect keeps file revisions and upload directory paths out of UI code.
export const HOME_STAT_FILES=Object.freeze({
  hp:'HP_icon_HOME.png',
  attack:'Attack_icon_HOME.png',
  defense:'Defense_icon_HOME.png',
  specialAttack:'Special_Attack_icon_HOME.png',
  specialDefense:'Special_Defense_icon_HOME.png',
  speed:'Speed_icon_HOME.png'
});
const ABBREVIATIONS=Object.freeze({hp:'HP',attack:'공',defense:'방',specialAttack:'특공',specialDefense:'특방',speed:'속'});
const HOME_STAT_NAMES=Object.freeze({hp:'HP',attack:'공격',defense:'방어',specialAttack:'특수공격',specialDefense:'특수방어',speed:'스피드'});
export function homeStatIconUrl(key) {
  const name=HOME_STAT_FILES[key];
  return name?'https://archives.bulbagarden.net/wiki/Special:Redirect/file/'+encodeURIComponent(name):null;
}
export function StatIcon({stat,className=''}) {
  const [failed,setFailed]=useState(false);
  const url=homeStatIconUrl(stat);
  if(!url)return null;
  return <span className={'home-stat-icon '+className} aria-hidden="true">
    {failed?<span className="home-stat-fallback">{ABBREVIATIONS[stat]}</span>:
      <img src={url} alt="" width="18" height="18" loading="lazy" onError={()=>setFailed(true)}/>}
  </span>;
}
export function StatLabel({stat,label,compact=false}) {
  return <span className="stat-label" title={label??HOME_STAT_NAMES[stat]}>
    <StatIcon stat={stat}/>{!compact&&<span className="stat-label-text">{label??HOME_STAT_NAMES[stat]}</span>}
  </span>;
}
