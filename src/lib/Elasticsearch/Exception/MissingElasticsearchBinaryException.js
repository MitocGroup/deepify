/**
 * Created by CCristi on 5/16/16.
 */

'use strict';

import {Exception} from '../../Exception/Exception';

export class MissingElasticsearchBinaryException extends Exception {
  /**
   * @param {String} path
   */
  constructor(path) {
    super(`Missing elasticsearch binary in '${path}'`);
  }
}
