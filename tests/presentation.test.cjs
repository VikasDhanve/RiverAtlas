'use strict';
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const url = pathToFileURL(path.join(root, 'index.html')).href;
let browser;
before(async () => {
  const cache = path.join(os.homedir(), 'AppData/Local/ms-playwright');
  const candidates = [process.env.RIVER_ATLAS_BROWSER, 'C:/Program Files/Google/Chrome/Application/chrome.exe'];
  if (fs.existsSync(cache)) for (const n of fs.readdirSync(cache).sort().reverse()) {
    if (/^chromium-\d+$/.test(n)) candidates.push(path.join(cache, n, 'chrome-win64/chrome.exe'));
  }
  const executablePath = candidates.find(p => p && fs.existsSync(p));
  browser = await chromium.launch(executablePath ? { executablePath } : {});
});
after(async () => { await browser?.close(); });
test('离线入口显示业务名称，键盘翻页、首尾及非法页码均安全可用', async () => {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, reducedMotion: 'reduce' });
  try {
    await page.goto(url);
    await page.locator('#slide-title').waitFor();
    assert.match(await page.locator('#slide-title').innerText(), /大连市自然资源/);
    await page.keyboard.press('ArrowRight');
    await page.waitForFunction(() => document.querySelector('#page-count').textContent.includes('02 / 32'));
    await page.keyboard.press('End');
    assert.equal(await page.locator('#page-count').innerText(), '32 / 32');
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.locator('#page-count').innerText(), '32 / 32');
    await page.keyboard.press('Home');
    assert.equal(await page.locator('#page-count').innerText(), '01 / 32');
    await page.goto(url + '#p9999');
    assert.equal(await page.locator('#page-count').innerText(), '32 / 32');
    await page.goto(url + '#<img%20src=x%20onerror=alert(1)>');
    assert.equal(await page.locator('#page-count').innerText(), '01 / 32');
  } finally { await page.close(); }
});

test('39个业务原件均可离线打开，缩放和关闭后保持原讲解页', async () => {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, offline: true });
  const errors = [], remote = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('request', r => { if (/^https?:/.test(r.url())) remote.push(r.url()); });
  try {
    await page.goto(url + '#p20');
    await page.getByRole('button', { name: '原稿资料', exact: true }).click();
    await page.getByRole('button', { name: '全部39份业务图像', exact: true }).click();
    const originals = page.locator('#sources-content .source-image');
    assert.equal(await originals.count(), 39);
    for (let i = 0; i < 39; i++) {
      await originals.nth(i).click();
      await page.waitForFunction(() => {
        const img = document.getElementById('original-image');
        return img.complete && img.naturalWidth > 0 && !img.hidden;
      });
      assert(await page.locator('#original-image').evaluate(img => img.naturalWidth > 0));
      if (i === 0) {
        const before = await page.locator('#original-image').evaluate(img => img.getBoundingClientRect().width);
        await page.getByRole('button', { name: '放大原件', exact: true }).click();
        const after = await page.locator('#original-image').evaluate(img => img.getBoundingClientRect().width);
        assert(after > before * 1.4);
        await page.getByRole('button', { name: '适应窗口', exact: true }).click();
      }
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('#image-dialog').evaluate(d => d.open), false);
    }
    await page.getByRole('button', { name: '返回汇报', exact: true }).click();
    assert.equal(await page.locator('#page-count').innerText(), '20 / 32');
    assert.deepEqual(remote, []); assert.deepEqual(errors, []);
  } finally { await page.close(); }
});

test('完整35页转录、全部原始表格和六章目录可查找，空结果有反馈', async () => {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, reducedMotion: 'reduce' });
  try {
    await page.goto(url + '#p22');
    await page.getByRole('button', { name: '原稿资料', exact: true }).click();
    await page.getByRole('button', { name: '全部35页', exact: true }).click();
    assert.equal(await page.locator('.source-page').count(), 35);
    assert.equal(await page.locator('[data-source-page="9"] .source-table tr').count(), 6);
    assert.match(await page.locator('[data-source-page="28"]').innerText(), /地图审核程序/);
    assert.match(await page.locator('[data-source-page="30"]').innerText(), /210200331000003/);
    assert.match(await page.locator('[data-source-page="29"]').innerText(), /15个工作日/);
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: '全部页面', exact: true }).click();
    assert.equal(await page.locator('.contents-entry').count(), 32);
    await page.getByRole('searchbox').fill('不存在的标题');
    assert.match(await page.locator('#contents-list').innerText(), /没有匹配页面/);
    await page.getByRole('searchbox').fill('内部审核分工（一）');
    await page.locator('.contents-entry').click();
    assert.equal(await page.locator('#page-count').innerText(), '22 / 32');
    for (const [chapter, expected] of [['项目实施','06 / 32'],['专家论证','20 / 32'],['项目审核','21 / 32'],['项目公告','26 / 32'],['项目登簿','29 / 32'],['项目概况','01 / 32']]) {
      await page.getByRole('button', { name: chapter, exact: true }).click();
      assert.equal(await page.locator('#page-count').innerText(), expected);
    }
  } finally { await page.close(); }
});

test('讲解流程支持暂停、继续、逐步、重播、跳过及离页中断', async () => {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, reducedMotion: 'no-preference' });
  try {
    await page.goto(url + '#p16');
    await page.getByRole('button', { name: '播放演示', exact: true }).click();
    await page.waitForTimeout(1700);
    await page.getByRole('button', { name: '暂停', exact: true }).click();
    const saved = await page.locator('#step-description').innerText();
    await page.waitForTimeout(1700);
    assert.equal(await page.locator('#step-description').innerText(), saved);
    await page.getByRole('button', { name: '继续', exact: true }).click();
    await page.getByRole('button', { name: '跳过', exact: true }).click();
    assert.match(await page.locator('#step-description').innerText(), /第4步/);
    await page.getByRole('button', { name: '重播', exact: true }).click();
    assert.match(await page.locator('#step-description').innerText(), /第1步/);
    await page.getByRole('button', { name: '下一步', exact: true }).click();
    assert.match(await page.locator('#step-description').innerText(), /第2步/);
    await page.getByRole('button', { name: '原稿资料', exact: true }).click();
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#pause-button').getAttribute('aria-pressed'), 'true');
    for (let i = 0; i < 8; i++) await page.keyboard.press('ArrowRight');
    assert.equal(await page.locator('#page-count').innerText(), '24 / 32');
    assert.equal(await page.locator('#slide-title').count(), 1);
  } finally { await page.close(); }
});

test('静态模式与系统减少动态效果保留全部内容，流程可直接分步', async () => {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, reducedMotion: 'reduce' });
  try {
    await page.goto(url + '#p21');
    assert.equal(await page.locator('#static-button').getAttribute('aria-pressed'), 'true');
    assert.equal(await page.locator('#play-button').isDisabled(), true);
    await page.getByRole('button', { name: '下一步', exact: true }).click();
    assert.match(await page.locator('#step-description').innerText(), /第2步/);
    assert.equal(await page.locator('.process-node').count(), 4);
    assert.match(await page.locator('.slide-lead').innerText(), /省本级/);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.locator('#static-button').click();
    assert.equal(await page.locator('#static-button').getAttribute('aria-pressed'), 'true');
    await page.keyboard.press('a');
    assert.equal(await page.locator('#static-button').getAttribute('aria-pressed'), 'false');
  } finally { await page.close(); }
});

test('全屏能进入并退出，地图聚焦和成果专题能切换', async () => {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, reducedMotion: 'reduce' });
  try {
    await page.goto(url + '#p5');
    await page.getByRole('button', { name: '英那河 庄河市', exact: true }).click();
    assert.match(await page.locator('.map-controls').innerText(), /英那河.*庄河市/);
    await page.getByRole('button', { name: '恢复全图', exact: true }).click();
    await page.getByRole('button', { name: '全屏', exact: true }).click();
    await page.waitForFunction(() => Boolean(document.fullscreenElement));
    await page.getByRole('button', { name: '退出全屏', exact: true }).click();
    await page.waitForFunction(() => !document.fullscreenElement);
    await page.goto(url + '#p19');
    await page.getByRole('button', { name: '碧流河水流资源专题图', exact: true }).click();
    assert.equal(await page.locator('.gallery-caption').innerText(), '碧流河水流资源专题图');
  } finally { await page.close(); }
});

test('桌面、大屏及小屏全部32页无内容越界，按需保存画面证据', async () => {
  const capture = process.env.RIVER_ATLAS_CAPTURE === '1';
  const captureDir = path.join(root, '.impeccable/review'); fs.mkdirSync(captureDir, { recursive: true });
  const failures = [], errors = [];
  const selected = [1,5,6,8,9,16,17,20,22,27,30];
  for (const [width,height] of [[1366,768],[1920,1080],[2560,1440],[3840,2160],[3440,1440],[390,844]]) {
    const page = await browser.newPage({ viewport: { width, height }, reducedMotion:'reduce' });
    page.on('pageerror', e => errors.push(e.message));
    try {
      for (let p = 1; p <= 32; p++) {
        await page.goto(url + '#p' + p);
        await page.locator('#slide-title').waitFor();
        await page.evaluate(async () => { await Promise.all([...document.querySelectorAll('#presentation img')].map(i => i.decode().catch(() => {}))); });
        const bounds = await page.evaluate(() => {
          const content = document.querySelector('.slide-content');
          if (!content) return [];
          const r = content.getBoundingClientRect(), out = [];
          for (const n of content.querySelectorAll('h2,p,td,th,.gallery-tabs,.map-controls,.process-node')) {
            const b = n.getBoundingClientRect();
            if (b.width && (b.bottom > r.bottom + 3 || b.right > r.right + 3 || b.left < r.left - 3)) out.push(n.textContent.slice(0,70));
          }
          if (document.documentElement.scrollWidth > window.innerWidth + 2) out.push('horizontal page overflow');
          return out;
        });
        if (bounds.length) failures.push({width,height,page:p,bounds});
        if (capture && ((width === 1920) || selected.includes(p))) {
          await page.screenshot({ path: path.join(captureDir, `screen-${width}-p${String(p).padStart(2,'0')}.png`), fullPage:true });
        }
        if (capture && p===1 && width===1920) await page.screenshot({path:path.join(captureDir,'desktop.png'),fullPage:true});
        if (capture && p===1 && width===390) await page.screenshot({path:path.join(captureDir,'mobile.png'),fullPage:true});
      }
    } finally { await page.close(); }
  }
  fs.writeFileSync(path.join(root,'docs/layout-check.json'), JSON.stringify({failures,errors},null,2));
  assert.deepEqual(errors, []); assert.deepEqual(failures, []);
});
