/**
 * Created by AlexanderC on 8/10/15.
 */

'use strict';

import {Exception} from './Exception';

export class FailedToStartServerException extends Exception {
  /**
   * @param {Number} port
   * @param {String} error
   */
  constructor(port, error) {
    super(`Failed to start server on port ${port}: ${error}`);
  }
}
