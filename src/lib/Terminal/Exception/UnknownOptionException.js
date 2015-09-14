/**
 * Created by AlexanderC on 8/7/15.
 */

'use strict';

import {ValidationException} from './ValidationException';

export class UnknownOptionException extends ValidationException {
  /**
   * @param {String[]} options
   */
  constructor(...options) {
    super(`Unknown option(s): ${options.join(', ')}`);
  }
}
