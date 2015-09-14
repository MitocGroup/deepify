/**
 * Created by AlexanderC on 6/19/15.
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

var _awsSdk = require('aws-sdk');

var _awsSdk2 = _interopRequireDefault(_awsSdk);

var _jsonfile = require('jsonfile');

var _jsonfile2 = _interopRequireDefault(_jsonfile);

var _proxyquire = require('proxyquire');

var _proxyquire2 = _interopRequireDefault(_proxyquire);

var _HelpersHash = require('../Helpers/Hash');

var _Thread = require('./Thread');

/**
 * Lambda runtime
 */

var Runtime = (function () {
  /**
   * @param {Object} lambda
   * @param {String} lambdaPath
   */

  function Runtime(lambda) {
    var lambdaPath = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];

    _classCallCheck(this, Runtime);

    this._lambda = lambda;

    this._succeed = this._logCallback('SUCCEED');
    this._fail = this._logCallback('FAILED');
    this._complete = function () {
      // do nothing
    };

    this._measureTime = false;
    this._silent = false;
    this._profiler = null;
    this._name = _HelpersHash.Hash.pseudoRandomId(this);
    this._lambdaPath = lambdaPath;
    this._awsConfigFile = null;
  }

  /**
   * @param {String} sourceFile
   * @param {String} awsConfigFile
   */

  _createClass(Runtime, [{
    key: 'runForked',

    /**
     * @param {Object} event
     * @param {Boolean|undefined} measureTime
     * @returns {Runtime}
     */
    value: function runForked(event) {
      var measureTime = arguments.length <= 1 || arguments[1] === undefined ? undefined : arguments[1];

      new _Thread.Thread(this).run(event, measureTime);

      return this;
    }

    /**
     * @param {Object} event
     * @param {Boolean|undefined} measureTime
     * @returns {Runtime}
     */
  }, {
    key: 'run',
    value: function run(event) {
      var measureTime = arguments.length <= 1 || arguments[1] === undefined ? undefined : arguments[1];

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
  }, {
    key: '_logCallback',

    /**
     * @param {String} type
     * @returns {Function}
     */
    value: function _logCallback(type) {
      return (function (result) {
        this._log('--------------------');
        this._log('[' + type + ']: ', result);
        this._log('--------------------');
      }).bind(this);
    }

    /**
     * @private
     */
  }, {
    key: '_log',
    value: function _log() {
      if (!this._silent) {
        console.log.apply(console, arguments);
      }
    }
  }, {
    key: 'awsConfigFile',

    /**
     * @param {String} path
     */
    set: function set(path) {
      this._awsConfigFile = path;
    },

    /**
     * @returns {String}
     */
    get: function get() {
      return this._awsConfigFile;
    }

    /**
     * @returns {String}
     */
  }, {
    key: 'lambdaPath',
    get: function get() {
      return this._lambdaPath;
    }

    /**
     * @returns {String}
     */
  }, {
    key: 'name',
    get: function get() {
      return this._name;
    },

    /**
     * @param {String} name
     */
    set: function set(name) {
      this._name = name;
    }

    /**
     * @returns {AbstractProfiler}
     */
  }, {
    key: 'profiler',
    get: function get() {
      return this._profiler;
    },

    /**
     * @param {AbstractProfiler} profiler
     */
    set: function set(profiler) {
      this._profiler = profiler;
    }

    /**
     * @returns {Boolean}
     */
  }, {
    key: 'silent',
    get: function get() {
      return this._silent;
    },

    /**
     * @param {Boolean} state
     */
    set: function set(state) {
      this._silent = state;
    }
  }, {
    key: 'measureTime',
    get: function get() {
      return this._measureTime;
    },

    /**
     * @param {Boolean} state
     */
    set: function set(state) {
      this._measureTime = state;
    }

    /**
     * @returns {Function}
     */
  }, {
    key: 'complete',
    get: function get() {
      return this._complete;
    },

    /**
     * @param {Function} callback
     */
    set: function set(callback) {
      this._complete = callback;
    }

    /**
     * @returns {Function}
     */
  }, {
    key: 'succeed',
    get: function get() {
      return this._succeed;
    },

    /**
     * @param {Function} callback
     */
    set: function set(callback) {
      this._succeed = callback;
    }

    /**
     * @returns {Function}
     */
  }, {
    key: 'fail',
    get: function get() {
      return this._fail;
    },

    /**
     * @param {Function} callback
     */
    set: function set(callback) {
      this._fail = callback;
    }

    /**
     * @returns {Object}
     */
  }, {
    key: 'lambda',
    get: function get() {
      return this._lambda;
    }

    /**
     * @returns {Object}
     */
  }, {
    key: 'context',
    get: function get() {
      return {
        clientContext: {
          EnvironmentName: Runtime.ENVIRONMENT
        },
        succeed: (function (result) {
          this._profiler && this._profiler.stop();

          this._succeed(result);
          this._complete(null, result);

          if (this._measureTime) {
            console.timeEnd(this._name);
          }
        }).bind(this),
        fail: (function (error) {
          this._profiler && this._profiler.stop();

          this._fail(error);
          this._complete(error, null);

          if (this._measureTime) {
            console.timeEnd(this._name);
          }
        }).bind(this)
      };
    }

    /**
     * @returns {String}
     */
  }], [{
    key: 'createLambda',
    value: function createLambda(sourceFile) {
      var awsConfigFile = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];

      if (awsConfigFile) {
        var awsConfig = _jsonfile2['default'].readFileSync(awsConfigFile);

        _awsSdk2['default'].config.update(awsConfig);
      } else {
        global.__DEEP_DEV_SERVER = true; // @todo: do we need this here?
      }

      Object.defineProperty(_awsSdk2['default'], '@global', {
        value: true,
        writable: false
      });

      sourceFile = _path2['default'].normalize(sourceFile);

      var lambda = (0, _proxyquire2['default'])(sourceFile, {
        'aws-sdk': _awsSdk2['default']
      });

      var runtime = new Runtime(lambda, sourceFile);
      runtime.awsConfigFile = awsConfigFile;

      return runtime;
    }
  }, {
    key: 'ENVIRONMENT',
    get: function get() {
      return 'local';
    }
  }]);

  return Runtime;
})();

exports.Runtime = Runtime;