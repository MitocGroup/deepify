/**
 * Created by CCristi on 5/17/16.
 */

'use strict';

import FSExtra from 'fs-extra';

export class AsyncConfig {
  /**
   * @param {Server_Instance} server
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

      searchDomains[name] = {url: instance.url};
    }

    this._config.searchDomains = searchDomains;

    return this;
  }

  /**
   * @param {FS} fs
   * @returns {Boolean}
   */
  dumpIntoFs(fs) {
    return fs.writeFileSync(AsyncConfig.FILE_NAME, JSON.stringify(this.json()));
  }

  /**
   * @returns {ES}
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
