/**
 * Created by CCristi <ccovali@mitocgroup.com> on 4/28/16.
 */

'use strict';

import {AbstractGenerator} from './AbstractGenerator';
import {AngularFrontendGenerator} from './AngularFrontendGenerator';
import {VanillaFrontendGenerator} from './VanillaFrontendGenerator';
import {EngineNotSupportedException} from './Exception/EngineNotSupportedException';
import {Microservice_Instance as Microservice} from 'deep-package-manager';
import {Property_Config as Config} from 'deep-package-manager';
import Joi from 'joi';
import path from 'path';
import FSExtra from 'fs-extra';
import FS from 'fs';

export class MicroserviceGenerator extends AbstractGenerator {
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
    let name = this.generationSchema.name;
    let identifier = MicroserviceGenerator.identifier(name);
    let engines = this.generationSchema.engines;
    let targetMsPath = path.join(this.targetPath, identifier);
    let templateParams = {
      engines: engines,
      name: name,
      identifier: identifier,
    };

    this._ensureAppConfig();
    this._ensureTargetDirs(targetMsPath);

    MicroserviceGenerator.MS_RESOURCES.forEach((resource) => {
      this.renderFile(resource, path.join(targetMsPath, resource), templateParams);
    });

    let generateEngineFrontend = (engineIndex = 0) => {
      let engine = engines[engineIndex];
      let frontendGenerator = this._createFrontendGenerator(engine);

      frontendGenerator.generate(this.targetPath, {name, identifier}, (error) => {
        if (error) {
          cb(error);
          return;
        }

        engineIndex++;

        if (engineIndex < engines.length) {
          generateEngineFrontend(engineIndex);
        } else {
          cb(null, targetMsPath);
        }
      });
    };

    generateEngineFrontend();
  }

  /**
   * @private
   */
  _ensureAppConfig() {
    let propertyConfigFile = path.join(this.targetPath, Config.DEFAULT_FILENAME);

    if (!FS.existsSync(propertyConfigFile)) {
      FSExtra.outputJsonSync(propertyConfigFile, Config.generate());
    }
  }

  /**
   * @param {String} frontendEngine
   * @returns {AbstractGenerator}
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
   * @todo: import autoload dir from deepkg.schema.js
   * @param {String} targetMsPath
   */
  _ensureTargetDirs(targetMsPath) {
    let dirList = [
      'Backend',
      'Frontend',
      'Data/Models',
      'Data/Validation',
    ];

    dirList.forEach((dir) => {
      FSExtra.ensureDirSync(path.join(targetMsPath, dir));
    });
  }

  /**
   * @returns {Object}
   */
  validationSchema() {
    return Joi.object().keys({
      name: Joi.string().required().regex(/^[a-zA-Z0-9_\-]{3,}$/),
      engines: Joi.array().items(Joi.string().only(
        MicroserviceGenerator.ALLOWED_ENGINES)
      ).required().min(1),
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
  static get MS_RESOURCES() {
    return [
      `Backend/${Microservice.RESOURCES_FILE}`,
      Microservice.CONFIG_FILE,
      Microservice.PARAMS_FILE,
    ]
  }
}
