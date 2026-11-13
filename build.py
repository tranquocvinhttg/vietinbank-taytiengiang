from pathlib import Path
import argparse, base64, hashlib, json, mimetypes, re, shutil

P = Path(__file__).resolve().parent
args = argparse.ArgumentParser()
args.add_argument('--base', default=str(P/'reference/website-v12.fragment.html'))
args.add_argument('--inline-output', default=str(P/'reference/website-v13.fragment.html'))
args = args.parse_args()
BASE = Path(args.base)
base = BASE.read_text()
# Refresh the new modules from their editable sources before composing the app.
root_id = re.search(r'<div[^>]+id="(vtb-[^"]+)"', base).group(1)
# Keep the catalog in a plain JSON file and each original image in its own file.
# The deployment HTML embeds them so the downloaded index remains self-contained.
catalog = json.loads((P/'content/products.json').read_text())
local_data = json.loads((P/'content/local.json').read_text())
def embed_images(records, directory):
    for item in records:
        for image in [item] + item.get('gallery', []):
            key = 'image' if image is item else 'src'
            value = image.get(key, '')
            if value.startswith(directory+'/'):
                image_path = (P/value).resolve()
                assert image_path.is_relative_to((P/directory).resolve())
                mime = mimetypes.guess_type(image_path.name)[0]
                image[key] = 'data:'+mime+';base64,'+base64.b64encode(image_path.read_bytes()).decode()
embed_images(catalog['products'], 'assets/products')
embed_images(local_data['places'], 'assets/local')
core = (P/'src/content-core.mjs').read_text()
names = re.findall(r'^export (?:const|function) (\w+)', core, re.M)
core = re.sub(r'^export ', '', core, flags=re.M)
product_bundle = ' const ContentCore=(()=>{\n'+core+'\nreturn {'+','.join(names)+'};\n})();\n'
product_bundle += ' const PRODUCT_DATA='+json.dumps(catalog, ensure_ascii=False).replace('<', '\\u003c')+';\n'
product_bundle += (P/'src/products-ui.js').read_text()
product_bundle += '\n const LOCAL_DATA='+json.dumps(local_data, ensure_ascii=False).replace('<', '\\u003c')+';\n'
product_bundle += (P/'src/local-ui.js').read_text()
product_bundle = product_bundle.replace('</script', '<\\/script')
a = base.index(' const productSeeds=')
b = base.index(' const ipaySource=', a)
base = base[:a]+product_bundle+'\n'+base[b:]
base = base.replace(" const root=document.getElementById('"+root_id+"');", " const root=document.getElementById('"+root_id+"');\n const cmsAppStyles=[...document.querySelectorAll('style')].filter(style=>!document.head.contains(style)&&style.textContent.includes('#'+root.id)).map(style=>style.outerHTML).join('\\n');\n const cmsOriginalDocument='<!doctype html>\\n<html lang=\"vi\">'+document.head.outerHTML+'<body>'+(document.getElementById('vtb-icons')?.outerHTML||'')+cmsAppStyles+root.outerHTML+document.currentScript.outerHTML+'<\\/body><\\/html>';", 1)
base = base.replace("  else if(state.tab==='review')content=reviewEditor();", "  else if(state.tab==='publish')content=cmsAdmin();\n  else if(state.tab==='review')content=reviewEditor();", 1)
a = base.index("  else content='<p class=\"vb-admin-note\">Quản trị chính")
b = base.index('\n  detail.innerHTML=', a)
base = base[:a]+"  else content='<p class=\"vb-admin-note\">Đây là công cụ biên tập nội dung trên thiết bị của bạn. Bản website tĩnh chưa có tài khoản đăng nhập hoặc phân quyền máy chủ. Dùng mục Lưu &amp; xuất bản để sao lưu và cập nhật tệp website.</p>';"+base[b:]
base = base.replace("['roles','Phân quyền']", "['publish','Lưu & xuất bản'],['roles','Thông tin']", 1)
base = base.replace("+icon('eye')+'Bản xem trước</span></div><div class=\"vb-tabs\"", "+icon('pencil')+'Bản biên tập</span></div><div class=\"vb-tabs\"", 1)
base = base.replace('Tất cả thao tác hiện chỉ áp dụng trong bản xem trước.', 'Thay đổi được lưu trên trình duyệt này. Xuất index.html để cập nhật website cho mọi người.')
base = base.replace('Thao tác chỉ áp dụng trong bản xem trước.', 'Lưu và duyệt nội dung, sau đó xuất index.html để cập nhật website.')
base = base.replace("['guides','Hướng dẫn'],['products','Sản phẩm']", "['guides','Hướng dẫn'],['products','Sản phẩm'],['local','Khám phá địa phương']", 1)
base = base.replace("  if(item)return tabs+", "  if(kind==='local')return tabs+localAdmin();\n  if(item)return tabs+", 1)
local_route = "  if(view==='local'){localUi.preview=null;localUi.group='all';localUi.selected='';localUi.query='';renderLocal(locationId);return}\n"
base = base.replace("  if(view==='products'){", local_route+"  if(view==='products'){", 1)
site_snapshot = json.loads((P/'content/site.json').read_text()) if (P/'content/site.json').exists() else None
revision_input = BASE.read_bytes() + (P/'build.py').read_bytes() + json.dumps([catalog, local_data], sort_keys=True).encode() + (json.dumps(site_snapshot, sort_keys=True).encode() if site_snapshot else b'') + b''.join(f.read_bytes() for f in sorted((P/'src').glob('*')) if f.is_file())
content_revision = 'vtb-ttg-' + hashlib.sha256(revision_input).hexdigest()[:16]
cms = (P/'src/content-manager.js').read_text().replace('__CONTENT_REVISION__', content_revision).replace('</script', '<\\/script')
base = base.replace(' applySite();\n\n renderDock();', cms+'\n applySite();\n\n renderDock();', 1)
deposit = (P/'src/deposit-ui.mjs').read_text().replace('export function mountDepositCalculator', 'function mountDepositCalculator')
deposit_bundle = ' const DepositCalculator=(()=>{\n' + deposit + '\nreturn {mountDepositCalculator};\n})();\n let depositUnmount=null;'
a = base.index(' const DepositCalculator=(()=>{')
b = base.index('\n let depositUnmount=null;', a) + len('\n let depositUnmount=null;')
base = base[:a] + deposit_bundle + base[b:]
a = base.index(' const taxGuideData=')
b = base.index(' const ipayIndex=', a)
base = base[:a] + (P/'src/tax-guide.js').read_text() + '\n' + base[b:]
extra_css = '\n'.join((P/('src/'+name)).read_text() for name in ['deposit-styles.css', 'tax-guide-styles.css', 'product-styles.css', 'local-styles.css'])
extra_css = extra_css.replace('#VTB_ROOT', '#'+root_id)
extra_css = extra_css.replace('.dc-app', '#'+root_id+' .dc-app').replace('.vb-guide-source', '#'+root_id+' .vb-guide-source')
a = base.index('#'+root_id+' .dc-app{')
b = base.index('</style>', a)
base = base[:a] + extra_css + '\n' + base[b:]
fonts = '\n'.join(re.findall(r'@font-face\{font-family:VTBBannerGilroy;[^}]*\}', base)[:2])
assert len(fonts) > 60000
logo = re.search(r'<img[^>]*class="vb-logo"[^>]*src="([^"]+)"', base)
if not logo:
    logo = re.search(r'<img[^>]*src="([^"]+)"[^>]*class="vb-logo"', base)
assert logo
logo = logo.group(1)
css = (P / 'src/styles.css').read_text()
sources = []
for name in ['engine.mjs', 'reports.mjs', 'ui.mjs']:
    s = (P / 'src' / name).read_text()
    s = re.sub(r'^import [^\n]*\n', '', s, flags=re.M)
    s = re.sub(r'^export ', '', s, flags=re.M)
    # Keep generated report document tags inside strings, separate from the fragment shell.
    s = re.sub(r'<(?=/?(?:!doctype|html\b|head\b|body\b))', lambda m: r'\x3c', s, flags=re.I)
    sources.append(s)
bundle = '\n'.join(sources)
assert '</script' not in bundle
library = 'const LoanCalculator=(()=>{\n' + bundle + '\nreturn {mountLoanCalculator};\n})();\n'
(P / 'dist').mkdir(exist_ok=True)
(P / 'src/brand-fonts.css').write_text(fonts)
standalone = (P / 'standalone-shell.html').read_text()
standalone = standalone.replace('/* BRAND_FONTS */', fonts).replace('/* APP_STYLES */', css).replace('BRAND_LOGO', logo)
boot = library + "LoanCalculator.mountLoanCalculator(document.getElementById('loan-calculator-standalone'),{logo:document.getElementById('loan-brand-logo').src,fontCss:document.getElementById('loan-brand-fonts').textContent});"
standalone = standalone.replace('/* APP_BUNDLE */', boot)
(P / 'dist/index.html').write_text(standalone)

b = base.replace('vtb-forgot-password-v12', 'vtb-loan-v13')
def once(old, new):
    global b
    assert b.count(old) == 1, (old[:100], b.count(old))
    b = b.replace(old, new, 1)

integrated_css = css.replace('.lc-app', '#vtb-loan-v13 .lc-app')
b = b.replace('</style>', '\n' + integrated_css + '\n</style>', 1)
once("{title:'Tính lãi tiền vay',view:'quick',category:'Công cụ tài chính'}", "{title:'Tính lãi tiền vay',view:'loan',category:'Công cụ tài chính',keywords:'vay vốn trả góp dư nợ lãi suất PMT tính lãi ngắn hạn dài hạn'}")
assert b.count("<div class=\"vb-tool\">'+icon('calculator')+'Tính lãi tiền vay</div>") == 2
b = b.replace("<div class=\"vb-tool\">'+icon('calculator')+'Tính lãi tiền vay</div>", "<button type=\"button\" class=\"vb-tool cursor-interaction\" data-open=\"loan\">'+icon('calculator')+'Tính lãi tiền vay</button>")
once(' const open=(view,guideIndex,locationId)=>{', ' ' + library + '\n let loanUnmount=null;\n const open=(view,guideIndex,locationId)=>{\n  loanUnmount?.();loanUnmount=null;')
once("  if(view==='quick'){renderQuick(guideIndex);return}", "  if(view==='quick'){renderQuick(guideIndex);return}\n  if(view==='loan'){detail.innerHTML='<button type=\"button\" class=\"vb-back cursor-interaction\" data-open=\"quick\">'+icon('arrow-left')+'Tiện ích nhanh</button><div class=\"vb-loan-host\"></div>';loanUnmount=LoanCalculator.mountLoanCalculator(detail.querySelector('.vb-loan-host'),{restricted:true,logo:root.querySelector('.vb-logo').src});icons();return}")
once(" open('quick',2);\n})();", " open('loan');\n root.inert=true;cmsBoot();\n})();")
out = Path(args.inline_output)
out.write_text(b)
assert b.count('id="vtb-loan-v13"') == 1
assert not re.search(r'\b(?:fetch|XMLHttpRequest|WebSocket)\s*\(', b)
for name, text in [('bundle-check.js', library), ('integrated-check.js', '\n'.join(re.findall(r'<script[^>]*>(.*?)</script>', b, re.S)))]:
    (P / 'tests' / name).write_text(text)
app_fragment = b.replace(" open('loan');\n root.inert=true;cmsBoot();\n})();", " open('home');\n root.inert=true;cmsBoot();\n})();").replace("LoanCalculator.mountLoanCalculator(detail.querySelector('.vb-loan-host'),{restricted:true,", "LoanCalculator.mountLoanCalculator(detail.querySelector('.vb-loan-host'),{restricted:false,")
app = (P/'super-app-shell.html').read_text().replace('<!-- LUCIDE -->', (P/'reference/lucide.min.js').read_text()).replace('<!-- SUPER_APP -->', app_fragment)
if site_snapshot:
    site_snapshot.update(schemaVersion=1, publicationId=content_revision, catalog=catalog, local=local_data)
    payload = json.dumps(site_snapshot, ensure_ascii=False).replace('<', '\\u003c')
    app = app.replace('</head>', '<script id="vtb-content-data" type="application/json">'+payload+'</script>\n</head>', 1)
(P/'dist/super-app.html').write_text(app)
print(json.dumps({'fragment':str(out),'bytes':out.stat().st_size,'loan':str(P/'dist/index.html'),'app':str(P/'dist/super-app.html'),'app_bytes':(P/'dist/super-app.html').stat().st_size}))
