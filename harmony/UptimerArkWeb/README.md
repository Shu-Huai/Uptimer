# UpTimer HarmonyOS ArkWeb

这是 UpTimer 的 HarmonyOS ArkWeb 壳应用。它不包含独立后端，启动后会加载电脑 A 通过 Nginx 提供的：

```text
http://uptimer.lvshuhuai.cn
```

## 电脑 A

确保电脑 A 的 Nginx 和 Next.js 服务已启动：

```powershell
npm run build
npm run start
```

并确保 `.env` 中使用：

```env
AUTH_COOKIE_SECURE="false"
```

## DevEco Studio

在 DevEco Studio 中打开本目录：

```text
harmony/UptimerArkWeb
```

选择 `entry` 模块运行。鸿蒙手机必须能通过 IPv6 访问 `uptimer.lvshuhuai.cn`，否则 ArkWeb 无法加载页面。

## 当前限制

- 当前使用 HTTP，仅适合开发或受控环境测试。
- 应用依赖电脑 A 在线，暂不支持离线。
- 页面和业务逻辑仍由现有 Next.js 应用提供。
