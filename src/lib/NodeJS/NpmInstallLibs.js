/**
 * Created by AlexanderC on 12/1/15.
 */

'use strict';

import {Bin} from './Bin';
import {NpmInstall} from './NpmInstall';

export class NpmInstallLibs extends NpmInstall {
  /**
   * @param {String|String[]} libs
   * @param {*} args
   */
  constructor(libs, ...args) {
    super(...args);

    this._libsPlain = Array.isArray(libs) ? libs.join(' ') : libs;
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
   * @returns {String}
   */
  get libsPlain() {
    return this._libsPlain;
  }

  /**
   * @returns {String}
   * @private
   */
  get _mainCmd() {
    return `${Bin.npm} install ${this._libsPlain} ${this._global ? '-g' : ''}`;
  }
}
