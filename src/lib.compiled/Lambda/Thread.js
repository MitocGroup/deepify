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
      this._process = _child_process2['default'].fork(Thread.WRAPPER, [JSON.stringify(this._runtime), JSON.stringify(event), measureTime], {
        cwd: _path2['default'].dirname(this._runtime.lambdaPath),
        silent: true
      });

      // @todo: replace with fork opts
      this._process.stdout.pipe(process.stdout);
      this._process.stderr.pipe(process.stderr);

      var contextSent = false;
      var noPrematureFailCheck = false;

      // Kills lambda if execution time exceeded
      setTimeout((function () {
        if (contextSent) {
          return;
        }

        noPrematureFailCheck = true;

        this._runtime.fail(new _ExceptionLambdaExecutionException.LambdaExecutionException('The Lambda timeout of ' + _PropertyLambda.Lambda.DEFAULT_TIMEOUT + 's exceeded!'));

        this._cleanup();
      }).bind(this), parseInt(_PropertyLambda.Lambda.DEFAULT_TIMEOUT) * 1000);

      this._process.on('message', (function (payload) {
        contextSent = true;

        if (this._runtime.profiler) {
          this._runtime.profiler.profile = payload.profile;
        }

        this._runtime[payload.state].apply(this._runtime, payload.args);
        this._cleanup();
      }).bind(this));

      this._process.on('error', (function (error) {
        contextSent = true;

        this._runtime.fail(new _ExceptionLambdaExecutionException.LambdaExecutionException(error));
        this._cleanup();
      }).bind(this));

      this._process.on('exit', (function () {
        if (!contextSent && !noPrematureFailCheck) {
          contextSent = true;

          this._runtime.fail(new _ExceptionLambdaExecutionException.LambdaExecutionException('Premature exit!'));
          this._cleanup();
        }
      }).bind(this));

      return this;
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