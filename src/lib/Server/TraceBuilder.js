/**
 * Created by AlexanderC on 8/17/15.
 */

'use strict';

import Path from 'path';
import {exec as Exec} from 'child_process';
import FileSystem from 'fs';

export class TraceBuilder {
  /**
   * @param {String} traceFile
   */
  constructor(traceFile) {
    this._traceFile = traceFile;
  }

  /**
   * @returns {String}
   */
  get traceFile() {
    return this._traceFile;
  }

  /**
   * @param {Function} callback
   * @param {Boolean} cache
   * @returns {TraceBuilder}
   */
  compile(callback, cache = true) {
    let cacheFile = `${this._traceFile}${TraceBuilder.CACHE_EXTENSION}`;

    if (!cache) {
      this._compile(cacheFile, callback);
      return this;
    }

    FileSystem.exists(cacheFile, function(exists) {
      if (exists) {
        this._readFile(cacheFile, callback);
        return;
      }

      this._compile(cacheFile, callback);
    }.bind(this));

    return this;
  }

  /**
   * @param {String} filePath
   * @param {Function} callback
   * @private
   */
  _readFile(filePath, callback) {
    FileSystem.readFile(filePath, 'binary', callback);
  }

  /**
   * @param {String} outputFile
   * @param {Function} callback
   * @private
   */
  _compile(outputFile, callback) {
    Exec(
      `${TraceBuilder.COMPILER} ${this._traceFile} --config=full --output=${outputFile}`,
      function(error, stdout, stderr) {
        if (error) {
          callback(`Error while compiling profile: ${stderr}`, null);
          return;
        }

        this._readFile(outputFile, callback);
      }.bind(this)
    );
  }

  /**
   * @returns {String}
   */
  static get CACHE_EXTENSION() {
    return '.html.cache';
  }

  /**
   * @returns {String}
   */
  static get COMPILER() {
    return Path.join(__dirname, '../../tools/google_trace_viewer/tracing/trace2html');
  }
}
