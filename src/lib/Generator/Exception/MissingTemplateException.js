/**
 * Created by CCristi on 5/3/16.
 */

import {Exception} from '../../Exception/Exception';

export class MissingTemplateException extends Exception {
  /**
   * @param {String} template
   */
  constructor(template) {
    super(`'${template}' doesn't exists`);
  }
}
