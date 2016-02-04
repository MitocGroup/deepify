/**
 * Created by AlexanderC on 8/7/15.
 */

'use strict';

import {ValidationException} from './ValidationException';
import {Argument} from '../Argument';
import {ArgumentObjectRequiredException} from './ArgumentObjectRequiredException';

export class MissingArgumentException extends ValidationException {
  /**
   * @param {Argument} argument
   */
  constructor(argument) {
    if (!(argument instanceof Argument)) {
      throw new ArgumentObjectRequiredException();
    }

    super(`The argument '${argument.name}' is missing`);
  }
}
