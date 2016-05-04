/**
 * Created by CCristi <ccovali@mitocgroup.com> on 4/29/16.
 */

'use strict';

import Core from 'deep-core'

/**
 * Engine Interface
 */
export class EngineInterface extends Core.OOP.Interface {
  /**
   * Assure render method
   */
  constructor() {
    super('render');
  }
}
