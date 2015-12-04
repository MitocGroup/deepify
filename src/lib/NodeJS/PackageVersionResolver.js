/**
 * Created by AlexanderC on 12/4/15.
 */

'use strict';

import {Exec} from '../Helpers/Exec';
import {Bin} from './Bin';

// @todo: switch to OOP style
let _cache = {};

export class PackageVersionResolver {
  /**
   * @param {String} name
   * @param {String} version
   */
  constructor(name, version = null) {
    if (!version) {
      let parts = name.split('@');

      if (parts.length >= 2) {
        name = parts[0];
        version = parts[1];
      }
    }

    this._name = name;
    this._version = version;
  }

  /**
   * @returns {String}
   */
  get name() {
    return this._name;
  }

  /**
   * @returns {String}
   */
  get version() {
    return this._version;
  }

  /**
   * @param {Function} cb
   * @returns {PackageVersionResolver}
   */
  resolve(cb) {
    if (_cache.hasOwnProperty(this._fullName)) {
      cb(_cache[this._fullName]);
      return this;
    }

    let cmd = new Exec(this._command);

    cmd.avoidBufferOverflow();
    cmd.run((result) => {
      if (result.failed) {
        cb(result.error, null);
        return;
      }

      _cache[this._fullName] = result.result;

      cb(null, _cache[this._fullName]);
    });

    return this;
  }

  /**
   * @returns {String}
   * @private
   */
  get _command() {
    return `${Bin.npm} view ${this._fullName} | sed -n 1p`;
  }

  /**
   * @returns {String}
   * @private
   */
  get _fullName() {
    return `${this._name}@${this._version}`;
  }
}
