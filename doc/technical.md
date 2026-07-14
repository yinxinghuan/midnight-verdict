# 《午夜验客》技术文档

## 1. 技术栈

- 框架：React 18，使用函数组件与自定义 Hook。
- 语言：TypeScript 5；样式使用 Less，命名统一为 `mv-` 前缀的 BEM 变体。
- 构建：Vite 5，`base: './'`，`npm run build` 输出可部署的 `dist/`。
- 渲染：角色与揭晓素材使用响应式 `<img>`，界面、漫画网点、柜台、HUD、动效和信号撕裂由 DOM/CSS 渲染。
- 音频：浏览器 Web Audio API 动态合成，不加载外部音频文件。
- 本地化：轻量 `zh / en` 字典，通过 `game_locale` 本地覆盖或浏览器语言自动选择。

## 2. 目录结构

```text
src/
  MidnightVerdict/
    MidnightVerdict.tsx          # 屏幕状态与界面组合
    MidnightVerdict.less         # C 漫画视觉、B 揭晓撕裂、响应式规则
    customers.ts                 # 12 位顾客、线索坐标与 8 人班次抽取
    types.ts                     # 阶段、判断结果与班次统计类型
    hooks/useMidnightVerdict.ts  # 状态机、计时、计分、暂停与结算
    i18n/index.ts                # 中英双语文案与插值
    components/Icons.tsx         # 自绘 SVG 功能图标
    utils/sounds.ts              # Web Audio 事件音效
  game-id.ts                     # 永久游戏 UUID
public/
  img/customers/                 # 12 张常态图与 5 张夜客揭晓图
  poster.png                     # 正式 1024×1024 海报
doc/                             # 需求、视觉、技术与生成来源记录
scripts/                         # Aigram transit 制作期素材脚本
```

## 3. 核心模块

- 状态管理与主循环：`useMidnightVerdict.ts` 管理 `start → briefing → playing → reveal → result`；营业阶段以 100 ms 间隔更新 18 秒倒计时，线索弹层、后台暂停与恢复层会冻结计时。
- 班次与计分：`createShiftDeck()` 固定林姐为首位，再抽取 4 位人类和 3 位夜客；正确判断得 `100 + 剩余整秒 × 5 + 连判奖励`，经理代判得 0 分并中断连判，3 次误判立即结算。
- 防重复与恢复：`submissionLock` 在首次 Pointer 判断同步上锁，避免双触发；`visibilitychange` 在切后台时进入 `suspended`，玩家必须主动继续。
- 屏幕适配：主体最大宽度为 430 px，手机内部重排；320×568 使用紧凑规则，桌面端居中显示，不使用整页 `transform` 缩放。
- 视觉与揭晓：C 方向是默认常态；夜客进入 `reveal` 时仅播放一次 420 ms 的 B 横向信号撕裂，然后展示角色揭晓图和漫画结果格；`prefers-reduced-motion` 会将动画压缩为静态变化。
- 音频与多语言：`sounds.ts` 按线索、盖章、正确、错误和最后 5 秒映射振荡器音色；`i18n/index.ts` 承担所有可见中文与英文文案。
- 存储：当前仅用 `localStorage` 保存历史最高分、静音与语言偏好；游戏 UUID 为 `ddaef39e-5766-4db8-b13d-642ee08ae318`，本版未接平台排行榜或云存档。

## 4. 扩展点

- 改玩法：在 `hooks/useMidnightVerdict.ts` 调整回合秒数、计分、误判上限与状态流；同步更新 `doc/requirements.md`。
- 加顾客：在 `customers.ts` 增加规格，在 `i18n/index.ts` 增加中英文名字、对白、三条线索、身份与反应，再把同名素材放入 `public/img/customers/`。
- 换素材或视觉：角色文件在 `public/img/customers/`；色盘、面板、热点、揭晓与响应式规则集中在 `MidnightVerdict.less`；正式素材生成来源记录在 `doc/*-generation.json`。
- 调数值：回合时长与分数公式位于 `useMidnightVerdict.ts`，牌组比例位于 `customers.ts`，动画时长位于 `MidnightVerdict.less`。
- 加后端：以 `src/game-id.ts` 的永久 UUID 作为平台 `session_id`，在 Hook 外增加独立运行时适配层，再把结果持久化作为结算副作用；不要阻塞第一层输入反馈。
