'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),read=file=>fs.readFileSync(path.join(root,file),'utf8');
const history=JSON.parse(read('docs/source-manifest.json')),context={};
vm.runInNewContext(['src/source.js','src/supplement.js','src/biliuhe.js','src/content.js'].map(read).join('\n')+';this.slides=RiverAtlasSlides;this.assets=[...RiverAtlasSource.assets,...RiverAtlasSupplement,...RiverAtlasBiliuhe];',context);
const slides=context.slides,assets=context.assets;
assert.equal(slides.length,32);assert.equal(history.slides.length,35);
const mapped=[...new Set(slides.flatMap(s=>s.sources))].sort((a,b)=>a-b);assert.deepEqual(mapped,Array.from({length:35},(_,i)=>i+1));
const used=new Set([1,4,...slides.flatMap(s=>s.images||[])]),files=new Set();
for(const asset of assets){
 assert(used.has(asset.id),'运行清单存在无引用图件：'+asset.id);
 for(const file of [asset.path,asset.displayPath].filter(Boolean)){assert(fs.existsSync(path.join(root,file)),file);files.add(file);}
 if(asset.sha256)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,asset.path))).digest('hex'),asset.sha256,asset.path);
}
assert.equal(new Set(assets.map(a=>a.id)).size,51);for(const id of used)assert(assets.some(a=>a.id===id),'页面引用不存在图件：'+id);
for(const id of history.runtimeRemovedAssetIds){const asset=history.assets.find(a=>a.id===id);assert(!fs.existsSync(path.join(root,asset.path)),'旧图尚未删除：'+asset.path);}
for(const folder of ['originals','supplement','biliuhe'])for(const file of fs.readdirSync(path.join(root,'assets',folder)))assert(files.has('assets/'+folder+'/'+file),'无引用素材：'+folder+'/'+file);
const lines=['# 当前内容与素材核对','','32页主讲内容仍记录35页原PPT去向。按用户最新授权，原稿资料入口、弹窗、转录运行数据和11份无引用旧图已移除；历史提取证据保留于source-manifest.json，外部原始PPT与PDF不变。','','| 原稿页 | 当前演示页 | 对应主讲页图件编号 |','|---|---|---|'];
for(const source of history.slides){const mapped=slides.flatMap((s,i)=>s.sources.includes(source.page)?[{page:i+1,images:s.images||[]}]:[]);lines.push('| '+source.page+' | '+mapped.map(m=>m.page).join('、')+' | '+[...new Set(mapped.flatMap(m=>m.images))].join('、')+' |');}
lines.push('','当前51个图像入口：32份仍引用的原PPT图像、11份前轮新增图件、8份碧流河PDF图件；其中49份业务/流程图件可打开完整图像，另2份为标识和封面背景。','','碧流河成果顺序：调查表首张，遥感影像、自然资源现状、公共管制、森林、湿地、草原、荒地，0000001+T26界址点点之记末张。草案、外地样例、历史资质与实际进度边界保留。');
fs.writeFileSync(path.join(root,'docs/内容覆盖验收.md'),lines.join('\n')+'\n');
console.log('Content: 32 slides, 35 source-page mappings, 51 referenced assets, 11 unused originals removed; retained original hashes verified.');
