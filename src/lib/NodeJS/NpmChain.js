/**
 * Created by AlexanderC on 12/2/15.
 */

'use strict';


export class NpmChain {
  /**
   * @param {NpmInstall|*} commands
   */
  constructor(...commands) {
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
   * @param {Array} args
   */
  runChunk(cb, ...args) {
    this._trigger('runChunk', cb, ...args);
  }


  /**
   * @param {Function} cb
   * @param {Array} args
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
    if (this._commands.length <= 0) {
      cb();
      return;
    }

    let instance = this._commands.shift();

    instance[method](() => {
      this._trigger(method, cb, ...args);
    }, ...args);
  }
}
