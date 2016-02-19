/**
 * Created by AlexanderC on 2/19/16.
 */

'use strict';

import {Config} from './Config';

export class AuthToken {
  /**
   * @param {String|null} token
   */
  constructor(token = null) {
    this._token = token;
  }

  /**
   * @returns {String|null|*}
   */
  get token() {
    return this._token;
  }

  /**
   * @returns {AuthToken}
   */
  refresh() {
    this._token = AuthToken._fromGlobal ||
      AuthToken._fromEnvVar ||
      AuthToken._fromConfigFile ||
      'ANON';

    return this;
  }

  /**
   * @returns {String|null}
   * @private
   */
  static get _fromEnvVar() {
    return process.env[AuthToken.TOKEN_VAR_NAME];
  }

  /**
   * @returns {String|null}
   * @private
   */
  static get _fromGlobal() {
    return global[AuthToken.TOKEN_VAR_NAME];
  }

  /**
   * @returns {String|null}
   * @private
   */
  static get _fromConfigFile() {
    try {
      let config = Config.create();

      return config[AuthToken.TOKEN_VAR_NAME];
    } catch (error) {
    }
  }

  /**
   * @returns {String}
   */
  static get TOKEN_VAR_NAME() {
    return 'DEEP_REGISTRY_AUTH_TOKEN';
  }

  /**
   * @returns {String}
   */
  toString() {
    return this._token.toString();
  }
}
