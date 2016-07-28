'use strict';

import {AbstractListener} from './AbstractListener';
import {Runtime as LambdaRuntime} from '../../Lambda/Runtime';
import FileSystemExtra from 'fs-extra';
import Path from 'path';

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
        let lambdaObj = this.server.defaultLambdasConfig[lambda];
        let payload = data.payload;

        if (!lambdaObj) {
          return event.send404(`Unknown Lambda ${lambda}`);
        }

        this.server.logger(
          `Running Lambda ${lambda} with payload ${JSON.stringify(payload)}${isAsync ? ' in async mode' : ''}`
        );

        let lambdaConfigFile = Path.join(Path.dirname(lambdaObj.path), '_config.json');
        let lambdaConfig = null;

        try {
          lambdaConfig = FileSystemExtra.readJsonSync(lambdaConfigFile);
          lambdaConfig.dynamicContext = data.context;
        } catch (e) {
          return event.send500(`Missing or broken lambda _config.json in ${lambdaConfigFile}`);
        }

        this._runLambda(event, lambdaConfig, payload, isAsync);
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
