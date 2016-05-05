/**
 * Created by CCristi on 5/3/16.
 */

'use strict';

import {AbstractGenerator} from './AbstractGenerator';
import Joi from 'joi';
import path from 'path';

export class VanillaFrontendGenerator extends AbstractGenerator {
  /**
   * @param {Object[]} args
   */
  constructor(...args) {
    super(...args);
  }

  /**
   * @param {Function} cb
   */
  _generate(cb) {
    let targetBootstrap = path.join(this.targetPath, 'Frontend/bootstrap.js');

    this.renderFile(
      'Frontend/vanilla_bootstrap.js', 
      targetBootstrap
    );

    cb(null, targetBootstrap);
  }

  /**
   * @returns {Object}
   */
  validationSchema() {
    return Joi.object();
  }
}