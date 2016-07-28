/**
 * Created by AlexanderC on 6/19/15.
 */

/* eslint no-unused-expressions: 0, no-undefined: 0 */

'use strict';

import Path from 'path';
import JsonFile from 'jsonfile';
import {Thread} from './Thread';
import {Timer} from './Timer';
import {ForksManager} from './ForksManager';
import {Property_Lambda as Lambda} from 'deep-package-manager';
import objectMerge from 'object-merge';

/**
 * Lambda runtime
 */
export class Runtime {
  /**
   * @param {Object} lambda
   * @param {String} lambdaPath
   * @param {Object} dynamicContext
   */
  constructor(lambda, lambdaPath = null, dynamicContext = {}) {
    this._lambda = lambda;

    this._succeed = this._logCallback('SUCCEED');
    this._fail = this._logCallback('FAILED');

    this._complete = () => {};

    this._measureTime = false;
    this._timer = null;

    this._silent = false;
    this._name = null;
    this._lambdaPath = lambdaPath;
    this._dynamicContext = dynamicContext;
  }

  /**
   * @param {String} sourceFile
   * @param {Object} dynamicContext
   * @returns {Runtime}
   */
  static createLambda(sourceFile, dynamicContext = {}) {
    global.__DEEP_DEV_SERVER = true; // @todo: do we need this here?
    sourceFile = Path.normalize(sourceFile);

    let lambda = require(sourceFile);
    let runtime = new Runtime(lambda, sourceFile, dynamicContext);

    return runtime;
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
   * @returns {String}
   */
  get arnName() {
    let name = this._name || this._extractLambdaNameFromConfig() || '';

    return name.replace(/\-\d+$/i, '');
  }

  /**
   * @returns {String}
   */
  _extractLambdaNameFromConfig() {
    let configFile = Path.join(Path.dirname(this._lambdaPath), Lambda.CONFIG_FILE);

    try {
      return JsonFile.readFileSync(configFile).name;
    } catch (error) {
      return null;
    }
  }

  /**
   * @param {String} name
   */
  set name(name) {
    this._name = name;
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
   * @param {Boolean} measureTime
   * @returns {Thread}
   */
  runForked(event, measureTime = undefined) {
    return new Thread(this)
      .run(event, measureTime);
  }

  /**
   * @param {Object} event
   * @param {Boolean} measureTime
   * @returns {Runtime}
   */
  run(event, measureTime) {
    this._injectSiblingExecutionWrapper();

    if (typeof measureTime !== 'undefined') {
      this.measureTime = measureTime;
    }

    this._measureTime && this._timer.start();

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
        invoke: function(localPath, data, callback) {
          let lambda = Runtime.createLambda(localPath, data.context);

          lambda.name = data.lambda;

          lambda.succeed = (result) => {
            callback(null, result);
          };

          lambda.fail = (error) => {
            callback(error, null);
          };

          let thread = lambda.runForked(data.payload);

          ForksManager.manage(thread.process);
        },
        invokeAsync: function(localPath, data, callback) {
          this.invoke(localPath, data, (error, result) => {
            if (error) {
              _this._log(`Lambda ${data.lambda} async execution fail`, error);
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
    let date = new Date();
    let logStreamDate = `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;

    let context = {
      /** make the context Lambda alike */
      awsRequestId: '6bde10dc-a329-11e5-8f4d-55470b0a5783',
      invokeid: '6bde10dc-a329-11e5-8f4d-55470b0a5783',
      logGroupName: `/aws/lambda/${this.arnName}`,
      logStreamName: `${logStreamDate}/${logStreamDate}[$LATEST]e680b516b0ea402eb3ff38f10b40a264`,
      functionName: this.arnName,
      memoryLimitInMB: '128',
      functionVersion: '$LATEST',
      invokedFunctionArn: `arn:aws:lambda:::function:${this.arnName}`,

      clientContext: {
        EnvironmentName: Runtime.ENVIRONMENT,
      },
      succeed: function(result) {
        this._succeed(result);

        this._measureTime && this._log(this._timer.stop().toString());

        this._complete(null, result);
      }.bind(this),
      fail: function(error) {
        this._fail(error);

        this._measureTime && this._log(this._timer.stop().toString());

        this._complete(error, null);
      }.bind(this),
    };

    return objectMerge(context, this._dynamicContext);
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
