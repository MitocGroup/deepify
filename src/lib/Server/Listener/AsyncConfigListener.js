/**
 * Created by CCristi on 5/17/16.
 */

'use strict';

import {AbstractListener} from './AbstractListener';
import {AsyncConfig} from '../../Helpers/AsyncConfig';

export class AsyncConfigListener extends AbstractListener {
  /**
   * @param {Object[]} args
   */
  constructor(...args) {
    super(...args);

    this._config = {};
  }

  /**
   * @param {ResponseEvent} event
   */
  handler(event) {
    if (!this._hasToListen(event)) {
      return;
    }

    event
      .stopPropagation()
      .send(JSON.stringify(this._asyncConfig.json()), 200, 'application/json')
    ;
  }

  /**
   * @returns {AsyncConfig}
   * @private
   */
  get _asyncConfig() {
    return this.server.asyncConfig;
  }

  /**
   * @param {Object} event
   * @returns {Boolean}
   * @private
   */
  _hasToListen(event) {
    return this.getUri(event.request.url) === `/${AsyncConfig.FILE_NAME}`;
  }
}
