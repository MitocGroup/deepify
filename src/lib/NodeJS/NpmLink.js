/**
 * Created by AlexanderC on 12/1/15.
 */

'use strict';

import {Bin} from './Bin';
import {NpmInstall} from './NpmInstall';

export class NpmLink extends NpmInstall {
  /**
   * @param {*} args
   */
  constructor(...args) {
    super(...args);

    this._libsPlain = null;
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
  _newInstance(...args) {
    let instance = super._newInstance(...args);

    instance._libsPlain = this._libsPlain;

    return instance;
  }

  /**
   * @returns {String}
   * @private
   */
  get _mainCmd() {
    return `${Bin.npm} link ${this._libsPlain}`;
  }
}
