/**
 * Created by AlexanderC on 12/18/15.
 */

'use strict';

import path from 'path';
import fs from 'fs';
import {Helpers_WaitFor as WaitFor} from 'deep-package-manager';

export class Hook {
  /**
   * @param {Server|*} server
   */
  constructor(server) {
    this._server = server;
  }

  /**
   * @returns {Server|*}
   */
  get server() {
    return this._server;
  }

  /**
   * @param {Function} callback
   * @returns {Hook}
   */
  runBefore(callback) {
    return this.run(Hook.BEFORE, callback);
  }

  /**
   * @param {Function} callback
   * @returns {Hook}
   */
  runAfter(callback) {
    return this.run(Hook.AFTER, callback);
  }

  /**
   * @param {String} type
   * @param {Function} callback
   * @returns {Hook}
   */
  run(type, callback) {
    let wait = new WaitFor();
    let microservices = this._server.property.microservices;
    let remaining = microservices.length;

    wait.push(() => {
      return remaining <= 0;
    });

    wait.ready(callback);

    for (let i in microservices) {
      if (!microservices.hasOwnProperty(i)) {
        continue;
      }

      let microservice = microservices[i];

      this._run(microservice, type, () => {
        remaining--;
      });
    }

    return this;
  }

  /**
   * @param {Microservice} microservice
   * @param {String} type
   * @param {Function} callback
   * @returns {Hook}
   * @private
   */
  _run(microservice, type, callback) {
    let hookFile = path.join(microservice.basePath, Hook.FILE_NAME);

    if (!fs.existsSync(hookFile)) {
      console.log(`No "server ${type} init hook" found in ${microservice.identifier}`);

      callback();
      return this;
    }

    console.log(`Running "server ${type} init hook" in ${microservice.identifier}`);

    let hook = require(hookFile);

    hook.bind(this._createContext(type))(callback);
  }

  /**
   * @param {String} type
   * @returns {{isBefore: Function, isAfter: Function, server: (Server|*)}}
   * @private
   */
  _createContext(type) {
    return {

      /**
       * @returns {Boolean}
       */
      isBefore: () => {
        return type === Hook.BEFORE;
      },

      /**
       * @returns {Boolean}
       */
      isAfter: () => {
        return type === Hook.AFTER;
      },

      /**
       * @returns {Server|*}
       */
      server: this._server,
    };
  }

  /**
   * @returns {String}
   */
  static get BEFORE() {
    return 'before';
  }

  /**
   * @returns {String}
   */
  static get AFTER() {
    return 'after';
  }

  /**
   * @returns {String}
   */
  static get FILE_NAME() {
    return 'hook.server.js';
  }
}
