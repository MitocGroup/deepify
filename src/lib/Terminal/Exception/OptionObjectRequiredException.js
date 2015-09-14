/**
 * Created by AlexanderC on 8/7/15.
 */

'use strict';

import {Exception} from './Exception';

export class OptionObjectRequiredException extends Exception {
  constructor() {
    super('Option object required');
  }
}
