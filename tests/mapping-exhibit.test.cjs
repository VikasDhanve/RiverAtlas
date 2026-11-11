'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {chromium}=require('playwright'),{pathToFileURL}=require('node:url'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),url=pathToFileURL(path.join(root,'index.html')).href,c={};
vm.runInNewContext(fs.readFileSync(path.join(root,'src/content.js'),'utf8')+';this.slides=RiverAtlasSlides',c);
test('第15/16页合并后，完整上图要求和三份专题图同页可操作，下一页为建库',async()=>{
 assert.equal(c.slides.length,31);assert.deepEqual(Array.from(c.slides[15].sources),[17,18]);
 const b=await chromium.launch({channel:'chrome'}),p=await b.newPage({viewport:{width:1920,height:1080},offline:true,reducedMotion:'reduce'});
 try{
  await p.goto(url+'#p16');const text=await p.locator('#presentation').innerText();
  for(const term of ['登记单元范围界线','自然资源权属范围线','行政管辖界线','公共管制信息','地类图斑','地类编码','界址点坐标','所有权主体','所有权代理行使主体'])assert(text.includes(term),term);
  assert.equal(await p.locator('.gallery-tabs button').count(),12);assert.equal(await p.locator('.gallery-thumbnail').count(),12);
  assert.equal(await p.locator('.coverflow-card,.mapping-wing,.mapping-sweep,.mapping-stage').count(),0);
  for(const id of [301,302,303]){
   await p.locator('.gallery-tabs button[data-asset="'+id+'"]').click();
   assert.equal(await p.locator('.gallery-spread img').getAttribute('data-asset'),String(id));
   assert.match(await p.locator('.gallery-caption').innerText(),/登记单元图|权属界线|水流资源/);
  }
  await p.locator('.gallery-spread .image-button').click();assert(await p.locator('#image-dialog').isVisible());await p.keyboard.press('Escape');
  await p.locator('#slide-title').focus();await p.keyboard.press('ArrowRight');assert.equal(await p.locator('#slide-title').innerText(),'数据建库');
  assert.equal(await p.locator('#page-count').innerText(),'17 / 31');
 }finally{await b.close();}
});
test('第15页复用第31页缩略图图库，支持快速重选、手机和专注模式',async()=>{
 const b=await chromium.launch({channel:'chrome'}),p=await b.newPage({viewport:{width:1920,height:1080},offline:true});
 const errors=[];p.on('pageerror',e=>errors.push(e.message));
 try{
  await p.goto(url+'#p16');
  for(const i of [1,2,0,2]){await p.locator('.gallery-tabs button').nth(i).focus();await p.keyboard.press('Enter');}
  await p.waitForTimeout(800);assert.equal(await p.locator('.gallery-spread img').getAttribute('data-asset'),'303');
  assert.match(await p.locator('.gallery-caption').innerText(),/水流资源/);
  assert(await p.locator('#step-button').isDisabled());
  const shape=()=>p.locator('.gallery-layout').evaluate(n=>({layout:n.className,children:[...n.children].map(c=>c.className),tools:[...n.querySelector('.gallery-tools').children].map(c=>c.className)}));
  const form=await shape();await p.goto(url+'#p29');assert.deepEqual(await shape(),form);await p.goto(url+'#p16');
  await p.setViewportSize({width:390,height:844});
  assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));
  await p.locator('.gallery-tabs button').nth(1).focus();await p.keyboard.press('Enter');
  assert.equal(await p.locator('.gallery-spread img').getAttribute('data-asset'),'302');
  await p.locator('.focus-media').click();assert.equal(await p.locator('.gallery-layout').getAttribute('data-focus'),'true');
  await p.locator('.focus-media').click();await p.goto(url+'#p17');
  assert.equal(await p.locator('.mapping-stage').count(),0);assert.deepEqual(errors,[]);
 }finally{await b.close();}
});
