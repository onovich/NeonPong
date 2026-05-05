# Neon Pong 3D
Neon Pong 3D is a retro pseudo-3D table tennis game rebuilt from the original single-file Canvas prototype into a Vite-based project with separated data, engine, input, and view modules.<br/>**Neon Pong 3D 是一个复古伪 3D 乒乓球游戏，已从原始的单文件 Canvas 原型整理为基于 Vite 的工程，并拆分出数据、引擎、输入和视图模块。**

## Overview
- A solo arcade match against an AI opponent rendered with the HTML5 Canvas 2D API.<br/>**一款使用 HTML5 Canvas 2D API 渲染的单人对战 AI 街机游戏。**
- The visual direction keeps the synthwave neon table, glowing ball trail, and pseudo-3D depth cues described in the design document.<br/>**视觉方向保留了设计文档中的合成波霓虹球桌、发光尾迹和伪 3D 深度提示。**
- The current refactor establishes a migration-ready architecture for future Unity work rather than claiming a full engine-port-ready rewrite.<br/>**当前重构建立了面向未来 Unity 迁移的架构基础，而不是夸大为已经完成整套引擎级移植。**

## Features
- Mouse and touch input both control the player paddle on the near side of the table.<br/>**鼠标和触摸输入都可以控制近端玩家球拍。**
- Rally speed increases after each successful hit, while gravity and bounce damping keep the arcade-style ball curve.<br/>**每次成功回球后节奏都会加快，同时重力与阻尼维持街机风格的抛物线手感。**
- The AI tracks the ball with capped speed and simple forward prediction, leaving room for angle shots and long-rally pressure.<br/>**AI 通过限速跟随和简单前置预测来追球，为斜线切球和长回合压制留出破局空间。**

## Architecture
- src/data stores shared gameplay constants and presentation-facing values.<br/>**src/data 保存共享的玩法常量和面向表现层的参数。**
- src/logic/engine contains projection math, state factories, score rules, and rally updates that are kept independent from the DOM.<br/>**src/logic/engine 包含投影数学、状态工厂、得分规则和回合推进逻辑，并与 DOM 脱耦。**
- src/logic/hooks currently hosts the input binding layer so browser events stay outside the gameplay engine.<br/>**src/logic/hooks 当前承载输入绑定层，让浏览器事件留在玩法引擎之外。**
- src/view/screens and src/view/components assemble the overlay UI and the Canvas renderer without owning game rules.<br/>**src/view/screens 和 src/view/components 负责组装覆盖层 UI 与 Canvas 渲染器，但不持有游戏规则。**

## Getting Started
- Install dependencies with npm install.<br/>**使用 npm install 安装依赖。**
- Start the development server with npm run dev.<br/>**使用 npm run dev 启动开发服务器。**
- Create a production build with npm run build.<br/>**使用 npm run build 生成生产构建。**
- Preview the built site locally with npm run preview.<br/>**使用 npm run preview 在本地预览构建产物。**

## Deployment
- The repository is configured for GitHub Pages through .github/workflows/deploy.yml using the official Pages actions.<br/>**仓库已经通过 .github/workflows/deploy.yml 配置为使用官方 GitHub Pages Actions 部署。**
- The Vite base path is set to /NeonPong/ for repository-based Pages hosting.<br/>**Vite 的 base 路径已设置为 /NeonPong/，适配仓库子路径形式的 Pages 托管。**
- After pushing to main, set the repository Pages source to GitHub Actions in the GitHub settings panel.<br/>**推送到 main 后，需要在 GitHub 仓库设置里把 Pages Source 切换为 GitHub Actions。**

## Origin
- The untouched source prototype and the original handoff document remain in the origin directory for reference and rollback comparison.<br/>**未改动的原始原型和交接设计文档仍保留在 origin 目录中，便于对照和必要时回填。**