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

  private applySystemInsets(): void {
    const topInset = WebControllerStore.topInsetPx;
    const bottomInset = WebControllerStore.bottomInsetPx;
    const script = `(() => {
      const shell = document.querySelector('.uptimer-shell');
      if (shell) {
        shell.style.setProperty('--ark-safe-top', '${topInset}px');
        shell.style.setProperty('--ark-safe-bottom', '${bottomInset}px');
      }
      return 'ok';
    })()`;
    this.controller.runJavaScript(script).catch((error: Error) => {
      console.error(`Failed to apply system insets: ${error.message}`);
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
          this.applySystemInsets();
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
  }
}
