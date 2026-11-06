"""只读导入用户2026-11-06增补底图；完整原件与紧凑演示取景分别保留。"""
from pathlib import Path
import hashlib
import json
import shutil
import sys
import pymupdf as fitz

root = Path(__file__).resolve().parent.parent
source = Path(sys.argv[1]).resolve()
target = root / 'assets' / 'supplement'
target.mkdir(parents=True, exist_ok=True)
assets, inputs = [], []

def render(pdf, page, number, label):
    stem = f'asset-{number}'
    scale = min(3, 2600 / max(page.rect.width, page.rect.height))
    page.get_pixmap(matrix=fitz.Matrix(scale, scale), alpha=False).save(target / (stem + '.png'))
    # 只移除纸张外缘空白，保留整幅正文、图框、图例和标题；完整页另存。
    bounds = fitz.Rect()
    for block in page.get_text('dict')['blocks']:
        if block['type'] == 1:
            bounds |= fitz.Rect(block['bbox'])
        else:
            for line in block['lines']:
                for span in line['spans']:
                    if span['text'].strip(): bounds |= fitz.Rect(span['bbox'])
    for drawing in page.get_drawings():
        bounds |= drawing['rect']
    bounds = (bounds + (-12, -12, 12, 12)) & page.rect
    if bounds.is_empty: bounds = page.rect
    page.get_pixmap(matrix=fitz.Matrix(scale, scale), clip=bounds, alpha=False).save(target / (stem + '-view.png'))
    assets.append({'id': number, 'path': f'assets/supplement/{stem}.png',
                   'displayPath': f'assets/supplement/{stem}-view.png', 'caption': label,
                   'source': pdf.name, 'page': page.number + 1, 'rotation': 0})

register = source / 'P020240115558465557641.pdf'
labels = ['自然资源登记簿封面', '清流河登记信息', '权属状况信息', '自然状况信息', '自然状况续表', '清流河登记单元图']
with fitz.open(register) as doc:
    assert len(doc) == 6, '登记簿页数变化，请复核顺序'
    for i, page in enumerate(doc): render(register, page, 101 + i, f'南京清流河 · {labels[i]}（外地样例）')
for number, key, label in [(107,'影像','卫星 / 正射影像'),(108,'三调','范围与现势'),(109,'权属','权属与成果'),(110,'公共管制','管制与保护')]:
    pdf = next(source.glob('*底图' + key + '.pdf'))
    with fitz.open(pdf) as doc:
        assert len(doc) == 1
        render(pdf, doc[0], number, '大沙河 · ' + label)
flow = source / '流程图.png'
shutil.copyfile(flow, target / 'workflow.png')
assets.append({'id':111,'path':'assets/supplement/workflow.png','caption':'项目实施流程原图','source':flow.name,'rotation':0})
for file in sorted(source.iterdir()):
    if file.suffix.lower() not in {'.pdf', '.png'}: continue
    data = file.read_bytes()
    inputs.append({'file':file.name,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()})
manifest = {'date':'2026-11-06','sourceDirectory':str(source),'inputs':inputs,'assets':assets}
(root/'docs/supplement-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
(root/'src/supplement.js').write_text('/* 用户新增素材，原PDF页序不变；展示取景与完整原件独立。 */\nconst RiverAtlasSupplement = '+json.dumps(assets,ensure_ascii=False,indent=2)+';\n',encoding='utf8')
print(f'Imported {len(inputs)} immutable sources, {len(assets)} display entries.')
