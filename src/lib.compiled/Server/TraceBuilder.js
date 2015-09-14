/**
 * Created by AlexanderC on 8/17/15.
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

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var TraceBuilder = (function () {
  /**
   * @param {String} traceFile
   */

  function TraceBuilder(traceFile) {
    _classCallCheck(this, TraceBuilder);

    this._traceFile = traceFile;
  }

  /**
   * @returns {String}
   */

  _createClass(TraceBuilder, [{
    key: 'compile',

    /**
     * @param {Function} callback
     * @param {Boolean} cache
     * @returns {TraceBuilder}
     */
    value: function compile(callback) {
      var cache = arguments.length <= 1 || arguments[1] === undefined ? true : arguments[1];

      var cacheFile = '' + this._traceFile + TraceBuilder.CACHE_EXTENSION;

      if (!cache) {
        this._compile(cacheFile, callback);
        return this;
      }

      _fs2['default'].exists(cacheFile, (function (exists) {
        if (exists) {
          this._readFile(cacheFile, callback);
          return;
        }

        this._compile(cacheFile, callback);
      }).bind(this));

      return this;
    }

    /**
     * @param {String} filePath
     * @param {Function} callback
     * @private
     */
  }, {
    key: '_readFile',
    value: function _readFile(filePath, callback) {
      _fs2['default'].readFile(filePath, 'binary', callback);
    }

    /**
     * @param {String} outputFile
     * @param {Function} callback
     * @private
     */
  }, {
    key: '_compile',
    value: function _compile(outputFile, callback) {
      (0, _child_process.exec)(TraceBuilder.COMPILER + ' ' + this._traceFile + ' --config=full --output=' + outputFile, (function (error, stdout, stderr) {
        if (error) {
          callback('Error while compiling profile: ' + stderr, null);
          return;
        }

        this._readFile(outputFile, callback);
      }).bind(this));
    }

    /**
     * @returns {String}
     */
  }, {
    key: 'traceFile',
    get: function get() {
      return this._traceFile;
    }
  }], [{
    key: 'CACHE_EXTENSION',
    get: function get() {
      return '.html.cache';
    }

    /**
     * @returns {String}
     */
  }, {
    key: 'COMPILER',
    get: function get() {
      return _path2['default'].join(__dirname, '../../tools/google_trace_viewer/tracing/trace2html');
    }
  }]);

  return TraceBuilder;
})();

exports.TraceBuilder = TraceBuilder;