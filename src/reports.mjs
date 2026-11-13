import {formatMoney,formatNumber,formatDate,formatRate,day} from './engine.mjs';
export const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const REPORT_NOTE='Kết quả được tính toán dựa trên các thông số và giả định do người dùng cung cấp, chỉ mang tính chất tham khảo. Nghĩa vụ trả nợ thực tế được xác định theo hợp đồng tín dụng, thỏa thuận cho vay và quy định áp dụng của ngân hàng.';
const dateCell=d=>({date:d}), rateCell=r=>({rate:r});
export const cellText=v=>typeof v==='bigint'?formatNumber(v):v&&typeof v==='object'&&'date'in v?formatDate(v.date):v&&typeof v==='object'&&'rate'in v?formatRate(v.rate):String(v??'');
const methodName=r=>r.method==='equal'?'Trả gốc đều, lãi giảm dần':'Trả góp, thanh toán dự kiến gần như đều';
export function summaryRows(result) {
 const r=result.kind==='compare'?result.a:result;
 if(result.kind==='compare')return [
  ['Số tiền vay',r.principal,result.b.principal],['Tổng tiền lãi',r.interest,result.b.interest],['Tổng nghĩa vụ trả nợ',r.totalPayment,result.b.totalPayment],['Thanh toán kỳ đầu',r.firstPayment,result.b.firstPayment],['Thanh toán cao nhất',r.maxPayment,result.b.maxPayment],['Thanh toán kỳ cuối',r.lastPayment,result.b.lastPayment]
 ];
 return r.kind==='short'?[['Dư nợ đầu kỳ',r.opening],['Tổng giải ngân',r.draw],['Tổng thu nợ gốc',r.repay],['Dư nợ cuối kỳ',r.closing],['Số ngày tính lãi',r.days],['Tổng lãi phát sinh',r.interest]]:[['Số tiền vay',r.principal],['Thời hạn (tháng)',r.term],['Tổng gốc trả',r.totalPrincipal],['Tổng lãi dự kiến',r.interest],['Tổng thanh toán',r.totalPayment],['Thanh toán kỳ đầu',r.firstPayment],['Thanh toán cao nhất',r.maxPayment],['Thanh toán kỳ cuối',r.lastPayment]];
}
export function buildReport(result,options={}) {
 const r=result.kind==='compare'?result.a:result;
 const now=options.date||new Intl.DateTimeFormat('vi-VN',{day:'2-digit',month:'2-digit',year:'numeric',timeZone:'Asia/Ho_Chi_Minh'}).format(new Date());
 const assumptions=[
  'Tính cả ngày bắt đầu và ngày kết thúc. Dùng số ngày lịch thực tế; cơ sở '+r.basis+' ngày/năm.',
  'Tiền gốc quản lý theo đồng nguyên; lãi không làm tròn từng ngày. Làm tròn half-up đến đồng theo cộng dồn; chênh lệch làm tròn được phân bổ giữa các dòng để tổng chi tiết khớp tổng báo cáo.',
  r.kind==='short'?'Giao dịch và thay đổi lãi suất có hiệu lực đầu ngày; các giao dịch cùng ngày được tổng hợp trước khi tính lãi.':'Gốc trả cuối ngày đến hạn, giảm dư nợ từ ngày tiếp theo. Mức lãi suất sau ưu đãi và các mốc tương lai do người dùng giả định.',
 ];
 if(r.kind!=='short')assumptions.push('PMT mục tiêu dùng lãi suất năm/12; lãi phải trả dùng số ngày thực tế và từng mốc lãi suất. Khi lãi suất thay đổi trong kỳ, tính lại PMT theo lãi suất tại ngày đến hạn và số kỳ còn lại. Kỳ cuối điều chỉnh gốc về 0; không tạo lịch có lãi vượt PMT.', 'Kỳ đầu trả ngày '+formatDate(r.firstDue)+'; trả định kỳ ngày '+r.dueDay+' (về cuối tháng khi thiếu ngày); bắt đầu trả gốc từ kỳ '+r.firstPrincipal+'.');
 const info=[['Tên báo cáo','BÁO CÁO TÍNH LÃI VAY'],['Khách hàng / phương án',r.meta.name],['Mã tham chiếu',r.meta.reference||'Không khai báo'],['Ngày lập',now],['Người lập',r.meta.author||'Chưa khai báo'],['Loại khoản vay',r.kind==='short'?'Ngắn hạn':result.kind==='compare'?'So sánh hai phương án':'Trung và dài hạn'],['Số tiền / dư nợ đầu kỳ',r.kind==='short'?r.opening:r.principal],['Từ ngày',dateCell(r.start)],['Đến ngày',dateCell(r.end)],['Cơ sở ngày/năm',r.basis]];
 if(r.kind!=='short')info.push(['Thời hạn (tháng)',r.term],['Phương thức',result.kind==='compare'?'A: gốc đều; B: trả góp':methodName(r)]);
 const sections=[{title:'I. Thông tin chung',headers:['Thông tin','Giá trị'],rows:info},
  {title:'II. Thông số tính toán và giả định',headers:['Nội dung'],rows:assumptions.map(x=>[x])},
  {title:'Lịch lãi suất',headers:['Ngày áp dụng','Lãi suất (%/năm)','Ghi chú'],rows:r.rates.map(x=>[dateCell(x.date),rateCell(x.rate),x.note])},
  {title:'III. Kết quả tổng hợp',headers:result.kind==='compare'?['Tiêu chí','A · Gốc đều','B · Trả góp']:['Chỉ tiêu','Kết quả'],rows:summaryRows(result)}];
 if(r.kind==='short')sections.push(
  {title:'IV. Giao dịch làm biến động dư nợ',headers:['Ngày','Giao dịch','Số tiền (VNĐ)','Dư nợ trong ngày (VNĐ)','Ghi chú'],rows:r.transactions.length?r.transactions.map(t=>[dateCell(t.date),t.type==='draw'?'Giải ngân':'Thu nợ gốc',t.amount,t.balance,t.note]):[['Không có giao dịch','','','','']]},
  {title:'Bảng tính lãi chi tiết',headers:['Từ ngày','Đến ngày','Số ngày','Dư nợ (VNĐ)','Lãi suất','Lãi (VNĐ)'],rows:r.segments.map(s=>[dateCell(s.start),dateCell(s.end),s.days,s.balance,rateCell(s.rate),s.interest])},
  {title:'Tổng hợp lãi theo tháng',headers:['Tháng','Số ngày','Lãi (VNĐ)'],rows:r.months.map(m=>[m.month,m.days,m.interest])}
 );
 else for(const [label,v] of result.kind==='compare'?[['A · Gốc đều',result.a],['B · Trả góp',result.b]]:[['',r]]){
  sections.push({title:'IV. Lịch trả nợ '+label,headers:['Kỳ','Ngày đến hạn','Dư nợ đầu kỳ','Gốc trả','Lãi trả','Thanh toán','Dư nợ cuối kỳ'],rows:v.schedule.map(s=>[s.period,dateCell(s.due),s.opening,s.principal,s.interest,s.payment,s.closing])});
  sections.push({title:'Phân đoạn lãi trong kỳ '+label,headers:['Kỳ','Từ ngày','Đến ngày','Số ngày','Dư nợ','Lãi suất'],rows:v.schedule.flatMap(s=>s.parts.map(p=>[s.period,dateCell(p.start),dateCell(p.end),p.days,p.balance,rateCell(p.rate)]))});
 }
 return {result,info,assumptions,sections,date:now,note:REPORT_NOTE};
}
export const REPORT_CSS=`
*{box-sizing:border-box}body{margin:0;color:#193748;background:#eaf1f5;font:12px/1.45 Arial,sans-serif}button{font:inherit;padding:10px 20px;background:#005993;color:white;border:0;border-radius:6px}.report-toolbar{position:sticky;top:0;padding:12px;text-align:center;background:white}.report-page{width:210mm;min-height:297mm;margin:12px auto;padding:14mm 12mm 18mm;background:white;position:relative;overflow-wrap:anywhere}.report-head{display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #005993;padding-bottom:10px;margin-bottom:14px;color:#005993}.report-head img{width:165px;max-height:60px;object-fit:contain}.report-head strong{font-size:14px}.report-page h1{font-size:20px;text-align:center;margin:14px 0}.report-page h2{font-size:13px;margin:14px 0 6px;color:#005993}.report-page table{width:100%;table-layout:fixed;border-collapse:collapse;font-size:12px}.report-page th,.report-page td{border:1px solid #d5e3ec;padding:6px;vertical-align:top;overflow-wrap:anywhere}.report-page th{background:#e7f4fc;text-align:left;color:#005993}.report-page .num{text-align:right;white-space:normal;font-variant-numeric:tabular-nums}.report-page tr{break-inside:avoid}.report-page thead{display:table-header-group}.report-page .note{font-size:10px;margin:12px 0}.report-sign{display:grid;grid-template-columns:1fr 1fr;text-align:center;min-height:85px;margin-top:16px}.report-foot{position:absolute;bottom:9mm;left:12mm;right:12mm;font-size:10px;color:#516d7c;display:flex;justify-content:space-between;border-top:1px solid #d5e3ec;padding-top:6px}@page{size:A4;margin:0}@media print{body{background:white}.report-toolbar{display:none!important}.report-page{margin:0;min-height:297mm;height:297mm;break-after:page;box-shadow:none}.report-page:last-child{break-after:auto}}@media screen and (max-width:820px){.report-page{width:100%;min-height:unset;padding:20px 12px 50px}.report-page table{font-size:10px}}`;
export function reportBody(model,options={}) {
 // Conservative pagination repeats headings and table headers on every page.
 const pages=[], budget=56; let content='',used=5;
 const flush=()=>{if(content){pages.push(content);content='';used=0;}};
 for(const section of model.sections){
  const n=section.headers.length, widths=n===7?[5,13,17,16,15,17,17]:Array(n).fill(100/n);
  const unitsOf=row=>Math.max(...row.map((v,i)=>Math.ceil(cellText(v).length/Math.max(9,Math.floor(115*widths[i]/100)))))+1;
  const wholeUnits=4+section.rows.reduce((sum,row)=>sum+unitsOf(row),0);
  if(section.rows.length<=12&&used>0&&used+wholeUnits>budget)flush();
  const head='<colgroup>'+widths.map(w=>'<col style="width:'+w+'%">').join('')+'</colgroup><thead><tr>'+section.headers.map(h=>'<th>'+escapeHtml(h)+'</th>').join('')+'</tr></thead>';
  let rows='',units=4;
  const emit=()=>{if(rows){content+='<h2>'+escapeHtml(section.title)+'</h2><table>'+head+'<tbody>'+rows+'</tbody></table>';used+=units;rows='';units=4;}};
  for(const row of section.rows){
   const rowUnits=unitsOf(row);
   if(used+units+rowUnits>budget){emit();flush();}
   rows+='<tr>'+row.map(v=>'<td'+(typeof v==='bigint'||typeof v==='number'?' class="num"':'')+'>'+escapeHtml(cellText(v))+'</td>').join('')+'</tr>';units+=rowUnits;
  }
  emit();
 }
 if(used+10>budget)flush();
 content+='<h2>V. Xác nhận</h2><div class="report-sign"><div><strong>NGƯỜI LẬP BÁO CÁO</strong><p>'+escapeHtml(model.result.meta.author||'')+'</p></div><div><strong>NGƯỜI KIỂM TRA</strong></div></div><p class="note">'+escapeHtml(model.note)+'</p>';
 flush();
 return pages.map((page,i)=>'<section class="report-page"><header class="report-head">'+(options.logo?'<img src="'+escapeHtml(options.logo)+'" alt="VietinBank Chi nhánh Tây Tiền Giang">':'<strong>VietinBank<br>Chi nhánh Tây Tiền Giang</strong>')+'<span>Ngày lập: '+escapeHtml(model.date)+'</span></header>'+(i===0?'<h1>BÁO CÁO TÍNH LÃI VAY</h1>':'')+page+'<footer class="report-foot"><span>Kết quả tham khảo · '+escapeHtml(model.result.meta.reference||'')+'</span><span>Trang '+(i+1)+' / '+pages.length+'</span></footer></section>').join('');
}
export function reportHtml(model,options={}) {
 return '<!doctype html><html lang="vi"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Báo cáo tính lãi vay</title><style>'+(options.fontCss||'')+REPORT_CSS.replace('Arial,sans-serif','VTBBannerGilroy,Arial,sans-serif')+'</style></head><body><div class="report-toolbar"><button onclick="window.print()">In / Lưu PDF</button></div>'+reportBody(model,options)+'</body></html>';
}
export function reportSheets(model){
 const r=model.result,base=r.kind==='compare'?r.a:r;
 const details=model.sections.filter(s=>/^(IV\.|Bảng tính|Phân đoạn)/.test(s.title));
 const sheets=[{name:'Thong tin khoan vay',rows:[['THÔNG TIN KHOẢN VAY'],...model.info,[],['QUY ƯỚC'],...model.assumptions.map(x=>[x]),[],[model.note]]}];
 if(base.kind==='short')sheets.push({name:'Giai ngan thu no',rows:[['Ngày','Loại','Số tiền','Dư nợ trong ngày','Ghi chú'],...base.transactions.map(t=>[dateCell(t.date),t.type==='draw'?'Giải ngân':'Thu nợ gốc',t.amount,t.balance,t.note])]});
 sheets.push({name:'Lai suat',rows:[['Ngày áp dụng','Lãi suất','Ghi chú'],...base.rates.map(x=>[dateCell(x.date),rateCell(x.rate),x.note])]});
 details.filter(s=>!/^IV\. Giao/.test(s.title)).forEach((s,i)=>sheets.push({name:(base.kind==='short'?'Tinh lai chi tiet':i===0?'Lich tra no A':i===1?'Chi tiet lai A':i===2?'Lich tra no B':'Chi tiet lai B'),rows:[s.headers,...s.rows]}));
 sheets.push({name:'Tong hop ket qua',rows:[model.sections.find(s=>s.title.startsWith('III.')).headers,...summaryRows(r),...(base.kind==='short'?[[],['Tháng','Số ngày','Lãi'],...base.months.map(x=>[x.month,x.days,x.interest])]:[])]});
 return sheets;
}
const encoder=new TextEncoder();
function crc32(bytes){let c=-1;for(const b of bytes){c^=b;for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0);}return (c^-1)>>>0;}
function zipStore(files){
 const parts=[],central=[];let offset=0,total=0;
 for(const [name,text]of files){
  const n=encoder.encode(name),b=encoder.encode(text),crc=crc32(b),h=new Uint8Array(30+n.length),v=new DataView(h.buffer);
  v.setUint32(0,0x04034b50,true);v.setUint16(4,20,true);v.setUint16(6,0x800,true);v.setUint32(14,crc,true);v.setUint32(18,b.length,true);v.setUint32(22,b.length,true);v.setUint16(26,n.length,true);h.set(n,30);parts.push(h,b);
  const c=new Uint8Array(46+n.length),cv=new DataView(c.buffer);cv.setUint32(0,0x02014b50,true);cv.setUint16(4,20,true);cv.setUint16(6,20,true);cv.setUint16(8,0x800,true);cv.setUint32(16,crc,true);cv.setUint32(20,b.length,true);cv.setUint32(24,b.length,true);cv.setUint16(28,n.length,true);cv.setUint32(42,offset,true);c.set(n,46);central.push(c);offset+=h.length+b.length;total+=c.length;
 }
 const end=new Uint8Array(22),ev=new DataView(end.buffer);ev.setUint32(0,0x06054b50,true);ev.setUint16(8,files.length,true);ev.setUint16(10,files.length,true);ev.setUint32(12,total,true);ev.setUint32(16,offset,true);
 const output=new Uint8Array(offset+total+22);let at=0;for(const p of [...parts,...central,end]){output.set(p,at);at+=p.length;}return output;
}
const columnName=i=>{let s='';for(let n=i+1;n;n=Math.floor((n-1)/26))s=String.fromCharCode(65+(n-1)%26)+s;return s;};
export function xlsxBytes(model){
 const sheets=reportSheets(model),xml=escapeHtml,ns='http://schemas.openxmlformats.org/spreadsheetml/2006/main';
 const dateBase=day('1900-01-01')-1,leapBoundary=day('1900-03-01');
 const files=[['[Content_Types].xml','<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'+sheets.map((s,i)=>'<Override PartName="/xl/worksheets/sheet'+(i+1)+'.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>').join('')+'</Types>'],
 ['_rels/.rels','<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'],
 ['xl/workbook.xml','<workbook xmlns="'+ns+'" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>'+sheets.map((s,i)=>'<sheet name="'+xml(s.name)+'" sheetId="'+(i+1)+'" r:id="rId'+(i+1)+'"/>').join('')+'</sheets><calcPr calcId="191029" fullCalcOnLoad="1"/></workbook>'],
 ['xl/_rels/workbook.xml.rels','<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+sheets.map((s,i)=>'<Relationship Id="rId'+(i+1)+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet'+(i+1)+'.xml"/>').join('')+'<Relationship Id="rId'+(sheets.length+1)+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'],
 ['xl/styles.xml','<styleSheet xmlns="'+ns+'"><numFmts count="3"><numFmt numFmtId="164" formatCode="#,##0"/><numFmt numFmtId="165" formatCode="dd/mm/yyyy"/><numFmt numFmtId="166" formatCode="0.00##%"/></numFmts><fonts count="2"><font><sz val="11"/><name val="Arial"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Arial"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF005993"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="5"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"><alignment wrapText="1" vertical="top"/></xf><xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="165" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="166" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0"><alignment wrapText="1"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>']];
 for(const [i,s]of sheets.entries()){
  const data=s.rows.map((row,ri)=>'<row r="'+(ri+1)+'">'+row.map((v,ci)=>{
   const ref=columnName(ci)+(ri+1);let style=ri===0?4:0,num=null;
   if(typeof v==='bigint'){if(v>999999999999999n)throw new Error('Giá trị báo cáo vượt 15 chữ số chính xác của Excel. Giảm quy mô khoản vay để xuất XLSX chính xác đến đồng.');num=v.toString();style=1;}
   else if(typeof v==='number'){if(!Number.isFinite(v))throw new Error('Báo cáo có dữ liệu số không hợp lệ.');num=String(v);style=1;}
   else if(v&&typeof v==='object'&&'date'in v){num=String(v.date-dateBase+(v.date>=leapBoundary?1:0));style=2;}
   else if(v&&typeof v==='object'&&'rate'in v){num=String(Number(v.rate)/1000000);style=3;}
   return num!==null?'<c r="'+ref+'" s="'+style+'"><v>'+num+'</v></c>':'<c r="'+ref+'" t="inlineStr" s="'+style+'"><is><t xml:space="preserve">'+xml(v)+'</t></is></c>';
  }).join('')+'</row>').join('');
  files.push(['xl/worksheets/sheet'+(i+1)+'.xml','<worksheet xmlns="'+ns+'"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols><col min="1" max="1" width="26" customWidth="1"/><col min="2" max="12" width="24" customWidth="1"/></cols><sheetData>'+data+'</sheetData><pageMargins left="0.25" right="0.25" top="0.5" bottom="0.5" header="0.2" footer="0.2"/><pageSetup paperSize="9" orientation="landscape" fitToWidth="1" fitToHeight="0"/></worksheet>']);
 }
 return zipStore(files);
}
