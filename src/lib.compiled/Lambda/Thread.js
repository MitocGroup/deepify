/**
 * Created by AlexanderC on 8/18/15.
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _child_process = require('child_process');

var _child_process2 = _interopRequireDefault(_child_process);

var _ExceptionLambdaExecutionException = require('./Exception/LambdaExecutionException');

var _PropertyLambda = require('../Property/Lambda');

var Thread = (function () {
  /**
   * @param {Runtime} runtime
   */

  function Thread(runtime) {
    _classCallCheck(this, Thread);

    this._runtime = runtime;
    this._process = null;
  }

  /**
   * @param {Object} event
   * @param {Boolean} measureTime
   * @returns {Thread}
   */

  _createClass(Thread, [{
    key: 'run',
    value: function run(event, measureTime) {
      var _this = this;

      this._process = _child_process2['default'].fork(Thread.WRAPPER, [JSON.stringify(this._runtime), JSON.stringify(event), measureTime], {
        cwd: _path2['default'].dirname(this._runtime.lambdaPath),
        silent: true
      });

      // @todo: replace with fork opts
      this._process.stdout.pipe(process.stdout);
      this._process.stderr.pipe(process.stderr);

      var contextSent = false;
      var noPrematureFailCheck = false;

      var onError = function onError(error) {
        if (contextSent) {
          console.error('Sending context twice from Lambda (error thrown: ' + error + ')');
          return;
        }

        contextSent = true;

        _this._runtime.fail(new _ExceptionLambdaExecutionException.LambdaExecutionException(error));
        _this._cleanup();
      };

      // Kills lambda if execution time exceeded
      setTimeout(function () {
        if (contextSent) {
          return;
        }

        noPrematureFailCheck = true;

        onError('The Lambda timeout of ' + _PropertyLambda.Lambda.DEFAULT_TIMEOUT + ' seconds exceeded!');
      }, parseInt(_PropertyLambda.Lambda.DEFAULT_TIMEOUT) * 1000);

      this._process.on('message', function (payload) {
        if (contextSent) {
          console.error('Sending context twice from Lambda (payload: ' + payload + ')');
          return;
        }

        contextSent = true;

        if (_this._runtime.profiler) {
          _this._runtime.profiler.profile = payload.profile;
        }

        _this._runtime[payload.state].apply(_this._runtime, payload.args);
        _this._cleanup();
      });

      this._process.on('uncaughtException', onError);
      this._process.on('error', onError);

      this._process.on('exit', function () {
        if (!contextSent && !noPrematureFailCheck) {
          onError('Premature exit!');
        }
      });

      return this;
    }

    /**
     * @param {String} error
     * @private
     */
  }, {
    key: '_onError',
    value: function _onError(error) {
      this._runtime.fail(new _ExceptionLambdaExecutionException.LambdaExecutionException(error));
      this._cleanup();
    }

    /**
     * @returns {Thread}
     * @private
     */
  }, {
    key: '_cleanup',
    value: function _cleanup() {
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
  }, {
    key: 'process',
    get: function get() {
      return this._process;
    }

    /**
     * @returns {Runtime}
     */
  }, {
    key: 'runtime',
    get: function get() {
      return this._runtime;
    }

    /**
     * @returns {String}
     */
  }], [{
    key: 'WRAPPER',
    get: function get() {
      return _path2['default'].join(__dirname, 'thread_wrapper.js');
    }
  }]);

  return Thread;
})();

exports.Thread = Thread;