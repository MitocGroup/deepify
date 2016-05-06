/**
 * Created by CCristi <ccovali@mitocgroup.com> on 4/29/16.
 */

'use strict';

import FS from 'fs';
import Joi from 'joi';
import path from 'path';
import {Microservice_Instance as Microservice} from 'deep-package-manager';
import {AbstractGenerator} from './AbstractGenerator';
import inquirer  from 'inquirer';

export class ModelGenerator extends AbstractGenerator {
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
    let microservice = this.generationSchema.microservice;
    let modelName = this.generationSchema.name;
    let fields = this.generationSchema.fields;
    let templateArgs = {fields};
    let autoload = microservice.autoload;
    let targetPath = path.join(autoload.models, `${modelName}.json`);
    let doGenerate = () => {
      this.renderFile(
        'Data/Models/model.json',
        targetPath,
        templateArgs
      );

      cb(null, targetPath);
    };

    if (FS.existsSync(targetPath) && FS.lstatSync(targetPath).isFile()) {
      inquirer.prompt([{
        type: 'confirm',
        name: 'yes',
        message: `'${modelName}' model already exists. Do you want to overwrite it?`,
      }]).then((response) => {
        if (response.yes) {
          doGenerate();
          return;
        }

        cb(null, null);
      });
      
      return;
    }

    doGenerate();
  }

  /**
   * @returns {Object}
   */
  validationSchema() {
    return Joi.object().keys({
      microservice: Joi.object().type(Microservice).required(),
      name: Joi.string().required().regex(AbstractGenerator.DEEP_NAME_REGEXP),
      fields: Joi.array().min(1).items(Joi.object().keys({
        name: Joi.string().required().regex(AbstractGenerator.DEEP_NAME_REGEXP),
        type: Joi.string().required().allow(ModelGenerator.TYPES)
      }))
    });
  }

  /**
   * @returns {String[]}
   */
  static get TYPES() {
    return [
      'string',
      'number',
      'boolean',
      'binary',
      'email',
      'website',
      'map',
      'uuid',
      'timeUUID',
      'mapSet',
      'stringSet',
      'numberSet',
      'binarySet',
    ]
  }
}
