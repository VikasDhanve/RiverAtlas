'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'docs/source-manifest.json'), 'utf8'));
const context = {};
// 仅执行本工程受版本管理的编排数据，不接受上传或外部输入。
vm.runInNewContext(fs.readFileSync(path.join(root, 'src/content.js'), 'utf8') + '\nthis.slides = RiverAtlasSlides;', context);
const slides = context.slides;
assert.equal(slides.length, 32); assert.equal(manifest.slides.length, 35);
const expectedPages = Array.from({ length:35 }, (_, i) => i + 1);
const mapped = [...new Set(slides.flatMap(s => [...s.sources]))].sort((a,b) => a-b);
assert.deepEqual(mapped, expectedPages);
for (const asset of manifest.assets) {
  const data = fs.readFileSync(path.join(root, asset.path));
  assert.equal(crypto.createHash('sha256').update(data).digest('hex'), asset.sha256, asset.file);
}
const business = manifest.assets.filter(a => a.business);
assert.equal(business.length, 39);
const imagePages = manifest.slides.flatMap(s => s.images);
for (const a of business) assert(imagePages.includes(a.id), '未挂接原件：' + a.file);
const lines = ['# 内容覆盖验收', '', '此表检查编排覆盖与文件完整性，不以关键词计数替代人工语义检查。39个业务原件的离线打开、缩放和返回由浏览器测试验证。', '', '| 原稿页 | 演示页 | 原件编号 | 覆盖方式 |', '|---|---|---|---|'];
for (const source of manifest.slides) {
  const pages = slides.flatMap((s,i) => s.sources.includes(source.page) ? [i+1] : []);
  lines.push('| ' + source.page + ' | ' + pages.join('、') + ' | ' + (source.images.join('、') || '无嵌入图像') + ' | 对应页原稿资料内完整转录/表格/原件 |');
}
lines.push('', '自动结果：32页演示映射35页原稿，无来源页遗漏；43个原始图像文件指纹与提取时一致；39个业务原件均挂接到来源页。', '', '人工复核：四类边界、八步实施、六类成果与六项报告、四类审核、九组内部分工、七项登记审核、公告双渠道/15工作日/近远景照片、登簿前置条件及图属档一致均有主页面与详情承接。', '', '草案/外地/历史：大沙河公告标为原稿草案示例；广西贺江、南京清流河明确外地样例；历史资质所示有效期保留；省本级条款保留适用语境。五河属性已按2026-11-06补充，实际办理进度未编造。');
fs.writeFileSync(path.join(root, 'docs/内容覆盖验收.md'), lines.join('\n') + '\n');
console.log('Content: 35/35 source pages, 32 presentation pages, 39/39 business images, 43 unchanged image hashes.');
