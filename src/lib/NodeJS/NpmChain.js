/**
 * Created by AlexanderC on 12/2/15.
 */

'use strict';

import {NpmInstall} from './NpmInstall';
import {Helpers_WaitFor as WaitFor} from 'deep-package-manager';

export class NpmChain {
  /**
   * @param {NpmInstall|*} commands
   */
  constructor(...commands) {
    console.log('Constructor NpmChain commands: ', commands);
    this._commands = commands;
  }

  /**
   * @param {NpmInstall} command
   * @returns {NpmChain}
   */
  add(command) {
    this._commands.push(command);

    return this;
  }

  /**
   * @returns {NpmInstall[]}
   */
  get commands() {
    return this._commands;
  }

  /**
   * @param {Function} cb
   * @param {*} args
   * @returns {NpmInstall}
   */
  runChunk(cb, ...args) {
    this._trigger('runChunk', cb, ...args);
  }

  /**
   * @param {Function} cb
   * @param {*} args
   * @returns {NpmInstall}
   */
  run(cb, ...args) {
    this._trigger('run', cb, ...args);
  }

  /**
   * @param {String} method
   * @param {Function} cb
   * @param {*} args
   * @private
   */
  _trigger(method, cb, ...args) {
    console.log('this._commands.length <= 0: ', this._commands.length <= 0)
    if (this._commands.length <= 0) {
      cb();
      return;
    }

    let instance = this._commands.shift();
    console.log('instance method: ', method);
    instance[method](() => {
      this._trigger(method, cb, ...args);
    }, ...args);
  }
}
