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

test('第八页悬停切换缓慢连续，快速重选从当前位置衔接并最终选中最新图件',async()=>{
 const b=await chromium.launch({channel:'chrome'}),p=await b.newPage({viewport:{width:1920,height:1080},offline:true});
 try{
  await p.goto(url+'#p8');const plane=p.locator('.atlas-plane[data-layer="2"]');
  const center=async()=>{const r=await plane.boundingBox();return r.x+r.width/2;};
  const initial=await center();await p.getByRole('button',{name:'权属与成果',exact:true}).hover();await p.waitForTimeout(350);const middle=await center();
  await p.waitForTimeout(700);const final=await center();assert(Math.abs(initial-final)>100);assert(Math.abs(middle-final)>20,'350ms时应仍在顺滑移动');
  await p.getByRole('button',{name:'范围与现势',exact:true}).hover();await p.waitForTimeout(170);
  const choice=p.getByRole('button',{name:'权属与成果',exact:true});
  await choice.evaluate(n=>{
   const center=()=>{const r=document.querySelector('.atlas-plane[data-layer="2"]').getBoundingClientRect();return r.x+r.width/2;};
   n.addEventListener('pointerenter',()=>window.retargetBefore=center(),{capture:true,once:true});
   n.addEventListener('pointerenter',()=>window.retargetAfter=center(),{once:true});
  });
  await choice.hover();const jump=await p.evaluate(()=>Math.abs(window.retargetAfter-window.retargetBefore));assert(jump<2,'同一次悬停事件内不应瞬间跳到起点或终点');
  await p.getByRole('button',{name:'管制与保护',exact:true}).hover();await p.waitForTimeout(1100);assert.equal(await p.locator('.atlas-plane.active img').getAttribute('data-asset'),'110');
  await p.locator('#slide-title').hover();await p.waitForTimeout(300);assert.equal(await p.getByRole('button',{name:'管制与保护',exact:true}).getAttribute('aria-pressed'),'true');
 }finally{await b.close();}
});
