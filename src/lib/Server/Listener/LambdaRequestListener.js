'use strict';
import {AbstractRequestListener} from './AbstractRequestListener';
import {Runtime as LambdaRuntime} from '../../Lambda/Runtime';
import FileSystemExtra from 'fs-extra';
import FileSystem from 'fs';
import Path from 'path';

export class LambdaRequestListener extends AbstractRequestListener {

  /**
   *
   * @param {Array} args
   */
  constructor(...args) {
    super(...args);

    this._server.listener.registerLambdaRequestListener((...args) => {
      this._handler(...args);
    });
  }

  /**
   *
   * @param {ResponseEvent} event
   * @private
   */
  _handler(event) {
    let request = event.request;

    let uri = this.getUri(request.url);
    if (this.isLambdaRequest(uri)) {
      let isAsync = uri === LambdaRequestListener.LAMBDA_ASYNC_URI;

      this._readRequestData(request, function(rawData) {
        let data = JSON.parse(rawData);

        if (!data) {
          this._server.logger(`Broken Lambda payload: ${rawData}`);
          event.send500('Error while parsing JSON request payload');
          return;
        }

        let lambda = data.lambda;
        let payload = data.payload;

        this._server.logger(
          `Running Lambda ${lambda} with payload ${JSON.stringify(payload)}${isAsync ? ' in async mode' : ''}`
        );

        if (this._server.buildPath) {
          let lambdaConfig = this._server.buildConfig.lambdas[lambda];

          if (!lambdaConfig) {
            this._server.logger(`Missing Lambda ${lambda} built config`);
            event.send404(`Unknown Lambda ${lambda}`);
            return;
          }

          FileSystemExtra.ensureSymlink(
            Path.join(lambdaConfig.buildPath, '_config.json'),
            Path.join(Path.dirname(lambdaConfig.path), '_config.json'),
            function(error) {
              this._runLambda(lambdaConfig, payload, isAsync);
            }.bind(this)
          );
        } else {
          let lambdaConfig = this._server.defaultLambdasConfig[lambda];

          if (!lambdaConfig) {
            this._server.logger(`Missing Lambda ${lambda} config`);
            event.send404(`Unknown Lambda ${lambda}`);
            return;
          }

          let lambdaConfigFile = Path.join(Path.dirname(lambdaConfig.path), '_config.json');

          FileSystemExtra.outputJson(
            lambdaConfigFile,
            lambdaConfig,
            (error) => {
              if (error) {
                this._server.logger(`Unable to persist fake Lambda ${lambda} config: ${error}`);
                event.send500(error);
                return;
              }

              this._runLambda(event, lambdaConfig, payload, isAsync);
            }
          );
        }
      }.bind(this));
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
      lambdaConfig.buildPath ? Path.join(lambdaConfig.buildPath, '.aws.json') : null
    );

    lambda.name = `${lambdaConfig.name}-${this._server.localId}`;

    let successCb = (result) => {
      let plainResult = JSON.stringify(result);

      if (!asyncMode) {
        this._server.logger(`Serving result for Lambda ${lambdaConfig.name}: ${plainResult}`);
        event.send(plainResult, 200, 'application/json', false);
      } else {
        this._server.logger(`Result for Lambda ${lambdaConfig.name} async call: ${plainResult}`);
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
        this._server.logger(`Lambda ${lambdaConfig.name} execution fail`, errorObj.errorMessage);

        successCb(errorObj);
      } else {
        this._server.logger(`Lambda ${lambdaConfig.name} async execution fail`, errorObj.errorMessage);
      }
    };

    lambda.runForked(payload);

    if (asyncMode) {
      event.send(JSON.stringify(null), 202, 'application/json', false);
    }
  }
}
