'use strict';

import Url from 'url';
import Path from 'path';

export class AbstractListener {

  constructor() {
    this._server = {};
  }

  /**
   *
   * @returns {Instance}
   */
  get server() {
    return this._server;
  }

  /**
   *
   * @param {Instance} server
   */
  set server(server) {
    this._server = server;
  }

  /**
   *
   * @param {String} url
   * @returns {String}
   */
  getUri(url) {
    let urlParts = Url.parse(url);
    return urlParts.pathname;
  }

  /**
   * @param {String} uri
   * @returns {String}
   * @private
   */
  _resolveMicroservice(uri) {
    let parts = uri.replace(/^\/(.+)$/, '$1').split('/');
    let microservices = this.server.microservices;

    if (parts.length > 0) {
      for (let identifier in microservices) {
        if (!microservices.hasOwnProperty(identifier)) {
          continue;
        }

        if (identifier === parts[0]) {
          let microservice = microservices[identifier];

          parts.shift();

          return Path.join(microservice.frontend, ...parts);
        }
      }
    }

    return Path.join(this.server.rootMicroservice.frontend, ...parts);
  }
}
