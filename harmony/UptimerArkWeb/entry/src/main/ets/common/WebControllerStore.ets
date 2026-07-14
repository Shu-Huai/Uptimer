import { webview } from '@kit.ArkWeb';

export const TARGET_URL = 'http://uptimer.lvshuhuai.cn';

export class WebControllerStore {
  static controller: webview.WebviewController | undefined = undefined;
}
