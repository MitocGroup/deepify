/**
 * Created by CCristi on 7/1/16.
 */

'use strict';

import Core from 'deep-core';

export class AbstractStrategy extends Core.OOP.Interface {
  constructor() {
    super(['name', 'version']);
  }
}
