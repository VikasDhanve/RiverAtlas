'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const url=pathToFileURL(path.resolve(__dirname,'../index.html')).href;
test('第三页去掉重复标题和提示，纸面高度增加；其他页不显示讲解操作提示',async()=>{
 const browser=await chromium.launch({channel:'chrome'});
 const page=await browser.newPage({viewport:{width:1920,height:1080},offline:true,reducedMotion:'reduce'});
 try{
  await page.goto(url+'#p4');
  assert.match(await page.title(),/RiverAtlas/);
  assert.equal(await page.locator('.policy-page-title,.policy-page-meta,.policy-selection-state,.policy-reader-hint').count(),0);
  assert((await page.locator('.policy-sheet:not([hidden])').boundingBox()).height>620);
  for(const n of [2,3,8,15,20]){
   await page.goto(url+'#p'+n);
   const visible=await page.locator('#presentation').evaluate(root=>[...root.querySelectorAll('p,span')].filter(n=>{
    const b=n.getBoundingClientRect(),s=getComputedStyle(n);return b.width>4&&b.height>4&&s.display!=='none'&&s.visibility!=='hidden';
   }).map(n=>n.textContent).join('\n'));
   assert.doesNotMatch(visible,/移入目录|点击固定|移入聚焦|移动鼠标|点击“播放演示”|高亮表示讲解位置/);
  }
 }finally{await browser.close();}
});
test('星空只响应鼠标视差，暂停和静态时保持画面，静止后停止重绘',async()=>{
 const browser=await chromium.launch({channel:'chrome'});
 const page=await browser.newPage({viewport:{width:1920,height:1200},offline:true});
 try{
  await page.goto(url+'#p4');await page.locator('#starfield').waitFor({timeout:2000});
  await page.mouse.move(40,10);await page.waitForTimeout(1000);
  const capture=()=>page.screenshot({clip:{x:0,y:0,width:1920,height:50}});
  const first=await capture();
  await page.mouse.move(1880,35);await page.waitForTimeout(1000);
  const moved=await capture();assert.notDeepEqual(moved,first);
  await page.waitForTimeout(400);assert.deepEqual(await capture(),moved);
  await page.keyboard.press('p');const paused=await capture();
  await page.mouse.move(40,15);await page.waitForTimeout(500);assert.deepEqual(await capture(),paused);
  await page.keyboard.press('p');await page.keyboard.press('a');await page.waitForTimeout(200);
  const still=await capture();await page.mouse.move(1880,35);await page.waitForTimeout(500);assert.deepEqual(await capture(),still);
 }finally{await browser.close();}
});

test('鼠标移动时浮现浅色连线，停下后线条淡出且不持续绘制',async()=>{
 const browser=await chromium.launch({channel:'chrome'});
 const page=await browser.newPage({viewport:{width:1920,height:1080},offline:true,reducedMotion:'no-preference'});
 try{
  await page.goto(url+'#p4');await page.mouse.move(500,500);await page.waitForTimeout(1100);
  const ink=()=>page.locator('#starfield').evaluate(c=>{
   const a=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let value=0;
   for(let i=0;i<a.length;i+=4)if(a[i]>90)value+=a[i]*a[i+3];
   return value;
  });
  await page.mouse.move(900,500,{steps:8});await page.waitForTimeout(40);
  const active=await ink();await page.waitForTimeout(1100);const settled=await ink();
  assert(active>settled*1.05,'移动时应有真实细线笔触，停止后消退：'+JSON.stringify({active,settled}));
  const stopped=await page.locator('#starfield').evaluate(c=>c.toDataURL());
  await page.waitForTimeout(250);assert.equal(await page.locator('#starfield').evaluate(c=>c.toDataURL()),stopped);
  await page.mouse.move(1300,500,{steps:8});await page.keyboard.press('p');
  const paused=await page.locator('#starfield').evaluate(c=>c.toDataURL());
  await page.mouse.move(500,300);await page.waitForTimeout(750);
  assert.equal(await page.locator('#starfield').evaluate(c=>c.toDataURL()),paused);
 }finally{await browser.close();}
});
