/**
 * Created by AlexanderC on 8/18/15.
 */

'use strict';

import {Profiler} from './Profiler';

export class StaticDumpFileProfiler extends Profiler {
  /**
   * @param {String} name
   * @param {String} staticDumpFile
   */
  constructor(name = null, staticDumpFile = null) {
    super(name);

    this._staticDumpFile = staticDumpFile;
  }

  /**
   * @param {String} path
   */
  set staticDumpFile(path) {
    this._staticDumpFile = path;
  }

  /**
   * @returns {String}
   */
  get staticDumpFile() {
    return this._staticDumpFile;
  }

  /**
   * @returns {String}
   */
  get dumpFile() {
    return this._staticDumpFile;
  }
}
