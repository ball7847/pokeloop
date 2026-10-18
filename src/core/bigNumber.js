import Decimal from 'break_eternity.js';

// Stats and damage remain JSON-safe: ordinary values are Numbers and large ones are strings.
// All arithmetic is done with Decimal; speed (milliseconds) and percentage rolls stay Numbers.
export const MAX_GAME_AMOUNT='1e10000';
const NUMBER_LIMIT=1e12;
const validText=/^(?:0|[1-9]\\d*)(?:\\.\\d+)?(?:e[+-]?\\d+)?$/i;
export function decimal(value){
  if(value instanceof Decimal)return value;
  if(typeof value==='number'){
    if(!Number.isFinite(value))throw new RangeError('유효하지 않은 숫자입니다.');
    return new Decimal(value);
  }
  if(typeof value==='string'&&value.length<=120&&validText.test(value.trim())&&value===value.trim()){
    const d=new Decimal(value);
    if(d.gte(0)&&d.lte(MAX_GAME_AMOUNT))return d;
  }
  throw new RangeError('유효하지 않은 큰 숫자입니다.');
}
export function isAmount(value){
  try{return decimal(value).gte(0)&&decimal(value).lte(MAX_GAME_AMOUNT);}catch{return false;}
}
export function storedAmount(value){
  const d=decimal(value);
  if(!d.gte(0)||!d.lte(MAX_GAME_AMOUNT))throw new RangeError('허용된 능력치 범위를 초과했습니다.');
  const n=d.toNumber();
  return Number.isFinite(n)&&n<NUMBER_LIMIT?n:d.toString();
}
export const addAmount=(a,b)=>storedAmount(decimal(a).add(decimal(b)));
export const subtractAmount=(a,b)=>storedAmount(Decimal.max(0,decimal(a).sub(decimal(b))));
export const multiplyAmount=(a,b)=>storedAmount(decimal(a).mul(decimal(b)));
export const divideAmount=(a,b)=>storedAmount(decimal(a).div(decimal(b)));
export const compareAmount=(a,b)=>decimal(a).cmp(decimal(b));
export const positiveAmount=a=>compareAmount(a,0)>0;

// Truncation prevents display from claiming a value larger than the actual stat.
const trunc3=n=>Math.trunc((n+Number.EPSILON)*1000)/1000;
export function formatAmount(value){
  let d;
  try{d=decimal(value);}catch{return '—';}
  if(d.eq(0))return '0';
  if(d.lt(0.001)&&d.gt(0))return '<0.001';
  if(d.lt(1e6)){
    const x=trunc3(d.toNumber());
    return x.toLocaleString('en-US',{maximumFractionDigits:3});
  }
  // Engineering notation; powers of 10 are always multiples of three.
  const exponent=Math.floor(d.absLog10()/3)*3;
  const lead=trunc3(d.div('1e'+exponent).toNumber());
  return lead.toLocaleString('en-US',{maximumFractionDigits:3})+'e'+exponent;
}
