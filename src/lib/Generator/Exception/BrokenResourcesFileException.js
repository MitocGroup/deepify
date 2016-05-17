/**
 * Created by CCristi on 5/3/16.
 */

'use strict';

import {Exception} from '../../Exception/Exception';

export class BrokenResourcesFileException extends Exception {
  /**
   * @param {String} resourcesFile
   */
  constructor(resourcesFile) {
    super(`'${resourcesFile}' doesn't exists or is not a valid JSON`);
  }
}
