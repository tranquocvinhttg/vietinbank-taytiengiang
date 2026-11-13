import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const original=readFileSync(new URL('../reference/deposit-original.js',import.meta.url),'utf8');
const integrated=readFileSync(new URL('../src/deposit-ui.mjs',import.meta.url),'utf8');

// A small DOM adapter runs both complete calculators with the same input events.
// Expected outputs come from the supplied source, not a reimplementation of its formulas.
function calculator(source,isIntegrated){
 const terms={t1term:12,t2term:12},elements=new Map();
 const defaults={'t1-amount':'100.000.000','t1-rate':'5,0','t2-amount':'200.000.000','t2-rate':'5,0','t2-loan':'200.000.000'};
 const element=id=>{
  if(!elements.has(id))elements.set(id,{value:defaults[id]||'',innerHTML:'',textContent:'',hidden:false,handlers:{},setAttribute(){},addEventListener(event,callback){this.handlers[event]=callback;}});
  return elements.get(id);
 };
 const querySelector=selector=>{
  if(selector.startsWith('#'))return element(selector.slice(1));
  const term=selector.match(/input\[name="([^"]+)"\]:checked/);
  if(term)return {value:terms[term[1]]};
  return element(selector);
 };
 const host={innerHTML:'',querySelector},storage=new Map();
 const context=vm.createContext({host,document:{getElementById:element,querySelector},location:{hash:''},localStorage:{setItem:(k,v)=>storage.set(k,v),getItem:k=>storage.get(k)},console});
 vm.runInContext(isIntegrated?source.replace('export function','function')+'\nmountDepositCalculator(host);':source,context);
 return {
  set(values,tab=1,n=12){
   terms['t'+tab+'term']=n;
   for(const [id,value]of Object.entries(values))element(id).value=String(value);
   element('t'+tab+'-rate').handlers.input();
  },
  output(tab){return element('t'+tab+'-result').innerHTML.replaceAll(' role="alert"','');},
  maturity(){return element('t2-maturity').textContent;}
 };
}
const pair=()=>[calculator(original,false),calculator(integrated,true)];
const same=(pair,values,tab=1,n=12)=>{for(const c of pair)c.set(values,tab,n);assert.equal(pair[1].output(tab),pair[0].output(tab));assert.equal(pair[1].maturity(),pair[0].maturity());};

test('original default values and both complete results are preserved',()=>{
 const p=pair();assert.equal(p[1].output(1),p[0].output(1));assert.equal(p[1].output(2),p[0].output(2));
});
test('all 14 terms, conversion methods, payment dates and rounding match the source',()=>{
 const p=pair();
 for(const n of [1,2,3,4,5,6,7,8,9,10,11,12,24,36])
  for(const start of ['2024-01-31','2024-02-29','2025-08-31','2026-11-11'])
   for(const rate of ['0,2','5,0','9,75'])same(p,{'t1-amount':'123.456.789','t1-rate':rate,'t1-start':start},1,n);
});
test('leap year, month-end maturity and actual/365 retain the original amounts',()=>{
 const p=pair();same(p,{'t1-amount':'100.000.000','t1-rate':'5,0','t1-start':'2024-01-31'},1,1);
 assert.match(p[1].output(1),/29\/02\/2024/);assert.match(p[1].output(1),/29 ngày/);assert.match(p[1].output(1),/397\.260,27 đ/);
 same(p,{'t1-start':'2024-01-01'},1,12);assert.match(p[1].output(1),/366 ngày/);assert.match(p[1].output(1),/5\.013\.698,63 đ/);
});
test('collateral comparison, minimum loan rate and both winning outcomes match the source',()=>{
 const p=pair();
 for(const rate of ['0,2','5,0','8,25'])
  for(const loan of ['1.000.000','50.000.000','200.000.000'])
   for(const repay of ['2026-05-02','2026-07-01','2027-01-01'])same(p,{'t2-amount':'200.000.000','t2-rate':rate,'t2-start':'2026-01-01','t2-need':'2026-05-01','t2-repay':repay,'t2-loan':loan},2,12);
 same(p,{'t2-rate':'5,0','t2-loan':'200.000.000','t2-repay':'2026-07-01'},2,12);
 assert.match(p[1].output(2),/8%\/năm/);assert.match(p[1].output(2),/<h3>Cầm cố sổ tiết kiệm/);
 same(p,{'t2-repay':'2027-01-01'},2,12);assert.match(p[1].output(2),/<h3>Rút tiết kiệm trước hạn/);
});
test('invalid dates, missing input, zero rate and loan limit use original validation',()=>{
 const p=pair();
 const base={'t2-amount':'200.000.000','t2-rate':'5,0','t2-start':'2026-01-01','t2-need':'2026-05-01','t2-repay':'2026-07-01','t2-loan':'200.000.000'};
 for(const invalid of [{'t2-start':''},{'t2-need':'2026-01-01'},{'t2-need':'2027-01-01'},{'t2-repay':'2026-05-01'},{'t2-repay':'2027-01-02'},{'t2-loan':'200.000.001'},{'t2-loan':''},{'t2-rate':'0'}]){
  same(p,{...base,...invalid},2,12);assert.match(p[1].output(2),/class="err"/);
 }
 for(const invalid of [{'t1-amount':''},{'t1-rate':'0'},{'t1-start':''}]){
  same(p,{'t1-amount':'100000000','t1-rate':'5','t1-start':'2026-01-01',...invalid},1,12);assert.match(p[1].output(1),/class="err"/);
 }
});
test('deposit controls avoid the host app admin navigation attributes',()=>{
 assert.ok(!integrated.includes('data-tab=\\"'));
 assert.ok(integrated.includes('data-deposit-panel='));
 assert.ok(integrated.includes('vtb-deposit:tab'));
});
