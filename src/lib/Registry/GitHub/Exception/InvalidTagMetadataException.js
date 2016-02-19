/**
 * Created by AlexanderC on 2/19/16.
 */

'use strict';

import {Exception} from '../../../Exception/Exception';

export class InvalidTagMetadataException extends Exception {
  /**
   * @param {String|Error|*} error
   */
  constructor(error) {
    super(`Invalid tag metadata: ${error}`);
  }
}
