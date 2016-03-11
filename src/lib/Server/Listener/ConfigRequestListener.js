'use strict';
import {AbstractRequestListener} from './AbstractRequestListener';

export class ConfigRequestListener extends AbstractRequestListener {

  /**
   *
   * @param {Array} args
   */
  constructor(...args) {
    super(...args);

    this._server.listener.registerConfigRequestListener((...args) => {
      this._handler(...args);
    });
  }

  /**
   *
   * @param {ResponseEvent} event
   * @private
   */
  _handler(event) {
    let request = event.request;
    let uri = this.getUri(request.url);

    if (uri === '/_config.json' && !this._server.buildPath) {
      event.send(JSON.stringify(this._server.defaultFrontendConfig), 200, 'application/json');
    }
  }
}
