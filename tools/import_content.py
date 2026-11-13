"""Import an editor backup/export into editable JSON and original image files.
No dependencies: python3 tools/import_content.py PATH [--destination PROJECT]
"""
from pathlib import Path
from html.parser import HTMLParser
import argparse, base64, json, re

class Payload(HTMLParser):
    def __init__(self):
        super().__init__(); self.active=False; self.data=[]
    def handle_starttag(self, tag, attrs):
        attrs=dict(attrs)
        if tag=='script' and attrs.get('id')=='vtb-content-data' and attrs.get('type')=='application/json':self.active=True
    def handle_endtag(self, tag):
        if tag=='script':self.active=False
    def handle_data(self, data):
        if self.active:self.data.append(data)

parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('backup',type=Path)
parser.add_argument('--destination',type=Path,default=Path(__file__).resolve().parents[1])
args=parser.parse_args()
raw=args.backup.read_text(encoding='utf-8')
if raw.lstrip().startswith('<'):
    payload=Payload();payload.feed(raw);raw=''.join(payload.data)
value=json.loads(raw)
if value.get('schemaVersion')!=1 or not isinstance(value.get('catalog'),dict):raise ValueError('Không phải bản sao nội dung VietinBank TTG phiên bản 1.')
catalog=value['catalog']
if not isinstance(catalog.get('groups'),list) or not isinstance(catalog.get('products'),list):raise ValueError('Thiếu danh sách nhóm hoặc sản phẩm.')
group_ids=[g['id'] for g in catalog['groups']]
product_ids=[p['id'] for p in catalog['products']]
if len(set(group_ids))!=len(group_ids) or len(set(product_ids))!=len(product_ids):raise ValueError('Có mã bị trùng.')
if any(p['category'] not in group_ids for p in catalog['products']):raise ValueError('Có sản phẩm thuộc nhóm không tồn tại.')
local=value.get('local')
if local is not None:
    if not isinstance(local.get('groups'),list) or not isinstance(local.get('places'),list):raise ValueError('Thiếu danh sách nhóm hoặc địa điểm.')
    local_groups=[g['id'] for g in local['groups']];local_ids=[p['id'] for p in local['places']]
    if len(set(local_groups))!=len(local_groups) or len(set(local_ids))!=len(local_ids):raise ValueError('Mã nhóm hoặc địa điểm bị trùng.')
    if any(p['category'] not in local_groups for p in local['places']):raise ValueError('Có địa điểm thuộc nhóm không tồn tại.')
destination=args.destination.resolve();(destination/'content').mkdir(parents=True,exist_ok=True)
images=0
for records,directory in [(catalog['products'],'assets/products')]+([(local['places'],'assets/local')] if local is not None else []):
    (destination/directory).mkdir(parents=True,exist_ok=True)
    for item in records:
        safe_id=re.sub('[^a-zA-Z0-9_-]','-',str(item['id']))
        for index,record in enumerate([item]+item.get('gallery',[])):
            key='image' if index==0 else 'src';src=record.get(key,'')
            match=re.fullmatch(r'data:image/(png|jpeg|webp|gif|avif);base64,([A-Za-z0-9+/=\s]+)',src)
            if match:
                extension='jpg' if match[1]=='jpeg' else match[1];name=f'{safe_id}-{index}.{extension}';(destination/directory/name).write_bytes(base64.b64decode(re.sub(r'\s','',match[2]),validate=True));record[key]=directory+'/'+name;images+=1
site={k:v for k,v in value.items() if k not in ['catalog','local','drafts','queue','publicationId']}
site['schemaVersion']=1
(destination/'content/products.json').write_text(json.dumps(catalog,ensure_ascii=False,indent=2),encoding='utf-8')
if local is not None:(destination/'content/local.json').write_text(json.dumps(local,ensure_ascii=False,indent=2),encoding='utf-8')
(destination/'content/site.json').write_text(json.dumps(site,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'products':len(product_ids),'groups':len(group_ids),'places':len(local['places']) if local else None,'separate_images':images,'destination':str(destination),'drafts':'Bản nháp không đưa vào nội dung xuất bản; giữ bản sao JSON gốc để khôi phục bản nháp.'},ensure_ascii=False))
