/**
 * Created by AlexanderC on 12/1/15.
 */

'use strict';

import {Bin} from './Bin';
import {NpmInstall} from './NpmInstall';

export class NpmShrinkwrap extends NpmInstall {
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
    console.log('npmShrink _mainCmd');
    return `${Bin.npm} shrinkwrap`;
  }
}
