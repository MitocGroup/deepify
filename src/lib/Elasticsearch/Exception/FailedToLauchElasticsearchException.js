/**
 * Created by CCristi on 5/16/16.
 */

'use strict';

import {Exception} from '../../Exception/Exception';

export class FailedToLauchElasticsearchException extends Exception {
  /**
   * @param {AbstractLauncher} launcher
   * @param {String|Error} error
   */
  constructor(launcher, error) {
    super(`Failed to launch elasticsearch on ${launcher.shortUrl}: ${error.toString()}`);
  }
}
