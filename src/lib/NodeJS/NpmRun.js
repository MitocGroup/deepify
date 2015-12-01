/**
 * Created by AlexanderC on 12/1/15.
 */

'use strict';

import {Bin} from './Bin';
import {NpmInstall} from './NpmInstall';

export class NpmRun extends NpmInstall {
  /**
   * @param {String} cmd
   * @param {*} args
   */
  constructor(cmd, ...args) {
    super(...args);

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
