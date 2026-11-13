import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as Core from '../src/content-core.mjs';
const initial=JSON.parse(fs.readFileSync(new URL('../content/local.json',import.meta.url),'utf8'));
const catalog=JSON.parse(fs.readFileSync(new URL('../content/products.json',import.meta.url),'utf8'));
const sample=()=>Core.normalizePlace({id:'venue-test',category:'food',name:'Địa điểm kiểm thử',summary:'Giới thiệu ngắn',description:'Nội dung đầy đủ',address:'Địa chỉ mẫu',phone:'0300000000',hours:'08:00–20:00',mapsUrl:'https://maps.app.goo.gl/example',facebookUrl:'https://www.facebook.com/example',image:'data:image/png;base64,YWJj',gallery:[{src:'data:image/png;base64,ZGVm',alt:'Ảnh hai',caption:'Chú thích hai'}],sections:[{heading:'Thông tin thêm',body:'Đoạn có thể thay đổi'}],visible:true});
test('default local page retains real categories and creates no fictitious venues',()=>{
 const data=Core.normalizeLocalContent(initial);assert.equal(data.groups.length,3);assert.equal(data.places.length,0);assert.equal(data.title,'Khám phá địa phương');
});
test('place text, independent images, contact links and added sections round trip',()=>{
 const item=sample(),edited=structuredClone(item);edited.summary='Chỉ đổi chữ';const restored=Core.normalizePlace(JSON.parse(JSON.stringify(edited)));assert.equal(restored.image,item.image);assert.equal(restored.gallery[0].caption,'Chú thích hai');assert.equal(restored.sections[0].body,item.sections[0].body);assert.equal(restored.facebookUrl,item.facebookUrl);
 restored.image='';assert.equal(restored.summary,'Chỉ đổi chữ');assert.equal(restored.address,item.address);
});
test('local category, venue names and description can expand beyond the defaults',()=>{
 const data=structuredClone(initial);data.title='Điểm đến của chúng tôi';data.groups.push({id:'coffee',name:'Cà phê',icon:'coffee'});data.places=Array.from({length:120},(_,i)=>({...sample(),id:'place-'+i,category:'coffee',name:'Địa điểm '+i}));const normalized=Core.normalizeLocalContent(data);assert.equal(normalized.places.length,120);assert.equal(normalized.groups.length,4);assert.equal(normalized.title,data.title);
});
test('visibility respects hidden groups, archives, ordering and schedule boundaries',()=>{
 const data=Core.normalizeLocalContent({...initial,places:[{...sample(),id:'b',order:2},{...sample(),id:'a',order:1,startDate:'2026-11-13',endDate:'2026-11-14'}]});assert.deepEqual(Core.visiblePlaces(data,'2026-11-13').map(p=>p.id),['a','b']);assert.equal(Core.visiblePlaces(data,'2026-11-15').length,1);data.places[0].archived=true;assert.equal(Core.visiblePlaces(data,'2026-11-15').length,0);data.places[0].archived=false;data.groups[0].visible=false;assert.equal(Core.visiblePlaces(data,'2026-11-13').length,0);
});
test('invalid local identifiers, orphan categories and executable URLs are rejected',()=>{
 assert.throws(()=>Core.normalizeLocalContent({...initial,places:[sample(),sample()]}),/trùng/);assert.throws(()=>Core.normalizeLocalContent({...initial,places:[{...sample(),category:'missing'}]}),/không tồn tại/);
 const p=Core.normalizePlace({...sample(),mapsUrl:'javascript:alert(1)',image:'data:text/html,<script>alert(1)</script>'});assert.equal(p.mapsUrl,'');assert.equal(p.image,'');assert.equal(Core.safeContentUrl('assets/local/../../private.png',true),'');assert.equal(Core.safeContentUrl('assets/local/venue.png',true),'assets/local/venue.png');
});
test('saving a place validates required text, phone, link and dates',()=>{
 const p=sample();assert.equal(Core.validatePlace(p,initial.groups),'');assert.match(Core.validatePlace({...p,name:''},initial.groups),/Nhập tên/);assert.match(Core.validatePlace({...p,phone:'invalid'},initial.groups),/điện thoại/);assert.match(Core.validatePlace({...p,facebookUrl:'http://bad.example/'},initial.groups),/https/);assert.match(Core.validatePlace({...p,startDate:'2027-01-01',endDate:'2026-01-01'},initial.groups),/Ngày kết thúc/);
});
const manager=fs.readFileSync(new URL('../src/content-manager.js',import.meta.url),'utf8');
const prepareSource=manager.slice(manager.indexOf(' const cmsPrepareSnapshot='),manager.indexOf(' const cmsApplySnapshot='));
const localFixture=Core.normalizeLocalContent({...initial,places:[sample()]});
const prepare=vm.runInNewContext(prepareSource+'\ncmsPrepareSnapshot',{ContentCore:Core,localContent:localFixture,copy:v=>JSON.parse(JSON.stringify(v)),site:{},functions:[],ipayPublished:{},cmsSafeMedia:Core.safeSiteMedia,URL,Set,Map,Date});
test('backup and export retain local groups, applied places and saved place drafts',()=>{
 const snapshot={schemaVersion:1,catalog,local:{...localFixture,title:'Đã đổi tiêu đề'},drafts:{'place:venue-test':{...sample(),summary:'Bản nháp chưa áp dụng'}}};const restored=prepare(JSON.parse(JSON.stringify(snapshot)));assert.equal(restored.local.title,'Đã đổi tiêu đề');assert.equal(restored.local.places[0].summary,'Giới thiệu ngắn');assert.equal(restored.drafts['place:venue-test'].summary,'Bản nháp chưa áp dụng');assert.equal(restored.local.places[0].image,sample().image);
 const html=Core.embedContentDocument('<html><head></head><body><script>app()</script></body></html>',restored);const data=JSON.parse(html.match(/type="application\/json">(.*?)<\/script>/s)[1]);assert.equal(data.local.places[0].gallery.length,1);assert.equal(data.catalog.products.length,catalog.products.length);
});
test('restoring an older backup preserves the current local content',()=>{
 const restored=prepare({schemaVersion:1,catalog});assert.equal(restored.local.places[0].name,localFixture.places[0].name);assert.equal(restored.local.groups.length,3);assert.equal(restored.catalog.products.length,catalog.products.length);
});
