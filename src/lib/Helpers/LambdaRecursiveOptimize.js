/**
 * Created by AlexanderC on 3/18/16.
 */

'use strict';

import uglify from 'uglify-js';
import {Helpers_FileWalker as FileWalker} from 'deep-package-manager';
import {Helpers_WaitFor as WaitFor} from 'deep-package-manager';
import fs from 'fs';
import {Spinner} from 'cli-spinner';

export class LambdaRecursiveOptimize {
  /**
   * @param {String} lambdaPath
   * @param {Boolean} spinner
   * @param {Boolean} singleInstanceOnly
   */
  constructor(lambdaPath, spinner = true, singleInstanceOnly = true) {
    this._lambdaPath = lambdaPath;
    this._spinner = spinner;
    this._singleInstanceOnly = singleInstanceOnly;

    this._spinnerObj = null;
    this._filters = [];

    LambdaRecursiveOptimize._inUse = LambdaRecursiveOptimize._inUse || false;
  }

  /**
   * @param {Function} filter
   * @returns {LambdaRecursiveOptimize}
   */
  addFilter(filter) {
    this._filters.push(filter);
    return this;
  }

  /**
   * @returns {Boolean}
   */
  get singleInstanceOnly() {
    return this._singleInstanceOnly;
  }

  /**
   * @returns {Boolean}
   */
  get spinner() {
    return this._spinner;
  }

  /**
   * @returns {String|*}
   */
  get lambdaPath() {
    return this._lambdaPath;
  }

  /**
   * @param {Function} cb
   * @returns {LambdaRecursiveOptimize}
   */
  run(cb) {
    this._waitUntilUnlocked(() => {
      this
        ._lock()
        ._runChunks(this._jsFilesChunks, () => {
          if (this._spinnerObj) {
            this._spinnerObj.stop(true);
            this._spinnerObj = null;
          }

          this._unlock();

          cb();
        });
    });

    return this;
  }

  /**
   * @returns {LambdaRecursiveOptimize}
   * @private
   */
  _unlock() {
    LambdaRecursiveOptimize._inUse = false;

    return this;
  }

  /**
   * @returns {LambdaRecursiveOptimize}
   * @private
   */
  _lock() {
    LambdaRecursiveOptimize._inUse = true;

    return this;
  }

  /**
   * @param {Function} cb
   * @private
   */
  _waitUntilUnlocked(cb) {
    let wait = new WaitFor();

    wait.push(() => {
      return !this._singleInstanceOnly || !LambdaRecursiveOptimize._inUse;
    });

    wait.ready(cb);
  }

  /**
   * @param {Array[]} chunks
   * @private
   */
  _updateSpinner(chunks) {
    if (!this._spinner) {
      return;
    }

    let title = `%s ${chunks.length} chunks remaining...`;

    if (!this._spinnerObj) {
      this._spinnerObj = new Spinner(title);
    } else {
      this._spinnerObj.setSpinnerTitle(title);
    }

    if (!this._spinnerObj.isSpinning()) {
      this._spinnerObj.start();
    }
  }

  /**
   * @param {Array[]} jsFilesChunks
   * @param {Function} cb
   * @param {Number} filesOptimized
   * @param {Number} filesError
   * @private
   */
  _runChunks(jsFilesChunks, cb, filesOptimized = 0, filesError = 0) {
    this._updateSpinner(jsFilesChunks);

    if (jsFilesChunks.length <= 0) {
      console.info(`Optimization summary: ${filesOptimized} optimized / ${filesError} skipped due to errors`);

      cb();
      return;
    }

    let workingChunk = jsFilesChunks.shift();
    let wait = new WaitFor();
    let remaining = workingChunk.length;

    wait.push(() => {
      return remaining <= 0;
    });

    wait.ready(() => {
      this._runChunks(jsFilesChunks, cb, filesOptimized, filesError);
    });

    workingChunk.forEach((jsFile) => {
      fs.readFile(jsFile, (error, jsContent) => {
        if (error) {
          console.error(`Error reading ${jsFile}: ${error.message}`);
          filesError++;
          remaining--;
          return;
        }

        try {
          let jsContentOptimized = uglify.minify(jsContent.toString(), LambdaRecursiveOptimize.UGLIFY_JS_OPTIONS);

          fs.writeFile(jsFile, jsContentOptimized.code.toString(), (error) => {
            if (error) {
              console.error(`Error writing ${jsFile}: ${error.message}`);
              filesError++;
            } else {
              filesOptimized++;
            }

            remaining--;
          });
        } catch (error) {
          filesError++;
          remaining--;
        }
      });
    });
  }

  /**
   * @returns {Object}
   */
  static get UGLIFY_JS_OPTIONS() {
    return {
      fromString: true,
      warnings: false,
      mangle: false,
      mangleProperties: false,
      parse: {
        strict: false,
      },
    };
  }

  /**
   * @returns {Array[]}
   * @private
   */
  get _jsFilesChunks() {
    let files = this._jsFiles;

    return files.length <= 0 ?
      [] :
      LambdaRecursiveOptimize._chunkArray(files, LambdaRecursiveOptimize.CHUNK_SIZE);
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
   * @returns {String[]}
   * @private
   */
  get _jsFiles() {
    let walker = new FileWalker(FileWalker.RECURSIVE);

    return walker

      // find js files
      .walk(this._lambdaPath, FileWalker.matchExtensionsFilter(FileWalker.skipDotsFilter, 'js'))

      // resolve symlinks
      .map((file) => fs.realpathSync(file))

      // remove duplicates
      .filter((val, i, arr) => arr.indexOf(val) === i)

      // skip deep-* files (brakes the functionality for some reason)
      .filter((val) => !/\/deep_modules\/deep-[a-z]+/i.test(val))

      // run user custom filters
      .filter((val) => this._filters.reduce((isValid, filter) => isValid && filter(val), true));
  }

  /**
   * @returns {Number}
   */
  static get CHUNK_SIZE() {
    return 10;
  }
}
