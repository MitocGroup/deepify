/**
 * Created by AlexanderC on 8/7/15.
 */

'use strict';

import {Exception} from './Exception';

export class ProgramInstanceRequiredException extends Exception {
  constructor() {
    super('An instance of Program required');
  }
}
