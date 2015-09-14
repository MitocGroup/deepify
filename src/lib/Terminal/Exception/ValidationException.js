/**
 * Created by AlexanderC on 8/7/15.
 */

'use strict';

import {Exception} from './Exception';

export class ValidationException extends Exception {
  /**
   * @param {Array} args
   */
  constructor(...args) {
    super(...args);

    this._program = null;
  }

  /**
   * @returns {Object}
   */
  get program() {
    return this._program;
  }

  /**
   * @param {Object} program
   */
  set program(program) {
    this._program = program;
  }
}
