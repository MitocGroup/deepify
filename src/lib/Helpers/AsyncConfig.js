/**
 * Created by CCristi on 5/17/16.
 */

'use strict';

export class AsyncConfig {
  /**
   * @param {Instance} server
   */
  constructor(server) {
    this._server = server;
    this._config = null;
  }

  /**
   * @returns {AsyncConfig}
   */
  init() {
    this._config = {};
    return this;
  }

  /**
   * @returns {Object}
   */
  json() {
    if (this._config) {
      return this._config;
    }

    return this
      .init()
      .populateFromEs()
      .json()
    ;
  }

  /**
   * @returns {AsyncConfig}
   */
  populateFromEs() {
    let es = this._es;
    let runningInstances = es.runningInstances;
    let searchDomains = {};

    for (let name in runningInstances) {
      if (!runningInstances.hasOwnProperty(name)) {
        continue;
      }

      let instance = runningInstances[name];

      searchDomains[name] = {url: instance.shortUrl};
    }

    this._config.searchDomains = searchDomains;

    return this;
  }

  /**
   * @returns {Server}
   * @private
   */
  get _es() {
    return this._server.es;
  }

  /**
   * @returns {String}
   */
  static get FILE_NAME() {
    return '_async_config.json';
  }
}
