'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {chromium}=require('playwright'),{pathToFileURL}=require('node:url'),path=require('node:path');
const url=pathToFileURL(path.resolve(__dirname,'../index.html')).href;

test('第六页为三栏完整流程，流光沿路径移动，暂停冻结且静态保留全图',async()=>{
 const b=await chromium.launch({channel:'chrome'}),p=await b.newPage({viewport:{width:1920,height:1080},offline:true});
 try{
  await p.goto(url+'#p6');const columns=await p.locator('.workflow-panel').evaluateAll(ns=>ns.map(n=>{const r=n.getBoundingClientRect();return{x:r.x,y:r.y,right:r.right};}));
  assert.equal(columns.length,3);assert(columns[0].right<columns[1].x&&columns[1].right<columns[2].x);assert(Math.abs(columns[0].y-columns[2].y)<2);
  const positions=()=>p.locator('.workflow-particle').evaluateAll(ns=>ns.filter(n=>Number(getComputedStyle(n).opacity)>.5).map(n=>n.getAttribute('transform')));
  await p.waitForTimeout(200);const before=await positions();assert(before.length>0);await p.waitForTimeout(180);assert.notDeepEqual(await positions(),before);
  await p.keyboard.press('p');const frozen=await positions();await p.waitForTimeout(200);assert.deepEqual(await positions(),frozen);
  await p.keyboard.press('a');assert.equal((await positions()).length,0);assert.equal(await p.locator('.workflow-node').count(),21);assert.equal(await p.locator('.workflow-route').count(),22);
  await p.emulateMedia({reducedMotion:'reduce'});await p.reload();await p.waitForTimeout(180);assert.equal((await positions()).length,0);
 }finally{await b.close();}
});

test('第八页主图交叉淡化可中断，重选连续且半秒左右完成',async()=>{
 const b=await chromium.launch({channel:'chrome'}),p=await b.newPage({viewport:{width:1920,height:1080},offline:true});
 try{
  await p.goto(url+'#p8');const plane=p.locator('.atlas-plane[data-layer="2"]');const opacity=()=>plane.evaluate(n=>Number(getComputedStyle(n).opacity));
  await plane.evaluate(n=>{window.fadeSamples=[];new MutationObserver(()=>window.fadeSamples.push(Number(getComputedStyle(n).opacity))).observe(n,{attributes:true,attributeFilter:['style']});});
  await p.getByRole('button',{name:'权属与成果',exact:true}).hover();await p.waitForTimeout(180);
  assert(await p.evaluate(()=>window.fadeSamples.some(value=>value>0&&value<1)),'过渡中两图应交叉淡化');
  await p.getByRole('button',{name:'范围与现势',exact:true}).hover();await p.waitForTimeout(70);
  const choice=p.getByRole('button',{name:'权属与成果',exact:true});
  await choice.evaluate(n=>{
   const state=()=>{const p=document.querySelector('.atlas-plane[data-layer="2"]'),r=p.getBoundingClientRect();return{y:r.y,opacity:Number(getComputedStyle(p).opacity)};};
   n.addEventListener('pointerenter',()=>window.retargetBefore=state(),{capture:true,once:true});n.addEventListener('pointerenter',()=>window.retargetAfter=state(),{once:true});
  });
  await choice.hover();const values=await p.evaluate(()=>[window.retargetBefore,window.retargetAfter]);
  if(values[0].opacity>.01){assert(Math.abs(values[0].y-values[1].y)<2);assert(Math.abs(values[0].opacity-values[1].opacity)<.02,'重选不应重新从透明起播');}
  await p.waitForTimeout(650);assert.equal(await opacity(),1);assert.equal(await p.locator('.atlas-plane.active img').getAttribute('data-asset'),'109');
 }finally{await b.close();}
});
