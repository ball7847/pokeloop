import {isAmount,compareAmount,formatAmount} from './bigNumber.js';
// The minimum damage roll is a shared baseline for all combatants.
export const DEFAULT_MIN_DAMAGE_PERCENT = 85;
// One shared baseline for all combatants. Omitted stats inherit these values.
export const DEFAULT_STATS = Object.freeze({
  hp: 0,
  attack: 0,
  defense: 0,
  specialAttack: 0,
  specialDefense: 0,
  paralysis:0,
  poison:0,
  accuracy:100,
  dodge:0,
  speed: 0,
  minDamagePercent: DEFAULT_MIN_DAMAGE_PERCENT
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
  { key:'paralysis',label:'마비',description:'명중할 때 상대에게 누적 마비를 부여합니다.' },
  { key:'poison',label:'독',description:'명중할 때 상대에게 누적 독을 부여합니다.' },
  { key:'accuracy',label:'명중',description:'명중 확률(%)입니다. 100% 초과분은 상대의 회피를 감소시킵니다.' },
  { key:'dodge',label:'회피',description:'공격을 피할 확률(%)입니다.' },
  { key:'speed', label:'스피드', description:'공격 간 대기시간(ms)입니다.' },
  { key:'minDamagePercent', label:'최소 피해량', description:'최종 피해 배율의 하한입니다. 1% 단위로 최대 100%까지 무작위 선택합니다.' }
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
  if (key === 'minDamagePercent') return Number.isFinite(value)?value + '%':'—';
  return formatAmount(value);
}
// One integer-percent roll from [lowerBound, 100], inclusive.
// Only used when the future combat damage calculation is connected.
export function rollDamagePercent(lowerBound, random = Math.random) {
  if (!Number.isInteger(lowerBound) || lowerBound < 0 || lowerBound > 100) {
    throw new RangeError('Damage percentage lower bound must be an integer in [0, 100].');
  }
  return lowerBound + Math.floor(Math.min(0.9999999999999999, Math.max(0, random())) * (101 - lowerBound));
}
