/**
 * Created by CCristi on 5/5/16.
 */

'use strict';

import {AbstractGenerator} from './AbstractGenerator';
import {BrokenResourcesFileException} from './Exception/BrokenResourcesFileException';
import {Microservice_Instance as Microservice} from 'deep-package-manager';
import {Microservice_Metadata_Action as Action} from 'deep-package-manager';
import {MicroserviceGenerator} from './MicroserviceGenerator';
import Joi from 'joi';
import path from 'path';
import FSExtra from 'fs-extra';
import FS from 'fs';

export class ActionGenerator extends AbstractGenerator {
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
    let microservice = this.generationSchema.microservice;
    let autoload = microservice.autoload;
    let resource = this.generationSchema.resource;
    let action = this.generationSchema.action;
    let crud = this.generationSchema.crud;
    let actionStatement = this._actionStatement;
    let resourcesJson = this._resourcesJson;
    let lambdaPath = path.join(autoload.backend, actionStatement.source);
    let templateParams = {resource, action};
    let lcResource = MicroserviceGenerator.identifier(resource);
    let lcAction = MicroserviceGenerator.identifier(action);

    resourcesJson[lcResource] = resourcesJson[lcResource] || {};
    resourcesJson[lcResource][lcAction] = resourcesJson[lcResource][lcAction] || {};
    resourcesJson[lcResource][lcAction] = actionStatement;

    FSExtra.ensureDirSync(lambdaPath);
    FS.writeFileSync(this._resourcesPath, JSON.stringify(resourcesJson, null, '  '));

    this.renderFile(
      `Backend/Lambda/${crud}.es6`,
      path.join(autoload.backend, actionStatement.source, 'Handler.es6'),
      templateParams
    );

    this.renderFile(
      'Backend/Lambda/bootstrap.es6',
      path.join(autoload.backend, actionStatement.source, 'bootstrap.es6'),
      templateParams
    );

    this.renderFile(
      'Backend/Lambda/package.json',
      path.join(autoload.backend, actionStatement.source, 'package.json'),
      templateParams
    );

    cb(null, lambdaPath);
  }

  /**
   * @returns {Object}
   */
  get _actionStatement() {
    let resource = this.generationSchema.resource;
    let action = this.generationSchema.action;
    let methods = this.generationSchema.methods;
    
    return {
      description: `${resource} ${action} Action`,
      type: 'lambda',
      methods: methods,
      source: path.join('src', this._ucFirst(resource), this._ucFirst(action)),
    };
  }

  /**
   * @returns {Object}
   * @private
   */
  get _resourcesJson() {
    try {
      let resourcesRaw = FS
        .readFileSync(this._resourcesPath)
        .toString();
      
      return JSON.parse(resourcesRaw);
    } catch (e) {
      throw new BrokenResourcesFileException(resourcesFile);
    }
  }

  /**
   * @returns {String}
   * @private
   */
  get _resourcesPath() {
    let microservice = this.generationSchema.microservice;
    let autoload = microservice.autoload;

    return path.join(autoload.backend, Microservice.RESOURCES_FILE);
  }

  /**
   * @param {String} string
   * @returns {String}
   */
  _ucFirst(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  /**
   * @returns {Object}
   */
  validationSchema() {
    return Joi.object().keys({
      microservice: Joi.object().type(Microservice).required(),
      resource: Joi.string().required().regex(AbstractGenerator.DEEP_NAME_REGEXP),
      action: Joi.string().required().regex(AbstractGenerator.DEEP_NAME_REGEXP),
      crud: Joi.string().required().only(ActionGenerator.CRUDS),
      methods: Joi.array().required().items(Joi.string().only(Action.HTTP_VERBS)).min(1),
    });
  }

  /**
   * @returns {String[]}
   */
  static get CRUDS() {
    return [
      'Custom',
      'Create',
      'Delete',
      'Retrieve',
      'Update',
    ];
  }
}
