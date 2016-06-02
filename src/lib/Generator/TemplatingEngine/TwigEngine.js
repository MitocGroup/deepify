/**
 * Created by CCristi on 5/4/16.
 */

'use strict';

import {EngineInterface} from './EngineInterface';
import {Helpers_Inflector as Inflector} from 'deep-package-manager';
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
    Twig.extendFilter('lispCase', Inflector.lispCase);
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
