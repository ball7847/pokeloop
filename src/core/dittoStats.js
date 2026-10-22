import {isAmount,compareAmount,formatAmount} from './bigNumber.js';
// The minimum damage roll is a shared baseline for all combatants.
export const DEFAULT_MIN_DAMAGE_PERCENT = 85;
export const DEFAULT_MAX_DAMAGE_PERCENT = 100;
// One shared baseline for all combatants. Omitted stats inherit these values.
export const DEFAULT_STATS = Object.freeze({
  hp: 0,
  attack: 0,
  defense: 0,
  specialAttack: 0,
  specialDefense: 0,
  paralysis:0,
  poison:0,
  antidote:0,
  accuracy:100,
  dodge:0,
  speed: 0,
  minDamagePercent: DEFAULT_MIN_DAMAGE_PERCENT,
  maxDamagePercent: DEFAULT_MAX_DAMAGE_PERCENT
});
export function defaultStat(key) {
  return Object.hasOwn(DEFAULT_STATS,key) ? DEFAULT_STATS[key] : 0;
}
export function resolveStats(overrides = {}) {
  return {...DEFAULT_STATS,...Object.fromEntries(Object.entries(overrides).filter(([,v])=>v!==undefined&&v!==null))};
}
export function isDefaultStat(key,value) {
  return !isAmount(value) || compareAmount(value,defaultStat(key))===0;
}
// Ditto retains its original 3,000ms starting speed as an explicit override.
export const DEFAULT_DITTO_STATS = Object.freeze(resolveStats({hp:10,attack:1,speed:3000}));

export const BASIC_STAT_FIELDS = Object.freeze([
  { key:'hp', label:'HP', description:'현재 HP가 0이 되면 쓰러집니다.' },
  { key:'attack', label:'공격', description:'물리 기술의 피해량을 결정합니다.' },
  { key:'defense', label:'방어', description:'받는 물리 피해를 방어 수치만큼 감소시킵니다.' },
  { key:'specialAttack', label:'특수공격', description:'특수 기술의 피해량을 결정합니다.' },
  { key:'specialDefense', label:'특수방어', description:'받는 특수 피해를 특수방어 수치만큼 감소시킵니다.' },
  { key:'paralysis',label:'마비',description:'명중 시 상대에게 마비를 누적합니다. 마비 상태에서 공격할 때 25% 확률로 전부 소모되어 다음 공격 주기가 누적 수치(ms)만큼 증가합니다.' },
  { key:'poison',label:'독',description:'명중할 때 상대에게 누적 독을 부여합니다.' },
  { key:'antidote',label:'해독',description:'자신의 공격 행동 종료 시 독 피해를 받기 전에 누적 독을 이 수치만큼 감소시킵니다.' },
  { key:'accuracy',label:'명중',description:'명중 확률(%)입니다. 100% 초과분은 상대의 회피를 감소시킵니다.' },
  { key:'dodge',label:'회피',description:'공격을 피할 확률(%)입니다.' },
  { key:'speed', label:'스피드', description:'공격 간 대기시간(ms)입니다.' },
  { key:'minDamagePercent', label:'최소 피해량', description:'공격 피해 배율의 최솟값(%)입니다.' },
  { key:'maxDamagePercent', label:'최대 피해량', description:'공격 피해 배율의 최댓값(%)입니다. 100%를 초과할 수 있습니다.' }
]);

export function visibleNonDefaultStats(stats = {}) {
  const resolved=resolveStats(stats);
  return BASIC_STAT_FIELDS.filter(({key}) => !isDefaultStat(key,resolved[key]));
}
export const ALWAYS_VISIBLE_DITTO_STATS = Object.freeze(['hp','attack','speed','minDamagePercent']);
export function visibleBasicStats(stats = {}) {
  const resolved=resolveStats(stats);
  return BASIC_STAT_FIELDS.filter(({key}) => ALWAYS_VISIBLE_DITTO_STATS.includes(key) || !isDefaultStat(key,resolved[key]));
}
export function formatBasicStat(key, value) {
  if (key === 'speed') return Number.isFinite(value)?value.toLocaleString('en-US') + 'ms':'—';
  if (key === 'accuracy'||key==='dodge')return Number.isFinite(value)?value+'%':'—';
  if (key === 'minDamagePercent'||key==='maxDamagePercent') return Number.isFinite(value)?value + '%':'—';
  return formatAmount(value);
}
// One integer-percent roll from [lowerBound, 100], inclusive.
// Only used when the future combat damage calculation is connected.
export function rollDamagePercent(lowerBound, random = Math.random, upperBound = 100) {
  if (!Number.isInteger(lowerBound) || lowerBound < 0 || !Number.isFinite(upperBound) || upperBound < lowerBound) {
    throw new RangeError('Invalid damage percentage range.');
  }
  // Damage rolls remain integer-percent values, even if a bonus grants fractional max damage.
  const ceiling=Math.floor(upperBound);
  return lowerBound + Math.floor(Math.min(0.9999999999999999, Math.max(0, random())) * (ceiling - lowerBound + 1));
}
