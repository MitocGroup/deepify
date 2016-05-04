/**
 * Created by CCristi <ccovali@mitocgroup.com> on 4/28/16.
 */

'use strict';

import {Exception} from '../../Exception/Exception';

export class InvalidGenerationSchema extends Exception {
  /**
   * @param {String} generatorName
   * @param {String[]} errors
   */
  constructor(generatorName, errors) {
    super(`Invalid generation schema for '${generatorName}': ${errors}`);
  }
}
