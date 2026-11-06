'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const path=require('node:path'),{pathToFileURL}=require('node:url');
const url=pathToFileURL(path.resolve(__dirname,'../index.html')).href;
test('第五页属性区只显示属性，总览与单河均无重复标题',async()=>{
 const b=await chromium.launch({channel:'chrome'}),p=await b.newPage({viewport:{width:1920,height:1080},offline:true,reducedMotion:'reduce'});
 try{await p.goto(url+'#p5');assert.equal(await p.locator('.river-attributes h2').count(),0);assert.match(await p.locator('.river-attributes').innerText(),/28.4[\s\S]*327.98/);
 await p.getByRole('button',{name:'登沙河 普兰店区、金普新区',exact:true}).click();assert.equal(await p.locator('.river-attributes h2').count(),0);assert.doesNotMatch(await p.locator('.river-attributes').innerText(),/登沙河|市级/);assert.match(await p.locator('.river-attributes').innerText(),/28.4[\s\S]*327.98/);
 }finally{await b.close();}
});
test('第六页按原图保留21节点与22条关系，包含全部分支、回流和入库关联',async()=>{
 const b=await chromium.launch({channel:'chrome'}),p=await b.newPage({viewport:{width:1920,height:1080},offline:true,reducedMotion:'reduce'});
 const expected=['prepare>basemap','basemap>preunit','preunit>indoor','indoor>related','related>verify','verify>mapping','mapping>database','database>revision','prepare>organization','prepare>technical','prepare>materials','indoor>naturalSurvey','indoor>ownershipSurvey','verify>boundaryCheck','verify>naturalCheck','verify>ownershipCheck','verify>relatedCheck','verify>supplement','supplement>mapping','supplement>dispute','dispute>mapping','revision>acceptance'].sort();
 try{
  await p.goto(url+'#p6');assert.equal(await p.locator('svg.workflow-diagram .workflow-node').count(),21);
  const actual=await p.locator('.workflow-route').evaluateAll(ns=>ns.map(n=>n.dataset.from+'>'+n.dataset.to).sort());assert.deepEqual(actual,expected);
  const label=async(from,to)=>p.locator(`.workflow-route[data-from="${from}"][data-to="${to}"]`).getAttribute('data-label');
  assert.equal(await label('verify','mapping'),'成果无异议');assert.equal(await label('verify','supplement'),'权属不清、有争议或成果缺失');assert.equal(await label('supplement','mapping'),'争议解决或成果完善');assert.equal(await label('supplement','dispute'),'争议仍无法解决');
  for(const ids of [['prepare','basemap','preunit'],['indoor','related','verify','mapping'],['database','revision']]){const ys=[];for(const id of ids)ys.push((await p.locator(`.workflow-node[data-node="${id}"]`).boundingBox()).y);assert(ys.every((y,i)=>!i||y>ys[i-1]));}
  assert.equal(await p.locator('.workflow-phase').count(),3);
  await p.getByRole('button',{name:'地籍调查阶段',exact:true}).click();assert.equal(await p.locator('.workflow-phase.is-current').getAttribute('data-phase'),'1');
 }finally{await b.close();}
});
test('缩略图图集主图有跟随局部放大镜，边缘避让且离图、翻页、打开原件会清除',async()=>{
 const b=await chromium.launch({channel:'chrome'}),p=await b.newPage({viewport:{width:1920,height:1080},offline:true});
 try{
  await p.goto(url+'#p9');const img=p.locator('.gallery-spread img');await img.hover();
  assert.equal(await p.locator('#media-loupe').count(),1);
  const first=await p.locator('#media-loupe img').getAttribute('style'),r=await img.boundingBox();await p.mouse.move(r.x+r.width*.72,r.y+r.height*.65);await p.waitForTimeout(50);
  assert.notEqual(await p.locator('#media-loupe img').getAttribute('style'),first);
  const box=await p.locator('#media-loupe').boundingBox();assert(box.x>=0&&box.y>=0&&box.x+box.width<=1920&&box.y+box.height<=1080);
  await p.locator('#slide-title').hover();assert.equal(await p.locator('#media-loupe').count(),0);
  await img.hover();await p.keyboard.press('ArrowRight');await p.waitForTimeout(500);assert.equal(await p.locator('#media-loupe').count(),0);
  await p.goto(url+'#p19');await p.locator('.gallery-spread img').hover();await p.locator('.gallery-spread .image-button').click();assert.equal(await p.locator('#media-loupe').count(),0);
  await p.keyboard.press('Escape');
  await p.emulateMedia({reducedMotion:'reduce'});await p.goto(url+'#p30');await p.locator('#slide-title').hover();await p.locator('.gallery-spread img').hover();assert.equal(await p.locator('#media-loupe').count(),1);
 }finally{await b.close();}
});
test('流程条件分支分别描绘，解决与未解决不同时高亮，暂停冻结描线',async()=>{
 const b=await chromium.launch({channel:'chrome'}),p=await b.newPage({viewport:{width:1920,height:1080},offline:true});
 try{
  await p.goto(url+'#p6');await p.getByRole('button',{name:'地籍调查阶段',exact:true}).click();
  await p.waitForFunction(()=>document.querySelector('.workflow-scenario').textContent.includes('成果无异议'));
  const opacity=(from,to)=>p.locator(`.workflow-signal[data-from="${from}"][data-to="${to}"]`).evaluate(n=>Number(getComputedStyle(n).opacity));
  assert.equal(await opacity('supplement','mapping'),0);assert.equal(await opacity('supplement','dispute'),0);
  await p.waitForFunction(()=>document.querySelector('.workflow-scenario').textContent.includes('争议解决或成果完善'));
  await p.keyboard.press('p');const offsets=()=>p.locator('.workflow-signal').evaluateAll(ns=>ns.map(n=>getComputedStyle(n).strokeDashoffset));
  const frozen=await offsets();await p.waitForTimeout(220);assert.deepEqual(await offsets(),frozen);await p.keyboard.press('p');
  await p.waitForFunction(()=>Number(getComputedStyle(document.querySelector('.workflow-signal[data-from="supplement"][data-to="dispute"]')).opacity)>.9);
  assert.equal(await opacity('supplement','mapping'),0);
  await p.getByRole('group',{name:'流程阶段'}).getByRole('button',{name:'数据入库',exact:true}).click();assert.equal(await p.locator('.workflow-scenario').innerText(),'');
 }finally{await b.close();}
});
test('放大镜在手动静态和暂停时没有入场动画，触屏不生成浮窗',async()=>{
 const b=await chromium.launch({channel:'chrome'}),p=await b.newPage({viewport:{width:1920,height:1080},offline:true});
 try{
  await p.goto(url+'#p9');await p.keyboard.press('a');await p.locator('.gallery-spread img').hover();assert.equal(await p.locator('.media-loupe-surface').evaluate(n=>n.getAnimations().filter(a=>a.playState==='running').length),0);
  await p.locator('#slide-title').hover();await p.keyboard.press('a');await p.keyboard.press('p');await p.locator('.gallery-spread img').hover();assert.equal(await p.locator('.media-loupe-surface').evaluate(n=>n.getAnimations().filter(a=>a.playState==='running').length),0);
  const touch=await b.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,offline:true});await touch.goto(url+'#p9');await touch.locator('.gallery-spread img').tap();assert.equal(await touch.locator('#media-loupe').count(),0);await touch.close();
 }finally{await b.close();}
});
test('第八页悬停左右双向切换，动画与左侧高亮保持一致且不会自行跳回',async()=>{
 const b=await chromium.launch({channel:'chrome'}),p=await b.newPage({viewport:{width:1920,height:1080},offline:true});
 try{
  await p.goto(url+'#p8');await p.getByRole('button',{name:'权属与成果',exact:true}).hover();
  await p.waitForTimeout(1000);assert.equal(await p.locator('.atlas-plane.active img').getAttribute('data-asset'),'109');
  const point=await p.locator('.atlas-plane[data-layer="3"]').evaluate(n=>{
   const r=n.getBoundingClientRect();for(let y=r.top+20;y<r.bottom-10;y+=20)for(let x=r.left+10;x<Math.min(innerWidth,r.right-5);x+=10)if(document.elementFromPoint(x,y)?.closest('.atlas-plane')===n)return{x,y};return null;
  });assert(point,'应有可悬停的背景专题图');await p.mouse.move(point.x,point.y);
  await p.waitForTimeout(400);assert.equal(await p.getByRole('button',{name:'管制与保护',exact:true}).getAttribute('aria-pressed'),'true');
  await p.locator('#slide-title').hover();await p.waitForTimeout(1000);assert.equal(await p.locator('.atlas-plane.active img').getAttribute('data-asset'),'110');
 }finally{await b.close();}
});
