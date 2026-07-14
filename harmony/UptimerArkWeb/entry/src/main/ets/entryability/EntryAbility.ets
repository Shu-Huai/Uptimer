import { UIAbility } from '@kit.AbilityKit';
import { window } from '@kit.ArkUI';

import { WebControllerStore } from '../common/WebControllerStore';

export default class EntryAbility extends UIAbility {
  onWindowStageCreate(windowStage: window.WindowStage): void {
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
