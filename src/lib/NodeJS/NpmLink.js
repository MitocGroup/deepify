/**
 * Created by AlexanderC on 12/1/15.
 */

'use strict';

import {Bin} from './Bin';
import {NpmInstall} from './NpmInstall';

export class NpmLink extends NpmInstall {
  /**
   * @param {String|String[]} libs
   * @param {*} args
   */
  constructor(libs, ...args) {
    super(...args);

    this._libsPlain = Array.isArray(libs) ? libs.join(' ') : libs;
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
    return `${Bin.npm} link ${this._libsPlain}`;
  }
}
