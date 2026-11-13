 // Browser-local editing; publication is an explicit HTML download for GitHub/Vercel.
 const cmsRevision=document.getElementById('vtb-content-data')?JSON.parse(document.getElementById('vtb-content-data').textContent).publicationId:'__CONTENT_REVISION__';
 const cmsKey='content:'+cmsRevision;
 const cmsUi={message:'Đang mở dữ liệu đã lưu…',savedAt:'',timer:null,ready:false,busy:false};
 let cmsDbPromise=null,cmsPrevious='',cmsPending=false;
 const cmsOpenDb=()=>cmsDbPromise||(cmsDbPromise=new Promise((resolve,reject)=>{
  if(!window.indexedDB){reject(new Error('Trình duyệt không hỗ trợ lưu dữ liệu.'));return}
  const request=indexedDB.open('VietinBankTTGContent',1),timeout=setTimeout(()=>reject(new Error('Không mở được nơi lưu dữ liệu.')),4000);request.onupgradeneeded=()=>request.result.createObjectStore('snapshots');request.onsuccess=()=>{clearTimeout(timeout);resolve(request.result)};request.onerror=()=>{clearTimeout(timeout);reject(request.error)};request.onblocked=()=>{clearTimeout(timeout);reject(new Error('Dữ liệu đang được dùng trong thẻ khác.'))};
 }));
 const cmsDbRead=async()=>{const db=await cmsOpenDb();return new Promise((resolve,reject)=>{const tx=db.transaction('snapshots','readonly'),request=tx.objectStore('snapshots').get(cmsKey);request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error)})};
 const cmsDbWrite=async value=>{const db=await cmsOpenDb();return new Promise((resolve,reject)=>{const tx=db.transaction('snapshots','readwrite');tx.objectStore('snapshots').put(value,cmsKey);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('Không đủ dung lượng lưu trữ.'))})};
 const cmsCapture=(drafts=true)=>({schemaVersion:1,publicationId:cmsRevision,savedAt:new Date().toISOString(),catalog:{groups:copy(productGroups),products:copy(productCatalog.published)},local:copy(localContent),site:copy(site),banner:copy(state.banner),dock:{items:copy(functions),order:[...state.order],hidden:[...state.hidden]},network:copy(network.records),guides:copy(ipayPublished),...(drafts?{drafts:copy(work.drafts),queue:copy(work.queue)}:{})});
 const cmsStatus=message=>{cmsUi.message=message;const status=root.querySelector('[data-cms-status]');if(status)status.textContent=message};
 const cmsSaveNow=async()=>{
  if(!cmsUi.ready)return;
  if(cmsUi.busy){cmsPending=true;return}
  const snapshot=cmsCapture(),fingerprint=JSON.stringify({...snapshot,savedAt:''});if(fingerprint===cmsPrevious)return;
  cmsUi.busy=true;
  try{await cmsDbWrite(snapshot);cmsPrevious=fingerprint;cmsUi.savedAt=snapshot.savedAt;cmsStatus('Đã tự lưu trên trình duyệt này lúc '+new Date(snapshot.savedAt).toLocaleTimeString('vi-VN')+'.')}catch(error){cmsStatus('Không tự lưu được trên trình duyệt này. Hãy tải bản sao JSON trước khi đóng trang.');console.warn('Content save unavailable:',error?.name||'storage')}
  finally{cmsUi.busy=false;if(cmsPending){cmsPending=false;cmsScheduleSave()}}
 };
 const cmsScheduleSave=()=>{if(!cmsUi.ready)return;clearTimeout(cmsUi.timer);cmsUi.timer=setTimeout(cmsSaveNow,450)};
 const cmsSafeMedia=ContentCore.safeSiteMedia;
 const cmsPrepareSnapshot=value=>{
  if(value?.schemaVersion!==1)throw new Error('Phiên bản dữ liệu chưa được hỗ trợ.');
  const normalized={...value,catalog:ContentCore.normalizeCatalog(value.catalog)};
  normalized.local=value.local?ContentCore.normalizeLocalContent(value.local):copy(localContent);
  if(value.site){
   const input=value.site;normalized.site=copy(site);
   for(const key of ['logo']){const image=cmsSafeMedia(input.header?.[key]);if(image)normalized.site.header[key]=image}
   if(/^[+0-9 ()-]{6,24}$/.test(input.header?.hotline||''))normalized.site.header.hotline=input.header.hotline;
   for(const key of ['apple','android']){const url=ContentCore.safeContentUrl(input.header?.[key]);if(url)normalized.site.header[key]=url}
   normalized.site.pattern={variant:input.pattern?.variant==='compact'?'compact':'wide',height:Math.max(8,Math.min(16,Number(input.pattern?.height)||12))};
   if(input.chatbot){const avatar=cmsSafeMedia(input.chatbot.avatar);if(avatar)normalized.site.chatbot.avatar=avatar;normalized.site.chatbot.greeting=String(input.chatbot.greeting||'').slice(0,3000);normalized.site.chatbot.enabled=input.chatbot.enabled!==false;normalized.site.chatbot.lift=Math.max(0,Math.min(120,Number(input.chatbot.lift)||0))}
  }
  if(value.banner){
   const cleanSlide=(item,index)=>{const data=cmsSafeMedia(item?.data);if(!data)throw new Error('Có ảnh hoặc video banner không hợp lệ.');const views={};for(const device of ['desktop','mobile'])if(item.views?.[device]){const view=item.views[device];views[device]={x:Math.max(0,Math.min(100,Number(view.x)||50)),y:Math.max(0,Math.min(100,Number(view.y)||50)),zoom:Math.max(100,Math.min(200,Number(view.zoom)||100)),fit:view.fit==='contain'?'contain':'cover'}}return {id:ContentCore.contentId(item.id||'banner-'+index),name:String(item.name||'Banner').slice(0,180),kind:item.kind==='video'?'video':'image',data,mobileData:cmsSafeMedia(item.mobileData),views}};
   const b=value.banner;if(!Array.isArray(b.slides)||!b.slides.length)throw new Error('Cần có ít nhất một banner.');normalized.banner={mode:b.mode==='single'?'single':'carousel',fit:b.fit==='contain'?'contain':'cover',interval:[4,5,6,8,10].includes(b.interval)?b.interval:6,active:0,single:cleanSlide(b.single,0),slides:b.slides.map(cleanSlide)};
  }
  if(value.dock){const list=value.dock.items;if(!Array.isArray(list))throw new Error('Danh sách nút chức năng không hợp lệ.');const ids=functions.map(f=>f.id),allowed=[...ids,'download','deposit','loan','home'];normalized.dock={items:list.filter(f=>ids.includes(f.id)).map(f=>({id:f.id,name:String(f.name||'').slice(0,100),icon:ContentCore.contentId(f.icon||'folder'),target:allowed.includes(f.target||f.id)?f.target||f.id:f.id})),order:[...new Set((value.dock.order||[]).filter(id=>ids.includes(id)))],hidden:(value.dock.hidden||[]).filter(id=>ids.includes(id))};ids.forEach(id=>{if(!normalized.dock.order.includes(id))normalized.dock.order.push(id)})}
  if(value.network){if(!Array.isArray(value.network))throw new Error('Dữ liệu điểm giao dịch không hợp lệ.');normalized.network=value.network.map(item=>{const p={};for(const key of ['id','kind','name','type','address','ward','hours','services','phone','status','updated'])p[key]=String(item[key]||'').slice(0,1200);p.lat=Number(item.lat);p.lng=Number(item.lng);p.photo=ContentCore.safeContentUrl(item.photo);return p})}
  if(value.guides){normalized.guides={};for(const [id,guide] of Object.entries(value.guides)){const original=ipayPublished[id];if(!original)continue;const tracks={};for(const [key,track] of Object.entries(original.tracks)){const update=guide.tracks?.[key];if(!update||!Array.isArray(update.steps)||update.steps.length!==track.steps.length)throw new Error('Số bước của hướng dẫn '+id+' không khớp.');tracks[key]={need:String(update.need||'').slice(0,4000),steps:update.steps.map(step=>({h:String(step.h||'').slice(0,500),d:String(step.d||'').slice(0,6000),tip:String(step.tip||'').slice(0,3000)}))}}normalized.guides[id]={title:String(guide.title||original.title).slice(0,300),tracks}}}
  const cleanBlock=(key,item)=>{
   if(key.startsWith('product:')){const p=ContentCore.normalizeProduct(item);return normalized.catalog.groups.some(g=>g.id===p.category)?p:null}
   if(key.startsWith('place:')){const p=ContentCore.normalizePlace(item);return normalized.local.groups.some(g=>g.id===p.category)?p:null}
   const base={schemaVersion:1,catalog:normalized.catalog,local:normalized.local};
   if(key.startsWith('ipay:')){const id=key.slice(5);return cmsPrepareSnapshot({...base,guides:{[id]:item}}).guides[id]||null}
   if(key==='network')return cmsPrepareSnapshot({...base,network:item}).network;
   if(key==='banner')return cmsPrepareSnapshot({...base,banner:item}).banner;
   if(key==='dock')return cmsPrepareSnapshot({...base,dock:item}).dock;
   if(['header','pattern','chatbot'].includes(key))return cmsPrepareSnapshot({...base,site:{[key]:item}}).site[key];
   return null;
  };
  normalized.drafts={};if(value.drafts)for(const [key,item] of Object.entries(value.drafts)){const clean=cleanBlock(key,item);if(clean)normalized.drafts[key]=clean}
  normalized.queue=(Array.isArray(value.queue)?value.queue:[]).map(entry=>{const id=String(entry.id||''),clean=cleanBlock(id,entry.value);return clean?{id,label:String(entry.label||id).slice(0,300),value:clean}:null}).filter(Boolean);
  return normalized;
 };
 const cmsApplySnapshot=(data,includeDrafts=true)=>{
  const value=cmsPrepareSnapshot(data);
  productGroups.splice(0,productGroups.length,...value.catalog.groups);productCatalog.published=value.catalog.products;
  Object.assign(localContent,value.local);
  if(value.site){Object.assign(site.header,value.site.header);Object.assign(site.pattern,value.site.pattern);Object.assign(site.chatbot,value.site.chatbot)}
  if(value.banner)state.banner=copy(value.banner);
  if(value.dock){state.order=value.dock.order;state.hidden=new Set(value.dock.hidden);value.dock.items.forEach(item=>Object.assign(functions.find(f=>f.id===item.id),item))}
  if(value.network)network.records=value.network;
  if(value.guides)Object.entries(value.guides).forEach(([id,guide])=>applyIpayContent(id,guide));
  if(includeDrafts){work.drafts=value.drafts;work.queue=value.queue}
  updateProductSearch();updateLocalSearch();applySite();renderDock();lastBannerKey='';renderBanner();
 };
 const cmsDownload=(name,data,type)=>{const url=URL.createObjectURL(new Blob([data],{type})),link=document.createElement('a');link.href=url;link.download=name;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),30000)};
 const cmsAdmin=()=>'<div class="vb-cms-intro"><span class="vb-catalog-group-icon">'+icon('save')+'</span><div><h3>Lưu nội dung và cập nhật website</h3><p>Bản đang biên tập được tự lưu trên trình duyệt này. Để mọi khách truy cập thấy nội dung mới, tải index.html và thay tệp cùng tên trong repository GitHub đang nối với Vercel.</p></div></div><p class="vb-cms-status" role="status" data-cms-status>'+escape(cmsUi.message)+'</p><div class="vb-cms-grid"><section><h4>1. Tạo bản sao để làm tiếp</h4><p>JSON giữ ảnh, chữ, các nhóm sản phẩm, địa điểm khám phá, bản nháp, banner, hướng dẫn và điểm giao dịch. Lưu tệp này trước khi chuyển máy hoặc xóa dữ liệu trình duyệt.</p><button type="button" class="vb-secondary" data-cms-backup>'+icon('download')+'Tải bản sao JSON</button><label class="vb-field">Khôi phục bản sao đã tải<input type="file" accept="application/json,.json" data-cms-import></label></section><section><h4>2. Cập nhật cho mọi người</h4><p>Áp dụng sản phẩm, địa điểm đã hoàn thiện và duyệt các hướng dẫn trước khi xuất. Bản nháp chưa áp dụng không đưa ra website.</p><button type="button" class="vb-primary" data-cms-export>'+icon('file-down')+'Tải index.html để cập nhật GitHub</button><ol><li>Mở repository đang dùng → Add file → Upload files.</li><li>Tải index.html vừa xuất lên thư mục gốc và Commit changes vào nhánh Production.</li><li>Đợi Vercel triển khai thành công, mở lại link website để kiểm tra.</li></ol><p class="vb-help">Tiếp tục dùng cùng dự án và tên miền để giữ link trong QR đã in.</p></section></div><details class="vb-product-source"><summary>Phạm vi lưu và biên tập</summary><p>Ảnh và chữ của sản phẩm, địa điểm được lưu riêng, không giới hạn bốn nhóm có sẵn. Có thể thêm nhóm, sản phẩm, nhiều ảnh và nhiều đoạn nội dung; ẩn, nhân bản, đổi thứ tự và khôi phục mục đã lưu trữ.</p><p>Khám phá địa phương có thể thêm địa điểm và nhóm tùy ý. Các hướng dẫn, điểm giao dịch và trang chủ dùng những mục biên tập tương ứng. Dữ liệu tính lãi và công thức được giữ trong mã nguồn. Website tĩnh không có đăng nhập quản trị hay phân quyền trên máy chủ; thay đổi trên trình duyệt chỉ được đưa lên mạng khi bạn cập nhật tệp website.</p></details>';
 root.addEventListener('click',async event=>{
  const button=event.target.closest('[data-cms-backup],[data-cms-export]');if(!button)return;event.stopImmediatePropagation();if(!cmsUi.ready){cmsStatus('Đang đọc nội dung đã lưu. Vui lòng đợi rồi thử lại.');return}
  try{
   if(button.hasAttribute('data-cms-backup')){cmsDownload('VietinBank_TTG_noi_dung_'+productDay()+'.json',JSON.stringify(cmsCapture(),null,2),'application/json');cmsStatus('Đã tạo bản sao JSON gồm địa điểm và các bản nháp.');return}
   const data=cmsPrepareSnapshot(cmsCapture(false));delete data.drafts;delete data.queue;data.publicationId='vtb-ttg-'+Date.now();data.savedAt=new Date().toISOString();
   const html=ContentCore.embedContentDocument(cmsOriginalDocument,data);cmsDownload('index.html',html,'text/html;charset=utf-8');cmsStatus('Đã tạo index.html. Tải tệp này lên thư mục gốc của repository GitHub đang dùng.');
  }catch(error){cmsStatus(error.message||'Không tạo được tệp. Vui lòng thử lại.')}
 },true);
 root.addEventListener('change',async event=>{
  const input=event.target;if(!input.matches('[data-cms-import]'))return;event.stopImmediatePropagation();const file=input.files?.[0];if(!file)return;
  if(file.size>100*1024*1024){cmsStatus('Bản sao lớn hơn 100 MB. Vui lòng kiểm tra lại tệp.');return}
  try{
   const data=JSON.parse(await file.text()),prepared=cmsPrepareSnapshot(data);cmsDownload('VietinBank_TTG_truoc_khoi_phuc_'+Date.now()+'.json',JSON.stringify(cmsCapture(),null,2),'application/json');cmsApplySnapshot(prepared);productUi.editorId='';productUi.groups=false;localUi.editorId='';localUi.settings=false;localUi.group='all';localUi.selected='';cmsPrevious='';await cmsSaveNow();admin();cmsStatus('Đã khôi phục nội dung. Bản sao trước khôi phục cũng đã được tải để có thể hoàn tác.');
  }catch(error){cmsStatus('Chưa khôi phục: '+(error.message||'Tệp không hợp lệ.'))}
 },true);
 root.addEventListener('input',()=>cmsScheduleSave());
 root.addEventListener('change',()=>{cmsScheduleSave();setTimeout(cmsScheduleSave,1500)});
 root.addEventListener('click',()=>setTimeout(cmsScheduleSave,0),true);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)cmsSaveNow()});
 setInterval(()=>{if(state.view==='admin'&&cmsUi.ready)cmsSaveNow()},5000);
 const cmsBoot=async()=>{
  try{const embedded=document.getElementById('vtb-content-data');if(embedded)cmsApplySnapshot(JSON.parse(embedded.textContent),false)}catch(error){cmsStatus('Không đọc được dữ liệu đã xuất: '+error.message)}
  try{const saved=await cmsDbRead();if(saved){cmsApplySnapshot(saved);cmsUi.savedAt=saved.savedAt;cmsStatus('Đã mở bản biên tập lưu trên trình duyệt này.')}else cmsStatus('Nội dung sẵn sàng. Thay đổi sẽ tự lưu trên trình duyệt này.')}catch{cmsStatus('Trình duyệt không cho tự lưu. Hãy tải bản sao JSON sau khi chỉnh sửa.')}
  finally{cmsUi.ready=true;root.inert=false;cmsScheduleSave();if(state.view==='admin')admin();else if(state.view==='products')renderProducts();else if(state.view==='local')renderLocal()}
 };
