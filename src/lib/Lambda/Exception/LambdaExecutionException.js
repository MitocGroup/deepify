/**
 * Created by AlexanderC on 8/10/15.
 */

'use strict';

import {Exception} from './Exception';

export class LambdaExecutionException extends Exception {
  /**
   * @param {String} error
   */
  constructor(error) {
    super(error.toString());
  }
}
