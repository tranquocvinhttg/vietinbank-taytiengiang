// Source: https://phuongtranttg82-maker.github.io/tinh-lai-VTBTTG/
// Calculation expressions and original sample values are preserved.
export function mountDepositCalculator(host){
  host.innerHTML="<div class=\"dc-app\"><header class=\"dc-heading\"><h2>Tính lãi tiền gửi</h2><p>Tính tiền lãi theo phương thức lĩnh lãi hoặc so sánh cầm cố sổ với rút trước hạn.</p></header><div class=\"dc-tabs\" id=\"tabBar\" role=\"tablist\" aria-label=\"Công cụ tiền gửi\"></div><div>\n  <!-- TAB 1: TÍNH LÃI TIẾT KIỆM -->\n  <section class=\"panel\" id=\"panel-tietkiem\" data-deposit-panel=\"tietkiem\" role=\"tabpanel\">\n    <div class=\"wrap\">\n      <div class=\"card\">\n        <h2>Thông tin tiền gửi</h2>\n        <p class=\"sample\">Số liệu mẫu, nhập số liệu thực tế để tính.</p>\n        <div class=\"field\">\n          <label for=\"t1-amount\">Số tiền gửi</label>\n          <div class=\"input-wrap\"><input id=\"t1-amount\" inputmode=\"numeric\" autocomplete=\"off\" value=\"100.000.000\"><span class=\"unit\">đ</span></div>\n        </div>\n        <div class=\"row2\">\n          <div class=\"field\">\n            <label for=\"t1-rate\">Lãi suất cuối kỳ</label>\n            <div class=\"input-wrap\"><input id=\"t1-rate\" inputmode=\"decimal\" autocomplete=\"off\" value=\"5,0\"><span class=\"unit\">%/năm</span></div>\n          </div>\n          <div class=\"field\">\n            <label for=\"t1-start\">Ngày gửi</label>\n            <div class=\"input-wrap\"><input id=\"t1-start\" type=\"date\"></div>\n            <span class=\"hint\" id=\"t1-start-txt\"></span>\n          </div>\n        </div>\n        <div class=\"field\">\n          <span class=\"lbl\">Kỳ hạn (tháng)</span>\n          <div class=\"chips\" id=\"t1-terms\" role=\"radiogroup\" aria-label=\"Kỳ hạn\"></div>\n        </div>\n      </div>\n      <div class=\"card\" id=\"t1-result\" aria-live=\"polite\"></div>\n    </div>\n  </section>\n\n  <!-- TAB 2: CẦM CỐ HAY RÚT TRƯỚC HẠN -->\n  <section class=\"panel\" id=\"panel-camco\" data-deposit-panel=\"camco\" role=\"tabpanel\" hidden>\n    <div class=\"wrap\">\n      <div class=\"card\">\n        <h2>Thông tin sổ tiết kiệm</h2>\n        <p class=\"sample\">Số liệu mẫu, nhập số liệu thực tế để so sánh.</p>\n        <div class=\"field\">\n          <label for=\"t2-amount\">Số tiền trên sổ</label>\n          <div class=\"input-wrap\"><input id=\"t2-amount\" inputmode=\"numeric\" autocomplete=\"off\" value=\"200.000.000\"><span class=\"unit\">đ</span></div>\n        </div>\n        <div class=\"row2\">\n          <div class=\"field\">\n            <label for=\"t2-rate\">Lãi suất sổ</label>\n            <div class=\"input-wrap\"><input id=\"t2-rate\" inputmode=\"decimal\" autocomplete=\"off\" value=\"5,0\"><span class=\"unit\">%/năm</span></div>\n          </div>\n          <div class=\"field\">\n            <label for=\"t2-start\">Ngày gửi</label>\n            <div class=\"input-wrap\"><input id=\"t2-start\" type=\"date\"></div>\n            <span class=\"hint\" id=\"t2-start-txt\"></span>\n          </div>\n        </div>\n        <div class=\"field\">\n          <span class=\"lbl\">Kỳ hạn sổ (tháng)</span>\n          <div class=\"chips\" id=\"t2-terms\" role=\"radiogroup\" aria-label=\"Kỳ hạn sổ\"></div>\n          <span class=\"hint\" id=\"t2-maturity\"></span>\n        </div>\n      </div>\n      <div class=\"card\">\n        <h2>Nhu cầu cần tiền</h2>\n        <div class=\"row2\">\n          <div class=\"field\">\n            <label for=\"t2-need\">Ngày cần tiền</label>\n            <div class=\"input-wrap\"><input id=\"t2-need\" type=\"date\"></div>\n            <span class=\"hint\" id=\"t2-need-txt\"></span>\n          </div>\n          <div class=\"field\">\n            <label for=\"t2-repay\">Ngày dự kiến trả nợ</label>\n            <div class=\"input-wrap\"><input id=\"t2-repay\" type=\"date\"></div>\n            <span class=\"hint\" id=\"t2-repay-txt\"></span>\n          </div>\n        </div>\n        <div class=\"field\">\n          <label for=\"t2-loan\">Số tiền cần vay</label>\n          <div class=\"input-wrap\"><input id=\"t2-loan\" inputmode=\"numeric\" autocomplete=\"off\" value=\"200.000.000\"><span class=\"unit\">đ</span></div>\n          <span class=\"hint\">Tối đa 100% số tiền trên sổ.</span>\n        </div>\n      </div>\n      <div id=\"t2-result\" aria-live=\"polite\"></div>\n    </div>\n  </section>\n</div>\n\n<details class=\"dc-rules\"><summary>Quy ước tính từ công cụ gốc</summary><p>Lãi tính theo số ngày thực tế trên cơ sở 365 ngày/năm. Ngày đáo hạn là cùng ngày của tháng hết hạn; nếu tháng đó không có ngày tương ứng thì lấy ngày cuối tháng.</p><p>So sánh cầm cố sử dụng lãi không kỳ hạn 0,2%/năm; lãi vay bằng lãi suất sổ cộng 2%/năm, tối thiểu 8%/năm; số tiền vay tối đa 100% số tiền trên sổ. Thời hạn vay không vượt ngày đáo hạn sổ.</p><p>Phương án rút trước hạn trong công cụ gốc tính tất toán toàn bộ sổ. Lãi suất quy đổi lĩnh trước và định kỳ, điều kiện kỳ hạn và lịch lĩnh lãi được giữ theo công cụ gốc.</p></details><footer class=\"dc-disclaimer\">Kết quả mang tính tham khảo. Lãi suất và điều kiện áp dụng theo quy định của VietinBank tại thời điểm giao dịch. Các lãi suất nhập sẵn là số liệu mẫu.<br><a class=\"dc-source\" href=\"https://phuongtranttg82-maker.github.io/tinh-lai-VTBTTG/\" target=\"_blank\" rel=\"noopener noreferrer\">Xem công cụ gốc</a></footer></div>";

/* ===== CẤU HÌNH (sửa tại đây khi quy định thay đổi) ===== */
const CONFIG = {
  terms: [1,2,3,4,5,6,7,8,9,10,11,12,24,36],   // kỳ hạn (tháng)
  lsKhongKyHan: 0.2,    // %/năm, áp dụng khi rút trước hạn
  bienDoVay: 2,         // %/năm, cộng thêm vào lãi suất sổ
  lsVayToiThieu: 8,     // %/năm
  tyLeVayToiDa: 100,    // % số tiền trên sổ
  coSoNgay: 365
};
/* Quy đổi lãi suất theo file QUY_DOI_TINH_LS_HUY_DONG (CV 4277/CV-NHCT3)
   r = LS cuối kỳ (%/năm), n = kỳ hạn (tháng), i = r/12 (LS tháng), k = số tháng mỗi kỳ lĩnh lãi
   - Lĩnh trước : 100*i/(1+n*i)*12
   - Định kỳ k  : 100*((1+n*i)^(k/n) - 1)/k*12   (k=1: hàng tháng; k=3: hàng quý; k=6: 6 tháng) */
const RATE = {
  truoc : (r,n)   => { const i = r/100/12; return 100*i/(1+n*i)*12; },
  dinhKy: (r,n,k) => { const i = r/100/12; return 100*(Math.pow(1+n*i, k/n) - 1)/k*12; }
};
/* Các phương thức lĩnh lãi. period: 0 = lĩnh trước, 'n' = cuối kỳ, số = số tháng mỗi kỳ.
   Định kỳ chỉ áp dụng khi kỳ hạn >= minTerm và chia hết cho period (theo bảng quy đổi). */
const METHODS = [
  {key:'truoc', name:'Lĩnh lãi trước',           minTerm:1,  period:0,   rate:(r,n)=>RATE.truoc(r,n)},
  {key:'cuoiky',name:'Lĩnh lãi cuối kỳ',         minTerm:1,  period:'n', rate:(r)=>r},
  {key:'thang', name:'Lĩnh lãi hàng tháng',      minTerm:2,  period:1,   rate:(r,n)=>RATE.dinhKy(r,n,1)},
  {key:'q3',    name:'Lĩnh lãi định kỳ 3 tháng', minTerm:6,  period:3,   rate:(r,n)=>RATE.dinhKy(r,n,3)},
  {key:'q6',    name:'Lĩnh lãi định kỳ 6 tháng', minTerm:12, period:6,   rate:(r,n)=>RATE.dinhKy(r,n,6)}
];
// Lịch lĩnh lãi: mỗi kỳ tính theo số ngày thực tế/365, mốc kỳ = cùng ngày của tháng thứ k, 2k...
function schedule(m, P, r, n, start, end){
  const rate = m.rate(r,n), d = CONFIG.coSoNgay;
  if(m.period === 0){ const days = daysBetween(start,end); return {rate, rows:[{no:1, date:start, days, amt:P*rate/100*days/d}]}; }
  const k = m.period === 'n' ? n : m.period, rows = [];
  for(let j=1; j<=n/k; j++){
    const a = addMonths(start,k*(j-1)), b = addMonths(start,k*j), days = daysBetween(a,b);
    rows.push({no:j, date:b, days, amt:P*rate/100*days/d});
  }
  return {rate, rows};
}
function applicable(m, n){
  if(n < m.minTerm) return `Áp dụng kỳ hạn từ ${m.minTerm} tháng`;
  if(typeof m.period === 'number' && m.period > 1 && n % m.period) return `Kỳ hạn phải là bội số của ${m.period} tháng`;
  return '';
}
/* Danh sách tab: thêm tab mới = thêm 1 dòng + 1 <section data-tab="..."> */
const TABS = [
  {id:'tietkiem', label:'Tính lãi tiết kiệm'},
  {id:'camco',    label:'Cầm cố hay rút trước hạn'}
];

/* ===== Tiện ích ===== */
const $ = id => host.querySelector("#"+id);
const nf2 = new Intl.NumberFormat('vi-VN',{minimumFractionDigits:2,maximumFractionDigits:2});
const nf0 = new Intl.NumberFormat('vi-VN',{maximumFractionDigits:0});
const money = v => nf2.format(v) + ' đ';
const rate4 = v => new Intl.NumberFormat('vi-VN',{minimumFractionDigits:4,maximumFractionDigits:4}).format(v) + '%/năm';
const pct = v =>new Intl.NumberFormat('vi-VN',{maximumFractionDigits:3}).format(v) + '%/năm';
const parseMoney = s => Number(String(s).replace(/\D/g,'')) || 0;
const parseRate  = s => { const v = parseFloat(String(s).replace(/\s/g,'').replace(',','.')); return isFinite(v) ? v : 0; };
const pad = n => String(n).padStart(2,'0');
const fmtDate = d => `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()}`;
const toInput = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const fromInput = v => { if(!v) return null; const [y,m,d] = v.split('-').map(Number); return new Date(y,m-1,d); };
const today = () => { const t = new Date(); return new Date(t.getFullYear(),t.getMonth(),t.getDate()); };
const addDays = (d,n) => new Date(d.getFullYear(),d.getMonth(),d.getDate()+n);
// Đáo hạn: cùng ngày của tháng thứ n; nếu tháng đó không có ngày này thì lấy ngày cuối tháng
function addMonths(d,n){ const y=d.getFullYear(), m=d.getMonth()+n, last=new Date(y,m+1,0).getDate(); return new Date(y,m,Math.min(d.getDate(),last)); }
const daysBetween = (a,b) => Math.round((Date.UTC(b.getFullYear(),b.getMonth(),b.getDate()) - Date.UTC(a.getFullYear(),a.getMonth(),a.getDate()))/864e5);

// Ô nhập tiền: tự thêm dấu chấm phân cách
function bindMoney(el, cb){
  el.addEventListener('input', () => { const v = parseMoney(el.value); el.value = v ? nf0.format(v) : ''; cb(); });
}
function buildTerms(box, name, def, cb){
  box.innerHTML = CONFIG.terms.map(t => `<label class="chip cursor-interaction"><input type="radio" name="${name}" value="${t}" ${t===def?'checked':''}><span>${t}</span></label>`).join('');
  box.addEventListener('change', cb);
}
const termOf = name => Number(host.querySelector(`input[name="${name}"]:checked`)?.value || 0);
function showDate(inp, txt){ const d = fromInput(inp.value); $(txt).textContent = d ? fmtDate(d) : ''; return d; }

/* ===== Tabs ===== */
function selectTab(id){
  TABS.forEach(t => {
    $('btn-'+t.id).setAttribute('aria-selected', t.id===id);
    host.querySelector(`[data-deposit-panel="${t.id}"]`).setAttribute('aria-labelledby','btn-'+t.id);
    host.querySelector(`[data-deposit-panel="${t.id}"]`).hidden = t.id!==id;
  });
  try{ localStorage.setItem('vtb-deposit:tab', id); }catch(e){}
}
$('tabBar').innerHTML = TABS.map(t => `<button class="tab-btn cursor-interaction" type="button" role="tab" id="btn-${t.id}" aria-controls="panel-${t.id}">${t.label}</button>`).join('');
TABS.forEach(t => $('btn-'+t.id).addEventListener('click', () => selectTab(t.id)));

/* ===== TAB 1 ===== */
function calcTab1(){
  const P = parseMoney($('t1-amount').value), r = parseRate($('t1-rate').value), n = termOf('t1term');
  const start = showDate($('t1-start'),'t1-start-txt'), box = $('t1-result');
  if(!P || !r || !start){ box.innerHTML = `<h2>Kết quả</h2><div class="err" role="alert">Nhập số tiền gửi, lãi suất và ngày gửi để xem tiền lãi.</div>`; return; }
  const end = addMonths(start,n), days = daysBetween(start,end);
  let lck = 0;
  const rows = METHODS.map(m => {
    const why = applicable(m,n);
    if(why) return `<div class="item"><div class="name"><span>${m.name}</span><small>${why}</small></div><span class="pill na">Không áp dụng</span></div>`;
    const s = schedule(m,P,r,n,start,end), total = s.rows.reduce((t,x)=>t+x.amt,0);
    if(m.key==='cuoiky') lck = total;
    const when = m.period===0 ? `nhận ngày ${fmtDate(start)}` : m.period==='n' ? `nhận ngày ${fmtDate(end)}` : `${s.rows.length} kỳ`;
    const detail = s.rows.length > 1 ? `<details><summary>Xem lịch lĩnh lãi</summary><div class="sched-wrap"><table class="sched">
        <thead><tr><th>Kỳ</th><th>Ngày lĩnh</th><th>Số ngày</th><th>Tiền lãi</th></tr></thead>
        <tbody>${s.rows.map(x=>`<tr><td>${x.no}</td><td>${fmtDate(x.date)}</td><td>${x.days}</td><td>${nf2.format(x.amt)}</td></tr>`).join('')}</tbody></table></div></details>` : '';
    return `<div class="item"><div class="name"><span>${m.name}</span><small>LS ${rate4(s.rate)} · ${when}</small></div><span class="money">${money(total)}</span>${detail}</div>`;
  }).join('');
  box.innerHTML = `
    <h2>Tiền lãi theo phương thức lĩnh lãi</h2>
    <div class="meta">
      <div><small>Kỳ hạn</small><b>${n} tháng</b></div>
      <div><small>Đáo hạn</small><b>${fmtDate(end)}</b></div>
      <div><small>Số ngày</small><b>${days} ngày</b></div>
    </div>
    <div class="list">${rows}</div>
    <div class="total"><span>Gốc + lãi cuối kỳ</span><b>${money(P+lck)}</b></div>`;
}

/* ===== TAB 2 ===== */
function calcTab2(){
  const P = parseMoney($('t2-amount').value), r = parseRate($('t2-rate').value), n = termOf('t2term');
  const start = showDate($('t2-start'),'t2-start-txt'), need = showDate($('t2-need'),'t2-need-txt'), repay = showDate($('t2-repay'),'t2-repay-txt');
  let L = parseMoney($('t2-loan').value); const box = $('t2-result');
  const end = start ? addMonths(start,n) : null;
  $('t2-maturity').textContent = end ? `Ngày đáo hạn: ${fmtDate(end)} (${daysBetween(start,end)} ngày)` : '';
  const err = m => box.innerHTML = `<div class="err" role="alert">${m}</div>`;
  if(!P || !r || !start || !need || !repay) return err('Nhập đủ số tiền, lãi suất và các ngày để so sánh.');
  if(need <= start || need >= end) return err(`Ngày cần tiền phải sau ngày gửi (${fmtDate(start)}) và trước ngày đáo hạn (${fmtDate(end)}).`);
  if(repay <= need) return err('Ngày dự kiến trả nợ phải sau ngày cần tiền.');
  if(repay > end)  return err(`Thời hạn vay không vượt quá thời hạn còn lại của sổ. Ngày trả nợ muộn nhất: ${fmtDate(end)}.`);
  const maxLoan = P*CONFIG.tyLeVayToiDa/100;
  if(!L) return err('Nhập số tiền cần vay.');
  if(L > maxLoan) return err(`Số tiền vay tối đa là ${money(maxLoan)} (${CONFIG.tyLeVayToiDa}% số tiền trên sổ).`);

  // Phương án A: rút trước hạn, hưởng lãi không kỳ hạn trên số ngày đã gửi
  const daysHeld = daysBetween(start,need);
  const laiKKH = P*CONFIG.lsKhongKyHan/100*daysHeld/CONFIG.coSoNgay;
  // Phương án B: cầm cố, giữ sổ đến hạn, trả lãi vay
  const fullDays = daysBetween(start,end);
  const laiCK = P*r/100*fullDays/CONFIG.coSoNgay;
  const rv = Math.max(r + CONFIG.bienDoVay, CONFIG.lsVayToiThieu);
  const loanDays = daysBetween(need,repay);
  const laiVay = L*rv/100*loanDays/CONFIG.coSoNgay;
  const netA = laiKKH, netB = laiCK - laiVay, diff = netB - netA;
  // Hòa vốn: số ngày vay để lãi vay = phần lãi giữ được nhờ không rút
  const perDay = L*rv/100/CONFIG.coSoNgay, beDays = Math.floor((laiCK - laiKKH)/perDay), maxDays = daysBetween(need,end);
  const bWin = diff > 0, aWin = diff < 0;

  const verdict = diff === 0
    ? `<div class="verdict"><h3>Hai phương án tương đương</h3></div>`
    : `<div class="verdict"><span class="tag">Phương án có lợi hơn</span>
        <h3>${bWin ? 'Cầm cố sổ tiết kiệm' : 'Rút tiết kiệm trước hạn'}</h3>
        <p>Khách hàng có lợi thêm <b>${money(Math.abs(diff))}</b> so với ${bWin ? 'rút trước hạn' : 'cầm cố sổ'}.</p></div>`;

  const beText = beDays >= maxDays
    ? `Cầm cố vẫn có lợi hơn dù vay đến ngày đáo hạn sổ (${fmtDate(end)}).`
    : beDays <= 0
      ? `Với số tiền vay này, rút trước hạn có lợi hơn ở mọi thời hạn vay.`
      : `Cầm cố có lợi hơn nếu vay không quá <b>${beDays} ngày</b> (trả nợ trước ngày ${fmtDate(addDays(need,beDays+1))}). Vay lâu hơn thì rút trước hạn có lợi hơn.`;

  box.innerHTML = `
    ${verdict}
    <div class="card">
      <h2>So sánh 2 phương án</h2>
      <div class="meta">
        <div><small>Đã gửi</small><b>${daysHeld} ngày</b></div>
        <div><small>Thời gian vay</small><b>${loanDays} ngày</b></div>
        <div><small>LS vay</small><b>${pct(rv)}</b></div>
      </div>
      <div class="compare">
        <div class="opt ${aWin?'win':''}">${aWin?'<span class="win-badge">Có lợi hơn</span>':''}
          <h4>Rút trước hạn</h4>
          <div class="kv"><small>Tiền nhận ngay (gốc + lãi)</small><b>${money(P+laiKKH)}</b></div>
          <div class="kv"><small>Lãi không kỳ hạn ${pct(CONFIG.lsKhongKyHan)}, ${daysHeld} ngày</small><b>${money(laiKKH)}</b></div>
          <div class="kv neg"><small>Lãi bị mất so với giữ đến hạn</small><b>${money(laiCK-laiKKH)}</b></div>
          <div class="kv big"><small>Thu nhập ròng</small><b>${money(netA)}</b></div>
        </div>
        <div class="opt ${bWin?'win':''}">${bWin?'<span class="win-badge">Có lợi hơn</span>':''}
          <h4>Cầm cố sổ</h4>
          <div class="kv"><small>Tiền vay nhận ngay</small><b>${money(L)}</b></div>
          <div class="kv"><small>Lãi sổ nhận khi đáo hạn ${fmtDate(end)}</small><b>${money(laiCK)}</b></div>
          <div class="kv neg"><small>Lãi vay phải trả (${loanDays} ngày)</small><b>${money(laiVay)}</b></div>
          <div class="kv big"><small>Thu nhập ròng</small><b>${money(netB)}</b></div>
        </div>
      </div>
      <p class="note">${beText}</p>
    </div>`;
}

/* ===== Khởi tạo (số liệu mẫu) ===== */
const t0 = today();
$('t1-start').value = toInput(t0);
const s2 = addMonths(t0,-4); $('t2-start').value = toInput(s2);
$('t2-need').value = toInput(t0);
$('t2-repay').value = toInput(addDays(t0,60));
buildTerms($('t1-terms'),'t1term',12,calcTab1);
buildTerms($('t2-terms'),'t2term',12,calcTab2);
bindMoney($('t1-amount'),calcTab1); bindMoney($('t2-amount'),calcTab2); bindMoney($('t2-loan'),calcTab2);
['t1-rate','t1-start'].forEach(id => $(id).addEventListener('input',calcTab1));
['t2-rate','t2-start','t2-need','t2-repay'].forEach(id => $(id).addEventListener('input',calcTab2));
let first = location.hash.slice(1); if(!TABS.some(t=>t.id===first)){ try{ first = localStorage.getItem('vtb-deposit:tab'); }catch(e){ first = null; } }
selectTab(TABS.some(t=>t.id===first) ? first : TABS[0].id);
calcTab1(); calcTab2();

return ()=>{host.innerHTML="";};
}
