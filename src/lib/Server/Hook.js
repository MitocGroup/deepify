/**
 * Created by AlexanderC on 12/18/15.
 */

'use strict';

import path from 'path';
import fs from 'fs';

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
    let hookFile = path.join(this._server.property.path, Hook.FILE_NAME);

    if (!fs.existsSync(hookFile)) {
      callback();
      return this;
    }

    let hook = require(hookFile);

    hook.bind(this._createContext(type))(callback);

    return this;
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
