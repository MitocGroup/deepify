/**
 * Created by CCristi on 5/3/16.
 */

'use strict';

import {Exception} from '../../Exception/Exception';

export class EngineNotSupportedException extends Exception {
  /**
   * @param {String} engine
   */
  constructor(engine) {
    super(`'${engine}' is not supported yet.`);
  }
}
