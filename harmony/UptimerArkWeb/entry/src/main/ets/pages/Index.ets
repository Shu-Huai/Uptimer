import { webview } from '@kit.ArkWeb';

import { TARGET_URL, WebControllerStore } from '../common/WebControllerStore';

@Entry
@Component
struct Index {
  @State private isLoading: boolean = true;
  @State private loadError: boolean = false;
  private controller: webview.WebviewController = new webview.WebviewController();

  aboutToAppear(): void {
    WebControllerStore.controller = this.controller;
  }

  private applyGestureInset(): void {
    const script = `(() => {
      document.documentElement.classList.add('arkweb');
      document.documentElement.style.setProperty('--ark-safe-bottom', '${WebControllerStore.bottomInsetVp}px');
      const probe = document.createElement('div');
      probe.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none;padding-bottom:env(safe-area-inset-bottom, 0px);';
      document.body.appendChild(probe);
      const envBottom = parseFloat(getComputedStyle(probe).paddingBottom) || 0;
      probe.remove();
      const tabbar = document.querySelector('.uptimer-tabbar');
      const tabbarStyle = tabbar ? getComputedStyle(tabbar) : undefined;
      const tabbarRect = tabbar ? tabbar.getBoundingClientRect() : undefined;
      return JSON.stringify({
        nativeBottomVp: ${WebControllerStore.bottomInsetVp},
        envBottom,
        appliedPadding: tabbarStyle?.paddingBottom ?? 'missing',
        tabbarTop: tabbarRect?.top ?? -1,
        tabbarBottom: tabbarRect?.bottom ?? -1,
        viewportHeight: window.innerHeight
      });
    })()`;
    this.controller.runJavaScript(script).then((result) => {
      console.info(`ArkWeb safe-area diagnostic: ${result}`);
    }).catch((error: Error) => {
      console.error(`Failed to apply ArkWeb gesture inset: ${error.message}`);
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
        .onPageBegin(() => {
          this.isLoading = true;
          this.loadError = false;
        })
        .onPageEnd(() => {
          this.isLoading = false;
          this.applyGestureInset();
        })
        .onConsole((event) => {
          console.info(`ArkWeb web console: ${event.message.getMessage()}`);
          return false;
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
