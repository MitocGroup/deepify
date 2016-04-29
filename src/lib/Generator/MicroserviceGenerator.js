/**
 * Created by CCristi <ccovali@mitocgroup.com> on 4/28/16.
 */

'use strict';

import {AbstractGenerator} from './AbstractGenerator';
import Joi from 'joi';
import path from 'path';
import FSe from 'fs-extra';
import FS from 'fs';

export class MicroserviceGenerator extends AbstractGenerator {
  /**
   * @param {Function} cb
   * @private
   */
  _generate(cb) {
    let name = this.generationSchema.name;
    let identifier = MicroserviceGenerator.identifier(name);
    let engine = this.generationSchema.engine;
    let engineDir = `Frontend/js/app/${engine}`;
    let engineBootstrap = `Frontend/${engine}_bootstrap.js`;
    let templateParams = {
      engine: engine,
      name: name,
      identifier: identifier,
    };

    // @todo: move this?
    if (FS.existsSync(path.join(this.skeletonsDirectory, engineDir))) {
      FSe.copySync(
        path.join(this.skeletonsDirectory, engineDir),
        path.join(this.targetPath, engineDir)
      );

      let targetEngineDir = path.join(this.targetPath, engineDir, 'index.js');

      if (FS.existsSync(targetEngineDir)) {
        cb(new Error(`${targetEngineDir} directory already exists`));
        return;
      }

      this.renderFile(
        path.join(engineDir, 'index.js'),
        path.join(this.targetPath, engineDir, 'index.js'),
        templateParams
      );
    }

    this.ensureTargetDir(...this._dirList(identifier));
    this.renderFile('Backend/resources.json', path.join(this.targetPath, identifier, 'Backend/resources.json'));
    this.renderFile(engineBootstrap, path.join(this.targetPath, identifier, 'Frontend/bootstrap.js'));
    this.renderFile('deepkg.json', path.join(this.targetPath, identifier, 'deepkg.json'), templateParams);

    cb();
  }

  /**
   * @param {String} parentDir
   * @returns {Array}
   * @private
   */
  _dirList(parentDir) {
    return [
      'Backend',
      'Frontend',
      'Data/Models',
      'Data/Validation'
    ].map(dir => path.join(parentDir, dir));
  }

  /**
   * @returns {Object}
   */
  validationSchema() {
    return Joi.object().keys({
      name: Joi.string().required().regex(/^[a-zA-Z0-9_\-]{3,}$/),
      engine: Joi.string().required().allow(MicroserviceGenerator.ALLOWED_ENGINES)
    });
  }

  /**
   * @param {String} name
   * @returns {string}
   */
  static identifier(name) {
    return name.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  }

  /**
   * @returns {String[]}
   */
  static get ALLOWED_ENGINES() {
    return [
      'angular',
      'vanilla',
    ];
  }
}