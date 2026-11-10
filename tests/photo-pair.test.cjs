'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {chromium}=require('playwright'),{pathToFileURL}=require('node:url'),path=require('node:path');
const url=pathToFileURL(path.resolve(__dirname,'../index.html')).href;
test('第14页照片同宽同高、右图等比裁切，放大镜与完整原件仍可查看',async()=>{
 const b=await chromium.launch({channel:'chrome'}),p=await b.newPage({viewport:{width:1920,height:1080},offline:true,reducedMotion:'reduce'});
 const errors=[];p.on('pageerror',e=>errors.push(e.message));
 try{
  for(const width of [1920,390]){
   await p.setViewportSize({width,height:width===1920?1080:844});await p.goto(url+'#p15');
   const images=p.locator('.document-board img');
   await images.evaluateAll(ns=>Promise.all(ns.map(n=>n.decode())));
   const a=await images.nth(0).boundingBox(),c=await images.nth(1).boundingBox();
   assert(Math.abs(a.width-c.width)<1&&Math.abs(a.height-c.height)<1,'两图须同宽同高');
   if(width===1920){assert(Math.abs(a.y-c.y)<1,'双图顶部须对齐');assert(Math.abs(a.y+a.height-c.y-c.height)<1);}
   assert.equal(await images.nth(1).evaluate(i=>getComputedStyle(i).objectFit),'cover');
   assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),true);
  }
  await p.setViewportSize({width:1920,height:1080});await p.goto(url+'#p15');
  const right=p.locator('.document-board img').nth(1);await right.hover();await p.locator('#media-loupe').waitFor();
  const shown=await p.locator('#media-loupe img').evaluate(i=>i.clientWidth/i.clientHeight);
  const natural=await right.evaluate(i=>i.naturalWidth/i.naturalHeight);assert(Math.abs(shown-natural)<.01,'裁切图的放大镜应保持原图比例');
  for(const control of await p.locator('.document-board .image-button').all()){
   await control.click();await p.waitForFunction(()=>{const i=document.getElementById('original-image');return !i.hidden&&i.complete&&i.naturalWidth>0;});await p.keyboard.press('Escape');
  }
  assert.deepEqual(errors,[]);
 }finally{await b.close();}
});
