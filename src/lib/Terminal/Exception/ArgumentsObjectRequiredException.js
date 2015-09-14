/**
 * Created by AlexanderC on 8/7/15.
 */

'use strict';

import {Exception} from './Exception';

export class ArgumentsObjectRequiredException extends Exception {
  constructor() {
    super('Argument object required');
  }
}
