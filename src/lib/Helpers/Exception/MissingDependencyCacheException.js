/**
 * Created by CCristi <ccovali@mitocgroup.com> on 4/7/16.
 */

'use strict';

import {Exception} from '../../Exception/Exception';

/**
 * Missing dependency folder exception
 */
export class MissingDependencyCacheException extends Exception {
  /**
   * @param {String} folder
   */
  constructor(folder) {
    super(`Dependency folder is expired: ${folder}`);
  }
}
