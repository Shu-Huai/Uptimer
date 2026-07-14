import { webview } from '@kit.ArkWeb';

import { TARGET_URL, WebControllerStore } from '../common/WebControllerStore';

let currentSystemDark: boolean | undefined;
let pageLoaded: boolean = false;

function syncSystemThemeToPage(isDark: boolean): void {
  const controller = WebControllerStore.controller;
  if (!controller || !pageLoaded) {
    console.info(`[UpTimer] system theme sync deferred. controller=${!!controller} pageLoaded=${pageLoaded} dark=${isDark}`);
    return;
  }

  const script = `(() => {
    const dark = ${isDark};
    window.__UPTIMER_SYSTEM_DARK__ = dark;
    let mode = null;
    try {
      mode = window.localStorage?.getItem('uptimer-theme') ?? null;
    } catch (_) {
      mode = null;
    }
    if (!mode || mode === 'system') {
      document.documentElement.dataset.theme = dark ? 'dark' : 'light';
      document.documentElement.classList.toggle('dark', dark);
      document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
    }
    window.dispatchEvent(new CustomEvent('uptimer-native-system-theme-change', { detail: { dark } }));
  })()`;

  try {
    console.info(`[UpTimer] syncing web system theme. dark=${isDark}`);
    controller.runJavaScript(script).then(() => {
    console.info(`[UpTimer] system theme synchronized. dark=${isDark}`);
    }).catch((error: Error) => {
      console.error(`[UpTimer] system theme synchronization failed: ${error.message}`);
    });
  } catch (error) {
    console.error(`[UpTimer] system theme synchronization threw: ${JSON.stringify(error)}`);
  }
}

export function setHarmonySystemTheme(isDark: boolean): void {
  AppStorage.setOrCreate<boolean>('uptimerSystemDark', isDark);
  currentSystemDark = isDark;
  console.info(`[UpTimer] system theme received. dark=${isDark}`);
  syncSystemThemeToPage(isDark);
}

@Entry
@Component
struct Index {
  @State private isLoading: boolean = true;
  @State private loadError: boolean = false;
  private controller: webview.WebviewController = new webview.WebviewController();

  aboutToAppear(): void {
    WebControllerStore.controller = this.controller;
    const storedSystemDark = AppStorage.get<boolean>('uptimerSystemDark');
    if (storedSystemDark !== undefined) {
      currentSystemDark = storedSystemDark;
      console.info(`[UpTimer] initial system theme loaded from AppStorage. dark=${storedSystemDark}`);
    }
  }

  private markArkWebDocument(): void {
    const script = `(() => {
      document.documentElement.classList.add('arkweb');
      return 'ok';
    })()`;
    this.controller.runJavaScript(script).catch((error: Error) => {
      console.error(`Failed to mark ArkWeb document: ${error.message}`);
    });
  }

  build() {
    Stack() {
      Web({
        src: TARGET_URL,
        controller: this.controller
      })
        .width('100%')
        .height('100%')
        .javaScriptAccess(true)
        .domStorageAccess(true)
        .onPageBegin((event) => {
          pageLoaded = false;
          this.isLoading = true;
          this.loadError = false;
          console.info(`[UpTimer] page begin: ${event.url}`);
        })
        .onPageEnd((event) => {
          pageLoaded = true;
          this.isLoading = false;
          this.markArkWebDocument();
          console.info(`[UpTimer] page end: ${event.url}`);
          const storedSystemDark = AppStorage.get<boolean>('uptimerSystemDark');
          if (storedSystemDark !== undefined) {
            currentSystemDark = storedSystemDark;
          }
          if (currentSystemDark !== undefined) {
            console.info(`[UpTimer] applying initial system theme after page end. dark=${currentSystemDark}`);
            syncSystemThemeToPage(currentSystemDark);
          }
        })
        .onErrorReceive(() => {
          this.isLoading = false;
          this.loadError = true;
        })

      if (this.isLoading && !this.loadError) {
        Column() {
          Text('正在加载 UpTimer…')
            .fontSize(16)
            .fontColor('#475569')
        }
        .width('100%')
        .height('100%')
        .justifyContent(FlexAlign.Center)
        .backgroundColor('#F8FAFC')
      }

      if (this.loadError) {
        Column({ space: 16 }) {
          Text('无法连接 UpTimer')
            .fontSize(18)
            .fontColor('#334155')

          Text('请检查手机 IPv6 网络，或确认电脑 A 的服务正在运行。')
            .fontSize(14)
            .fontColor('#64748B')
            .textAlign(TextAlign.Center)

          Button('重新加载')
            .onClick(() => {
              this.loadError = false;
              this.isLoading = true;
              this.controller.loadUrl(TARGET_URL);
            })
        }
        .width('100%')
        .height('100%')
        .justifyContent(FlexAlign.Center)
        .padding(32)
        .backgroundColor('#F8FAFC')
      }
    }
    .width('100%')
    .height('100%')
    .expandSafeArea(
      [SafeAreaType.SYSTEM],
      [SafeAreaEdge.TOP, SafeAreaEdge.BOTTOM]
    )
  }
}
