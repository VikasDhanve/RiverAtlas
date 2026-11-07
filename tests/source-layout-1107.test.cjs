'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {chromium}=require('playwright'),{pathToFileURL}=require('node:url'),path=require('node:path');
const url=pathToFileURL(path.resolve(__dirname,'../index.html')).href;
test('第9页双图并列、避让内容完整，后续图文按新稿分组且原件可查看',async()=>{
 const b=await chromium.launch({channel:'chrome'}),p=await b.newPage({viewport:{width:1920,height:1080},offline:true,reducedMotion:'reduce'});
 try{
  for(const [page,ids] of [[9,[14,13]],[10,[15,16]],[11,[17,18]],[12,[19]],[13,[20,21,22,23]],[14,[24,26]],[17,[27]],[19,[31,34,33]],[26,[37]]]){
   await p.goto(url+'#p'+page);await p.locator('.document-board img').first().waitFor();
   assert.deepEqual(await p.locator('.document-board img').evaluateAll(nodes=>nodes.map(n=>Number(n.dataset.asset))),ids);
   for(const image of await p.locator('.document-board img').all()){
    await image.evaluate(i=>i.decode());assert(await image.isVisible());
    const r=await image.boundingBox();assert(r.width>100&&r.height>100);
   }
   if(page===9){
    const text=await p.locator('#presentation').innerText();
    for(const term of ['暂行办法','实施方案','操作指南','每条河流','永久基本农田','城镇开发边界','避让'])assert(text.includes(term),term);
    assert.doesNotMatch(text,/编码/);
    const [left,right]=await p.locator('.document-window').all();
    assert((await left.boundingBox()).x<(await right.boundingBox()).x);
   }
   await p.locator('.document-board .image-button').first().click();
   assert(await p.locator('#image-dialog').isVisible());await p.keyboard.press('Escape');
  }
  await p.goto(url+'#p15');assert.equal(await p.locator('.gallery-tabs button').count(),3);
  await p.goto(url+'#p17');assert.equal(await p.locator('.audit-table tbody tr').count(),6);
  await p.goto(url+'#p22');assert.match(await p.locator('#presentation').innerText(),/未提供/);
  assert.doesNotMatch(await p.locator('#presentation').innerText(),/送生态环境/);
  await p.goto(url+'#p25');
  assert.match(await p.locator('.notice-table').innerText(),/南：黄海/);
  assert.equal(await p.locator('.notice-table tbody tr').count(),6);
  assert(await p.locator('.notice-document-footer').isVisible());
 }finally{await b.close();}
});
