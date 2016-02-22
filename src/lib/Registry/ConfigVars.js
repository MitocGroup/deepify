/**
 * Created by AlexanderC on 2/22/16.
 */

'use strict';

import {AuthToken} from './AuthToken';

export class ConfigVars {

  /**
   * @param {String} name
   * @returns {String}
   */
  static map(name) {
    return ConfigVars.REVERSED_MAPPING[name] || name;
  }

  /**
   * @param {String} name
   * @returns {String}
   */
  static unMap(name) {
    return ConfigVars.MAPPING[name] || name;
  }

  /**
   * @returns {Object}
   */
  static get REVERSED_MAPPING() {
    let mapping = ConfigVars.MAPPING;
    let obj = {};

    for (let name in mapping) {
      if (!mapping.hasOwnProperty(name)) {
        continue;
      }

      obj[mapping[name]] = name;
    }

    return obj;
  }

  /**
   * @returns {Object}
   */
  static get MAPPING() {
    return {
      token: AuthToken.TOKEN_VAR_NAME, // DEEP_REGISTRY_AUTH_TOKEN
      registry: 'DEEP_REGISTRY_BASE_HOST',
    };
  }
}
