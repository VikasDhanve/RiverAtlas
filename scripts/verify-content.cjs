'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),read=file=>fs.readFileSync(path.join(root,file),'utf8');
const history=JSON.parse(read('docs/source-manifest-1107.json')),context={};
vm.runInNewContext(['src/source.js','src/supplement.js','src/biliuhe.js','src/content.js'].map(read).join('\n')+';this.slides=RiverAtlasSlides;this.assets=[...RiverAtlasSource.assets,...RiverAtlasSupplement,...RiverAtlasBiliuhe];',context);
const slides=context.slides,assets=context.assets;
assert.deepEqual(JSON.parse(JSON.stringify(slides.find(s=>s.layout==='workflow').flow)),JSON.parse(read('docs/workflow-spec.json')),'导出流程必须与演示使用同一完整图结构');
assert.equal(slides.length,34);assert.equal(history.slides.length,41);
const mapped=[...new Set(slides.flatMap(s=>s.sources))].sort((a,b)=>a-b);assert.deepEqual(mapped,Array.from({length:41},(_,i)=>i+1));
const used=new Set([4,...slides.flatMap(s=>s.images||[])]),files=new Set();
for(const asset of assets){
 assert(used.has(asset.id),'运行清单存在无引用图件：'+asset.id);
 for(const file of [asset.path,asset.displayPath].filter(Boolean)){assert(fs.existsSync(path.join(root,file)),file);files.add(file);}
 if(asset.sha256)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,asset.path))).digest('hex'),asset.sha256,asset.path);
}
assert.equal(new Set(assets.map(a=>a.id)).size,43);for(const id of used)assert(assets.some(a=>a.id===id),'页面引用不存在图件：'+id);
for(const folder of ['originals','supplement','revision-1107'])for(const file of fs.readdirSync(path.join(root,'assets',folder)))assert(files.has('assets/'+folder+'/'+file),'无引用素材：'+folder+'/'+file);
const input=path.join(history.sourceDirectory,history.filename);
if(fs.existsSync(input))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(input)).digest('hex'),history.sha256,'原始PPT应保持只读');
const lines=['# 1107版内容与素材核对','','本轮34页主讲内容覆盖1107版41页PPT。来源页码统一指1107版，1106历史清单另存source-manifest.json。43个运行图像中42份业务/流程图可打开完整原件，另1份为既有装饰背景。','','| 1107原稿页 | 当前演示页 | 对应主讲页图件编号 |','|---|---|---|'];
for(const source of history.slides){const mapped=slides.flatMap((s,i)=>s.sources.includes(source.page)?[{page:i+1,images:s.images||[]}]:[]);lines.push('| '+source.page+' | '+mapped.map(m=>m.page).join('、')+' | '+[...new Set(mapped.flatMap(m=>m.images))].join('、')+' |');}
lines.push('','五河长度以1107版为准：25.7、96.5、45、164.9、94.9 km，面积不变。外部审核源页仅有标题，图斑数量未提供，公告日期/地址/电话仍为占位。广西贺江与南京清流河均保持外地样例标识。','','工作底图、流程原图、三张碧流河成果图与六张清流河登记簿图采用1107版原图，字节哈希已核对。底图图集另外三张专题资料沿用1106补充PDF，其三调资料不冒充2023变更调查成果。');
fs.writeFileSync(path.join(root,'docs/内容覆盖验收.md'),lines.join('\n')+'\n');
console.log('Content: 34 slides, all 41 source pages mapped, 43 referenced assets; source and retained image hashes verified.');
