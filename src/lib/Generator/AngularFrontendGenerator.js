/**
 * Created by CCristi on 5/3/16.
 */

'use strict';

import {AbstractGenerator} from './AbstractGenerator';
import Joi from 'joi';
import FSExtra from 'fs-extra';
import path from 'path';

export class AngularFrontendGenerator extends AbstractGenerator {
  /**
   * @param {Object[]} args
   */
  constructor(...args) {
    super(...args);
  }

  /**
   * @param {Function} cb
   * @private
   */
  _generate(cb) {
    let identifier = this.generationSchema.identifier;
    let targetDir = path.join(this.targetPath, 'js/app/angular');

    FSExtra.ensureDirSync(targetDir);

    ['index.js', 'name.js', 'module.js'].forEach((resource) => {
      this.renderFile(
        path.join(AngularFrontendGenerator.TPL_DIR, resource),
        path.join(targetDir, resource),
        this.generationSchema
      );
    });

    this.renderFile(
      'Frontend/angular_bootstrap.js',
      path.join(`${this.targetPath}/bootstrap.js`),
      {identifier}
    );

    cb(null, this.targetPath);
  }

  /**
   * @returns {Object}
   */
  validationSchema() {
    return Joi.object().keys({
      name: Joi.string().required().regex(AbstractGenerator.DEEP_NAME_REGEXP),
      identifier: Joi.string().required().regex(AbstractGenerator.DEEP_NAME_REGEXP),
    });
  }

  /**
   * @returns {String}
   */
  static get TPL_DIR() {
    return 'Frontend/js/app/angular';
  }
}