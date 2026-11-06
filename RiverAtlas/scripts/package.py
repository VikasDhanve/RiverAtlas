"""打包可离线运行的工程，排除开发依赖和批量截图，校验ZIP完整性。"""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import hashlib, json
from datetime import datetime

root = Path(__file__).resolve().parent.parent
output = root.parent
version = json.loads((root / 'package.json').read_text(encoding='utf-8'))['version']
archive = output / ('RiverAtlas-v' + version + '.zip')
allowed = {'.impeccable/design.json'}
files = []
for p in root.rglob('*'):
    if not p.is_file(): continue
    rel = p.relative_to(root)
    if any(part in {'node_modules', '__pycache__', '.git'} for part in rel.parts): continue
    if rel.parts[0] == '.impeccable' and rel.as_posix() not in allowed: continue
    if p.suffix == '.log': continue
    files.append((p, 'RiverAtlas/' + rel.as_posix()))
files.append((output / '打开演示稿.html', '打开演示稿.html'))
for starter in ['RiverAtlasShowcase.html', '打开第二页交互样板.html', '打开第三页政策展陈.html', '打开第七页立体图层.html']:
    if (output / starter).exists(): files.append((output / starter, starter))
with ZipFile(archive, 'w', compression=ZIP_DEFLATED, compresslevel=6) as z:
    for p, rel in sorted(files, key=lambda item: item[1]): z.write(p, rel)
with ZipFile(archive) as z:
    bad = z.testzip()
    if bad: raise SystemExit('ZIP校验失败：' + bad)
    required = ['RiverAtlas/index.html', 'RiverAtlas/src/source.js', 'RiverAtlas/src/content.js', 'RiverAtlas/assets/vendor/gsap.min.js', 'RiverAtlas/README.md', '打开演示稿.html']
    if not all(n in z.namelist() for n in required): raise SystemExit('缺少必要交付文件')
manifest = {
    'version': version, 'created': datetime.now().astimezone().isoformat(timespec='seconds'),
    'archive': archive.name, 'bytes': archive.stat().st_size, 'files': len(files),
    'sha256': hashlib.sha256(archive.read_bytes()).hexdigest(),
    'entry': 'RiverAtlas/index.html', 'sourcePages': 35, 'presentationPages': 30, 'businessImages': 39,
    'status': 'RiverAtlas Showcase星空、页面精简与立体图层改版完成，待用户体验反馈；不等同正式验收'
}
(output / '交付清单.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps(manifest, ensure_ascii=False))
