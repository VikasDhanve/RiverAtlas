---
name: RiverAtlas
description: 以真实测绘图件与正式文书为中心的离线项目汇报视觉系统
colors:
  sea: '#061a2c'
  panel: '#123750'
  water: '#67d8ea'
  ink: '#edf4f8'
  muted: '#b6cbd9'
  paper: '#fff'
  amber: '#f4c56a'
  line: '#365066'
  control-hover: '#20455e'
  control-pressed: '#225269'
  control-pressed-ink: '#b5f3fb'
  control-disabled: '#829bad'
  play: '#1c4c63'
  play-ink: '#d5f8fc'
  process: '#0c263d'
  process-active: '#16455e'
  dialog: '#0c253a'
  media-body: '#d7e6ed'
  paired-paper: '#f5f6f4'
  photo-surface: '#0b2437'
typography:
  display:
    fontFamily: '"Microsoft YaHei", "DengXian", "PingFang SC", sans-serif'
    fontSize: 78px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: .015em
  headline:
    fontFamily: '"Microsoft YaHei", "DengXian", "PingFang SC", sans-serif'
    fontSize: 55px
    fontWeight: 650
    lineHeight: 1.25
    letterSpacing: -.025em
  title:
    fontFamily: '"Microsoft YaHei", "DengXian", "PingFang SC", sans-serif'
    fontSize: 26px
    fontWeight: 600
  body:
    fontFamily: '"Microsoft YaHei", "DengXian", "PingFang SC", sans-serif'
    fontSize: 25px
    lineHeight: 1.58
  lead:
    fontFamily: '"Microsoft YaHei", "DengXian", "PingFang SC", sans-serif'
    fontSize: 26px
    lineHeight: 1.55
  label:
    fontFamily: '"Microsoft YaHei", "DengXian", "PingFang SC", sans-serif'
    fontSize: 18px
    lineHeight: 1.3
  note:
    fontFamily: '"Microsoft YaHei", "DengXian", "PingFang SC", sans-serif'
    fontSize: 19px
    lineHeight: 1.55
  table:
    fontFamily: '"Microsoft YaHei", "DengXian", "PingFang SC", sans-serif'
    fontSize: 20px
    lineHeight: 1.5
  media-headline:
    fontFamily: '"Microsoft YaHei", "DengXian", "PingFang SC", sans-serif'
    fontSize: 43px
    fontWeight: 650
    lineHeight: 1.25
    letterSpacing: -.025em
  media-lead:
    fontFamily: '"Microsoft YaHei", "DengXian", "PingFang SC", sans-serif'
    fontSize: 22px
    lineHeight: 1.55
  media-title:
    fontFamily: '"Microsoft YaHei", "DengXian", "PingFang SC", sans-serif'
    fontSize: 24px
    fontWeight: 600
  media-body:
    fontFamily: '"Microsoft YaHei", "DengXian", "PingFang SC", sans-serif'
    fontSize: 21px
    lineHeight: 1.6
  media-control:
    fontFamily: '"Microsoft YaHei", "DengXian", "PingFang SC", sans-serif'
    fontSize: 16px
    lineHeight: 1.3
  media-caption:
    fontFamily: '"Microsoft YaHei", "DengXian", "PingFang SC", sans-serif'
    fontSize: 17px
    lineHeight: 1.4
    letterSpacing: .02em
rounded:
  button: 8px
  status: 6px
  input: 7px
  evidence: 10px
  panel: 12px
  dialog: 14px
  document: 2px
  gallery-tab: 4px
spacing:
  '5': 5px
  '6': 6px
  '8': 8px
  '9': 9px
  '10': 10px
  '12': 12px
  '14': 14px
  '16': 16px
  '18': 18px
  '20': 20px
  '22': 22px
  '24': 24px
  '28': 28px
  '30': 30px
  '36': 36px
  '40': 40px
  '60': 60px
  '64': 64px
components:
  button-plain:
    backgroundColor: transparent
    textColor: '{colors.ink}'
    typography: '{typography.label}'
    rounded: '{rounded.button}'
    padding: 10px 14px
  button-play:
    backgroundColor: '{colors.play}'
    textColor: '{colors.play-ink}'
    typography: '{typography.label}'
    rounded: '{rounded.button}'
    padding: 10px 12px
  button-hover:
    backgroundColor: '{colors.control-hover}'
  button-pressed:
    backgroundColor: '{colors.control-pressed}'
    textColor: '{colors.control-pressed-ink}'
  button-disabled:
    textColor: '{colors.control-disabled}'
  chapter-navigation:
    backgroundColor: transparent
    textColor: '{colors.muted}'
    rounded: '0'
    padding: 12px 16px
  chapter-navigation-current:
    textColor: '{colors.water}'
  status-label:
    backgroundColor: transparent
    textColor: '{colors.amber}'
    rounded: '{rounded.status}'
    padding: 7px 14px
  search-input:
    backgroundColor: '{colors.sea}'
    textColor: '{colors.ink}'
    rounded: '{rounded.input}'
    padding: 12px
    width: min(600px, 100%)
  evidence-surface:
    backgroundColor: '{colors.paper}'
    rounded: '{rounded.document}'
    padding: 5px
    width: 100%
  process-node:
    backgroundColor: '{colors.process}'
    textColor: '{colors.ink}'
    rounded: '{rounded.panel}'
    padding: 28px 24px
  process-node-active:
    backgroundColor: '{colors.process-active}'
  dialog:
    backgroundColor: '{colors.dialog}'
    textColor: '{colors.ink}'
    rounded: '{rounded.dialog}'
    padding: 30px
    width: 94vw
  evidence-paired:
    backgroundColor: '{colors.paired-paper}'
    rounded: '{rounded.document}'
    padding: 5px
  evidence-photo:
    backgroundColor: '{colors.photo-surface}'
    rounded: '{rounded.document}'
    padding: 5px
  media-copy:
    textColor: '{colors.media-body}'
    typography: '{typography.media-body}'
    padding: 6px 4px 6px 0
  gallery-tab:
    textColor: '{colors.ink}'
    typography: '{typography.media-control}'
    rounded: '{rounded.gallery-tab}'
    padding: 5px
    width: 38px
  focus-media:
    textColor: '{colors.ink}'
    typography: '{typography.media-control}'
    rounded: '{rounded.button}'
    padding: 5px 12px
  map-surface:
    backgroundColor: '{colors.paper}'
    rounded: '{rounded.evidence}'
---

# Design System: RiverAtlas

## Overview

**Creative North Star: "测绘证据台"**

以真实测绘图件、正射影像、正式文书和登记簿形成汇报的视觉依据。深海蓝承担稳定的讲解背景，水系青蓝引导章节、流程与技术重点，白色证据面承接原始图件；图件与正文拥有主要阅读面积，媒体页进一步采用窄讲解栏、双页展台与专注图件。

这是沿用已授权方案并按用户本轮反馈扩展后提取的现行系统。字体继续使用微软雅黑、等线与中文系统后备，全部离线；首页和结束页对原稿装饰山河背景作可控WebGL视觉演绎，业务原件保持原貌。未执行概念seed或独立效果图轮，不据此宣称完整Impeccable流程合规。

**Key Characteristics:**

- 原图、文书和来源构成证据，概念分层清楚标注示意。
- 深色讲解背景与白色原件阅读面并存。
- 固定演示画布与小屏纵向阅读共享内容。
- 人工推进，按业务组入场、显式图件播放与可控环境动态，静态内容始终可读。

依据为[产品说明](PRODUCT.md)、[演示方向合同](docs/演示方向合同.md)、`src/styles.css`、`src/app.js`、`src/landscape.js`与`src/content.js`。本次为v1.1既有系统的最小merge，保留世界、普通字体角色与事实边界，同步当前媒体展陈及动效。当前审查见[动效改版独立审查](docs/动效改版独立审查.md)：报告提出F1记录同步、F2移除讲解侧条，文末复核已将F1/F2两项评为resolved；ship仅为这两项修复评分，不扩大为重新全表验收。旧首版ship仅为历史，不代表当前整体批准。“测绘证据台”仍是实现的描述性命名，不是补造的选型或用户额外批准。

## Colors

深海蓝与水系青蓝构成讲解环境，雾白与文件白分别服务正文和原件；规范色值由顶部frontmatter定义，均取自实际CSS。

### Primary

- **水系青蓝**（`water`）：章节当前项、页底演示位置线、流程连线、焦点轮廓和技术标题。
- **深海底色**（`sea`）：全局背景、主画布及输入背景，形成连续的会议展示空间。
- **次级海蓝**（`panel`）：公告时长等结构性面板；组件另有实际使用的邻近深蓝色面，不强行统一。

### Secondary

- **待确认琥珀**（`amber`）：状态与事实边界提示，不是已完成或成功色。

### Neutral

- **正文雾白**（`ink`）：深色背景上的正文及交互文字。
- **辅助灰蓝**（`muted`）：图注、页注、导航默认态与阅读辅助。
- **文件白**（`paper`）：地图、表格图像和原件承托底色，保留原貌；双页文书使用现有近白底（`paired-paper`），照片使用现有深蓝底（`photo-surface`）。
- **媒体正文雾白**（`media-body`）：窄讲解栏的正文角色色，不改变原普通正文色。
- **边界蓝灰**（`line`）：描边按钮及辅助分隔。
- **控件状态色**（`control-hover`、`control-pressed`、`control-pressed-ink`、`control-disabled`）与**播放色**（`play`、`play-ink`）：只描述交互状态，不挪作业务状态编码。
- **流程与弹层色面**（`process`、`process-active`、`dialog`）：区分流程讲解位置和阅读层。

**The 证据原貌 Rule.** 一般图件在白色证据面中完整容纳；第二页使用带内容标签的阅读取景，完整原件随时可查。技术高亮和取景均不改写图内证据。

侧车八阶`tonalRamp`仅供面板预览：按原色相生成OKLCH明度样带，不是产品已经采用的额外token，不授权替换实际CSS颜色。

## Typography

**Display Font:** 微软雅黑，后备等线、苹方与sans-serif。

**Body Font:** 与展示字体相同；没有另设在线字体或等宽字体系统。

**Character:** 正式中文汇报以清楚、稳定为先。字族由用户既有方案约定，不为审美改换。页码、步骤与面积读数使用实际CSS的等宽数字特性。

### Hierarchy

- **Display**：`display`用于封面业务名称，保留完整分行；结尾主标题为100px的专用变体，不推广为通用标题。
- **Headline**：`headline`用于普通页主标题，允许平衡换行。临时方向稿的64—76px预估已由实际55px普通标题、78px封面角色取代。
- **Title**：`title`是普通图文说明小标题；流程、边界和成果布局已有不同的大标题，不强制统一。
- **Body**：`body`对应普通图文正文；各业务布局已有24—29px差异，不把单一角色硬套到全部页面。
- **Lead / Note**：`lead`与`note`负责导语及来源边界，保持主次。
- **Label / Table**：`label`对应工具栏文字；`table`对应主画布审核表。原稿详情保留独立阅读字号与横向滚动。

- **Media**：`media-headline`、`media-lead`、`media-title`、`media-body`、`media-control`与`media-caption`记录当前媒体页和窄讲解栏的角色。它们是场景覆盖，保留普通`headline`、`lead`、`title`与`body`，不统一替换所有业务页。

小屏普通和媒体主标题均33px、封面36px，媒体导语与正文通常18px，讲解小标题21px，审核表15px；这是现有纵向回退值。规范角色见frontmatter，其余业务专用覆盖以源码为准。

**The 离线中文 Rule.** 沿用已约定的中文字体栈，不引入依赖联网的展示字体；字号以实际实现的角色定义为准。

## Layout

桌面基准画布1600×900，顶栏76px、底栏78px，中间为主展示区域。按视口宽高能容纳的最小比例整体缩放并双轴居中；超宽屏保留两侧背景。普通页内边距36px 64px 22px，导航与讲解工具位于边缘。

布局随资料类型变化：媒体图文页为310px讲解栏与自适应展台，间距30px，媒体页内边距22px 36px 18px；当前展台可用等宽双页并列，间距18px。“专注图件”即时收起标题、导语与讲解栏，再点“显示讲解”恢复。第19页提供“程序演示 / 政策文件”双视图。讲解分组依靠青蓝小标题和22px组距，左内边距0，不使用新增侧边色条。地图页280px左栏、流程四列、成果三列、边界和要求两列继续保留。复用间距在`spacing`，不推导不存在的统一倍数比例。

宽度不超过767px时取消固定画布缩放和隐藏溢出，改纵向滚动；章节横排隐藏，可通过全部页面目录跳转。主要多列折为单列，河流选择保留两列，流程逐项纵排，底部工具栏换行。原稿表格保留最小宽度并在自身区域横向滚动，原件允许缩放与二维滚动。

小屏文书上下排列，展台最小高度350px、图件面最小高度330px、并列文书每份至少400px，工具可换行。封面使用原稿装饰山河背景和单侧深色渐变保障标题；原图含AI生成标记，不能称大连实拍、真实GIS或流速数据。桌面与小屏按原图比例裁切背景；一般正文图件完整容纳；第二页手动展陈使用有明确内容标签的阅读取景，完整原件随时可打开。地图聚焦仅为原稿栅格图像的局部查看。

## Elevation & Depth

内容页主要靠深蓝色面、细边框与分隔线分层，普通正文和流程保持平面。当前文书展台使用纸面投影（`0 12px 30px #0005`），会议照片面无投影；第七页当前图件层片使用`0 18px 28px #0007`物理投影，旧空白网格层片已替换。阅读弹层继续使用（`0 22px 40px #00000066`）和遮罩（`#00101de8`）。三类阴影与其用途在侧车扩展中记录，不推广为所有内容块装饰。

第七页用有原稿图像内容的立体层片表达资料关系，保留必要的“分层示意”标识；它不是精确配准的实测GIS叠加或三维地形。

**The 平面优先 Rule.** 普通内容页靠色面、细边框和留白分层；阴影仅服务文书承托、概念层分离与弹出阅读，不扩散为所有内容块的装饰。

## Shapes

按钮轻圆角，状态标签更紧凑，地图面与结构面板稍宽，弹层最大；当前文书及照片展台使用近直角的`document`，数字标签使用`gallery-tab`，准确半径见`rounded`。章节导航和目录行保留直角与线性结构。主要边框1px，当前章节2px下划线；地图与正式文书不套装饰轮廓，不把全部正文拆成卡片。

## Components

### Buttons

描边按钮直接、克制，播放按钮使用现有较亮深蓝底与浅青文字。工具栏按钮至少42px高；默认圆角和内边距见frontmatter，工具栏与导航按实际变体覆盖。精细指针悬停改变背景，按下缩放至0.97；播放按钮的ID背景优先于通用悬停，侧车保留这一差异。键盘焦点为青蓝3px轮廓，外偏4px；禁用项降低文字对比并移除点击光标。

### Chips

事实状态标签使用琥珀文字、细描边与轻圆角，没有可点击筛选行为。专题与原件标签是按钮，选中态使用`aria-pressed`；不要混写为同一种组件。

### Cards / Containers

一般媒体展台完整容纳业务图像，第二页手动展陈见下文；文书5px内边距、2px圆角和纸面投影；双页底色近白，照片面深蓝且无投影。点击图像本身打开完整原件，不再添加右下制作说明。数字标签切换当前图件，完整名称保留在可访问名称和图注；“专注图件”扩大展台。流程节点仍为深蓝底、细边框、可人工分步，新增顶部强调线与节点抬升，高亮只表示讲解位置。原稿资料列表保留独立的深蓝容器和白色图像底，密集信息可进阅读层。

### Inputs / Fields

页面目录提供标题搜索：深海背景、雾白文字、浅蓝边框、青蓝插入光标和固定圆角；占位文字有独立灰蓝色。沿用全局焦点。没有提交、错误验证或表单禁用系统，不推定不存在的状态。

### Navigation

桌面六章常驻，当前章使用青蓝文字与短下划线。页码和页底线只表演示位置。小屏通过全部页面目录跳转，可搜索30页标题。方向键翻页立即响应并聚焦主标题，允许当前入场；目录与hash跳转不播放入场。暂停、手动静态或系统减少动态时新页直接可读，不停在入场不可见起点。

### Original Reader

原生对话框承载原稿文字、表格和原件。原件层接近全屏，支持放大、缩小、适应窗口、滚动及关闭返回；打开时暂停动画，返回后手动继续。不能让缩略图成为业务原图唯一内容。

### Controlled Demonstration

本地GSAP编排封面文字、按业务组入场、双页文书归位、图件序列、概念叠层、流程节点/连线与草案面积条。文字650ms与信息组700ms建立顺序；展台入场1.05秒；手选图件850ms归位，一般图件页显式播放每3.2秒切一份，手选中断旧序列；第二、三、七页手动展陈除外，其播放禁用。第七页展开/合拢及选层由用户触发，550ms变换；流程阶段1.5秒、连线850ms；面积条入场1.4秒，数值始终完整。

首页和结束页新增原生WebGL水面UV波纹、微光、缓慢镜头与山体轻微视差，内容标题稳定。固定1440×672缓冲，至少32ms绘制间隔对应约30帧调度目标，非会议实机帧率承诺。按原图2848×1600与宿主比例计算取景；无WebGL或上下文丢失时用原图24秒轻缓运镜回退，不声称回退仍有真实水面波纹。背景是原稿含AI标记的装饰图，动态仅为视觉演绎。

暂停/继续、重播、跳过覆盖时间轴、图件过渡、地图、步骤与背景；后台和打开资料/原件/帮助自动暂停，返回后手动继续。离页销毁旧时间轴与WebGL资源。系统减少动态、手动静态和GSAP缺失保留完整阅读及人工分步。背景可持续运动，业务内容结束后静止且不自动翻页；任何高亮不等于真实办理完成。完整编排见[动效编排](docs/动效编排.md)，扩展值及历史对照见[动效改版设计补充](docs/动效改版设计补充.md)。

## Do's and Don'ts

### Do:

- **Do** 保留真实原图与白色阅读面，提供完整原件；第二页带标签的阅读取景不改原图字节。
- **Do** 让章节、页码与来源可查；页码只表示演示位置。
- **Do** 以文字保留草案、外地样例、历史资质、省本级语境和未知进度。
- **Do** 提供清楚焦点、立即响应的键盘和人工分步，并遵循系统及手动静态模式。
- **Do** 在既有大屏画布与小屏纵向回退中保持正文、表格和图例可读。

### Don't:

- **Don't** 以虚构地形、GIS坐标、实测动画或无依据指标增强视觉效果。
- **Don't** 为增加动效缩小正文、遮挡原图或让来源说明排队入场。
- **Don't** 将讲解高亮、进度线或概念图层解释为真实业务完成或空间量算。
- **Don't** 将手机等比缩成一张幻灯片，或让控件操作等待动画。
- **Don't** 将技术测试通过表述为业务验收或实际会议设备验收。

历史与复核范围：v1.0的38%/62%图文比例、220ms单容器短入场、键盘无入场、仅弹层投影及封面一次归位是首版记录，不再作为v1.1当前规则；历史规范已由主线程备份，本文件与侧车现同步当前实现。最新审查的F1/F2已完成修正并复核resolved，ship限定于该两项评分。未补造seed、效果图批准或全流程合规；测试记录不替代用户业务、辅助技术全项和会议设备验收，实际工时与办理进度仍未知。

## 第二页手动文书展陈（v1.2样板）

用户在尝试镜头叙事前明确改为“让我自己决定，例如鼠标滑过自动放大，不要自动播放”，覆盖此前定时镜头/自动交接建议。仅第二页替换为手动展陈，其余业务页保留v1.1。

左侧讲解栏280px、列距30px；文书区默认两列等宽、间距18px。精细鼠标移入某份文书，该列改为1.55fr，另一列.65fr；FLIP以transform承接宽度变化，镜头350ms power3.out。移开还原，点击文书或标题固定，再点解除；恢复全览按钮清除固定。键盘焦点直接聚焦、Enter固定，触屏点击同样可操作。系统减少动态/静态模式直接切换焦点，不隐藏信息。

中标通知书按承接正文、签章日期分别取景，合同按名称、签订信息取景，跳过扫描内部无信息空白；全件保留。通知书聚焦时默认正文优先，鼠标移到签章区可将其放大，镜头由指针位置决定，没有计时播放或自动翻页。取景不补造、擦除、重排原件字像，章印/日期可在完整原件核验。

纸面#f2f2ef、主字#14334a、次字#3c5c6d、分隔#c4d0d3、按钮边#9db2bc、悬停#dce9eb，原有纸面投影0 12px 30px #0005；容器4px角，标题25px/600、字段15px/500、v1.2固定提示14px、原件按钮16px、操作提示17px；v1.4已去掉默认固定提示和操作说明。卡片标题区15px 18px，阅读区12px 14px 0。窄屏上下排列，每份570px；不要求悬停。

本页“播放演示”“跳过”禁用，R或原重播按钮改为“恢复全览”。全局暂停包含当前镜头，离页销毁；文书默认不轮换、不自动切到下一页。该样板不改变先前用户授权的封面环境动态，亦不全局推广到其他页。

验证与本轮独立审查见docs/第二页交互样板验证.md和docs/第二页交互样板独立审查.md。早期“自动叙事”属于已被新指令替代的建议，不代表当前行为。

## 第三页政策目录与大幅阅览（v1.3当前扩展）

用户明确指出第三页图片多、左文字太窄和图文不协调，要求依据实际内容重新排版。本轮仅第三页改为政策目录与单份大幅阅览，第二页v1.2手动样板保留；前节“其余29页保留”描述v1.2时点，当前第三页由本节覆盖。

左目录650px（由旧媒体310px加宽），右侧自适应，列距44px；国家规范三项、省市方案两项、配套依据独立分组，完整文件名以24px/1.5行高展示，组标题23px/550、标准号18px、配套正文22px/1.6行高。目录填满可用宽度，空固定标记不占位；不用窄文字栏加数字图片切换器。

右侧阅览以1px蓝灰线分隔，内距34px；v1.3曾有文件标题29px/550、说明18px，v1.4已移除这两项。原件按实际比例完整容纳在纸面中，不增大白色外框来撑版。纸面投影沿用0 12px 30px #0005。所有五份文件都有目录入口和完整原件入口。

鼠标移入目录即预览，点击固定；固定后其他悬停不抢走当前文件，再次点击解除，R/恢复默认回到规程。移出整个目录/阅览区且未固定时返回默认文件。鼠标移入纸面放大1.42倍、移动指针选择放大位置，移出还原；明确为用户控制的阅读放大，不改变原始图像。文件选择280ms power3.out，纸面镜头250ms power3.out；仅transform/opacity运动。本页播放/跳过禁用，没有定时轮换/自动翻页。键盘焦点可预览、Enter固定；触屏点击固定，原件层可进一步放大。减少动态/暂停时直接切换，离页销毁旧过渡。

窄屏改目录在上、阅览在下；目录19px、组标题22px、配套18px，v1.3阅读窗460px、标题25px；v1.4已移除该标题，按钮可换行。文本、焦点、固定态及完整原件保持可用。样板验证与本轮审查见docs/第三页政策展陈验证.md、docs/第三页政策展陈独立审查.md；本轮尚不等于用户审美满意或会议实机验收。

## RiverAtlas：画面精简、星空与有图立体分层（v1.4）

按用户明确反馈，第三页右侧重复标题/标准号重复副标题、底部两段操作说明全部移除，文件纸面占满可用高度；1920×1080下可见高度超过620px。目录650px及完整政策名称保留。第二页“点击固定/移开”等提示、原件查看器说明段、流程讲解提示不再占画面；已固定状态和有意义按钮保留。流程步骤状态以sr-only aria-live供辅助技术读取，操作集中在帮助对话框。

背景仍以#061a2c为底，新增360个浅星点和极淡蓝雾，分远/中/近三个视差深度。Canvas 2D只响应指针：横向28px、纵向20px最大基准差，近景才达完整幅度；360星点是装饰配置，不是星表。鼠标附近最多12个节点组成短暂连线（最多16条星间连线与3条指针连接），16点细尾迹与连接线在650ms内平方淡出，之后收敛并停止requestAnimationFrame。线色122,184,209，星间alpha最高.22、指针.16、尾迹.26，线宽.55—.7px；不增加发光、模糊或全屏网格。绘制宽度上限1920，Canvas置于画布后方，不接管点击。暂停、后台、静态/系统减少动态均停止位移，静态归于基准星位；没有独立计时漂移或自动翻页。

第七页左栏380px、间距26px；左侧25px/550小标题与22px/1.55平衡换行。右侧使用1450px透视，层片720×380px、X旋转50°/Z旋转−18°，按视区缩放居中；四层间隔64px，选中层额外18px和横向展开。每层都有原始图件或影像局部：基础为image19影像区域；范围现势image17；权属image18；管制保护image19。层片并非精确地理共域配准，原稿未提供独立卫星影像文件、真实矢量/模型或影像平台与采集日期，不新增这些事实。

层片4px角、8px厚度、0 18px 28px #0007投影；当前层2px青色outline表示选择，不使用侧边装饰色条。标签25px/550，有原图内容，不再用空白网格。左侧选层/下一步、分层、合拢、复位图层和查看图件均为人工操作；合拢时所选图件居上便于核对，不是GIS数据计算。鼠标在场景内产生±2.5°轻微视角响应，离开回位；没有自动轮换。

窄屏文字在上、立体场景在下，场景至少320px；所有图件可独立打开完整原件。业务状态/草案/样例及“分层示意”属于事实标识，不在本次操作提示清理中删除。展示名和浏览器标题采用RiverAtlas，中文业务标题保留；输出目录为RiverAtlasShowcase，工程名和代码标识RiverAtlas保持。
