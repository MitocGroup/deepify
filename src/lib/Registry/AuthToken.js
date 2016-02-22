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
    this._token = Config
        .create()
        .refresh(AuthToken.TOKEN_VAR_NAME)
        .read(AuthToken.TOKEN_VAR_NAME) || 'ANON';

    return this;
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
