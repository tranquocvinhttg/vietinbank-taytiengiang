import test from 'node:test';
import assert from 'node:assert/strict';
import {shortTerm,longTerm,compare,day,iso,rate,money,roundHalfUp,paymentTarget,formatRate,formatMoney} from '../src/engine.mjs';
const short=(patch={})=>({name:'Kiểm thử',opening:'500000000',rate:'8',start:'2026-11-01',end:'2026-11-30',basis:'365',transactions:[],rates:[],...patch});
const long=(patch={})=>({name:'Kiểm thử',principal:'1000000000',rate:'6.5',start:'2026-11-01',term:'60',dueDay:'1',firstPrincipal:'1',basis:'365',promoMonths:'6',afterRate:'8.5',rates:[],...patch});
const sum=(rows,key)=>rows.reduce((s,r)=>s+r[key],0n);
test('1. Lãi ngắn hạn không biến động 3.287.671 đồng',()=>assert.equal(shortTerm(short()).interest,3287671n));
test('2. Nhiều giao dịch đúng số kỳ vọng 3.506.849 đồng',()=>{
 const r=shortTerm(short({transactions:[{date:'2026-11-05',type:'draw',amount:'200000000'},{date:'2026-11-15',type:'repay',amount:'300000000'},{date:'2026-11-25',type:'draw',amount:'100000000'}]}));
 assert.equal(r.interest,3506849n);assert.equal(r.closing,500000000n);assert.equal(sum(r.segments,'interest'),r.interest);
});
test('3. Mốc đổi lãi suất chia 14 ngày và 16 ngày',()=>{
 const r=shortTerm(short({rate:'6.5',rates:[{date:'2026-11-15',rate:'8.5'}]}));
 assert.deepEqual(r.segments.map(s=>s.days),[14,16]);assert.deepEqual(r.segments.map(s=>s.rate),[65000n,85000n]);
});
test('4. Cùng ngày thu nợ và đổi lãi suất áp dụng cả hai từ đầu ngày',()=>{
 const r=shortTerm(short({rate:'7',transactions:[{date:'2026-11-15',type:'repay',amount:'100000000'}],rates:[{date:'2026-11-15',rate:'8'}]}));
 assert.equal(r.segments[1].balance,400000000n);assert.equal(r.segments[1].rate,80000n);
});
test('5. Vay 120 triệu không lãi, 12 kỳ mỗi kỳ 10 triệu',()=>{
 const r=longTerm(long({principal:'120000000',rate:'0',term:'12',promoMonths:'0'}));
 assert.equal(r.interest,0n);assert.ok(r.schedule.every(x=>x.principal===10000000n));
});
test('6. Tháng 2/2028 có 29 ngày, ngày nhuận hợp lệ',()=>{
 assert.equal(shortTerm(short({start:'2028-02-01',end:'2028-02-29'})).days,29);
 assert.throws(()=>day('2027-02-29'));
});
test('7. Ngày trả 31 về cuối tháng 2,4,6',()=>{
 const r=longTerm(long({start:'2027-01-31',dueDay:'31',term:'5',promoMonths:'0',rate:'0'}));
 assert.deepEqual(r.schedule.map(s=>iso(s.due)),['2027-02-28','2027-03-31','2027-04-30','2027-05-31','2027-06-30']);
});
test('8. Lãi suất đổi giữa kỳ được tách và tính chính xác',()=>{
 const r=longTerm(long({principal:'500000000',rate:'6.5',start:'2026-11-01',firstDue:'2026-11-30',dueDay:'30',term:'2',promoMonths:'0',rates:[{date:'2026-11-15',rate:'8.5'}]}));
 assert.deepEqual(r.schedule[0].parts.map(x=>x.days),[14,16]);
 assert.equal(r.schedule[0].interest,roundHalfUp(500000000n*(65000n*14n+85000n*16n),365000000n));
});
test('9. Gốc, lãi, tổng thanh toán đối chiếu chung',()=>{
 for(const method of ['equal','annuity']){const r=longTerm(long(),method);assert.equal(sum(r.schedule,'principal'),r.principal);assert.equal(sum(r.schedule,'interest'),r.interest);assert.equal(sum(r.schedule,'payment'),r.totalPayment);assert.equal(r.schedule.at(-1).closing,0n);}
});
test('10. Chặn đầy đủ dữ liệu sai',()=>{
 for(const patch of [{opening:'-1'},{rate:'-1'},{name:''},{start:''},{end:'2026-10-01'},{basis:'361'},{rates:[{date:'2026-11-15',rate:'8'},{date:'2026-11-15',rate:'8'}]},{transactions:[{date:'2026-11-15',type:'repay',amount:'500000001'}]},{transactions:[{date:'2026-11-15',type:'draw',amount:'0'}]}])assert.throws(()=>shortTerm(short(patch)));
 for(const patch of [{principal:'-1'},{term:'0'},{term:'481'},{dueDay:'32'},{firstDue:'2026-10-01'},{afterRate:''}])assert.throws(()=>longTerm(long(patch)));
});
test('11. Nhiều giao dịch cùng ngày lấy biến động ròng, không phụ thuộc thứ tự',()=>{
 const t=[{date:'2026-11-15',type:'repay',amount:'600000000'},{date:'2026-11-15',type:'draw',amount:'200000000'}];
 const a=shortTerm(short({transactions:t})),b=shortTerm(short({transactions:[...t].reverse()}));
 assert.equal(a.interest,b.interest);assert.equal(a.closing,100000000n);assert.ok(a.transactions.every(x=>x.balance===100000000n));
});
test('12. Tính cả đầu/cuối, giao dịch đầu và cuối kỳ',()=>{
 const r=shortTerm(short({start:'2026-11-01',end:'2026-11-01',transactions:[{date:'2026-11-01',type:'repay',amount:'500000000'}]}));assert.equal(r.days,1);assert.equal(r.interest,0n);
});
test('13. Gốc cuối kỳ được điều chỉnh đến đúng 0 khi chia lẻ',()=>{
 const r=longTerm(long({principal:'100000001',term:'7',promoMonths:'0'}));assert.equal(sum(r.schedule,'principal'),100000001n);assert.equal(r.schedule.at(-1).closing,0n);
});
test('14. Vay 480 tháng cả hai phương thức, không âm và đủ ngày',()=>{
 for(const method of ['equal','annuity']){const r=longTerm(long({term:'480',rate:'2',promoMonths:'0',rates:[{date:'2040-05-17',rate:'3'}]}),method);assert.equal(r.schedule.length,480);assert.ok(r.schedule.every(x=>x.closing>=0n&&x.principal<=x.opening));assert.equal(r.schedule.reduce((s,x)=>s+x.days,0),r.end-r.start+1);assert.equal(r.schedule.at(-1).closing,0n);}
});
test('15. PMT không lãi và PMT so với Excel ví dụ',()=>{assert.equal(paymentTarget(120000000n,0n,12),10000000n);assert.equal(paymentTarget(100000000n,80000n,10),10370321n);});
test('16. Chặn lịch âm amortization thay vì tăng dư nợ',()=>assert.throws(()=>longTerm(long({term:'480',rate:'20',firstDue:'2027-10-31',promoMonths:'0'}),'annuity'),/lãi vượt/));
test('17. Ngày quá hạn, lãi suất trùng với hết ưu đãi được chặn',()=>{assert.throws(()=>longTerm(long({rates:[{date:'2027-05-01',rate:'9'}]})),/trùng ngày/);assert.throws(()=>shortTerm(short({transactions:[{date:'2026-10-31',type:'draw',amount:'1'}]})));});
test('18. Ân hạn gốc và lịch trả đầu tùy chọn',()=>{
 const r=longTerm(long({firstPrincipal:'4',firstDue:'2026-12-15',dueDay:'15',term:'12',promoMonths:'0'}));assert.ok(r.schedule.slice(0,3).every(x=>x.principal===0n));assert.equal(sum(r.schedule,'principal'),r.principal);assert.equal(iso(r.schedule[1].start),'2026-12-16');
});
test('19. Chia nhiều tháng/năm và làm tròn cộng dồn không lệch',()=>{
 const r=shortTerm(short({opening:'123456789',rate:'7,1234',start:'2027-12-20',end:'2028-03-05'}));
 assert.equal(r.months.length,4);assert.equal(sum(r.months,'interest'),r.interest);assert.equal(r.segments.reduce((s,x)=>s+x.days,0),r.days);
});
test('20. Đối chứng độc lập theo từng ngày cho lịch sự kiện',()=>{
 const input=short({start:'2027-12-20',end:'2028-03-05',transactions:[{date:'2028-01-03',type:'draw',amount:'100000'},{date:'2028-02-29',type:'repay',amount:'1234567'}],rates:[{date:'2028-01-17',rate:'7.1234'},{date:'2028-02-29',rate:'9.5'}]});
 const r=shortTerm(input);let expected=0n,b=money(input.opening),ir=rate(input.rate);
 for(let d=r.start;d<=r.end;d++){for(const t of input.transactions)if(day(t.date)===d)b+=t.type==='draw'?money(t.amount):-money(t.amount);for(const q of input.rates)if(day(q.date)===d)ir=rate(q.rate);expected+=b*ir;}
 assert.equal(r.raw,expected);assert.equal(r.interest,roundHalfUp(expected,r.denominator));
});
test('21. So sánh sử dụng chính xác cùng khoản vay và mốc lãi suất',()=>{const c=compare(long());assert.deepEqual(c.a.rates,c.b.rates);assert.deepEqual(c.a.dueDates,c.b.dueDates);assert.equal(c.a.principal,c.b.principal);});
test('22. Đồng lẻ, lãi suất 4 số thập phân, không để NaN',()=>{assert.equal(rate('0,0001'),1n);assert.equal(formatRate(65000n),'6,50%/năm');assert.equal(formatMoney(123456789n),'123.456.789 VNĐ');for(const method of ['equal','annuity'])assert.equal(longTerm(long({principal:'1',rate:'0',term:'12',promoMonths:'0'}),method).totalPayment,1n);});
test('23. Cơ sở 360 tính đúng và khác cơ sở 365',()=>{assert.equal(shortTerm(short({basis:'360'})).interest,3333333n);assert.notEqual(shortTerm(short({basis:'360'})).interest,shortTerm(short()).interest);});
test('24. Nhiều mốc giữa kỳ quay về mức cũ vẫn tính lại PMT',()=>{
 const r=longTerm(long({term:'12',rate:'10',promoMonths:'0',rates:[{date:'2027-01-15',rate:'20'},{date:'2027-02-01',rate:'10'}]}),'annuity');
 assert.equal(r.schedule[2].target,paymentTarget(r.schedule[2].opening,100000n,10));assert.equal(r.schedule.at(-1).closing,0n);
});
