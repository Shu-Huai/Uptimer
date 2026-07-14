import { UIAbility } from '@kit.AbilityKit';
import { window } from '@kit.ArkUI';

import { WebControllerStore } from '../common/WebControllerStore';

export default class EntryAbility extends UIAbility {
  private loadMainPage(windowStage: window.WindowStage): void {
    windowStage.loadContent('pages/Index', (error) => {
      if (error.code) {
        console.error(`Failed to load the page: ${error.code}, ${error.message}`);
      }
    });
  }

  onWindowStageCreate(windowStage: window.WindowStage): void {
    try {
      const mainWindow = windowStage.getMainWindowSync();
      mainWindow.setWindowLayoutFullScreen(true)
        .then(() => {
          return mainWindow.setWindowSystemBarEnable(['status', 'navigation']);
        })
        .then(() => {
          return mainWindow.setWindowSystemBarProperties({
            statusBarColor: '#00000000',
            navigationBarColor: '#F8FCFF'
          });
        })
        .then(() => {
          this.loadMainPage(windowStage);
        })
        .catch((error: Error) => {
          console.error(`Failed to configure immersive layout: ${error.message}`);
          this.loadMainPage(windowStage);
        });
    } catch (error) {
      console.error(`Failed to configure immersive window: ${JSON.stringify(error)}`);
      this.loadMainPage(windowStage);
    }
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
