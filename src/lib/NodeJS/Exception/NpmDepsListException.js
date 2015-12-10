/**
 * Created by AlexanderC on 8/7/15.
 */

'use strict';

import {Exception} from './Exception';
import os from 'os';

export class NpmDepsListException extends Exception {
  /**
   * @param {Error|String} error
   * @param {String} rawResult
   */
  constructor(error, rawResult) {
    super(NpmDepsListException._npmError(rawResult) || error);
  }

  /**
   * @param {String} rawResult
   * @returns {String}
   * @private
   */
  static _npmError(rawResult) {
    let result = null;

    try {
      result = JSON.parse(rawResult);

      if (typeof result === 'object' &&
        result.hasOwnProperty('name') &&
        result.hasOwnProperty('version') &&
        result.hasOwnProperty('problems')) {

        result = `The following problems were found in the package ${result.name}@${result.version}:${os.EOL}`;

        result.problems.forEach((problem) => {
          result += `  - ${problem}${os.EOL}`;
        });
      }
    } catch (e) {
      return result;
    }

    return result;
  }
}
