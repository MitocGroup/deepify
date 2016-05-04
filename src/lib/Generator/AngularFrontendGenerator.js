/**
 * Created by CCristi on 5/3/16.
 */

'use strict';

import {AbstractGenerator} from './AbstractGenerator';
import Joi from 'joi';
import FSe from 'fs-extra';
import path from 'path';

export class AngularFrontendGenerator extends AbstractGenerator {
  /**
   * @param {Function} cb
   * @private
   */
  _generate(cb) {
    let identifier = this.generationSchema.identifier;
    let targetDir = path.join(this.targetPath, identifier, AngularFrontendGenerator.TPL_DIR);

    FSe.ensureDirSync(targetDir);

    ['index.js', 'name.js', 'module.js'].forEach((resource) => {
      this.renderFile(
        path.join(AngularFrontendGenerator.TPL_DIR, resource),
        path.join(targetDir, resource),
        this.generationSchema
      );
    });

    this.renderFile(
      'Frontend/angular_bootstrap.js',
      path.join(this.targetPath, identifier, 'Frontend/bootstrap.js'),
      this.generationSchema
    );

    cb(null, targetDir);
  }

  /**
   * @returns {Object}
   */
  validationSchema() {
    return Joi.object().keys({
      name: Joi.string().required().regex(/^[a-zA-Z0-9_\-]{3,}$/),
      identifier: Joi.string().required().regex(/^[a-zA-Z0-9_\-\.]{3,}$/),
    });
  }

  /**
   * @returns {String}
   */
  static get TPL_DIR() {
    return 'Frontend/js/app/angular';
  }
}