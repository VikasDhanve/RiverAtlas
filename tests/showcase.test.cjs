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
  await page.goto(url+'#p3');
  assert.match(await page.title(),/RiverAtlas/);
  assert.equal(await page.locator('.policy-page-title,.policy-page-meta,.policy-selection-state,.policy-reader-hint').count(),0);
  assert((await page.locator('.policy-sheet:not([hidden])').boundingBox()).height>620);
  for(const n of [2,3,7,15,19]){
   await page.goto(url+'#p'+n);
   const visible=await page.locator('#presentation').evaluate(root=>[...root.querySelectorAll('p,span')].filter(n=>{
    const b=n.getBoundingClientRect(),s=getComputedStyle(n);return b.width>4&&b.height>4&&s.display!=='none'&&s.visibility!=='hidden';
   }).map(n=>n.textContent).join('\n'));
   assert.doesNotMatch(visible,/移入目录|点击固定|移入聚焦|移动鼠标|点击“播放演示”|高亮表示讲解位置/);
  }
 }finally{await browser.close();}
});
test('第七页四层均有实际影像，展开/合拢和人工选层可控',async()=>{
 const browser=await chromium.launch({channel:'chrome'});
 const page=await browser.newPage({viewport:{width:1920,height:1080},offline:true,reducedMotion:'reduce'});
 try{
  await page.goto(url+'#p7');
  assert.equal(await page.locator('.atlas-plane .atlas-raster').count(),4);
  await page.waitForFunction(()=>[...document.querySelectorAll('.atlas-raster')].every(i=>i.complete&&i.naturalWidth>0));
  assert((await page.locator('.atlas-layer-scene').boundingBox()).width>900);
  assert.equal(await page.locator('#play-button').isDisabled(),true);
  await page.getByRole('button',{name:'权属成果',exact:true}).click();
  assert.equal(await page.getByRole('button',{name:'权属成果',exact:true}).getAttribute('aria-pressed'),'true');
  await page.emulateMedia({reducedMotion:'no-preference'});
  assert.equal(await page.getByRole('button',{name:'权属成果',exact:true}).getAttribute('aria-pressed'),'true');
  await page.keyboard.press('a');
  assert.equal(await page.getByRole('button',{name:'权属成果',exact:true}).getAttribute('aria-pressed'),'true');
  await page.getByRole('button',{name:'合拢',exact:true}).click();
  assert.equal(await page.getByRole('button',{name:'合拢',exact:true}).getAttribute('aria-pressed'),'true');
  await page.getByRole('button',{name:'分层',exact:true}).click();
  assert.equal(await page.getByRole('button',{name:'分层',exact:true}).getAttribute('aria-pressed'),'true');
  await page.getByRole('button',{name:'查看图件',exact:true}).click();
  await page.waitForFunction(()=>{const i=document.getElementById('original-image');return !i.hidden&&i.complete&&i.naturalWidth>0;});
  assert.match(await page.locator('#image-title').innerText(),/权属/);
  await page.keyboard.press('Escape');await page.getByRole('button',{name:'复位图层',exact:true}).click();
  assert.equal(await page.getByRole('button',{name:'基础影像',exact:true}).getAttribute('aria-pressed'),'true');
 }finally{await browser.close();}
});
test('星空只响应鼠标视差，暂停和静态时保持画面，静止后停止重绘',async()=>{
 const browser=await chromium.launch({channel:'chrome'});
 const page=await browser.newPage({viewport:{width:1920,height:1200},offline:true});
 try{
  await page.goto(url+'#p3');await page.locator('#starfield').waitFor({timeout:2000});
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
