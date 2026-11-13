// Content is plain text. Images and copy are independent; no HTML is accepted.
export const CONTENT_SCHEMA = 1;
export const textValue = (value, max = 12000) => String(value ?? '').slice(0, max);
export const contentId = value => textValue(value, 90).replace(/[^a-zA-Z0-9_-]/g, '-');
export function safeContentUrl(value, image = false) {
  const s = textValue(value, image ? 20 * 1024 * 1024 : 3000).trim();
  if (!s) return '';
  if (image && /^data:image\/(?:png|jpeg|webp|gif|avif);base64,[A-Za-z0-9+/=\s]+$/.test(s)) return s;
  if (image && /^(?:assets\/(?:products|local)\/)[a-zA-Z0-9_./-]+$/.test(s) && !s.includes('..')) return s;
  try { const url = new URL(s); return url.protocol === 'https:' && !url.username && !url.password ? url.href : ''; } catch { return ''; }
}
export function safeSiteMedia(value) {
  const s = String(value || '');
  return safeContentUrl(s, true) || (/^data:image\/svg\+xml(?:;charset=utf-8)?(?:;base64,|,)/i.test(s) ? s : '') || (/^data:video\/(?:mp4|webm);base64,/i.test(s) ? s : '');
}
export function normalizeGroup(item, index = 0) {
  return { id: contentId(item.id || 'group-' + index), name: textValue(item.name, 100), lead: textValue(item.lead, 400), icon: contentId(item.icon || 'folder'), order: Number(item.order) || index + 1, visible: item.visible !== false };
}
export function normalizeProduct(item, index = 0) {
  return {
    id: contentId(item.id || 'product-' + index), category: contentId(item.category), title: textValue(item.title, 180), summary: textValue(item.summary, 700),
    benefits: (Array.isArray(item.benefits) ? item.benefits : []).map(x => textValue(x, 600)).filter(Boolean),
    eligibility: textValue(item.eligibility), terms: textValue(item.terms), badge: textValue(item.badge, 100), notice: textValue(item.notice, 1200),
    sourceUrl: safeContentUrl(item.sourceUrl), evidenceUrl: safeContentUrl(item.evidenceUrl), sourceNote: textValue(item.sourceNote, 2000),
    image: safeContentUrl(item.image, true), imageAlt: textValue(item.imageAlt || item.title, 300), imageCaption: textValue(item.imageCaption, 600),
    gallery: (Array.isArray(item.gallery) ? item.gallery : []).map(img => ({ src: safeContentUrl(img.src, true), alt: textValue(img.alt, 300), caption: textValue(img.caption, 600) })).filter(img => img.src),
    sections: (Array.isArray(item.sections) ? item.sections : []).map(section => ({ heading: textValue(section.heading, 180), body: textValue(section.body) })),
    order: Number.isFinite(Number(item.order)) ? Number(item.order) : index + 1, visible: item.visible !== false, archived: !!item.archived,
    startDate: /^\d{4}-\d{2}-\d{2}$/.test(item.startDate || '') ? item.startDate : '', endDate: /^\d{4}-\d{2}-\d{2}$/.test(item.endDate || '') ? item.endDate : '',
    checkedAt: /^\d{4}-\d{2}-\d{2}$/.test(item.checkedAt || '') ? item.checkedAt : '', sourceStatus: ['verified', 'reference', 'pending'].includes(item.sourceStatus) ? item.sourceStatus : 'reference'
  };
}
export function normalizeCatalog(data) {
  if (!data || !Array.isArray(data.groups) || !Array.isArray(data.products)) throw new Error('Tệp cần có danh sách groups và products.');
  const groups = data.groups.map(normalizeGroup), products = data.products.map(normalizeProduct);
  if (!groups.length || groups.some(g => !g.id || !g.name)) throw new Error('Mỗi nhóm cần mã và tên.');
  if (new Set(groups.map(g => g.id)).size !== groups.length || new Set(products.map(p => p.id)).size !== products.length) throw new Error('Mã nhóm hoặc sản phẩm bị trùng.');
  if (products.some(p => !groups.some(g => g.id === p.category))) throw new Error('Có sản phẩm thuộc nhóm không tồn tại.');
  return { groups, products };
}
export function contentProductVisible(item, day) {
  return !!item.visible && !item.archived && (!item.startDate || item.startDate <= day) && (!item.endDate || item.endDate >= day);
}
export function validateContentProduct(item, groups) {
  if (!item.title.trim() || !item.summary.trim()) return 'Nhập tên và mô tả ngắn của sản phẩm.';
  if (!groups.some(g => g.id === item.category)) return 'Chọn nhóm sản phẩm hợp lệ.';
  if (item.sourceUrl && !safeContentUrl(item.sourceUrl)) return 'Liên kết nguồn cần bắt đầu bằng https://.';
  if (item.image && !safeContentUrl(item.image, true)) return 'Địa chỉ ảnh không hợp lệ.';
  if (item.startDate && item.endDate && item.startDate > item.endDate) return 'Ngày kết thúc phải bằng hoặc sau ngày bắt đầu.';
  return '';
}
export function normalizePlace(item, index = 0) {
  return {
    id: contentId(item.id || 'place-' + index), category: contentId(item.category), name: textValue(item.name, 180),
    summary: textValue(item.summary, 700), description: textValue(item.description), address: textValue(item.address, 700),
    phone: textValue(item.phone, 30).trim(), hours: textValue(item.hours, 400), offer: textValue(item.offer, 2000),
    mapsUrl: safeContentUrl(item.mapsUrl), facebookUrl: safeContentUrl(item.facebookUrl), websiteUrl: safeContentUrl(item.websiteUrl),
    image: safeContentUrl(item.image, true), imageAlt: textValue(item.imageAlt || item.name, 300), imageCaption: textValue(item.imageCaption, 600),
    gallery: (Array.isArray(item.gallery) ? item.gallery : []).map(img => ({ src: safeContentUrl(img.src, true), alt: textValue(img.alt, 300), caption: textValue(img.caption, 600) })).filter(img => img.src),
    sections: (Array.isArray(item.sections) ? item.sections : []).map(section => ({ heading: textValue(section.heading, 180), body: textValue(section.body) })),
    order: Number.isFinite(Number(item.order)) ? Number(item.order) : index + 1, visible: item.visible === true, archived: !!item.archived,
    startDate: /^\d{4}-\d{2}-\d{2}$/.test(item.startDate || '') ? item.startDate : '', endDate: /^\d{4}-\d{2}-\d{2}$/.test(item.endDate || '') ? item.endDate : ''
  };
}
export function normalizeLocalContent(data) {
  if (!data || !Array.isArray(data.groups) || !Array.isArray(data.places)) throw new Error('Dữ liệu địa phương cần danh sách nhóm và địa điểm.');
  const groups = data.groups.map(normalizeGroup), places = data.places.map(normalizePlace);
  if (!groups.length || groups.some(g => !g.id || !g.name.trim())) throw new Error('Mỗi nhóm địa phương cần có mã và tên.');
  if (new Set(groups.map(g => g.id)).size !== groups.length || new Set(places.map(p => p.id)).size !== places.length) throw new Error('Mã nhóm hoặc địa điểm bị trùng.');
  if (places.some(p => !groups.some(g => g.id === p.category))) throw new Error('Có địa điểm thuộc nhóm không tồn tại.');
  return { title: textValue(data.title, 180).trim() || 'Khám phá địa phương', lead: textValue(data.lead, 1000), groups, places };
}
export function validatePlace(item, groups) {
  if (!item.name.trim() || !item.summary.trim()) return 'Nhập tên địa điểm và mô tả ngắn.';
  if (!groups.some(g => g.id === item.category)) return 'Chọn nhóm địa điểm hợp lệ.';
  if (item.phone && !/^[+0-9 ()-]{6,30}$/.test(item.phone)) return 'Nhập một số điện thoại hợp lệ.';
  for (const [key, label] of [['mapsUrl', 'Google Maps'], ['facebookUrl', 'Facebook'], ['websiteUrl', 'Website']]) {
    if (item[key] && !safeContentUrl(item[key])) return 'Liên kết ' + label + ' cần bắt đầu bằng https://.';
  }
  if (item.image && !safeContentUrl(item.image, true)) return 'Địa chỉ ảnh không hợp lệ.';
  if (item.startDate && item.endDate && item.startDate > item.endDate) return 'Ngày kết thúc phải bằng hoặc sau ngày bắt đầu.';
  return '';
}
export function visiblePlaces(content, day) {
  return content.places.filter(item => contentProductVisible(item, day) && content.groups.some(g => g.id === item.category && g.visible !== false)).sort((a, b) => a.order - b.order || a.name.localeCompare(b.name, 'vi'));
}
export function scriptSafeJson(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
}
export function embedContentDocument(html, snapshot) {
  const headEnd = html.search(/<\/head>/i);
  if (headEnd < 0) throw new Error('Thiếu phần head của trang web.');
  // Only remove actual payload tags from the head. The application script also
  // contains this tag as a string literal and must never be changed by export.
  const cleanHead = html.slice(0, headEnd).replace(/<script\b[^>]*id=["']vtb-content-data["'][^>]*>[\s\S]*?<\/script>\s*/gi, '');
  const tag = '<script id="vtb-content-data" type="application/json">' + scriptSafeJson(snapshot) + '</script>\n';
  return cleanHead + tag + html.slice(headEnd);
}
