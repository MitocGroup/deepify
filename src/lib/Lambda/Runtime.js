/**
 * Created by AlexanderC on 6/19/15.
 */

'use strict';

import Path from 'path';
import AWS from 'aws-sdk';
import JsonFile from 'jsonfile';
import RequireProxy from 'proxyquire';
import {Hash} from '../Helpers/Hash';
import {Thread} from './Thread';

/**
 * Lambda runtime
 */
export class Runtime {
  /**
   * @param {Object} lambda
   * @param {String} lambdaPath
   */
  constructor(lambda, lambdaPath = null) {
    this._lambda = lambda;

    this._succeed = this._logCallback('SUCCEED');
    this._fail = this._logCallback('FAILED');
    this._complete = (error, response) => {};

    this._measureTime = false;
    this._silent = false;
    this._profiler = null;
    this._name = Hash.pseudoRandomId(this);
    this._lambdaPath = lambdaPath;
    this._awsConfigFile = null;
  }

  /**
   * @param {String} sourceFile
   * @param {String} awsConfigFile
   */
  static createLambda(sourceFile, awsConfigFile = null) {
    if (awsConfigFile) {
      let awsConfig = JsonFile.readFileSync(awsConfigFile);

      AWS.config.update(awsConfig);
    } else {
      global.__DEEP_DEV_SERVER = true; // @todo: do we need this here?
    }

    Object.defineProperty(AWS, '@global', {
      value: true,
      writable: false,
    });

    sourceFile = Path.normalize(sourceFile);

    let lambda = RequireProxy(sourceFile, {
      'aws-sdk': AWS,
    });

    let runtime = new Runtime(lambda, sourceFile);
    runtime.awsConfigFile = awsConfigFile;

    return runtime;
  }

  /**
   * @param {String} path
   */
  set awsConfigFile(path) {
    this._awsConfigFile = path;
  }

  /**
   * @returns {String}
   */
  get awsConfigFile() {
    return this._awsConfigFile;
  }

  /**
   * @returns {String}
   */
  get lambdaPath() {
    return this._lambdaPath;
  }

  /**
   * @returns {String}
   */
  get name() {
    return this._name;
  }

  /**
   * @param {String} name
   */
  set name(name) {
    this._name = name;
  }

  /**
   * @returns {AbstractProfiler}
   */
  get profiler() {
    return this._profiler;
  }

  /**
   * @param {AbstractProfiler} profiler
   */
  set profiler(profiler) {
    this._profiler = profiler;
  }

  /**
   * @returns {Boolean}
   */
  get silent() {
    return this._silent;
  }

  /**
   * @param {Boolean} state
   */
  set silent(state) {
    this._silent = state;
  }

  /**
   * @param {Object} event
   * @param {Boolean|undefined} measureTime
   * @returns {Runtime}
   */
  runForked(event, measureTime = undefined) {
    new Thread(this).run(event, measureTime);

    return this;
  }

  /**
   * @param {Object} event
   * @param {Boolean|undefined} measureTime
   * @returns {Runtime}
   */
  run(event, measureTime = undefined) {
    if (typeof measureTime !== 'undefined') {
      this._measureTime = measureTime;
    }

    if (this._measureTime) {
      console.time(this._name);
    }

    this._profiler && this._profiler.start();

    this._lambda.handler.bind(this)(event, this.context);

    return this;
  }

  /**
   * @returns {Boolean}
   */
  get measureTime() {
    return this._measureTime;
  }

  /**
   * @param {Boolean} state
   */
  set measureTime(state) {
    this._measureTime = state;
  }

  /**
   * @returns {Function}
   */
  get complete() {
    return this._complete;
  }

  /**
   * @param {Function} callback
   */
  set complete(callback) {
    this._complete = callback;
  }

  /**
   * @returns {Function}
   */
  get succeed() {
    return this._succeed;
  }

  /**
   * @param {Function} callback
   */
  set succeed(callback) {
    this._succeed = callback;
  }

  /**
   * @returns {Function}
   */
  get fail() {
    return this._fail;
  }

  /**
   * @param {Function} callback
   */
  set fail(callback) {
    this._fail = callback;
  }

  /**
   * @returns {Object}
   */
  get lambda() {
    return this._lambda;
  }

  /**
   * @returns {Object}
   */
  get context() {
    return {
      clientContext: {
        EnvironmentName: Runtime.ENVIRONMENT,
      },
      succeed: function(result) {
        this._profiler && this._profiler.stop();

        this._succeed(result);

        if (this._measureTime) {
          console.timeEnd(this._name);
        }

        this._complete(null, result);
      }.bind(this),
      fail: function(error) {
        this._profiler && this._profiler.stop();

        this._fail(error);

        if (this._measureTime) {
          console.timeEnd(this._name);
        }

        this._complete(error, null);
      }.bind(this),
    };
  }

  /**
   * @returns {String}
   */
  static get ENVIRONMENT() {
    return 'local';
  }

  /**
   * @param {String} type
   * @returns {Function}
   */
  _logCallback(type) {
    return function(result) {
      this._log('--------------------');
      this._log(`[${type}]: `, result);
      this._log('--------------------');
    }.bind(this);
  }

  /**
   * @private
   */
  _log(...args) {
    if (!this._silent) {
      console.log(...args);
    }
  }
}
