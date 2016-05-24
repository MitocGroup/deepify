/**
 * Created by CCristi on 5/18/16.
 */

'use strict';

import {Exception} from '../../Exception/Exception';

export class ServerAlreadyRunningException extends Exception {
  /**
   * @param {AbstractLauncher} launcher
   * @param {String|Error} error
   */
  constructor(launcher, error) {
    super(`Elasticsearch server '${launcher.shortUrl}' is already running: ${error.stack}`);
  }
}
