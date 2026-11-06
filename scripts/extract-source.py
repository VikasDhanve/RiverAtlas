"""只读提取PPTX文字、表格与原图；重新提取时需要显式给出源路径。"""
from pathlib import Path
from zipfile import ZipFile
import xml.etree.ElementTree as E
import json, hashlib, re, sys

root = Path(__file__).resolve().parent.parent
source = Path(sys.argv[1]).resolve()
expected = '21524156a84243f1dbc69daf613d0291e466f91e3e6f3d528b236e26489747b5'
digest = hashlib.sha256(source.read_bytes()).hexdigest()
if digest != expected:
    raise SystemExit('源文件指纹变化，请先重新核对资料，不自动覆盖旧内容。')
ns = {'a': 'http://schemas.openxmlformats.org/drawingml/2006/main', 'p': 'http://schemas.openxmlformats.org/presentationml/2006/main'}
asset_dir = root / 'assets' / 'originals'
asset_dir.mkdir(parents=True, exist_ok=True)
(root / 'src').mkdir(exist_ok=True)
(root / 'docs').mkdir(exist_ok=True)
slides, assets = [], []
with ZipFile(source) as z:
    for name in z.namelist():
        if re.fullmatch(r'ppt/media/image\d+\.[A-Za-z]+', name):
            data = z.read(name)
            filename = Path(name).name
            (asset_dir / filename).write_bytes(data)
            number = int(re.search(r'image(\d+)', filename).group(1))
            assets.append({'id': number, 'file': filename, 'path': 'assets/originals/' + filename,
                           'business': number >= 5, 'sha256': hashlib.sha256(data).hexdigest(),
                           'rotation': 0})
    for i in range(1, 36):
        tree = E.fromstring(z.read(f'ppt/slides/slide{i}.xml'))
        paragraphs = []
        for shape in tree.findall('.//p:sp', ns):
            for p in shape.findall('.//a:p', ns):
                t = ''.join(n.text or '' for n in p.findall('.//a:t', ns))
                if t.strip(): paragraphs.append(t)
        tables = []
        for table in tree.findall('.//a:tbl', ns):
            rows = []
            for row in table.findall('a:tr', ns):
                rows.append(['\n'.join(''.join(t.text or '' for t in p.findall('.//a:t', ns))
                                       for p in cell.findall('.//a:p', ns)).strip()
                             for cell in row.findall('a:tc', ns)])
            tables.append(rows)
        relpath = f'ppt/slides/_rels/slide{i}.xml.rels'
        rels = {r.get('Id'): r.get('Target') for r in E.fromstring(z.read(relpath))}
        images = []
        for blip in tree.findall('.//p:pic//a:blip', ns):
            target = rels.get(blip.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}embed'), '')
            match = re.search(r'image(\d+)\.', target)
            if match: images.append(int(match.group(1)))
        slides.append({'page': i, 'paragraphs': paragraphs, 'tables': tables, 'images': images})
assert len(slides) == 35 and len(assets) == 43
assert sum(a['business'] for a in assets) == 39
payload = {'filename': source.name, 'sha256': digest, 'slides': slides,
           'assets': sorted(assets, key=lambda a: a['id'])}
(root / 'src' / 'source.js').write_text('/* 从原稿只读提取，显示时使用textContent。 */\nconst RiverAtlasSource = ' + json.dumps(payload, ensure_ascii=False, indent=2) + ';\n', encoding='utf-8')
(root / 'docs' / 'source-manifest.json').write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding='utf-8')
print('Extracted 35 pages, 43 originals (39 business images); source unchanged.')
