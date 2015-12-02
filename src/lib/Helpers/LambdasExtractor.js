/**
 * Created by AlexanderC on 12/2/15.
 */

'use strict';

import path from 'path';
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
  extract(filter = null) {
    let lambdas = [];

    for (let i in this._property.microservices) {
      if (!this._property.microservices.hasOwnProperty(i)) {
        continue;
      }

      let microservice = this._property.microservices[i];

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
}
