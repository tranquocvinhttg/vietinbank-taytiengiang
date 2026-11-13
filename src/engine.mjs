// All money is integer VND (BigInt). Interest is an exact rational numerator.
// Rates have four decimal places in percent; no daily monetary rounding.
export const RATE_SCALE = 1000000n;
const DAY_MS = 86400000;
export const roundHalfUp = (n, d) => {
  if (d <= 0n || n < 0n) throw new Error('Giá trị làm tròn không hợp lệ.');
  return (n * 2n + d) / (2n * d);
};
const fail = message => { throw new Error(message); };
export function money(value, name = 'Số tiền', positive = false) {
  const s = String(value ?? '').trim();
  if (!/^(?:\d+|\d{1,3}(?:\.\d{3})+)$/.test(s)) fail(name + ': nhập số nguyên VNĐ, dùng dấu chấm phân cách hàng nghìn.');
  const n = BigInt(s.replace(/\./g, ''));
  if (n > 999999999999999n || (positive && n === 0n)) fail(name + ': phải ' + (positive ? 'lớn hơn 0 và ' : '') + 'không vượt 999.999.999.999.999 VNĐ.');
  return n;
}
export function rate(value, name = 'Lãi suất') {
  const s = String(value ?? '').trim().replace(',', '.');
  if (!/^\d+(?:\.\d{1,4})?$/.test(s)) fail(name + ': nhập số không âm, tối đa 4 chữ số thập phân.');
  const [a, b = ''] = s.split('.');
  const n = BigInt(a) * 10000n + BigInt(b.padEnd(4, '0'));
  if (n > RATE_SCALE) fail(name + ': giá trị phải từ 0 đến 100%/năm.');
  return n;
}
function integer(value, min, max, name) {
  if (!/^\d+$/.test(String(value ?? ''))) fail(name + ': vui lòng nhập số nguyên.');
  const n = Number(value);
  if (!Number.isSafeInteger(n) || n < min || n > max) fail(name + ': từ ' + min + ' đến ' + max + '.');
  return n;
}
export function day(value, name = 'Ngày') {
  const s = String(value ?? '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) fail(name + ': vui lòng chọn ngày hợp lệ.');
  const [y, m, d] = s.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (y < 1900 || y > 9999 || dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) fail(name + ': ngày không hợp lệ.');
  return Math.floor(dt.getTime() / DAY_MS);
}
export const iso = d => new Date(d * DAY_MS).toISOString().slice(0, 10);
export function addMonths(d, count, wanted) {
  const dt = new Date(d * DAY_MS), y = dt.getUTCFullYear(), m = dt.getUTCMonth();
  const last = new Date(Date.UTC(y, m + count + 1, 0));
  if (last.getUTCFullYear() > 9999) fail('Ngày đáo hạn vượt năm 9999.');
  return Math.floor(Date.UTC(last.getUTCFullYear(), last.getUTCMonth(), Math.min(wanted || dt.getUTCDate(), last.getUTCDate())) / DAY_MS);
}
const monthKey = d => iso(d).slice(0, 7);
const basisOf = value => integer(value, 360, 365, 'Cơ sở ngày tính lãi') === 360 ? 360 : Number(value) === 365 ? 365 : fail('Cơ sở phải là 360 hoặc 365.');
export function normalizeRates(initial, list, start, end, extra = []) {
  const base = rate(initial, 'Lãi suất ban đầu');
  const dates = new Set();
  const changes = [...(list || []), ...extra].map((x, i) => {
    const d = typeof x.date === 'number' ? x.date : day(x.date, 'Mốc lãi suất ' + (i + 1));
    if (d < start || d > end) fail('Mốc lãi suất phải nằm trong thời gian tính lãi.');
    if (dates.has(d)) fail('Lãi suất điều chỉnh bị trùng ngày ' + iso(d) + '. Giữ một mức lãi suất cuối cùng.');
    dates.add(d);
    return {date: d, rate: rate(x.rate, 'Mốc lãi suất ' + (i + 1)), note: String(x.note || '')};
  }).sort((a, b) => a.date - b.date);
  return [{date: start, rate: base, note: 'Lãi suất ban đầu', initial: true}, ...changes];
}
export function rateAt(rates, d) {
  let value = rates[0].rate;
  for (const r of rates) { if (r.date > d) break; value = r.rate; }
  return value;
}
function metadata(input) {
  const name = String(input.name || '').trim();
  if (!name) fail('Vui lòng nhập tên khách hàng hoặc tên phương án vay.');
  for (const [k, max] of [['name', 160], ['reference', 80], ['author', 120]]) if (String(input[k] || '').length > max) fail('Thông tin quá dài. Vui lòng rút gọn.');
  return {name, reference: String(input.reference || ''), author: String(input.author || '')};
}
export function shortTerm(input) {
  const meta = metadata(input), start = day(input.start, 'Ngày bắt đầu'), end = day(input.end, 'Ngày kết thúc');
  if (end < start) fail('Ngày kết thúc phải từ ngày bắt đầu trở đi.');
  if (end - start > 36600) fail('Khoảng tính lãi không được vượt 100 năm.');
  const opening = money(input.opening, 'Dư nợ đầu kỳ'), basis = basisOf(input.basis);
  if ((input.transactions || []).length > 1000 || (input.rates || []).length > 1000) fail('Tối đa 1.000 giao dịch hoặc mốc lãi suất mỗi lần tính.');
  const rates = normalizeRates(input.rate, input.rates, start, end);
  const tx = (input.transactions || []).map((x, i) => {
    const date = day(x.date, 'Ngày giao dịch ' + (i + 1));
    if (date < start || date > end) fail('Giao dịch ' + (i + 1) + ': ngày phải nằm trong kỳ tính lãi.');
    if (!['draw', 'repay'].includes(x.type)) fail('Loại giao dịch không hợp lệ.');
    return {date, type: x.type, amount: money(x.amount, 'Số tiền giao dịch ' + (i + 1), true), note: String(x.note || ''), order: i};
  }).sort((a, b) => a.date - b.date || a.order - b.order);
  const changes = new Map();
  for (const t of tx) changes.set(t.date, (changes.get(t.date) || 0n) + (t.type === 'draw' ? t.amount : -t.amount));
  const cuts = new Set([start, end + 1, ...changes.keys(), ...rates.map(r => r.date)]);
  let m = addMonths(start, 1, 1);
  while (m <= end) { cuts.add(m); m = addMonths(m, 1, 1); }
  const boundaries = [...cuts].sort((a, b) => a - b), denominator = RATE_SCALE * BigInt(basis);
  let balance = opening, totalRaw = 0n, rounded = 0n;
  const segments = [], balances = new Map();
  for (let i = 0; i < boundaries.length - 1; i++) {
    const a = boundaries[i], b = boundaries[i + 1];
    balance += changes.get(a) || 0n;
    if (balance < 0n) fail('Thu nợ vượt dư nợ vào ngày ' + iso(a) + '. Các giao dịch cùng ngày đã được tổng hợp.');
    balances.set(a, balance);
    const activeRate = rateAt(rates, a), days = b - a, raw = balance * activeRate * BigInt(days);
    totalRaw += raw;
    const cumulative = roundHalfUp(totalRaw, denominator), interest = cumulative - rounded;
    rounded = cumulative;
    segments.push({start: a, end: b - 1, days, balance, rate: activeRate, interest, raw});
  }
  const months = new Map();
  for (const s of segments) {
    const key = monthKey(s.start), value = months.get(key) || {month: key, days: 0, interest: 0n};
    value.days += s.days; value.interest += s.interest; months.set(key, value);
  }
  const draw = tx.filter(x => x.type === 'draw').reduce((s, x) => s + x.amount, 0n);
  const repay = tx.filter(x => x.type === 'repay').reduce((s, x) => s + x.amount, 0n);
  if (opening + draw - repay !== balance) fail('Đối chiếu dư nợ không khớp.');
  return {kind: 'short', meta, start, end, basis, opening, draw, repay, closing: balance, days: end - start + 1, interest: rounded, raw: totalRaw, denominator, rates, transactions: tx.map(t => ({...t, balance: balances.get(t.date)})), segments, months: [...months.values()]};
}
export function paymentTarget(principal, annualRate, periods) {
  const n = BigInt(periods);
  if (annualRate === 0n) return roundHalfUp(principal, n);
  const d = RATE_SCALE * 12n, a = (d + annualRate) ** n, b = d ** n;
  return roundHalfUp(principal * annualRate * a, d * (a - b));
}
export function normalizeLong(input) {
  const meta = metadata(input), principal = money(input.principal, 'Số tiền vay', true), start = day(input.start, 'Ngày giải ngân');
  const term = integer(input.term, 1, 480, 'Thời hạn vay'), dueDay = integer(input.dueDay, 1, 31, 'Ngày trả nợ');
  const firstPrincipal = integer(input.firstPrincipal || 1, 1, term, 'Kỳ bắt đầu trả gốc');
  const firstDue = input.firstDue ? day(input.firstDue, 'Ngày trả kỳ đầu') : addMonths(start, 1, dueDay);
  if (firstDue <= start) fail('Ngày trả kỳ đầu phải sau ngày giải ngân.');
  if (firstDue - start > 366) fail('Kỳ đầu không được dài quá 366 ngày.');
  const dueDates = Array.from({length: term}, (_, i) => i ? addMonths(firstDue, i, dueDay) : firstDue);
  const end = dueDates.at(-1), basis = basisOf(input.basis), promo = integer(input.promoMonths || 0, 0, term, 'Số tháng ưu đãi');
  const extra = [];
  if (promo > 0) {
    const change = addMonths(start, promo);
    const newRate = rate(input.afterRate, 'Lãi suất sau ưu đãi');
    if (change <= end) extra.push({date: change, rate: String(newRate / 10000n) + '.' + String(newRate % 10000n).padStart(4, '0'), note: 'Sau thời gian ưu đãi (giả định)'});
  }
  const rates = normalizeRates(input.rate, input.rates, start, end, extra);
  return {meta, principal, start, end, term, dueDay, firstDue, dueDates, firstPrincipal, basis, rates, promo};
}
export function longTerm(input, method = input.method || 'equal') {
  if (!['equal', 'annuity'].includes(method)) fail('Phương thức trả nợ không hợp lệ.');
  const v = normalizeLong(input), denominator = RATE_SCALE * BigInt(v.basis);
  const principalPeriods = v.term - v.firstPrincipal + 1, equalPrincipal = v.principal / BigInt(principalPeriods);
  let balance = v.principal, a = v.start, rawTotal = 0n, rounded = 0n, target = 0n, targetRate = null;
  const schedule = [];
  for (let i = 0; i < v.term; i++) {
    const due = v.dueDates[i], opening = balance, bounds = [a, ...v.rates.filter(r => !r.initial && r.date > a && r.date <= due).map(r => r.date), due + 1];
    const parts = [];
    let periodRaw = 0n;
    for (let j = 0; j < bounds.length - 1; j++) {
      const rateValue = rateAt(v.rates, bounds[j]), days = bounds[j + 1] - bounds[j];
      const raw = balance * rateValue * BigInt(days);
      periodRaw += raw;
      parts.push({start: bounds[j], end: bounds[j + 1] - 1, days, balance, rate: rateValue, raw});
    }
    rawTotal += periodRaw;
    const cumulative = roundHalfUp(rawTotal, denominator), interest = cumulative - rounded;
    rounded = cumulative;
    let principal = 0n;
    if (i + 1 >= v.firstPrincipal) {
      if (method === 'equal') principal = i === v.term - 1 ? balance : equalPrincipal;
      else {
        const r = rateAt(v.rates, due);
        const changed = v.rates.some(x => !x.initial && x.date >= a && x.date <= due);
        if (targetRate !== r || target === 0n || changed) { target = paymentTarget(balance, r, v.term - i); targetRate = r; }
        if (i === v.term - 1) principal = balance;
        else {
          if (interest > target) fail('Kỳ ' + (i + 1) + ': lãi vượt khoản thanh toán mục tiêu. Hãy rút ngắn kỳ đầu, thay ngày trả hoặc điều chỉnh phương án; lịch làm tăng dư nợ không được tạo.');
          principal = target - interest;
          // Keep a positive integer principal for each remaining contractual period.
          if (principal >= balance && balance > BigInt(v.term - i - 1)) principal = balance - BigInt(v.term - i - 1);
          if (principal > balance) principal = balance;
        }
      }
    }
    if (principal > balance || principal < 0n) fail('Khoản gốc trả không hợp lệ.');
    balance -= principal;
    schedule.push({period: i + 1, start: a, due, days: due - a + 1, opening, principal, interest, payment: principal + interest, closing: balance, target: method === 'annuity' ? target : 0n, parts});
    a = due + 1;
  }
  const totalPrincipal = schedule.reduce((s, x) => s + x.principal, 0n), totalPayment = totalPrincipal + rounded;
  if (balance !== 0n || totalPrincipal !== v.principal) fail('Đối chiếu lịch trả gốc không khớp.');
  const maxPayment = schedule.reduce((m, x) => x.payment > m ? x.payment : m, 0n);
  return {...v, kind: 'long', method, denominator, schedule, interest: rounded, raw: rawTotal, totalPrincipal, totalPayment, firstPayment: schedule[0].payment, maxPayment, lastPayment: schedule.at(-1).payment};
}
export function compare(input) {
  return {kind: 'compare', a: longTerm(input, 'equal'), b: longTerm(input, 'annuity'), meta: metadata(input)};
}
export const formatMoney = n => new Intl.NumberFormat('vi-VN').format(n) + ' VNĐ';
export const formatNumber = n => new Intl.NumberFormat('vi-VN').format(n);
export const formatDate = d => { const [y,m,a] = iso(d).split('-'); return a + '/' + m + '/' + y; };
export const formatRate = r => { const s = r.toString().padStart(5, '0'); return s.slice(0,-4) + ',' + s.slice(-4).replace(/00$/, '').padEnd(2,'0') + '%/năm'; };
export const rateInput = r => String(r / 10000n) + ',' + String(r % 10000n).padStart(4, '0').replace(/0+$/, '') .padEnd(2,'0');
