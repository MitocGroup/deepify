/**
 * Created by AlexanderC on 12/1/15.
 */

'use strict';

import {Bin} from './Bin';
import {Exec} from '../Helpers/Exec';
import {Helpers_WaitFor as WaitFor} from 'deep-package-manager';

export class NpmInstall {
  /**
   * @param {String|*} dirs
   */
  constructor(...dirs) {
    // try to make it compatible with ES5
    if (dirs.length === 1 && Array.isArray(dirs[0])) {
      dirs = dirs[0];
    }

    this._dirs = dirs;
    this._extraArgs = [];
  }

  /**
   * @returns {String[]}
   */
  get extraArgs() {
    return this._extraArgs;
  }

  /**
   * @param {String|*} args
   * @returns {NpmInstall}
   */
  addExtraArg(...args) {
    this._extraArgs.push(...args);

    return this;
  }

  /**
   * @returns {String[]}
   */
  get dirs() {
    return this._dirs;
  }

  /**
   * @param {Function} cb
   * @param {Number} chunkSize
   * @param {Boolean} silent
   * @returns {NpmInstall}
   */
  runChunk(cb, chunkSize = NpmInstall.DEFAULT_CHUNK_SIZE, silent = NpmInstall.DEFAULT_SILENT_STATE) {
    let wait = new WaitFor();
    let chunks = NpmInstall._chunkArray(this._dirs, chunkSize);
    let remaining = chunks.length;

    wait.push(() => {
      return remaining <= 0;
    });

    for (let i in chunks) {
      if (!chunks.hasOwnProperty(i)) {
        continue;
      }

      let chunk = chunks[i];

      let instance = this._newInstance(...chunk);

      instance.run(() => {
        remaining--;
      }, silent);
    }

    wait.ready(cb);

    return this;
  }

  /**
   * @param {*} args
   * @private
   */
  _newInstance(...args) {
    let instance = new this.constructor(...args);

    instance._extraArgs = this._extraArgs;

    return instance;
  }

  /**
   * @param {Function} cb
   * @param {Boolean} silent
   * @returns {NpmInstall}
   */
  run(cb, silent = NpmInstall.DEFAULT_SILENT_STATE) {
    let wait = new WaitFor();
    let remaining = this._dirs.length;
    let cmdStack = [];

    wait.push(() => {
      return remaining <= 0;
    });

    for (let i in this._dirs) {
      if (!this._dirs.hasOwnProperty(i)) {
        continue;
      }

      let dir = this._dirs[i];

      let cmd = new Exec(...this._execArgs);

      cmd.cwd = dir;

      if (silent) {
        cmd.avoidBufferOverflow();
      }

      cmdStack.push(cmd);
    }

    cmdStack.forEach((cmd) => {
      cmd.run((result) => {
        if (result.failed && !this._silent) {
          console.error(result.error);
        }

        remaining--;
      }, !silent);
    });

    wait.ready(cb);

    return this;
  }

  /**
   * @returns {Array}
   * @private
   */
  get _execArgs() {
    return [this._mainCmd, ...this._extraArgs];
  }

  /**
   * @returns {String}
   * @private
   */
  get _mainCmd() {
    return `${Bin.npm} install`;
  }

  /**
   * @param {Array} arr
   * @param {Number} size
   * @returns {Array}
   * @private
   */
  static _chunkArray(arr, size) {
    let i = 0;
    let chunks = [];
    let n = arr.length;

    while (i < n) {
      chunks.push(arr.slice(i, i += size));
    }

    return chunks;
  }

  /**
   * @returns {Boolean}
   */
  static get DEFAULT_SILENT_STATE() {
    return false;
  }

  /**
   * @returns {Number}
   */
  static get DEFAULT_CHUNK_SIZE() {
    return 4;
  }
}