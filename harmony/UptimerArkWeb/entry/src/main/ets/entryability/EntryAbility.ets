import { Configuration, ConfigurationConstant, UIAbility } from '@kit.AbilityKit';
import { window } from '@kit.ArkUI';
import { resourceManager } from '@kit.LocalizationKit';

import { setHarmonySystemTheme } from '../pages/Index';
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
    this.context.resourceManager.getConfiguration()
      .then((configuration) => {
        setHarmonySystemTheme(configuration.colorMode === resourceManager.ColorMode.DARK);
      })
      .catch((error: Error) => {
        console.error(`Failed to read initial system theme: ${error.message}`);
      });

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

  onConfigurationUpdate(newConfig: Configuration): void {
    setHarmonySystemTheme(newConfig.colorMode === ConfigurationConstant.ColorMode.COLOR_MODE_DARK);
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
