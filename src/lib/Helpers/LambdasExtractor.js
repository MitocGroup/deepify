/**
 * Created by AlexanderC on 12/2/15.
 */

'use strict';

import path from 'path';
import fs from 'fs';
import {Microservice_Metadata_Action as Action} from 'deep-package-manager';

export class LambdasExtractor {
  /**
   * @param {Property} property
   */
  constructor(property) {
    this._property = property;
  }

  /**
   * @param {Server} server
   * @returns {LambdasExtractor}
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
   * @returns {String[]}
   */
  extractWorking(filter = null) {
    return LambdasExtractor._extract(
      this._property.workingMicroservices,
      filter
    );
  }

  /**
   * @param {Function|null} filter
   * @returns {String[]}
   */
  extract(filter = null) {
    return LambdasExtractor._extract(
      this._property.microservices,
      filter
    );
  }

  /**
   * @param {Object} microservices
   * @param {Function|null} filter
   * @returns {String[]}
   */
  static _extract(microservices, filter = null) {
    let lambdas = [];

    for (let i in microservices) {
      if (!microservices.hasOwnProperty(i)) {
        continue;
      }

      let microservice = microservices[i];

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

    return filter
      ? lambdas.filter(filter)
      : lambdas;
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
