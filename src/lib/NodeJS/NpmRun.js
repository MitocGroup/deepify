/**
 * Created by AlexanderC on 12/1/15.
 */

'use strict';

import {Bin} from './Bin';
import {NpmInstall} from './NpmInstall';

export class NpmRun extends NpmInstall {
  /**
   * @param {*} args
   */
  constructor(...args) {
    super(...args);

    this._cmd = null;
  }

  /**
   *
   * @param {Array} args
   * @returns {*}
   * @private
   */
  _newInstance(...args) {
    let instance = super._newInstance(...args);

    instance._cmd = this._cmd;

    return instance;
  }

  /**
   * @param {String} cmd
   */
  set cmd(cmd) {
    this._cmd = cmd;
  }

  /**
   * @returns {String}
   */
  get cmd() {
    return this._cmd;
  }

  /**
   * @returns {String}
   * @private
   */
  get _mainCmd() {
    return `${Bin.npm} run ${this._cmd}`;
  }
}
