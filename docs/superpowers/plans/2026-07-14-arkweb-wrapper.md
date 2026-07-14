# ArkWeb Wrapper Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a HarmonyOS ArkWeb shell project that loads the existing Uptimer site at `http://uptimer.lvshuhuai.cn`.

**Architecture:** Keep the existing Next.js app, Nginx IPv6 reverse proxy, and PostgreSQL on computer A. Add a separate HarmonyOS Stage-model application under `harmony/UptimerArkWeb`; its only business-facing responsibility is to load the existing site in ArkWeb, while native code handles Internet permission, loading state, retry, and system back navigation.

**Tech Stack:** HarmonyOS Stage model, ArkTS, ArkUI, ArkWeb, DevEco Studio SDK installed at `C:\Program Files\Huawei\DevEco Studio\sdk\default`.

---

### Task 1: Create the HarmonyOS project shell

**Files:**
- Create: `harmony/UptimerArkWeb/AppScope/app.json5`
- Create: `harmony/UptimerArkWeb/entry/build-profile.json5`
- Create: `harmony/UptimerArkWeb/entry/src/main/module.json5`
- Create: `harmony/UptimerArkWeb/build-profile.json5`
- Create: `harmony/UptimerArkWeb/entry/src/main/resources/base/profile/main_pages.json`

- [x] **Step 1: Create the Stage-model project metadata**

Use bundle name `com.lvshuhuai.uptimer`, one `entry` module, phone/tablet device types, and the installed SDK's compatible API level selected by DevEco Studio. Keep the generated signing configuration empty so DevEco Studio can create or select a local debug signature.

- [x] **Step 2: Add the main page route**

Set `main_pages.json` to contain the single page:

```json
{
  "src": [
    "pages/Index"
  ]
}
```

- [x] **Step 3: Verify DevEco recognizes the project**

Open `harmony/UptimerArkWeb` in DevEco Studio and allow it to synchronize dependencies. Expected result: the `entry` module is visible and no missing module or malformed JSON5 error appears.

### Task 2: Implement the ArkWeb page

**Files:**
- Create: `harmony/UptimerArkWeb/entry/src/main/ets/pages/Index.ets`
- Create: `harmony/UptimerArkWeb/entry/src/main/ets/entryability/EntryAbility.ets`

- [x] **Step 1: Add the WebView controller and remote URL**

Use the current SDK import `import { webview } from '@kit.ArkWeb';`, create one `webview.WebviewController`, and load:

```text
http://uptimer.lvshuhuai.cn
```

Render the `Web` component full-screen inside a `Stack`.

- [x] **Step 2: Add loading and failure states**

Use the installed SDK's `onPageBegin`, `onPageEnd`, `onProgressChange`, and `onErrorReceive` callbacks. Set `isLoading` on `onPageBegin`, clear it on `onPageEnd`, and set `loadError` in `onErrorReceive`. While loading, show a centered `Progress`. On failure, show `无法连接 Uptimer` and a `重新加载` button that calls `controller.loadUrl(TARGET_URL)`.

- [x] **Step 3: Add system back navigation**

Keep the controller in a small exported `WebControllerStore` object owned by `Index.ets`. In `EntryAbility.ets`, implement the SDK's `UIAbility.onBackPressed(): boolean`; call `controller.accessBackward()` and then `controller.backward()` when it returns true. Return `true` when the WebView handled the back action, and return `false` when there is no Web history so the system closes the page.

### Task 3: Configure network access and application metadata

**Files:**
- Modify: `harmony/UptimerArkWeb/entry/src/main/module.json5`
- Create/Modify: `harmony/UptimerArkWeb/entry/src/main/resources/base/element/string.json`
- Create/Modify: `harmony/UptimerArkWeb/entry/src/main/resources/base/media/*`

- [x] **Step 1: Declare Internet permission**

Add the normal permission:

```json
"requestPermissions": [
  {
    "name": "ohos.permission.INTERNET"
  }
]
```

- [x] **Step 2: Set app labels and icon resources**

Set the visible application name to `UpTimer`. Use a generated project icon for the first debug build; do not add a custom branding task to this phase.

- [x] **Step 3: Keep HTTP session behavior compatible**

On computer A, keep `AUTH_COOKIE_SECURE="false"`. The ArkWeb app must use the same hostname as the Nginx site so the existing session Cookie remains first-party to `uptimer.lvshuhuai.cn`.

### Task 4: Build and network verification

**Files:**
- No source changes unless verification exposes a compile error.

- [x] **Step 1: Verify computer A independently**

Run on A:

```powershell
npm run build
npm run start
```

From a device that has IPv6 connectivity, open `http://uptimer.lvshuhuai.cn` and verify the login page appears.

- [x] **Step 2: Build the HarmonyOS debug application**

Use DevEco Studio's Build/Run action for the `entry` module. Expected result: the project compiles and installs without an ArkWeb or permission error.

- [ ] **Step 3: Test the acceptance path**

On the HarmonyOS device verify: initial page load, login, one timer start/stop, one record view, browser-back behavior, and retry after temporarily making the server unreachable.

- [x] **Step 4: Document the run commands**

Add a short `harmony/UptimerArkWeb/README.md` explaining that computer A must be running Nginx and Next.js, the phone must have IPv6, and DevEco Studio opens the HarmonyOS project root.

### Task 5: Commit the HarmonyOS wrapper

**Files:**
- All files under `harmony/UptimerArkWeb`
- `harmony/UptimerArkWeb/README.md`

- [x] **Step 1: Run repository checks**

Run the HarmonyOS build in DevEco Studio and inspect `git diff --check`. Expected result: successful build and no whitespace errors.

- [ ] **Step 2: Commit the wrapper**

```powershell
git add harmony/UptimerArkWeb
git commit -m "feat: add HarmonyOS ArkWeb wrapper"
```
