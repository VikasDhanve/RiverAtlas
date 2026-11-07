'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {chromium}=require('playwright'),{pathToFileURL}=require('node:url'),path=require('node:path');
const url=pathToFileURL(path.resolve(__dirname,'../index.html')).href;
test('第21页悬停逐行聚焦、点击固定后临时预览其他行，移开恢复且可清除',async()=>{
 const b=await chromium.launch({channel:'chrome'}),p=await b.newPage({viewport:{width:1920,height:1080},offline:true,reducedMotion:'reduce'});
 try{
  await p.goto(url+'#p21');const choices=p.locator('.audit-table tbody button');assert.equal(await choices.count(),9);
  const cells=p.locator('.audit-table tbody tr').nth(3).locator('td');const normal=await cells.last().evaluate(n=>getComputedStyle(n).backgroundColor);
  await choices.nth(3).hover();assert.equal(await choices.nth(3).getAttribute('aria-current'),'true');assert.notEqual(await cells.last().evaluate(n=>getComputedStyle(n).backgroundColor),normal);
  await choices.nth(3).click();assert.equal(await choices.nth(3).getAttribute('aria-pressed'),'true');
  await choices.nth(6).hover();assert.equal(await choices.nth(6).getAttribute('aria-current'),'true');assert.equal(await choices.nth(3).getAttribute('aria-pressed'),'true');
  await p.locator('#slide-title').hover();assert.equal(await choices.nth(3).getAttribute('aria-current'),'true');assert.equal(await choices.nth(6).getAttribute('aria-current'),'false');
  await p.getByRole('button',{name:'清除聚焦',exact:true}).click();assert.equal(await p.locator('.audit-table [aria-pressed="true"]').count(),0);assert.equal(await p.locator('.audit-table [aria-current="true"]').count(),0);
  await choices.first().click();await p.keyboard.press('ArrowRight');assert.match(await p.locator('#slide-title').innerText(),/外部审核/);await p.keyboard.press('ArrowLeft');assert.equal(await p.locator('.audit-table [aria-pressed="true"]').count(),0);
  await p.goto(url+'#p7');assert.equal(await p.locator('.audit-table tbody button').count(),0,'仅第21页使用审核讲解交互');
 }finally{await b.close();}
});
test('第21页键盘切换与固定、Escape清除、触屏点选和减少动态均可用',async()=>{
 const b=await chromium.launch({channel:'chrome'}),p=await b.newPage({viewport:{width:1920,height:1080},offline:true,reducedMotion:'reduce'});
 try{
  await p.goto(url+'#p21');const choices=p.locator('.audit-table tbody button');await choices.first().focus();
  await p.keyboard.press('ArrowDown');assert.equal(await choices.nth(1).evaluate(n=>n===document.activeElement),true);
  await p.keyboard.press('End');assert.equal(await choices.last().evaluate(n=>n===document.activeElement),true);assert.equal(await p.locator('#page-count').innerText(),'21 / 30');
  await p.keyboard.press('Enter');assert.equal(await choices.last().getAttribute('aria-pressed'),'true');await p.keyboard.press('Escape');assert.equal(await choices.last().getAttribute('aria-pressed'),'false');
  await p.keyboard.press('Home');await p.keyboard.press(' ');assert.equal(await choices.first().getAttribute('aria-pressed'),'true');
  assert.equal(await choices.first().locator('..').evaluate(n=>getComputedStyle(n).transitionDuration),'0s');
  const touch=await b.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,offline:true,reducedMotion:'reduce'});
  await touch.goto(url+'#p21');const target=touch.locator('.audit-table tbody button').nth(5);await target.tap();assert.equal(await target.getAttribute('aria-pressed'),'true');await target.tap();assert.equal(await target.getAttribute('aria-pressed'),'false');assert.equal(await touch.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),true);await touch.close();
 }finally{await b.close();}
});
