'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');const {chromium}=require('playwright');const path=require('node:path');const {pathToFileURL}=require('node:url');const url=pathToFileURL(path.resolve(__dirname,'../index.html')).href;
test('第五页为离线真实坐标地图，全部与五河选择定位、高亮和原件可用',async()=>{
 const b=await chromium.launch({channel:'chrome'});const p=await b.newPage({viewport:{width:1920,height:1080},offline:true,reducedMotion:'reduce'});const errors=[],remote=[];p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>{if(/^https?:/.test(r.url()))remote.push(r.url());});
 try{
  await p.goto(url+'#p3');await p.locator('.leaflet-container').waitFor({timeout:2500});
  assert.equal(await p.locator('.river-choice').count(),6);assert.equal(await p.getByRole('button',{name:'全部 五条河流总览',exact:true}).getAttribute('aria-pressed'),'true');
  assert.equal(await p.locator('.river-flow').count(),5);assert.equal(await p.locator('.map-window img').count(),0);
  assert(await p.locator('.river-channel').evaluateAll(ns=>ns.length===5&&ns.every(n=>parseFloat(getComputedStyle(n).strokeWidth)>3.6)),'五条河流均应比原线宽更清晰');
  const before=await p.locator('.river-channel[data-river="4"]').getAttribute('d');
  await p.getByRole('button',{name:'英那河 庄河市',exact:true}).click();assert.equal(await p.getByRole('button',{name:'英那河 庄河市',exact:true}).getAttribute('aria-pressed'),'true');
  assert.match(await p.locator('.map-controls').innerText(),/英那河.*庄河市/);assert.notEqual(await p.locator('.river-channel[data-river="4"]').getAttribute('d'),before);
  assert.equal(await p.locator('.river-flow:not(.river-dimmed)').count(),1);
  for(const name of ['登沙河 普兰店区、金普新区','大沙河 瓦房店市、普兰店区','浮渡河 瓦房店市','碧流河 庄河市、普兰店区'])await p.getByRole('button',{name,exact:true}).click();
  await p.getByRole('button',{name:'全部 五条河流总览',exact:true}).click();assert.equal(await p.locator('.river-flow:not(.river-dimmed)').count(),5);
  await p.getByRole('button',{name:'查看原件',exact:true}).click();await p.waitForFunction(()=>document.getElementById('original-image').naturalWidth>0);assert.match(await p.locator('#image-title').innerText(),/五河空间/);
  assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);
 }finally{await b.close();}
});
test('动态河流暂停和静态可控，地图键盘平移不翻页，离页返回可重建',async()=>{
 const b=await chromium.launch({channel:'chrome'});const p=await b.newPage({viewport:{width:1920,height:1080},offline:true});
 try{
  await p.goto(url+'#p3');await p.locator('.leaflet-container').waitFor();
  const pane=p.locator('.leaflet-map-pane'),beforeDrag=await pane.getAttribute('style'),box=await p.locator('.leaflet-container').boundingBox();
  await p.mouse.move(box.x+180,box.y+160);await p.mouse.down();await p.mouse.move(box.x+240,box.y+185,{steps:5});await p.mouse.up();assert.notEqual(await pane.getAttribute('style'),beforeDrag);
  const beforeZoom=await p.locator('.river-channel[data-river="4"]').getAttribute('d');await p.getByRole('button',{name:'放大地图',exact:true}).click();
  await p.waitForFunction(before=>document.querySelector('.river-channel[data-river="4"]').getAttribute('d')!==before,beforeZoom);
  const offset=()=>p.locator('.river-flow').first().evaluate(n=>getComputedStyle(n).strokeDashoffset);
  await p.keyboard.press('p');await p.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));const paused=await offset();await p.waitForTimeout(200);assert.equal(await offset(),paused);
  await p.keyboard.press('p');await p.waitForTimeout(180);assert.notEqual(await offset(),paused);
  await p.keyboard.press('a');const still=await offset();await p.waitForTimeout(180);assert.equal(await offset(),still);
  await p.locator('.leaflet-container').focus();await p.keyboard.press('ArrowRight');assert.equal(await p.locator('#page-count').innerText(),'03 / 31');
  await p.locator('#slide-title').focus();await p.keyboard.press('ArrowRight');assert.equal(await p.locator('#page-count').innerText(),'04 / 31');await p.keyboard.press('ArrowLeft');assert.equal(await p.locator('.leaflet-container').count(),1);
 }finally{await b.close();}
});
test('地图库缺失时回退原图，触屏与减少动态仍可选择河流',async()=>{
 const b=await chromium.launch({channel:'chrome'});const p=await b.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,offline:true,reducedMotion:'reduce'});
 try{
  await p.goto(url+'#p3');await p.getByRole('button',{name:'浮渡河 瓦房店市',exact:true}).tap();assert.match(await p.locator('.map-controls').innerText(),/浮渡河/);
  await p.route('**/leaflet.js',r=>r.abort());await p.reload();await p.waitForFunction(()=>{const i=document.querySelector('.map-window img');return i&&i.complete&&i.naturalWidth>0;});
  await p.getByRole('button',{name:'查看原件',exact:true}).tap();await p.waitForFunction(()=>document.getElementById('original-image').naturalWidth>0);
 }finally{await b.close();}
});
