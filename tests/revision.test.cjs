'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
const url = pathToFileURL(path.resolve(__dirname, '../index.html')).href;
test('动态山河可暂停、继续和静态回退，主画面无制作来源文案', async () => {
  const browser = await chromium.launch({ channel: 'chrome' });
  const page = await browser.newPage({ viewport: { width:1920, height:1080 }, offline:true });
  try {
    await page.goto(url);
    await page.waitForSelector('.landscape-canvas.ready', { timeout:10000 });
    const frame = () => page.locator('.landscape-canvas').getAttribute('data-frame');
    const a = await frame(); await page.waitForTimeout(400); assert.notEqual(await frame(), a);
    assert.doesNotMatch(await page.locator('#presentation').innerText(), /取自原稿|原稿要求|点击查看完整原件/);
    await page.locator('#pause-button').click(); const b = await frame();
    await page.waitForTimeout(400); assert.equal(await frame(), b);
    await page.locator('#pause-button').click(); await page.waitForTimeout(400); assert.notEqual(await frame(), b);
    await page.locator('#static-button').click(); const c = await frame();
    await page.waitForTimeout(400); assert.equal(await frame(), c);
    await page.emulateMedia({ reducedMotion:'reduce' });
    assert.equal(await page.locator('#play-button').isDisabled(), true);
  } finally { await browser.close(); }
});
test('政策单图展陈，现用原稿图像均有主页面展示入口', async () => {
  const browser = await chromium.launch({ channel:'chrome' });
  const page = await browser.newPage({ viewport: {width:1920,height:1080}, reducedMotion:'reduce', offline:true });
  const shown = new Set();
  try {
    for (let n=1;n<=31;n++) {
      await page.goto(url+'#p'+n);
      for (const id of await page.locator('#presentation [data-asset]').evaluateAll(nodes=>nodes.map(n=>Number(n.dataset.asset)))) shown.add(id);
    }
    for (let id=5;id<=37;id++) if(![25,28,29,30,32].includes(id)) assert(shown.has(id), '主页面缺少业务图像 '+id);
    await page.goto(url+'#p4');
    assert.equal(await page.locator('.policy-choice').count(),5);
    const h=await page.locator('.policy-window').evaluate(n=>n.getBoundingClientRect().height);
    assert(h>500,'政策阅览高度应超过500像素，实际 '+h);
    assert((await page.locator('.policy-directory').boundingBox()).width>=700);
    assert.equal(await page.locator('#play-button').isDisabled(),true);
    await page.screenshot({ path:'.impeccable/review/policy-large.png' });
    await page.goto(url+'#p21');
    await page.getByRole('button',{name:'政策文件',exact:true}).click();
    assert.equal(await page.locator('.gallery-spread .image-button').count(),1);
  } finally { await browser.close(); }
});
test('无WebGL时背景正常回退，暂停翻页不隐藏正文，多图演示可中断', async () => {
  const browser=await chromium.launch({channel:'chrome'});
  const page=await browser.newPage({viewport:{width:1920,height:1080},offline:true});
  const errors=[]; page.on('pageerror',e=>errors.push(e.message));
  try {
    await page.addInitScript(()=>{
      const original=HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext=function(type,...args){return type==='webgl'?null:original.call(this,type,...args);};
    });
    await page.goto(url); await page.waitForTimeout(200);
    assert.equal(await page.locator('.landscape-canvas').count(),0);
    assert.equal(await page.locator('.cover-image').evaluate(i=>i.complete&&i.naturalWidth>0),true);
    await page.locator('#pause-button').click();
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.locator('.slide-heading').evaluate(n=>getComputedStyle(n).opacity),'1');
    await page.goto(url+'#p16'); await page.locator('#play-button').click();
    await page.waitForTimeout(3400); await page.locator('#pause-button').click();
    const caption=await page.locator('.gallery-caption').innerText();
    await page.waitForTimeout(3300); assert.equal(await page.locator('.gallery-caption').innerText(),caption);
    await page.locator('#replay-button').click();
    assert.match(await page.locator('.gallery-caption').innerText(),/碧流河.*登记单元图/);
    await page.locator('#skip-button').click();
    assert.match(await page.locator('.gallery-caption').innerText(),/碧流河.*水流资源专题图/);
    assert.deepEqual(errors,[]);
  } finally {await browser.close();}
});
