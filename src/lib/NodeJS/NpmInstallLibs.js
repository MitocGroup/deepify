/**
 * Created by AlexanderC on 12/1/15.
 */

'use strict';

import { Bin } from './Bin';
import { NpmInstall } from './NpmInstall';

export class NpmInstallLibs extends NpmInstall {
  /**
   * @param {*} args
   */
  constructor(...args) {
    super(...args);

    this._libsPlain = null;
    this._global = false;
  }

  /**
   * @returns {Boolean}
   */
  get global() {
    return this._global;
  }

  /**
   * @param {Boolean} state
   */
  set global(state) {
    this._global = state;

    if (this._global && this._dirs.length <= 0) {
      this._dirs.push(process.cwd());
    }
  }

  /**
   * @param {String|String[]} libs
   */
  set libs(libs) {
    this._libsPlain = Array.isArray(libs) ? libs.join(' ') : libs;
  }

  /**
   * @returns {String}
   */
  get libsPlain() {
    return this._libsPlain;
  }

  /**
   * @param {*} args
   * @private
   */


  /**
   * @param {Array} args
   * @returns {*}
   * @private
   */
  _newInstance(...args) {
    let instance = super._newInstance(...args);

    instance._libsPlain = this._libsPlain;
    instance._flatten = this._flatten;
    instance._prefix = this._prefix;

    return instance;
  }

  /**
   * @returns {String}
   * @private
   */
  get _mainCmd() {
    let npmCmd = Bin.npm;
    if (this.isFlatten) {
      npmCmd = `${npmCmd} ${this._prefix}`;
    }
    const instPostfix = this.isFlatten ? './' : '';
    return `${npmCmd} install ${instPostfix} ${this._libsPlain} ${this._global ? '-g' : ''}`;
  }
}
