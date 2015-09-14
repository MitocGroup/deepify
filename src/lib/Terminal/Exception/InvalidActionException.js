/**
 * Created by AlexanderC on 8/7/15.
 */

'use strict';

import {Exception} from './Exception';

export class InvalidActionException extends Exception {
  constructor() {
    super('The action must be a Function instance');
  }
}
