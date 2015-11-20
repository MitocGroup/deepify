/**
 * Created by AlexanderC on 6/19/15.
 */

'use strict';

import Path from 'path';
import AWS from 'aws-sdk';
import JsonFile from 'jsonfile';
import RequireProxy from 'proxyquire';
import {Helpers_Hash as Hash} from 'deep-package-manager';
import {Thread} from './Thread';
import {Timer} from './Timer';
import {ForksManager} from './ForksManager';

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

    this._complete = () => {};

    this._measureTime = false;
    this._timer = null;

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
   * @returns {Thread}
   */
  runForked(event, measureTime = undefined) {
    return new Thread(this)
      .run(event, measureTime);
  }

  /**
   * @param {Object} event
   * @param {Boolean|undefined} measureTime
   * @returns {Runtime}
   */
  run(event, measureTime = undefined) {
    this._injectSiblingExecutionWrapper();

    if (typeof measureTime !== 'undefined') {
      this.measureTime = measureTime;
    }

    this._measureTime && this._timer.start();
    this._profiler && this._profiler.start();

    this._lambda.handler.bind(this)(event, this.context);

    return this;
  }

  /**
   * Inject a wrapper for sibling lambdas
   * execution. Used by deep-resource
   *
   * @private
   */
  _injectSiblingExecutionWrapper() {
    let _this = this;

    global[Runtime.SIBLING_EXEC_WRAPPER_NAME] = new function() {
      return {
        invoke: function (localPath, data, callback) {
          let lambda = Runtime.createLambda(localPath, _this._awsConfigFile);

          lambda.name = data.lambda;
          lambda.profiler = _this._profiler;

          lambda.succeed = (result) => {
            lambda.profiler && lambda.profiler.save((error) => {
              error && _this._log(`Error while saving profile for Lambda ${lambda.name}: ${error}`);
            });

            callback(null, result);
          };

          lambda.fail = (error) => {
            lambda.profiler && lambda.profiler.save((error) => {
              error && _this._log(`Error while saving profile for Lambda ${lambda.name}: ${error}`);
            });

            callback(error, null);
          };

          let thread = lambda.runForked(data.payload);

          ForksManager.manage(thread.process);
        },
        invokeAsync: function (localPath, data, callback) {
          this.invoke(localPath, data, (error, result) => {
            if (error) {
              _this._log(`Lambda ${data.lambda} async execution fail: ${error.message}`);
              return;
            }

            _this._log(`Result for Lambda ${data.lambda} async call: ${JSON.stringify(result)}`);
          });

          callback(null, null);
        },
      };
    };
  }

  /**
   * @returns {String}
   */
  static get SIBLING_EXEC_WRAPPER_NAME() {
    return '_deep_lambda_exec_';
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

    if (state) {
      this._timer = new Timer(this._name);
    }
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

        this._measureTime && this._log(this._timer.stop().toString());

        this._complete(null, result);
      }.bind(this),
      fail: function(error) {
        this._profiler && this._profiler.stop();

        this._fail(error);

        this._measureTime && this._log(this._timer.stop().toString());

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
