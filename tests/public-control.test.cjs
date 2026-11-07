'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {chromium}=require('playwright'),{pathToFileURL}=require('node:url'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),c={};
vm.runInNewContext(fs.readFileSync(path.join(root,'src/content.js'),'utf8')+';this.slides=RiverAtlasSlides',c);
test('公共管制调查保留PPT第14页完整说明与三项独立图示说明',async()=>{
 const index=c.slides.findIndex(s=>s.sources.includes(14));assert(index>=0);
 const b=await chromium.launch({channel:'chrome'}),p=await b.newPage({viewport:{width:1920,height:1080},offline:true,reducedMotion:'reduce'});
 try{
  await p.goto(pathToFileURL(path.join(root,'index.html')).href+'#p'+(index+1));
  const text=await p.locator('#presentation').innerText();
  assert(text.includes('依据收集的资料'));
  assert(text.includes('提取与自然资源登记单元相关的规划用途和特殊保护信息、已登记的不动产信息、矿业信息和排污权信息等。'));
  const headings=await p.locator('.copy-point h2').allTextContents();
  for(const label of ['河流—矿业','河流—排污口','生态保护红线'])assert(headings.includes(label),'缺少独立图示说明：'+label);
  const image=p.locator('.document-board img');await image.evaluate(i=>i.decode());
  assert.equal(await image.getAttribute('data-asset'),'19');
  const copy=await p.locator('.copy-column').boundingBox(),map=await p.locator('.document-board').boundingBox();
  assert(copy.x+copy.width<=map.x);
  await p.locator('.document-board .image-button').click();assert(await p.locator('#image-dialog').isVisible());await p.keyboard.press('Escape');
  await p.setViewportSize({width:390,height:844});
  assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));
  for(const label of ['河流—矿业','河流—排污口','生态保护红线'])assert(await p.getByRole('heading',{name:label,exact:true}).isVisible());
 }finally{await b.close();}
});
