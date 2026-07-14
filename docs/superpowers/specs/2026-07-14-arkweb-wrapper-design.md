# ArkWeb 壳应用设计说明

## 目标

将现有 Uptimer Next.js 全栈 Web 应用包装为 HarmonyOS 应用。第一阶段只做 ArkWeb 壳应用，不重写现有页面，不拆分前后端，不实现离线能力，不处理 HTTPS。

## 运行架构

```text
HarmonyOS ArkWeb 应用
  -> http://uptimer.lvshuhuai.cn
  -> 电脑 A Nginx IPv6 :80
  -> http://localhost:4399
  -> Next.js 页面、Server Actions、API Routes
  -> PostgreSQL
```

电脑 A 继续运行完整的 Next.js 应用；鸿蒙端只负责加载网站。手机需要能够通过 IPv6 解析并访问域名。

## 鸿蒙端范围

- 使用 DevEco Studio 创建 ArkTS + ArkUI 应用。
- 使用 ArkWeb `Web` 组件加载 `http://uptimer.lvshuhuai.cn`。
- 声明 `ohos.permission.INTERNET`。
- 页面占满应用窗口。
- 手机返回键优先执行网页后退；网页无历史记录时再退出应用。
- 加载失败时显示简单错误提示和重试入口。
- 允许 HTTP，第一阶段不强制安全 Cookie；电脑 A 的 `AUTH_COOKIE_SECURE` 保持 `false`。

## 不在本阶段实现

- 原生 ArkUI 重写业务页面。
- 离线缓存和离线数据同步。
- 推送、桌面卡片、后台计时等鸿蒙原生能力。
- 独立前端与独立后端拆分。
- HTTPS、证书和域名迁移。

## 验收标准

1. DevEco Studio 可以构建并安装应用。
2. 真机打开应用后能加载 Uptimer 登录页。
3. 登录 Cookie 能在 ArkWeb 中保持。
4. 计时、记录、目标和奖励等现有功能可正常操作。
5. 手机返回键能正确处理网页历史。
6. 断网或服务不可达时不会无提示地停留在空白页面。

## 风险与假设

- 鸿蒙手机所在网络必须支持 IPv6；如果手机浏览器不能打开目标地址，ArkWeb 也无法访问。
- 具体 ArkWeb API 名称以当前 DevEco Studio 安装的 HarmonyOS SDK 模板为准。
- HTTP 只适合开发和局域网/受控环境测试，正式发布前应迁移到 HTTPS。
