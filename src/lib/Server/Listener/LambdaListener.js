'use strict';

import {AbstractListener} from './AbstractListener';
import {Runtime as LambdaRuntime} from '../../Lambda/Runtime';
import FileSystemExtra from 'fs-extra';
import FileSystem from 'fs';
import Path from 'path';
import objectMerge from 'object-merge';

export class LambdaListener extends AbstractListener {
  /**
   * @param {*} args
   */
  constructor(...args) {
    super(...args);
  }

  /**
   * @param {ResponseEvent} event
   */
  handler(event) {
    let request = event.request;
    let uri = this.getUri(request.url);

    if (uri === LambdaListener.LAMBDA_URI || uri === LambdaListener.LAMBDA_ASYNC_URI) {
      let isAsync = uri === LambdaListener.LAMBDA_ASYNC_URI;
      event.stopPropagation(); // lambda runs async. stop other listeners

      this._readRequestData(request, (rawData) => {
        let data = JSON.parse(rawData);

        if (!data) {
          this.server.logger(`Broken Lambda payload: ${rawData}`);
          event.send500('Error while parsing JSON request payload');
          return;
        }

        let lambda = data.lambda;
        let payload = data.payload;
        let lambdaConfig = {
          dynamicContext: data.context,
        };

        this.server.logger(
          `Running Lambda ${lambda} with payload ${JSON.stringify(payload)}${isAsync ? ' in async mode' : ''}`
        );

        if (this.server.buildPath) {
          lambdaConfig = objectMerge(lambdaConfig, this.server.buildConfig.lambdas[lambda]);

          if (!lambdaConfig) {
            this.server.logger(`Missing Lambda ${lambda} built config`);
            event.send404(`Unknown Lambda ${lambda}`);
            return;
          }

          FileSystemExtra.ensureSymlink(
            Path.join(lambdaConfig.buildPath, '_config.json'),
            Path.join(Path.dirname(lambdaConfig.path), '_config.json'),
            (error) => {
              if (error) {
                this.server.logger(`Unable to link Lambda ${lambda} config: ${error}`);
                event.send500(error);
                return;
              }

              this._runLambda(event, lambdaConfig, payload, isAsync);
            }
          );
        } else {
          lambdaConfig = objectMerge(lambdaConfig, this.server.defaultLambdasConfig[lambda]);

          if (!lambdaConfig) {
            this.server.logger(`Missing Lambda ${lambda} config`);
            event.send404(`Unknown Lambda ${lambda}`);
            return;
          }

          let lambdaConfigFile = Path.join(Path.dirname(lambdaConfig.path), '_config.json');

          FileSystemExtra.outputJson(
            lambdaConfigFile,
            lambdaConfig,
            (error) => {
              if (error) {
                this.server.logger(`Unable to persist fake Lambda ${lambda} config: ${error}`);
                event.send500(error);
                return;
              }

              this._runLambda(event, lambdaConfig, payload, isAsync);
            }
          );
        }
      });
    }
  }


  /**
   * @param {Http.IncomingMessage} request
   * @param {Function} callback
   */
  _readRequestData(request, callback) {
    if (request.method === 'POST') {
      let rawData = '';

      request.on('data', function(chunk) {
        rawData += chunk.toString();
      });

      request.on('end', function() {
        callback(rawData);
      });
    } else {
      callback(null);
    }
  }

  /**
   * @param {ResponseEvent} event
   * @param {Object} lambdaConfig
   * @param {Object} payload
   * @param {Boolean} asyncMode
   * @private
   */
  _runLambda(event, lambdaConfig, payload, asyncMode) {
    let lambda = LambdaRuntime.createLambda(
      lambdaConfig.path,
      lambdaConfig.dynamicContext
    );

    lambda.name = `${lambdaConfig.name}-${this.server.localId}`;

    let successCb = (result) => {
      let plainResult = JSON.stringify(result);

      if (!asyncMode) {
        this.server.logger(`Serving result for Lambda ${lambdaConfig.name}: ${plainResult}`);
        event.send(plainResult, 200, 'application/json', false);
      } else {
        this.server.logger(`Result for Lambda ${lambdaConfig.name} async call: ${plainResult}`);
      }
    };

    lambda.succeed = successCb;

    lambda.fail = (error) => {
      let errorObj = error;

      if (typeof error === 'object' && error instanceof Error) {
        errorObj = {
          errorType: error.name,
          errorMessage: error.message,
          errorStack: error.stack
        };

        if (error.validationErrors) {
          errorObj.validationErrors = error.validationErrors;
        }
      }

      if (!asyncMode) {
        this.server.logger(`Lambda ${lambdaConfig.name} execution fail`, errorObj.errorMessage);

        successCb(errorObj);
      } else {
        this.server.logger(`Lambda ${lambdaConfig.name} async execution fail`, errorObj.errorMessage);
      }
    };

    lambda.runForked(payload);

    if (asyncMode) {
      event.send(JSON.stringify(null), 202, 'application/json', false);
    }
  }

  /**
   * @returns {String}
   */
  static get LAMBDA_ASYNC_URI() {
    return '/_/lambda-async';
  }

  /**
   * @returns {String}
   */
  static get LAMBDA_URI() {
    return '/_/lambda';
  }
}
