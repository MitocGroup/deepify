/**
 * Created by AlexanderC on 1/26/16.
 */

'use strict';

import path from 'path';
import fs from 'fs';
import fse from 'fs-extra';
import Core from 'deep-core';
import {Microservice_Metadata_Action as Action} from 'deep-package-manager';
import {Property_ValidationSchema as ValidationSchema} from 'deep-package-manager';

export class ValidationSchemasSync {
  /**
   * @param {Property} property
   */
  constructor(property) {
    this._property = property;
  }

  /**
   * @param {Server} server
   * @returns {ValidationSchemasSync}
   */
  static createFromServer(server) {
    return new this(server.property);
  }

  /**
   * @returns {Property}
   */
  get property() {
    return this._property;
  }

  /**
   * @param {Function|null} filter
   * @returns {ValidationSchemasSync}
   */
  syncWorking(filter = null) {
    return ValidationSchemasSync._sync(
      this._property.workingMicroservices,
      filter
    );
  }

  /**
   * @param {Function|null} filter
   * @returns {ValidationSchemasSync}
   */
  sync(filter = null) {
    return ValidationSchemasSync._sync(
      this._property.microservices,
      filter
    );
  }

  /**
   * @param {Object} microservices
   * @param {Function|null} filter
   * @returns {ValidationSchemasSync}
   */
  static _sync(microservices, filter = null) {
    let lambdas = [];
    let validationSchemasDirs = [];

    for (let i in microservices) {
      if (!microservices.hasOwnProperty(i)) {
        continue;
      }

      let microservice = microservices[i];

      validationSchemasDirs.push(microservice.autoload.validation);

      for (let j in microservice.resources.actions) {
        if (!microservice.resources.actions.hasOwnProperty(j)) {
          continue;
        }

        let microserviceRoute = microservice.resources.actions[j];

        if (microserviceRoute.type === Action.LAMBDA) {
          let lambdaPath = path.join(
            microservice.autoload.backend,
            microserviceRoute.source
          );

          lambdas.push(lambdaPath);
        }
      }
    }

    let validationSchemas = ValidationSchema.create(...validationSchemasDirs);

    lambdas = filter
      ? lambdas.filter(filter)
      : lambdas;

    lambdas.forEach((lambdaPath) => {
      let schemasPath = path.join(lambdaPath, Core.AWS.Lambda.Runtime.VALIDATION_SCHEMAS_DIR);

      if (fs.existsSync(validationSchemas)) {
        fse.removeSync(validationSchemas);
      }

      validationSchemas.forEach((schema) => {
        let schemaPath = schema.schemaPath;
        let destinationSchemaPath = path.join(schemasPath, `${schema.name}.js`);

        fse.copySync(schemaPath, destinationSchemaPath);
      });
    });

    return this;
  }

  /**
   * @returns {Function}
   */
  static get NPM_PACKAGE_FILTER() {
    return (lambdaPath) => {
      return fs.existsSync(path.join(lambdaPath, 'package.json'));
    };
  }
}
