/**
 * Created by AlexanderC on 12/4/15.
 */

'use strict';

import {Exec} from '../Helpers/Exec';
import {Bin} from './Bin';

export class PackageVersionResolver {
  /**
   * @param {String} packagePath
   * @param {String} name
   * @param {String} version
   */
  constructor(packagePath, name, version = null) {
    if (!version) {
      let parts = name.split('@');

      if (parts.length >= 2) {
        name = parts[0];
        version = parts[1];
      }
    }

    this._packagePath = packagePath;
    this._name = name;
    this._version = version;

    // @todo: remove when static properties available in ES6
    PackageVersionResolver._cache = PackageVersionResolver._cache || {};
  }

  /**
   * @returns {String}
   */
  get packagePath() {
    return this._packagePath;
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
   * @param {Boolean} async
   * @returns {PackageVersionResolver}
   */
  resolve(cb, async = true) {
    if (PackageVersionResolver._cache.hasOwnProperty(this._fullName)) {
      cb(null, PackageVersionResolver._cache[this._fullName]);
      return this;
    }

    let cmd = new Exec(this._command);
    cmd.cwd = this._packagePath;

    if (!async) {
      this._dispatch(cb, cmd.runSync());

      return this;
    }

    cmd.run((result) => {
      this._dispatch(cb, result);
    });

    return this;
  }

  /**
   * @param {Function} cb
   * @param {Exec} result
   * @private
   */
  _dispatch(cb, result) {

    if (result.failed) {
      cb(result.error, null);
      return;
    }

    let rawInfo = result.result;
    let info = null;

    try {
      info = JSON.parse(rawInfo);
    } catch (e) {
      cb(new Error(`Broken ${this._fullName} package version JSON object (${e}): ${rawInfo}`), null);
    }

    if (!info || !info.hasOwnProperty('dependencies')) {
      cb(new Error(`Broken ${this._fullName} package version JSON object: ${rawInfo}`), null);
      return;
    }

    let tmpDeps = info.dependencies;

    while(true) {
      let firstD = tmpDeps[Object.keys(tmpDeps).shift()];

      if (firstD.hasOwnProperty('dependencies')) {
        tmpDeps = firstD.dependencies;
      } else {
        PackageVersionResolver._cache[this._fullName] = firstD.version;
        break;
      }
    }

    cb(null, PackageVersionResolver._cache[this._fullName]);
  }

  /**
   * @returns {String}
   * @private
   */
  get _command() {
    return `${Bin.npm} ls --loglevel silent --json ${this._fullName}`;
  }

  /**
   * @returns {String}
   * @private
   */
  get _fullName() {
    return `${this._name}@'${this._version}'`;
  }
}
