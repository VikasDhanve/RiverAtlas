'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {chromium}=require('playwright'),{pathToFileURL}=require('node:url'),path=require('node:path');
const url=pathToFileURL(path.resolve(__dirname,'../index.html')).href;

test('第八页单向移过图面不反复选回已越过的图片',async()=>{
 const b=await chromium.launch({channel:'chrome'}),p=await b.newPage({viewport:{width:1920,height:1080},offline:true});
 try{
  await p.goto(url+'#p8');await p.mouse.move(600,540);await p.waitForTimeout(1000);
  await p.evaluate(()=>{
   window.selectionTrace=[];
   new MutationObserver(()=>{const id=document.querySelector('.atlas-plane.active')?.dataset.layer;if(window.selectionTrace.at(-1)!==id)window.selectionTrace.push(id);})
    .observe(document.querySelector('.atlas-stack'),{attributes:true,subtree:true,attributeFilter:['class']});
  });
  for(let x=660;x<=1250;x+=16){await p.mouse.move(x,540);await p.waitForTimeout(90);}
  const trace=await p.evaluate(()=>window.selectionTrace);assert.equal(new Set(trace).size,trace.length,'单向移动却反复选回：'+trace.join('→'));
 }finally{await b.close();}
});

test('固定预览区位置不变，来回快速划过不漂移，主图与左栏始终跟随最后选择',async()=>{
 const b=await chromium.launch({channel:'chrome'}),p=await b.newPage({viewport:{width:1920,height:1080},offline:true});
 try{
  await p.goto(url+'#p8');const bounds=()=>p.locator('.atlas-preview').evaluateAll(ns=>ns.map(n=>{const r=n.getBoundingClientRect();return[r.x,r.y,r.width,r.height];}));
  const initial=await bounds();
  for(const index of [1,2,3,2,0,3]){
   const thumb=p.locator('.atlas-preview').nth(index);await thumb.hover();
   assert.deepEqual(await bounds(),initial,'选择时预览区不得移动');
   const r=await thumb.boundingBox();for(let i=0;i<5;i++)await p.mouse.move(r.x+r.width/2+(i%2?6:-6),r.y+r.height/2);
   assert.equal(await p.locator('.atlas-plane.active').getAttribute('data-layer'),String(index));
   assert.equal(await p.locator('.atlas-layer-choice[aria-pressed="true"]').count(),1);
  }
  await p.waitForTimeout(650);assert.equal(await p.locator('.atlas-plane.active img').getAttribute('data-asset'),'110');
  assert.equal(await p.locator('.atlas-plane.active').evaluate(n=>Number(getComputedStyle(n).opacity)),1);
  await p.locator('.atlas-plane.active').hover();await p.mouse.move(1100,500,{steps:20});await p.waitForTimeout(150);
  assert.equal(await p.locator('.atlas-plane.active img').getAttribute('data-asset'),'110','主图自身的鼠标移动不得反向选图');
  await p.getByRole('button',{name:'单图',exact:true}).click();assert.equal(await p.locator('.atlas-preview-rail').isVisible(),false);
  await p.getByRole('button',{name:'图集',exact:true}).click();assert.equal(await p.locator('.atlas-preview-rail').isVisible(),true);
  await p.getByRole('button',{name:'预览：范围与现势',exact:true}).focus();await p.keyboard.press('Enter');assert.equal(await p.locator('.atlas-plane.active img').getAttribute('data-asset'),'108');
  const focus=await p.getByRole('button',{name:'预览：范围与现势',exact:true}).evaluate(n=>{const s=getComputedStyle(n);return[s.outlineWidth,s.outlineOffset];});assert.deepEqual(focus,['3px','4px'],'选中预览的键盘焦点须单独可见');
  const touch=await b.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,offline:true});
  await touch.goto(url+'#p8');await touch.getByRole('button',{name:'预览：管制与保护',exact:true}).tap();assert.equal(await touch.locator('.atlas-plane.active img').getAttribute('data-asset'),'110');
  await touch.waitForTimeout(600);const r=await touch.locator('.atlas-plane.active').boundingBox();assert(r.x>=0&&r.x+r.width<=390&&r.height>250);await touch.close();
 }finally{await b.close();}
});
