/**
 * Created by AlexanderC on 12/2/15.
 * jshint maxcomplexity: 12*/

'use strict';

import path from 'path';
import fs from 'fs';
import {Microservice_Metadata_Action as Action} from 'deep-package-manager';

export class LambdasExtractor {
  /**
   * @param {Property} property
   * @param {String[]|null} patternsToExtract
   */
  constructor(property, patternsToExtract = []) {
    this._property = property;
    this._regExpVector = patternsToExtract.map(LambdasExtractor.patternToRegExp);
  }

  /**
   * @param {String} instanceStr
   * @returns {RegExp}
   */
  static patternToRegExp(instanceStr) {
    let escapePart = function(part) {
      return part ?
        part.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') :
        '[a-zA-Z\\d+\\-_\\.]+'
    };

    let parts = instanceStr.split(':');
    let microservice = escapePart(parts[0]);
    let resource = escapePart(parts[1]);
    let action = escapePart(parts[2]);

    return new RegExp(`^\\s*${microservice}:${resource}:${action}\\s*$`);
  }

  /**
   * @param {String} actionIdentifier
   * @returns {Boolean}
   * @private
   */
  _hasToExtract(actionIdentifier) {
    if (this._regExpVector.length === 0) {
      return true;
    }

    for (let i in this._regExpVector) {
      if (this._regExpVector.hasOwnProperty(i) && this._regExpVector[i].test(actionIdentifier)) {
        return true;
      }
    }

    return false;
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
   * @param {Number} extractMode
   * @returns {Object}
   */
  extract(filter = null, extractMode = LambdasExtractor.EXTRACT_ARRAY) {
    let microservices = this._property.microservices;
    let lambdas = {};

    for (let i in microservices) {
      if (!microservices.hasOwnProperty(i)) {
        continue;
      }

      let microservice = microservices[i];

      for (let j in microservice.resources.actions) {
        if (!microservice.resources.actions.hasOwnProperty(j)) {
          continue;
        }

        let action = microservice.resources.actions[j];
        let identifier = `${microservice.identifier}:${action.resourceName}:${action.name}`;

        if(!this._hasToExtract(identifier)) {
          continue;
        }

        let microserviceRoute = microservice.resources.actions[j];

        if (microserviceRoute.type === Action.LAMBDA) {
          let lambdaPath = path.join(
            microservice.autoload.backend,
            microserviceRoute.source
          );

          if (!filter || filter(lambdaPath)) {
            lambdas[identifier] = lambdaPath;
          }
        }
      }
    }

    switch (extractMode) {
      case LambdasExtractor.EXTRACT_ARRAY:
        return this._objectValues(lambdas);
      case LambdasExtractor.EXTRACT_OBJECT:
        return lambdas;
    }
    
    throw new Error(`Unknown extract mode: ${extractMode}`);
  }

  /**
   * @param {Object} object
   * @returns {Object[]}
   * @private
   */
  _objectValues(object) {
    return Object.keys(object).map(key => object[key]);
  }

  /**
   * @returns {Number}
   */
  static get EXTRACT_ARRAY() {
    return 0x001;
  }

  /**
   * @returns {Number}
   */
  static get EXTRACT_OBJECT() {
    return 0x002;
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
