'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {chromium}=require('playwright'),{pathToFileURL}=require('node:url'),path=require('node:path');
const url=pathToFileURL(path.resolve(__dirname,'../index.html')).href;
test('第11页合并自然资源与权属调查，两图并列，下一页为公共管制调查',async()=>{
 const b=await chromium.launch({channel:'chrome'}),p=await b.newPage({viewport:{width:1920,height:1080},offline:true,reducedMotion:'reduce'});
 try{
  await p.goto(url+'#p11');
  assert.match(await p.locator('#slide-title').innerText(),/自然资源.*权属/);
  assert.deepEqual(await p.locator('.document-board img').evaluateAll(ns=>ns.map(n=>Number(n.dataset.asset))),[17,18]);
  const text=await p.locator('#presentation').innerText();
  for(const term of ['全国第三次国土调查','坐落','空间范围','面积','权属资料','初步调查成果'])assert(text.includes(term),term);
  for(const img of await p.locator('.document-board img').all()){await img.evaluate(i=>i.decode());assert(await img.isVisible());}
  const frames=await p.locator('.document-window').all();assert((await frames[0].boundingBox()).x<(await frames[1].boundingBox()).x);
  for(const control of await p.locator('.document-board .image-button').all()){
   await control.click();await p.waitForFunction(()=>{const n=document.getElementById('original-image');return !n.hidden&&n.complete&&n.naturalWidth>0;});await p.keyboard.press('Escape');
  }
  await p.keyboard.press('ArrowRight');assert.match(await p.locator('#slide-title').innerText(),/公共管制/);assert.equal(await p.locator('#page-count').innerText(),'12 / 30');
 }finally{await b.close();}
});
