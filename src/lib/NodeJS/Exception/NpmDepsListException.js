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
      let resultObj = JSON.parse(rawResult);

      if (typeof resultObj === 'object' &&
        resultObj.hasOwnProperty('name') &&
        resultObj.hasOwnProperty('version') &&
        resultObj.hasOwnProperty('problems')) {

        result = `The following problems were found in the package ${resultObj.name}@${resultObj.version}:${os.EOL}`;

        resultObj.problems.forEach((problem) => {
          result += `  - ${problem}${os.EOL}`;
        });
      }
    } catch (e) {
      return result;
    }

    return result;
  }
}
