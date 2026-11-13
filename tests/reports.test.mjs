import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {shortTerm,longTerm,compare} from '../src/engine.mjs';
import {buildReport,reportHtml,reportSheets,xlsxBytes} from '../src/reports.mjs';
const s={name:'Phương án kiểm thử <không chèn HTML>',reference:'REF-TEST',author:'Người kiểm thử',opening:'500000000',rate:'8',start:'2026-11-01',end:'2026-11-30',basis:'365',transactions:[],rates:[]};
const l={name:'Phương án kiểm thử',reference:'REF-TEST',author:'Người kiểm thử',principal:'1000000000',rate:'6.5',start:'2026-11-01',term:'60',dueDay:'1',firstPrincipal:'1',basis:'365',promoMonths:'6',afterRate:'8.5',rates:[]};
fs.mkdirSync(new URL('./output/',import.meta.url),{recursive:true});
test('Báo cáo HTML và XLSX ngắn hạn lấy chung số liệu đã tính',()=>{
 const r=shortTerm(s),m=buildReport(r,{date:'06/11/2026'}),html=reportHtml(m);
 assert.ok(html.includes('3.287.671'));assert.ok(html.includes('&lt;không chèn HTML&gt;'));assert.ok(!/src="https?:|href="https?:/.test(html));
 assert.ok(reportSheets(m).at(-1).rows.some(x=>x[0]==='Tổng lãi phát sinh'&&x[1]===r.interest));
 const bytes=xlsxBytes(m);assert.deepEqual([...bytes.slice(0,4)],[80,75,3,4]);
 fs.writeFileSync(new URL('./output/short.xlsx',import.meta.url),bytes);fs.writeFileSync(new URL('./output/short.html',import.meta.url),html);
});
test('480 kỳ được xuất đầy đủ, số trang và tiêu đề bảng được lặp',()=>{
 const r=longTerm({...l,term:'480',promoMonths:'0'}),m=buildReport(r),html=reportHtml(m);
 assert.equal(reportSheets(m).find(x=>x.name==='Lich tra no A').rows.length,481);
 assert.ok(html.includes('Trang 1 / '));assert.ok((html.match(/<thead>/g)||[]).length>20);
 assert.ok(html.includes('480</td>'));
 fs.writeFileSync(new URL('./output/long.xlsx',import.meta.url),xlsxBytes(m));fs.writeFileSync(new URL('./output/long.html',import.meta.url),html);
 fs.writeFileSync(new URL('./output/expected.json',import.meta.url),JSON.stringify({shortInterest:3287671,longInterest:r.interest.toString(),longTotal:r.totalPayment.toString(),longPrincipal:r.principal.toString()}));
});
test('Báo cáo so sánh chứa hai lịch trả nợ và đúng tổng tiền',()=>{
 const r=compare(l),m=buildReport(r),sheets=reportSheets(m);
 assert.ok(sheets.some(s=>s.name==='Lich tra no B'));
 assert.equal(sheets.find(s=>s.name==='Tong hop ket qua').rows[2][1],r.a.interest);
 fs.writeFileSync(new URL('./output/compare.xlsx',import.meta.url),xlsxBytes(m));
});
test('Chặn XLSX ngoài giới hạn 15 chữ số thay vì làm mất đồng',()=>{
 const r=shortTerm({...s,opening:'999999999999999',end:'2030-11-30',rate:'100'});
 assert.throws(()=>xlsxBytes(buildReport(r)),/15 chữ số/);
});
