import {shortTerm,longTerm,compare,formatMoney,formatNumber,formatDate,formatRate,rateInput,iso,money} from './engine.mjs';
import {escapeHtml,buildReport,summaryRows,reportHtml,xlsxBytes,REPORT_NOTE} from './reports.mjs';
let instanceSequence=0;
const blankShort=()=>({name:'',reference:'',author:'',opening:'',rate:'',start:'',end:'',basis:'365',transactions:[],rates:[]});
const blankLong=()=>({name:'',reference:'',author:'',principal:'',rate:'',start:'',term:'',dueDay:'1',firstDue:'',firstPrincipal:'1',basis:'365',promoMonths:'0',afterRate:'',method:'equal',rates:[]});
const exampleShort=()=>({name:'Ví dụ · Vay ngắn hạn',reference:'VI-DU',author:'',opening:'500.000.000',rate:'8',start:'2026-11-01',end:'2026-11-30',basis:'365',transactions:[{date:'2026-11-05',type:'draw',amount:'200.000.000',note:'Bổ sung vốn'},{date:'2026-11-15',type:'repay',amount:'300.000.000',note:'Thu nợ'},{date:'2026-11-25',type:'draw',amount:'100.000.000',note:'Giải ngân thêm'}],rates:[]});
const exampleLong=()=>({name:'Ví dụ · Phương án vay 60 tháng',reference:'VI-DU',author:'',principal:'1.000.000.000',rate:'6,5',start:'2026-11-01',term:'60',dueDay:'1',firstDue:'',firstPrincipal:'1',basis:'365',promoMonths:'6',afterRate:'8,5',method:'equal',rates:[{date:'2028-11-01',rate:'9',note:'Từ tháng 25 · giả định'}]});
const stateTemplate=()=>({result:null,dirty:true,error:'',message:'',page:0,example:false,confirmed:false});
export function mountLoanCalculator(host,options={}) {
 const uid='loan-'+(++instanceSequence),eh=escapeHtml;
 host.classList.add('lc-app');
 let active=options.initialTab||'short',drafts={short:blankShort(),long:blankLong()},states={short:stateTemplate(),long:stateTemplate(),compare:stateTemplate()},observer;
 const current=()=>states[active],data=()=>drafts[active==='short'?'short':'long'];
 const button=(text,action,primary=false,extra='')=>'<button type="button" class="lc-button cursor-interaction '+(primary?'lc-primary':'')+'" data-lc-action="'+action+'" '+extra+'>'+text+'</button>';
 const field=(label,key,type='text',extra='')=>'<label class="lc-field" for="'+uid+'-'+key+'"><span>'+label+'</span><input id="'+uid+'-'+key+'" name="'+key+'" data-lc-field="'+key+'" type="'+type+'" value="'+eh(data()[key])+'" '+extra+'></label>';
 const select=(label,key,values)=>'<label class="lc-field" for="'+uid+'-'+key+'"><span>'+label+'</span><select id="'+uid+'-'+key+'" data-lc-field="'+key+'">'+values.map(([value,text])=>'<option value="'+value+'" '+(data()[key]===String(value)?'selected':'')+'>'+text+'</option>').join('')+'</select></label>';
 const moneyField=(label,key)=>field(label,key,'text','inputmode="numeric" data-lc-money maxlength="23" placeholder="VD: 500.000.000"');
 const rateField=(label,key)=>field(label,key,'text','inputmode="decimal" maxlength="9" placeholder="VD: 7,50"');
 function commonFields(){return '<div class="lc-grid">'+field('Tên khách hàng / phương án *','name','text','maxlength="160" autocomplete="off"')+field('Mã tham chiếu (không bắt buộc)','reference','text','maxlength="80" autocomplete="off"')+'</div>';}
 function InterestRateSchedule(){
  const d=data();return '<details class="lc-expand" '+(d.rates.length?'open':'')+'><summary>Điều chỉnh lãi suất <span>'+d.rates.length+' mốc</span></summary><p class="lc-small">Mốc có hiệu lực từ đầu ngày. Mỗi ngày chỉ giữ một mức điều chỉnh; các mức tương lai là giả định.</p><div class="lc-events">'+d.rates.map((r,i)=>'<div class="lc-event lc-rate-row">'+rowField('Ngày áp dụng','date',r.date,'date','rates',i)+rowField('Lãi suất (%/năm)','rate',r.rate,'text','rates',i,'inputmode="decimal" maxlength="9"')+rowField('Ghi chú','note',r.note,'text','rates',i,'maxlength="120"')+button('Xóa','remove-rate',false,'data-index="'+i+'" aria-label="Xóa mốc lãi suất '+(i+1)+'"')+'</div>').join('')+'</div>'+button('+ Thêm mốc lãi suất','add-rate')+'</details>';
 }
 function rowField(label,key,value,type,collection,index,extra=''){
  const id=uid+'-'+collection+'-'+index+'-'+key;
  return '<label class="lc-field" for="'+id+'"><span>'+label+'</span><input id="'+id+'" type="'+type+'" data-lc-row="'+collection+'" data-index="'+index+'" data-key="'+key+'" value="'+eh(value)+'" '+extra+'></label>';
 }
 function TransactionTable(){
  const d=data(),s=current(),r=s.dirty?null:s.result;
  return '<details class="lc-expand" '+(d.transactions.length?'open':'')+'><summary>Giải ngân và thu nợ gốc <span>'+d.transactions.length+' giao dịch</span></summary><p class="lc-small">Giao dịch có hiệu lực đầu ngày; các giao dịch cùng ngày được gộp trước khi tính lãi.</p><div class="lc-events">'+d.transactions.map((t,i)=>{
   const balance=r?.transactions.find(x=>iso(x.date)===t.date)?.balance;
   return '<div class="lc-event lc-transaction">'+rowField('Ngày giao dịch','date',t.date,'date','transactions',i)+'<label class="lc-field" for="'+uid+'-tx-type-'+i+'"><span>Loại giao dịch</span><select id="'+uid+'-tx-type-'+i+'" data-lc-row="transactions" data-index="'+i+'" data-key="type"><option value="draw" '+(t.type==='draw'?'selected':'')+'>Giải ngân</option><option value="repay" '+(t.type==='repay'?'selected':'')+'>Thu nợ gốc</option></select></label>'+rowField('Số tiền (VNĐ)','amount',t.amount,'text','transactions',i,'inputmode="numeric" data-lc-money maxlength="23"')+rowField('Ghi chú','note',t.note,'text','transactions',i,'maxlength="120"')+button('Xóa','remove-tx',false,'data-index="'+i+'" aria-label="Xóa giao dịch '+(i+1)+'"')+(balance!==undefined?'<p class="lc-row-balance">Dư nợ trong ngày: '+formatMoney(balance)+'</p>':'')+'</div>';
  }).join('')+'</div>'+button('+ Thêm giao dịch','add-tx')+'</details>';
 }
 function ShortTermCalculator(){
  return commonFields()+'<div class="lc-grid lc-three">'+moneyField('Dư nợ đầu kỳ (VNĐ) *','opening')+rateField('Lãi suất ban đầu (%/năm) *','rate')+select('Cơ sở ngày/năm','basis',[[365,'365 ngày'],[360,'360 ngày · theo thỏa thuận']])+field('Ngày bắt đầu *','start','date')+field('Ngày kết thúc *','end','date')+field('Người lập báo cáo','author','text','maxlength="120" autocomplete="off"')+'</div>'+TransactionTable()+InterestRateSchedule();
 }
 function LongTermCalculator(){
  const d=data();return commonFields()+'<div class="lc-grid lc-three">'+moneyField('Số tiền vay (VNĐ) *','principal')+field('Ngày giải ngân *','start','date')+field('Thời hạn vay (1–480 tháng) *','term','number','min="1" max="480" step="1" inputmode="numeric"')+rateField('Lãi suất ban đầu (%/năm) *','rate')+select('Cơ sở ngày/năm','basis',[[365,'365 ngày'],[360,'360 ngày · theo thỏa thuận']])+field('Ngày trả nợ định kỳ (1–31) *','dueDay','number','min="1" max="31" step="1" inputmode="numeric"')+(active==='compare'?'':select('Phương thức trả nợ','method',[['equal','Trả gốc đều · lãi giảm dần'],['annuity','Trả góp · thanh toán gần như đều']]))+'</div><details class="lc-expand" '+(d.promoMonths!=='0'||d.firstDue||d.firstPrincipal!=='1'?'open':'')+'><summary>Ưu đãi và lịch trả nợ <span>Tùy chỉnh</span></summary><div class="lc-grid lc-three">'+field('Số tháng ưu đãi','promoMonths','number','min="0" max="480" step="1" inputmode="numeric"')+rateField('Lãi suất sau ưu đãi (%/năm)','afterRate')+field('Ngày trả kỳ đầu (để trống: tự tính)','firstDue','date')+field('Bắt đầu trả gốc từ kỳ','firstPrincipal','number','min="1" max="480" step="1" inputmode="numeric"')+field('Người lập báo cáo','author','text','maxlength="120" autocomplete="off"')+'</div><p class="lc-small">Kỳ đầu mặc định thuộc tháng sau giải ngân. Tháng thiếu ngày trả nợ sẽ dùng ngày cuối tháng. Gốc trả cuối ngày đến hạn; lãi suất sau ưu đãi là giả định dự phóng.</p></details>'+InterestRateSchedule();
 }
 function table(headers,rows,caption=''){
  return '<div class="lc-table-wrap"><table><caption>'+caption+'</caption><thead><tr>'+headers.map(h=>'<th scope="col">'+h+'</th>').join('')+'</tr></thead><tbody>'+rows.map(row=>'<tr>'+row.map((v,i)=>'<td'+(typeof v==='bigint'?' class="lc-num"':'')+'>'+eh(typeof v==='bigint'?formatNumber(v):v)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';
 }
 function LoanSummary(r){
  if(r.kind==='compare')return table(['Tiêu chí','A · Gốc đều','B · Trả góp'],summaryRows(r),'So sánh trên cùng thông số · Đơn vị tiền: VNĐ');
  return '<div class="lc-summary">'+summaryRows(r).map(([k,v])=>'<div class="lc-stat '+(/lãi|thanh toán/i.test(k)?'lc-emphasis':'')+'"><span>'+k+'</span><strong>'+eh(typeof v==='bigint'?formatMoney(v):String(v))+'</strong></div>').join('')+'</div>';
 }
 const pagination=total=>'<div class="lc-pagination">'+button('Trước','prev-page',false,current().page===0?'disabled':'')+'<span>Trang '+(current().page+1)+' / '+Math.ceil(total/12)+'</span>'+button('Tiếp','next-page',false,(current().page+1)*12>=total?'disabled':'')+'</div>';
 function RepaymentSchedule(r){
  const p=current().page*12;
  if(r.kind==='short')return '<h4>Chi tiết tính lãi</h4>'+table(['Từ ngày','Đến ngày','Ngày','Dư nợ (VNĐ)','Lãi suất','Lãi (VNĐ)'],r.segments.slice(p,p+12).map(s=>[formatDate(s.start),formatDate(s.end),s.days,s.balance,formatRate(s.rate),s.interest]),'Lãi theo từng khoảng có cùng dư nợ và lãi suất')+pagination(r.segments.length)+'<h4>Tổng hợp theo tháng</h4>'+table(['Tháng','Số ngày','Lãi (VNĐ)'],r.months.map(x=>[x.month,x.days,x.interest]),'Tổng lãi đã phân bổ làm tròn đến đồng');
  if(r.kind==='compare')return '<h4>Thanh toán theo kỳ</h4>'+table(['Kỳ','Ngày đến hạn','A · Gốc đều (VNĐ)','B · Trả góp (VNĐ)'],r.a.schedule.slice(p,p+12).map((s,i)=>[s.period,formatDate(s.due),s.payment,r.b.schedule[p+i].payment]),'Cùng ngày đến hạn, cùng biểu lãi suất')+pagination(r.a.schedule.length);
  return '<h4>Lịch trả nợ</h4>'+table(['Kỳ','Ngày đến hạn','Dư nợ đầu kỳ','Gốc trả','Lãi trả','Thanh toán','Dư nợ cuối kỳ'],r.schedule.slice(p,p+12).map(s=>[s.period,formatDate(s.due),s.opening,s.principal,s.interest,s.payment,s.closing]),'Đơn vị tiền: VNĐ · Đã đối chiếu tổng gốc, tổng lãi và dư nợ cuối kỳ')+pagination(r.schedule.length)+'<details class="lc-expand"><summary>Phân đoạn lãi của các kỳ đang xem</summary>'+table(['Kỳ','Từ ngày','Đến ngày','Số ngày','Dư nợ (VNĐ)','Lãi suất'],r.schedule.slice(p,p+12).flatMap(s=>s.parts.map(x=>[s.period,formatDate(x.start),formatDate(x.end),x.days,x.balance,formatRate(x.rate)])),'Áp dụng mức lãi suất có hiệu lực cho từng khoảng')+'</details>';
 }
 function comparisonNote(r){
  const d=r.a.interest-r.b.interest;
  return d===0n?'Hai phương án có tổng lãi bằng nhau theo các giả định đã nhập.':(d<0n?'Phương án A':'Phương án B')+' có tổng lãi thấp hơn '+formatMoney(d<0n?-d:d)+'. Thanh toán kỳ đầu của A là '+formatMoney(r.a.firstPayment)+', của B là '+formatMoney(r.b.firstPayment)+'. Cần xem dòng tiền và khả năng trả nợ trước khi lựa chọn.';
 }
 function ReportExporter(){
  const s=current(),blocked=options.restricted||!s.result||s.dirty||s.error||(s.example&&!s.confirmed);
  return '<section class="lc-export"><h4>Xuất báo cáo tính lãi vay</h4><div class="lc-actions">'+button('In / Lưu PDF','pdf',false,(blocked?'disabled ':'')+'data-lc-export')+button('Xuất Excel (.xlsx)','xlsx',false,(blocked?'disabled ':'')+'data-lc-export')+button('Xuất HTML','html',false,(blocked?'disabled ':'')+'data-lc-export')+button('Xem bản in','printview',false,(blocked?'disabled ':'')+'data-lc-export')+'</div><p class="lc-small">'+(options.restricted?'Bản xem trong hội thoại hỗ trợ tính toán. Để tải báo cáo hoặc In / Lưu PDF, mở bản HTML độc lập trong gói công cụ.':'Báo cáo lấy toàn bộ dữ liệu đã tính, kể cả các kỳ không nằm ở trang đang xem. In / Lưu PDF mở giao diện in A4 riêng; chọn Lưu dưới dạng PDF trong hộp thoại in.')+'</p></section>';
 }
 function resultsMarkup(){
  const s=current();if(!s.result)return '<div class="lc-empty"><strong>Kết quả tính toán</strong><p>Nhập thông tin và chọn Tính toán, hoặc chọn Xem ví dụ để thử công cụ.</p></div>';
  const r=s.result;
  return '<section class="lc-result '+(s.dirty?'lc-stale':'')+'" aria-label="Kết quả tính lãi"><div class="lc-result-heading"><h3>Kết quả '+(r.kind==='compare'?'so sánh':'tính toán')+'</h3><span class="lc-badge">'+(s.dirty?'Chưa cập nhật':'Đã đối chiếu')+'</span></div>'+LoanSummary(r)+(r.kind==='compare'?'<p class="lc-comparison-note">'+eh(comparisonNote(r))+'</p><div class="lc-chart" role="img" aria-label="Biểu đồ thanh toán từng kỳ của phương án A và B"></div>':'')+(r.kind==='long'&&r.method==='annuity'?'<p class="lc-small">PMT mục tiêu theo lãi suất năm/12; lãi phải trả tính theo ngày thực tế. Tính lại PMT tại kỳ có đổi lãi suất, dùng mức lãi suất tại ngày đến hạn. Kỳ cuối điều chỉnh để tất toán.</p>':'')+RepaymentSchedule(r)+ReportExporter()+'</section>';
 }
 function render(){
  observer?.disconnect();
  const s=current();
  host.innerHTML='<header class="lc-heading"><span class="lc-eyebrow">CÔNG CỤ TÀI CHÍNH</span><h2>Tính lãi vay & lập phương án trả nợ</h2><p>Tính lãi theo dư nợ thực tế, lập lịch trả nợ và so sánh phương án.</p></header><nav class="lc-tabs" aria-label="Chọn công cụ tính lãi">'+[['short','Vay ngắn hạn'],['long','Vay trung & dài hạn'],['compare','So sánh phương án']].map(([id,text])=>'<button type="button" class="cursor-interaction" data-lc-tab="'+id+'" aria-pressed="'+(active===id)+'">'+text+'</button>').join('')+'</nav><div class="lc-tab-description">'+(active==='short'?'Quản lý nhiều lần giải ngân, thu nợ và thay đổi lãi suất trong một kỳ.':active==='long'?'Lập lịch đến 480 tháng, hỗ trợ ưu đãi và điều chỉnh lãi suất giữa kỳ.':'So sánh gốc đều và trả góp bằng cùng thông số của tab Vay trung & dài hạn.')+'</div><section class="lc-form" aria-label="Thông tin khoản vay"><div class="lc-section-top"><h3>Thông tin tính toán</h3><div class="lc-actions">'+button('Xem ví dụ','example')+button('Làm mới dữ liệu','reset')+'</div></div>'+(s.example?'<div class="lc-example"><strong>Đang sử dụng dữ liệu ví dụ</strong><label><input type="checkbox" data-lc-confirm '+(s.confirmed?'checked':'')+'> Xác nhận dùng bộ thông số này để xuất báo cáo</label></div>':'')+(active==='short'?ShortTermCalculator():LongTermCalculator())+'<details class="lc-conventions"><summary>Quy ước tính và làm tròn</summary><p>Tính cả ngày bắt đầu và ngày kết thúc. Lãi tính theo số ngày lịch thực tế, mặc định cơ sở 365 ngày/năm; chọn 360 khi phù hợp thỏa thuận sản phẩm. Lãi không làm tròn từng ngày; tổng lãi làm tròn half-up đến đồng và phân bổ cộng dồn để các bảng khớp nhau. Gốc trả cuối ngày đến hạn và giảm dư nợ từ ngày tiếp theo.</p></details><div class="lc-calculate">'+button('Tính toán','calculate',true)+'<span>Tính trực tiếp trên thiết bị · Không gửi dữ liệu khách hàng ra ngoài</span></div></section><div class="lc-status" role="status" aria-live="polite"></div><div class="lc-error" role="alert" '+(s.error?'':'hidden')+'>'+eh(s.error)+'</div><div class="lc-results">'+resultsMarkup()+'</div><p class="lc-disclaimer">'+REPORT_NOTE+'</p>';
  refreshStatus();drawChart();
  const chart=host.querySelector('.lc-chart');if(chart){observer=new ResizeObserver(drawChart);observer.observe(chart);}
 }
 function refreshStatus(){
  const s=current(),status=host.querySelector('.lc-status');if(!status)return;
  status.textContent=s.dirty&&s.result?'Dữ liệu đã thay đổi. Vui lòng tính toán lại trước khi xuất báo cáo.':s.message;
  status.classList.toggle('lc-warning',!!(s.dirty&&s.result));
  for(const b of host.querySelectorAll('[data-lc-export]'))b.disabled=!!(options.restricted||!s.result||s.dirty||s.error||(s.example&&!s.confirmed));
  host.querySelector('.lc-result')?.classList.toggle('lc-stale',s.dirty);
  const badge=host.querySelector('.lc-badge');if(badge)badge.textContent=s.dirty?'Chưa cập nhật':'Đã đối chiếu';
 }
 function markDirty(){
  for(const key of active==='short'?['short']:['long','compare']){states[key].dirty=true;states[key].error='';states[key].message='';}
  const error=host.querySelector('.lc-error');if(error)error.hidden=true;
  refreshStatus();
 }
 function onInput(e){
  const el=e.target;if(el.hasAttribute('data-lc-confirm')){current().confirmed=el.checked;if(active!=='short')states[active==='long'?'compare':'long'].confirmed=el.checked;refreshStatus();return;}
  if(el.dataset.lcField){data()[el.dataset.lcField]=el.value;markDirty();}
  else if(el.dataset.lcRow){data()[el.dataset.lcRow][Number(el.dataset.index)][el.dataset.key]=el.value;markDirty();}
 }
 function onBlur(e){
  const el=e.target;if(!el.hasAttribute('data-lc-money')||!el.value)return;
  try{el.value=formatNumber(money(el.value));if(el.dataset.lcField)data()[el.dataset.lcField]=el.value;else if(el.dataset.lcRow)data()[el.dataset.lcRow][Number(el.dataset.index)][el.dataset.key]=el.value;}catch{}
 }
 function download(bytes,mime,name){
  const blob=new Blob([bytes],{type:mime}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;host.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
 }
 function exportReport(action){
  const s=current();if(options.restricted)throw new Error('Mở bản HTML độc lập để xuất báo cáo.');
  if(!s.result||s.dirty||s.error)throw new Error('Vui lòng tính toán lại trước khi xuất báo cáo.');
  if(s.example&&!s.confirmed)throw new Error('Vui lòng xác nhận sử dụng bộ dữ liệu ví dụ cho báo cáo.');
  const model=buildReport(s.result),html=()=>reportHtml(model,{logo:options.logo,fontCss:options.fontCss});
  if(action==='xlsx')download(xlsxBytes(model),'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','Bao-cao-tinh-lai-vay.xlsx');
  else if(action==='html')download(html(),'text/html;charset=utf-8','Bao-cao-tinh-lai-vay.html');
  else {
   const w=window.open('','_blank');if(!w)throw new Error('Trình duyệt đang chặn cửa sổ in. Cho phép cửa sổ bật lên hoặc xuất HTML rồi mở file và chọn In / Lưu PDF.');
   w.opener=null;w.document.open();w.document.write(html());w.document.close();
   if(action==='pdf')Promise.all([w.document.fonts?.ready||Promise.resolve(),...[...w.document.images].map(i=>i.decode().catch(()=>{}))]).then(()=>w.print());
  }
  s.message=action==='pdf'?'Đã mở báo cáo A4. Chọn máy in hoặc Lưu dưới dạng PDF.':action==='printview'?'Đã mở bản in A4 ở cửa sổ riêng.':'Đã tạo báo cáo '+(action==='xlsx'?'Excel hợp lệ (.xlsx).':'HTML độc lập.');refreshStatus();
 }
 function onClick(e){
  const tab=e.target.closest('[data-lc-tab]');if(tab){active=tab.dataset.lcTab;render();return;}
  const b=e.target.closest('[data-lc-action]');if(!b||b.disabled)return;
  const a=b.dataset.lcAction,s=current(),d=data();
  try{
   if(a==='calculate'){
    const r=active==='short'?shortTerm(d):active==='long'?longTerm(d):compare(d);
    if(d.transactions)d.transactions.sort((x,y)=>x.date.localeCompare(y.date));d.rates.sort((x,y)=>x.date.localeCompare(y.date));
    s.result=r;s.dirty=false;s.error='';s.page=0;s.message='Đã tính toán và đối chiếu số liệu thành công.';render();
   }else if(a==='example'||a==='reset'){
    const key=active==='short'?'short':'long';drafts[key]=a==='example'?(key==='short'?exampleShort():exampleLong()):(key==='short'?blankShort():blankLong());
    for(const k of key==='short'?['short']:['long','compare']){states[k]=stateTemplate();states[k].example=a==='example';}
    render();
   }else if(a==='add-tx'){if(d.transactions.length>=1000)throw new Error('Tối đa 1.000 giao dịch.');d.transactions.push({date:'',type:'draw',amount:'',note:''});markDirty();render();}
   else if(a==='add-rate'){if(d.rates.length>=1000)throw new Error('Tối đa 1.000 mốc lãi suất.');d.rates.push({date:'',rate:'',note:''});markDirty();render();}
   else if(a==='remove-tx'||a==='remove-rate'){d[a==='remove-tx'?'transactions':'rates'].splice(Number(b.dataset.index),1);markDirty();render();}
   else if(a==='prev-page'||a==='next-page'){s.page+=a==='prev-page'?-1:1;host.querySelector('.lc-results').innerHTML=resultsMarkup();drawChart();refreshStatus();}
   else if(['pdf','xlsx','html','printview'].includes(a))exportReport(a);
  }catch(error){s.error=error instanceof Error?error.message:'Không thể thực hiện. Vui lòng kiểm tra dữ liệu.';s.message='';render();}
 }
 function drawChart(){
  const el=host.querySelector('.lc-chart'),r=current().result;if(!el||r?.kind!=='compare')return;
  const style=getComputedStyle(el),w=Math.max(240,el.clientWidth-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight)),h=240,left=62,right=14,top=20,bottom=38,max=Math.max(...r.a.schedule.map(x=>Number(x.payment)),...r.b.schedule.map(x=>Number(x.payment)),1)*1.12;
  const x=i=>left+(w-left-right)*(r.a.term===1?0.5:i/(r.a.term-1)),y=v=>h-bottom-(h-bottom-top)*v/max;
  const points=rows=>rows.map((p,i)=>x(i).toFixed(1)+','+y(Number(p.payment)).toFixed(1)).join(' ');
  let axes='';for(let i=0;i<4;i++){const v=max*i/3,py=y(v);axes+='<line x1="'+left+'" y1="'+py+'" x2="'+(w-right)+'" y2="'+py+'" stroke="#dce9f1"/><text x="'+(left-7)+'" y="'+(py+4)+'" text-anchor="end">'+new Intl.NumberFormat('vi-VN',{maximumFractionDigits:1}).format(v/1000000)+'</text>';}
  const ticks=[...new Set([0,Math.floor((r.a.term-1)/2),r.a.term-1])];
  axes+=ticks.map(i=>'<text x="'+x(i)+'" y="'+(h-13)+'" text-anchor="middle">Kỳ '+(i+1)+'</text>').join('');
  el.innerHTML='<div class="lc-chart-heading"><h4>Thanh toán theo kỳ</h4><span>Triệu VNĐ</span></div><svg viewBox="0 0 '+w+' '+h+'" role="img" aria-label="Đường xanh: gốc đều; đường đỏ nét đứt: trả góp"><title>Nghĩa vụ thanh toán theo kỳ</title>'+axes+'<polyline fill="none" stroke="#005993" stroke-width="2" points="'+points(r.a.schedule)+'"/><polyline fill="none" stroke="#D71249" stroke-width="2" stroke-dasharray="5 3" points="'+points(r.b.schedule)+'"/>'+(r.a.term===1?'<circle cx="'+x(0)+'" cy="'+y(Number(r.a.schedule[0].payment))+'" r="3" fill="#005993"/><circle cx="'+x(0)+'" cy="'+y(Number(r.b.schedule[0].payment))+'" r="3" fill="#D71249"/>':'')+'</svg><div class="lc-legend"><span><i></i>A · Gốc đều</span><span><i></i>B · Trả góp</span></div>';
 }
 host.addEventListener('input',onInput);host.addEventListener('change',onInput);host.addEventListener('focusout',onBlur);host.addEventListener('click',onClick);render();
 return ()=>{observer?.disconnect();host.removeEventListener('input',onInput);host.removeEventListener('change',onInput);host.removeEventListener('focusout',onBlur);host.removeEventListener('click',onClick);host.innerHTML='';};
}
