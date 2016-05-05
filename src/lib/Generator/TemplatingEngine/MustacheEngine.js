/**
 * Created by CCristi <ccovali@mitocgroup.com> on 4/29/16.
 */

'use strict';

import {EngineInterface} from './EngineInterface';
import Mustache from 'mustache';

export class MustacheEngine extends EngineInterface {
  /**
   * Call parent constructor
   */
  constructor(...args) {
    super(...args);
  }

  /**
   * @param {String} args
   * @returns {String}
   */
  render(...args) {
    return Mustache.render(...args);
  }

  /**
   * @returns {String}
   */
  extension() {
    return '';
  }
}
