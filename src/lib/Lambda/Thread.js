/**
 * Created by AlexanderC on 8/18/15.
 */

'use strict';

import Path from 'path';
import ChildProcess from 'child_process';
import {LambdaExecutionException} from './Exception/LambdaExecutionException';
import {Property_Lambda as Lambda} from 'deep-package-manager';

export class Thread {
  /**
   * @param {Runtime} runtime
   */
  constructor(runtime) {
    this._runtime = runtime;
    this._process = null;
  }

  /**
   * @param {Object} event
   * @param {Boolean} measureTime
   * @returns {Thread}
   */
  run(event, measureTime) {
    this._process = ChildProcess.fork(
      Thread.WRAPPER,
      [
        JSON.stringify(this._runtime),
        JSON.stringify(event),
        measureTime,
      ],
      {
        cwd: Path.dirname(this._runtime.lambdaPath),
        silent: true,
      }
    );

    // @todo: replace with fork opts
    this._process.stdout.pipe(process.stdout);
    this._process.stderr.pipe(process.stderr);

    let contextSent = false;
    let noPrematureFailCheck = false;

    let onError = (error) => {
      if (contextSent) {
        console.error(`Sending context twice from Lambda (error thrown: ${error})`);
        return;
      }

      contextSent = true;

      this._runtime.fail(new LambdaExecutionException(error));
      this._cleanup();
    };

    // Kills lambda if execution time exceeded
    setTimeout(() => {
      if (contextSent) {
        return;
      }

      noPrematureFailCheck = true;

      onError(`The Lambda timeout of ${Lambda.MAX_TIMEOUT} seconds exceeded!`);
    }, parseInt(Lambda.MAX_TIMEOUT) * 1000);

    this._process.on('message', (payload) => {
      if (contextSent) {
        console.error(`Sending context twice from Lambda (payload: ${JSON.stringify(payload)})`);
        return;
      }

      contextSent = true;

      if (this._runtime.profiler) {
        this._runtime.profiler.profile = payload.profile;
      }

      this._runtime[payload.state].apply(this._runtime, payload.args);
      this._cleanup();
    });

    this._process.on('uncaughtException', onError);
    this._process.on('error', onError);

    this._process.on('exit', () => {
      if (!contextSent && !noPrematureFailCheck) {
        // hook to avoid msg sending delays...
        setTimeout(() => {
          if (!contextSent) {
            onError('Premature exit!');
          }
        }, 200);
      }
    });

    return this;
  }

  /**
   * @param {String} error
   * @private
   */
  _onError(error) {
    this._runtime.fail(new LambdaExecutionException(error));
    this._cleanup();
  }

  /**
   * @returns {Thread}
   * @private
   */
  _cleanup() {
    if (this._process) {
      try {
        this._process.kill();
      } catch (e) {
        // do nothing
      }
    }

    this._process = null;

    return this;
  }

  /**
   * @returns {ChildProcess}
   */
  get process() {
    return this._process;
  }

  /**
   * @returns {Runtime}
   */
  get runtime() {
    return this._runtime;
  }

  /**
   * @returns {String}
   */
  static get WRAPPER() {
    return Path.join(__dirname, 'thread_wrapper.js');
  }
}
