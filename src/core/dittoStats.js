// The minimum damage roll is a shared baseline for all combatants.
export const DEFAULT_MIN_DAMAGE_PERCENT = 85;
// Base stats are independent from transient combat HP.
export const DEFAULT_DITTO_STATS = Object.freeze({
  hp: 10,
  attack: 1,
  defense: 0,
  specialAttack: 0,
  specialDefense: 0,
  speed: 3000,
  minDamagePercent: DEFAULT_MIN_DAMAGE_PERCENT
});

export const BASIC_STAT_FIELDS = Object.freeze([
  { key:'hp', label:'HP', description:'현재 HP가 0이 되면 쓰러집니다.' },
  { key:'attack', label:'공격', description:'물리 기술의 피해량을 결정합니다.' },
  { key:'defense', label:'방어', description:'받는 물리 피해를 방어 수치만큼 감소시킵니다.' },
  { key:'specialAttack', label:'특수공격', description:'특수 기술의 피해량을 결정합니다.' },
  { key:'specialDefense', label:'특수방어', description:'받는 특수 피해를 특수방어 수치만큼 감소시킵니다.' },
  { key:'speed', label:'스피드', description:'공격 간 대기시간(ms)입니다.' },
  { key:'minDamagePercent', label:'최소 피해량', description:'최종 피해 배율의 하한입니다. 1% 단위로 최대 100%까지 무작위 선택합니다.' }
]);

export function visibleBasicStats(stats = {}) {
  return BASIC_STAT_FIELDS.filter(({key}) => Number.isFinite(stats[key]) && stats[key] !== 0 && !(key === 'minDamagePercent' && stats[key] === DEFAULT_MIN_DAMAGE_PERCENT));
}
export function formatBasicStat(key, value) {
  if (!Number.isFinite(value)) return '—';
  if (key === 'speed') return value.toLocaleString('en-US') + 'ms';
  if (key === 'minDamagePercent') return value + '%';
  return value.toLocaleString('en-US');
}
// One integer-percent roll from [lowerBound, 100], inclusive.
// Only used when the future combat damage calculation is connected.
export function rollDamagePercent(lowerBound, random = Math.random) {
  if (!Number.isInteger(lowerBound) || lowerBound < 0 || lowerBound > 100) {
    throw new RangeError('Damage percentage lower bound must be an integer in [0, 100].');
  }
  return lowerBound + Math.floor(Math.min(0.9999999999999999, Math.max(0, random())) * (101 - lowerBound));
}
