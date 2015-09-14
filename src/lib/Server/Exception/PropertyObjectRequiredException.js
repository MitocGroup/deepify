/**
 * Created by AlexanderC on 8/10/15.
 */

'use strict';

import {Exception} from './Exception';

export class PropertyObjectRequiredException extends Exception {
  constructor() {
    super('An instance of Property required');
  }
}
