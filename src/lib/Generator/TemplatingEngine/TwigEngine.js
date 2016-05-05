/**
 * Created by CCristi on 5/4/16.
 */

'use strict';

import {EngineInterface} from './EngineInterface';
import Twig from 'twig';

export class TwigEngine extends EngineInterface {
  /**
   * @param {Object[]} args
   */
  constructor(...args) {
    super(...args);

    this._registerFilters();
  }

  /**
   * @private
   */
  _registerFilters() {
    Twig.extendFilter('identifier', (value) => value.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase());
  }

  /**
   * @param {String} template
   * @param {Object} params
   * @returns {Object} 
   */
  render(template, params) {
    let templateObj = Twig.twig({
      data: template,
    });

    return templateObj.render(params);
  }

  /**
   * @returns {String}
   */
  extension() {
    return '.twig';
  }
}
