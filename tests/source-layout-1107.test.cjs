'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {chromium}=require('playwright'),{pathToFileURL}=require('node:url'),path=require('node:path');
const url=pathToFileURL(path.resolve(__dirname,'../index.html')).href;
test('第9页双图并列、避让内容完整，后续图文按新稿分组且原件可查看',async()=>{
 const b=await chromium.launch({channel:'chrome'}),p=await b.newPage({viewport:{width:1920,height:1080},offline:true,reducedMotion:'reduce'});
 try{
  for(const [page,ids] of [[9,[14,13]],[10,[401]],[11,[15,16]],[12,[17,18]],[13,[19]],[14,[20,21,22,23]],[15,[24,26]],[18,[27]],[20,[31,34,33]],[27,[37]]]){
   await p.goto(url+'#p'+page);await p.locator('.document-board img').first().waitFor();
   assert.deepEqual(await p.locator('.document-board img').evaluateAll(nodes=>nodes.map(n=>Number(n.dataset.asset))),ids);
   for(const image of await p.locator('.document-board img').all()){
    await image.evaluate(i=>i.decode());assert(await image.isVisible());
    const r=await image.boundingBox();assert(r.width>100&&r.height>100);
   }
   if(page===9){
    assert.equal(await p.locator('#slide-title').innerText(),'预划登记单元（一）');
    const text=await p.locator('#presentation').innerText();
    for(const term of ['基于工作底图','永久基本农田','城镇开发边界','2103处','457.04公顷','23处','15.43公顷'])assert(text.includes(term),term);
    assert.doesNotMatch(text,/编码|一河一单元|每条河流自然资源划为一个登记单元|对位于河流管理范围线附近/);
    assert.equal(await p.locator('.slide-lead').count(),2);
    assert.equal(await p.locator('.copy-point').count(),0);
    const [left,right]=await p.locator('.document-window').all();
    assert((await left.boundingBox()).x<(await right.boundingBox()).x);
   }
   if(page===10){
    assert.equal(await p.locator('#slide-title').innerText(),'预划登记单元（二）');
    const paragraphs=await p.locator('.protected-unit-copy p').allTextContents();
    assert.equal(paragraphs.join(''),'当水流穿过国家批准的自然保护地登记单元时，应保持自然保护地登记单元的完整性，其中碧流河流经辽宁大连普兰店国家森林公园，仍为1个登记单元；英那河流经辽宁大连冰峪沟国家地质公园、辽宁大连天门山国家森林公园和辽宁仙人洞国家级自然保护区，被分割成4个登记单元。');
    assert.equal(await p.locator('.document-board img').evaluate(i=>i.naturalHeight),4000);
    await p.getByRole('button',{name:'查看原图',exact:true}).click();
    await p.locator('#original-image').evaluate(i=>i.decode());
    assert(await p.locator('#image-dialog').isVisible());
    assert.match(await p.locator('#original-image').getAttribute('src'),/yingna-registration-units/);
    const before=await p.locator('#original-image').evaluate(i=>i.clientWidth);
    await p.getByRole('button',{name:'放大原件',exact:true}).click();
    assert(await p.locator('#original-image').evaluate(i=>i.clientWidth)>before);
    await p.keyboard.press('Escape');
   }
   await p.locator('.document-board .image-button').first().click();
   assert(await p.locator('#image-dialog').isVisible());await p.keyboard.press('Escape');
  }
  await p.goto(url+'#p16');assert.equal(await p.locator('.gallery-tabs button').count(),3);
  await p.goto(url+'#p18');assert.equal(await p.locator('.audit-table tbody tr').count(),6);
  await p.goto(url+'#p23');assert.match(await p.locator('#presentation').innerText(),/未提供/);
  assert.doesNotMatch(await p.locator('#presentation').innerText(),/送生态环境/);
  await p.goto(url+'#p26');
  assert.match(await p.locator('.notice-table').innerText(),/南：黄海/);
  assert.equal(await p.locator('.notice-table tbody tr').count(),6);
  assert(await p.locator('.notice-document-footer').isVisible());
 }finally{await b.close();}
});
