import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {normalizeCatalog,normalizeProduct,safeContentUrl,contentProductVisible,validateContentProduct,scriptSafeJson,embedContentDocument} from '../src/content-core.mjs';
const raw=JSON.parse(fs.readFileSync(new URL('../content/products.json',import.meta.url),'utf8'));
test('catalog keeps every supplied source in its own editable record',()=>{
 const data=normalizeCatalog(raw);assert.equal(data.groups.length,4);assert.equal(data.products.length,15);
 const live=data.products.filter(p=>contentProductVisible(p,'2026-11-13'));assert.equal(live.length,7);assert.equal(live.filter(p=>p.category==='loans').length,4);assert.equal(live.filter(p=>p.category==='savings').length,2);
 assert.equal(data.products.filter(p=>p.sourceStatus==='pending'&&p.visible).length,0);
 assert.match(data.products.find(p=>p.id==='loan-sxkd').notice,/xác nhận/);
});
test('copy and image remain independent through save/import',()=>{
 const item=normalizeProduct(raw.products[0]);const copy=structuredClone(item);copy.summary='Mô tả thay đổi';copy.image='data:image/png;base64,YWJj';copy.gallery=[{src:'https://example.com/2.png',caption:'Ảnh số hai',alt:'Minh họa'}];copy.sections=[{heading:'Hồ sơ',body:'Nội dung mới\nDòng hai'}];
 const restored=normalizeProduct(JSON.parse(JSON.stringify(copy)));assert.equal(restored.title,item.title);assert.equal(restored.summary,'Mô tả thay đổi');assert.equal(restored.image,copy.image);assert.equal(restored.gallery[0].caption,'Ảnh số hai');assert.equal(restored.sections[0].body,copy.sections[0].body);
 restored.image='';assert.equal(restored.summary,'Mô tả thay đổi');
});
test('groups and products can be added beyond the initial set',()=>{
 const data=structuredClone(raw);data.groups.push({id:'new-group',name:'Nhóm mới'});for(let i=0;i<100;i++)data.products.push({id:'more-'+i,category:'new-group',title:'Mục '+i,summary:'Nội dung',sections:Array.from({length:20},(_,j)=>({heading:'Đoạn '+j,body:'Nội dung'}))});
 const normalized=normalizeCatalog(data);assert.equal(normalized.groups.length,5);assert.equal(normalized.products.length,115);assert.equal(normalized.products.at(-1).sections.length,20);
});
test('invalid import rejects duplicate ids and orphan categories',()=>{
 const duplicate=structuredClone(raw);duplicate.products.push(duplicate.products[0]);assert.throws(()=>normalizeCatalog(duplicate),/trùng/);
 const orphan=structuredClone(raw);orphan.products[0].category='missing';assert.throws(()=>normalizeCatalog(orphan),/không tồn tại/);
});
test('visibility uses schedule and reversible archive state',()=>{
 const item=normalizeProduct({...raw.products[0],startDate:'2026-11-13',endDate:'2026-11-14'});assert.equal(contentProductVisible(item,'2026-11-12'),false);assert.equal(contentProductVisible(item,'2026-11-13'),true);assert.equal(contentProductVisible(item,'2026-11-15'),false);item.archived=true;assert.equal(contentProductVisible(item,'2026-11-13'),false);item.archived=false;assert.equal(contentProductVisible(item,'2026-11-13'),true);
});
test('content URLs reject executable and local path inputs',()=>{
 for(const value of ['javascript:alert(1)','data:text/html,<script>alert(1)</script>','http://example.com/x','https://user:pass@example.com/'])assert.equal(safeContentUrl(value),'');
 assert.equal(safeContentUrl('assets/products/../../x.png',true),'');assert.equal(safeContentUrl('data:image/svg+xml,<svg onload="alert(1)">',true),'');assert.equal(safeContentUrl('assets/products/image.png',true),'assets/products/image.png');
});
test('validation catches missing text and inverted dates without mandatory approval gates',()=>{
 const item=normalizeProduct(raw.products[0]);assert.equal(validateContentProduct(item,raw.groups),'');assert.match(validateContentProduct({...item,title:''},raw.groups),/Nhập/);assert.match(validateContentProduct({...item,startDate:'2027-01-01',endDate:'2026-01-01'},raw.groups),/Ngày kết thúc/);
});
test('export escapes script breakers and replaces old snapshots exactly once',()=>{
 const snapshot={schemaVersion:1,title:'</script><img src=x onerror=alert(1)>\u2028'};const json=scriptSafeJson(snapshot);assert.ok(!json.includes('<'));assert.deepEqual(JSON.parse(json),snapshot);
 const html='<!doctype html><html><head><title>App</title></head><body><main>Original</main><script>run()</script></body></html>';
 const first=embedContentDocument(html,snapshot),second=embedContentDocument(first,{...snapshot,title:'Second'});assert.equal((second.match(/id="vtb-content-data"/g)||[]).length,1);assert.ok(second.includes('<main>Original</main>'));assert.ok(second.includes('<script>run()</script>'));
 const embedded=second.match(/id="vtb-content-data" type="application\/json">(.*?)<\/script>/s)[1];assert.equal(JSON.parse(embedded).title,'Second');
});
const Core=await import('../src/content-core.mjs');
const vm=await import('node:vm');
const manager=fs.readFileSync(new URL('../src/content-manager.js',import.meta.url),'utf8');
const prepareSource=manager.slice(manager.indexOf(' const cmsPrepareSnapshot='),manager.indexOf(' const cmsApplySnapshot='));
const siteFixture={header:{logo:'data:image/png;base64,YWJj',hotline:'1900 558 868',apple:'https://apps.apple.com/',android:'https://play.google.com/'},pattern:{variant:'wide',height:12},chatbot:{avatar:'data:image/png;base64,YWJj',greeting:'Chào',enabled:true,lift:18}};
const guideFixture={sample:{title:'Hướng dẫn',tracks:{one:{need:'Cần chuẩn bị',steps:[{h:'Bước 1',d:'Nội dung',tip:''}]}}}};
const prepare=vm.runInNewContext(prepareSource+'\ncmsPrepareSnapshot',{localContent:Core.normalizeLocalContent(JSON.parse(fs.readFileSync(new URL('../content/local.json',import.meta.url),'utf8'))),cmsSafeMedia:Core.safeSiteMedia,ContentCore:Core,site:siteFixture,copy:v=>JSON.parse(JSON.stringify(v)),functions:[{id:'products',name:'Sản phẩm',icon:'folder'},{id:'quick',name:'Tiện ích'}],ipayPublished:guideFixture,URL,Set,Map,Date});
const bannerFixture={mode:'carousel',interval:6,fit:'cover',single:{id:'welcome',kind:'image',name:'Mẫu',data:'data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3C%2Fsvg%3E'},slides:[{id:'saving',kind:'image',name:'Tiết kiệm',data:'data:image/svg+xml;charset=utf-8,%3Csvg%3E%3C%2Fsvg%3E'}]};
test('original encoded SVG banners remain valid through export',()=>{
 const input={schemaVersion:1,catalog:raw,banner:bannerFixture,site:siteFixture};const value=prepare(input);assert.equal(value.banner.single.data,bannerFixture.single.data);assert.equal(value.banner.slides[0].data,bannerFixture.slides[0].data);
 assert.equal(Core.safeSiteMedia('javascript:alert(1)'),'');
});
test('all existing editor draft types and review queues survive a backup round trip',()=>{
 const input={schemaVersion:1,catalog:raw,site:siteFixture,banner:bannerFixture,guides:guideFixture,drafts:{header:siteFixture.header,banner:bannerFixture,'ipay:sample':guideFixture.sample,'product:loan-car':raw.products[1]},queue:[{id:'ipay:sample',label:'Hướng dẫn',value:guideFixture.sample}]};
 const value=prepare(JSON.parse(JSON.stringify(input)));assert.deepEqual(Object.keys(value.drafts).sort(),Object.keys(input.drafts).sort());assert.equal(value.drafts['ipay:sample'].tracks.one.steps[0].d,'Nội dung');assert.equal(value.queue[0].value.title,'Hướng dẫn');assert.equal(value.drafts.banner.single.data,bannerFixture.single.data);
});
test('import catches a broken guide before changing live content',()=>{
 const input={schemaVersion:1,catalog:raw,guides:{sample:{title:'Sai',tracks:{one:{steps:[]}}}}};assert.throws(()=>prepare(input),/Số bước/);assert.equal(guideFixture.sample.tracks.one.steps.length,1);
});
test('self-contained app script survives export and repeated publication byte for byte',()=>{
 const appScript='<script>const cmsOriginalDocument="x";'+embedContentDocument.toString()+'; const LoanCalculator={}; cmsBoot();<\/script>';
 const original='<!doctype html><html><head><title>App</title></head><body>'+appScript+'</body></html>';
 const exported=embedContentDocument(original,{publicationId:'one',title:'abc$&$\u0060$\u0027'}),again=embedContentDocument(exported,{publicationId:'two'});
 assert.ok(exported.endsWith(appScript+'</body></html>'));assert.ok(again.endsWith(appScript+'</body></html>'));assert.equal((again.slice(0,again.indexOf('</head>')).match(/id="vtb-content-data"/g)||[]).length,1);
});
