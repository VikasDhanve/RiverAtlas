'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {chromium}=require('playwright'),{pathToFileURL}=require('node:url'),path=require('node:path');
const manifest=require('../docs/source-manifest-1107.json');
test('第21页汇总九组内部审核职责，保留两源页要点并直接进入外部审核',async()=>{
 const b=await chromium.launch({channel:'chrome'}),p=await b.newPage({viewport:{width:1920,height:1080},offline:true,reducedMotion:'reduce'});
 try{
  const url=pathToFileURL(path.resolve(__dirname,'../index.html')).href;
  for(const width of [1920,390]){
   await p.setViewportSize({width,height:width===1920?1080:844});await p.goto(url+'#p22');
   assert.equal(await p.locator('#slide-title').innerText(),'内部审核分工');
   assert.equal(await p.locator('.audit-table tbody tr').count(),9);
   const text=await p.locator('.audit-table').innerText();
   for(const source of [26,27])for(const phrase of manifest.slides.find(s=>s.page===source).texts.slice(4).filter(Boolean))assert(text.includes(phrase.replace('森林资源保护处、省林业和草原局','省林业和草原局')),phrase);
   assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),true);
  }
  await p.setViewportSize({width:1920,height:1080});await p.goto(url+'#p22');
  await p.keyboard.press('ArrowRight');assert.equal(await p.locator('#slide-title').innerText(),'外部审核');
  assert.equal(await p.locator('#page-count').innerText(),'23 / 31');
  await p.getByRole('button',{name:'全部页面',exact:true}).click();assert.equal(await p.locator('.contents-entry').count(),31);
 }finally{await b.close();}
});
