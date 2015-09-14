/**
 * Created by AlexanderC on 8/18/15.
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x3, _x4, _x5) { var _again = true; _function: while (_again) { var object = _x3, property = _x4, receiver = _x5; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x3 = parent; _x4 = property; _x5 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _Profiler2 = require('./Profiler');

var StaticDumpFileProfiler = (function (_Profiler) {
  _inherits(StaticDumpFileProfiler, _Profiler);

  /**
   * @param {String} name
   * @param {String} staticDumpFile
   */

  function StaticDumpFileProfiler() {
    var name = arguments.length <= 0 || arguments[0] === undefined ? null : arguments[0];
    var staticDumpFile = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];

    _classCallCheck(this, StaticDumpFileProfiler);

    _get(Object.getPrototypeOf(StaticDumpFileProfiler.prototype), 'constructor', this).call(this, name);

    this._staticDumpFile = staticDumpFile;
  }

  /**
   * @param {String} path
   */

  _createClass(StaticDumpFileProfiler, [{
    key: 'staticDumpFile',
    set: function set(path) {
      this._staticDumpFile = path;
    },

    /**
     * @returns {String}
     */
    get: function get() {
      return this._staticDumpFile;
    }

    /**
     * @returns {String}
     */
  }, {
    key: 'dumpFile',
    get: function get() {
      return this._staticDumpFile;
    }
  }]);

  return StaticDumpFileProfiler;
})(_Profiler2.Profiler);

exports.StaticDumpFileProfiler = StaticDumpFileProfiler;