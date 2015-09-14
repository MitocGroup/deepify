/**
 * Created by AlexanderC on 8/7/15.
 */

'use strict';

import {ValidationException} from './ValidationException';
import {Option} from '../Option';
import {OptionObjectRequiredException} from './OptionObjectRequiredException';

export class MissingOptionException extends ValidationException {
  /**
   * @param {Option} option
   */
  constructor(option) {
    if (!option instanceof Option) {
      throw new OptionObjectRequiredException();
    }

    let aliasPlain = '';

    if (option.alias) {
      aliasPlain = `(alias '-${option.alias}')`;
    }

    super(`The option '--${option.name}' ${aliasPlain} is missing`);
  }
}
