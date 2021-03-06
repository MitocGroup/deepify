/**
 * Created by AlexanderC on 12/1/15.
 */

'use strict';

import {Exec} from '../Helpers/Exec';

export class Bin {
  /**
   * @param {String} module
   * @param {Boolean} global
   * @returns {Boolean}
   */
  static npmModuleInstalled(module, global = false) {
    return new Exec('npm list', module, global ? '-g' : '')
      .runSync()
      .succeed;
  }

  /**
   * @returns {Number}
   */
  static get npmMajorVersion() {
    let versionResult = new Exec(Bin.npm, '--version').runSync();

    if (versionResult.failed) {
      throw new Error(versionResult.error);
    }

    return Number(versionResult.result.match(/^(\d+)\./)[1]);
  }

  /**
   * @returns {Number}
   */
  static get nodeMajorVersion() {
    return Number(process.version.match(/^v(\d+)\./)[1]);
  }

  /**
   * @returns {String}
   */
  static get npm() {
    if (Bin._npm) {
      return Bin._npm;
    }

    Bin._npm = Bin.resolve('npm');

    //@todo - temporary solution for windows -> node exists globally so we can use without full path
    Bin._npm = (Bin._isWin) ? 'npm': Bin._npm;

    return Bin._npm;
  }

  /**
   * @returns {String}
   */
  static get node() {
    if (Bin._node) {

      return Bin._node;
    }

    try {
      Bin._node = Bin.resolve(Bin._envBin());
    } catch (e) {

      // fallback here
      Bin._node = Bin.resolve('node');
    }

    //@todo - temporary solution for windows -> node exists globally so we can use without full path
    Bin._node = (Bin._isWin) ? 'node': Bin._node;

    return Bin._node;
  }

  /**
   * @param {String} bin
   * @param {Boolean} cached
   * @returns {String}
   */
  static resolve(bin, cached = false) {
    if (cached && Bin._bin_ && Bin._bin_.hasOwnProperty(bin)) {
      return Bin._bin_[bin];
    }
    
    let locatorCmd = (Bin._isWin) ? 'where': 'which';
    let cmd = new Exec(locatorCmd, bin).runSync();

    if (cmd.failed) {
      throw cmd.error;
    }
    
    if (cached) {
      Bin._bin_ = Bin._bin_ || {};
      Bin._bin_[bin] = cmd.result;
    }

    return cmd.result;
  }

  /**
   * @returns {Boolean}
   * @private
   */
  static get _isWin() {
    return /^win/.test(process.platform);
  }

  /**
   * @returns {String}
   * @param {Boolean} throwOnMissing
   * @private
   */
  static _envBin(throwOnMissing = true) {
    if (process.argv.length <= 0) {
      if (throwOnMissing) {
        throw new Error('Missing env binary process.argv[0]');
      }

      return '';
    }

    let bin = process.argv[0];

    if (!bin && throwOnMissing) {
      throw new Error('Empty env binary process.argv[0]');
    }

    return bin;
  }
}
