/**
 * Created by CCristi <ccovali@mitocgroup.com> on 4/29/16.
 */

'use strict';

import Joi from 'joi';
import path from 'path';
import {Microservice_Instance as Microservice} from 'deep-package-manager';
import {AbstractGenerator} from './AbstractGenerator';
import inquirer  from 'inquirer';

export class ModelGenerator extends AbstractGenerator {
  /**
   * @param {Function} cb
   */
  _generate(cb) {
    let microservice = this.generationSchema.microservice;
    let modelName = this.generationSchema.modelName;
    let fields = this.generationSchema.fields;
    fields[fields.length - 1].last = true;
    let templateArgs = {fields};
    let targetPath = path.join(microservice.basePath, 'Data/Models', `${modelName}.json`);
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
        name: 'doOverwrite',
        message: `'${modelName}' model already exists. Do you want to overwrite it?`,
      }], (response) => {
        if (response.doOverwrite) {
          doGenerate();
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
      name: Joi.string().required().alphanum().min(3),
      fields: Joi.array().min(1).items(Joi.object().keys({
        name: Joi.string().required().alphanum().min(3),
        type: Joi.string().required().allow(ModelGenerator.TYPES)
      }))
    });
  }

  /**
   * @returns {String[]}
   */
  static get TYPES() {
    return [
      // 'uuid',
      // 'timeUUID',
      'string',
      'number',
      'boolean',
      'binary',
      'email',
      'website',
      'map',
      'mapSet',
      'stringSet',
      'numberSet',
      'binarySet',
    ]
  }
}
