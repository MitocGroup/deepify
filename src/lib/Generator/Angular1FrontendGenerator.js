/**
 * Created by eistrati on 4/30/17.
 */

'use strict';

import {AbstractGenerator} from './AbstractGenerator';
import Joi from 'joi';
import FSExtra from 'fs-extra';
import path from 'path';

export class Angular1FrontendGenerator extends AbstractGenerator {
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
    let targetDir = path.join(this.targetPath, 'js/app/angular1');

    FSExtra.ensureDirSync(targetDir);

    ['index.js', 'name.js', 'module.js'].forEach((resource) => {
      this.renderFile(
        path.join(AngularFrontendGenerator.TPL_DIR, resource),
        path.join(targetDir, resource),
        this.generationSchema
      );
    });

    this.renderFile(
      'frontend/angular_bootstrap.js',
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
    return 'frontend/js/app/angular1';
  }
}
