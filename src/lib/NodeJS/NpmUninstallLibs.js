/**
 * Created by AlexanderC on 12/1/15.
 */

'use strict';

import {Bin} from './Bin';
import {NpmInstallLibs} from './NpmInstallLibs';

export class NpmUninstallLibs extends NpmInstallLibs {
  /**
   * @param {*} args
   */
  constructor(...args) {
    super(...args);
  }

  /**
   * @returns {String}
   * @private
   */
  get _mainCmd() {
    console.log('npmUninstall _mainCmd');
    return `${Bin.npm} uninstall ${this._libsPlain} ${this._global ? '-g' : ''}`;
  }
}
