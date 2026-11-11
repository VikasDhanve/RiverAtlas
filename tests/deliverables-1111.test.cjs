const {test}=require('node:test'),assert=require('node:assert/strict'),{chromium}=require('playwright'),{pathToFileURL}=require('url'),path=require('path');
test('第18页移除封面，三张截图等比展示、悬停放大且原图可缩放',async()=>{
 const b=await chromium.launch({channel:'chrome'}),p=await b.newPage({viewport:{width:1920,height:1080},offline:true,reducedMotion:'reduce'});
 try{
 await p.goto(pathToFileURL(path.resolve('index.html')).href+'#p18');
 assert.equal(await p.locator('.audit-table tbody tr').count(),6);
 const imgs=p.locator('.document-board img');assert.equal(await imgs.count(),3);
 assert.equal(await p.locator('#presentation [data-asset="27"]').count(),0);
 for(let i=0;i<3;i++){
  const img=imgs.nth(i);assert((await img.getAttribute('src')).endsWith('-expanded.png'));await img.evaluate(i=>i.decode());const dims=await img.evaluate(i=>({a:i.naturalWidth/i.naturalHeight,b:i.clientWidth/i.clientHeight}));assert(Math.abs(dims.a-dims.b)<.02);
  await img.hover();await p.waitForSelector('#media-loupe');
  await p.locator('.document-board .image-button').nth(i).click();await p.locator('#original-image').evaluate(i=>i.decode());
  assert(await p.locator('#image-dialog').isVisible());assert(!(await p.locator('#original-image').getAttribute('src')).includes('-expanded'));const w=await p.locator('#original-image').evaluate(i=>i.clientWidth);await p.getByRole('button',{name:'放大原件',exact:true}).click();assert(await p.locator('#original-image').evaluate(i=>i.clientWidth)>w);await p.keyboard.press('Escape');
 }
 for(const win of await p.locator('.document-window').all()){const d=await win.evaluate(w=>{const i=w.querySelector('img');return {w:w.clientWidth,h:w.clientHeight,iw:i.clientWidth,ih:i.clientHeight,bg:getComputedStyle(w).backgroundColor};});assert(Math.abs(d.w-d.iw)<=5 && Math.abs(d.h-d.ih)<=5);assert.equal(d.bg,'rgb(255, 255, 255)');}
 await p.mouse.move(10,10);await p.screenshot({path:'backups/deliverables-20261111/desktop.png'});
 await p.setViewportSize({width:390,height:844});assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));
 for(const img of await imgs.all())assert(await img.isVisible());
 await p.screenshot({path:'backups/deliverables-20261111/mobile.png',fullPage:true});
 }finally{await b.close();}
});
