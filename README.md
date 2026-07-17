<div align="center">
  <img src="src/app/icon.svg" alt="UpTimer icon" width="72" />
  <h1>UpTimer</h1>
  <p>用计时、记录、目标和奖励，把时间投入转化为可持续的行动反馈。</p>
</div>

UpTimer 是一个基于 Next.js 的全栈时间管理应用。用户可以记录活动耗时、运行计时器、设置周期目标，并通过积分兑换自定义奖励。项目还提供一个 HarmonyOS ArkWeb 壳应用，用于加载部署中的 Web 版本。

## 功能

- 用户注册、登录和基于 Cookie 的会话认证
- 活动管理：名称、图标、正/中/负向性质和每小时积分倍率
- 手动创建记录和计时器记录
- 日历式记录浏览、日期导航和历史补录
- 每日、每周和每月目标，支持达成奖励与未达成惩罚
- 积分流水、余额计算和奖励兑换
- 可切换主题、响应式页面和移动端底部导航
- HarmonyOS ArkWeb 容器：复用现有 Web 页面与业务逻辑

## 技术栈

| 层次 | 技术 |
| --- | --- |
| Web 应用 | Next.js 16、React 19、TypeScript |
| 样式与交互 | Tailwind CSS 4、`date-fns`、Iconify |
| 服务端 | Server Actions、API Routes、Zod |
| 数据层 | Prisma 7、PostgreSQL |
| 认证与安全 | `jose`、`bcryptjs`、HTTP-only Cookie |
| 移动端壳 | HarmonyOS ArkWeb、ArkTS/ArkUI |

## 项目结构

```text
src/
├── app/          # 页面、布局和 API Routes
├── actions/      # 面向页面的 Server Actions
├── components/   # 可复用 UI 和业务组件
├── lib/          # 认证、数据库、时间和通用工具
└── modules/      # activity、auth、goal、points、record、reward、timer 领域模块
prisma/
├── schema.prisma # PostgreSQL 数据模型
├── migrations/   # 数据库迁移
└── seed.ts       # 示例数据
harmony/
└── UptimerArkWeb/ # HarmonyOS ArkWeb 壳应用
```

## 快速开始

### 环境要求

- Node.js 20 或更高版本
- PostgreSQL
- npm

安装依赖：

```bash
npm install
```

复制环境变量模板：

```bash
cp .env.example .env
```

然后根据本地 PostgreSQL 配置修改 `.env`：

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/uptimer?schema=public"
AUTH_SECRET="replace-with-a-long-random-secret"
AUTH_COOKIE_SECURE="false"
```

> [!WARNING]
> `AUTH_SECRET` 请替换为随机长密钥。`AUTH_COOKIE_SECURE="false"` 仅适用于本地 HTTP 开发或受控环境；生产环境应使用 HTTPS 并启用安全 Cookie。

初始化数据库并填充示例数据：

```bash
npm run db:migrate
npm run db:seed
```

启动开发服务器：

```bash
npm run dev
```

应用默认运行在 [http://localhost:4399](http://localhost:4399)。

## 常用命令

```bash
npm run dev        # 启动开发服务器
npm run build      # 创建生产构建
npm run start      # 启动生产服务器
npm run lint       # 运行 ESLint
npm test           # 运行测试
npm run db:generate # 生成 Prisma Client
npm run db:migrate  # 创建并应用开发迁移
npm run db:seed     # 写入示例数据
```

## 架构概览

```text
浏览器 / HarmonyOS ArkWeb
          │
          ▼
Next.js 页面、Server Actions、API Routes
          │
          ▼
领域服务与 Repository
          │
          ▼
Prisma Client ── PostgreSQL
```

核心业务围绕 `User`、`Activity`、`Record`、`TimerSession`、`Goal`、`PointTransaction` 和 `RewardItem` 展开。记录会保存活动名称、性质和积分倍率快照，避免活动后续修改影响历史数据。

## HarmonyOS ArkWeb

鸿蒙端位于 `harmony/UptimerArkWeb`，它是一个 Web 壳应用，不包含独立后端或离线数据层。运行时由 ArkWeb 加载已经部署的 UpTimer 地址，页面和业务逻辑仍由 Next.js 提供。

在 DevEco Studio 中打开：

```text
harmony/UptimerArkWeb
```

当前壳应用依赖手机通过 IPv6 访问部署域名，并且电脑端的 Next.js 服务保持在线。正式发布前应迁移到 HTTPS，并重新评估安全 Cookie、断网提示和离线能力。

## 数据库模型

主要关系如下：

- 一个用户拥有多个活动、记录、计时会话、目标和奖励
- 活动可以关联多个目标，目标按日/周/月结算
- 记录来自手动录入或计时器，并产生积分流水
- 目标结算产生奖励或惩罚积分
- 奖励兑换会创建兑换记录，并保留兑换时的价格快照

数据库模型和迁移位于 [`prisma/`](prisma/)。

## 进一步了解

- 页面入口：[`src/app/`](src/app/)
- 领域服务：[`src/modules/`](src/modules/)
- 数据模型：[`prisma/schema.prisma`](prisma/schema.prisma)
- 环境变量模板：[`.env.example`](.env.example)
- HarmonyOS 说明：[`harmony/UptimerArkWeb/README.md`](harmony/UptimerArkWeb/README.md)
