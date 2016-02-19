/**
 * Created by AlexanderC on 2/19/16.
 */

'use strict';

import {AbstractStrategy} from './AbstractStrategy';
import path from 'path';
import fse from 'fs-extra';

export class StandardStrategy extends AbstractStrategy {
  /**
   * @param {*} args
   */
  constructor(...args) {
    super(...args);
  }

  /**
   * @param {String} filePath
   * @param {Stream|Writable|Readable|stream.Readable|stream.Writable|*} stream
   * @param {Function} cb
   */
  extract(filePath, stream, cb) {
    if (!StandardStrategy._haveToDump(filePath)) {
      cb();
      return;
    }

    let file = path.join(this.dumpPath, StandardStrategy._normalizeFilePath(filePath));

    stream.pipe(fse.createOutputStream(file));
    stream.on('end', cb);
  }

  /**
   * @param {String} filePath
   * @returns {String}
   * @private
   */
  static _normalizeFilePath(filePath) {
    return filePath.replace(/^(\/?src\/[^\/]+\/)/i, '');
  }

  /**
   * @param {String} filePath
   * @returns {Boolean}
   * @private
   */
  static _haveToDump(filePath) {
    return /^\/?src\/[A-Z][^\/]+\//.test(filePath);
  }
}
