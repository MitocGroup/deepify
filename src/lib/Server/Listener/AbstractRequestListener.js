'use strict';

import Url from 'url';
import Path from 'path';

export class AbstractRequestListener {

  /**
   *
   * @param {Instance} serverInstance
   */
  constructor(serverInstance) {
    this._server = serverInstance;
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
   *
   * @param {String} uri
   * @returns {boolean}
   */
  isLambdaRequest(uri) {
    return uri === AbstractRequestListener.LAMBDA_URI || uri === AbstractRequestListener.LAMBDA_ASYNC_URI;
  }

  /**
   * @param {String} uri
   * @returns {String}
   * @private
   */
  _resolveMicroservice(uri) {
    let parts = uri.replace(/^\/(.+)$/, '$1').split('/');
    let microservices = this._server.microservices;

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

    return Path.join(this._server.rootMicroservice.frontend, ...parts);
  }

  /**
   * @returns {String}
   */
  static get LAMBDA_ASYNC_URI() {
    return '/_/lambda-async';
  }

  /**
   * @returns {String}
   */
  static get LAMBDA_URI() {
    return '/_/lambda';
  }
}
