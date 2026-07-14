import { UIAbility } from '@kit.AbilityKit';
import { window } from '@kit.ArkUI';

import { WebControllerStore } from '../common/WebControllerStore';

export default class EntryAbility extends UIAbility {
  onWindowStageCreate(windowStage: window.WindowStage): void {
    try {
      const mainWindow = windowStage.getMainWindowSync();
      const systemAvoidArea = mainWindow.getWindowAvoidArea(window.AvoidAreaType.TYPE_SYSTEM);
      WebControllerStore.topInsetPx = systemAvoidArea.topRect.height;
      WebControllerStore.bottomInsetPx = systemAvoidArea.bottomRect.height;
      mainWindow.setWindowLayoutFullScreen(true).catch((error: Error) => {
        console.error(`Failed to enable immersive layout: ${error.message}`);
      });
      mainWindow.setWindowSystemBarEnable(['status', 'navigation']).catch((error: Error) => {
        console.error(`Failed to keep system bars visible: ${error.message}`);
      });
      mainWindow.setWindowSystemBarProperties({
        statusBarColor: '#00000000',
        navigationBarColor: '#00000000'
      }).catch((error: Error) => {
        console.error(`Failed to make system bars transparent: ${error.message}`);
      });
    } catch (error) {
      console.error(`Failed to configure immersive window: ${JSON.stringify(error)}`);
    }

    windowStage.loadContent('pages/Index', (error) => {
      if (error.code) {
        console.error(`Failed to load the page: ${error.code}, ${error.message}`);
      }
    });
  }

  onBackPressed(): boolean {
    const controller = WebControllerStore.controller;
    if (controller) {
      try {
        if (controller.accessBackward()) {
          controller.backward();
          return true;
        }
      } catch (error) {
        console.error(`Failed to navigate back in ArkWeb: ${JSON.stringify(error)}`);
      }
    }
    return false;
  }
}
