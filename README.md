# RiverAtlas Showcase

大连市自然资源统一确权登记工作市级确权项目汇报。可离线运行的30页HTML交互演示，当前业务版本v1.4.0。

## 打开演示

双击根目录的`RiverAtlasShowcase.html`，或打开`RiverAtlas/index.html`。无需安装依赖、联网或启动服务。第二、三、七页另有直达HTML入口。请完整保留RiverAtlas目录内的src、assets和入口文件相对位置。

## 目录

- `RiverAtlas/`：完整工程源码、原图资源、使用说明、设计与验证文档、测试。
- `RiverAtlasShowcase.html`：完整演示启动入口。
- `打开第二页交互样板.html`、`打开第三页政策展陈.html`、`打开第七页立体图层.html`：快捷入口。
- `RiverAtlasShowcase-v1.4-效果预览.webm`：当前版本操作预览。
- `交付清单.json`：工程及验证信息。

演示操作、内容修改位置、事实边界、素材许可与已知限制详见[工程使用说明](RiverAtlas/README.md)。原始PPT保留在原始素材目录，只读且未迁移进本仓库。

## 开发验证

在RiverAtlas目录执行`npm ci --ignore-scripts`和`npm test`，使用本机Chrome或Playwright浏览器。`node scripts/verify-content.cjs`验证35页来源、39业务图像及43原图指纹；在同一目录执行`node tests/package-smoke.cjs ..`可检查根目录启动入口及离线交互。

## Git版本管理

本机项目：`D:\WorkSpace Development\AppResource\RiverAtlasShowcase`。

私有仓库：https://github.com/VikasDhanve/RiverAtlasShowcase 。默认分支main。版本以Git提交和标签管理，历史ZIP/7z、备份、旧录屏与临时审查截图已清理；node_modules、测试截图、日志、压缩包不进入Git。需要临时交付ZIP时可手动运行RiverAtlas/scripts/package.py，生成文件不作为版本库备份保存。

完成修改及验证后，在项目根目录执行`git add <具体文件>`、`git commit -m "变更说明"`、`git push`。读取版本用`git log --oneline`和`git tag`。首次同步以v1.4.0作为基线，v1.0—v1.3未重建为虚构Git历史。

仓库保留源素材和第三方许可声明，未部署GitHub Pages。原稿中的草案、外地样例和历史日期继续保留；第七页为资料分层示意，实际业务验收、会议设备表现及人员工时仍待确认。
