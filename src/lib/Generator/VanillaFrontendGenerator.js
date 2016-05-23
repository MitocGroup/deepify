/**
 * Created by CCristi on 5/3/16.
 */

'use strict';

import {AbstractGenerator} from './AbstractGenerator';
import Joi from 'joi';
import path from 'path';
import FSExtra from 'fs-extra';

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
    FSExtra.ensureDirSync(this.targetPath);

    this.renderFile(
      'Frontend/vanilla_bootstrap.js', 
      path.join(this.targetPath, 'bootstrap.js')
    );

    cb(null, this.targetPath);
  }

  /**
   * @returns {Object}
   */
  validationSchema() {
    return Joi.object();
  }
}
