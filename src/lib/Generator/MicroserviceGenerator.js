/**
 * Created by CCristi <ccovali@mitocgroup.com> on 4/28/16.
 */

'use strict';

import {AbstractGenerator} from './AbstractGenerator';
import {AngularFrontendGenerator} from './AngularFrontendGenerator';
import {VanillaFrontendGenerator} from './VanillaFrontendGenerator';
import {EngineNotSupportedException} from './Exception/EngineNotSupportedException';
import {Microservice_Instance as Microservice} from 'deep-package-manager';
import Joi from 'joi';
import path from 'path';
import FSe from 'fs-extra';

export class MicroserviceGenerator extends AbstractGenerator {
  /**
   * @param {Function} cb
   * @private
   */
  _generate(cb) {
    let name = this.generationSchema.name;
    let identifier = MicroserviceGenerator.identifier(name);
    let engine = this.generationSchema.engine;
    let frontendGenerator = this._createFrontendGenerator(engine);
    let targetMsPath = path.join(this.targetPath, identifier);
    let templateParams = {
      engine: engine,
      name: name,
      identifier: identifier,
    };

    this._ensureTargetDirs(targetMsPath);

    frontendGenerator.generate(this.targetPath, {name, identifier}, (error) => {
      if (error) {
        cb(error);
        
        return;
      }

      MicroserviceGenerator.RESOURCES.forEach((resource) => {
        this.renderFile(resource, path.join(targetMsPath, resource), templateParams);
      });

      cb(null, targetMsPath);
    });
  }

  /**
   * @param {String} frontendEngine
   * @return {AbstractGenerator}
   * @private
   */
  _createFrontendGenerator(frontendEngine) {
    let GeneratorClass = null;
    
    switch (frontendEngine) {
      case 'angular':
        GeneratorClass = AngularFrontendGenerator;
        break;
      case 'vanilla':
        GeneratorClass = VanillaFrontendGenerator;
        break;
      default:
        throw new EngineNotSupportedException(frontendEngine);
    }

    return new GeneratorClass(this.templatingEngine, this.skeletonsDirectory);
  }

  /**
   * @param {String} targetMsPath
   */
  _ensureTargetDirs(targetMsPath) {
    let dirList = [
      'Backend',
      'Frontend',
      'Data/Models',
      'Data/Validation'
    ];

    dirList.forEach((dir) => {
      FSe.ensureDirSync(path.join(targetMsPath, dir));
    });
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

  /**
   * @returns {String[]}
   */
  static get RESOURCES() {
    return [
      `Backend/${Microservice.RESOURCES_FILE}`,
      Microservice.CONFIG_FILE,
      Microservice.PARAMS_FILE,
    ]
  }
}
