/**
 * Created by CCristi <ccovali@mitocgroup.com> on 4/29/16.
 */

'use strict';

import Joi from 'joi';
import path from 'path';
import {Microservice_Instance as Microservice} from 'deep-package-manager';
import {AbstractGenerator} from './AbstractGenerator';

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

    this.renderFile(
      'Data/Models/model.json',
      path.join(microservice.basePath, 'Data/Models', `${modelName}.json`),
      fields
    );

    cb();
  }

  /**
   * @returns {*}
   */
  validationSchema() {
    return Joi.object().keys({
      microservice: Joi.object().type(Microservice),
      modelName: Joi.string().required().alphanum().min(3),
      fields: Joi.object().keys({
        name: Joi.string().required().alphanum().min(3),
        type: Joi.string().required().allow(ModelGenerator.TYPES)
      })
    });
  }

  /**
   * @returns {String[]}
   */
  static get TYPES() {
    return [
      // 'uuid',
      // 'timeUUID',
      'stringSet',
      'numberSet',
      'binarySet',
      'binary',
      'number',
      'string',
      'boolean',
      'email',
      'website',
      'map',
      'mapSet',
    ]
  }
}