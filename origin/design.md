项目交接文档：伪3D乒乓球

1. 项目英文名 (Project English Name)

Neon Pong 3D (或 Retro 3D Ping Pong)

2. 设计文档 (Design Document)

2.1 游戏概述

一款基于 HTML5 Canvas 开发的单人对抗 AI 的休闲体育类网页游戏。游戏采用独特的“伪3D”（Pseudo-3D）透视视角和复古霓虹（Synthwave/Cyberpunk）极简画风，带给玩家强烈的空间感和怀旧街机体验。

2.2 核心玩法

视角：玩家位于球桌底部，向屏幕深处（Z轴）击球。

操作：通过移动鼠标（PC端）或左右滑动屏幕（移动端）来控制底部球拍的X轴位置。

胜负判定：将球击回给对手，若球越过对方的底线（Z轴 > 1.1）则玩家得分；若玩家漏接（Z轴 < -0.1），则AI得分。率先达到目标分数（默认5分）的一方获胜。

2.3 核心视觉与反馈

伪3D透视：球桌呈现近大远小的梯形，元素根据深度（Z轴）动态缩放。

速度感：球体运动时带有动态计算的残影尾迹。

空间辅助：球体在运动时会在桌面上投射阴影，帮助玩家判断球在空中的Y轴高度。

打击反馈：击球瞬间的音效（待接入）与全局画面轻微闪烁/震屏（当前通过透明度变化实现）。

3. 开发文档 (Development Document)

3.1 技术栈

前端核心：HTML5, CSS3, 原生 JavaScript (Vanilla JS)。

渲染引擎：HTML5 <canvas> 2D API（未依赖 WebGL 或任何第三方物理/渲染引擎）。

外部依赖：仅引入了 Google Fonts 的 Press Start 2P 像素字体。

3.2 架构与文件结构

项目采用极简的单文件架构（Single-File Architecture），所有 HTML 结构、CSS 样式和 JS 逻辑均集中在 index.html 中，便于快速部署和修改。

UI 层 (#ui-layer)：负责渲染计分板、开始界面、结算界面。利用 DOM 和 CSS 实现，与 Canvas 渲染分离。

游戏层 (#gameCanvas)：负责渲染所有游戏元素（球桌、球拍、球体、发光特效）。

3.3 核心技术逻辑

主循环 (Game Loop)：基于 requestAnimationFrame，分离了 update(dt)（状态逻辑更新）和 draw()（画面渲染），并使用 dt (Delta Time) 确保不同帧率下物理运动的一致性。

伪3D投影算法 (project 函数)：
核心公式：将逻辑坐标系 $(x \in [-1, 1], y \ge 0, z \in [0, 1])$ 映射为屏幕物理坐标 $(sx, sy)$。
利用梯形插值计算当前Z深度下的屏幕宽度和基础Y坐标，实现近大远小的透视缩放比例 scale。

物理模拟：

重力：vy -= gravity * dt 形成抛物线。

弹跳阻尼：触底时反弹 vy = -vy * bounceDamping。

切球机制：根据击球点与球拍中心的横向偏移量 (hitOffset)，赋予球不同的横向速度 (vx)，模拟旋球效果。

AI 逻辑：
基于简单状态机，AI 球拍向球的X坐标进行平滑插值移动，带有最大速度限制（aiSpeed），并加入了轻微的提前量预测。

4. 关卡和数值设计思路 (Level and Balancing Design)

当前为无尽循环的单关卡模式，难度通过局内动态加速来实现。

4.1 核心数值配置 (config 对象)

所有关键数值均提取在全局 config 对象中，方便后续策划调整：

baseSpeedZ: 1.2：基础Z轴发球速度，决定了游戏的基础节奏。

speedMultiplier: 1.05：难度递增核心。每次双方成功击球，Z轴速度都会乘以该系数，导致回合越长球速越快，考验玩家反应。

paddleWidth: 0.25：球拍宽度占球桌宽度的比例。数值越大容错率越高。

gravity: 2.5 & bounceDamping: 0.8：决定了球的抛物线手感，目前调整为偏向街机风格的快节奏弹跳。

4.2 AI 难度控制

AI 的强度主要由其移动速度 (aiSpeed = 2.0) 决定。

破局思路：因为 AI 速度有上限，玩家需要利用“切球机制”打出大角度的斜线球（增加 vx），或者通过长时间对拉触发 speedMultiplier 让球速超过 AI 的反应极限。

后续扩展建议：若要制作多关卡，可通过每关递增 aiSpeed（AI变快）、减小玩家 paddleWidth（容错变低）或增加 gravity（节奏变快）来实现难度分级。

5. 美术约束 (Art Constraints)

为了维持“复古极简”与“霓虹发光”的视觉风格，后续开发或添加新元素需遵守以下约束：

无贴图原则：除字体外，禁止引入外部位图资源（PNG, JPG等）。所有元素必须使用 Canvas API 绘制基础几何图形（线、圆、多边形）。

色彩规范：

背景色：深空黑/暗夜蓝 (#0d0d12)，保持高对比度。

玩家阵营/场景基调：青色/荧光蓝 (#00ffff)。

敌对阵营/危险元素：品红/荧光粉 (#ff0055)。

发光特效 (Glow Effect)：

高度依赖 Canvas 的 shadowBlur 和 shadowColor 属性。

性能约束：大量使用 shadowBlur 非常消耗 GPU 性能。目前针对尾迹和桌面投影进行了阴影降级（仅本体有高强度发光）。若后续帧率下降，需优先优化或限制 shadowBlur 的调用次数。

UI 字体：统一使用像素风格字体 Press Start 2P，使用大写英文字母排版效果最佳。

6. 项目启动方式 (Project Startup Instructions)

得益于纯前端无依赖的单文件架构，项目启动极其简单：

方式一：直接运行 (仅限预览)

找到 index.html 文件。

双击该文件，使用任何现代浏览器（Chrome, Firefox, Safari, Edge）打开即可直接游玩。

方式二：本地开发环境 (推荐)

如果在开发过程中涉及到同源策略（比如未来加入音频文件或拆分 JS/CSS），推荐使用本地服务器：

下载并安装 Visual Studio Code。

在 VS Code 中安装插件 Live Server。

在 VS Code 中打开 index.html 文件。

右键编辑器空白处，选择 "Open with Live Server" (或按 Alt+L, Alt+O)。

浏览器将自动打开 http://127.0.0.1:5500/index.html，并且在您修改保存代码时实现自动热重载 (Hot Reload)。

方式三：生产环境部署

可以直接将 index.html 上传至 GitHub Pages, Vercel, Netlify 或任何静态服务器的根目录下，无需任何构建（Build）步骤。